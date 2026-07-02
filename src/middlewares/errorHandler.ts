import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  // Default status code
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong!';

  // Handle specific error types
  if (err.message.includes('cannot be deleted')) {
    statusCode = 400;
  } else if (err.message.includes('not found')) {
    statusCode = 404;
  } else if (err.message.includes('already exists')) {
    statusCode = 409;
  } else if (err.message.includes('not authorized') || err.message.includes('cannot remove your own')) {
    statusCode = 403;
  } else if (err.message.includes('Invalid') || err.message.includes('required')) {
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler;