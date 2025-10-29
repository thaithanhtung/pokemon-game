<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-3xl font-bold text-white">Card Collection</h2>
        <p class="text-gray-400">{{ filteredCards.length }} cards</p>
      </div>
      <div class="flex gap-4">
        <button
          @click="showMergeMode = !showMergeMode"
          :class="[
            'px-4 py-2 rounded-lg transition-colors',
            showMergeMode
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-green-700 hover:bg-green-600 text-white',
          ]"
        >
          {{ showMergeMode ? 'Exit Merge Mode' : 'Merge Cards' }}
        </button>
        <button
          @click="showPackHistory = !showPackHistory"
          class="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
        >
          {{ showPackHistory ? 'Hide' : 'Show' }} Pack History
        </button>
        <button
          @click="$emit('back')"
          class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
        >
          Back
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="grid md:grid-cols-4 gap-4 mb-6">
      <div>
        <label class="text-sm text-gray-400 mb-1 block">Type</label>
        <select
          v-model="filterType"
          class="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700"
        >
          <option value="all">All Types</option>
          <option value="pokemon">Pokemon</option>
          <option value="skill">Skills</option>
          <option value="item">Items</option>
        </select>
      </div>

      <div>
        <label class="text-sm text-gray-400 mb-1 block">Rarity</label>
        <select
          v-model="filterRarity"
          class="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700"
        >
          <option value="all">All Rarities</option>
          <option value="C">Common</option>
          <option value="R">Rare</option>
          <option value="E">Epic</option>
          <option value="L">Legendary</option>
        </select>
      </div>

      <div>
        <label class="text-sm text-gray-400 mb-1 block">Sort By</label>
        <select
          v-model="sortBy"
          class="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700"
        >
          <option value="name">Name</option>
          <option value="rarity">Rarity</option>
          <option value="type">Type</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      <div>
        <label class="text-sm text-gray-400 mb-1 block">Search</label>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search cards..."
          class="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700"
        />
      </div>
    </div>

    <!-- Stats Summary -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-gray-700">
        <div class="text-2xl font-bold text-white">{{ stats.total }}</div>
        <div class="text-sm text-gray-400">Total Cards</div>
      </div>
      <div class="bg-blue-900/30 backdrop-blur rounded-lg p-4 border border-blue-700">
        <div class="text-2xl font-bold text-blue-400">{{ stats.pokemon }}</div>
        <div class="text-sm text-gray-400">Pokemon</div>
      </div>
      <div class="bg-purple-900/30 backdrop-blur rounded-lg p-4 border border-purple-700">
        <div class="text-2xl font-bold text-purple-400">{{ stats.skills }}</div>
        <div class="text-sm text-gray-400">Skills</div>
      </div>
      <div class="bg-green-900/30 backdrop-blur rounded-lg p-4 border border-green-700">
        <div class="text-2xl font-bold text-green-400">{{ stats.items }}</div>
        <div class="text-sm text-gray-400">Items</div>
      </div>
    </div>

    <!-- Pack History -->
    <div
      v-if="showPackHistory"
      class="mb-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
    >
      <h3 class="text-xl font-bold text-white mb-4">Recent Pack History</h3>
      <div v-if="recentPacks.length === 0" class="text-center text-white/70 py-8">
        No packs opened yet. Visit the Shop to open your first pack!
      </div>
      <div v-else class="space-y-4">
        <div
          v-for="pack in recentPacks"
          :key="pack.id"
          class="bg-slate-700/50 rounded-lg p-4 border border-white/10"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ getPackEmoji(pack.type) }}</span>
              <div>
                <h4 class="font-semibold text-white">{{ getPackName(pack.type) }}</h4>
                <p class="text-sm text-white/70">{{ formatDate(pack.timestamp) }}</p>
              </div>
            </div>
            <div class="text-sm text-white/70">{{ pack.cards.length }} cards</div>
          </div>
          <div class="grid grid-cols-5 gap-2">
            <div v-for="card in pack.cards" :key="card.id" class="relative">
              <div class="bg-slate-600 rounded p-2 text-center">
                <div class="text-xs font-semibold text-white truncate">{{ card.name }}</div>
                <div class="text-xs" :class="getRarityColor(card.rarity)">{{ card.rarity }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Merge Mode Info -->
    <div
      v-if="showMergeMode"
      class="mb-6 bg-green-900/30 backdrop-blur rounded-lg p-4 border border-green-700"
    >
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-bold text-white mb-2">Merge Mode Active</h3>
          <p class="text-sm text-gray-300">
            Select 3 identical cards to merge them into a higher level card
          </p>
          <p class="text-xs text-gray-400 mt-1">
            Each level increases all stats by 50% (Max Level: 9)
          </p>
          <p class="text-xs text-yellow-400 mt-1">Only showing Pokemon cards with 3+ duplicates</p>
          <p class="text-xs text-blue-400 mt-1">
            {{ mergeableCardsCount }} mergeable card types available
          </p>
        </div>
        <div v-if="selectedForMerge.length > 0" class="text-center">
          <div class="text-2xl font-bold text-white">{{ selectedForMerge.length }} / 3</div>
          <div class="text-sm text-gray-400">Cards Selected</div>
          <button
            v-if="selectedForMerge.length === 3"
            @click="performMerge"
            class="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold"
          >
            Merge Cards
          </button>
        </div>
      </div>
    </div>

    <!-- Cards Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      <div
        v-for="card in filteredCards"
        :key="card.uid"
        @click="showMergeMode ? toggleMergeSelection(card) : selectCard(card)"
        :class="[
          'cursor-pointer relative',
          showMergeMode && isSelectedForMerge(card) ? 'ring-4 ring-green-500 rounded-lg' : '',
        ]"
      >
        <BattleCard
          :card="card"
          size="medium"
          :selected="!showMergeMode && selectedCard?.uid === card.uid"
        />
        <!-- <div class="text-center text-xs text-gray-400 mt-1">
          {{ card.name }}
          <span
            v-if="card.type === 'pokemon'"
            :class="[
              'font-bold ml-1',
              card.level && card.level > 1 ? 'text-yellow-400' : 'text-gray-500',
            ]"
          >
            Lv.{{ card.level || 1 }}
          </span>
        </div> -->
        <!-- Duplicate Count Indicator -->
        <!-- <div
          v-if="card.type === 'pokemon' && getDuplicateCount(card) >= 3"
          class="absolute top-2 left-2 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
          title="Can be merged!"
        >
          {{ getDuplicateCount(card) }}
        </div> -->
        <!-- Merge Selection Indicator -->
        <div
          v-if="showMergeMode && isSelectedForMerge(card)"
          class="absolute top-2 right-2 bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold"
        >
          {{ getMergeSelectionIndex(card) + 1 }}
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredCards.length === 0" class="text-center py-20 text-gray-400">
      <div class="text-6xl mb-4">
        {{ showMergeMode ? '🔒' : '📭' }}
      </div>
      <p class="text-xl">
        {{ showMergeMode ? 'No mergeable cards found' : 'No cards found' }}
      </p>
      <p class="text-sm">
        {{
          showMergeMode
            ? 'You need at least 3 identical Pokemon cards to merge'
            : 'Try adjusting your filters'
        }}
      </p>
      <div v-if="showMergeMode" class="mt-4 text-xs text-gray-500">
        <p>• Only Pokemon cards can be merged</p>
        <p>• Cards must be the same Pokemon and level</p>
        <p>• You need 3+ duplicates to merge</p>
      </div>
    </div>

    <!-- Card Detail Modal -->
    <Transition name="modal">
      <div
        v-if="selectedCard"
        class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        @click="selectedCard = null"
      >
        <div class="bg-gray-800 rounded-xl p-6 max-w-lg w-full" @click.stop>
          <div class="flex justify-between items-start mb-6">
            <div>
              <h3 class="text-2xl font-bold text-white">Card Details</h3>
              <p class="text-gray-400 text-sm mt-1">{{ selectedCard.name }}</p>
            </div>
            <button @click="selectedCard = null" class="text-gray-400 hover:text-white text-2xl">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Card Preview -->
          <div class="flex justify-center mb-6">
            <BattleCard :card="selectedCard" size="large" />
          </div>

          <!-- Additional Information -->
          <div class="bg-gray-700/50 rounded-lg p-4 space-y-3">
            <!-- Skills for Pokemon Cards -->
            <div v-if="selectedCard.type === 'pokemon' && selectedCard.skills" class="space-y-2">
              <h4 class="font-semibold text-white mb-2">
                <i class="fas fa-fire mr-2"></i>Skills
              </h4>
              <div
                v-for="skill in selectedCard.skills"
                :key="skill.name"
                class="bg-gray-800 rounded-lg p-3"
              >
                <div class="flex justify-between items-center mb-1">
                  <span class="text-white font-medium">{{ skill.name }}</span>
                  <span class="text-red-400 text-sm font-bold">{{ skill.damage }} DMG</span>
                </div>
                <div class="text-xs text-gray-400">
                  <i class="fas fa-bolt mr-1"></i>{{ skill.energy }} Energy • {{ skill.description }}
                </div>
              </div>
            </div>

            <!-- Description for Skill/Item Cards -->
            <div v-else-if="selectedCard.type !== 'pokemon'" class="text-white">
              <h4 class="font-semibold mb-2">
                <i class="fas fa-info-circle mr-2"></i>Effect
              </h4>
              <p class="text-gray-300">{{ selectedCard.description }}</p>
            </div>

            <!-- Card Metadata -->
            <div class="pt-3 border-t border-gray-600 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-xs font-semibold',
                    getRarityColor(selectedCard.rarity),
                  ]"
                >
                  <i class="fas fa-star mr-1"></i>
                  {{ getRarityName(selectedCard.rarity) }}
                </span>
                <span v-if="selectedCard.obtainedFrom" class="text-xs text-gray-400">
                  <i class="fas fa-box-open mr-1"></i>
                  From {{ selectedCard.obtainedFrom }}
                </span>
              </div>
              <span class="text-xs text-gray-500">
                UID: {{ selectedCard.uid?.slice(0, 8) }}...
              </span>
            </div>

            <!-- Pokemon-specific info -->
            <div v-if="selectedCard.type === 'pokemon'" class="pt-3 border-t border-gray-600">
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="text-gray-400">
                  <i class="fas fa-tag mr-1"></i>Type: 
                  <span class="text-white">{{ selectedCard.pokemonType }}</span>
                </div>
                <div class="text-gray-400">
                  <i class="fas fa-bolt mr-1"></i>Energy: 
                  <span class="text-yellow-400">{{ selectedCard.energy }}⚡</span>
                </div>
                <div v-if="selectedCard.level > 1" class="text-gray-400">
                  <i class="fas fa-level-up-alt mr-1"></i>Level: 
                  <span class="text-yellow-400">{{ selectedCard.level }}</span>
                </div>
                <div v-if="selectedCard.obtainedAt" class="text-gray-400">
                  <i class="fas fa-calendar mr-1"></i>Obtained: 
                  <span class="text-white">{{ formatDate(selectedCard.obtainedAt) }}</span>
                </div>
              </div>
              
              <!-- Pokemon Stats -->
              <div class="mt-3 pt-3 border-t border-gray-600">
                <h4 class="font-semibold text-white mb-2">
                  <i class="fas fa-chart-bar mr-2"></i>Base Stats
                  <span class="text-xs text-blue-400 ml-2" title="Stats are fetched from PokeAPI">
                    <i class="fas fa-info-circle"></i> From API
                  </span>
                </h4>
                <div class="space-y-1">
                  <div class="flex justify-between items-center">
                    <span class="text-gray-400 text-xs">HP</span>
                    <div class="flex items-center gap-2">
                      <div class="w-32 bg-gray-700 rounded-full h-2">
                        <div 
                          class="bg-red-500 h-2 rounded-full" 
                          :style="{width: `${Math.min((selectedCard.hp / 255) * 100, 100)}%`}"
                        ></div>
                      </div>
                      <span class="text-white text-xs w-8 text-right">{{ selectedCard.hp }}</span>
                    </div>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-gray-400 text-xs">ATK</span>
                    <div class="flex items-center gap-2">
                      <div class="w-32 bg-gray-700 rounded-full h-2">
                        <div 
                          class="bg-orange-500 h-2 rounded-full" 
                          :style="{width: `${Math.min((selectedCard.atk / 255) * 100, 100)}%`}"
                        ></div>
                      </div>
                      <span class="text-white text-xs w-8 text-right">{{ selectedCard.atk }}</span>
                    </div>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-gray-400 text-xs">DEF</span>
                    <div class="flex items-center gap-2">
                      <div class="w-32 bg-gray-700 rounded-full h-2">
                        <div 
                          class="bg-yellow-500 h-2 rounded-full" 
                          :style="{width: `${Math.min((selectedCard.def / 255) * 100, 100)}%`}"
                        ></div>
                      </div>
                      <span class="text-white text-xs w-8 text-right">{{ selectedCard.def }}</span>
                    </div>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-gray-400 text-xs">SPD</span>
                    <div class="flex items-center gap-2">
                      <div class="w-32 bg-gray-700 rounded-full h-2">
                        <div 
                          class="bg-blue-500 h-2 rounded-full" 
                          :style="{width: `${Math.min((selectedCard.spd / 255) * 100, 100)}%`}"
                        ></div>
                      </div>
                      <span class="text-white text-xs w-8 text-right">{{ selectedCard.spd }}</span>
                    </div>
                  </div>
                </div>
                <p class="text-xs text-gray-500 mt-2">
                  <i class="fas fa-info-circle mr-1"></i>
                  Stats based on official Pokemon data with {{ getRarityName(selectedCard.rarity) }} multiplier
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useCardBattleStore } from '@/stores/cardBattle';
import { usePlayerStore } from '@/stores/player';
import { useToast } from '@/composables/useToast';
import BattleCard from '@/components/BattleCard.vue';

