export const authConfig = {
  jwtSecret: process.env.JWT_SECRET ?? "",
  jwtExpiry: process.env.JWT_EXPIRY ?? "24h",
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY ?? "30d",
  bcryptSaltRounds: 12,
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI ??
    "http://localhost:5102/api/v1/auth/google/callback",
} as const;

if (!authConfig.jwtSecret && process.env.NODE_ENV !== "test") {
  throw new Error("JWT_SECRET environment variable is required");
}
