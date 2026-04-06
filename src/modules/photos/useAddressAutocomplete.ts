import { ref, watch } from 'vue';

export interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export function useAddressAutocomplete() {
  const query = ref('');
  const suggestions = ref<NominatimResult[]>([]);
  const isLoading = ref(false);
  const selectedAddress = ref('');
  let skipNextSearch = false;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  async function search() {
    if (query.value.length < 3) {
      suggestions.value = [];
      return;
    }

    isLoading.value = true;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.value)}&limit=5`;
      const response = await fetch(url, {
        headers: { 'Accept-Language': 'pl' },
      });
      suggestions.value = await response.json();
    } catch {
      suggestions.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  watch(query, () => {
    if (skipNextSearch) {
      skipNextSearch = false;
      return;
    }
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      search();
    }, 500);
  });

  function selectSuggestion(result: NominatimResult) {
    selectedAddress.value = result.display_name;
    skipNextSearch = true;
    query.value = result.display_name;
    suggestions.value = [];
  }

  function setAddressSilently(address: string) {
    skipNextSearch = true;
    query.value = address;
    selectedAddress.value = address;
  }

  return { query, suggestions, isLoading, selectedAddress, selectSuggestion, setAddressSilently };
}

