import { ref } from 'vue';

export function useNavbarPill() {
  const pillStyle = ref({
    left: '0px',
    top: '0px',
    width: '0px',
    height: '0px',
  });

  function updatePill(el: HTMLElement | undefined): void {
    if (!el) return;
    pillStyle.value = {
      left: `${el.offsetLeft}px`,
      top: `${el.offsetTop}px`,
      width: `${el.offsetWidth}px`,
      height: `${el.offsetHeight}px`,
    };
  }

  return { pillStyle, updatePill };
}

