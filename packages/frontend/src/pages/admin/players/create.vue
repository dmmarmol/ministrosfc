<template>
  <div class="max-w-xl">
    <NuxtLink
      to="/admin/players"
      class="text-sm text-gray-500 hover:text-brand mb-4 inline-block"
      >← Volver a Jugadores</NuxtLink
    >
    <h2 class="text-lg font-bold text-gray-900 mb-6">Agregar Jugador</h2>
    <form
      class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4"
      @submit.prevent="submit"
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1" for="name"
            >Nombre Completo *</label
          >
          <input
            id="name"
            v-model="form.name"
            required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            class="block text-xs font-medium text-gray-700 mb-1"
            for="nickname"
            >Apodo</label
          >
          <input
            id="nickname"
            v-model="form.nickname"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            class="block text-xs font-medium text-gray-700 mb-1"
            for="position"
            >Posición</label
          >
          <select
            id="position"
            v-model="form.position"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Seleccionar…</option>
            <option value="GK">Portero</option>
            <option value="CB">Defensa Central</option>
            <option value="RB">Lateral Derecho</option>
            <option value="LB">Lateral Izquierdo</option>
            <option value="RWB">Carrilero Derecho</option>
            <option value="LWB">Carrilero Izquierdo</option>
            <option value="DMF">Mediocampista Defensivo</option>
            <option value="CMF">Mediocampista Central</option>
            <option value="AMF">Mediocampista Ofensivo</option>
            <option value="RMF">Mediocampista Derecho</option>
            <option value="LMF">Mediocampista Izquierdo</option>
            <option value="SS">Segundo Delantero</option>
            <option value="CF">Delantero Centro</option>
            <option value="RWF">Extremo Derecho</option>
            <option value="LWF">Extremo Izquierdo</option>
          </select>
        </div>
        <div>
          <label
            class="block text-xs font-medium text-gray-700 mb-1"
            for="jersey"
            >Dorsal #</label
          >
          <input
            id="jersey"
            v-model.number="form.jerseyNumber"
            type="number"
            min="1"
            max="99"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1" for="dob"
            >Fecha de Nacimiento</label
          >
          <input
            id="dob"
            v-model="form.dateOfBirth"
            type="date"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <!-- Photo upload -->
      <div>
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
        />
      </div>

      <p
        v-if="error"
        class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"
      >
        {{ error }}
      </p>
      <div class="flex gap-3 pt-2">
        <button
          type="submit"
          :disabled="loading"
          class="bg-brand text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-60"
        >
          {{ loading ? "Creando…" : "Crear Jugador" }}
        </button>
        <NuxtLink
          to="/admin/players"
          class="text-sm text-gray-500 px-5 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50"
          >Cancelar</NuxtLink
        >
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "auth" });
useHead({ title: "Add Player – Admin" });

const { $api } = useNuxtApp();
const router = useRouter();
const photoInput = ref<HTMLInputElement | null>(null);
const photoFile = ref<File | null>(null);
const photoPreview = ref<string | null>(null);
const loading = ref(false);
const error = ref("");

const form = reactive({
  name: "",
  nickname: "",
  position: "",
  jerseyNumber: null as number | null,
  dateOfBirth: "",
});

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

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    const fd = new FormData();
    fd.append("name", form.name);
    if (form.nickname) fd.append("nickname", form.nickname);
    if (form.position) fd.append("position", form.position);
    if (form.jerseyNumber) fd.append("jerseyNumber", String(form.jerseyNumber));
    if (form.dateOfBirth) fd.append("dateOfBirth", form.dateOfBirth);
    if (photoFile.value) fd.append("photo", photoFile.value);

    await $api("/api/v1/players", { method: "POST", body: fd });
    await router.push("/admin/players");
  } catch (e: any) {
    error.value = e?.message ?? "Failed to create player.";
  } finally {
    loading.value = false;
  }
}
</script>
