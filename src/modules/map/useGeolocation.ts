import { ref, type Ref } from 'vue';

const DEFAULT_COORDS: [number, number] = [51.207, 16.1619]; // Legnica, Poland

interface UseGeolocation {
  coordinates: Ref<[number, number]>;
  locationGranted: Ref<boolean>;
  requestLocation: () => Promise<void>;
}

/**
 * Composable that wraps the browser Geolocation API.
 * Falls back to Legnica, Poland when permission is denied or unavailable.
 */
export function useGeolocation(): UseGeolocation {
  const coordinates = ref<[number, number]>([...DEFAULT_COORDS]);
  const locationGranted = ref(false);

  function requestLocation(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!navigator.geolocation) {
        coordinates.value = [...DEFAULT_COORDS];
        locationGranted.value = false;
        resolve();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          coordinates.value = [position.coords.latitude, position.coords.longitude];
          locationGranted.value = true;
          resolve();
        },
        () => {
          coordinates.value = [...DEFAULT_COORDS];
          locationGranted.value = false;
          resolve();
        },
      );
    });
  }

  return { coordinates, locationGranted, requestLocation };
}


