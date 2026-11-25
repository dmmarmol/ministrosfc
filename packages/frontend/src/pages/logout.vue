<script setup lang="ts">
definePageMeta({ layout: "sheet", public: true });
import { useAuthStore } from "~/stores/auth";
import { useRouter } from "vue-router";
const authStore = useAuthStore();
const router = useRouter();

onMounted(() => {
  authStore.logout();
  router.push("/");
});
</script>
