<template>
  <div class="crafting-container">
    <!-- Header -->
    <header class="sticky top-0 bg-white shadow-md z-20">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <router-link
              to="/card-clash/menu"
              class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <span>←</span>
              <span>Back to Menu</span>
            </router-link>
            <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span>⚗️</span> Card Crafting
            </h1>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8 max-w-7xl">
      <!-- Crafting Tabs -->
      <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div class="flex flex-wrap gap-2 mb-6">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-all duration-300',
              activeTab === tab.id
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ]"
          >
            {{ tab.name }}
          </button>
        </div>

        <!-- Fusion Tab -->
        <div v-if="activeTab === 'fusion'" class="space-y-6">
          <!-- Fusion Area -->
          <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
            <h3 class="text-lg font-bold text-gray-800 mb-4 text-center">Card Fusion</h3>
            
            <div class="grid grid-cols-3 gap-4 mb-6">
              <!-- First Card Slot -->
              <div class="text-center">
                <div
                  @click="selectingSlot = 1"
                  @drop="handleDrop($event, 1)"
                  @dragover.prevent
                  @dragenter.prevent
                  class="relative w-full aspect-[3/4] rounded-xl border-2 border-dashed cursor-pointer transition-all"
                  :class="[
                    fusionSlots[0]
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400',
                  ]"
                >
                  <div v-if="fusionSlots[0]" class="h-full flex flex-col items-center justify-center p-2">
                    <img
                      :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${fusionSlots[0].pokemonId}.png`"
                      :alt="fusionSlots[0].name"
                      class="w-24 h-24"
                    />
                    <p class="text-sm font-semibold text-gray-800 mt-2">{{ fusionSlots[0].name }}</p>
                    <span :class="getRarityClass(fusionSlots[0].rarity)">
                      {{ getRarityName(fusionSlots[0].rarity) }}
                    </span>
                    <button
                      @click.stop="removeFromSlot(0)"
                      class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                  <div v-else class="h-full flex flex-col items-center justify-center">
                    <span class="text-4xl text-gray-400">+</span>
                    <p class="text-sm text-gray-500 mt-2">Select Card</p>
                  </div>
                </div>
              </div>

              <!-- Plus Sign -->
              <div class="flex items-center justify-center">
                <span class="text-4xl text-purple-500">+</span>
              </div>

              <!-- Second Card Slot -->
              <div class="text-center">
                <div
                  @click="selectingSlot = 2"
                  @drop="handleDrop($event, 2)"
                  @dragover.prevent
                  @dragenter.prevent
                  class="relative w-full aspect-[3/4] rounded-xl border-2 border-dashed cursor-pointer transition-all"
                  :class="[
                    fusionSlots[1]
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400',
                  ]"
                >
                  <div v-if="fusionSlots[1]" class="h-full flex flex-col items-center justify-center p-2">
                    <img
                      :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${fusionSlots[1].pokemonId}.png`"
                      :alt="fusionSlots[1].name"
                      class="w-24 h-24"
                    />
                    <p class="text-sm font-semibold text-gray-800 mt-2">{{ fusionSlots[1].name }}</p>
                    <span :class="getRarityClass(fusionSlots[1].rarity)">
                      {{ getRarityName(fusionSlots[1].rarity) }}
                    </span>
                    <button
                      @click.stop="removeFromSlot(1)"
                      class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                  <div v-else class="h-full flex flex-col items-center justify-center">
                    <span class="text-4xl text-gray-400">+</span>
                    <p class="text-sm text-gray-500 mt-2">Select Card</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Result Preview -->
            <div v-if="fusionResult" class="text-center mb-6">
              <div class="text-2xl mb-2">↓</div>
              <div class="inline-block bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4 border-2 border-orange-400">
                <img
                  :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${fusionResult.pokemonId}.png`"
                  :alt="fusionResult.name"
                  class="w-32 h-32 mx-auto"
                />
                <p class="text-lg font-bold text-gray-800 mt-2">{{ fusionResult.name }}</p>
                <span :class="getRarityClass(fusionResult.rarity)">
                  {{ getRarityName(fusionResult.rarity) }}
                </span>
                <div class="text-sm text-gray-600 mt-2">
                  <div>HP: {{ fusionResult.hp }}</div>
                  <div>Attack: {{ fusionResult.attack }}</div>
                </div>
              </div>
            </div>

            <!-- Fusion Button -->
            <div class="text-center">
              <button
                @click="performFusion"
                :disabled="!canFuse"
                :class="[
                  'px-8 py-3 rounded-lg font-bold text-lg transition-all',
                  canFuse
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed',
                ]"
              >
                <span class="mr-2">⚡</span>
                Fuse Cards (Cost: {{ fusionCost }} Energy)
              </button>
            </div>
          </div>

          <!-- Card Selection -->
          <div class="bg-gray-50 rounded-xl p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">Select Cards to Fuse</h3>
            <div class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-64 overflow-y-auto">
              <div
                v-for="card in availableCards"
                :key="card.id"
                @click="selectCard(card)"
                @dragstart="handleDragStart($event, card)"
                draggable="true"
                class="relative cursor-pointer hover:transform hover:scale-105 transition-transform"
                :class="{ 'opacity-50': isCardSelected(card) }"
              >
                <img
                  :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${card.pokemonId}.png`"
                  :alt="card.name"
                  class="w-full rounded-lg border-2"
                  :class="getRarityBorder(card.rarity)"
                />
                <div class="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                  x{{ card.count }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Upgrade Tab -->
        <div v-if="activeTab === 'upgrade'" class="space-y-6">
          <div class="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
            <h3 class="text-lg font-bold text-gray-800 mb-4 text-center">Card Upgrade</h3>
            
            <!-- Upgrade Slot -->
            <div class="max-w-md mx-auto mb-6">
              <div
                @click="selectingUpgradeCard = true"
                class="relative w-48 h-64 mx-auto rounded-xl border-2 border-dashed cursor-pointer transition-all"
                :class="[
                  upgradeCard
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400',
                ]"
              >
                <div v-if="upgradeCard" class="h-full flex flex-col items-center justify-center p-2">
                  <img
                    :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${upgradeCard.pokemonId}.png`"
                    :alt="upgradeCard.name"
                    class="w-32 h-32"
                  />
                  <p class="text-lg font-semibold text-gray-800 mt-2">{{ upgradeCard.name }}</p>
                  <span :class="getRarityClass(upgradeCard.rarity)">
                    {{ getRarityName(upgradeCard.rarity) }}
                  </span>
                  <div class="text-sm text-gray-600 mt-2">
                    <div>Level: {{ upgradeCard.level || 1 }}</div>
                    <div>HP: {{ upgradeCard.hp }}</div>
                    <div>Attack: {{ upgradeCard.attack }}</div>
                  </div>
                  <button
                    @click.stop="upgradeCard = null"
                    class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
                <div v-else class="h-full flex flex-col items-center justify-center">
                  <span class="text-4xl text-gray-400">+</span>
                  <p class="text-sm text-gray-500 mt-2">Select Card to Upgrade</p>
                </div>
              </div>
            </div>

            <!-- Upgrade Preview -->
            <div v-if="upgradeCard" class="text-center mb-6">
              <div class="inline-block bg-white rounded-lg p-4 shadow">
                <h4 class="font-semibold text-gray-800 mb-2">Upgrade Preview</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p class="text-gray-600">Current</p>
                    <div class="font-semibold">
                      <div>Level {{ upgradeCard.level || 1 }}</div>
                      <div>HP: {{ upgradeCard.hp }}</div>
                      <div>ATK: {{ upgradeCard.attack }}</div>
                    </div>
                  </div>
                  <div>
                    <p class="text-gray-600">After Upgrade</p>
                    <div class="font-semibold text-green-600">
                      <div>Level {{ (upgradeCard.level || 1) + 1 }}</div>
                      <div>HP: {{ Math.floor(upgradeCard.hp * 1.2) }}</div>
                      <div>ATK: {{ Math.floor(upgradeCard.attack * 1.2) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Upgrade Materials -->
            <div v-if="upgradeCard" class="text-center mb-6">
              <h4 class="font-semibold text-gray-800 mb-2">Required Materials</h4>
              <div class="flex justify-center gap-4">
                <div class="text-center">
                  <span class="text-2xl">⚡</span>
                  <p class="text-sm text-gray-600">{{ upgradeCost.energy }} Energy</p>
                </div>
                <div class="text-center">
                  <span class="text-2xl">💎</span>
                  <p class="text-sm text-gray-600">{{ upgradeCost.gems }} Gems</p>
                </div>
                <div class="text-center">
                  <span class="text-2xl">🃏</span>
                  <p class="text-sm text-gray-600">{{ upgradeCost.duplicates }} Duplicates</p>
                </div>
              </div>
            </div>

            <!-- Upgrade Button -->
            <div class="text-center">
              <button
                @click="performUpgrade"
                :disabled="!canUpgrade"
                :class="[
                  'px-8 py-3 rounded-lg font-bold text-lg transition-all',
                  canUpgrade
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed',
                ]"
              >
                <span class="mr-2">⬆️</span>
                Upgrade Card
              </button>
            </div>
          </div>

          <!-- Upgrade Card Selection -->
          <div v-if="selectingUpgradeCard" class="bg-gray-50 rounded-xl p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">Select Card to Upgrade</h3>
            <div class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-64 overflow-y-auto">
              <div
                v-for="card in upgradableCards"
                :key="card.id"
                @click="selectUpgradeCard(card)"
                class="relative cursor-pointer hover:transform hover:scale-105 transition-transform"
              >
                <img
                  :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${card.pokemonId}.png`"
                  :alt="card.name"
                  class="w-full rounded-lg border-2"
                  :class="getRarityBorder(card.rarity)"
                />
                <div class="absolute bottom-0 left-0 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                  Lv{{ card.level || 1 }}
                </div>
                <div class="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                  x{{ card.count }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recipes Tab -->
        <div v-if="activeTab === 'recipes'" class="space-y-4">
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="recipe in craftingRecipes"
              :key="recipe.id"
              class="bg-white rounded-xl p-4 shadow hover:shadow-lg transition-shadow"
            >
              <h4 class="font-bold text-gray-800 mb-3">{{ recipe.name }}</h4>
              
              <div class="flex items-center justify-center gap-2 mb-3">
                <div
                  v-for="(ingredient, index) in recipe.ingredients"
                  :key="index"
                  class="text-center"
                >
                  <div
                    class="w-16 h-16 rounded-lg border-2 flex items-center justify-center"
                    :class="getRarityBorder(ingredient.rarity)"
                  >
                    <span class="text-2xl">{{ ingredient.icon }}</span>
                  </div>
                  <p class="text-xs mt-1">{{ ingredient.type }}</p>
                </div>
                <span v-if="index < recipe.ingredients.length - 1" class="text-gray-400">+</span>
              </div>

              <div class="text-center mb-3">
                <span class="text-gray-400">↓</span>
              </div>

              <div class="text-center mb-3">
                <img
                  :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${recipe.result.pokemonId}.png`"
                  :alt="recipe.result.name"
                  class="w-20 h-20 mx-auto rounded-lg border-2"
                  :class="getRarityBorder(recipe.result.rarity)"
                />
                <p class="text-sm font-semibold mt-1">{{ recipe.result.name }}</p>
              </div>

              <button
                @click="selectRecipe(recipe)"
                class="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Use Recipe
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { usePlayerStore } from '@/stores/player';
import { useToast } from '@/composables/useToast';

const playerStore = usePlayerStore();
const toast = useToast();

// State
const activeTab = ref('fusion');
const tabs = [
  { id: 'fusion', name: 'Card Fusion' },
  { id: 'upgrade', name: 'Card Upgrade' },
  { id: 'recipes', name: 'Fusion Recipes' },
];

// Fusion State
const fusionSlots = ref([null, null]);
const selectingSlot = ref(null);
const fusionResult = ref(null);
const fusionCost = ref(200);
const draggedCard = ref(null);

// Upgrade State
const upgradeCard = ref(null);
const selectingUpgradeCard = ref(false);

// Crafting Recipes
const craftingRecipes = ref([
  {
    id: 1,
    name: 'Elemental Fusion',
    ingredients: [
      { type: 'Fire', rarity: 'R', icon: '🔥' },
      { type: 'Water', rarity: 'R', icon: '💧' },
    ],
    result: { pokemonId: 134, name: 'Vaporeon', rarity: 'E' },
  },
  {
    id: 2,
    name: 'Lightning Strike',
    ingredients: [
      { type: 'Electric', rarity: 'R', icon: '⚡' },
      { type: 'Electric', rarity: 'R', icon: '⚡' },
    ],
    result: { pokemonId: 135, name: 'Jolteon', rarity: 'E' },
  },
  {
    id: 3,
    name: 'Dragon Ascension',
    ingredients: [
      { type: 'Dragon', rarity: 'E', icon: '🐉' },
      { type: 'Flying', rarity: 'E', icon: '🦅' },
    ],
    result: { pokemonId: 149, name: 'Dragonite', rarity: 'L' },
  },
  {
    id: 4,
    name: 'Psychic Convergence',
    ingredients: [
      { type: 'Psychic', rarity: 'E', icon: '🔮' },
      { type: 'Psychic', rarity: 'E', icon: '🔮' },
    ],
    result: { pokemonId: 150, name: 'Mewtwo', rarity: 'L' },
  },
]);

// Mock card data
const availableCards = computed(() => {
  const cardMap = {};
  playerStore.player?.cards?.forEach(card => {
    if (!cardMap[card.pokemonId]) {
      cardMap[card.pokemonId] = { ...card, count: 1 };
    } else {
      cardMap[card.pokemonId].count++;
    }
  });
  return Object.values(cardMap);
});

const upgradableCards = computed(() => {
  return availableCards.value.filter(card => card.count > 1);
});

const canFuse = computed(() => {
  return fusionSlots.value[0] && fusionSlots.value[1] && 
         playerStore.player.energy >= fusionCost.value;
});

const canUpgrade = computed(() => {
  if (!upgradeCard.value) return false;
  const cost = getUpgradeCost();
  return playerStore.player.energy >= cost.energy &&
         playerStore.player.gems >= cost.gems &&
         getCardCount(upgradeCard.value) >= cost.duplicates + 1;
});

const upgradeCost = computed(() => {
  return getUpgradeCost();
});

// Methods
const getRarityBorder = (rarity) => {
  const borders = {
    C: 'border-gray-300',
    R: 'border-blue-400',
    E: 'border-purple-400',
    L: 'border-orange-400',
  };
  return borders[rarity] || borders.C;
};

const getRarityClass = (rarity) => {
  const classes = {
    C: 'text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs',
    R: 'text-blue-600 bg-blue-100 px-2 py-1 rounded text-xs',
    E: 'text-purple-600 bg-purple-100 px-2 py-1 rounded text-xs',
    L: 'text-orange-600 bg-orange-100 px-2 py-1 rounded text-xs',
  };
  return classes[rarity] || classes.C;
};

const getRarityName = (rarity) => {
  const names = {
    C: 'Common',
    R: 'Rare',
    E: 'Epic',
    L: 'Legendary',
  };
  return names[rarity] || 'Common';
};

const isCardSelected = (card) => {
  return fusionSlots.value.some(slot => slot?.pokemonId === card.pokemonId);
};

const selectCard = (card) => {
  if (selectingSlot.value && !isCardSelected(card)) {
    fusionSlots.value[selectingSlot.value - 1] = card;
    selectingSlot.value = null;
    checkFusionResult();
  }
};

const removeFromSlot = (index) => {
  fusionSlots.value[index] = null;
  fusionResult.value = null;
};

const handleDragStart = (event, card) => {
  draggedCard.value = card;
  event.dataTransfer.effectAllowed = 'move';
};

const handleDrop = (event, slot) => {
  event.preventDefault();
  if (draggedCard.value && !isCardSelected(draggedCard.value)) {
    fusionSlots.value[slot - 1] = draggedCard.value;
    checkFusionResult();
  }
  draggedCard.value = null;
};

const checkFusionResult = () => {
  if (fusionSlots.value[0] && fusionSlots.value[1]) {
    // Mock fusion result calculation
    const card1 = fusionSlots.value[0];
    const card2 = fusionSlots.value[1];
    
    // Simple fusion logic - in real app, this would be more complex
    const resultId = Math.max(card1.pokemonId, card2.pokemonId) + 1;
    const resultRarity = card1.rarity === 'L' || card2.rarity === 'L' ? 'L' : 
                        card1.rarity === 'E' || card2.rarity === 'E' ? 'E' : 'R';
    
    fusionResult.value = {
      pokemonId: resultId % 151 || 151, // Keep within Gen 1
      name: `Fusion Pokemon`,
      rarity: resultRarity,
      hp: Math.floor((card1.hp + card2.hp) * 1.1),
      attack: Math.floor((card1.attack + card2.attack) * 1.1),
    };
  }
};

const performFusion = async () => {
  if (!canFuse.value) return;

  // Deduct cost
  playerStore.player.energy -= fusionCost.value;

  // Remove used cards
  const card1Id = fusionSlots.value[0].pokemonId;
  const card2Id = fusionSlots.value[1].pokemonId;
  
  // Add fusion result
  playerStore.player.cards.push({
    id: `card_${Date.now()}`,
    ...fusionResult.value,
    level: 1,
  });

  // Update player data
  await playerStore.updateUserData({
    energy: playerStore.player.energy,
    cards: playerStore.player.cards,
  });

  toast.success('Fusion Complete!', `You created ${fusionResult.value.name}!`);

  // Reset fusion slots
  fusionSlots.value = [null, null];
  fusionResult.value = null;
};

const selectUpgradeCard = (card) => {
  upgradeCard.value = card;
  selectingUpgradeCard.value = false;
};

const getUpgradeCost = () => {
  if (!upgradeCard.value) return { energy: 0, gems: 0, duplicates: 0 };
  
  const level = upgradeCard.value.level || 1;
  return {
    energy: level * 100,
    gems: level * 20,
    duplicates: Math.floor(level / 2) + 1,
  };
};

const getCardCount = (card) => {
  return availableCards.value.find(c => c.pokemonId === card.pokemonId)?.count || 0;
};

const performUpgrade = async () => {
  if (!canUpgrade.value) return;

  const cost = getUpgradeCost();
  
  // Deduct costs
  playerStore.player.energy -= cost.energy;
  playerStore.player.gems -= cost.gems;

  // Upgrade the card
  const cardIndex = playerStore.player.cards.findIndex(c => c.id === upgradeCard.value.id);
  if (cardIndex > -1) {
    playerStore.player.cards[cardIndex].level = (upgradeCard.value.level || 1) + 1;
    playerStore.player.cards[cardIndex].hp = Math.floor(upgradeCard.value.hp * 1.2);
    playerStore.player.cards[cardIndex].attack = Math.floor(upgradeCard.value.attack * 1.2);
  }

  // Update player data
  await playerStore.updateUserData({
    energy: playerStore.player.energy,
    gems: playerStore.player.gems,
    cards: playerStore.player.cards,
  });

  toast.success('Upgrade Complete!', `${upgradeCard.value.name} is now level ${(upgradeCard.value.level || 1) + 1}!`);

  // Reset
  upgradeCard.value = null;
};

const selectRecipe = (recipe) => {
  // Switch to fusion tab and pre-fill slots based on recipe
  activeTab.value = 'fusion';
  
  // In real app, this would check if player has the required cards
  toast.info('Recipe Selected', `Try to match the ${recipe.name} recipe!`);
};

onMounted(() => {
  // Load saved crafting progress if any
  console.log('Loading crafting data...');
});
</script>

<style scoped>
.crafting-container {
  min-height: 100vh;
  background-color: #f9fafb;
}

/* Aspect ratio for card slots */
.aspect-\[3\/4\] {
  aspect-ratio: 3 / 4;
}

/* Drag and drop visual feedback */
.dragover {
  border-color: #a78bfa !important;
  background-color: #f3e8ff !important;
}

/* Custom scrollbar */
.max-h-64::-webkit-scrollbar {
  width: 8px;
}

.max-h-64::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.max-h-64::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.max-h-64::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>