export const authConfig = {
  jwtSecret: process.env.JWT_SECRET ?? "",
  jwtExpiry: process.env.JWT_EXPIRY ?? "24h",
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY ?? "30d",
  bcryptSaltRounds: 12,
} as const;

if (!authConfig.jwtSecret && process.env.NODE_ENV !== "test") {
  throw new Error("JWT_SECRET environment variable is required");
}
