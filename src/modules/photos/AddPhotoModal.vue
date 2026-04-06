<script setup lang="ts">
import { reactive, watch, toRef } from 'vue';
import { storeToRefs } from 'pinia';
import BaseModal from '@/shared/components/BaseModal.vue';
import { useAddressAutocomplete } from './useAddressAutocomplete';
import { useReverseGeocode } from './useReverseGeocode';
import { useThemeStore } from '@/modules/theme/useThemeStore';
import type { PhotoFormData, PhotoFormErrors } from './photo.types';

const { isDark } = storeToRefs(useThemeStore());

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    lat: number;
    lng: number;
    mode: 'add' | 'edit';
    initialData?: PhotoFormData;
  }>(),
  {
    initialData: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [data: PhotoFormData];
}>();

const { query, suggestions, selectSuggestion, selectedAddress, setAddressSilently } = useAddressAutocomplete();
const { reverseGeocode } = useReverseGeocode();

const form = reactive<PhotoFormData>({
  address: props.initialData?.address ?? '',
  description: props.initialData?.description ?? '',
  date: props.initialData?.date ?? null,
  photo: props.initialData?.photo ?? '',
});

const errors = reactive<PhotoFormErrors>({
  address: null,
  photo: null,
});

watch(toRef(props, 'modelValue'), async (isOpen) => {
  if (!isOpen) return;
  resetForm();
  const address = await reverseGeocode(props.lat, props.lng);
  if (address) {
    setAddressSilently(address);
    form.address = address;
  }
});

function validate(): boolean {
  errors.address = null;
  errors.photo = null;

  if (!selectedAddress.value && !query.value.trim()) {
    errors.address = 'Address is required';
  }
  if (!form.photo.trim()) {
    errors.photo = 'Photo is required';
  }

  return !errors.address && !errors.photo;
}

function save() {
  form.address = selectedAddress.value || query.value;
  if (!validate()) return;

  emit('submit', { ...form });
  console.log(form);
  close();
}

function cancel() {
  resetForm();
  close();
}

function close() {
  emit('update:modelValue', false);
}

function resetForm() {
  form.address = '';
  form.description = '';
  form.date = null;
  form.photo = '';
  query.value = '';
  selectedAddress.value = '';
  suggestions.value = [];
  errors.address = null;
  errors.photo = null;
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="mode === 'add' ? 'Add Photo' : 'Edit Photo'"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <!-- Address -->
    <div class="form-field">
      <label class="form-label" for="address-input">Address</label>
      <div class="autocomplete-wrapper">
        <input
          id="address-input"
          v-model="query"
          class="form-input"
          :class="{ error: errors.address }"
          placeholder="Search address..."
        />
        <ul v-if="suggestions.length" class="autocomplete-list">
          <li
            v-for="(item, idx) in suggestions"
            :key="idx"
            class="autocomplete-item"
            @click="selectSuggestion(item); form.address = item.display_name"
          >
            {{ item.display_name }}
          </li>
        </ul>
      </div>
      <span v-if="errors.address" class="form-error">{{ errors.address }}</span>
    </div>

    <!-- Description -->
    <div class="form-field">
      <label class="form-label" for="description-input">Description</label>
      <textarea
        id="description-input"
        v-model="form.description"
        class="form-input form-textarea"
        placeholder="Add description..."
      />
    </div>

    <!-- Date -->
    <div class="form-field">
      <label class="form-label" for="date-input">Date</label>
      <VueDatePicker
        id="date-input"
        v-model="form.date"
        :dark="isDark"
        :enable-time-picker="false"
        format="dd.MM.yyyy"
        auto-apply
      />
    </div>

    <!-- Photo -->
    <div class="form-field">
      <label class="form-label" for="photo-input">Photo</label>
      <input
        id="photo-input"
        v-model="form.photo"
        class="form-input"
        :class="{ error: errors.photo }"
        placeholder="Photo (placeholder)"
      />
      <span v-if="errors.photo" class="form-error">{{ errors.photo }}</span>
    </div>

    <!-- Footer -->
    <div class="modal-footer">
      <button class="btn btn-secondary" @click="cancel">Cancel</button>
      <button class="btn btn-primary" @click="save">Save</button>
    </div>
  </BaseModal>
</template>

