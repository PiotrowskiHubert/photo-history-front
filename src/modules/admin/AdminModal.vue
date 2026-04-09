<script setup lang="ts">
import { watch } from 'vue';
import BaseModal from '@/shared/components/BaseModal.vue';
import { usePhotoStore } from '@/modules/photos/usePhotoStore';

const props = defineProps<{ modelValue: boolean }>();
defineEmits<{ 'update:modelValue': [value: boolean] }>();

const photoStore = usePhotoStore();

// Refresh map whenever this modal opens or closes
watch(() => props.modelValue, () => {
  photoStore.triggerMapRefresh();
});
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Admin Panel"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <p class="admin-placeholder">Admin features coming soon.</p>
  </BaseModal>
</template>

<style scoped>
.admin-placeholder {
  font-size: 14px;
  color: var(--color-text-secondary);
  text-align: center;
  padding: 32px 0;
}
</style>

