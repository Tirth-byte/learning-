/**
 * ----------------------------------------------------------------------------------
 * AUTHENTICATION ROUTER
 * 
 * WHAT THIS FILE DOES:
 * This file maps the incoming API web urls for user registration, login, profile queries,
 * and password updates to the corresponding code blocks in AuthController.
 * 
 * HOW IT FITS INTO THE APP:
 * When users submit forms on Login, Register, or Profile pages on the storefront,
 * their browsers send web requests to these routes.
 * ----------------------------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public Guest Routes: Accessible by anyone to sign up or recover lost passwords
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);

// Secured Customer & Admin Routes: Requires active session token credentials
router.get('/me', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);
router.put('/password', authMiddleware, authController.updatePassword);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
