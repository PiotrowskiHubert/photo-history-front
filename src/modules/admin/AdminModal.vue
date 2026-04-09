<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import BaseModal from '@/shared/components/BaseModal.vue';
import { usePhotoStore } from '@/modules/photos/usePhotoStore';
import { useAdminStore } from '@/modules/admin/useAdminStore';
import type { AdminUser, AdminPhoto } from '@/modules/admin/admin.types';

const props = defineProps<{ modelValue: boolean }>();
defineEmits<{ 'update:modelValue': [value: boolean] }>();

const photoStore = usePhotoStore();
const adminStore = useAdminStore();

// --- Tab state ---
const activeTab = ref<'users' | 'review'>('users');

// --- Users tab state ---
const users = ref<AdminUser[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// --- Review tab state ---
const reviewQueue = ref<AdminPhoto[]>([]);
const currentIndex = ref(0);
const reviewLoading = ref(false);
const reviewError = ref<string | null>(null);
const unreviewedCount = ref(0);
const actionInProgress = ref(false);

const currentPhoto = computed<AdminPhoto | null>(() =>
  currentIndex.value < reviewQueue.value.length
    ? reviewQueue.value[currentIndex.value]
    : null,
);

const remainingCount = computed(() =>
  Math.max(0, reviewQueue.value.length - currentIndex.value),
);

const allReviewed = computed(() =>
  !reviewLoading.value && reviewQueue.value.length > 0 && currentIndex.value >= reviewQueue.value.length,
);

// --- Swipe state ---
const cardRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const dragX = ref(0);
const dragY = ref(0);
const startX = ref(0);
const startY = ref(0);
const flyDirection = ref<'left' | 'right' | 'up' | null>(null);

const SWIPE_THRESHOLD_X = 80;
const SWIPE_THRESHOLD_Y = 80;

const swipeHint = computed<'reject' | 'approve' | 'ban' | null>(() => {
  if (!isDragging.value) return null;
  // Up takes priority
  if (dragY.value < -60) return 'ban';
  if (dragX.value < -60) return 'reject';
  if (dragX.value > 60) return 'approve';
  return null;
});

const cardStyle = computed(() => {
  if (flyDirection.value) {
    const offX = flyDirection.value === 'left' ? -600 : flyDirection.value === 'right' ? 600 : 0;
    const offY = flyDirection.value === 'up' ? -600 : 0;
    const rot = flyDirection.value === 'left' ? -15 : flyDirection.value === 'right' ? 15 : 0;
    return {
      transform: `translate(${offX}px, ${offY}px) rotate(${rot}deg)`,
      transition: 'transform 0.35s ease',
      opacity: '0',
    };
  }
  if (!isDragging.value) {
    return {
      transform: 'translate(0, 0) rotate(0deg)',
      transition: 'transform 0.25s ease',
    };
  }
  const rot = dragX.value * 0.08;
  return {
    transform: `translate(${dragX.value}px, ${dragY.value}px) rotate(${rot}deg)`,
    transition: 'none',
  };
});

// --- Pointer event handlers ---
function onPointerDown(e: PointerEvent) {
  if (actionInProgress.value || flyDirection.value) return;
  isDragging.value = true;
  startX.value = e.clientX;
  startY.value = e.clientY;
  dragX.value = 0;
  dragY.value = 0;
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return;
  dragX.value = e.clientX - startX.value;
  dragY.value = e.clientY - startY.value;
}

function onPointerUp() {
  if (!isDragging.value) return;
  isDragging.value = false;

  // Check thresholds — up takes priority
  if (dragY.value < -SWIPE_THRESHOLD_Y) {
    executeBan();
  } else if (dragX.value > SWIPE_THRESHOLD_X) {
    executeApprove();
  } else if (dragX.value < -SWIPE_THRESHOLD_X) {
    executeReject();
  } else {
    // Snap back
    dragX.value = 0;
    dragY.value = 0;
  }
}

// --- Keyboard shortcuts ---
function onKeyDown(e: KeyboardEvent) {
  if (!props.modelValue || activeTab.value !== 'review' || !currentPhoto.value || actionInProgress.value) return;
  if (e.key === 'ArrowLeft') { e.preventDefault(); executeReject(); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); executeApprove(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); executeBan(); }
}

