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
        <UInput
          v-model="localFirstName"
          type="text"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="Nombre"
        />
        <UInput
          v-model="localLastName"
          type="text"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="Apellido"
        />
        <UInput
          v-model="localEmail"
          type="email"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="Email"
        />
      </div>

      <UButton
        color="primary"
        variant="solid"
        size="sm"
        :disabled="loading"
        @click="saveProfile"
      >
        Guardar perfil
      </UButton>

      <div class="border-t border-gray-100 pt-4 space-y-3">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Merge de jugador (post-aprobación)
        </h4>

        <div class="flex gap-2">
          <UInput
            v-model="orphanSearch"
            type="text"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Buscar jugador huérfano"
          />
          <UButton
            variant="outline"
            color="neutral"
            size="sm"
            @click="searchOrphans"
          >
            Buscar
          </UButton>
        </div>

        <div class="max-h-40 space-y-2 overflow-y-auto">
          <UButton
            v-for="player in orphanPlayers"
            :key="player.playerId"
            class="w-full text-left text-sm"
            :variant="
              selectedMergePlayerId === player.playerId ? 'soft' : 'outline'
            "
            :color="
              selectedMergePlayerId === player.playerId ? 'primary' : 'neutral'
            "
            @click="selectedMergePlayerId = player.playerId"
          >
            {{ player.firstName }} {{ player.lastName }}
            <span class="ml-2 text-xs text-gray-500">{{ player.status }}</span>
          </UButton>
        </div>

        <UButton
          color="primary"
          variant="solid"
          size="sm"
          :disabled="!canMerge || loading"
          @click="showMergeConfirm = true"
        >
          Mergear usuario con jugador
        </UButton>
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
