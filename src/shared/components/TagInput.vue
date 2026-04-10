<script setup lang="ts">
import { ref } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: string[];
    placeholder?: string;
  }>(),
  {
    placeholder: 'Add tag, e.g. #Mural',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const inputValue = ref('');

function addTag(): void {
  const tag = inputValue.value.trim();
  if (!tag) return;
  // Ignore duplicates (case-insensitive)
  const isDuplicate = props.modelValue.some(
    (t) => t.toLowerCase() === tag.toLowerCase(),
  );
  if (isDuplicate) {
    inputValue.value = '';
    return;
  }
  emit('update:modelValue', [...props.modelValue, tag]);
  inputValue.value = '';
}

function removeTag(index: number): void {
  const updated = [...props.modelValue];
  updated.splice(index, 1);
  emit('update:modelValue', updated);
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    addTag();
  }
}
</script>

<template>
  <div class="tag-input-wrapper">
    <div v-if="modelValue.length" class="tag-chips">
      <span v-for="(tag, idx) in modelValue" :key="idx" class="tag-chip">
        <span class="tag-chip-text">{{ tag }}</span>
        <button class="tag-chip-remove" type="button" @click="removeTag(idx)">&times;</button>
      </span>
    </div>
    <input
      v-model="inputValue"
      class="form-input tag-input-field"
      :placeholder="placeholder"
      @keydown="onKeydown"
    />
  </div>
</template>

<style scoped>
.tag-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: var(--radius-sm);
  background: var(--color-glass-input-bg);
  border: 1px solid var(--color-island-border);
  color: var(--color-text-primary);
  font-size: 13px;
  line-height: 1.4;
}

.tag-chip-text {
  white-space: nowrap;
}

.tag-chip-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  border-radius: 50%;
  transition: color var(--transition-fast), background var(--transition-fast);
}

.tag-chip-remove:hover {
  color: var(--color-text-primary);
  background: rgba(128, 128, 128, 0.15);
}

.tag-input-field {
  width: 100%;
}
</style>

