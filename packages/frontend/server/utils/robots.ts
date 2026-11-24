/**
 * robots.txt content per environment.
 *
 * Production allows crawling of public pages and keeps private/transactional routes out of
 * search results. Every other environment (development, previews, local) blocks all crawling
 * so a non-public deployment can never be indexed or crawled into the database allowance.
 */
const PRIVATE_PATHS = [
  "/admin",
  "/profile",
  "/login",
  "/register",
  "/auth",
  "/games/*/signup",
] as const;

export function buildRobotsTxt(appEnv: string | undefined): string {
  if (appEnv === "production") {
    return [
      "User-agent: *",
      ...PRIVATE_PATHS.map((path) => `Disallow: ${path}`),
      "",
    ].join("\n");
  }
  return ["User-agent: *", "Disallow: /", ""].join("\n");
}
