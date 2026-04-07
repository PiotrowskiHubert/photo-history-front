<script setup lang="ts">
import { watch, onUnmounted, inject, type Ref } from 'vue';
import L from 'leaflet';
import type { PhotoMarker } from '@/modules/photos/photo.types';

const props = defineProps<{ markers: PhotoMarker[] }>();
const emit = defineEmits<{
  'marker-click': [marker: PhotoMarker];
  'cluster-click': [markers: PhotoMarker[]];
}>();

const leafletMapRef = inject<Ref<L.Map | null>>('leafletMapRef');

// Keep track of all plain Leaflet markers added to the map
const leafletMarkers: L.Marker[] = [];

function clearMarkers() {
  const map = leafletMapRef?.value;
  leafletMarkers.forEach(m => {
    if (map) map.removeLayer(m);
  });
  leafletMarkers.length = 0;
  console.log('[Cluster] cleared all markers');
}

function addMarkers() {
  const map = leafletMapRef?.value;
  if (!map) {
    console.log('[Cluster] addMarkers ABORTED — map not ready');
    return;
  }

  props.markers.forEach(photoMarker => {
    const m = L.marker([photoMarker.lat, photoMarker.lng]);
    m.on('click', () => emit('marker-click', photoMarker));
    m.addTo(map);
    leafletMarkers.push(m);
  });

  console.log('[Cluster] added', leafletMarkers.length, 'default markers to map');
}

function rebuild() {
  console.log('[Cluster] rebuild — map:', !!leafletMapRef?.value, '| markers:', props.markers.length);
  clearMarkers();
  addMarkers();
}

watch(
  () => leafletMapRef?.value,
  (map) => {
    console.log('[Cluster] map watcher —', !!map);
    if (map) rebuild();
  },
  { immediate: true }
);

watch(
  () => props.markers.length,
  (newLen, oldLen) => {
    console.log('[Cluster] markers.length watcher —', oldLen, '->', newLen);
    rebuild();
  }
);

onUnmounted(() => {
  clearMarkers();
});
</script>

<template>
  <!-- Renderless — all rendering via Leaflet API -->
</template>

