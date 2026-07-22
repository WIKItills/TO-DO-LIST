const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { register, login, getProfile, getTeachers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Auth rate limiter to protect against brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 login/register requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/profile', protect, getProfile);
router.get('/teachers', protect, getTeachers);

module.exports = router;
