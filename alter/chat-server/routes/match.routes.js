const express = require('express');
const router = express.Router();
const matchController = require('../modules/match/match.controller');
const { auth } = require('../middleware/auth');

router.post('/start', auth, matchController.start);
router.post('/cancel', auth, matchController.cancel);
router.get('/today', auth, matchController.today);
router.post('/record', auth, matchController.record);

module.exports = router;
