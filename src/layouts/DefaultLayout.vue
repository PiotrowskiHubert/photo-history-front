<script setup lang="ts">
import NavbarIsland from '@/shared/components/NavbarIsland.vue';
import TagSearchIsland from '@/shared/components/TagSearchIsland.vue';
import TimelineIsland from '@/modules/map/TimelineIsland.vue';
import type { NavItem, NavOverlayItem } from '@/shared/types/navbar.types';
import { useThemeStore } from '@/modules/theme/useThemeStore';
import { useMapOverlayStore } from '@/modules/map/useMapOverlayStore';
import { storeToRefs } from 'pinia';

const themeStore = useThemeStore();
themeStore.syncWithLayer('dark');

const { isTimelineEnabled, isTagSearchEnabled } = storeToRefs(useMapOverlayStore());

const navItems: NavItem[] = [
  { id: 'classic',   label: 'Classic',   icon: 'map',       layerId: 'classic' },
  { id: 'dark',      label: 'Dark',      icon: 'moon',      layerId: 'dark' },
  // { id: 'satellite', label: 'Satellite', icon: 'satellite',  layerId: 'satellite' },
];

const overlayItems: NavOverlayItem[] = [
  { id: 'overlay-a', label: 'Timeline', icon: '' },
  { id: 'overlay-tags', label: 'Tags', icon: 'tag' },
  // { id: 'overlay-b', label: 'Overlay B', icon: 'map-pin' },
  // { id: 'overlay-c', label: 'Overlay C', icon: 'compass' },
];
</script>

<template>
  <NavbarIsland :items="navItems" :overlays="overlayItems" initial-active-id="dark" />
  <TagSearchIsland v-if="isTagSearchEnabled" />
  <TimelineIsland v-if="isTimelineEnabled" />
  <main class="w-full h-screen overflow-hidden">
    <slot />
  </main>
</template>
