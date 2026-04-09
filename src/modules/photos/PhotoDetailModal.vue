<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import BaseModal from '@/shared/components/BaseModal.vue';
import { usePhotoStore } from '@/modules/photos/usePhotoStore';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import type { PhotoDetail } from '@/modules/photos/photo.types';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    photoIds: string[];
    editable?: boolean;
  }>(),
  { editable: false },
);
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  deleted: [id: string];
}>();

const photoStore = usePhotoStore();
const authStore = useAuthStore();
const details = ref<PhotoDetail[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const currentIndex = ref(0);

// Editable if explicitly passed OR if the current photo belongs to the logged-in user
const canEdit = computed(() => {
  if (props.editable) return true;
  const detail = details.value[currentIndex.value];
  if (!detail || !authStore.user) return false;
  return detail.userId === authStore.user.id;
});

// Refresh map whenever this modal opens or closes
watch(() => props.modelValue, () => {
  photoStore.triggerMapRefresh();
});

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
    resetEditState();
    try {
      const results = await Promise.all(
        ids.map(id => photoStore.fetchPhotoDetail(id))
      );
      // Sort by takenAt descending (newest first); missing takenAt treated as empty string
      results.sort((a, b) => (b.takenAt ?? '').localeCompare(a.takenAt ?? ''));
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

// Convert ISO datetime to YYYY-MM-DD for <input type="date">
function toDateInputValue(iso?: string): string {
  if (!iso) return '';
  return iso.substring(0, 10);
}

/* ── Edit mode state ── */
const isEditing = ref(false);
const editDescription = ref('');
const editTakenAt = ref('');
const isSaving = ref(false);
const saveError = ref<string | null>(null);
const imageFileInput = ref<HTMLInputElement | null>(null);
const isReplacingImage = ref(false);
const showDeleteConfirm = ref(false);
const isDeleting = ref(false);

function resetEditState(): void {
  isEditing.value = false;
  editDescription.value = '';
  editTakenAt.value = '';
  isSaving.value = false;
  saveError.value = null;
  isReplacingImage.value = false;
  showDeleteConfirm.value = false;
  isDeleting.value = false;
}

function startEditing(): void {
  if (!currentDetail.value) return;
  editDescription.value = currentDetail.value.description ?? '';
  editTakenAt.value = toDateInputValue(currentDetail.value.takenAt);
  saveError.value = null;
  isEditing.value = true;
}

function cancelEditing(): void {
  isEditing.value = false;
  saveError.value = null;
}

async function saveChanges(): Promise<void> {
  if (!currentDetail.value) return;
  isSaving.value = true;
  saveError.value = null;
  try {
    const desc = editDescription.value.trim() || null;
    const taken = editTakenAt.value || null;
    await photoStore.updatePhoto(currentDetail.value.id, desc, taken);
    // Update local state so the UI reflects changes immediately
    currentDetail.value.description = desc ?? undefined;
    currentDetail.value.takenAt = taken ?? undefined;
    isEditing.value = false;
  } catch {
    saveError.value = 'Failed to save changes.';
  } finally {
    isSaving.value = false;
  }
}

function triggerImageReplace(): void {
  imageFileInput.value?.click();
}

async function onImageFileSelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !currentDetail.value) return;
  isReplacingImage.value = true;
  saveError.value = null;
  try {
    await photoStore.replacePhotoImage(currentDetail.value.id, file);
    // Refetch detail to get new image URL
    const updated = await photoStore.fetchPhotoDetail(currentDetail.value.id);
    const idx = currentIndex.value;
    details.value[idx] = updated;
  } catch {
    saveError.value = 'Failed to replace image.';
  } finally {
    isReplacingImage.value = false;
    // Reset file input so same file can be selected again
    input.value = '';
  }
}

