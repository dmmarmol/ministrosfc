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
      "Hubo demasiados intentos de inicio de sesión. Esperá 15 minutos antes de volver a intentarlo.",
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
      "Hubo demasiados intentos de registro. Esperá 15 minutos antes de volver a intentarlo.",
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
    message: "Hiciste demasiadas solicitudes. Volvé a intentarlo más tarde.",
    statusCode: 429,
  },
});
