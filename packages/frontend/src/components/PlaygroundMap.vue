<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";
import type { Playground } from "@ministrosfc/shared";

const props = defineProps<{
  playgrounds: Playground[];
}>();

const emit = defineEmits<{
  (e: "pin-click", id: string): void;
}>();

let map: import("leaflet").Map | null = null;
let markers: import("leaflet").Marker[] = [];

async function initMap() {
  if (!import.meta.client) return;

  const L = await import("leaflet");

  // Fix default icon paths broken by bundlers
  delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });

  const mapEl = document.getElementById("playground-map");
  if (!mapEl) return;

  map = L.map(mapEl).setView([-34.6037, -58.3816], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  renderMarkers();
}

async function renderMarkers() {
  if (!map) return;
  const L = await import("leaflet");

  markers.forEach((m) => m.remove());
  markers = [];

  for (const pg of props.playgrounds) {
    if (pg.latitude === null || pg.longitude === null) continue;
    const marker = L.marker([pg.latitude, pg.longitude])
      .addTo(map!)
      .bindPopup(pg.name);
    marker.on("click", () => emit("pin-click", pg.id));
    markers.push(marker);
  }
}

function centerOn(id: string) {
  const pg = props.playgrounds.find((p) => p.id === id);
  if (!pg || pg.latitude === null || pg.longitude === null || !map) return;
  map.setView([pg.latitude, pg.longitude], 16);
}

defineExpose({ centerOn });

onMounted(() => {
  initMap();
});

onUnmounted(() => {
  map?.remove();
  map = null;
});

watch(() => props.playgrounds, renderMarkers, { deep: true });
</script>

<template>
  <div id="playground-map" class="w-full h-full min-h-[400px] rounded-lg" />
</template>
