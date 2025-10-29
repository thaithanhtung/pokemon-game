<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
    <!-- Animated Background -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-400/10 to-transparent rounded-full blur-3xl animate-pulse"
      ></div>
      <div
        class="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-400/10 to-transparent rounded-full blur-3xl animate-pulse"
        style="animation-delay: 2s"
      ></div>
    </div>

    <!-- Header -->
    <div class="relative bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-lg">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <h1
            class="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 flex items-center gap-3"
          >
            <span class="text-3xl md:text-5xl animate-float">🎴</span>
            PokéCard Clash
          </h1>
          <div class="flex items-center gap-4 text-gray-700">
            <router-link
              to="/game-tutorial"
              class="bg-gradient-to-r from-purple-100 to-blue-100 hover:from-purple-200 hover:to-blue-200 px-4 py-2 rounded-lg text-sm transition-all duration-300 flex items-center gap-2 border border-purple-200 hover:border-purple-300 backdrop-blur-sm font-medium"
            >
              <span class="animate-pulse">📚</span>
              <span class="hidden md:inline">Tutorial</span>
            </router-link>
            <!-- User info moved to side navigation -->
          </div>
        </div>
      </div>
    </div>

    <!-- Main Menu -->
    <div class="relative container mx-auto px-4 py-12">
      <div class="text-center mb-12">
        <h2
          class="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 mb-3"
        >
          Choose Your Battle
        </h2>
        <p class="text-gray-600 text-lg">Select your game mode and start your adventure</p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <!-- Story Mode -->
        <router-link
          to="/card-clash/battle/story"
          class="group relative bg-white rounded-2xl p-8 border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-200/50"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          ></div>
          <div
            class="absolute -top-4 -right-4 w-24 h-24 bg-blue-300/30 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-300"
          ></div>
          <div class="relative text-center text-gray-800">
            <div
              class="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300 animate-pulse"
            >
              ⚔️
            </div>
            <h3 class="text-2xl font-bold mb-3 text-blue-700">Story Mode</h3>
            <p class="text-sm text-blue-600 mb-4">
              Battle AI opponents and progress through the adventure
            </p>
            <div class="inline-block bg-blue-100 px-4 py-2 rounded-lg border border-blue-300">
              <span class="text-xs text-blue-700 font-medium"
                >Chapter {{ playerStore.player.storyProgress.chapter }}</span
              >
            </div>
          </div>
        </router-link>

        <!-- PvP Mode -->
        <router-link
          to="/card-clash/battle/pvp"
          class="group relative bg-white rounded-2xl p-8 border-2 border-red-200 hover:border-red-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-200/50"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-red-100/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          ></div>
          <div
            class="absolute -top-4 -right-4 w-24 h-24 bg-red-300/30 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-300"
          ></div>
          <div class="relative text-center text-gray-800">
            <div
              class="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300 animate-pulse"
              style="animation-delay: 0.2s"
            >
              🏆
            </div>
            <h3 class="text-2xl font-bold mb-3 text-red-700">PvP Battle</h3>
            <p class="text-sm text-red-600 mb-4">Challenge other players in real-time battles</p>
            <div class="inline-block bg-red-100 px-4 py-2 rounded-lg border border-red-300">
              <span class="text-xs text-red-700 font-medium">Rank: {{ playerStore.player.pvpRank }}</span>
            </div>
          </div>
        </router-link>

        <!-- Deck Builder -->
        <router-link
          to="/card-clash/deck-builder"
          class="group relative bg-white rounded-2xl p-8 border-2 border-green-200 hover:border-green-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-200/50"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-green-100/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          ></div>
          <div
            class="absolute -top-4 -right-4 w-24 h-24 bg-green-300/30 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-300"
          ></div>
          <div class="relative text-center text-gray-800">
            <div
              class="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300 animate-pulse"
              style="animation-delay: 0.4s"
            >
              🃏
            </div>
            <h3 class="text-2xl font-bold mb-3 text-green-700">Deck Builder</h3>
            <p class="text-sm text-green-600 mb-4">Customize your battle deck</p>
            <div
              class="inline-block bg-green-100 px-4 py-2 rounded-lg border border-green-300"
            >
              <span class="text-xs text-green-700 font-medium"
                >{{ playerStore.player.decks.length }} Decks</span
              >
            </div>
          </div>
        </router-link>

        <!-- Collection -->
        <router-link
          to="/card-clash/collection"
          class="group relative bg-white rounded-2xl p-8 border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-200/50"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-purple-100/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          ></div>
          <div
            class="absolute -top-4 -right-4 w-24 h-24 bg-purple-300/30 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-300"
          ></div>
          <div class="relative text-center text-gray-800">
            <div
              class="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300 animate-pulse"
              style="animation-delay: 0.6s"
            >
              📚
            </div>
            <h3 class="text-2xl font-bold mb-3 text-purple-700">Collection</h3>
            <p class="text-sm text-purple-600 mb-4">View and manage your cards</p>
            <div
              class="inline-block bg-purple-100 px-4 py-2 rounded-lg border border-purple-300"
            >
              <span class="text-xs text-purple-700 font-medium"
                >{{ playerStore.player.cards.length }} Cards</span
              >
            </div>
          </div>
        </router-link>

        <!-- Shop -->
        <router-link
          to="/card-clash/shop"
          class="group relative bg-white rounded-2xl p-8 border-2 border-yellow-200 hover:border-yellow-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-200/50"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-yellow-100/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          ></div>
          <div
            class="absolute -top-4 -right-4 w-24 h-24 bg-yellow-300/30 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-300"
          ></div>
          <div class="relative text-center text-gray-800">
            <div
              class="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300 animate-pulse"
              style="animation-delay: 0.8s"
            >
              🛍️
            </div>
            <h3 class="text-2xl font-bold mb-3 text-yellow-700">Shop</h3>
            <p class="text-sm text-yellow-600 mb-4">Buy card packs and items</p>
            <div
              class="inline-block bg-yellow-100 px-4 py-2 rounded-lg border border-yellow-300"
            >
              <span class="text-xs text-yellow-700 font-medium">New Deals!</span>
            </div>
          </div>
        </router-link>

        <!-- Trading -->
        <router-link
          to="/card-clash/trading"
          class="group relative bg-white rounded-2xl p-8 border-2 border-indigo-200 hover:border-indigo-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-200/50"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-indigo-100/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          ></div>
          <div
            class="absolute -top-4 -right-4 w-24 h-24 bg-indigo-300/30 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-300"
          ></div>
          <div class="relative text-center text-gray-800">
            <div
              class="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300 animate-pulse"
              style="animation-delay: 1s"
            >
              🏪
            </div>
            <h3 class="text-2xl font-bold mb-3 text-indigo-700">Trading Market</h3>
            <p class="text-sm text-indigo-600 mb-4">Buy, sell & trade cards</p>
            <div
              class="inline-block bg-indigo-100 px-4 py-2 rounded-lg border border-indigo-300"
            >
              <span class="text-xs text-indigo-700 font-medium">Live Market</span>
            </div>
          </div>
        </router-link>

        <!-- Tournament -->
        <router-link
          to="/card-clash/tournament"
          class="group relative bg-white rounded-2xl p-8 border-2 border-orange-200 hover:border-orange-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-orange-200/50"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-orange-100/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          ></div>
          <div
            class="absolute -top-4 -right-4 w-24 h-24 bg-orange-300/30 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-300"
          ></div>
          <div class="relative text-center text-gray-800">
            <div
              class="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300 animate-pulse"
              style="animation-delay: 1.2s"
            >
              🏅
            </div>
            <h3 class="text-2xl font-bold mb-3 text-orange-700">Tournament</h3>
            <p class="text-sm text-orange-600 mb-4">Weekly ranked competitions</p>
            <div
              class="inline-block bg-orange-100 px-4 py-2 rounded-lg border border-orange-300"
            >
              <span class="text-xs text-orange-700 font-medium">Season 1</span>
            </div>
          </div>
        </router-link>

        <!-- 3D Battle Mode -->
        <router-link
          to="/card-clash/battle-3d/demo"
          class="group relative bg-white rounded-2xl p-8 border-2 border-pink-200 hover:border-pink-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-pink-200/50"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-pink-100/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          ></div>
          <div
            class="absolute -top-4 -right-4 w-24 h-24 bg-pink-300/30 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-300"
          ></div>
          <div class="relative text-center text-gray-800">
            <div
              class="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300 animate-pulse"
              style="animation-delay: 1.4s"
            >
              🎮
            </div>
            <h3 class="text-2xl font-bold mb-3 text-pink-700">3D Battle Arena</h3>
            <p class="text-sm text-pink-600 mb-4">Experience battles in stunning 3D!</p>
            <div
              class="inline-block bg-pink-100 px-4 py-2 rounded-lg border border-pink-300"
            >
              <span class="text-xs text-pink-700 font-medium">NEW! 🔥</span>
            </div>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Debug Component (only in development) -->
    <FirebaseDebug v-if="isDev" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePlayerStore } from '@/stores/player';
import FirebaseDebug from '@/components/FirebaseDebug.vue';

const playerStore = usePlayerStore();

// Development mode check
const isDev = computed(() => import.meta.env.DEV);
</script>

<style scoped>
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
</style>
