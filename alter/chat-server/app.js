const http = require('http');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const userRoutes = require('./routes/user.routes');
const personalityRoutes = require('./routes/personality.routes');
const matchRoutes = require('./routes/match.routes');
const chatRoutes = require('./routes/chat.routes');
const reportRoutes = require('./routes/report.routes');
const config = require('./config/config');
const { setupChatGateway } = require('./modules/chat/chat.gateway');
const { accessLogMiddleware } = require('./middleware/accessLog');
const { logError, logger } = require('./utils/logger');

const app = express();
app.use(cors());
app.use(express.json());
app.use(accessLogMiddleware);
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { code: 429, msg: 'Too many requests', data: null },
}));

app.use('/user', userRoutes);
app.use('/personality', personalityRoutes);
app.use('/match', matchRoutes);
app.use('/chat', chatRoutes);
app.use('/report', reportRoutes);

app.get('/health', (req, res) => {
  res.json({ code: 0, msg: 'ok', data: { status: 'running' } });
});

app.use((err, req, res, next) => {
  logError({ module: 'app', message: err?.message || 'Unknown error', stack: err?.stack, userId: req?.userId, requestId: req?.requestId });
  res.status(500).json({ code: 500, msg: 'Internal server error', data: null });
});

const server = http.createServer(app);
setupChatGateway(server, app);

server.listen(config.port, () => {
  logger.info({ msg: `API server listening on port ${config.port}` });
});
