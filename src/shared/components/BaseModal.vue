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
          <div class="modal-header">
            <p class="modal-title">{{ title }}</p>
            <button class="modal-close-btn" aria-label="Close" @click="close">
              <FontAwesomeIcon icon="xmark" />
            </button>
          </div>
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

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

/* Override modal-title margin since it's now inside the header */
.modal-header .modal-title {
  margin-bottom: 0;
}

.modal-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
}

.modal-close-btn:hover {
  background: rgba(128, 128, 128, 0.12);
  color: var(--color-text-primary);
}

.modal-close-btn:active {
  background: rgba(128, 128, 128, 0.22);
  transform: scale(0.94);
}
</style>

