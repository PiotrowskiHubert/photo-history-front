<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useMapFilterStore } from '@/modules/map/useMapFilterStore';
import type { TimelineTick } from '@/shared/types/timeline.types';

const store = useMapFilterStore();
const { selectedFrom, selectedTo, rangeMin, rangeMax, isEmpty } = storeToRefs(store);

// Disabled state when no photos are on the map
const isDisabled = computed(() => isEmpty.value);

const axisRef = ref<HTMLElement | null>(null);
const scrollContainerRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);

// Prevent horizontal wheel events from propagating to the page
function onWheel(e: WheelEvent) {
  const el = scrollContainerRef.value;
  if (el && el.scrollWidth > el.clientWidth) {
    e.preventDefault();
  }
}

onMounted(() => {
  scrollContainerRef.value?.addEventListener('wheel', onWheel, { passive: false });
});

onUnmounted(() => {
  scrollContainerRef.value?.removeEventListener('wheel', onWheel);
});

const ticks = computed<TimelineTick[]>(() => {
  const result: TimelineTick[] = [];
  for (let v = rangeMin.value; v <= rangeMax.value; v += 0.5) {
    const isMajor  = Number.isInteger(v) && v % 10 === 0;
    const isMinor  = Number.isInteger(v) && v % 5 === 0 && !isMajor;
    const isWhole  = Number.isInteger(v) && !isMajor && !isMinor;
    const isMicro  = !Number.isInteger(v);   // 0.5 steps between integers
    result.push({ value: v, isMajor, isMinor, isWhole, isMicro });
  }
  return result;
});

// Inline width for the track so it scrolls when range > 100 years
const trackWidth = computed(() => {
  const yearCount = rangeMax.value - rangeMin.value + 1;
  return `${yearCount * 28}px`;
});

function showLabelFor(value: number): boolean {
  if (!Number.isInteger(value)) return false;
  if (value === rangeMin.value || value === rangeMax.value) return true;
  return value % 10 === 0;
}

function valueToPercent(value: number): number {
  return ((value - rangeMin.value) / (rangeMax.value - rangeMin.value)) * 100;
}

function percentToValue(percent: number): number {
  const raw = (percent / 100) * (rangeMax.value - rangeMin.value) + rangeMin.value;
  return Math.round(Math.min(rangeMax.value, Math.max(rangeMin.value, raw)));
}

function snapToTick(value: number): number {
  return Math.round(value);
}

function startDragFrom(e: PointerEvent): void {
  const target = e.currentTarget as HTMLElement;
  target.setPointerCapture(e.pointerId);

  const onMove = (ev: PointerEvent) => {
    isDragging.value = true;
    if (!axisRef.value) return;
    const rect = axisRef.value.getBoundingClientRect();
    const percent = ((ev.clientX - rect.left) / rect.width) * 100;
    let newFrom = snapToTick(percentToValue(percent));
    newFrom = Math.max(rangeMin.value, Math.min(newFrom, selectedTo.value - 1));
    store.setRange(newFrom, selectedTo.value);
  };

  const onUp = () => {
    target.releasePointerCapture(e.pointerId);
    target.removeEventListener('pointermove', onMove);
    target.removeEventListener('pointerup', onUp);
    setTimeout(() => { isDragging.value = false; }, 0);
  };

  target.addEventListener('pointermove', onMove);
  target.addEventListener('pointerup', onUp);
}

function startDragTo(e: PointerEvent): void {
  const target = e.currentTarget as HTMLElement;
  target.setPointerCapture(e.pointerId);

  const onMove = (ev: PointerEvent) => {
    isDragging.value = true;
    if (!axisRef.value) return;
    const rect = axisRef.value.getBoundingClientRect();
    const percent = ((ev.clientX - rect.left) / rect.width) * 100;
    let newTo = snapToTick(percentToValue(percent));
    newTo = Math.min(rangeMax.value, Math.max(newTo, selectedFrom.value + 1));
    store.setRange(selectedFrom.value, newTo);
  };

  const onUp = () => {
    target.releasePointerCapture(e.pointerId);
    target.removeEventListener('pointermove', onMove);
    target.removeEventListener('pointerup', onUp);
    setTimeout(() => { isDragging.value = false; }, 0);
  };

  target.addEventListener('pointermove', onMove);
  target.addEventListener('pointerup', onUp);
}

/* Click-to-set: left click → set From, right click → set To */
function handleAxisClick(e: MouseEvent): void {
  if (isDragging.value) return;
  if (!axisRef.value) return;
  const rect = axisRef.value.getBoundingClientRect();
  const percent = ((e.clientX - rect.left) / rect.width) * 100;
  const value = snapToTick(percentToValue(percent));

  if (e.button === 0) {
    const newFrom = Math.max(rangeMin.value, Math.min(value, selectedTo.value - 1));
    store.setRange(newFrom, selectedTo.value);
  } else if (e.button === 2) {
    const newTo = Math.min(rangeMax.value, Math.max(value, selectedFrom.value + 1));
    store.setRange(selectedFrom.value, newTo);
  }
}

function handleAxisContextMenu(e: MouseEvent): void {
  e.preventDefault();
  handleAxisClick(e);
}
</script>

<template>
  <Teleport to="body">
    <div class="timeline-island" :class="{ 'is-disabled': isDisabled }">
      <div class="timeline-scroll-container" ref="scrollContainerRef">
        <div
          class="timeline-track-wrapper"
          ref="axisRef"
          :style="{ width: trackWidth }"
          @click="handleAxisClick"
          @contextmenu="handleAxisContextMenu"
        >

          <!-- Labels row -->
          <div class="timeline-labels">
            <template v-for="tick in ticks" :key="'label-' + tick.value">
              <span
                v-if="showLabelFor(tick.value)"
                class="timeline-label"
                :class="{ 'is-edge': tick.value === rangeMin || tick.value === rangeMax }"
                :style="{ left: valueToPercent(tick.value) + '%' }"
              >
                {{ tick.value }}
              </span>
            </template>
          </div>

          <!-- Axis -->
          <div class="timeline-axis">

            <!-- Base line -->
            <div class="timeline-line" />

            <!-- Active range line -->
            <div
              class="timeline-line-active"
              :style="{
                left: valueToPercent(selectedFrom) + '%',
                width: (valueToPercent(selectedTo) - valueToPercent(selectedFrom)) + '%'
              }"
            />

            <!-- Ticks -->
            <div
              v-for="tick in ticks"
              :key="'tick-' + tick.value"
              class="timeline-tick"
              :class="{
                'is-major':  tick.isMajor,
                'is-minor':  tick.isMinor,
                'is-micro':  tick.isMicro,
                'is-active': tick.value >= selectedFrom && tick.value <= selectedTo
              }"
              :style="{ left: valueToPercent(tick.value) + '%' }"
            />

            <!-- FROM handle -->
            <div
              class="timeline-handle"
              :style="{ left: valueToPercent(selectedFrom) + '%' }"
              @pointerdown="startDragFrom"
            >
              <div class="timeline-handle-grip" />
              <div class="timeline-handle-grip" />
              <div class="timeline-handle-grip" />
            </div>

            <!-- TO handle -->
            <div
              class="timeline-handle"
              :style="{ left: valueToPercent(selectedTo) + '%' }"
              @pointerdown="startDragTo"
            >
              <div class="timeline-handle-grip" />
              <div class="timeline-handle-grip" />
              <div class="timeline-handle-grip" />
            </div>

          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

