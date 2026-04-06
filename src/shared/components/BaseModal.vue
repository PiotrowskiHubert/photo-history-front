<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import type { ModalProps } from '@/shared/types/modal.types';

defineProps<ModalProps>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();

function close() {
  emit('update:modelValue', false);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close();
}

onMounted(() => globalThis.addEventListener('keydown', onKeydown));
onUnmounted(() => globalThis.removeEventListener('keydown', onKeydown));
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @mousedown.self="close">
        <div class="modal-window">
          <p class="modal-title">{{ title }}</p>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active {
  transition: opacity var(--transition-base), transform var(--transition-base);
}

.modal-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>

