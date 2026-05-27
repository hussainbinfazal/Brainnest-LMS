import rateLimit from "express-rate-limit";

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many requests, please try again later.",
  },
});

export const userRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many requests, please try again later.",
  },
});
export const messageRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many requests, please try again later.",
  },
});
export const authRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,

  message: {
    message:
      "Too many login attempts",
  },
});
  
export const chatRateLimiter = rateLimit({
  windowMs: 1000, // 15 min
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many requests, please try again later.",
  },
  })