async function confirmDelete(): Promise<void> {
  if (!currentDetail.value) return;
  isDeleting.value = true;
  saveError.value = null;
  try {
    const deletedId = currentDetail.value.id;
    await photoStore.deletePhoto(deletedId);
    emit('deleted', deletedId);
    emit('update:modelValue', false);
  } catch {
    saveError.value = 'Failed to delete photo.';
  } finally {
    isDeleting.value = false;
    showDeleteConfirm.value = false;
  }
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
        <!-- Replace image button (overlay, bottom-right) -->
        <button
          v-if="canEdit && !isEditing"
          class="photo-replace-btn"
          :disabled="isReplacingImage"
          @click="triggerImageReplace"
          aria-label="Replace image"
        >
          <FontAwesomeIcon :icon="isReplacingImage ? 'spinner' : 'camera'" :spin="isReplacingImage" />
        </button>
        <input
          ref="imageFileInput"
          type="file"
          accept="image/*"
          style="display: none"
          @change="onImageFileSelected"
        />
      </div>

      <!-- Read-only meta (shown when NOT editing) -->
      <div v-if="!isEditing" class="photo-detail-meta">
        <p class="photo-detail-date">{{ formatDate(currentDetail.takenAt) }}</p>
        <p v-if="currentDetail.description" class="photo-detail-desc">{{ currentDetail.description }}</p>
        <p v-if="currentDetail.address" class="photo-detail-address">{{ currentDetail.address }}</p>
        <p class="photo-detail-author">by {{ currentDetail.uploaderUsername }}</p>
      </div>

      <!-- Edit form (shown when editing) -->
      <div v-if="isEditing" class="photo-edit-form">
        <div class="photo-edit-field">
          <label class="photo-edit-label">Description</label>
          <textarea
            v-model="editDescription"
            class="form-input photo-edit-textarea"
            rows="3"
            placeholder="Add a description…"
          />
        </div>
        <div class="photo-edit-field">
          <label class="photo-edit-label">Date taken</label>
          <input
            v-model="editTakenAt"
            type="date"
            class="form-input"
          />
        </div>
      </div>

      <!-- Save error -->
      <p v-if="saveError" class="photo-detail-error" style="padding: 0">{{ saveError }}</p>

      <!-- Action buttons (editable mode only) -->
      <div v-if="canEdit" class="photo-edit-actions">
        <template v-if="!isEditing">
          <button class="btn btn-secondary btn-sm" @click="startEditing">
            <FontAwesomeIcon icon="pen" /> Edit
          </button>
          <button class="btn btn-danger btn-sm" @click="showDeleteConfirm = true">
            <FontAwesomeIcon icon="trash" /> Delete
          </button>
        </template>
        <template v-else>
          <button class="btn btn-primary btn-sm" :disabled="isSaving" @click="saveChanges">
            {{ isSaving ? 'Saving…' : 'Save' }}
          </button>
          <button class="btn btn-secondary btn-sm" :disabled="isSaving" @click="cancelEditing">
            Cancel
          </button>
        </template>
      </div>

      <!-- Delete confirmation overlay -->
      <div v-if="showDeleteConfirm" class="photo-delete-confirm">
        <p class="photo-delete-confirm-text">Delete this photo permanently?</p>
        <div class="photo-delete-confirm-actions">
          <button class="btn btn-danger btn-sm" :disabled="isDeleting" @click="confirmDelete">
            {{ isDeleting ? 'Deleting…' : 'Yes, delete' }}
          </button>
          <button class="btn btn-secondary btn-sm" :disabled="isDeleting" @click="showDeleteConfirm = false">
            Cancel
          </button>
        </div>
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

/* ── Edit mode ── */

.photo-replace-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}

.photo-replace-btn:hover {
  background: rgba(0, 0, 0, 0.75);
}

.photo-edit-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.photo-edit-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.photo-edit-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.photo-edit-textarea {
  resize: vertical;
  min-height: 60px;
}

.photo-edit-actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 6px 14px;
  font-size: 13px;
  border-radius: var(--radius-sm);
}

.btn-secondary {
  background: rgba(128, 128, 128, 0.15);
  color: var(--color-text-primary);
  border: none;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-secondary:hover {
  background: rgba(128, 128, 128, 0.25);
}

.btn-danger {
  background: rgba(220, 53, 69, 0.8);
  color: #fff;
  border: none;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-danger:hover {
  background: rgba(220, 53, 69, 1);
}

.photo-delete-confirm {
  margin-top: 8px;
  padding: 14px;
  border-radius: var(--radius-md);
  background: rgba(220, 53, 69, 0.08);
  border: 1px solid rgba(220, 53, 69, 0.25);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.photo-delete-confirm-text {
  font-size: 14px;
  color: var(--color-text-primary);
  font-weight: 500;
}

.photo-delete-confirm-actions {
  display: flex;
  gap: 8px;
}
</style>
