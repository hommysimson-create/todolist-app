'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/authenticate');
const userController = require('../controllers/userController');

const router = Router();

router.get('/me', authenticate, userController.getMe);
router.patch('/me', authenticate, userController.updateMe);
router.delete('/me', authenticate, userController.deleteMe);

module.exports = router;
