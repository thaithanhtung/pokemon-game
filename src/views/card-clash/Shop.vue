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
              Shop
            </h1>
          </div>
          <div class="flex items-center gap-4 text-gray-700">
            <div
              class="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-200"
            >
              <div class="flex items-center gap-2">
                <span class="text-yellow-500 text-lg">⚡</span>
                <span class="font-bold text-yellow-700">{{
                  playerStore?.player?.energy?.toLocaleString()
                }}</span>
              </div>
              <div class="w-px h-5 bg-gray-300"></div>
              <div class="flex items-center gap-2">
                <span class="text-blue-500 text-lg">💎</span>
                <span class="font-bold text-blue-700">{{
                  playerStore?.player?.gems?.toLocaleString()
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Shop Content -->
    <div class="container mx-auto px-4 py-8">
      <!-- Pack Statistics -->
      <div
        class="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-lg max-w-6xl mx-auto"
      >
        <h3 class="text-xl font-bold text-gray-800 mb-4">Pack Statistics</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">{{ packStats.totalPacks }}</div>
            <div class="text-sm text-gray-600">Total Packs</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">{{ packStats.legendaryCards }}</div>
            <div class="text-sm text-gray-600">Legendary Cards</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-pink-600">{{ packStats.epicCards }}</div>
            <div class="text-sm text-gray-600">Epic Cards</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">{{ packStats.totalCards }}</div>
            <div class="text-sm text-gray-600">Total Cards</div>
          </div>
        </div>
      </div>

      <!-- Pack Types -->
      <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <!-- Basic Pack -->
        <div
          class="group relative bg-white rounded-2xl p-8 border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-200/50"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          ></div>
          <div
            class="absolute -top-10 -right-10 w-40 h-40 bg-blue-300/30 rounded-full blur-3xl animate-pulse"
          ></div>
          <div class="relative text-center">
            <div
              class="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300 animate-pulse"
            >
              📦
            </div>
            <h3 class="text-2xl font-bold mb-3 text-blue-700">Basic Pack</h3>
            <p class="text-sm text-blue-600 mb-2">5 Random Cards</p>
            <p class="text-xs text-blue-700 mb-6 font-bold bg-blue-100 inline-block px-3 py-1 rounded-full">⭐ 1 Rare+ Guaranteed</p>
            <button
              @click="buyPack('basic')"
              class="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-blue-500/50"
            >
              <span class="flex items-center justify-center gap-2 text-lg">
                <span>100</span>
                <span class="text-yellow-300 text-xl">⚡</span>
              </span>
            </button>
          </div>
        </div>

        <!-- Premium Pack -->
        <div
          class="group relative bg-white rounded-2xl p-8 border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-200/50"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-purple-100/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          ></div>
          <div
            class="absolute -top-10 -right-10 w-40 h-40 bg-purple-300/30 rounded-full blur-3xl animate-pulse"
            style="animation-delay: 1s"
          ></div>
          <div class="relative text-center">
            <div
              class="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300 animate-pulse"
              style="animation-delay: 0.5s"
            >
              🎁
            </div>
            <h3 class="text-2xl font-bold mb-3 text-purple-700">Premium Pack</h3>
            <p class="text-sm text-purple-600 mb-2">8 Random Cards</p>
            <p class="text-xs text-purple-700 mb-6 font-bold bg-purple-100 inline-block px-3 py-1 rounded-full">⭐ 2 Epic+ Guaranteed</p>
            <button
              @click="buyPack('premium')"
              class="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-purple-500/50"
            >
              <span class="flex items-center justify-center gap-2 text-lg">
                <span>50</span>
                <span class="text-blue-300 text-xl">💎</span>
              </span>
            </button>
          </div>
        </div>

        <!-- Legendary Pack -->
        <div
          class="group relative bg-white rounded-2xl p-8 border-2 border-yellow-200 hover:border-yellow-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-200/50"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-yellow-100/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          ></div>
          <div
            class="absolute -top-10 -right-10 w-40 h-40 bg-yellow-300/30 rounded-full blur-3xl animate-pulse"
            style="animation-delay: 2s"
          ></div>
          <div class="relative text-center">
            <div
              class="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300 animate-pulse"
              style="animation-delay: 1s"
            >
              👑
            </div>
            <h3 class="text-2xl font-bold mb-3 text-yellow-700">Legendary Pack</h3>
            <p class="text-sm text-yellow-600 mb-2">10 Random Cards</p>
            <p class="text-xs text-yellow-700 mb-6 font-bold bg-yellow-100 inline-block px-3 py-1 rounded-full">⭐ 1 Legendary Guaranteed</p>
            <button
              @click="buyPack('legendary')"
              class="bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-700 hover:to-amber-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-yellow-500/50"
            >
              <span class="flex items-center justify-center gap-2 text-lg">
                <span>100</span>
                <span class="text-blue-300 text-xl">💎</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pack Opening Animation -->
    <Transition name="modal">
      <div
        v-if="showPackOpening"
        class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        @click.self="closePackOpening"
      >
        <div class="text-center max-w-6xl mx-auto px-4">
          <div class="text-6xl mb-4 animate-bounce">{{ packEmoji }}</div>
          <h3 class="text-2xl font-bold text-white mb-4">Opening Pack...</h3>
          <div v-if="openedCards.length > 0" class="grid grid-cols-5 gap-4 mt-8">
            <div
              v-for="(card, index) in openedCards"
              :key="index"
              class="animate-fade-in"
              :style="{ animationDelay: `${index * 0.2}s` }"
            >
              <BattleCard :card="card" :size="'small'" />
            </div>
          </div>
          <div v-if="openedCards.length > 0" class="flex gap-4 justify-center mt-8">
            <button
              @click="closePackOpening"
              class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Đóng
            </button>
            <button
              v-if="canOpenAnotherPack"
              @click="openAnotherPack"
              class="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-all transform hover:scale-105"
            >
              <span class="flex items-center gap-2">
                <span>{{ currentPackEmoji }}</span>
                <span>Mở thêm gói</span>
                <span class="text-sm opacity-90"
                  >({{ currentPackCost }} {{ currentPackCurrency }})</span
                >
              </span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCardBattleStore } from '@/stores/cardBattle';
import { usePlayerStore } from '@/stores/player';
import { useToast } from '@/composables/useToast';
import BattleCard from '@/components/BattleCard.vue';
import { useFirebase } from '@/composables/useFirebase';

const firebase = useFirebase();

const cardBattleStore = useCardBattleStore();
const playerStore = usePlayerStore();
const packStats = ref({
  totalPacks: 0,
  basicPacks: 0,
  premiumPacks: 0,
  legendaryPacks: 0,
  totalCards: 0,
  legendaryCards: 0,
  epicCards: 0,
  rareCards: 0,
  commonCards: 0,
});
const toast = useToast();

const showPackOpening = ref(false);
const packEmoji = ref('📦');
const openedCards = ref([]);
const currentPackType = ref(null);

const packInfo = {
  basic: { cost: 100, currency: 'energy', emoji: '📦', name: 'Basic Pack', currencyDisplay: '⚡' },
  premium: { cost: 50, currency: 'gems', emoji: '🎁', name: 'Premium Pack', currencyDisplay: '💎' },
  legendary: {
    cost: 100,
    currency: 'gems',
    emoji: '👑',
    name: 'Legendary Pack',
    currencyDisplay: '💎',
  },
};

// Computed properties for "Open Another Pack" button
const currentPackInfo = computed(() => {
  return currentPackType.value ? packInfo[currentPackType.value] : null;
});

const canOpenAnotherPack = computed(() => {
  if (!currentPackType.value || !currentPackInfo.value) return false;
  const pack = currentPackInfo.value;
  return playerStore.player?.[pack.currency] >= pack.cost;
});

const currentPackEmoji = computed(() => currentPackInfo.value?.emoji || '📦');
const currentPackCost = computed(() => currentPackInfo.value?.cost || 0);
const currentPackCurrency = computed(() => currentPackInfo.value?.currencyDisplay || '⚡');

// Load pack stats on mount
const loadPackStats = async () => {
  try {
    console.log('Loading pack stats...');
    const stats = await playerStore.getPackStats();
    console.log('Pack stats:', stats);
    packStats.value = stats;
  } catch (error) {
    console.error('Error loading pack stats:', error);
  }
};

const buyPack = async type => {
  const pack = packInfo[type];

  if (playerStore.player?.[pack.currency] >= pack.cost) {
    currentPackType.value = type;
    packEmoji.value = pack.emoji;
    showPackOpening.value = true;
    openedCards.value = [];

    const cards = await playerStore.buyPack(type);

    toast.success('Pack Purchased!', `Opened ${pack.name}`);

    // Reload pack stats after opening
    await loadPackStats();

    setTimeout(() => {
      openedCards.value = cards;
    }, 1000);
  } else {
    const currencyName = pack.currency === 'energy' ? 'Energy' : 'Gems';
    toast.error('Insufficient Funds', `Not enough ${currencyName}!`);
  }
};

const openAnotherPack = async () => {
  if (!currentPackType.value) return;

  // Close current modal first
  openedCards.value = [];

  // Open another pack of the same type
  await buyPack(currentPackType.value);
};

const closePackOpening = () => {
  showPackOpening.value = false;
  openedCards.value = [];
  currentPackType.value = null;
};

onMounted(async () => {
  console.log('Shop page mounted');
  // Always ensure player and card database initialized
  await cardBattleStore.initializePlayer();
  await loadPackStats();
  console.log('Shop page fully loaded');
});
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
  opacity: 0;
}
</style>
