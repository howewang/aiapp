const express = require('express');
const router = express.Router();
const userController = require('../modules/user/user.controller');
const { auth } = require('../middleware/auth');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/info', auth, userController.info);

module.exports = router;
