const express = require('express');
const router = express.Router();
const personalityController = require('../modules/personality/personality.controller');
const { auth } = require('../middleware/auth');

router.get('/list', personalityController.list);
router.get('/session', auth, personalityController.checkSession);
router.post('/use', auth, personalityController.use);
router.post('/unlock', auth, personalityController.unlock);
router.post('/rate', auth, personalityController.rate);

module.exports = router;
