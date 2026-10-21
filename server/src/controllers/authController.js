import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Generate a JWT signed with server secret.
 */
function generateToken(userId) {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_in_production_32char';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: userId }, secret, { expiresIn });
}

/**
 * Helper to set HTTP-only cookie with proper security settings.
 */
function sendTokenCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
  });
}

/**
 * Helper to clear HTTP-only cookie on logout.
 */
function clearTokenCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
}

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
export async function register(req, res, next) {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validate inputs
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide your full name' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Please provide a password' });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    // Create user (password is automatically hashed in User pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    // Generate token and set HTTP-only cookie
    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      user: user.toSafeObject(),
      token,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query user and explicitly select password field
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // Generic invalid credentials message to prevent account enumeration
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token and set HTTP-only cookie
    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: user.toSafeObject(),
      token,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private (requires protect middleware)
 */
export async function getMe(req, res) {
  // req.user was attached by protect middleware
  const safeUser = req.user.toSafeObject ? req.user.toSafeObject() : req.user;
  return res.status(200).json({
    success: true,
    user: safeUser,
  });
}

/**
 * @route   POST /api/auth/logout
 * @desc    Clear auth cookie & end session
 * @access  Public / Private
 */
export async function logout(_req, res) {
  clearTokenCookie(res);

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please discard any stored bearer tokens on the client.',
  });
}
