<script setup lang="ts">
import { ref, reactive, onMounted, watch } from "vue";
import { useJerseyAvailability } from "~/composables/useJerseyAvailability";
import UiPositionSelect from "~/components/ui/Position/Select.vue";
import UiJerseyNumberInput from "~/components/ui/JerseyNumberInput.vue";
import { type Position, type Player, PlayerStatus } from "@ministrosfc/shared";
import { useNuxtApp } from "nuxt/app";

export type PlayerFormData = {
  firstName: string;
  lastName: string;
  nickname?: string;
  position?: Position;
  jerseyNumber?: string;
  dateOfBirth?: string;
  invitedById?: string;
  photo?: File | string;
};

const props = withDefaults(
  defineProps<{
    initialData?: Partial<PlayerFormData>;
    submitLabel?: string;
    playerId?: string;
  }>(),
  {
    initialData: () => ({}),
    submitLabel: "Crear Jugador",
  },
);

const emit = defineEmits<{
  (e: "submit", formData: PlayerFormData): void;
}>();

const { $api } = useNuxtApp();
const photoInput = ref<HTMLInputElement | null>(null);
const photoFile = ref<File | null>(null);
const photoPreview = ref<string | null>(null);

const form = reactive({
  firstName: "",
  lastName: "",
  nickname: "",
  position: "" as Position | undefined,
  jerseyNumber: null as number | null,
  dateOfBirth: "",
  invitedById: "",
  status: PlayerStatus.ACTIVE,
});

watch(
  () => props.initialData,
  (initial) => {
    form.firstName = initial.firstName ?? "";
    form.lastName = initial.lastName ?? "";
    form.nickname = initial.nickname ?? "";
    form.position = initial.position;
    form.jerseyNumber = initial.jerseyNumber
      ? Number(initial.jerseyNumber)
      : null;
    form.dateOfBirth = initial.dateOfBirth ?? "";
    form.invitedById = initial.invitedById ?? "";

    if (initial.photo instanceof File) {
      photoFile.value = initial.photo;
      photoPreview.value = URL.createObjectURL(initial.photo);
      return;
    }

    photoFile.value = null;
    photoPreview.value =
      typeof initial.photo === "string" ? initial.photo : null;
  },
  { immediate: true, deep: true },
);

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) setPhoto(file);
}
function onDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0];
  if (file && (file.type === "image/jpeg" || file.type === "image/png"))
    setPhoto(file);
}
function setPhoto(file: File) {
  photoFile.value = file;
  photoPreview.value = URL.createObjectURL(file);
}

const { taken: takenJerseys, fetch: fetchJerseyAvailability } =
  useJerseyAvailability();
onMounted(async () => {
  const excludePlayerId: string | undefined = props.playerId;
  await fetchJerseyAvailability(excludePlayerId);
});

async function handleSubmit() {
  const formData = new FormData();
  formData.append("firstName", form.firstName);
  formData.append("lastName", form.lastName);
  if (form.nickname) formData.append("nickname", form.nickname);
  if (form.position) formData.append("position", form.position);
  if (form.jerseyNumber)
    formData.append("jerseyNumber", String(form.jerseyNumber));
  if (form.dateOfBirth) formData.append("dateOfBirth", form.dateOfBirth);
  if (photoFile.value) formData.append("photo", photoFile.value);
  if (form.invitedById) formData.append("invitedById", form.invitedById);
  if (form.status) formData.append("status", form.status);

  // Casting to unknown first is the recommended way to emit FormData without TypeScript errors
  emit("submit", formData as unknown as PlayerFormData);
}
</script>
<template>
  <form
    class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4"
    @submit.prevent="handleSubmit"
  >
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label
          class="block text-xs font-medium text-gray-700 mb-1"
          for="firstName"
          >Nombre *</label
        >
        <UInput
          id="firstName"
          v-model="form.firstName"
          required
          class="w-full"
        />
      </div>
      <div>
        <label
          class="block text-xs font-medium text-gray-700 mb-1"
          for="lastName"
          >Apellido *</label
        >
        <UInput id="lastName" v-model="form.lastName" required class="w-full" />
      </div>
      <div>
        <label
          class="block text-xs font-medium text-gray-700 mb-1"
          for="nickname"
          >Apodo</label
        >
        <UInput id="nickname" v-model="form.nickname" class="w-full" />
      </div>
      <div>
        <label
          class="block text-xs font-medium text-gray-700 mb-1"
          for="position"
          >Posición</label
        >
        <UiPositionSelect
          id="position"
          v-model="form.position"
          :include-all="false"
          placeholder="Seleccionar posición"
          class="w-full"
        />
      </div>
      <div>
        <UiJerseyNumberInput
          v-model="form.jerseyNumber"
          :taken-numbers="takenJerseys"
          label="Dorsal #"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1" for="dob"
          >Fecha de Nacimiento</label
        >
        <UInput
          id="dob"
          v-model="form.dateOfBirth"
          type="date"
          class="w-full"
        />
      </div>
      <!-- Player Status -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1" for="status"
          >Estado</label
        >
        <UiPlayerStatusSelect
          id="status"
          v-model="form.status"
          :single-player="true"
          class="w-full"
        />
      </div>
      <div>
        <label
          class="block text-xs font-medium text-gray-700 mb-1"
          for="invitedById"
          >Invitado por</label
        >
        <UiPlayerSelect
          id="invitedById"
          v-model="form.invitedById"
          placeholder="Seleccionar jugador"
          class="w-full"
        />
      </div>
    </div>

    <!-- Photo upload -->
    <div class="relative">
      <UiLoadingOverlay>
        <p class="text-lg font-medium text-gray-500">
          Aun no es posible subir fotos
        </p>
      </UiLoadingOverlay>
      <label class="block text-xs font-medium text-gray-700 mb-1">Foto</label>
      <div
        class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-brand transition-colors"
        @click="photoInput?.click()"
        @dragover.prevent
        @drop.prevent="onDrop"
      >
        <img
          v-if="photoPreview"
          :src="photoPreview"
          class="w-24 h-24 rounded-full object-cover mx-auto mb-2"
          alt="Preview"
        />
        <p v-else class="text-gray-400 text-sm">
          Arrastrá una foto aquí o hacé clic para buscarla
        </p>
        <p class="text-xs text-gray-400 mt-1">JPG o PNG, máx. 5 MB</p>
      </div>
      <input
        ref="photoInput"
        type="file"
        accept="image/jpeg,image/png"
        class="hidden"
        @change="onFileChange"
        disabled
      />
    </div>
    <div class="flex justify-end w-full gap-3 pt-2">
      <slot name="buttons"></slot>
      <UButton to="/admin/players" variant="outline" color="neutral" size="xl"
        >Cancelar</UButton
      >
      <UButton type="submit" variant="solid" color="primary" size="xl">
        {{ props.submitLabel }}
      </UButton>
    </div>
  </form>
</template>
