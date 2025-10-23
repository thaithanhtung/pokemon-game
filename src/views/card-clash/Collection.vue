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
              Card Collection
            </h1>
          </div>
          <div class="flex items-center gap-4 text-gray-700">
            <div
              class="text-sm bg-white/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-200"
            >
              <div class="font-semibold text-gray-800">
                {{ playerStore.player?.name || 'Trainer' }}
              </div>
              <div class="text-xs text-purple-600 flex items-center gap-1">
                <span>⭐</span> Level {{ playerStore.player?.level || 1 }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Collection Content -->
    <div class="container mx-auto px-4 py-8">
      <CardCollection @back="$router.push('/card-clash/menu')" />
    </div>
  </div>
</template>

<script setup>
import { usePlayerStore } from '@/stores/player';
import CardCollection from '@/components/CardCollection.vue';

const playerStore = usePlayerStore();
</script>
