<script setup lang="ts">
import { ref } from 'vue';
import { useTagFilterStore } from '@/modules/map/useTagFilterStore';
import { usePhotoStore } from '@/modules/photos/usePhotoStore';

const tagFilterStore = useTagFilterStore();
const photoStore = usePhotoStore();
const tagSearchQuery = ref('');

function submitTagSearch(): void {
  const raw = tagSearchQuery.value;
  const parsed = raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (parsed.length > 0) {
    tagFilterStore.setTags(parsed);
  } else {
    tagFilterStore.clearTags();
  }
  photoStore.triggerMapRefresh();
}

function removeFilterTag(index: number): void {
  const updated = [...tagFilterStore.activeTags];
  updated.splice(index, 1);
  if (updated.length > 0) {
    tagFilterStore.setTags(updated);
  } else {
    tagFilterStore.clearTags();
  }
  tagSearchQuery.value = updated.join(' ');
  photoStore.triggerMapRefresh();
}

function clearAll(): void {
  tagFilterStore.clearTags();
  tagSearchQuery.value = '';
  photoStore.triggerMapRefresh();
}
</script>

<template>
  <Teleport to="body">
    <div class="tag-search-island">
      <div class="tag-search-input-row">
        <FontAwesomeIcon icon="magnifying-glass" class="tag-search-icon" />
        <input
          v-model="tagSearchQuery"
          class="tag-search-input"
          placeholder="Filter by tags…"
          @keydown.enter="submitTagSearch"
        />
        <button
          v-if="tagFilterStore.activeTags.length"
          class="tag-search-clear-btn"
          type="button"
          aria-label="Clear tags"
          @click="clearAll"
        >&times;</button>
      </div>
      <div v-if="tagFilterStore.activeTags.length" class="tag-search-chips">
        <span v-for="(tag, idx) in tagFilterStore.activeTags" :key="idx" class="tag-search-chip">
          <span class="tag-search-chip-text">{{ tag }}</span>
          <button class="tag-search-chip-remove" type="button" @click="removeFilterTag(idx)">&times;</button>
        </span>
      </div>
    </div>
  </Teleport>
</template>

