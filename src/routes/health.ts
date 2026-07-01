import type { Request, Response } from 'express';
import { pool } from '../config/database';

const express = require('express');
const router = express.Router();

// Test database connection
router.get('/test-db', async (req: Request, res: Response) => {
  try {
    const result = await pool.request().query('SELECT GETDATE() as currentTime, @@VERSION as sqlVersion');
    res.json({
      status: 'success',
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      data: {
        serverTime: result.recordset[0].currentTime,
        sqlVersion: result.recordset[0].sqlVersion.substring(0, 50) + '...'
      }
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    });
  }
});

// Health check
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Fleet Management API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;
