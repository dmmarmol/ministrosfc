import rateLimit from "express-rate-limit";
import { ErrorCode } from "../utils/error-codes";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
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

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: ErrorCode.RATE_LIMITED,
    message: "Too many requests. Please try again later.",
    statusCode: 429,
  },
});
