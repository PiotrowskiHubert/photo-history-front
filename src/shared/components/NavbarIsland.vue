<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue';
import type { NavItem, NavOverlayItem } from '@/shared/types/navbar.types';
import { useNavbarPill } from '@/shared/composables/useNavbarPill';
import { useMapLayerStore } from '@/modules/map/useMapLayerStore';
import { useMapOverlayStore } from '@/modules/map/useMapOverlayStore';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import AuthModal from '@/modules/auth/AuthModal.vue';
import AccountModal from '@/modules/account/AccountModal.vue';
import CollectionModal from '@/modules/collection/CollectionModal.vue';
import AdminModal from '@/modules/admin/AdminModal.vue';

const props = withDefaults(
  defineProps<{
    items: NavItem[];
    overlays?: NavOverlayItem[];
    initialActiveId?: string;
    showAuth?: boolean;
  }>(),
  {
    overlays: () => [],
    showAuth: true,
  },
);

const activeId = ref(props.initialActiveId ?? props.items[0].id);
const navRefs = new Map<string, HTMLElement>();

const { pillStyle, updatePill } = useNavbarPill();
const { setLayer } = useMapLayerStore();
const overlayStore = useMapOverlayStore();
const authStore = useAuthStore();

const isAuthModalOpen = ref(false);
const authInitialTab = ref<'sign-in' | 'sign-up'>('sign-in');
const showAccountModal = ref(false);
const showCollectionModal = ref(false);
const showAdminModal = ref(false);


function openAuth(tab: 'sign-in' | 'sign-up'): void {
  authInitialTab.value = tab;
  isAuthModalOpen.value = true;
}

function selectItem(id: string): void {
  activeId.value = id;
  const item = props.items.find((i) => i.id === id);
  if (item?.layerId) setLayer(item.layerId);
  nextTick(() => updatePill(navRefs.get(id)));
}

onMounted(() => {
  nextTick(() => updatePill(navRefs.get(activeId.value)));
});

onUnmounted(() => {
  navRefs.clear();
});
</script>

<template>
  <Teleport to="body">
    <nav class="navbar-island">
      <div class="navbar-pill" :style="pillStyle" />
      <div
        v-for="item in items"
        :key="item.id"
        class="navbar-item"
        :class="{ 'is-active': activeId === item.id }"
        :ref="(el) => { if (el) navRefs.set(item.id, el as HTMLElement) }"
        @click="selectItem(item.id)"
      >
        <FontAwesomeIcon :icon="item.icon" />
        <span>{{ item.label }}</span>
      </div>

      <!-- Divider — only render if overlays exist -->
      <div v-if="props.overlays?.length" class="navbar-divider" />

      <!-- Toggle overlay buttons -->
      <button
        v-for="overlay in props.overlays"
        :key="overlay.id"
        class="navbar-toggle"
        :class="{ 'is-active': overlayStore.activeOverlayIds.includes(overlay.id) }"
        @click="overlayStore.toggleOverlay(overlay.id)"
      >
        <!-- Pill shown only when active — same glass style as navbar-pill -->
        <span
          v-if="overlayStore.activeOverlayIds.includes(overlay.id)"
          class="navbar-toggle-pill"
        />
        <FontAwesomeIcon :icon="overlay.icon" />
        {{ overlay.label }}
      </button>

      <!-- Auth section -->
      <template v-if="showAuth">
        <div class="navbar-divider" />

        <!-- Logged out state -->
        <template v-if="!authStore.isLoggedIn">
          <button class="navbar-auth-btn navbar-auth-btn--ghost" @click="openAuth('sign-in')">
            Sign In
          </button>
          <button class="navbar-auth-btn navbar-auth-btn--primary" @click="openAuth('sign-up')">
            Sign Up
          </button>
        </template>

        <!-- Logged in state -->
        <template v-else>
          <button class="navbar-auth-btn navbar-auth-btn--ghost" @click="showAccountModal = true">
            My Account
          </button>
          <button class="navbar-auth-btn navbar-auth-btn--ghost" @click="showCollectionModal = true">
            My Collection
          </button>
          <button
            v-if="authStore.isAdmin"
            class="navbar-auth-btn navbar-auth-btn--ghost"
            @click="showAdminModal = true"
          >
            Admin
          </button>
          <button class="navbar-auth-btn navbar-auth-btn--ghost" @click="authStore.signOut()">
            Log Out
          </button>
        </template>

        <AuthModal
          v-model="isAuthModalOpen"
          :initial-tab="authInitialTab"
        />
        <AccountModal v-model="showAccountModal" />
        <CollectionModal v-model="showCollectionModal" />
        <AdminModal v-model="showAdminModal" />
      </template>
    </nav>
  </Teleport>
</template>

