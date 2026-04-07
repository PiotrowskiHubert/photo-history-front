<script setup lang="ts">
import { onMounted, provide, ref } from 'vue';
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet';
import type { LeafletMouseEvent } from 'leaflet';
import { storeToRefs } from 'pinia';
import { useGeolocation } from './useGeolocation';
import { useContextMenu } from './useContextMenu';
import { useMapLayerStore } from './useMapLayerStore';
import { usePhotoStore } from '@/modules/photos/usePhotoStore';
import PhotoMarkerCluster from '@/modules/map/PhotoMarkerCluster.vue';
import PhotoDetailModal from '@/modules/photos/PhotoDetailModal.vue';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import type { ContextMenuItem } from '@/shared/types/context-menu.types';
import AddPhotoModal from '@/modules/photos/AddPhotoModal.vue';

const { coordinates, requestLocation } = useGeolocation();
const contextMenu = useContextMenu();
const { open } = contextMenu;
const { activeLayer } = storeToRefs(useMapLayerStore());
const photoStore = usePhotoStore();
const { markers } = storeToRefs(photoStore);

const zoom = ref(13);
const mapReady = ref(false);
const showAddPhotoModal = ref(false);
const showPhotoModal = ref(false);

onMounted(async () => {
  await requestLocation();
  mapReady.value = true;
  await photoStore.fetchPhotos();
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
      class="h-full w-full"
      @contextmenu="onMapContextMenu"
      @ready="(mapObject: any) => provide('leafletMap', { leafletObject: mapObject })"
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
        @marker-click="showPhotoModal = true"
        @cluster-click="showPhotoModal = true"
      />
    </l-map>
    <ContextMenu :items="menuItems" />
    <PhotoDetailModal v-model="showPhotoModal" />
    <AddPhotoModal
      v-model="showAddPhotoModal"
      :lat="contextMenu.clickLatLng.value?.lat ?? 0"
      :lng="contextMenu.clickLatLng.value?.lng ?? 0"
      mode="add"
    />
  </div>
</template>

