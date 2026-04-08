import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useMapFilterStore = defineStore('mapFilter', () => {
  const rangeMin = ref(0);
  const rangeMax = ref(100);
  const selectedFrom = ref(0);
  const selectedTo = ref(100);
  const isEmpty = ref(false);
  const hasRealBounds = ref(false);

  const isFiltered = computed(
    () => selectedFrom.value > rangeMin.value || selectedTo.value < rangeMax.value,
  );

  const hasPhotos = computed(() => !isEmpty.value);

  function setRange(from: number, to: number): void {
    const clampedFrom = Math.max(rangeMin.value, from);
    const clampedTo = Math.min(rangeMax.value, to);
    if (clampedFrom >= clampedTo) return;
    selectedFrom.value = clampedFrom;
    selectedTo.value = clampedTo;
  }

  function resetRange(): void {
    selectedFrom.value = rangeMin.value;
    selectedTo.value = rangeMax.value;
  }

  /** Update the absolute bounds and reset selection to full range */
  function setRangeBounds(min: number, max: number): void {
    rangeMin.value = min;
    rangeMax.value = max;
    selectedFrom.value = min;
    selectedTo.value = max;
    hasRealBounds.value = true;
  }

  function setEmpty(val: boolean): void {
    isEmpty.value = val;
  }

  return {
    rangeMin, rangeMax, selectedFrom, selectedTo,
    isEmpty, hasPhotos, hasRealBounds, isFiltered,
    setRange, resetRange, setRangeBounds, setEmpty,
  };
});

