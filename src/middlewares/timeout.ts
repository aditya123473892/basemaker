import { Request, Response, NextFunction } from 'express';

/**
 * Request timeout middleware
 * Prevents hung requests from exhausting server resources
 */
export function timeoutMiddleware(ms: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      console.error(`Request timeout: ${req.method} ${req.path}`);
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          error: 'Request timeout. The server took too long to respond.',
          retryAfter: 60,
        });
      }
    }, ms);

    // Clear timeout if response finishes
    res.on('finish', () => {
      clearTimeout(timer);
    });

    // Also clear on response close
    res.on('close', () => {
      clearTimeout(timer);
    });

    next();
  };
}

export default timeoutMiddleware;