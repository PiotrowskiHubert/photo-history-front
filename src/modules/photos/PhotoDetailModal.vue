<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import BaseModal from '@/shared/components/BaseModal.vue';
import { usePhotoStore } from '@/modules/photos/usePhotoStore';
import type { PhotoDetail } from '@/modules/photos/photo.types';

const props = defineProps<{
  modelValue: boolean;
  photoIds: string[];
}>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();

const photoStore = usePhotoStore();
const details = ref<PhotoDetail[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const currentIndex = ref(0);

// Dynamic title — "Photo" for single, "Photos (N)" for multiple
const modalTitle = computed(() =>
  details.value.length > 1 ? `Photos (${details.value.length})` : 'Photo'
);

// Currently displayed photo
const currentDetail = computed(() => details.value[currentIndex.value] ?? null);

function prevPhoto() {
  currentIndex.value = Math.max(0, currentIndex.value - 1);
}

function nextPhoto() {
  currentIndex.value = Math.min(details.value.length - 1, currentIndex.value + 1);
}

// Fetch details whenever the id array changes
watch(
  () => props.photoIds,
  async (ids) => {
    if (!ids || ids.length === 0) return;
    loading.value = true;
    error.value = null;
    details.value = [];
    currentIndex.value = 0;
    try {
      const results = await Promise.all(
        ids.map(id => photoStore.fetchPhotoDetail(id))
      );
      // Sort by takenAt ascending (oldest first); missing takenAt treated as empty string
      results.sort((a, b) => (a.takenAt ?? '').localeCompare(b.takenAt ?? ''));
      details.value = results;
      currentIndex.value = 0;
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
    :title="modalTitle"
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

    <!-- Content — single-photo carousel -->
    <div v-else-if="currentDetail" class="photo-detail">
      <!-- Image wrapper with overlay navigation arrows -->
      <div class="photo-detail-img-wrapper">
        <img
          :src="currentDetail.url"
          :alt="currentDetail.description || 'Photo'"
          class="photo-detail-img"
        />
        <!-- Left arrow -->
        <button
          v-if="details.length > 1 && currentIndex > 0"
          class="carousel-arrow carousel-arrow--left"
          @click="prevPhoto"
          aria-label="Previous photo"
        >‹</button>
        <!-- Right arrow -->
        <button
          v-if="details.length > 1 && currentIndex < details.length - 1"
          class="carousel-arrow carousel-arrow--right"
          @click="nextPhoto"
          aria-label="Next photo"
        >›</button>
        <!-- Position indicator -->
        <span v-if="details.length > 1" class="carousel-indicator">
          {{ currentIndex + 1 }} / {{ details.length }}
        </span>
      </div>

      <div class="photo-detail-meta">
        <p class="photo-detail-date">{{ formatDate(currentDetail.takenAt) }}</p>
        <p v-if="currentDetail.description" class="photo-detail-desc">{{ currentDetail.description }}</p>
        <p v-if="currentDetail.address" class="photo-detail-address">{{ currentDetail.address }}</p>
        <p class="photo-detail-author">by {{ currentDetail.uploaderUsername }}</p>
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

.photo-detail-img-wrapper {
  position: relative;
}

.photo-detail-img {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-island-border);
  display: block;
}

.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 20px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}

.carousel-arrow:hover {
  background: rgba(0, 0, 0, 0.7);
}

.carousel-arrow--left {
  left: 8px;
}

.carousel-arrow--right {
  right: 8px;
}

.carousel-indicator {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 10px;
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
