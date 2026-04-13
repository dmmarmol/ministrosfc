<script setup lang="ts">
import { ref } from "vue";
import { Position, PositionDisplayName } from "@ministrosfc/shared";

const props = defineProps<{
  onSubmit: (
    firstName: string,
    lastName: string,
    position: string | null,
  ) => Promise<void>;
}>();

const guestMode = ref(false);
const guestFirst = ref("");
const guestPosition = ref<string>("");
const guestLoading = ref(false);
const guestError = ref<string | null>(null);

const POSITIONS = Object.values(Position).map((p) => ({
  value: p,
  label: PositionDisplayName[p],
}));

function open() {
  guestMode.value = true;
  guestFirst.value = "";
  guestPosition.value = "";
  guestError.value = null;
}

function cancel() {
  guestMode.value = false;
  guestError.value = null;
}

async function submit() {
  if (!guestFirst.value.trim()) return;
  guestLoading.value = true;
  guestError.value = null;
  try {
    await props.onSubmit(
      guestFirst.value.trim(),
      "",
      guestPosition.value || null,
    );
    guestMode.value = false;
  } catch (e: any) {
    guestError.value = e?.data?.message ?? e?.message ?? "Error al agregar";
  } finally {
    guestLoading.value = false;
  }
}
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl p-4 mb-4">
    <p class="text-sm font-medium text-gray-700 mb-3">Agregar invitado</p>
    <template v-if="!guestMode">
      <button class="text-sm text-brand hover:underline" @click="open">
        + Agregar invitado
      </button>
    </template>
    <template v-else>
      <div class="space-y-3">
        <div>
          <label class="text-xs text-gray-500 block mb-1">Nombre *</label>
          <input
            v-model="guestFirst"
            type="text"
            placeholder="Nombre"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1"
            >Posición (opcional)</label
          >
          <select
            v-model="guestPosition"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Sin posición</option>
            <option
              v-for="pos in POSITIONS"
              :key="pos.value"
              :value="pos.value"
            >
              {{ pos.label }}
            </option>
          </select>
        </div>
        <p v-if="guestError" class="text-xs text-red-600">{{ guestError }}</p>
        <div class="flex gap-2">
          <button
            class="flex-1 bg-brand text-gray-900 font-semibold text-sm py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            :disabled="guestLoading || !guestFirst.trim()"
            @click="submit"
          >
            {{ guestLoading ? "Agregando…" : "Confirmar" }}
          </button>
          <button
            class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg"
            @click="cancel"
          >
            ✕
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
