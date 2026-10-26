/**
 * Returns a truthy object ignoring any falsy values. Useful for building API payloads without sending null/undefined.
 * @example
 *   createPayload({ name: "Alice", age: null, nickname: undefined, city: "" })
 *   → { name: "Alice" }
 */
export function createTruthyObject<T extends Record<string, unknown>>(
  obj: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => Boolean(v)),
  ) as Partial<T>;
}

/**
 * Normalizes select update payloads that can be either primitive strings
 * or objects with a `value` field.
 */
export function resolveSelectedValue(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "value" in value) {
    const maybeValue = (value as { value?: unknown }).value;
    return typeof maybeValue === "string" ? maybeValue : undefined;
  }

  return undefined;
}
