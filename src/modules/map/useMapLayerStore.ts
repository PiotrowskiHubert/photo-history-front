import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useThemeStore } from '@/modules/theme/useThemeStore';

export interface MapLayer {
  id: string;
  label: string;
  icon: string;
  url: string;
  attribution: string;
}

const layers: MapLayer[] = [
  {
    id: 'classic',
    label: 'Classic',
    icon: 'map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  {
    id: 'dark',
    label: 'Dark',
    icon: 'moon',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  },
  {
    id: 'satellite',
    label: 'Satellite',
    icon: 'satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &copy; Earthstar Geographics',
  },
];

export const useMapLayerStore = defineStore('mapLayer', () => {
  const activeLayerId = ref<string>('dark');

  const activeLayer = computed(() => layers.find((l) => l.id === activeLayerId.value) ?? layers[1]);
  const allLayers = computed(() => layers);

  function setLayer(id: string): void {
    if (layers.some((l) => l.id === id)) {
      activeLayerId.value = id;
      useThemeStore().syncWithLayer(id);
    }
  }

  // Sync theme on store initialization
  useThemeStore().syncWithLayer(activeLayerId.value);

  return { activeLayerId, activeLayer, allLayers, setLayer };
});


