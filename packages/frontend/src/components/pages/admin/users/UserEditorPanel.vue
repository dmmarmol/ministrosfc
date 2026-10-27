<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import ConfirmationModal from "~/components/ui/ConfirmationModal.vue";
import type { OrphanPlayerItem, User } from "@ministrosfc/shared";

const props = defineProps<{
  user: User | null;
  orphanPlayers: OrphanPlayerItem[];
  loading?: boolean;
  actionLoading?: boolean;
}>();

const emit = defineEmits<{
  save: [
    payload: {
      firstName: string;
      lastName: string;
      email: string;
      expectedUpdatedAt: string;
    },
  ];
  merge: [mergePlayerId: string];
  searchOrphans: [query: string];
}>();

const form = reactive({
  firstName: "",
  lastName: "",
  email: "",
  expectedUpdatedAt: "",
});

watch(
  () => props.user,
  (user) => {
    if (!user) return;

    form.firstName = user.firstName ?? "";
    form.lastName = user.lastName ?? "";
    form.email = user.email ?? "";
    form.expectedUpdatedAt = user.updatedAt ?? "";
  },
  { immediate: true },
);

/** Orphan Search Input */
const orphanSearch = ref("");
function handleOrphanSearch() {
  emit("searchOrphans", orphanSearch.value.trim());
}

function handleOrphanSearchInput() {
  if (!orphanSearch.value.trim()) {
    emit("searchOrphans", "");
  }
}

/** Selected Player Id */
const selectedMergePlayerId = ref<string>("");
function handleSelectMergePlayer(playerId: string): undefined {
  selectedMergePlayerId.value = playerId;
}
function isPlayerSelected(playerId: string): boolean {
  return selectedMergePlayerId.value === playerId;
}

/** Merge Modal */
const showMergeModal = ref(false);
function handleOpenMergeModal() {
  showMergeModal.value = true;
}

const canMerge = computed(() =>
  Boolean(selectedMergePlayerId.value && props.user && !props.user.playerId),
);

/** Form */
function handleSubmit() {
  if (!props.user) return;

  emit("save", {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim().toLowerCase(),
    expectedUpdatedAt: form.expectedUpdatedAt,
  });
}

function confirmMerge() {
  if (!selectedMergePlayerId.value) return;
  emit("merge", selectedMergePlayerId.value);
}
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white shadow-sm">
    <div class="border-b border-gray-100 px-4 py-3">
      <h3 class="text-sm font-semibold text-gray-800">Editor de usuario</h3>
    </div>

    <form v-if="user" class="space-y-5 p-4" @submit.prevent="handleSubmit">
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-700">
            Nombre
          </label>
          <UInput v-model="form.firstName" class="w-full" />
        </div>

        <div>
          <label class="mb-1 block text-xs font-medium text-gray-700">
            Apellido
          </label>
          <UInput v-model="form.lastName" class="w-full" />
        </div>
      </div>

      <div>
        <label class="mb-1 block text-xs font-medium text-gray-700">
          Email
        </label>
        <UInput v-model="form.email" type="email" class="w-full" />
      </div>

      <div class="flex justify-end gap-2">
        <UButton type="submit" color="primary" :loading="loading">
          Guardar perfil
        </UButton>
      </div>
    </form>

    <div
      v-if="user && !user.playerId"
      class="space-y-4 border-t border-gray-100 p-4"
    >
      <div>
        <h4
          class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500"
        >
          Vincular jugador huérfano
        </h4>

        <div class="mb-2 flex gap-2">
          <form class="flex w-full gap-2" @submit.prevent="handleOrphanSearch">
            <UInput
              v-model="orphanSearch"
              type="text"
              size="lg"
              class="w-full"
              placeholder="Buscar jugador huérfano"
              @input="handleOrphanSearchInput"
            />
            <UButton variant="outline" color="neutral" size="sm" type="submit">
              Buscar
            </UButton>
          </form>
        </div>

        <div class="max-h-44 space-y-2 overflow-y-auto">
          <UButton
            v-for="player in orphanPlayers"
            :key="player.playerId"
            class="w-full justify-between text-left text-sm"
            :variant="isPlayerSelected(player.playerId) ? 'soft' : 'outline'"
            :color="isPlayerSelected(player.playerId) ? 'primary' : 'neutral'"
            @click="handleSelectMergePlayer(player.playerId)"
          >
            <span>{{ player.firstName }} {{ player.lastName }}</span>
          </UButton>

          <p v-if="orphanPlayers.length === 0" class="text-xs text-gray-500">
            No se encontraron jugadores huérfanos.
          </p>
        </div>
      </div>

      <div class="flex justify-end">
        <UButton
          color="primary"
          :disabled="!canMerge || actionLoading"
          :loading="actionLoading"
          @click="handleOpenMergeModal"
        >
          Vincular jugador
        </UButton>
      </div>
    </div>

    <div
      v-else-if="user?.playerId"
      class="border-t border-gray-100 p-4 text-sm text-gray-600"
    >
      Este usuario ya está vinculado a un jugador y no requiere merge posterior.
    </div>

    <ConfirmationModal
      v-model:open="showMergeModal"
      title="Confirmar vinculación"
      description="La cuenta aprobada quedará vinculada al jugador huérfano seleccionado y no se crearán identidades duplicadas."
      confirm-text="Vincular jugador"
      :on-confirm="confirmMerge"
    />
  </div>
</template>
