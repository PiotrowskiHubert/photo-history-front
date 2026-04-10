import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export interface MapOverlay {
  id: string;
  label: string;
  icon: string;
  active: boolean;
}

export const useMapOverlayStore = defineStore('mapOverlay', () => {
  const overlays = ref<MapOverlay[]>([
    { id: 'overlay-a', label: 'Timeline', icon: 'timeline', active: true },
    { id: 'overlay-tags', label: 'Tags', icon: 'tag', active: false },
    { id: 'overlay-b', label: 'Overlay B', icon: 'map-pin', active: true },
    { id: 'overlay-c', label: 'Overlay C', icon: 'compass', active: true },
  ]);

  const allOverlays = computed(() => overlays.value);
  const activeOverlayIds = computed(() =>
    overlays.value.filter((o) => o.active).map((o) => o.id),
  );

  const isTimelineEnabled = computed(() => {
    const a = overlays.value.find(o => o.id === 'overlay-a')
    return a?.active ?? true
  })

  const isTagSearchEnabled = computed(() => {
    return overlays.value.find(o => o.id === 'overlay-tags')?.active ?? false
  })

  function toggleOverlay(id: string): void {
    const overlay = overlays.value.find((o) => o.id === id);
    if (overlay) {
      overlay.active = !overlay.active;
    }
  }

  return { overlays, allOverlays, activeOverlayIds, isTimelineEnabled, isTagSearchEnabled, toggleOverlay };
});

