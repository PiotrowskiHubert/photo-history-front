export function useReverseGeocode() {
  async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const response = await fetch(url, {
        headers: { 'Accept-Language': 'pl' },
      });
      const data = await response.json();
      return data.display_name ?? '';
    } catch {
      return '';
    }
  }

  return { reverseGeocode };
}

