import type { Request, Response, NextFunction } from 'express';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');
import { errorHandler } from './middlewares/errorHandler';
import { timeoutMiddleware } from './middlewares/timeout';

// Rate limiting middleware for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { success: false, error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// API rate limiter for general endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

// Import routes
const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const driversRouter = require('./routes/drivers');
const tripsRouter = require('./routes/trips');
const securityRouter = require('./routes/security');
const navigationRouter = require('./routes/navigation');
const sessionRouter = require('./routes/session');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Allow frontend origins
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply request timeout middleware (30 seconds default)
app.use(timeoutMiddleware(30000));

// Apply rate limiting - auth endpoints get stricter limits
app.use('/auth/login', authLimiter);
app.use('/auth/signup', authLimiter);

// Apply general API rate limiting
app.use('/api', apiLimiter);

// Mount routes
app.use('/', healthRouter);
app.use('/api', healthRouter);
app.use('/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/security', securityRouter);
app.use('/api/navigation', navigationRouter);
app.use('/api/session', sessionRouter);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

// Connect to database and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

export default app;
