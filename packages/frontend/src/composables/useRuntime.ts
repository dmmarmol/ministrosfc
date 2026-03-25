interface Runtime {
  isClient: boolean;
  isServer: boolean;
}

/**
 * Provides runtime environment information for the current execution context.
 *
 * Wraps `import.meta.client` / `import.meta.server` behind a composable so
 * that test suites can mock the runtime environment without monkeypatching
 * import.meta, which Vite/Vitest does not support directly.
 *
 * @returns {Runtime} An object containing flags indicating whether the code is
 * running on the client or server.
 *
 * @property {boolean} isClient - `true` if running in the browser environment.
 * @property {boolean} isServer - `true` if running in the server environment.
 *
 * @example
 * const { isClient } = useRuntime();
 * if (isClient) localStorage.setItem('key', value);
 */
export const useRuntime = (): Runtime => {
  return {
    isClient: !!import.meta.client,
    isServer: !!import.meta.server,
  };
};
