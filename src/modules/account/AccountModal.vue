<script setup lang="ts">
import { computed, watch } from 'vue';
import BaseModal from '@/shared/components/BaseModal.vue';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { usePhotoStore } from '@/modules/photos/usePhotoStore';

const props = defineProps<{ modelValue: boolean }>();
defineEmits<{ 'update:modelValue': [value: boolean] }>();

const authStore = useAuthStore();
const photoStore = usePhotoStore();
const username = computed(() => authStore.user?.username ?? '');
const email = computed(() => authStore.user?.email ?? '');

// Refresh map whenever this modal opens or closes
watch(() => props.modelValue, () => {
  photoStore.triggerMapRefresh();
});
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="My Account"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="account-info">
      <div class="account-info-row">
        <span class="account-info-label">Username</span>
        <span class="account-info-value">{{ username }}</span>
      </div>
      <div class="account-info-row">
        <span class="account-info-label">Email</span>
        <span class="account-info-value">{{ email }}</span>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.account-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.account-info-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.account-info-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.account-info-value {
  font-size: 15px;
  color: var(--color-text-primary);
  font-weight: 500;
}
</style>
