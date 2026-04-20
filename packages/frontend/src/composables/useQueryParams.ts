/**
 * Thin reactive wrapper over the current route's query string.
 *
 * - `get(key)`         → current string value, or "" if absent
 * - `set(key, value)`  → push to router; empty string removes the key
 * - `remove(key)`      → remove the key from the URL
 */
export function useQueryParams() {
  const route = useRoute();
  const router = useRouter();

  function get(key: string): string {
    return (route.query[key] as string) ?? "";
  }

  async function set(key: string, value: string) {
    const query: Record<string, string | undefined> = {
      ...(route.query as Record<string, string>),
      [key]: value || undefined,
    };
    Object.keys(query).forEach((k) => {
      if (!query[k]) delete query[k];
    });
    await router.push({ query });
  }

  async function remove(key: string) {
    const query: Record<string, string | undefined> = {
      ...(route.query as Record<string, string>),
    };
    delete query[key];
    await router.push({ query });
  }

  async function reset() {
    await router.push({ query: {} });
  }

  return { get, set, remove, reset };
}
