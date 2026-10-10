import { ref, unref, type Ref } from "vue";

type MaybeRef<T> = T | Ref<T>;

export function useGetUser<TUser = any>(userId: MaybeRef<string>) {
  const { $api } = useNuxtApp();

  const user = ref<TUser | null>(null);
  const loading = ref(false);
  const error = ref("");

  async function fetchUser() {
    loading.value = true;
    error.value = "";

    try {
      const response = await ($api as any)(
        `/api/v1/admin/users/${unref(userId)}`,
      );
      user.value = response.data;
    } catch (e: any) {
      error.value = e?.data?.message ?? "No se pudo cargar el usuario.";
    } finally {
      loading.value = false;
    }
  }

  return {
    user,
    loading,
    error,
    fetchUser,
  };
}