onMounted(() => window.addEventListener('keydown', onKeyDown));
onUnmounted(() => window.removeEventListener('keydown', onKeyDown));

// --- Action executors ---
async function flyAndAdvance(dir: 'left' | 'right' | 'up', apiCall: () => Promise<void>) {
  if (!currentPhoto.value || actionInProgress.value) return;
  actionInProgress.value = true;
  flyDirection.value = dir;

  // Fire-and-forget API call
  try {
    await apiCall();
  } catch {
    reviewError.value = 'Action failed — skipping photo.';
  }

  // Wait for fly animation
  await new Promise(r => setTimeout(r, 350));
  flyDirection.value = null;
  dragX.value = 0;
  dragY.value = 0;

  // Advance to next
  currentIndex.value++;
  unreviewedCount.value = Math.max(0, unreviewedCount.value - 1);
  actionInProgress.value = false;
}

function executeApprove() {
  if (!currentPhoto.value) return;
  const id = currentPhoto.value.id;
  flyAndAdvance('right', () => adminStore.reviewPhoto(id));
}

function executeReject() {
  if (!currentPhoto.value) return;
  const id = currentPhoto.value.id;
  flyAndAdvance('left', () => adminStore.rejectPhoto(id));
}

function executeBan() {
  if (!currentPhoto.value) return;
  const { id, userId } = currentPhoto.value;
  flyAndAdvance('up', () => adminStore.banUserAndDelete(userId, id));
}

// --- Data loading ---
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
  currentIndex.value = 0;
  try {
    reviewQueue.value = await adminStore.fetchPhotos();
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

function formatDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Refresh map whenever this modal opens or closes
watch(() => props.modelValue, async (open) => {
  photoStore.triggerMapRefresh();
  if (!open) return;
  try {
    unreviewedCount.value = await adminStore.fetchUnreviewedCount();
  } catch { /* silent */ }
  if (activeTab.value === 'users') loadUsers();
  if (activeTab.value === 'review') loadReviewPhotos();
});

// Fetch data when switching tabs (if not already loaded)
watch(activeTab, (tab) => {
  if (tab === 'users' && users.value.length === 0) loadUsers();
  if (tab === 'review' && reviewQueue.value.length === 0) loadReviewPhotos();
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
        <span style="position: relative; z-index: 1">
          Review
          <span v-if="unreviewedCount > 0" class="review-badge">{{ unreviewedCount }}</span>
        </span>
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

      <!-- Review tab — Tinder-style -->
      <div v-else key="review" class="review-container">
        <!-- Loading -->
        <div v-if="reviewLoading" class="admin-state">Loading…</div>

        <!-- Error -->
        <div v-else-if="reviewError" class="admin-state admin-state--error">
          {{ reviewError }}
        </div>

        <!-- Empty queue (no photos at all) -->
        <div v-else-if="reviewQueue.length === 0" class="admin-state">
          No photos to review.
        </div>

        <!-- All reviewed -->
        <div v-else-if="allReviewed" class="admin-state review-done">
          <FontAwesomeIcon icon="circle-check" class="review-done-icon" />
          <span>All photos reviewed!</span>
        </div>

        <!-- Current photo card -->
        <template v-else-if="currentPhoto">
          <!-- Counter -->
          <div class="review-counter">
            {{ currentIndex + 1 }} / {{ reviewQueue.length }} remaining
          </div>

          <!-- Swipeable card -->
          <div class="review-card-area">
            <div
              ref="cardRef"
              class="review-card"
              :style="cardStyle"
              @pointerdown="onPointerDown"
              @pointermove="onPointerMove"
              @pointerup="onPointerUp"
              @pointercancel="onPointerUp"
            >
              <!-- Photo -->
              <img
                :src="currentPhoto.url"
                :alt="currentPhoto.description || 'Photo'"
                class="review-card-img"
                draggable="false"
              />

              <!-- Swipe hint overlays -->
              <Transition name="hint-fade">
                <div v-if="swipeHint === 'reject'" class="review-hint review-hint--reject">
                  <FontAwesomeIcon icon="xmark" />
                </div>
              </Transition>
              <Transition name="hint-fade">
                <div v-if="swipeHint === 'approve'" class="review-hint review-hint--approve">
                  <FontAwesomeIcon icon="check" />
                </div>
              </Transition>
              <Transition name="hint-fade">
                <div v-if="swipeHint === 'ban'" class="review-hint review-hint--ban">
                  <FontAwesomeIcon icon="gavel" />
                </div>
              </Transition>

              <!-- Bottom info overlay -->
              <div class="review-card-info">
                <strong>{{ currentPhoto.uploaderUsername }}</strong>
                <span v-if="currentPhoto.uploadedAt" class="review-card-date">
                  {{ formatDate(currentPhoto.uploadedAt) }}
                </span>
                <span v-if="currentPhoto.description" class="review-card-desc">
                  {{ currentPhoto.description }}
                </span>
              </div>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="review-actions">
            <button
              class="review-action-btn review-action-btn--reject"
              :disabled="actionInProgress"
              @click="executeReject"
              title="Reject (←)"
            >
              <FontAwesomeIcon icon="xmark" />
              <span>Reject</span>
            </button>
            <button
              class="review-action-btn review-action-btn--ban"
              :disabled="actionInProgress"
              @click="executeBan"
              title="Ban + Delete (↑)"
            >
              <FontAwesomeIcon icon="gavel" />
              <span>Ban</span>
            </button>
            <button
              class="review-action-btn review-action-btn--approve"
              :disabled="actionInProgress"
              @click="executeApprove"
              title="Approve (→)"
            >
              <FontAwesomeIcon icon="check" />
              <span>Approve</span>
            </button>
          </div>
        </template>
      </div>
    </Transition>
  </BaseModal>
</template>

<style scoped>
/* Wider modal for table and review */
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

/* Review badge on tab */
.review-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  margin-left: 6px;
  border-radius: 9px;
  background: #e53935;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  vertical-align: middle;
}

/* ===== Tinder-style review ===== */
.review-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.review-counter {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  letter-spacing: 0.04em;
  margin-bottom: 12px;
}

/* Card area — fixed height so layout doesn't jump */
.review-card-area {
  position: relative;
  width: 100%;
  max-width: 520px;
  aspect-ratio: 3 / 4;
  margin-bottom: 16px;
}

.review-card {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--color-glass-input-bg);
  cursor: grab;
  user-select: none;
  touch-action: none;
  will-change: transform;
}

.review-card:active {
  cursor: grabbing;
}

.review-card-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  pointer-events: none;
  background: #000;
}

