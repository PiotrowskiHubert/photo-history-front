import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useTagFilterStore = defineStore('tagFilter', () => {
  const activeTags = ref<string[]>([]);

  const isFiltered = computed(() => activeTags.value.length > 0);

  function setTags(tags: string[]): void {
    activeTags.value = tags;
  }

  function clearTags(): void {
    activeTags.value = [];
  }

  return { activeTags, isFiltered, setTags, clearTags };
});

