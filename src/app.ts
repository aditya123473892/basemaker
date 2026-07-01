import type { Request, Response, NextFunction } from 'express';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { connectDB } = require('./config/database');

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
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  // Return actual error message for development
  res.status(500).json({
    success: false,
    error: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

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
