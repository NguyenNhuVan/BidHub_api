const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// Route for user registration
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/logout',userController.logout);
router.post('/changePassword',userController.changePassword);
router.post('/forgotPassword', userController.resetPasswordController);
module.exports = router;
