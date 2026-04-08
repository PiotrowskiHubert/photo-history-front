<script setup lang="ts">
import { ref, watch } from 'vue';
import BaseModal from '@/shared/components/BaseModal.vue';
import { usePhotoStore } from '@/modules/photos/usePhotoStore';
import type { PhotoDetail } from '@/modules/photos/photo.types';

const props = defineProps<{
  modelValue: boolean;
  photoId: string | null;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();

const photoStore = usePhotoStore();
const detail = ref<PhotoDetail | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// Fetch detail whenever the modal opens with a valid photoId
watch(
  () => props.photoId,
  async (id) => {
    if (!id) return;
    loading.value = true;
    error.value = null;
    detail.value = null;
    try {
      detail.value = await photoStore.fetchPhotoDetail(id);
    } catch {
      error.value = 'Failed to load photo.';
    } finally {
      loading.value = false;
    }
  }
);

function formatDate(iso?: string): string {
  if (!iso) return 'Unknown date';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Photo"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <!-- Loading state -->
    <div v-if="loading" class="photo-detail-loading">
      Loading…
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="photo-detail-error">
      {{ error }}
    </div>

    <!-- Content -->
    <div v-else-if="detail" class="photo-detail">
      <img
        :src="detail.url"
        :alt="detail.description || 'Photo'"
        class="photo-detail-img"
      />
      <div class="photo-detail-meta">
        <p class="photo-detail-date">{{ formatDate(detail.takenAt) }}</p>
        <p v-if="detail.description" class="photo-detail-desc">{{ detail.description }}</p>
        <p v-if="detail.address" class="photo-detail-address">{{ detail.address }}</p>
        <p class="photo-detail-author">by {{ detail.uploaderUsername }}</p>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.photo-detail-loading,
.photo-detail-error {
  color: var(--color-text-secondary);
  font-size: 14px;
  text-align: center;
  padding: 24px 0;
}

.photo-detail-error {
  color: var(--color-danger);
}

.photo-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.photo-detail-img {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-island-border);
}

.photo-detail-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.photo-detail-date {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.photo-detail-desc {
  font-size: 14px;
  color: var(--color-text-primary);
  line-height: 1.5;
}

.photo-detail-address {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.photo-detail-author {
  font-size: 12px;
  color: var(--color-text-tertiary);
  font-style: italic;
}
</style>
