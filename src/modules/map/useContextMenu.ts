import { ref } from 'vue';

const visible = ref(false);
const position = ref({ x: 0, y: 0 });
const mapLatLng = ref<{ lat: number; lng: number } | null>(null);
const clickLatLng = ref<{ lat: number; lng: number } | null>(null);

export function useContextMenu() {
  function open(x: number, y: number, lat: number, lng: number): void {
    position.value = { x, y };
    mapLatLng.value = { lat, lng };
    clickLatLng.value = { lat, lng };
    visible.value = true;
  }

  function close(): void {
    visible.value = false;
  }

  return { visible, position, mapLatLng, clickLatLng, open, close };
}