defineEmits(['back']);

const playerStore = usePlayerStore();
const { showToast } = useToast();

const filterType = ref('all');
const filterRarity = ref('all');
const sortBy = ref('name');
const searchQuery = ref('');
const selectedCard = ref(null);
const showPackHistory = ref(false);
const recentPacks = ref([]);
const showMergeMode = ref(false);
const selectedForMerge = ref([]);
console.log('recentPacks', recentPacks.value);

// Load recent packs
const loadRecentPacks = async () => {
  try {
    console.log('Loading recent packs...');
    const packs = await playerStore.getRecentPacks();
    console.log('Recent packs loaded:', packs);
    recentPacks.value = packs;
  } catch (error) {
    console.error('Error loading recent packs:', error);
    recentPacks.value = [];
  }
};

// Load recent packs on component mount
onMounted(async () => {
  // Load recent packs
  await loadRecentPacks();
  
  // Reload cards from Firebase to ensure we have the latest data
  try {
    const firebase = playerStore.getFirebase();
    if (firebase && firebase.isAuthenticated.value) {
      const latestCards = await firebase.getUserCards();
      if (latestCards && latestCards.length > 0) {
        playerStore.player.cards = latestCards;
        console.log('Cards refreshed from Firebase:', latestCards.length);
      }
    }
  } catch (error) {
    console.error('Error refreshing cards:', error);
  }
});

