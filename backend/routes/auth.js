const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail, sendPasswordResetConfirmation, sendEmailOTP } = require('../services/emailService');
const { sendSMS, sendVerification, checkVerification } = require('../services/smsService');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_dev';

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phoneNumber, role, restaurantDetails } = req.body;
    console.log('Signup Attempt:', { name, email, phoneNumber, role, restaurantDetails }); // Log payload

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      if (!user.emailVerified && !user.phoneVerified) {
        console.log(`Signup failed: User ${email} exists but unverified`);
        return res.status(409).json({
          message: 'User already exists but is not verified.',
          unverified: true,
          user: {
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber
          }
        });
      }
      console.log(`Signup failed: User ${email} already exists`);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    user = new User({
      name,
      email,
      passwordHash,
      phoneNumber,
      role: role || 'customer',
      restaurantDetails: role === 'restaurant' ? restaurantDetails : undefined,
      emailVerified: false,
      phoneVerified: false,
      verificationToken
    });

    await user.save();

    // Send verification email (Fire-and-forget) - REMOVED per user request
    // sendVerificationEmail(email, name, verificationToken).catch(err => console.error('Background Email Error:', err));

    res.status(201).json({
      message: 'Registration successful! Please verify your account using OTP.',
      emailSent: false
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Login failed: User not found for email ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log(`Login failed: Invalid password for email ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check verification
    if (!user.emailVerified && !user.phoneVerified) {
      return res.status(403).json({
        message: 'Please verify your account to continue.',
        needsVerification: true,
        email: user.email,
        phoneNumber: user.phoneNumber
      });
    }

    const token = jwt.sign({ userId: user._id, role: user.role, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '1d' });

    const isApproved = user.role === 'restaurant' ? (user.restaurantDetails?.isApproved || false) : true;

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        profileImage: user.profileImage,
        isApproved
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// POST /api/auth/send-phone-otp
router.post('/send-phone-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Find user by phone number (try exact, or with/without +)
    let user = await User.findOne({ phoneNumber });
    if (!user) {
      const altPhone = phoneNumber.startsWith('+') ? phoneNumber.slice(1) : `+${phoneNumber}`;
      user = await User.findOne({ phoneNumber: altPhone });
    }

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Ensure phone number has + prefix for Twilio
    const twilioPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to user (expires in 10 mins)
    user.phoneOTP = otp;
    user.phoneOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Send SMS via Twilio (Fire-and-forget)
    sendSMS(twilioPhone, `Your FoodMandu AI verification code is: ${otp}`)
      .then(result => {
        if (result.mock) console.log('[MOCK SMS LOGGED IN BACKGROUND]');
      })
      .catch(err => console.error('Background SMS Error:', err));

    res.json({
      message: 'OTP sent successfully',
      mock: false // We don't know yet, but for UI speed we assume success
    });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ message: err.message || 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-phone-otp
router.post('/verify-phone-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    // Find user
    let user = await User.findOne({ phoneNumber });
    if (!user) {
      const altPhone = phoneNumber.startsWith('+') ? phoneNumber.slice(1) : `+${phoneNumber}`;
      user = await User.findOne({ phoneNumber: altPhone });
    }

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.phoneVerified) {
      return res.json({ message: 'Phone already verified', verified: true });
    }

    // Verify OTP
    if (!user.phoneOTP || user.phoneOTP !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.phoneOTPExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Verify Success
    user.phoneVerified = true;
    user.phoneOTP = undefined;
    user.phoneOTPExpires = undefined;
    await user.save();

    // Generate token for auto-login
    const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      message: 'Phone verified successfully',
      verified: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin }
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/auth/verify-email/:token - Verify email with token
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find user with this verification token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/auth/send-email-otp
router.post('/send-email-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.emailVerified) return res.status(400).json({ message: 'Email already verified' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailOTP = otp;
    user.emailOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    sendEmailOTP(email, user.name, otp).catch(err => console.error('Background Email OTP Error:', err));
    res.json({ message: 'OTP sent to email', mock: false });
  } catch (err) {
    console.error('Send email OTP error:', err);
    res.status(500).json({ message: err.message || 'Failed to send email OTP' });
  }
});

// POST /api/auth/verify-email-otp
router.post('/verify-email-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.emailVerified) return res.json({ message: 'Email already verified', verified: true });
    if (!user.emailOTP || user.emailOTP !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (user.emailOTPExpires < Date.now()) return res.status(400).json({ message: 'OTP expired' });
    user.emailVerified = true;
    user.emailOTP = undefined;
    user.emailOTPExpires = undefined;
    await user.save();
    const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ message: 'Email verified successfully', verified: true, token, user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
  } catch (err) {
    console.error('Verify email OTP error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/auth/resend-verification - Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();

    // Resend verification email (Fire-and-forget)
    sendVerificationEmail(user.email, user.name, verificationToken).catch(err => console.error('Background Email Error:', err));

    res.json({ message: 'Verification email sent! Please check your inbox.' });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/auth/reset-password/:token - Reset password with token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation email
    await sendPasswordResetConfirmation(user.email, user.name);

    res.json({ message: 'Password reset successful! You can now log in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;