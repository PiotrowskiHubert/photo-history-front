<script setup lang="ts">
import BaseModal from '@/shared/components/BaseModal.vue';

defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Photo"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p style="color: var(--color-text-secondary); font-size: 14px; text-align: center; padding: 24px 0;">
      Coming soon…
    </p>
  </BaseModal>
</template>

