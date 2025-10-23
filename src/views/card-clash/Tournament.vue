<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
    <!-- Header -->
    <div class="relative bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-lg">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <router-link
              to="/card-clash/menu"
              class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 font-medium"
            >
              <span>←</span>
              <span>Back to Menu</span>
            </router-link>
            <h1
              class="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600"
            >
              Tournament - Season 1
            </h1>
          </div>
          <!-- User info moved to side navigation -->
        </div>
      </div>
    </div>

    <!-- Tournament Content -->
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <!-- Coming Soon Banner -->
        <div
          class="bg-white rounded-2xl p-12 border-2 border-orange-200 text-center shadow-lg"
        >
          <div class="text-8xl mb-6 animate-pulse">🏅</div>
          <h2
            class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 mb-4"
          >
            Tournament Mode Coming Soon!
          </h2>
          <p class="text-gray-600 text-lg mb-8">
            Compete for exclusive rewards and glory in weekly ranked competitions
          </p>

          <!-- Features Preview -->
          <div class="grid md:grid-cols-3 gap-6 mt-12">
            <div class="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div class="text-4xl mb-4">🏆</div>
              <h3 class="text-xl font-bold text-gray-800 mb-2">Weekly Rankings</h3>
              <p class="text-gray-600 text-sm">Compete for top positions and exclusive rewards</p>
            </div>

            <div class="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div class="text-4xl mb-4">⚔️</div>
              <h3 class="text-xl font-bold text-gray-800 mb-2">Bracket System</h3>
              <p class="text-gray-600 text-sm">
                Single elimination tournaments with multiple rounds
              </p>
            </div>

            <div class="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div class="text-4xl mb-4">🎁</div>
              <h3 class="text-xl font-bold text-gray-800 mb-2">Exclusive Rewards</h3>
              <p class="text-gray-600 text-sm">
                Unique cards and items only available in tournaments
              </p>
            </div>
          </div>

          <!-- Notify Me Button -->
          <div class="mt-12">
            <button
              @click="notifyMe"
              class="bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 px-8 py-3 rounded-lg font-bold text-white shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-orange-500/50"
            >
              Notify Me When Available
            </button>
          </div>
        </div>

        <!-- Current Season Info -->
        <div class="mt-12 bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
          <h3 class="text-2xl font-bold text-gray-800 mb-6 text-center">Season 1 Information</h3>

          <div class="grid md:grid-cols-2 gap-8">
            <div>
              <h4 class="text-lg font-semibold text-orange-600 mb-4">Tournament Schedule</h4>
              <ul class="space-y-2 text-gray-600">
                <li>• Registration: Monday - Wednesday</li>
                <li>• Tournament: Thursday - Sunday</li>
                <li>• Rewards: Distributed on Monday</li>
                <li>• Season Duration: 4 weeks</li>
              </ul>
            </div>

            <div>
              <h4 class="text-lg font-semibold text-orange-600 mb-4">Reward Tiers</h4>
              <ul class="space-y-2 text-gray-600">
                <li>• Top 10: Legendary Pack + Exclusive Card</li>
                <li>• Top 50: Premium Pack + Tournament Badge</li>
                <li>• Top 100: Basic Pack + Season Points</li>
                <li>• Participation: Season Points</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Debug Component (only in development) -->
    <FirebaseDebug v-if="isDev" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePlayerStore } from '@/stores/player';
import { useToast } from '@/composables/useToast';
import FirebaseDebug from '@/components/FirebaseDebug.vue';

const playerStore = usePlayerStore();
const toast = useToast();

// Development mode check
const isDev = computed(() => import.meta.env.DEV);

const notifyMe = () => {
  toast.info('Notification Set!', "We'll notify you when Tournament mode is available");
};
</script>