/* Swipe hint overlays */
.review-hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64px;
  font-weight: 900;
  pointer-events: none;
  border-radius: var(--radius-sm);
}

.review-hint--reject {
  background: rgba(229, 57, 53, 0.35);
  color: #fff;
  border: 3px solid #e53935;
}

.review-hint--approve {
  background: rgba(67, 160, 71, 0.35);
  color: #fff;
  border: 3px solid #43a047;
}

.review-hint--ban {
  background: rgba(251, 192, 45, 0.35);
  color: #fff;
  border: 3px solid #fbc02d;
}

.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: opacity 0.12s ease;
}

.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
}

/* Bottom info overlay on card */
.review-card-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 14px 16px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 2px;
  pointer-events: none;
}

.review-card-info strong {
  font-size: 14px;
}

.review-card-date {
  font-size: 11px;
  opacity: 0.75;
}

.review-card-desc {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Action buttons */
.review-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.review-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    opacity 0.15s ease;
  color: #fff;
}

.review-action-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.review-action-btn:not(:disabled):hover {
  transform: scale(1.06);
}

.review-action-btn:not(:disabled):active {
  transform: scale(0.96);
}

.review-action-btn--reject {
  background: #e53935;
  box-shadow: 0 2px 10px rgba(229, 57, 53, 0.35);
}

.review-action-btn--approve {
  background: #43a047;
  box-shadow: 0 2px 10px rgba(67, 160, 71, 0.35);
}

.review-action-btn--ban {
  background: #f9a825;
  color: #333;
  box-shadow: 0 2px 10px rgba(249, 168, 37, 0.35);
}

/* All-done state */
.review-done {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 64px 0;
}

.review-done-icon {
  font-size: 48px;
  color: #43a047;
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
