import morgan from 'morgan';
import type { NextApiRequest, NextApiResponse, NextApiHandler } from "next";

// Create a custom morgan middleware for Next.js API routes
export const morganMiddleware = (req: NextApiRequest,
  res: NextApiResponse,
  next: () => void) => {
  // Skip logging for static files and Next.js internals
  if (req.url?.startsWith('/_next') || req.url?.startsWith('/favicon')) {
    return next();
  }

  // Custom format for development
  const format = process.env.NODE_ENV === 'production'
    ? 'combined'
    : ':method :url :status :res[content-length] - :response-time ms';

  return morgan(format)(req, res, next);
};

// For API routes
export const withMorganLogging = (handler: NextApiHandler): NextApiHandler => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Log the request
    morganMiddleware(req, res, () => { });

    // Execute the original handler
    return handler(req, res);
  };
};