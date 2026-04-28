<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ConfirmationModal from "~/components/ui/ConfirmationModal.vue";
import type { OrphanPlayerItem } from "@ministrosfc/shared";

type EditableUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  registrationStatus?: string;
  playerId?: string | null;
  updatedAt: string;
};

const props = defineProps<{
  user: EditableUser | null;
  orphanPlayers: OrphanPlayerItem[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  saveProfile: [
    payload: {
      firstName: string;
      lastName: string;
      email: string;
      expectedUpdatedAt: string;
    },
  ];
  searchOrphans: [query: string];
  mergePlayer: [payload: { mergePlayerId: string; expectedUpdatedAt: string }];
}>();

const localFirstName = ref("");
const localLastName = ref("");
const localEmail = ref("");

watch(
  () => props.user,
  (user) => {
    localFirstName.value = user?.firstName ?? "";
    localLastName.value = user?.lastName ?? "";
    localEmail.value = user?.email ?? "";
  },
  { immediate: true },
);

const orphanSearch = ref("");
const selectedMergePlayerId = ref("");
const showMergeConfirm = ref(false);

const canMerge = computed(
  () => !!props.user && !props.user.playerId && selectedMergePlayerId.value,
);

function saveProfile() {
  if (!props.user) {
    return;
  }

  emit("saveProfile", {
    firstName: localFirstName.value.trim(),
    lastName: localLastName.value.trim(),
    email: localEmail.value.trim().toLowerCase(),
    expectedUpdatedAt: props.user.updatedAt,
  });
}

function searchOrphans() {
  emit("searchOrphans", orphanSearch.value.trim());
}

async function confirmMerge() {
  if (!props.user) {
    return;
  }

  emit("mergePlayer", {
    mergePlayerId: selectedMergePlayerId.value,
    expectedUpdatedAt: props.user.updatedAt,
  });
}
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
    <div v-if="!user" class="text-sm text-gray-500">Cargando usuario…</div>

    <template v-else>
      <div>
        <h3 class="text-sm font-semibold text-gray-800">Perfil de usuario</h3>
        <p class="text-xs text-gray-500">
          Estado: {{ user.registrationStatus }}
          <span v-if="user.playerId">· Vinculado a jugador</span>
        </p>
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        <input
          v-model="localFirstName"
          type="text"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="Nombre"
        />
        <input
          v-model="localLastName"
          type="text"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="Apellido"
        />
        <input
          v-model="localEmail"
          type="email"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="Email"
        />
      </div>

      <button
        class="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-gray-900 disabled:opacity-60"
        :disabled="loading"
        @click="saveProfile"
      >
        Guardar perfil
      </button>

      <div class="border-t border-gray-100 pt-4 space-y-3">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Merge de jugador (post-aprobación)
        </h4>

        <div class="flex gap-2">
          <input
            v-model="orphanSearch"
            type="text"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Buscar jugador huérfano"
          />
          <button
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
            @click="searchOrphans"
          >
            Buscar
          </button>
        </div>

        <div class="max-h-40 space-y-2 overflow-y-auto">
          <button
            v-for="player in orphanPlayers"
            :key="player.playerId"
            class="w-full rounded-lg border px-3 py-2 text-left text-sm"
            :class="
              selectedMergePlayerId === player.playerId
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-200 hover:bg-gray-50'
            "
            @click="selectedMergePlayerId = player.playerId"
          >
            {{ player.firstName }} {{ player.lastName }}
            <span class="ml-2 text-xs text-gray-500">{{ player.status }}</span>
          </button>
        </div>

        <button
          class="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          :disabled="!canMerge || loading"
          @click="showMergeConfirm = true"
        >
          Mergear usuario con jugador
        </button>
      </div>
    </template>

    <ConfirmationModal
      v-model:open="showMergeConfirm"
      title="Confirmar merge"
      description="Se vinculará este usuario aprobado al jugador seleccionado."
      confirm-text="Confirmar merge"
      :on-confirm="confirmMerge"
    />
  </div>
</template>
