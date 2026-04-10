<script setup lang="ts">
import { onMounted, provide, ref, watch } from 'vue';
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet';
import type { LeafletMouseEvent } from 'leaflet';
import type L from 'leaflet';
import { storeToRefs } from 'pinia';
import { useGeolocation } from './useGeolocation';
import { useContextMenu } from './useContextMenu';
import { useMapLayerStore } from './useMapLayerStore';
import { useMapFilterStore } from './useMapFilterStore';
import { useTagFilterStore } from './useTagFilterStore';
import { usePhotoStore } from '@/modules/photos/usePhotoStore';
import type { PhotoMarker, BoundingBox } from '@/modules/photos/photo.types';
import PhotoMarkerCluster from '@/modules/map/PhotoMarkerCluster.vue';
import PhotoDetailModal from '@/modules/photos/PhotoDetailModal.vue';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import type { ContextMenuItem } from '@/shared/types/context-menu.types';
import AddPhotoModal from '@/modules/photos/AddPhotoModal.vue';

const { coordinates, requestLocation } = useGeolocation();
const contextMenu = useContextMenu();
const { open } = contextMenu;
const { activeLayer } = storeToRefs(useMapLayerStore());
const filterStore = useMapFilterStore();
const tagFilterStore = useTagFilterStore();
const { selectedFrom, selectedTo } = storeToRefs(filterStore);
const photoStore = usePhotoStore();
const { markers, photoMutatedAt, mapRefreshToken } = storeToRefs(photoStore);

const zoom = ref(13);
const mapReady = ref(false);
const showAddPhotoModal = ref(false);
const showPhotoModal = ref<string[]>([]);

// Reactive ref for the Leaflet map instance — provided directly as a Ref to child components
const mapInstanceRef = ref<L.Map | null>(null);
provide('leafletMapRef', mapInstanceRef);

// Debounce timer for map movement
let fetchTimer: ReturnType<typeof setTimeout> | null = null;

function getBounds(): BoundingBox | null {
  const map = mapInstanceRef.value;
  if (!map) return null;
  const b = map.getBounds();
  return {
    minLat: b.getSouth(),
    maxLat: b.getNorth(),
    minLng: b.getWest(),
    maxLng: b.getEast(),
  };
}

function scheduleFetch() {
  if (fetchTimer) clearTimeout(fetchTimer);
  fetchTimer = setTimeout(async () => {
    const bounds = getBounds();
    if (!bounds) return;
    try {
      const tagFilter = tagFilterStore.activeTags.length > 0 ? tagFilterStore.activeTags : undefined;
      await photoStore.fetchPhotos(bounds, tagFilter);
    } catch (err) {
      console.error('[MapView] fetchPhotos failed:', err);
    }
  }, 400); // 400ms debounce — avoids requests on every pixel of pan
}

function onMapReady(mapObject: any) {
  mapInstanceRef.value = mapObject;
  // Fetch markers for the initial viewport immediately
  scheduleFetch();
  // Re-fetch whenever the user pans or zooms
  mapObject.on('moveend', scheduleFetch);
  mapObject.on('zoomend', scheduleFetch);
}

onMounted(async () => {
  await requestLocation();
  mapReady.value = true;
});

// Re-fetch markers when the user changes the year range on the timeline
watch([selectedFrom, selectedTo], () => {
  if (filterStore.hasRealBounds) scheduleFetch();
});

// Re-fetch markers when a photo is mutated from anywhere in the app
watch(photoMutatedAt, () => {
  scheduleFetch();
});

// Re-fetch markers when a modal triggers a map refresh
watch(mapRefreshToken, () => {
  scheduleFetch();
});

const menuItems: ContextMenuItem[] = [
  { label: 'Add Photo', icon: 'camera', action: () => { showAddPhotoModal.value = true; contextMenu.close(); } },
  { label: 'Action 2', icon: 'pen', action: () => console.log('action2'), separator: true },
  { label: 'Action 3', icon: 'trash', action: () => console.log('action3'), danger: true, separator: true },
];

function onMapContextMenu(event: LeafletMouseEvent) {
  event.originalEvent.preventDefault();
  open(event.originalEvent.clientX, event.originalEvent.clientY, event.latlng.lat, event.latlng.lng);
}
</script>

<template>
  <div class="h-screen w-full">
    <l-map
      v-if="mapReady"
      v-model:zoom="zoom"
      :center="coordinates"
      :use-global-leaflet="false"
      :max-zoom="19"
      class="h-full w-full"
      @contextmenu="onMapContextMenu"
      @ready="onMapReady"
    >
      <l-tile-layer
        :key="activeLayer.id"
        :url="activeLayer.url"
        :attribution="activeLayer.attribution"
        layer-type="base"
        :name="activeLayer.label"
      />
      <PhotoMarkerCluster
        :markers="markers"
        @marker-click="(marker: PhotoMarker) => { showPhotoModal = [marker.id] }"
        @cluster-click="(group: PhotoMarker[]) => { showPhotoModal = group.map(m => m.id) }"
      />
    </l-map>
    <ContextMenu :items="menuItems" />
    <PhotoDetailModal
      :model-value="showPhotoModal.length > 0"
      :photo-ids="showPhotoModal"
      @update:model-value="(val: boolean) => { if (!val) showPhotoModal = [] }"
    />
    <AddPhotoModal
      v-model="showAddPhotoModal"
      :lat="contextMenu.clickLatLng.value?.lat ?? 0"
      :lng="contextMenu.clickLatLng.value?.lng ?? 0"
      mode="add"
    />
  </div>
</template>

