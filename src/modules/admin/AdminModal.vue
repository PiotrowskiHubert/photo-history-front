<script setup lang="ts">
import { ref, watch } from 'vue';
import BaseModal from '@/shared/components/BaseModal.vue';
import PhotoDetailModal from '@/modules/photos/PhotoDetailModal.vue';
import { usePhotoStore } from '@/modules/photos/usePhotoStore';
import { useAdminStore } from '@/modules/admin/useAdminStore';
import type { AdminUser, AdminPhoto } from '@/modules/admin/admin.types';

const props = defineProps<{ modelValue: boolean }>();
defineEmits<{ 'update:modelValue': [value: boolean] }>();

const photoStore = usePhotoStore();
const adminStore = useAdminStore();

const activeTab = ref<'users' | 'review'>('users');
const users = ref<AdminUser[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// Review tab state
const reviewPhotos = ref<AdminPhoto[]>([]);
const reviewLoading = ref(false);
const reviewError = ref<string | null>(null);
const selectedReviewPhotoId = ref<string | null>(null);

async function loadUsers(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    users.value = await adminStore.fetchUsers();
  } catch {
    error.value = 'Failed to load users.';
  } finally {
    loading.value = false;
  }
}

async function loadReviewPhotos(): Promise<void> {
  reviewLoading.value = true;
  reviewError.value = null;
  try {
    reviewPhotos.value = await adminStore.fetchPhotos();
  } catch {
    reviewError.value = 'Failed to load photos.';
  } finally {
    reviewLoading.value = false;
  }
}

function formatLastSeen(iso?: string): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Refresh map whenever this modal opens or closes
watch(() => props.modelValue, (open) => {
  photoStore.triggerMapRefresh();
  if (!open) return;
  // Fetch users on open if on users tab
  if (activeTab.value === 'users') {
    loadUsers();
  }
  // Fetch review photos on open if on review tab
  if (activeTab.value === 'review') {
    loadReviewPhotos();
  }
});

// Fetch data when switching tabs (if not already loaded)
watch(activeTab, (tab) => {
  if (tab === 'users' && users.value.length === 0) {
    loadUsers();
  }
  if (tab === 'review' && reviewPhotos.value.length === 0) {
    loadReviewPhotos();
  }
});
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Admin Panel"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- Tab switcher -->
    <div class="admin-tabs">
      <button
        class="admin-tab"
        :class="{ 'is-active': activeTab === 'users' }"
        @click="activeTab = 'users'"
      >
        <span v-if="activeTab === 'users'" class="admin-tab-pill" />
        <span style="position: relative; z-index: 1">Users</span>
      </button>
      <button
        class="admin-tab"
        :class="{ 'is-active': activeTab === 'review' }"
        @click="activeTab = 'review'"
      >
        <span v-if="activeTab === 'review'" class="admin-tab-pill" />
        <span style="position: relative; z-index: 1">Review</span>
      </button>
    </div>

    <Transition name="admin-tab-fade" mode="out-in">
      <!-- Users tab -->
      <div v-if="activeTab === 'users'" key="users">
        <div v-if="loading" class="admin-state">Loading…</div>
        <div v-else-if="error" class="admin-state admin-state--error">{{ error }}</div>
        <div v-else-if="users.length === 0" class="admin-state">No users found.</div>
        <div v-else class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Last seen</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.username }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <span
                    class="admin-role-badge"
                    :class="`admin-role-badge--${user.role.toLowerCase()}`"
                  >
                    {{ user.role }}
                  </span>
                </td>
                <td>{{ formatLastSeen(user.lastLoginAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Review tab -->
      <div v-else key="review">
        <!-- Loading -->
        <div v-if="reviewLoading" class="admin-state">Loading…</div>

        <!-- Error -->
        <div v-else-if="reviewError" class="admin-state admin-state--error">
          {{ reviewError }}
        </div>

        <!-- Empty -->
        <div v-else-if="reviewPhotos.length === 0" class="admin-state">
          No photos yet.
        </div>

        <!-- Grid -->
        <div v-else class="review-grid">
          <div
            v-for="photo in reviewPhotos"
            :key="photo.id"
            class="review-tile"
            @click="selectedReviewPhotoId = photo.id"
          >
            <img
              :src="photo.thumbnailUrl"
              :alt="photo.description || 'Photo'"
              class="review-tile-img"
            />
            <span class="review-tile-author">{{ photo.uploaderUsername }}</span>
          </div>
        </div>

        <!-- Photo detail modal — read-only, no editable prop -->
        <PhotoDetailModal
          :model-value="selectedReviewPhotoId !== null"
          :photo-ids="selectedReviewPhotoId ? [selectedReviewPhotoId] : []"
          @update:model-value="(val: boolean) => { if (!val) selectedReviewPhotoId = null }"
        />
      </div>
    </Transition>
  </BaseModal>
</template>

<style scoped>
/* Wider modal for table and review grid */
:deep(.modal-window) {
  width: 900px;
  max-width: 95vw;
}

/* Tabs — same pattern as AuthModal */
.admin-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
}

.admin-tab {
  position: relative;
  padding: 7px 18px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: color var(--transition-fast);
  overflow: hidden;
}

.admin-tab.is-active {
  color: var(--color-text-primary);
}

.admin-tab-pill {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-sm);
  background: var(--color-glass-bg);
  border: 1px solid var(--color-island-border);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 0;
}

/* Table */
.admin-table-wrapper {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.admin-table th {
  text-align: left;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-island-border);
}

.admin-table td {
  padding: 10px 12px;
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-island-border);
  white-space: nowrap;
}

.admin-table tbody tr:last-child td {
  border-bottom: none;
}

.admin-table tbody tr:hover td {
  background: var(--color-glass-input-bg);
}

/* Role badge */
.admin-role-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.admin-role-badge--user {
  background: rgba(99, 179, 237, 0.15);
  color: #63b3ed;
}

.admin-role-badge--admin {
  background: rgba(154, 117, 234, 0.15);
  color: #9a75ea;
}

.admin-role-badge--system {
  background: rgba(237, 137, 54, 0.15);
  color: #ed8936;
}

/* State messages */
.admin-state {
  text-align: center;
  padding: 32px 0;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.admin-state--error {
  color: var(--color-danger);
}

/* Review grid */
.review-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.review-tile {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--color-glass-input-bg);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.review-tile:hover {
  opacity: 0.85;
}

.review-tile-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.review-tile-author {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 3px 5px;
  font-size: 9px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(transparent, rgba(0,0,0,0.6));
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

/* Tab fade transition */
.admin-tab-fade-enter-active,
.admin-tab-fade-leave-active {
  transition: opacity 0.15s ease;
}

.admin-tab-fade-enter-from,
.admin-tab-fade-leave-to {
  opacity: 0;
}
</style>
