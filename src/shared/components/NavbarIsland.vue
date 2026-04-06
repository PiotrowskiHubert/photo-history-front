<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue';
import type { NavItem, NavOverlayItem } from '@/shared/types/navbar.types';
import { useNavbarPill } from '@/shared/composables/useNavbarPill';
import { useMapLayerStore } from '@/modules/map/useMapLayerStore';
import { useMapOverlayStore } from '@/modules/map/useMapOverlayStore';

const props = withDefaults(
  defineProps<{
    items: NavItem[];
    overlays?: NavOverlayItem[];
    initialActiveId?: string;
  }>(),
  {
    overlays: () => [],
  },
);

const activeId = ref(props.initialActiveId ?? props.items[0].id);
const navRefs = new Map<string, HTMLElement>();

const { pillStyle, updatePill } = useNavbarPill();
const { setLayer } = useMapLayerStore();
const overlayStore = useMapOverlayStore();

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
    </nav>
  </Teleport>
</template>

