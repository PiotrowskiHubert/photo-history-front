<script setup lang="ts">
import { ref, watch } from 'vue';
import BaseModal from '@/shared/components/BaseModal.vue';
import { usePhotoStore } from '@/modules/photos/usePhotoStore';
import type { UserPhoto } from '@/modules/photos/photo.types';

const props = defineProps<{ modelValue: boolean }>();
defineEmits<{ 'update:modelValue': [value: boolean] }>();

const photoStore = usePhotoStore();
const photos = ref<UserPhoto[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// Fetch user photos whenever the modal opens
watch(() => props.modelValue, async (open) => {
  if (!open) return;
  loading.value = true;
  error.value = null;
  photos.value = [];
  try {
    photos.value = await photoStore.fetchMyPhotos();
  } catch {
    error.value = 'Failed to load collection.';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="My Collection"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- Loading -->
    <div v-if="loading" class="collection-loading">Loading…</div>

    <!-- Error -->
    <div v-else-if="error" class="collection-error">{{ error }}</div>

    <!-- Empty -->
    <div v-else-if="photos.length === 0" class="collection-empty">
      No photos yet.
    </div>

    <!-- Grid -->
    <div v-else class="collection-grid">
      <div
        v-for="photo in photos"
        :key="photo.id"
        class="collection-tile"
      >
        <img
          :src="photo.thumbnailUrl"
          :alt="photo.description || 'Photo'"
          class="collection-tile-img"
        />
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
/* Wider modal for the 8-column grid */
:deep(.modal-window) {
  width: 70%;
  max-width: 1100px;
}

.collection-loading,
.collection-error,
.collection-empty {
  text-align: center;
  padding: 32px 0;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.collection-error {
  color: var(--color-danger);
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
}

.collection-tile {
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--color-glass-input-bg);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.collection-tile:hover {
  opacity: 0.85;
}

.collection-tile-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
