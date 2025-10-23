<template>
  <div
    class="fixed bottom-4 right-4 bg-slate-900/90 backdrop-blur border border-white/10 rounded-lg p-4 text-white text-xs max-w-sm"
  >
    <h3 class="font-semibold mb-2 text-green-400">Firebase Auth Debug</h3>

    <div class="space-y-1">
      <div>
        <span class="text-white/60">Status:</span>
        <span :class="authStatusClass">{{ authStatus }}</span>
      </div>

      <div v-if="user">
        <span class="text-white/60">User:</span>
        <span class="text-blue-300">{{ user.displayName || 'No name' }}</span>
      </div>

      <div v-if="user">
        <span class="text-white/60">Email:</span>
        <span class="text-blue-300">{{ user.email || 'No email' }}</span>
      </div>

      <div v-if="user">
        <span class="text-white/60">Provider:</span>
        <span class="text-purple-300">{{ provider }}</span>
      </div>

      <div v-if="user">
        <span class="text-white/60">UID:</span>
        <span class="text-yellow-300 font-mono text-xs">{{ user.uid.substring(0, 8) }}...</span>
      </div>

      <div v-if="user && user.level">
        <span class="text-white/60">Level:</span>
        <span class="text-green-300">{{ user.level }}</span>
      </div>

      <div v-if="user && user.createdAt">
        <span class="text-white/60">Created:</span>
        <span class="text-blue-300">{{ formatDate(user.createdAt) }}</span>
      </div>

      <div v-if="user && user.lastLoginAt">
        <span class="text-white/60">Last Login:</span>
        <span class="text-purple-300">{{ formatDate(user.lastLoginAt) }}</span>
      </div>

      <div v-if="error">
        <span class="text-red-400">Error:</span>
        <span class="text-red-300">{{ error }}</span>
      </div>
    </div>

    <div class="mt-3 pt-2 border-t border-white/10 space-y-2">
      <button
        @click="testGoogleAuth"
        :disabled="isLoading"
        class="w-full bg-blue-600 hover:bg-blue-500 text-white py-1 px-2 rounded text-xs disabled:opacity-50"
      >
        {{ isLoading ? 'Testing...' : 'Test Google Auth' }}
      </button>

      <button
        @click="checkRedirectResult"
        :disabled="isLoading"
        class="w-full bg-green-600 hover:bg-green-500 text-white py-1 px-2 rounded text-xs disabled:opacity-50"
      >
        Check Redirect Result
      </button>

      <div class="text-xs text-white/60">
        <div>Browser: {{ browserInfo }}</div>
        <div>Popup Blocked: {{ popupBlocked ? 'Yes' : 'No' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useFirebase } from '@/composables/useFirebase';

const firebase = useFirebase();

const user = ref(null);
const error = ref(null);
const isLoading = ref(false);
const popupBlocked = ref(false);

// Browser info
const browserInfo = computed(() => {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
});

// Computed properties
const authStatus = computed(() => {
  if (isLoading.value) return 'Loading...';
  if (error.value) return 'Error';
  if (user.value) return 'Authenticated';
  return 'Not authenticated';
});

const authStatusClass = computed(() => {
  if (isLoading.value) return 'text-yellow-400';
  if (error.value) return 'text-red-400';
  if (user.value) return 'text-green-400';
  return 'text-gray-400';
});

const provider = computed(() => {
  if (!user.value) return 'None';

  const providers = user.value.providerData;
  if (providers.length === 0) return 'Anonymous';

  return providers.map(p => p.providerId).join(', ');
});

// Auth state listener
let unsubscribeAuth = null;

onMounted(() => {
  // Listen to auth state changes
  unsubscribeAuth = firebase.firebase?.authService?.onAuthStateChanged(firebaseUser => {
    user.value = firebaseUser;
    error.value = firebase.error.value;
    isLoading.value = firebase.isLoading.value;
  });
});

onUnmounted(() => {
  if (unsubscribeAuth) {
    unsubscribeAuth();
  }
});

// Test Google authentication
const testGoogleAuth = async () => {
  isLoading.value = true;
  error.value = null;
  popupBlocked.value = false;

  try {
    console.log('Testing popup blocker...');
    const testPopup = window.open('', '_blank', 'width=1,height=1');
    if (!testPopup || testPopup.closed) {
      popupBlocked.value = true;
      console.warn('Popup blocked by browser');
    } else {
      testPopup.close();
    }

    const result = await firebase.signInWithGoogle();

    if (result.error) {
      error.value = result.error;
      if (result.error.includes('popup') || result.error.includes('blocked')) {
        popupBlocked.value = true;
      }
    } else {
      error.value = null;
    }
  } catch (err) {
    error.value = err.message;
    if (err.message.includes('popup') || err.message.includes('blocked')) {
      popupBlocked.value = true;
    }
  } finally {
    isLoading.value = false;
  }
};

// Check redirect result
const checkRedirectResult = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const result = await firebase.firebase?.authService?.getRedirectResult();
    if (result?.user) {
      user.value = result.user;
      error.value = null;
    } else if (result?.error) {
      error.value = result.error;
    }
  } finally {
    isLoading.value = false;
  }
};

// Format date helper
const formatDate = dateString => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};
</script>
