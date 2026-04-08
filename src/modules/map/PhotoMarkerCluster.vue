<script setup lang="ts">
import { watch, onUnmounted, inject, type Ref } from 'vue';
import L from 'leaflet';
import type { PhotoMarker } from '@/modules/photos/photo.types';

const GRID_CELL = 60;       // px — size of each clustering grid cell
const DEBOUNCE_MS = 150;    // ms — debounce interval for re-renders

const props = defineProps<{ markers: PhotoMarker[] }>();
const emit = defineEmits<{
  'marker-click': [marker: PhotoMarker];
  'cluster-click': [markers: PhotoMarker[]];
}>();

const leafletMapRef = inject<Ref<L.Map | null>>('leafletMapRef');

// All Leaflet markers currently on the map
const leafletMarkers: L.Marker[] = [];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

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

/** Build a cluster icon — same thumbnail style with a red count badge */
function buildClusterIcon(thumbnailUrl: string, count: number): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
      <div style="
        width:40px;height:40px;border-radius:50%;
        background:url('${thumbnailUrl}') center/cover no-repeat;
        border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);
      "></div>
      <div style="
        position:absolute;top:-4px;right:-4px;
        width:20px;height:20px;border-radius:50%;
        background:#e53935;color:#fff;
        font-size:11px;font-weight:700;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 1px 3px rgba(0,0,0,.4);
      ">${count}</div>
      <div style="
        width:0;height:0;
        border-left:6px solid transparent;
        border-right:6px solid transparent;
        border-top:10px solid #fff;
      "></div>
    </div>`,
  });
}

function clearMarkers() {
  const map = leafletMapRef?.value;
  leafletMarkers.forEach(m => {
    if (map) map.removeLayer(m);
  });
  leafletMarkers.length = 0;
}

function addMarkers() {
  const map = leafletMapRef?.value;
  if (!map || props.markers.length === 0) return;

  // Group markers into pixel-grid cells
  const cells = new Map<string, PhotoMarker[]>();

  props.markers.forEach(photoMarker => {
    const pt = map.latLngToContainerPoint([photoMarker.lat, photoMarker.lng]);
    const cellX = Math.floor(pt.x / GRID_CELL);
    const cellY = Math.floor(pt.y / GRID_CELL);
    const key = `${cellX}:${cellY}`;
    let group = cells.get(key);
    if (!group) {
      group = [];
      cells.set(key, group);
    }
    group.push(photoMarker);
  });

  // Create a Leaflet marker for each cell
  cells.forEach(group => {
    if (group.length === 1) {
      // Single marker
      const pm = group[0];
      const icon = buildIcon(pm.thumbnailUrl);
      const m = L.marker([pm.lat, pm.lng], { icon });
      m.on('click', () => emit('marker-click', pm));
      m.addTo(map);
      leafletMarkers.push(m);
    } else {
      // Cluster — place at average position
      const avgLat = group.reduce((s, p) => s + p.lat, 0) / group.length;
      const avgLng = group.reduce((s, p) => s + p.lng, 0) / group.length;
      const icon = buildClusterIcon(group[0].thumbnailUrl, group.length);
      const m = L.marker([avgLat, avgLng], { icon });
      m.on('click', () => emit('cluster-click', group));
      m.addTo(map);
      leafletMarkers.push(m);
    }
  });
}

function rebuild() {
  clearMarkers();
  addMarkers();
}

function scheduledRebuild() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(rebuild, DEBOUNCE_MS);
}

// Map-event handlers stored as named functions so they can be removed later
function onMoveEnd() { scheduledRebuild(); }
function onZoomEnd() { scheduledRebuild(); }

watch(
  () => leafletMapRef?.value,
  (map) => {
    if (map) {
      rebuild();
      map.on('moveend', onMoveEnd);
      map.on('zoomend', onZoomEnd);
    }
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
  if (debounceTimer) clearTimeout(debounceTimer);
  clearMarkers();
  const map = leafletMapRef?.value;
  if (map) {
    map.off('moveend', onMoveEnd);
    map.off('zoomend', onZoomEnd);
  }
});
</script>

<template>
  <!-- Renderless — all rendering via Leaflet API -->
</template>
