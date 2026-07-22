const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - Verify JWT Token
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey123456!');
      } catch (jwtError) {
        console.error('JWT verification error:', jwtError.message);
        return res.status(401).json({ success: false, message: 'Not authorized, token failed or expired' });
      }

      // Get user from the token (exclude password)
      try {
        req.user = await User.findById(decoded.id).select('-password');
      } catch (dbError) {
        console.error('Database connection error in auth middleware:', dbError.message);
        return res.status(500).json({ success: false, message: 'Database connection failed, please try again' });
      }

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found in system' });
      }

      next();
    } catch (error) {
      console.error('Unexpected auth middleware error:', error.message);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user profile missing' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
