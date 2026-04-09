<script setup lang="ts">
import { ref, watch } from 'vue';
import axios from 'axios';
import BaseModal from '@/shared/components/BaseModal.vue';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { usePhotoStore } from '@/modules/photos/usePhotoStore';

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
}>();

const store = useAuthStore();
const photoStore = usePhotoStore();
const activeTab = ref<Tab>(props.initialTab);
const isLoading = ref(false);
const serverError = ref<string | null>(null);

/* Reset form state whenever the modal opens */
watch(
  () => props.modelValue,
  (open) => {
    // Refresh map whenever this modal opens or closes
    photoStore.triggerMapRefresh();
    if (open) {
      activeTab.value = props.initialTab;
      resetForms();
    }
  },
);

/* ── Sign In fields ── */
const siIdentifier = ref('');
const siPassword = ref('');
const siErrors = ref<{ identifier?: string; password?: string }>({});

/* ── Sign Up fields ── */
const suUsername = ref('');
const suEmail = ref('');
const suPassword = ref('');
const suConfirm = ref('');
const suErrors = ref<{ username?: string; email?: string; password?: string; confirm?: string }>({});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function resetForms(): void {
  siIdentifier.value = '';
  siPassword.value = '';
  siErrors.value = {};
  suUsername.value = '';
  suEmail.value = '';
  suPassword.value = '';
  suConfirm.value = '';
  suErrors.value = {};
  serverError.value = null;
  isLoading.value = false;
}

function close(): void {
  emit('update:modelValue', false);
}

/* ── Validation & submit ── */
async function submitSignIn(): Promise<void> {
  const errors: typeof siErrors.value = {};
  if (!siIdentifier.value.trim()) errors.identifier = 'Email or username is required';
  if (!siPassword.value) errors.password = 'Password is required';

  siErrors.value = errors;
  if (Object.keys(errors).length) return;

  isLoading.value = true;
  serverError.value = null;
  try {
    await store.signIn({ emailOrUsername: siIdentifier.value.trim(), password: siPassword.value });
    close();
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const code = err.response?.data?.code;

      if (status === 403 && code === 'BANNED') {
        serverError.value = '🚫 Your account has been banned due to a community guidelines violation.';
      } else if (status === 403 && code === 'INACTIVE') {
        serverError.value = 'Your account has been deactivated. Please contact support.';
      } else if (status === 401) {
        serverError.value = 'Invalid email/username or password.';
      } else {
        serverError.value = 'Something went wrong. Please try again.';
      }
    } else {
      serverError.value = 'Something went wrong. Please try again.';
    }
  } finally {
    isLoading.value = false;
  }
}

async function submitSignUp(): Promise<void> {
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

  isLoading.value = true;
  serverError.value = null;
  try {
    await store.signUp({
      username: suUsername.value.trim(),
      email: suEmail.value.trim(),
      password: suPassword.value,
    });
    close();
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const field = err.response?.data?.field;

      if (status === 409 && field === 'username') {
        suErrors.value = { ...suErrors.value, username: 'This username is already taken.' };
      } else if (status === 409 && field === 'email') {
        suErrors.value = { ...suErrors.value, email: 'This email is already in use.' };
      } else if (status === 409) {
        serverError.value = 'An account with these details already exists.';
      } else {
        serverError.value = 'Something went wrong. Please try again.';
      }
    } else {
      serverError.value = 'Something went wrong. Please try again.';
    }
  } finally {
    isLoading.value = false;
  }
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
        <button class="auth-oauth-btn" @click="() => {}">
          <FontAwesomeIcon :icon="['fab', 'google']" />
          Continue with Google
        </button>
        <button class="auth-oauth-btn" @click="() => {}">
          <FontAwesomeIcon :icon="['fab', 'github']" />
          Continue with GitHub
        </button>

        <div class="auth-separator">or</div>

        <div class="form-field">
          <input
            v-model="siIdentifier"
            type="text"
            class="form-input"
            :class="{ error: siErrors.identifier }"
            placeholder="Email or Username"
            @keydown.enter="submitSignIn"
          />
          <span v-if="siErrors.identifier" class="form-error">{{ siErrors.identifier }}</span>
        </div>

        <div class="form-field">
          <input
            v-model="siPassword"
            type="password"
            class="form-input"
            :class="{ error: siErrors.password }"
            placeholder="Password"
            @keydown.enter="submitSignIn"
          />
          <span v-if="siErrors.password" class="form-error">{{ siErrors.password }}</span>
        </div>

        <div v-if="serverError" class="server-error-box" :class="{ 'server-error-box--ban': serverError.startsWith('🚫') }">
          {{ serverError }}
        </div>

        <button class="btn btn-primary" style="width: 100%" :disabled="isLoading" @click="submitSignIn">
          {{ isLoading ? 'Signing in…' : 'Sign In' }}
        </button>
      </div>

      <!-- ── Sign Up ── -->
      <div v-else key="sign-up">
        <button class="auth-oauth-btn" @click="() => {}">
          <FontAwesomeIcon :icon="['fab', 'google']" />
          Continue with Google
        </button>
        <button class="auth-oauth-btn" @click="() => {}">
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

        <div v-if="serverError" class="server-error-box">
          {{ serverError }}
        </div>

        <button class="btn btn-primary" style="width: 100%" :disabled="isLoading" @click="submitSignUp">
          {{ isLoading ? 'Creating account…' : 'Create Account' }}
        </button>
      </div>

    </Transition>
  </BaseModal>
</template>

<style scoped>
.server-error-box {
  display: block;
  margin-bottom: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--color-danger);
  background: rgba(220, 53, 69, 0.08);
  border: 1px solid rgba(220, 53, 69, 0.25);
}

.server-error-box--ban {
  background: rgba(220, 53, 69, 0.14);
  border-color: rgba(220, 53, 69, 0.5);
  font-weight: 500;
}
</style>
