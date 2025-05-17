import { Request, Response, NextFunction } from 'express';
import { authLogger } from '../utils/logger';

interface RateLimitRecord {
  count: number;
  firstRequest: number;
  lastRequest: number;
}

interface RateLimitStore {
  [key: string]: RateLimitRecord;
}

// In-memory store for rate limiting
// In a production environment, consider using Redis or another distributed store
const rateLimitStore: RateLimitStore = {};

/**
 * Cleanup function to remove old rate limit records
 * This prevents memory leaks in the in-memory store
 */
const cleanupRateLimitStore = () => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  
  Object.keys(rateLimitStore).forEach(key => {
    if (now - rateLimitStore[key].lastRequest > oneHour) {
      delete rateLimitStore[key];
    }
  });
};

// Run cleanup every hour
setInterval(cleanupRateLimitStore, 60 * 60 * 1000);

/**
 * Rate limiter middleware factory
 * @param maxRequests Maximum number of requests allowed in the time window
 * @param windowMs Time window in milliseconds
 * @param keyGenerator Function to generate a unique key for rate limiting (defaults to IP address)
 * @param message Custom error message
 * @returns Express middleware function
 */
export const createRateLimiter = (
  maxRequests: number,
  windowMs: number,
  keyGenerator: (req: Request) => string = (req) => req.ip || 'unknown',
  message: string = 'Too many requests, please try again later'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    // Initialize rate limit record if it doesn't exist
    if (!rateLimitStore[key]) {
      rateLimitStore[key] = {
        count: 0,
        firstRequest: now,
        lastRequest: now
      };
    }
    
    const record = rateLimitStore[key];
    const windowStart = now - windowMs;
    
    // Reset count if outside the time window
    if (record.firstRequest < windowStart) {
      record.count = 0;
      record.firstRequest = now;
    }
    
    // Update record
    record.count += 1;
    record.lastRequest = now;
    
    // Check if rate limit is exceeded
    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.firstRequest + windowMs - now) / 1000);
      
      authLogger.warn('Rate limit exceeded', {
        ip: req.ip || 'unknown',
        path: req.path,
        method: req.method,
        count: record.count,
        limit: maxRequests,
        retryAfter
      });
      
      return res.status(429).json({
        message,
        retryAfter
      });
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - record.count).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil((record.firstRequest + windowMs) / 1000).toString());
    
    next();
  };
};

/**
 * Predefined rate limiters for common scenarios
 */
export const rateLimiters = {
  // Strict rate limiter for sensitive operations like password reset (5 requests per hour)
  passwordReset: createRateLimiter(
    5,
    60 * 60 * 1000,
    (req) => `password-reset:${req.ip}:${req.body.email || 'unknown'}`,
    'Too many password reset attempts. Please try again later.'
  ),
  
  // Moderate rate limiter for authentication (10 requests per 15 minutes)
  auth: createRateLimiter(
    10,
    15 * 60 * 1000,
    (req) => `auth:${req.ip}`,
    'Too many authentication attempts. Please try again later.'
  ),
  
  // General API rate limiter (100 requests per minute)
  api: createRateLimiter(
    100,
    60 * 1000,
    (req) => `api:${req.ip}`,
    'Rate limit exceeded. Please slow down your requests.'
  )
};
