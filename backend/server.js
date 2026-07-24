const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to Database
connectDB();

const app = express();

// Security HTTP Headers
// Adjust contentSecurityPolicy to allow external fontawesome and font loads
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "*"],
        connectSrc: ["'self'", "*"],
      },
    },
  })
);

// Enable CORS
app.use(cors());

// Body Parser (limits JSON size to prevent overflow)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Sanitize data against NoSQL query injection
app.use(mongoSanitize());

// General Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api/', generalLimiter);

// Serve uploads folder statically for local proof fallback
const os = require('os');
const uploadsStaticDir = process.env.VERCEL || process.env.NODE_ENV === 'production'
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsStaticDir));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Fallback to index.html for non-API client routes
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack || err.message);

  // Check for Multer error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size too large. Maximum size allowed is 5MB.',
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});

module.exports = app;