// Watch for pack history toggle
watch(showPackHistory, newValue => {
  if (newValue && recentPacks.value.length === 0) {
    loadRecentPacks();
  }
});

const filteredCards = computed(() => {
  let cards = [...(playerStore.player?.cards || [])];

  // Filter by type
  if (filterType.value !== 'all') {
    cards = cards.filter(card => card.type === filterType.value);
  }

  // Filter by rarity
  if (filterRarity.value !== 'all') {
    cards = cards.filter(card => card.rarity === filterRarity.value);
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    cards = cards.filter(card => card.name.toLowerCase().includes(query));
  }

  // Filter mergeable cards when in merge mode
  if (showMergeMode.value) {
    cards = cards.filter(card => {
      // Only show Pokemon cards
      if (card.type !== 'pokemon') return false;

      // Only show cards that have at least 3 duplicates
      const duplicateCount = getDuplicateCount(card);
      return duplicateCount >= 3;
    });
  }

  // Sort
  cards.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'rarity':
        const rarityOrder = { L: 0, E: 1, R: 2, C: 3 };
        return rarityOrder[a.rarity] - rarityOrder[b.rarity];
      case 'type':
        return a.type.localeCompare(b.type);
      case 'newest':
        return b.uid.localeCompare(a.uid);
      default:
        return 0;
    }
  });

  return cards;
});

