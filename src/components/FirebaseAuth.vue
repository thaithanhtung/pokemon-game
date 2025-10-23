<template>
  <div v-if="isLoading" class="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
    <div class="text-center">
      <div class="text-4xl mb-4 animate-spin">🎴</div>
      <h3 class="text-xl font-semibold text-white mb-2">Loading PokéCard Clash...</h3>
      <p class="text-white/60 text-sm">Initializing Firebase connection</p>
    </div>
  </div>

  <div
    v-else-if="!isAuthenticated"
    class="fixed inset-0 bg-slate-950 flex items-center justify-center z-50"
  >
    <div class="max-w-md mx-auto p-6 bg-slate-900/70 rounded-xl border border-white/10">
      <div class="text-center mb-6">
        <div class="text-4xl mb-4">🎴</div>
        <h2 class="text-2xl font-semibold text-white mb-2">PokéCard Clash</h2>
        <p class="text-white/70 text-sm">Choose how you'd like to play</p>
      </div>

      <div class="space-y-4">
        <!-- Guest Mode -->
        <button
          @click="signInAnonymously"
          :disabled="isLoading"
          class="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
        >
          <div class="flex items-center justify-center gap-2">
            <span>👤</span>
            <span>Play as Guest</span>
          </div>
          <p class="text-xs text-white/60 mt-1">Quick start, data saved locally</p>
        </button>

        <!-- Google Sign In -->
        <button
          @click="signInWithGoogle"
          :disabled="isLoading"
          class="w-full bg-white hover:bg-gray-100 text-gray-900 py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300"
        >
          <div class="flex items-center justify-center gap-2">
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </div>
          <p class="text-xs text-gray-600 mt-1">Sign in with your Google account</p>
        </button>

        <!-- Alternative Login Options -->
        <div class="text-center">
          <button
            @click="showEmailForm = !showEmailForm"
            class="text-white/60 hover:text-white text-sm transition-colors"
          >
            {{ showEmailForm ? 'Hide email form' : 'Other login options' }}
          </button>
        </div>

        <!-- Email Sign In (Hidden by default) -->
        <div v-if="showEmailForm" class="border-t border-white/10 pt-4">
          <form @submit.prevent="handleEmailSignIn" class="space-y-3">
            <div>
              <input
                v-model="email"
                type="email"
                placeholder="Email"
                required
                class="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <input
                v-model="password"
                type="password"
                placeholder="Password"
                required
                class="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div class="flex gap-2">
              <button
                type="submit"
                :disabled="isLoading"
                class="flex-1 bg-blue-700 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sign In
              </button>
              <button
                type="button"
                @click="showSignUp = !showSignUp"
                class="flex-1 bg-green-700 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                {{ showSignUp ? 'Sign In' : 'Sign Up' }}
              </button>
            </div>
          </form>

          <!-- Sign Up Form -->
          <form v-if="showSignUp" @submit.prevent="handleSignUp" class="mt-4 space-y-3">
            <div>
              <input
                v-model="displayName"
                type="text"
                placeholder="Display Name"
                required
                class="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full bg-green-700 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Account
            </button>
          </form>
        </div>
      </div>

      <div v-if="error" class="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
        <p class="text-red-300 text-sm">{{ error }}</p>
      </div>
    </div>
  </div>

  <div v-else class="min-h-screen bg-slate-950">
    <!-- User Info Bar -->
    <div class="bg-slate-900/70 backdrop-blur border-b border-white/5">
      <div class="container mx-auto px-4 py-2">
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-4 text-white/90">
            <span class="font-medium">{{ userDisplayName }}</span>
            <span v-if="userEmail" class="text-white/60">{{ userEmail }}</span>
            <span class="text-xs bg-white/10 px-2 py-1 rounded border border-white/10">
              {{ isAnonymous ? 'Guest' : 'Account' }}
            </span>
          </div>
          <button
            @click="handleSignOut"
            class="text-white/60 hover:text-white transition-colors text-xs"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>

    <!-- Main App Content -->
    <slot />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useFirebase } from '@/composables/useFirebase';

const firebase = useFirebase();

// Form data
const email = ref('');
const password = ref('');
const displayName = ref('');
const showSignUp = ref(false);
const showEmailForm = ref(false);

// Computed properties
const isLoading = computed(() => firebase.isLoading.value);
const isAuthenticated = computed(() => firebase.isAuthenticated.value);
const error = computed(() => firebase.error.value);
const userDisplayName = computed(() => firebase.displayName.value);
const userEmail = computed(() => firebase.email.value);
const isAnonymous = computed(() => firebase.user.value?.isAnonymous || false);
console.log('isAuthenticated', firebase.isAuthenticated.value);

console.log('firebase', firebase);

// Auth methods
const signInAnonymously = async () => {
  await firebase.signInAnonymously();
};

const signInWithGoogle = async () => {
  await firebase.signInWithGoogle();
};

const handleEmailSignIn = async () => {
  await firebase.signInWithEmail(email.value, password.value);
  if (!error.value) {
    email.value = '';
    password.value = '';
  }
};

const handleSignUp = async () => {
  await firebase.createAccount(email.value, password.value, displayName.value);
  if (!error.value) {
    email.value = '';
    password.value = '';
    displayName.value = '';
    showSignUp.value = false;
  }
};

const handleSignOut = async () => {
  await firebase.signOut();
};

// Use shared listener from composable
onMounted(() => {
  // await firebase.initializeFirebase();
  firebase.startAuthListener();
});

onUnmounted(() => {
  firebase.stopAuthListener();
});
</script>
