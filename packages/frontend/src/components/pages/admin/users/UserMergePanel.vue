<script setup lang="ts">
import { computed, ref } from "vue";
import ConfirmationModal from "~/components/ui/ConfirmationModal.vue";
import type {
  OrphanPlayerItem,
  PendingApprovalQueueItem,
  PlayerStatus,
} from "@ministrosfc/shared";

const props = defineProps<{
  selected: PendingApprovalQueueItem | null;
  orphanPlayers: OrphanPlayerItem[];
  actionLoading?: boolean;
}>();

const emit = defineEmits<{
  approve: [];
  approveMerge: [mergePlayerId: string];
  deny: [reason: string];
  searchOrphans: [query: string];
}>();

const selectedMergePlayerId = ref<string>("");
const orphanSearch = ref("");
const denyReason = ref("");

const showApproveMergeConfirm = ref(false);
const showDenyConfirm = ref(false);

const canApproveMerge = computed(() => selectedMergePlayerId.value.length > 0);

function chooseSuggestion(playerId: string) {
  selectedMergePlayerId.value = playerId;
}

function handleOrphanSearch() {
  emit("searchOrphans", orphanSearch.value.trim());
}

function handleOrphanSearchInput() {
  if (orphanSearch.value.trim() === "") {
    emit("searchOrphans", "");
  }
}

async function confirmApproveMerge() {
  emit("approveMerge", selectedMergePlayerId.value);
}

async function confirmDeny() {
  emit("deny", denyReason.value.trim());
  denyReason.value = "";
}
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white">
    <div class="px-4 py-3 border-b border-gray-100">
      <h3 class="text-sm font-semibold text-gray-800">Panel de revisión</h3>
    </div>

    <div v-if="!selected" class="p-4 text-sm text-gray-500">
      Seleccioná una solicitud para revisar.
    </div>

    <div v-else class="p-4 space-y-4">
      <div class="rounded-lg bg-gray-50 p-3">
        <p class="text-sm font-semibold text-gray-800">
          {{ selected.firstName }} {{ selected.lastName }}
        </p>
        <p class="text-xs text-gray-500">{{ selected.email }}</p>
      </div>

      <div>
        <h4
          class="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2"
        >
          Sugerencias automáticas
        </h4>
        <div class="space-y-2">
          <UButton
            v-for="s in selected.suggestions"
            :key="s.playerId"
            class="w-full text-left text-sm"
            :variant="selectedMergePlayerId === s.playerId ? 'soft' : 'outline'"
            :color="
              selectedMergePlayerId === s.playerId ? 'primary' : 'neutral'
            "
            @click="chooseSuggestion(s.playerId)"
          >
            <div class="flex items-center justify-between gap-2">
              <span>{{ s.firstName }} {{ s.lastName }}</span>
              <span class="text-xs text-gray-500"
                >score {{ s.matchScore }}</span
              >
            </div>
          </UButton>
          <p
            v-if="selected.suggestions.length === 0"
            class="text-xs text-gray-500"
          >
            Sin sugerencias sobre el umbral.
          </p>
        </div>
      </div>

      <div>
        <h4
          class="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2"
        >
          Buscar huérfanos
        </h4>
        <div class="flex gap-2 mb-2">
          <form @submit.prevent="handleOrphanSearch" class="flex w-full gap-2">
            <UInput
              v-model="orphanSearch"
              type="text"
              size="lg"
              class="w-full"
              placeholder="Nombre o apellido"
              @input="handleOrphanSearchInput"
            />
            <UButton variant="outline" color="neutral" size="sm" type="submit">
              Buscar
            </UButton>
          </form>
        </div>

        <div class="max-h-40 overflow-y-auto space-y-2">
          <UButton
            v-for="p in orphanPlayers"
            :key="p.playerId"
            class="w-full text-left text-sm flex items-center justify-between gap-2"
            :variant="selectedMergePlayerId === p.playerId ? 'subtle' : 'soft'"
            :color="
              selectedMergePlayerId === p.playerId ? 'primary' : 'neutral'
            "
            @click="selectedMergePlayerId = p.playerId"
          >
            {{ p.firstName }} {{ p.lastName }}
            <UiPlayerStatusBadge :status="p.status as PlayerStatus" />
          </UButton>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        <UButton
          color="primary"
          :variant="!canApproveMerge || actionLoading ? 'outline' : 'solid'"
          size="md"
          :disabled="!canApproveMerge || actionLoading"
          @click="showApproveMergeConfirm = true"
          title="Aprobar con merge vincula la cuenta al jugador seleccionado combinando datos de jugadores."
        >
          Aprobar con merge
        </UButton>

        <UButton
          color="neutral"
          variant="outline"
          size="md"
          :disabled="actionLoading"
          @click="emit('approve')"
          title="Aprobar sin merge vincula la cuenta al jugador automáticamente sin combinar datos de jugadores."
        >
          Aprobar sin merge
        </UButton>

        <UButton
          color="error"
          variant="outline"
          size="md"
          :disabled="actionLoading"
          @click="showDenyConfirm = true"
          title="Denegar elimina permanentemente la cuenta registrada sin conservar datos de rechazo."
        >
          Denegar
        </UButton>
      </div>

      <div class="space-y-2">
        <label
          class="text-xs font-semibold uppercase tracking-wide text-gray-500"
        >
          Motivo de denegación
        </label>
        <UTextarea
          v-model="denyReason"
          :rows="3"
          size="lg"
          class="w-full"
          placeholder="Explicá por qué se rechaza la solicitud (opcional)"
        />
      </div>
    </div>

    <ConfirmationModal
      v-model:open="showApproveMergeConfirm"
      title="Confirmar merge"
      description="Se aprobará la cuenta y se vinculará al jugador seleccionado."
      confirm-text="Aprobar y mergear"
      :on-confirm="confirmApproveMerge"
    />

    <ConfirmationModal
      v-model:open="showDenyConfirm"
      title="Confirmar denegación"
      description="La cuenta registrada será eliminada permanentemente y no se conservarán datos de rechazo."
      confirm-text="Denegar y eliminar"
      :on-confirm="confirmDeny"
    />
  </div>
</template>
