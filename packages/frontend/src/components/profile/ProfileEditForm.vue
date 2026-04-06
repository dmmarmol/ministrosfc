<script setup lang="ts">
import { reactive, watch, computed } from "vue";
import JerseyNumberInput from "~/components/ui/JerseyNumberInput.vue";
import IsPlayerCheckbox from "~/components/ui/IsPlayerCheckbox.vue";
import {
  PlayerStatus,
  Position,
  type UpdatePlayerProfilePayload,
} from "@ministrosfc/shared";

const positions = Object.values(Position);

interface ProfileFields {
  firstName: string;
  lastName: string;
  nickname: string;
  position: Position | "";
  jerseyNumber: number | null;
  dateOfBirth: string;
  address: string;
  phone: string;
  whatsapp: string;
  emergencyContact: string;
  status: PlayerStatus;
}

const props = defineProps<{
  profile: ProfileFields;
  takenJerseys: number[];
  loading: boolean;
  error: string;
}>();

const emit = defineEmits<{
  save: [data: UpdatePlayerProfilePayload];
  jerseyChange: [value: number | null];
  lastNameChange: [value: string];
}>();

const form = reactive<ProfileFields>({
  firstName: props.profile.firstName ?? "",
  lastName: props.profile.lastName ?? "",
  nickname: props.profile.nickname ?? "",
  position: props.profile.position ?? "",
  jerseyNumber: props.profile.jerseyNumber ?? null,
  dateOfBirth: props.profile.dateOfBirth ?? "",
  address: props.profile.address ?? "",
  phone: props.profile.phone ?? "",
  whatsapp: props.profile.whatsapp ?? "",
  emergencyContact: props.profile.emergencyContact ?? "",
  status: props.profile.status ?? PlayerStatus.ACTIVE,
});

watch(
  () => props.profile,
  (p) => {
    form.firstName = p.firstName ?? "";
    form.lastName = p.lastName ?? "";
    form.nickname = p.nickname ?? "";
    form.position = p.position ?? "";
    form.jerseyNumber = p.jerseyNumber ?? null;
    form.dateOfBirth = p.dateOfBirth ?? "";
    form.address = p.address ?? "";
    form.phone = p.phone ?? "";
    form.whatsapp = p.whatsapp ?? "";
    form.emergencyContact = p.emergencyContact ?? "";
    form.status = p.status ?? PlayerStatus.ACTIVE;
  },
  { deep: true },
);

function handleSubmit() {
  emit("save", { ...form, position: form.position || null });
}

const jerseyIsTaken = computed(
  () =>
    form.jerseyNumber !== null &&
    props.takenJerseys.includes(form.jerseyNumber),
);

const isActive = computed({
  get: () => form.status === PlayerStatus.ACTIVE,
  set: (val: boolean) => {
    form.status = val ? PlayerStatus.ACTIVE : PlayerStatus.INACTIVE;
  },
});
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label
          class="block text-sm font-medium text-gray-700 mb-1"
          for="profile-firstName"
        >
          Nombre
        </label>
        <input
          id="profile-firstName"
          v-model="form.firstName"
          type="text"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
        />
      </div>
      <div>
        <label
          class="block text-sm font-medium text-gray-700 mb-1"
          for="profile-lastName"
        >
          Apellido
        </label>
        <input
          id="profile-lastName"
          v-model="form.lastName"
          type="text"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
          @input="emit('lastNameChange', form.lastName)"
        />
      </div>
    </div>

    <div>
      <label
        class="block text-sm font-medium text-gray-700 mb-1"
        for="profile-nickname"
      >
        Apodo
      </label>
      <input
        id="profile-nickname"
        v-model="form.nickname"
        type="text"
        maxlength="100"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
        placeholder="Ej: Juanchi"
      />
    </div>

    <div>
      <IsPlayerCheckbox
        id="profileStatus"
        v-model="isActive"
        label="Activo en el equipo"
        description="Desmarcá esta opción para marcarme como inactivo"
      />
      <div
        v-if="!isActive"
        class="mt-2 flex gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2.5 text-sm text-yellow-800"
      >
        <span class="mt-0.5 shrink-0">⚠️</span>
        <p>
          Al marcarte como <strong>inactivo</strong> dejás de aparecer en la
          plantilla, no podés ser convocado a partidos y tu número de camiseta
          queda disponible para otro jugador. Podés volver a activarte en
          cualquier momento.
        </p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label
          class="block text-sm font-medium text-gray-700 mb-1"
          for="profile-position"
        >
          Posición
        </label>
        <select
          id="profile-position"
          v-model="form.position"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
        >
          <option value="">Sin asignar</option>
          <option v-for="pos in positions" :key="pos" :value="pos">
            {{ pos }}
          </option>
        </select>
      </div>
      <div>
        <label
          class="block text-sm font-medium text-gray-700 mb-1"
          for="jerseyNumberInput"
        >
          Número de camiseta
        </label>
        <JerseyNumberInput
          v-model="form.jerseyNumber"
          :taken-numbers="takenJerseys"
          @update:model-value="emit('jerseyChange', $event)"
        />
      </div>
    </div>

    <div>
      <label
        class="block text-sm font-medium text-gray-700 mb-1"
        for="profile-dateOfBirth"
      >
        Fecha de nacimiento
      </label>
      <input
        id="profile-dateOfBirth"
        v-model="form.dateOfBirth"
        type="date"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
      />
    </div>

    <div>
      <label
        class="block text-sm font-medium text-gray-700 mb-1"
        for="profile-address"
      >
        Dirección
      </label>
      <input
        id="profile-address"
        v-model="form.address"
        type="text"
        maxlength="500"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
      />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label
          class="block text-sm font-medium text-gray-700 mb-1"
          for="profile-phone"
        >
          Teléfono
        </label>
        <input
          id="profile-phone"
          v-model="form.phone"
          type="tel"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
        />
      </div>
      <div>
        <label
          class="block text-sm font-medium text-gray-700 mb-1"
          for="profile-whatsapp"
        >
          WhatsApp
        </label>
        <input
          id="profile-whatsapp"
          v-model="form.whatsapp"
          type="tel"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
        />
      </div>
    </div>

    <div>
      <label
        class="block text-sm font-medium text-gray-700 mb-1"
        for="profile-emergencyContact"
      >
        Contacto de emergencia
      </label>
      <input
        id="profile-emergencyContact"
        v-model="form.emergencyContact"
        type="text"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
        placeholder="Nombre y teléfono"
      />
    </div>

    <p v-if="error" class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
      {{ error }}
    </p>

    <button
      type="submit"
      :disabled="loading || jerseyIsTaken"
      class="w-full bg-brand text-gray-900 font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
    >
      {{ loading ? "Guardando…" : "Guardar cambios" }}
    </button>
  </form>
</template>
