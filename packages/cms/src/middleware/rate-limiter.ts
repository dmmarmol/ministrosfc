import rateLimit from "express-rate-limit";
import { ErrorCode } from "../utils/error-codes";

// In development/test, use higher limits to avoid blocking E2E tests
const isDevelopment = process.env.NODE_ENV !== "production";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 200 : 5, // Much higher limit in dev/test for E2E tests
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: ErrorCode.RATE_LIMITED,
    message:
      "Too many login attempts. Please wait 15 minutes before trying again.",
    statusCode: 429,
  },
  skipSuccessfulRequests: false,
});

export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 200 : 5, // Much higher limit in dev/test for E2E tests
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: ErrorCode.RATE_LIMITED,
    message:
      "Too many registration attempts. Please wait 15 minutes before trying again.",
    statusCode: 429,
  },
  skipSuccessfulRequests: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 500 : 100, // Higher limit in dev/test
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: ErrorCode.RATE_LIMITED,
    message: "Too many requests. Please try again later.",
    statusCode: 429,
  },
});
