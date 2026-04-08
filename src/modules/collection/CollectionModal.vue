<script setup lang="ts">
import BaseModal from '@/shared/components/BaseModal.vue';

defineProps<{ modelValue: boolean }>();
defineEmits<{ 'update:modelValue': [value: boolean] }>();
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="My Collection"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- content coming soon -->
  </BaseModal>
</template>

