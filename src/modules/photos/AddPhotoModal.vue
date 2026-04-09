<script setup lang="ts">
import { computed, reactive, ref, watch, toRef } from 'vue';
import { storeToRefs } from 'pinia';
import BaseModal from '@/shared/components/BaseModal.vue';
import { useAddressAutocomplete } from './useAddressAutocomplete';
import { useReverseGeocode } from './useReverseGeocode';
import { useThemeStore } from '@/modules/theme/useThemeStore';
import { usePhotoStore } from './usePhotoStore';
import type { PhotoFormData, PhotoFormErrors } from './photo.types';

const { isDark } = storeToRefs(useThemeStore());
const photoStore = usePhotoStore();

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
}>();

const { query, suggestions, selectSuggestion, selectedAddress, setAddressSilently } = useAddressAutocomplete();
const { reverseGeocode } = useReverseGeocode();

const isLoading = ref(false);
const serverError = ref<string | null>(null);

/* Preview URL for selected file */
const filePreviewUrl = computed(() => form.file ? URL.createObjectURL(form.file) : '');

const form = reactive<PhotoFormData>({
  address: props.initialData?.address ?? '',
  description: props.initialData?.description ?? '',
  date: props.initialData?.date ?? null,
  file: props.initialData?.file ?? null,
});

const errors = reactive<PhotoFormErrors>({
  address: null,
  photo: null,
});

watch(toRef(props, 'modelValue'), async (isOpen) => {
  // Refresh map whenever this modal opens or closes
  photoStore.triggerMapRefresh();
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
  if (!form.file) {
    errors.photo = 'Photo is required';
  }

  return !errors.address && !errors.photo;
}

async function save() {
  form.address = selectedAddress.value || query.value;
  if (!validate()) return;

  isLoading.value = true;
  serverError.value = null;
  try {
    await photoStore.uploadPhoto({ ...form }, props.lat, props.lng);
    close();
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 401) {
      serverError.value = 'Your session has expired. Please sign in again.';
    } else {
      serverError.value = 'Failed to upload photo. Please try again.';
    }
  } finally {
    isLoading.value = false;
  }
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
  form.file = null;
  query.value = '';
  selectedAddress.value = '';
  suggestions.value = [];
  errors.address = null;
  errors.photo = null;
  serverError.value = null;
  isLoading.value = false;
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
        type="file"
        accept="image/*"
        class="form-input"
        :class="{ error: errors.photo }"
        @change="(e) => { form.file = (e.target as HTMLInputElement).files?.[0] ?? null }"
      />
      <img
        v-if="form.file"
        :src="filePreviewUrl"
        style="max-width: 100%; max-height: 200px; margin-top: 8px; border-radius: 6px;"
        alt="preview"
      />
      <span v-if="errors.photo" class="form-error">{{ errors.photo }}</span>
    </div>

    <!-- Footer -->
    <div v-if="serverError" class="form-error" style="margin-bottom: 8px; text-align: center;">
      {{ serverError }}
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" @click="cancel">Cancel</button>
      <button class="btn btn-primary" :disabled="isLoading" @click="save">
        {{ isLoading ? 'Uploading...' : 'Save' }}
      </button>
    </div>
  </BaseModal>
</template>

