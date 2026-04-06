<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useMapFilterStore } from '@/modules/map/useMapFilterStore';
import type { TimelineTick } from '@/shared/types/timeline.types';

const props = withDefaults(
  defineProps<{
    min?: number;
    max?: number;
  }>(),
  { min: 0, max: 100 },
);

const store = useMapFilterStore();
const { selectedFrom, selectedTo } = storeToRefs(store);

const axisRef = ref<HTMLElement | null>(null);

const ticks = computed<TimelineTick[]>(() => {
  const result: TimelineTick[] = [];
  for (let v = props.min; v <= props.max; v += 0.5) {
    const isMajor  = Number.isInteger(v) && v % 10 === 0;
    const isMinor  = Number.isInteger(v) && v % 5 === 0 && !isMajor;
    const isWhole  = Number.isInteger(v) && !isMajor && !isMinor;
    const isMicro  = !Number.isInteger(v);   // 0.5 steps between integers
    result.push({ value: v, isMajor, isMinor, isWhole, isMicro });
  }
  return result;
});

function showLabelFor(value: number): boolean {
  if (!Number.isInteger(value)) return false;
  if (value === props.min || value === props.max) return true;
  return value % 10 === 0;
}

function valueToPercent(value: number): number {
  return ((value - props.min) / (props.max - props.min)) * 100;
}

function percentToValue(percent: number): number {
  const raw = (percent / 100) * (props.max - props.min) + props.min;
  return Math.round(Math.min(props.max, Math.max(props.min, raw)));
}

function snapToTick(value: number): number {
  return Math.round(value);
}

function startDragFrom(e: PointerEvent): void {
  const target = e.currentTarget as HTMLElement;
  target.setPointerCapture(e.pointerId);

  const onMove = (ev: PointerEvent) => {
    if (!axisRef.value) return;
    const rect = axisRef.value.getBoundingClientRect();
    const percent = ((ev.clientX - rect.left) / rect.width) * 100;
    let newFrom = snapToTick(percentToValue(percent));
    newFrom = Math.max(props.min, Math.min(newFrom, selectedTo.value - 1));
    store.setRange(newFrom, selectedTo.value);
  };

  const onUp = () => {
    target.releasePointerCapture(e.pointerId);
    target.removeEventListener('pointermove', onMove);
    target.removeEventListener('pointerup', onUp);
  };

  target.addEventListener('pointermove', onMove);
  target.addEventListener('pointerup', onUp);
}

function startDragTo(e: PointerEvent): void {
  const target = e.currentTarget as HTMLElement;
  target.setPointerCapture(e.pointerId);

  const onMove = (ev: PointerEvent) => {
    if (!axisRef.value) return;
    const rect = axisRef.value.getBoundingClientRect();
    const percent = ((ev.clientX - rect.left) / rect.width) * 100;
    let newTo = snapToTick(percentToValue(percent));
    newTo = Math.min(props.max, Math.max(newTo, selectedFrom.value + 1));
    store.setRange(selectedFrom.value, newTo);
  };

  const onUp = () => {
    target.releasePointerCapture(e.pointerId);
    target.removeEventListener('pointermove', onMove);
    target.removeEventListener('pointerup', onUp);
  };

  target.addEventListener('pointermove', onMove);
  target.addEventListener('pointerup', onUp);
}
</script>

<template>
  <Teleport to="body">
    <div class="timeline-island">
      <div class="timeline-track-wrapper" ref="axisRef">

        <!-- Labels row -->
        <div class="timeline-labels">
          <template v-for="tick in ticks" :key="'label-' + tick.value">
            <span
              v-if="showLabelFor(tick.value)"
              class="timeline-label"
              :class="{ 'is-edge': tick.value === min || tick.value === max }"
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
  </Teleport>
</template>

