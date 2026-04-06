<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import type { ContextMenuItem } from '@/shared/types/context-menu.types';
import { useContextMenu } from '@/modules/map/useContextMenu';

defineProps<{ items: ContextMenuItem[] }>();

const { visible, position, close } = useContextMenu();

// Close on Escape key
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close();
}

// Close on click outside
function onMousedown(e: MouseEvent) {
  const menu = document.querySelector('.ctx-menu');
  if (menu && !menu.contains(e.target as Node)) {
    close();
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown);
  document.addEventListener('mousedown', onMousedown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown);
  document.removeEventListener('mousedown', onMousedown);
});

function handleAction(item: ContextMenuItem) {
  item.action();
  close();
}
</script>

<template>
  <Transition name="ctx-pop">
    <div
      v-if="visible"
      class="ctx-menu"
      :style="{ top: `${position.y}px`, left: `${position.x}px` }"
    >
      <template v-for="(item, index) in items" :key="index">
        <div v-if="item.separator" class="ctx-menu-separator" />
        <div
          class="ctx-menu-item"
          :class="{ danger: item.danger }"
          @click="handleAction(item)"
        >
          <FontAwesomeIcon :icon="item.icon" />
          <span>{{ item.label }}</span>
        </div>
      </template>
    </div>
  </Transition>
</template>

<style scoped>
:global(.ctx-pop-enter-active) {
  transition: opacity 180ms ease, transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
:global(.ctx-pop-leave-active) {
  transition: opacity 120ms ease, transform 120ms ease;
}
:global(.ctx-pop-enter-from) {
  opacity: 0;
  transform: scale(0.88) translateY(-6px);
  transform-origin: top left;
}
:global(.ctx-pop-leave-to) {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
  transform-origin: top left;
}
</style>

