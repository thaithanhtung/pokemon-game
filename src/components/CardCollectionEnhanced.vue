<template>
  <div class="card-collection-enhanced">
    <!-- Controls Bar -->
    <div class="bg-white rounded-lg shadow-md p-4 mb-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <!-- Filter Controls -->
        <div class="flex flex-wrap items-center gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              v-model="filterType"
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="pokemon">Pokémon</option>
              <option value="skill">Skills</option>
              <option value="item">Items</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Rarity</label>
            <select
              v-model="filterRarity"
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Rarities</option>
              <option value="C">Common</option>
              <option value="R">Rare</option>
              <option value="E">Epic</option>
              <option value="L">Legendary</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              v-model="sortBy"
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="name">Name</option>
              <option value="rarity">Rarity</option>
              <option value="power">Power</option>
              <option value="recent">Recently Added</option>
            </select>
          </div>
        </div>

        <!-- View Toggle -->
        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              v-model="enable3D"
              class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            >
            <span class="text-sm font-medium text-gray-700">3D View</span>
          </label>

          <div class="text-sm text-gray-600">
            <span class="font-semibold">{{ filteredCards.length }}</span> Cards
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow-md p-4 text-center">
        <div class="text-3xl font-bold text-purple-600">{{ totalCards }}</div>
        <div class="text-sm text-gray-600">Total Cards</div>
      </div>
      <div class="bg-white rounded-lg shadow-md p-4 text-center">
        <div class="text-3xl font-bold text-orange-600">{{ legendaryCount }}</div>
        <div class="text-sm text-gray-600">Legendary</div>
      </div>
      <div class="bg-white rounded-lg shadow-md p-4 text-center">
        <div class="text-3xl font-bold text-blue-600">{{ megaCount }}</div>
        <div class="text-sm text-gray-600">Mega Evolution</div>
      </div>
      <div class="bg-white rounded-lg shadow-md p-4 text-center">
        <div class="text-3xl font-bold text-green-600">{{ uniquePokemon }}</div>
        <div class="text-sm text-gray-600">Unique Pokémon</div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>

    <!-- Cards Grid -->
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      <transition-group name="card-list" appear>
        <div
          v-for="card in paginatedCards"
          :key="card.id"
          class="card-wrapper"
          @click="selectCard(card)"
        >
          <!-- 3D Babylon Card -->
          <BabylonCard
            v-if="enable3D"
            :card="card"
            size="medium"
            :holographic="card.rarity === 'L' || card.name?.toLowerCase().includes('mega')"
            @click="selectCard(card)"
          />
          <!-- Standard Card -->
          <BattleCard
            v-else
            :card="card"
            size="medium"
            :selected="selectedCard?.id === card.id"
            @click="selectCard(card)"
          />
          
          <!-- Card count badge -->
          <div
            v-if="card.count && card.count > 1"
            class="absolute top-2 right-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10"
          >
            x{{ card.count }}
          </div>
        </div>
      </transition-group>
    </div>

    <!-- Empty State -->
    <div
      v-if="!loading && filteredCards.length === 0"
      class="text-center py-12 bg-white rounded-lg shadow-md"
    >
      <div class="text-6xl mb-4">📦</div>
      <h3 class="text-xl font-semibold text-gray-800 mb-2">No cards found</h3>
      <p class="text-gray-600">Try adjusting your filters or buy some card packs!</p>
      <router-link
        to="/card-clash/shop"
        class="inline-block mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
      >
        Visit Shop
      </router-link>
    </div>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1"
      class="flex justify-center items-center gap-2 mt-8"
    >
      <button
        @click="currentPage--"
        :disabled="currentPage === 1"
        class="px-4 py-2 bg-white rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
      >
        Previous
      </button>
      
      <div class="flex gap-1">
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="currentPage = page"
          :class="[
            'w-10 h-10 rounded-lg transition-all',
            page === currentPage
              ? 'bg-purple-600 text-white font-bold shadow-lg'
              : 'bg-white hover:bg-gray-100 shadow-md'
          ]"
        >
          {{ page }}
        </button>
      </div>
      
      <button
        @click="currentPage++"
        :disabled="currentPage === totalPages"
        class="px-4 py-2 bg-white rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
      >
        Next
      </button>
    </div>

    <!-- Card Detail Modal -->
    <CardDetailModal
      v-if="selectedCard"
      :card="selectedCard"
      :enable3D="enable3D"
      @close="selectedCard = null"
      @use-in-deck="addToDeck"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usePlayerStore } from '@/stores/player';
