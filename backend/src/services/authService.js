/**
 * ----------------------------------------------------------------------------------
 * USER AUTHENTICATION SERVICE
 * 
 * WHAT THIS FILE DOES:
 * This file contains business logic for user accounts. It validates input details
 * when users register, matches passwords securely using bcrypt, generates session JSON
 * Web Tokens (JWT) for logged-in sessions, and saves edited profiles.
 * 
 * HOW IT FITS INTO THE APP:
 * The AuthController calls these service methods to execute secure database lookups,
 * cryptography checks, and register edits.
 * ----------------------------------------------------------------------------------
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

// ----------------------------------------------------------------------------------
// CONFIGURATION CONSTANTS
// Change these constants below to adjust password requirements. Token secret and
// lifespan live in config/env.js so they are defined in a single place.
// ----------------------------------------------------------------------------------

// CHANGE THIS TO ADJUST THE CRYPTOGRAPHIC SALT STRENGTH FOR PASSWORD HASHING
const BCRYPT_SALT_ROUNDS = 10;

// CHANGE THIS TO ADJUST THE MINIMUM CHARACTER LENGTH ALLOWED FOR PASSWORD KEYS
const MIN_PASSWORD_LENGTH = 6;

// CHANGE THIS TO ADJUST THE MAXIMUM CHARACTER LENGTH ALLOWED FOR PASSWORD KEYS
const MAX_PASSWORD_LENGTH = 12;


class AuthService {

  /**
   * Register a new user profile inside the database after validating fields.
   * 
   * Input:
   *   - data: Object containing user registration inputs (email, passwords, name, phone, address).
   * Output:
   *   - Returns an object containing the new user details and active session token.
   */
  async register({ email, password, confirmPassword, name, role, phone, address, companyName, gstNo, isOtpSignup, otpIdentifier }) {
    
    // Step 1: Validate required fields are filled out
    if (!email || !password || !confirmPassword || !name) {
      throw { statusCode: 400, message: 'Required fields: email, password, confirmPassword, name' };
    }

    // Step 2: Confirm password confirmation matches
    if (password !== confirmPassword) {
      throw { statusCode: 400, message: 'Passwords do not match' };
    }

    // Step 3: Validate email format using regex test
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw { statusCode: 400, message: 'Invalid email format' };
    }

    // Step 4: Validate password character length range
    if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
      throw { statusCode: 400, message: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters` };
    }

    // Step 5: Validate uppercase, lowercase, and special characters are present
    const hasUpperCaseLetter = /[A-Z]/.test(password);
    const hasLowerCaseLetter = /[a-z]/.test(password);
    const hasSpecialCharacter = /[@$&_]/.test(password);

    if (!hasUpperCaseLetter || !hasLowerCaseLetter || !hasSpecialCharacter) {
      throw {
        statusCode: 400,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one special character (@, $, &, _)',
      };
    }

    // Step 5.5: Verify OTP for registration if signed up via OTP path
    if (isOtpSignup && otpIdentifier) {
      const verifiedOtp = await prisma.otp.findFirst({
        where: {
          identifier: otpIdentifier,
          verified: true,
          createdAt: { gt: new Date(Date.now() - 15 * 60 * 1000) } // 15 mins
        },
        orderBy: { createdAt: 'desc' }
      });
      if (!verifiedOtp) {
        throw { statusCode: 400, message: 'OTP verification is required' };
      }
      // Clean up used OTP
      await prisma.otp.delete({ where: { id: verifiedOtp.id } }).catch(() => {});
    }

    // Step 6: Verify the email address does not already exist in database
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw { statusCode: 400, message: 'Email is already registered' };
    }

    // If phone is provided, make sure it is not already registered
    if (phone) {
      const existingPhoneUser = await prisma.user.findUnique({ where: { phone } });
      if (existingPhoneUser) {
        throw { statusCode: 400, message: 'Phone number is already registered' };
      }
    }

    // Step 7: Encrypt/Hash the password securely
    const hashedSecretKey = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Step 8: Save the profile record to the database
    const createdUserProfile = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedSecretKey,
        name,
        role: role || 'CUSTOMER',
        phone,
        address,
        companyName,
        gstNo,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        companyName: true,
        gstNo: true,
        createdAt: true,
      },
    });

    // Step 9: Generate a fresh signing token for client auto-login
    const generatedSessionToken = this.generateToken(createdUserProfile);

    return { user: createdUserProfile, token: generatedSessionToken };
  }

  /**
   * Log in an existing user with email and password checks.
   * 
   * Input:
   *   - email: The username email
   *   - password: The secret password key
   * Output:
   *   - Object containing authenticated user data and session token.
   */
  async login(email, password) {
    if (!email || !password) {
      throw { statusCode: 400, message: 'Email and password are required' };
    }

    // Find user record by email
    const userRecord = await prisma.user.findUnique({ where: { email } });
    if (!userRecord) {
      throw { statusCode: 401, message: 'Invalid User ID or Password' };
    }

    // Verify cryptographic hash match
    const isPasswordMatch = await bcrypt.compare(password, userRecord.passwordHash);
    if (!isPasswordMatch) {
      throw { statusCode: 401, message: 'Invalid User ID or Password' };
    }

    const sessionToken = this.generateToken(userRecord);

    const userProfileResponse = {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRecord.role,
      phone: userRecord.phone,
      address: userRecord.address,
      companyName: userRecord.companyName,
      gstNo: userRecord.gstNo,
    };

    return { user: userProfileResponse, token: sessionToken };
  }

  /**
   * Reset mock trigger for forgotten passwords.
   * 
   * Input:
   *   - email: User's contact email.
   * Output:
   *   - Returns message indicating status.
   */
  async forgotPassword(email) {
    if (!email) {
      throw { statusCode: 400, message: 'Email is required' };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success statement anyway to prevent user listing exploits
      return { message: 'reset link sent' };
    }

    return { message: 'reset link sent' };
  }

  /**
   * Generate an signed JWT session token with encrypted properties.
   * 
   * Input:
   *   - user: User account entity.
   * Output:
   *   - Signed secure string.
   */
  generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  /**
   * Retrieve profile data.
   * 
   * Input:
   *   - userId: Database ID of the user.
   * Output:
   *   - User model attributes.
   */
  async getProfile(userId) {
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        companyName: true,
        gstNo: true,
        createdAt: true,
      }
    });
    
    if (!userRecord) {
      throw { statusCode: 404, message: 'User not found' };
    }
    
    return userRecord;
  }

  /**
   * Write updated fields to the user profile table.
   * 
   * Input:
   *   - userId: User ID.
   *   - updatePayload: New values to save.
   * Output:
   *   - The updated user database object.
   */
  async updateProfile(userId, { name, phone, address, companyName, gstNo }) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone,
        address,
        companyName,
        gstNo,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        companyName: true,
        gstNo: true,
      }
    });
  }

  /**
   * Change user password securely.
   * 
   * Input:
   *   - userId: Logged-in user ID
   *   - passwordPayload: Object containing currentPassword and newPassword
   * Output:
   *   - Success confirmation object.
   */
  async updatePassword(userId, { currentPassword, newPassword }) {
    if (!currentPassword || !newPassword) {
      throw { statusCode: 400, message: 'Current password and new password are required' };
    }

    const userRecord = await prisma.user.findUnique({ where: { id: userId } });
    if (!userRecord) {
      throw { statusCode: 404, message: 'User not found' };
    }

    // Verify existing password matches before changing
    const isCurrentMatch = await bcrypt.compare(currentPassword, userRecord.passwordHash);
    if (!isCurrentMatch) {
      throw { statusCode: 400, message: 'Current password does not match' };
    }

    // Check new password length requirements
    if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
      throw { statusCode: 400, message: `New password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters` };
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasSpecial = /[@$&_]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasSpecial) {
      throw {
        statusCode: 400,
        message: 'New password must contain at least one uppercase letter, one lowercase letter, and one special character (@, $, &, _)',
      };
    }

    // Hash the new password securely
    const hashedSecretKey = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedSecretKey }
    });
    
    return { success: true };
  }

  /**
   * Generate and store a 6-digit verification code.
   * 
   * Input:
   *   - identifier: Email or Phone number.
   * Output:
   *   - Confirmation message, and code in non-prod environments.
   */
  async sendOtp(identifier) {
    if (!identifier) {
      throw { statusCode: 400, message: 'Email or phone number is required' };
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isPhone = /^\+?\d{10,15}$/.test(identifier);

    if (!isEmail && !isPhone) {
      throw { statusCode: 400, message: 'Please provide a valid email address or phone number' };
    }

    // Rate-limit check: check if there's a code created in the last 30s
    const lastOtp = await prisma.otp.findFirst({
      where: { identifier },
      orderBy: { createdAt: 'desc' }
    });
    if (lastOtp && (new Date() - new Date(lastOtp.createdAt)) < 30 * 1000) {
      throw { statusCode: 429, message: 'Please wait 30 seconds before requesting a new OTP' };
    }

    // Clean up older OTPs for this identifier
    await prisma.otp.deleteMany({
      where: { identifier }
    });

    // Generate a 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.otp.create({
      data: {
        identifier,
        code: otpCode,
        expiresAt
      }
    });

    // Console logging
    console.log(`[OTP SERVICE] Generated OTP for ${identifier}: ${otpCode}`);

    // TODO: Integrate real SMS/Email delivery provider here
    // Example SMS: smsGateway.send(identifier, `Your Odoo Rent OTP is ${otpCode}`);
    // Example Email: emailGateway.send(identifier, 'Your Verification Code', `Your OTP is ${otpCode}`);

    return {
      success: true,
      message: 'OTP sent successfully',
      ...(process.env.NODE_ENV !== 'production' ? { code: otpCode } : {})
    };
  }

  /**
   * Verify the 6-digit code matches and is not expired.
   * 
   * Input:
   *   - identifier: Email or Phone.
   *   - code: 6-digit code.
   * Output:
   *   - Login token details or verified flag details.
   */
  async verifyOtp(identifier, code) {
    if (!identifier || !code) {
      throw { statusCode: 400, message: 'Identifier and OTP code are required' };
    }

    // Find valid, unexpired and unverified OTP
    const otpRecord = await prisma.otp.findFirst({
      where: {
        identifier,
        code,
        expiresAt: { gt: new Date() },
        verified: false
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      throw { statusCode: 400, message: 'Invalid or expired OTP code' };
    }

    // Mark as verified
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { verified: true }
    });

    // Check if user already exists
    const userRecord = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    });

    if (userRecord) {
      // User exists -> Log them in immediately and return token
      const sessionToken = this.generateToken(userRecord);
      const userProfileResponse = {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        role: userRecord.role,
        phone: userRecord.phone,
        address: userRecord.address,
        companyName: userRecord.companyName,
        gstNo: userRecord.gstNo,
      };

      return {
        success: true,
        action: 'login',
        token: sessionToken,
        user: userProfileResponse
      };
    } else {
      // User does not exist -> Mark as successful verification for signup
      return {
        success: true,
        action: 'signup_verified',
        identifier
      };
    }
  }
}

module.exports = new AuthService();
