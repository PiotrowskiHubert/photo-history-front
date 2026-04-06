<script setup lang="ts">
import { ref, watch } from 'vue';
import BaseModal from '@/shared/components/BaseModal.vue';

type Tab = 'sign-in' | 'sign-up';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    initialTab?: Tab;
  }>(),
  { initialTab: 'sign-in' },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'oauth-google': [];
  'oauth-github': [];
  'sign-in': [payload: { email: string; password: string }];
  'sign-up': [payload: { username: string; email: string; password: string }];
}>();

const activeTab = ref<Tab>(props.initialTab);

/* Reset form state whenever the modal opens */
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      activeTab.value = props.initialTab;
      resetForms();
    }
  },
);

/* ── Sign In fields ── */
const siEmail = ref('');
const siPassword = ref('');
const siErrors = ref<{ email?: string; password?: string }>({});

/* ── Sign Up fields ── */
const suUsername = ref('');
const suEmail = ref('');
const suPassword = ref('');
const suConfirm = ref('');
const suErrors = ref<{ username?: string; email?: string; password?: string; confirm?: string }>({});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function resetForms(): void {
  siEmail.value = '';
  siPassword.value = '';
  siErrors.value = {};
  suUsername.value = '';
  suEmail.value = '';
  suPassword.value = '';
  suConfirm.value = '';
  suErrors.value = {};
}

function close(): void {
  emit('update:modelValue', false);
}

/* ── Validation & submit ── */
function submitSignIn(): void {
  const errors: typeof siErrors.value = {};
  if (!siEmail.value.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(siEmail.value.trim())) errors.email = 'Invalid email format';
  if (!siPassword.value) errors.password = 'Password is required';

  siErrors.value = errors;
  if (Object.keys(errors).length) return;

  emit('sign-in', { email: siEmail.value.trim(), password: siPassword.value });
  close();
}

function submitSignUp(): void {
  const errors: typeof suErrors.value = {};
  if (!suUsername.value.trim() || suUsername.value.trim().length < 3)
    errors.username = 'Username must be at least 3 characters';
  if (!suEmail.value.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(suEmail.value.trim())) errors.email = 'Invalid email format';
  if (!suPassword.value || suPassword.value.length < 8)
    errors.password = 'Password must be at least 8 characters';
  if (suConfirm.value !== suPassword.value) errors.confirm = 'Passwords do not match';

  suErrors.value = errors;
  if (Object.keys(errors).length) return;

  emit('sign-up', {
    username: suUsername.value.trim(),
    email: suEmail.value.trim(),
    password: suPassword.value,
  });
  close();
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title=""
    @update:model-value="emit('update:modelValue', $event)"
  >
    <!-- Tab switcher -->
    <div class="auth-modal-tabs">
      <button
        class="auth-modal-tab"
        :class="{ 'is-active': activeTab === 'sign-in' }"
        @click="activeTab = 'sign-in'"
      >
        <span v-if="activeTab === 'sign-in'" class="auth-modal-tab-pill" />
        <span style="position: relative; z-index: 1">Sign In</span>
      </button>
      <button
        class="auth-modal-tab"
        :class="{ 'is-active': activeTab === 'sign-up' }"
        @click="activeTab = 'sign-up'"
      >
        <span v-if="activeTab === 'sign-up'" class="auth-modal-tab-pill" />
        <span style="position: relative; z-index: 1">Sign Up</span>
      </button>
    </div>

    <!-- Tab content with fade transition -->
    <Transition name="auth-tab-fade" mode="out-in">

      <!-- ── Sign In ── -->
      <div v-if="activeTab === 'sign-in'" key="sign-in">
        <button class="auth-oauth-btn" @click="emit('oauth-google')">
          <FontAwesomeIcon :icon="['fab', 'google']" />
          Continue with Google
        </button>
        <button class="auth-oauth-btn" @click="emit('oauth-github')">
          <FontAwesomeIcon :icon="['fab', 'github']" />
          Continue with GitHub
        </button>

        <div class="auth-separator">or</div>

        <div class="form-field">
          <input
            v-model="siEmail"
            type="email"
            class="form-input"
            :class="{ error: siErrors.email }"
            placeholder="Email"
          />
          <span v-if="siErrors.email" class="form-error">{{ siErrors.email }}</span>
        </div>

        <div class="form-field">
          <input
            v-model="siPassword"
            type="password"
            class="form-input"
            :class="{ error: siErrors.password }"
            placeholder="Password"
          />
          <span v-if="siErrors.password" class="form-error">{{ siErrors.password }}</span>
        </div>

        <button class="btn btn-primary" style="width: 100%" @click="submitSignIn">
          Sign In
        </button>
      </div>

      <!-- ── Sign Up ── -->
      <div v-else key="sign-up">
        <button class="auth-oauth-btn" @click="emit('oauth-google')">
          <FontAwesomeIcon :icon="['fab', 'google']" />
          Continue with Google
        </button>
        <button class="auth-oauth-btn" @click="emit('oauth-github')">
          <FontAwesomeIcon :icon="['fab', 'github']" />
          Continue with GitHub
        </button>

        <div class="auth-separator">or</div>

        <div class="form-field">
          <input
            v-model="suUsername"
            type="text"
            class="form-input"
            :class="{ error: suErrors.username }"
            placeholder="Username"
          />
          <span v-if="suErrors.username" class="form-error">{{ suErrors.username }}</span>
        </div>

        <div class="form-field">
          <input
            v-model="suEmail"
            type="email"
            class="form-input"
            :class="{ error: suErrors.email }"
            placeholder="Email"
          />
          <span v-if="suErrors.email" class="form-error">{{ suErrors.email }}</span>
        </div>

        <div class="form-field">
          <input
            v-model="suPassword"
            type="password"
            class="form-input"
            :class="{ error: suErrors.password }"
            placeholder="Password"
          />
          <span v-if="suErrors.password" class="form-error">{{ suErrors.password }}</span>
        </div>

        <div class="form-field">
          <input
            v-model="suConfirm"
            type="password"
            class="form-input"
            :class="{ error: suErrors.confirm }"
            placeholder="Confirm Password"
          />
          <span v-if="suErrors.confirm" class="form-error">{{ suErrors.confirm }}</span>
        </div>

        <button class="btn btn-primary" style="width: 100%" @click="submitSignUp">
          Create Account
        </button>
      </div>

    </Transition>
  </BaseModal>
</template>

