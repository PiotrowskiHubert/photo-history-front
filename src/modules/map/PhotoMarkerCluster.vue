<script setup lang="ts">
import { onUnmounted, watch, inject, type Ref } from 'vue';
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

// Inject the reactive Leaflet map ref provided by MapView
const leafletMapRef = inject<Ref<L.Map | null>>('leafletMapRef');

let clusterGroup: L.MarkerClusterGroup | null = null;

function buildIcon(imageUrl: string, count: number): L.DivIcon {
  // Determine if dark or light theme from document
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

  // Liquid glass frame styles matching the app theme
  const glassBg = isDark
    ? 'rgba(100, 116, 160, 0.18)'
    : 'rgba(220, 225, 240, 0.65)';
  const glassBorder = isDark
    ? 'rgba(255, 255, 255, 0.13)'
    : 'rgba(28, 28, 30, 0.13)';
  // Solid border color for the triangle tail
  const glassBorderSolid = isDark ? '#4a5580' : '#b0b8c8';
  const badgeBg = isDark
    ? 'rgba(0, 0, 0, 0.55)'
    : 'rgba(255, 255, 255, 0.75)';
  const badgeColor = isDark ? 'rgba(255,255,255,0.95)' : 'rgba(28,28,30,0.95)';

  const badge = count > 1
    ? `<div style="
        position:absolute;
        bottom:3px;
        left:50%;
        transform:translateX(-50%);
        background:${badgeBg};
        color:${badgeColor};
        font-size:10px;
        font-weight:600;
        padding:1px 6px;
        border-radius:10px;
        backdrop-filter:blur(8px);
        -webkit-backdrop-filter:blur(8px);
        white-space:nowrap;
        border:1px solid ${glassBorder};
        letter-spacing:0.02em;
      ">${count}</div>`
    : '';

  const html = `
    <div style="position:relative; width:60px; height:70px; cursor:pointer;">
      <!-- Photo square with liquid glass frame -->
      <div style="
        position:absolute;
        top:0; left:0;
        width:60px; height:60px;
        border-radius:10px;
        overflow:hidden;
        background:${glassBg};
        backdrop-filter:blur(16px) saturate(160%);
        -webkit-backdrop-filter:blur(16px) saturate(160%);
        border:1.5px solid ${glassBorder};
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.18),
          0 4px 16px rgba(0,0,0,0.22),
          0 1px 4px rgba(0,0,0,0.12);
      ">
        <img src="${imageUrl}"
          alt="photo"
          style="width:100%;height:100%;object-fit:cover;display:block;"
          loading="lazy"
        />
        ${badge}
      </div>
      <!-- Triangle tail pointing down -->
      <div style="
        position:absolute;
        bottom:0;
        left:50%;
        transform:translateX(-50%);
        width:0;
        height:0;
        border-left:8px solid transparent;
        border-right:8px solid transparent;
        border-top:10px solid ${glassBorderSolid};
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: '',   // remove default leaflet-div-icon class styles
    iconSize: [60, 70],
    iconAnchor: [30, 70],
  });
}

function pickNewest(photoMarkers: PhotoMarker[]): PhotoMarker {
  return photoMarkers.reduce((best, curr) =>
    new Date(curr.uploadedAt) > new Date(best.uploadedAt) ? curr : best
  );
}

/** Create a fresh MarkerClusterGroup (NOT yet added to map) */
function createClusterGroup(): L.MarkerClusterGroup {
  const group = L.markerClusterGroup({
    iconCreateFunction(cluster) {
      const childMarkers = cluster.getAllChildMarkers();
      const photoList: PhotoMarker[] = childMarkers
        .map((m: any) => m.photoData)
        .filter(Boolean);
      const newest = pickNewest(photoList);
      return buildIcon(newest.url, photoList.length);
    },
    maxClusterRadius: 80,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    animate: true,
    removeOutsideVisibleBounds: true,
  });

  group.on('clusterclick', (e: any) => {
    const photoList: PhotoMarker[] = e.layer.getAllChildMarkers()
      .map((m: any) => m.photoData)
      .filter(Boolean);
    emit('cluster-click', photoList);
  });

  return group;
}

/** Rebuild the cluster group from scratch */
function rebuildCluster() {
  const map = leafletMapRef?.value;
  // Take a snapshot to avoid iterating a reactive array that may be mutated
  const snapshot = [...props.markers];
  console.log('[Cluster] rebuildCluster called — map:', !!map, 'markers:', snapshot.length);

  // Guard: if map is not ready yet, do nothing — watchers will retry
  if (!map) return;

  // No markers — just remove existing cluster from map
  if (!snapshot.length) {
    if (clusterGroup) {
      map.removeLayer(clusterGroup);
      clusterGroup = null;
    }
    return;
  }

  // Remove old cluster group from map before creating a new one
  if (clusterGroup) {
    map.removeLayer(clusterGroup);
    clusterGroup = null;
  }

  // Build all Leaflet markers from the snapshot
  const leafletMarkers: L.Marker[] = snapshot.map((photoMarker) => {
    const icon = buildIcon(photoMarker.url, 1);
    const leafletMarker = L.marker([photoMarker.lat, photoMarker.lng], { icon });
    (leafletMarker as any).photoData = photoMarker;
    leafletMarker.on('click', () => emit('marker-click', photoMarker));
    return leafletMarker;
  });

  // Create cluster group, add markers FIRST, THEN add to map
  // This ensures bounds are initialized before the map triggers moveend
  clusterGroup = createClusterGroup();
  clusterGroup.addLayers(leafletMarkers);
  map.addLayer(clusterGroup);

  console.log('[Cluster] added', leafletMarkers.length, 'markers to cluster group');
}

// Microtask debounce to prevent overlapping rebuilds
let rebuildScheduled = false;

function scheduleRebuild() {
  if (rebuildScheduled) return;
  rebuildScheduled = true;
  Promise.resolve().then(() => {
    rebuildScheduled = false;
    rebuildCluster();
  });
}

// Watch for map becoming available (map loads async)
watch(
  () => leafletMapRef?.value,
  (map) => { if (map) scheduleRebuild(); },
  { immediate: true }
);

// Shallow watch on marker IDs — fires exactly once per list change
watch(
  () => props.markers.map(m => m.id).join(','),
  () => scheduleRebuild()
);

onUnmounted(() => {
  const map = leafletMapRef?.value;
  if (map && clusterGroup) {
    map.removeLayer(clusterGroup);
    clusterGroup = null;
  }
});
</script>

<template>
  <!-- Renderless component — all rendering happens via Leaflet API -->
</template>

