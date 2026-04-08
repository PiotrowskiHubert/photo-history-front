<script setup lang="ts">
import { watch, onUnmounted, inject, type Ref } from 'vue';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import type { PhotoMarker } from '@/modules/photos/photo.types';

const props = defineProps<{ markers: PhotoMarker[] }>();
const emit = defineEmits<{
  'marker-click': [marker: PhotoMarker];
  'cluster-click': [markers: PhotoMarker[]];
}>();

const leafletMapRef = inject<Ref<L.Map | null>>('leafletMapRef');

// Single cluster group that holds all markers
let clusterGroup: L.MarkerClusterGroup | null = null;

/** Build a circular thumbnail icon with a downward-pointing pin tail */
function buildIcon(thumbnailUrl: string): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [40, 50],   // 40×40 thumbnail + 10px triangle
    iconAnchor: [20, 50], // tip of the triangle = marker coordinate
    html: `<div style="display:flex;flex-direction:column;align-items:center;">
      <div style="
        width:40px;height:40px;border-radius:50%;
        background:url('${thumbnailUrl}') center/cover no-repeat;
        border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);
      "></div>
      <div style="
        width:0;height:0;
        border-left:6px solid transparent;
        border-right:6px solid transparent;
        border-top:10px solid #fff;
      "></div>
    </div>`,
  });
}

function clearCluster() {
  const map = leafletMapRef?.value;
  if (clusterGroup) {
    if (map) map.removeLayer(clusterGroup);
    clusterGroup = null;
  }
}

function addCluster() {
  const map = leafletMapRef?.value;
  if (!map) return;

  clusterGroup = L.markerClusterGroup();

  props.markers.forEach(photoMarker => {
    const icon = buildIcon(photoMarker.thumbnailUrl);
    const m = L.marker([photoMarker.lat, photoMarker.lng], { icon });
    // Attach photo data so cluster events can collect it
    (m as any).photoData = photoMarker;
    m.on('click', () => emit('marker-click', photoMarker));
    clusterGroup!.addLayer(m);
  });

  clusterGroup.on('clusterclick', (e: any) => {
    const childMarkers = e.layer.getAllChildMarkers();
    const photos: PhotoMarker[] = childMarkers.map((m: any) => m.photoData);
    emit('cluster-click', photos);
  });

  map.addLayer(clusterGroup);
}

function rebuild() {
  clearCluster();
  addCluster();
}

watch(
  () => leafletMapRef?.value,
  (map) => {
    if (map) rebuild();
  },
  { immediate: true }
);

watch(
  () => props.markers.length,
  () => {
    rebuild();
  }
);

onUnmounted(() => {
  clearCluster();
});
</script>

<template>
  <!-- Renderless — all rendering via Leaflet API -->
</template>