// Count duplicate cards for merge indicator
const getDuplicateCount = card => {
  if (!card || card.type !== 'pokemon') return 0;

  const allCards = playerStore.player?.cards || [];
  const level = card.level || 1;

  console.log('allCards', allCards);

  return allCards.filter(
    c => c.type === 'pokemon' && c.pokemonId === card.pokemonId && (c.level || 1) === level
  ).length;
};

const stats = computed(() => {
  const cards = playerStore.player?.cards || [];
  return {
    total: cards.length,
    pokemon: cards.filter(c => c.type === 'pokemon').length,
    skills: cards.filter(c => c.type === 'skill').length,
    items: cards.filter(c => c.type === 'item').length,
  };
});

// Count mergeable cards
const mergeableCardsCount = computed(() => {
  if (!showMergeMode.value) return 0;

  const cards = playerStore.player?.cards || [];
  const pokemonCards = cards.filter(card => card.type === 'pokemon');

  // Count unique Pokemon types that have 3+ duplicates
  const mergeableTypes = new Set();
  pokemonCards.forEach(card => {
    const duplicateCount = getDuplicateCount(card);
    if (duplicateCount >= 3) {
      mergeableTypes.add(`${card.pokemonId}_${card.level || 1}`);
    }
  });

  return mergeableTypes.size;
});

