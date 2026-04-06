import { ref } from 'vue';
import { defineStore } from 'pinia';

export interface AuthUser {
  username: string;
  email: string;
  avatar?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false);
  const user = ref<AuthUser | null>(null);

  /** Clear session — no API call yet, shell for future backend integration */
  function signOut(): void {
    isLoggedIn.value = false;
    user.value = null;
  }

  return { isLoggedIn, user, signOut };
});

