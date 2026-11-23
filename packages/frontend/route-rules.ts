/**
 * Nitro route rules for the public site.
 *
 * Public pages are rendered the same for every visitor (authentication state is resolved on the
 * client), so their server-rendered output can be cached for a few minutes with
 * stale-while-revalidate. A page view then costs no API (and database) work inside the window,
 * which keeps crawlers and traffic bursts from exhausting the scale-to-zero database's free
 * compute allowance. Private and per-user routes are never cached.
 *
 * Trade-off: data edited in the admin area appears on public pages after at most this window.
 */
export const PUBLIC_CACHE_SECONDS = 300;

export const PUBLIC_ROUTES: string[] = [
  "/",
  "/roster",
  "/schedule",
  "/tournaments",
  "/tournaments/**",
  "/statistics",
  "/statistics/**",
  "/players/**",
  "/games/**",
];

export const PRIVATE_ROUTES: string[] = [
  "/admin/**",
  "/profile/**",
  "/login",
  "/register",
  "/auth/**",
  "/games/*/signup",
];

export const routeRules: Record<string, { swr: number | false }> = {
  ...Object.fromEntries(
    PUBLIC_ROUTES.map((route) => [route, { swr: PUBLIC_CACHE_SECONDS }]),
  ),
  // More specific private rules override the public wildcards above.
  ...Object.fromEntries(
    PRIVATE_ROUTES.map((route) => [route, { swr: false as const }]),
  ),
};
