<script setup lang="ts">
import { onMounted, onUnmounted, watch, inject } from 'vue';
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

// Inject the Leaflet map instance provided by <l-map>
const leafletMap = inject<{ leafletObject: L.Map }>('leafletMap');

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
  const badgeBg = isDark
    ? 'rgba(0, 0, 0, 0.55)'
    : 'rgba(255, 255, 255, 0.75)';
  const badgeColor = isDark ? 'rgba(255,255,255,0.95)' : 'rgba(28,28,30,0.95)';

  const badge = count > 1
    ? `<div style="
        position:absolute;
        bottom:4px;
        left:50%;
        transform:translateX(-50%);
        background:${badgeBg};
        color:${badgeColor};
        font-size:11px;
        font-weight:600;
        padding:1px 7px;
        border-radius:10px;
        backdrop-filter:blur(8px);
        -webkit-backdrop-filter:blur(8px);
        white-space:nowrap;
        border:1px solid ${glassBorder};
        letter-spacing:0.02em;
      ">${count}</div>`
    : '';

  const html = `
    <div style="
      position:relative;
      width:80px;
      height:80px;
      border-radius:12px;
      overflow:hidden;
      background:${glassBg};
      backdrop-filter:blur(16px) saturate(160%);
      -webkit-backdrop-filter:blur(16px) saturate(160%);
      border:1.5px solid ${glassBorder};
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.18),
        0 4px 16px rgba(0,0,0,0.22),
        0 1px 4px rgba(0,0,0,0.12);
      cursor:pointer;
    ">
      <img src="${imageUrl}"
        alt="photo"
        style="width:100%;height:100%;object-fit:cover;display:block;"
        loading="lazy"
      />
      ${badge}
    </div>
  `;

  return L.divIcon({
    html,
    className: '',   // remove default leaflet-div-icon class styles
    iconSize: [80, 80],
    iconAnchor: [40, 80],
  });
}

function pickNewest(photoMarkers: PhotoMarker[]): PhotoMarker {
  return photoMarkers.reduce((best, curr) =>
    new Date(curr.uploadedAt) > new Date(best.uploadedAt) ? curr : best
  );
}

function rebuildCluster() {
  const map = leafletMap?.leafletObject;
  if (!map) return;

  // Remove existing cluster group
  if (clusterGroup) {
    map.removeLayer(clusterGroup);
  }

  clusterGroup = L.markerClusterGroup({
    // Disable the default cluster icon — we build our own
    iconCreateFunction(cluster) {
      const childMarkers = cluster.getAllChildMarkers();
      // Each marker has a photoData property we attach below
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
  });

  props.markers.forEach((photoMarker) => {
    const icon = buildIcon(photoMarker.url, 1);
    const leafletMarker = L.marker([photoMarker.lat, photoMarker.lng], { icon });
    // Attach photo data to marker for cluster icon builder
    (leafletMarker as any).photoData = photoMarker;

    leafletMarker.on('click', () => {
      emit('marker-click', photoMarker);
    });

    clusterGroup!.addLayer(leafletMarker);
  });

  // Handle cluster click — emit all photos in the cluster
  clusterGroup.on('clusterclick', (e: any) => {
    const photoList: PhotoMarker[] = e.layer.getAllChildMarkers()
      .map((m: any) => m.photoData)
      .filter(Boolean);
    emit('cluster-click', photoList);
  });

  map.addLayer(clusterGroup);
}

onMounted(() => {
  rebuildCluster();
});

watch(() => props.markers, () => {
  rebuildCluster();
}, { deep: true });

onUnmounted(() => {
  const map = leafletMap?.leafletObject;
  if (map && clusterGroup) {
    map.removeLayer(clusterGroup);
  }
});
</script>

<template>
  <!-- Renderless component — all rendering happens via Leaflet API -->
</template>

