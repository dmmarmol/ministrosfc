import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";

/**
 * Resolves sheet palette tokens (e.g. "ink", "paper") to concrete colors for
 * canvas/SVG-data-URI drawing, where CSS classes can't reach (soccer-jersey).
 * Follows the dark mode: re-reads whenever the <html> class changes. Until the
 * tokens resolve (SSR, tests without the stylesheet) it falls back to CSS
 * color keywords so the drawing still works.
 */
export function useSheetColors<T extends string>(
  tokens: Record<T, string>,
  fallback: Record<T, string>,
): Record<T, Ref<string>> {
  const out = {} as Record<T, Ref<string>>;
  for (const key of Object.keys(tokens) as T[]) out[key] = ref(fallback[key]);

  function read() {
    const style = getComputedStyle(document.documentElement);
    const root =
      document.querySelector(".sheet-world") ?? document.documentElement;
    const scoped = root === document.documentElement ? style : getComputedStyle(root);
    for (const key of Object.keys(tokens) as T[]) {
      const value = scoped.getPropertyValue(`--sheet-${tokens[key]}`).trim();
      out[key].value = value || fallback[key];
    }
  }

  let observer: MutationObserver | null = null;
  onMounted(() => {
    read();
    observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
  });
  onBeforeUnmount(() => observer?.disconnect());
  return out;
}
