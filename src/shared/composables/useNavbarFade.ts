import { ref, onMounted, onUnmounted } from 'vue';

export function useNavbarFade() {
  const isFaded = ref(false);
  let fadeTimer: ReturnType<typeof setTimeout> | null = null;

  function startFadeTimer(): void {
    if (fadeTimer) clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => {
      isFaded.value = true;
    }, 20000);
  }

  function resetFade(): void {
    isFaded.value = false;
    startFadeTimer();
  }

  onMounted(() => {
    startFadeTimer();
  });

  onUnmounted(() => {
    if (fadeTimer) clearTimeout(fadeTimer);
  });

  return { isFaded, resetFade };
}

