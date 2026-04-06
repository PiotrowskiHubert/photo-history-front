import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export type Theme = 'light' | 'dark';

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>('dark');

  const isDark = computed(() => theme.value === 'dark');
  const isLight = computed(() => theme.value === 'light');

  function setTheme(t: Theme): void {
    theme.value = t;
    document.documentElement.dataset.theme = t;
  }

  function syncWithLayer(layerId: string): void {
    if (layerId === 'dark') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }

  return { theme, isDark, isLight, setTheme, syncWithLayer };
});