import { useToast } from '@/composables/useToast';
import BattleCard from '@/components/BattleCard.vue';
import BabylonCard from '@/components/BabylonCard.vue';
import CardDetailModal from '@/components/CardDetailModal.vue';

const router = useRouter();
const playerStore = usePlayerStore();
const toast = useToast();

// State
const loading = ref(true);
const cards = ref([]);
const selectedCard = ref(null);
const filterType = ref('all');
const filterRarity = ref('all');
const sortBy = ref('name');
const enable3D = ref(false);
const currentPage = ref(1);
const cardsPerPage = 20;

// Load cards
onMounted(async () => {
  try {
    loading.value = true;
    await playerStore.loadPlayer();
    
    if (playerStore.player?.cards) {
      // Group cards by ID and count duplicates
      const cardMap = new Map();
      playerStore.player.cards.forEach(card => {
        const key = `${card.id}_${card.name}`;
        if (cardMap.has(key)) {
          cardMap.get(key).count++;
        } else {
          cardMap.set(key, { ...card, count: 1 });
        }
      });
      cards.value = Array.from(cardMap.values());
    }
  } catch (error) {
    console.error('Failed to load cards:', error);
    toast.error('Failed to load collection', 'Please try again later');
  } finally {
    loading.value = false;
  }
});

// Computed
const filteredCards = computed(() => {
  let filtered = [...cards.value];

  // Filter by type
  if (filterType.value !== 'all') {
    filtered = filtered.filter(card => card.type === filterType.value);
  }

  // Filter by rarity
  if (filterRarity.value !== 'all') {
    filtered = filtered.filter(card => card.rarity === filterRarity.value);
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'rarity':
        const rarityOrder = { L: 0, E: 1, R: 2, C: 3 };
        return (rarityOrder[a.rarity] || 3) - (rarityOrder[b.rarity] || 3);
      case 'power':
        const aPower = (a.hp || 0) + (a.atk || 0) + (a.def || 0) + (a.spd || 0);
        const bPower = (b.hp || 0) + (b.atk || 0) + (b.def || 0) + (b.spd || 0);
        return bPower - aPower;
      case 'recent':
        return (b.addedAt || 0) - (a.addedAt || 0);
      default:
        return 0;
    }
  });

  return filtered;
});

const totalPages = computed(() => 
  Math.ceil(filteredCards.value.length / cardsPerPage)
);

const paginatedCards = computed(() => {
  const start = (currentPage.value - 1) * cardsPerPage;
  const end = start + cardsPerPage;
  return filteredCards.value.slice(start, end);
});

const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  const halfVisible = Math.floor(maxVisible / 2);
  
  let start = Math.max(1, currentPage.value - halfVisible);
  let end = Math.min(totalPages.value, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
});

// Stats
const totalCards = computed(() => 
  cards.value.reduce((sum, card) => sum + (card.count || 1), 0)
);

const legendaryCount = computed(() => 
  cards.value.filter(card => card.rarity === 'L').reduce((sum, card) => sum + (card.count || 1), 0)
);

const megaCount = computed(() => 
  cards.value.filter(card => 
    card.name?.toLowerCase().includes('mega') || card.category === 'mega'
  ).length
);

const uniquePokemon = computed(() => 
  new Set(cards.value.filter(card => card.type === 'pokemon').map(card => card.pokemonId)).size
);

// Methods
const selectCard = (card) => {
  selectedCard.value = card;
};

const addToDeck = (card) => {
  router.push({
    name: 'card-clash-deck-builder',
    query: { addCard: card.id }
  });
};

// Reset page when filters change
watch([filterType, filterRarity, sortBy], () => {
  currentPage.value = 1;
});
</script>

<style scoped>
.card-wrapper {
  position: relative;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card-wrapper:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

/* Card list animations */
.card-list-enter-active,
.card-list-leave-active {
  transition: all 0.3s ease;
}

.card-list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.card-list-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.card-list-move {
  transition: transform 0.3s ease;
}

/* Loading animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>