<script setup lang="ts">
import { reactive, watch, computed } from "vue";
import JerseyNumberInput from "~/components/ui/JerseyNumberInput.vue";
import IsPlayerCheckbox from "~/components/ui/IsPlayerCheckbox.vue";
import AddressAutocompleteInput from "~/components/AddressAutocompleteInput.vue";
import {
  PlayerStatus,
  Position,
  PositionDisplayName,
  type UpdatePlayerProfilePayload,
} from "@ministrosfc/shared";


const { t } = useI18n();
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
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="sheet-label" for="profile-firstName">
          {{ t("common.nombre") }}
        </label>
        <input
          id="profile-firstName"
          v-model="form.firstName"
          type="text"
          class="sheet-field mt-1"
        />
      </div>
      <div>
        <label class="sheet-label" for="profile-lastName">
          {{ t("common.apellido") }}
        </label>
        <input
          id="profile-lastName"
          v-model="form.lastName"
          type="text"
          class="sheet-field mt-1"
          @input="emit('lastNameChange', form.lastName)"
        />
      </div>
    </div>

    <div>
      <label class="sheet-label" for="profile-nickname">
        {{ t("profileProfileEditForm.apodo") }}
      </label>
      <input
        id="profile-nickname"
        v-model="form.nickname"
        type="text"
        maxlength="100"
        class="sheet-field mt-1"
        :placeholder="t('profileProfileEditForm.ejJuanchi')"
      />
    </div>

    <div>
      <IsPlayerCheckbox
        id="profileStatus"
        v-model="isActive"
        :label="t('profileProfileEditForm.activoEnElEquipo')"
        :description="t('profileProfileEditForm.desmarcaEstaOpcionPara')"
      />
      <div
        v-if="!isActive"
        class="sheet-notice mt-2"
        role="note"
        data-testid="inactive-warning"
      >
        <p class="font-normal">
          {{ t("profileEditForm.inactiveWarningStart") }}
          <strong>{{ t("profileProfileEditForm.inactivo") }}</strong>
          {{ t("profileEditForm.inactiveWarningEnd") }}
        </p>
      </div>
    </div>

    <div class="grid grid-cols-2 items-end gap-3">
      <div>
        <label class="sheet-label" for="profile-position">
          {{ t("profileProfileEditForm.posicion") }}
        </label>
        <select
          id="profile-position"
          v-model="form.position"
          class="sheet-field mt-1"
        >
          <option value="">{{ t("profileProfileEditForm.sinAsignar") }}</option>
          <option v-for="pos in positions" :key="pos" :value="pos">
            {{ PositionDisplayName[pos] }} ({{ pos }})
          </option>
        </select>
      </div>
      <div>
        <UiJerseyNumberInput
          v-model="form.jerseyNumber"
          :taken-numbers="takenJerseys"
          @update:model-value="emit('jerseyChange', $event)"
          :label="t('profileProfileEditForm.numeroDeCamiseta')"
        />
      </div>
    </div>

    <div>
      <label class="sheet-label" for="profile-dateOfBirth">
        {{ t("profileProfileEditForm.fechaDeNacimiento") }}
      </label>
      <input
        id="profile-dateOfBirth"
        v-model="form.dateOfBirth"
        type="date"
        class="sheet-field mt-1"
      />
    </div>

    <div>
      <label class="sheet-label" for="profile-address">
        {{ t("profileProfileEditForm.direccion") }}
      </label>
      <AddressAutocompleteInput id="profile-address" v-model="form.address" />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="sheet-label" for="profile-phone">
          {{ t("profileProfileEditForm.telefono") }}
        </label>
        <input
          id="profile-phone"
          v-model="form.phone"
          type="tel"
          class="sheet-field mt-1"
        />
      </div>
      <div>
        <label class="sheet-label" for="profile-whatsapp">
          {{ t("profileProfileEditForm.whatsapp") }}
        </label>
        <input
          id="profile-whatsapp"
          v-model="form.whatsapp"
          type="tel"
          class="sheet-field mt-1"
        />
      </div>
    </div>

    <div>
      <label class="sheet-label" for="profile-emergencyContact">
        {{ t("profileProfileEditForm.contactoDeEmergencia") }}
      </label>
      <input
        id="profile-emergencyContact"
        v-model="form.emergencyContact"
        type="text"
        class="sheet-field mt-1"
        :placeholder="t('profileProfileEditForm.nombreYTelefono')"
      />
    </div>

    <p v-if="error" class="sheet-notice" data-tone="error" role="alert">
      {{ error }}
    </p>

    <button
      type="submit"
      :disabled="loading || jerseyIsTaken"
      class="sheet-button w-full"
    >
      {{ loading ? t("common.guardando") : t("common.guardaLosCambios") }}
    </button>
  </form>
</template>
