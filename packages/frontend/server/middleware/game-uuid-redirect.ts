import { defineEventHandler, sendRedirect } from "h3";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default defineEventHandler(async (event) => {
  const url = event.node.req.url ?? "";
  const match = url.match(/^\/games\/([^/?#]+)/);
  if (!match) return;

  const param = match[1];
  if (!UUID_RE.test(param)) return;

  // Resolve UUID → slug via CMS API
  const config = useRuntimeConfig();
  const apiBase: string =
    (config.public?.apiBaseUrl as string) ?? "http://localhost:5102";

  try {
    const res = await $fetch<{ data: { slug?: string | null } }>(
      `${apiBase}/api/v1/games/${param}`,
    );
    const slug = res?.data?.slug;
    if (slug) {
      const rest = url.slice(match[0].length); // preserve any sub-path
      return sendRedirect(event, `/games/${slug}${rest}`, 301);
    }
  } catch {
    // game not found or no slug — fall through to normal 404
  }
});
