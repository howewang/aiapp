# Chat Server

Anonymous chat matching backend (Node.js + PostgreSQL + Redis + WebSocket).

## Quick Start

1. Ensure PostgreSQL and Redis are running (or use Docker).
2. Copy `.env.example` to `.env` and configure.
3. Run migrations: `npm run migrate`
4. Start API: `npm start`
5. (Optional) Start session cleaner: `npm run worker`

## Docker

```bash
docker-compose up -d
```

Then run migrations: `docker-compose exec api npm run migrate`

## API

- `POST /user/register` - phone, password, nickname?, avatar?
- `POST /user/login` - phone, password
- `GET /user/info` - (auth)
- `GET /personality/list`
- `GET /personality/session` - (auth)
- `POST /personality/use` - personality_type (auth)
- `POST /personality/unlock` - personality_type (auth)
- `POST /personality/rate` - target_user_id, personality_type, rating (auth)
- `POST /match/start` - (auth)
- `POST /match/cancel` - (auth)
- `GET /match/today` - (auth)
- `POST /match/record` - matched_user_id, user_personality, matched_personality, matched_nickname, matched_avatar, last_message? (auth)
- `GET /chat/history?sessionId=` - (auth)
- `POST /report` - target_user_id, session_id?, reason? (auth)

## WebSocket

- Path: `/chat`
- Query: `?token=<JWT>`
- Messages: `{ type: "chat", sessionId, text }`
