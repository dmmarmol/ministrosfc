import { ref } from "vue";
import { useRuntimeConfig } from "nuxt/app";

interface AppConfigResponse {
  photoUploadsEnabled?: unknown;
}

/**
 * Public capability flags from the CMS (`GET /api/v1/config`).
 *
 * Everything defaults to "off" until the API says otherwise, so a failing or
 * unreachable endpoint never exposes a feature the backend cannot honor.
 */
export function useAppConfig() {
  const config = useRuntimeConfig();
  const photoUploadsEnabled = ref(false);
  const loaded = ref(false);

  async function load(): Promise<void> {
    try {
      const response = await $fetch<AppConfigResponse>(
        `${config.public.apiBaseUrl}/api/v1/config`,
      );
      photoUploadsEnabled.value = response.photoUploadsEnabled === true;
    } catch {
      photoUploadsEnabled.value = false;
    } finally {
      loaded.value = true;
    }
  }

  return { photoUploadsEnabled, loaded, load };
}
