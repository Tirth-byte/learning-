/**
 * ----------------------------------------------------------------------------------
 * AUTHENTICATION CONTROLLER
 * 
 * WHAT THIS FILE DOES:
 * This file handles HTTP requests related to user accounts and profiles. It reads
 * parameter data from client requests (like emails, passwords, names), passes them to
 * the auth service for database processing, and returns JSON responses back to the browser.
 * 
 * HOW IT FITS INTO THE APP:
 * When users hit sign-in buttons or update their profile settings, the express router
 * triggers these controller actions.
 * ----------------------------------------------------------------------------------
 */

const authService = require('../services/authService');

class AuthController {

  async registerStart(req, res, next) {
    try {
      const result = await authService.registerStart(req.body);
      return res.status(200).json({
        success: true,
        message: result.message,
        code: result.code
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register a new user account.
   * 
   * Input:
   *   - req.body: Object containing email, password, name, and address.
   * Output:
   *   - Returns HTTP 201 status code with a JSON block containing the new user session token.
   */
  async register(req, res, next) {
    try {
      const registrationResult = await authService.register(req.body);
      
      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: registrationResult,
      });
    } catch (error) {
      // Forward the error to Express global handler (like duplicate email validations)
      next(error);
    }
  }

  /**
   * Log in an existing user.
   * 
   * Input:
   *   - req.body.email: User credentials username
   *   - req.body.password: User credentials secret key
   * Output:
   *   - Returns HTTP 200 status code with a JSON session token on success.
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const loginResult = await authService.login(email, password);
      
      return res.status(200).json({
        success: true,
        message: loginResult.requireOtp ? 'OTP required' : 'Login successful',
        data: loginResult,
      });
    } catch (error) {
      // Forward credential match failures to client
      next(error);
    }
  }

  async loginVerify(req, res, next) {
    try {
      const { email, code } = req.body;
      const result = await authService.loginVerify(email, code);
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Trigger password recovery actions.
   * 
   * Input:
   *   - req.body.email: Account recovery email address.
   * Output:
   *   - Returns HTTP 200 indicating if recovery mail mock is queued.
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const recoveryResult = await authService.forgotPassword(email);
      
      return res.status(200).json({
        success: true,
        message: recoveryResult.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Query the profile data of the currently logged-in user.
   * 
   * Input:
   *   - req.user.id: Authenticated user ID injected by the token verification middleware.
   * Output:
   *   - Returns HTTP 200 with name, role, address, and contact details.
   */
  async getProfile(req, res, next) {
    try {
      const profileResult = await authService.getProfile(req.user.id);
      
      return res.status(200).json({
        success: true,
        data: profileResult,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update the contact profile details of the active user.
   * 
   * Input:
   *   - req.user.id: Logged-in user ID
   *   - req.body: Object containing new phone numbers, address, or business GST strings.
   * Output:
   *   - Returns HTTP 200 with the freshly saved profile data block.
   */
  async updateProfile(req, res, next) {
    try {
      const updateResult = await authService.updateProfile(req.user.id, req.body);
      
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updateResult,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset user password with validation.
   * 
   * Input:
   *   - req.user.id: Logged-in user ID
   *   - req.body.currentPassword: Valid password currently on file
   *   - req.body.newPassword: Password user wants to write
   * Output:
   *   - Returns HTTP 200 indicating success.
   */
  async updatePassword(req, res, next) {
    try {
      await authService.updatePassword(req.user.id, req.body);
      
      return res.status(200).json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async sendOtp(req, res, next) {
    try {
      const { identifier } = req.body;
      const result = await authService.sendOtp(identifier);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(req, res, next) {
    try {
      const { identifier, code } = req.body;
      const result = await authService.verifyOtp(identifier, code);
      return res.status(200).json({
        success: true,
        message: result.action === 'login' ? 'Login successful' : 'Verification successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        await authService.logout(token);
      }
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
