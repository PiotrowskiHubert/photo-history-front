import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useMapFilterStore = defineStore('mapFilter', () => {
  const rangeMin = ref(0);
  const rangeMax = ref(100);
  const selectedFrom = ref(0);
  const selectedTo = ref(100);

  const isFiltered = computed(
    () => selectedFrom.value > rangeMin.value || selectedTo.value < rangeMax.value,
  );

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

  return { rangeMin, rangeMax, selectedFrom, selectedTo, isFiltered, setRange, resetRange };
});

