import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect routes: verify JWT from HTTP-only cookie or Authorization header.
 */
export async function protect(req, res, next) {
  let token = null;

  // 1. Check HTTP-only cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Check Authorization: Bearer <token> header as fallback
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Please log in to access this resource.',
    });
  }

  const secret = process.env.JWT_SECRET || 'dev_secret_change_in_production_32char';
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.error('CRITICAL: JWT_SECRET is not configured in production environment.');
    return res.status(500).json({
      success: false,
      message: 'Server security configuration error.',
    });
  }

  try {
    const decoded = jwt.verify(token, secret);

    // Fetch user without password
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.',
    });
  }
}
