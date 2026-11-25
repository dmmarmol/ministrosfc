const INTERNAL_ORIGIN = "https://ministrosfc.internal";

function containsControlCharacters(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code < 0x20 || code === 0x7f;
  });
}

function normalizeInternalPath(value: string): string | null {
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    containsControlCharacters(value)
  ) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(value);
    if (
      decoded.startsWith("//") ||
      decoded.includes("\\") ||
      containsControlCharacters(decoded)
    ) {
      return null;
    }

    const url = new URL(value, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/**
 * Resolves a route query value to a same-application path, or a safe fallback.
 * The query value should be read by the caller through useQueryParams.
 */
export function resolveReturnUrl(
  returnUrl: string,
  fallback: string,
): string {
  return (
    normalizeInternalPath(returnUrl) ??
    normalizeInternalPath(fallback) ??
    "/"
  );
}