const selectCard = card => {
  selectedCard.value = card;
};

const getRarityColor = rarity => {
  const colors = {
    C: 'bg-gray-600 text-white',
    R: 'bg-blue-600 text-white',
    E: 'bg-purple-600 text-white',
    L: 'bg-orange-500 text-white',
  };
  return colors[rarity] || colors.C;
};

const getRarityName = rarity => {
  const names = {
    C: 'Common',
    R: 'Rare',
    E: 'Epic',
    L: 'Legendary',
  };
  return names[rarity] || 'Common';
};

// Pack history helper methods
const getPackEmoji = packType => {
  const emojis = {
    basic: '📦',
    premium: '🎁',
    legendary: '👑',
  };
  return emojis[packType] || '📦';
};

const getPackName = packType => {
  const names = {
    basic: 'Basic Pack',
    premium: 'Premium Pack',
    legendary: 'Legendary Pack',
  };
  return names[packType] || 'Unknown Pack';
};

const formatDate = timestamp => {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

// Merge related methods
const toggleMergeSelection = card => {
  if (!card || card.type !== 'pokemon') return;

  const index = selectedForMerge.value.findIndex(c => c.uid === card.uid);

  if (index > -1) {
    // Remove from selection
    selectedForMerge.value.splice(index, 1);
    showToast(`${card.name} removed from merge selection`, 'info');
  } else {
    // Check if we can add this card
    if (selectedForMerge.value.length >= 3) {
      showToast('Already selected 3 cards for merging!', 'warning');
      return;
    }

    // Check if this card matches the others (same pokemon ID and level)
    if (selectedForMerge.value.length > 0) {
      const firstCard = selectedForMerge.value[0];
      const cardLevel = card.level || 1;
      const firstCardLevel = firstCard.level || 1;

      if (card.pokemonId !== firstCard.pokemonId || cardLevel !== firstCardLevel) {
        // Different pokemon or different level
        showToast(`Can only merge identical Pokemon of the same level!`, 'warning');
        return;
      }
    }

    // Add to selection
    selectedForMerge.value.push(card);
    
    if (selectedForMerge.value.length === 3) {
      showToast('3 cards selected! Click "Merge Cards" to proceed.', 'success');
    } else {
      showToast(`${card.name} selected (${selectedForMerge.value.length}/3)`, 'info');
    }
  }
};

const isSelectedForMerge = card => {
  return selectedForMerge.value.some(c => c.uid === card.uid);
};

const getMergeSelectionIndex = card => {
  return selectedForMerge.value.findIndex(c => c.uid === card.uid);
};

const performMerge = async () => {
  if (selectedForMerge.value.length !== 3) return;

  const cardsToMerge = [...selectedForMerge.value];
  const baseCard = cardsToMerge[0];
  const currentLevel = baseCard.level || 1;

  if (currentLevel >= 9) {
    showToast('Maximum level reached! Cannot merge Level 9 cards.', 'warning');
    return;
  }

  const percentIncrease = 0.2;

  // Calculate new stats (increase by 50% per level)
  const newLevel = currentLevel + 1;
  const statMultiplier = Math.pow(1 + percentIncrease, newLevel - 1);

  // Get base stats (level 1 stats)
  const baseHp = baseCard.maxHp
    ? baseCard.maxHp / Math.pow(1 + percentIncrease, currentLevel - 1)
    : baseCard.hp / Math.pow(1 + percentIncrease, currentLevel - 1);
  const baseAtk = baseCard.atk / Math.pow(1 + percentIncrease, currentLevel - 1);
  const baseDef = baseCard.def / Math.pow(1 + percentIncrease, currentLevel - 1);
  const baseSpd = baseCard.spd / Math.pow(1 + percentIncrease, currentLevel - 1);

  // Create merged card
  const mergedCard = {
    ...baseCard,
    uid: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    level: newLevel,
    hp: Math.round(baseHp * statMultiplier),
    maxHp: Math.round(baseHp * statMultiplier),
    atk: Math.round(baseAtk * statMultiplier),
    def: Math.round(baseDef * statMultiplier),
    spd: Math.round(baseSpd * statMultiplier),
    mergedAt: Date.now(),
    sourceCards: cardsToMerge.map(c => c.uid),
  };

  try {
    // Remove the 3 cards from collection
    cardsToMerge.forEach(card => {
      const index = playerStore.player.cards.findIndex(c => c.uid === card.uid);
      if (index > -1) {
        playerStore.player.cards.splice(index, 1);
      }
    });

    // Add the merged card
    playerStore.player.cards.push(mergedCard);

    // Save to Firebase - Use userCards collection (same as pack opening)
    const firebase = playerStore.getFirebase();
    if (firebase) {
      await firebase.saveUserCardsToFirestore(playerStore.player.cards);

      // Log the merge event
      await firebase.logCardMerge({
        sourceCards: cardsToMerge.map(c => ({
          uid: c.uid,
          name: c.name,
          level: c.level || 1,
        })),
        resultCard: mergedCard,
      });
    }

    // Clear selection
    selectedForMerge.value = [];
    showMergeMode.value = false;

    // Show success message with detailed stats
    const statsMessage = `HP: ${mergedCard.hp} | ATK: ${mergedCard.atk} | DEF: ${mergedCard.def} | SPD: ${mergedCard.spd}`;
    showToast(`🎉 Successfully merged into ${mergedCard.name} Level ${newLevel}!`, 'success');
    
    // Show additional notification with stats after a short delay
    setTimeout(() => {
      showToast(`New stats: ${statsMessage}`, 'info');
    }, 500);
  } catch (error) {
    console.error('Error merging cards:', error);
    showToast('Failed to merge cards. Please try again.', 'error');

    // Rollback on error
    cardsToMerge.forEach(card => {
      if (!playerStore.player.cards.find(c => c.uid === card.uid)) {
        playerStore.player.cards.push(card);
      }
    });

    // Remove merged card if it was added
    const mergedIndex = playerStore.player.cards.findIndex(c => c.uid === mergedCard.uid);
    if (mergedIndex > -1) {
      playerStore.player.cards.splice(mergedIndex, 1);
    }
  }
};

// Clear merge selection when exiting merge mode
watch(showMergeMode, newValue => {
  if (newValue) {
    // Entering merge mode
    if (mergeableCardsCount.value === 0) {
      showToast('No mergeable cards found. You need 3+ identical Pokemon cards.', 'warning');
      showMergeMode.value = false;
    } else {
      showToast(`Merge mode activated! Found ${mergeableCardsCount.value} mergeable card types.`, 'info');
    }
  } else {
    // Exiting merge mode
    if (selectedForMerge.value.length > 0) {
      selectedForMerge.value = [];
      showToast('Merge mode deactivated. Selection cleared.', 'info');
    }
  }
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
</style>
