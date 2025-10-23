<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl md:text-5xl font-bold text-center text-white mb-8">
        Pokemon Card Memory Game
      </h1>

      <div v-if="gameState === 'menu'" class="max-w-md mx-auto">
        <div class="bg-white/10 backdrop-blur-lg rounded-lg p-8 text-white">
          <h2 class="text-2xl font-bold mb-6 text-center">Choose Difficulty</h2>
          <div class="space-y-4">
            <button
              v-for="level in difficulties"
              :key="level.name"
              @click="startGame(level.pairs)"
              class="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
            >
              {{ level.name }} ({{ level.pairs }} pairs)
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="gameState === 'playing' || gameState === 'won'">
        <div class="max-w-6xl mx-auto">
          <div class="flex justify-between items-center mb-6 text-white">
            <div class="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
              <span class="font-semibold">Moves:</span> {{ moves }}
            </div>
            <div class="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
              <span class="font-semibold">Pairs Found:</span> {{ matchedPairs }} / {{ totalPairs }}
            </div>
            <button
              @click="resetGame"
              class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Reset Game
            </button>
          </div>

          <div :class="['grid gap-4', gridClass]">
            <GameCard
              v-for="(card, index) in cards"
              :key="index"
              :card="card"
              :is-flipped="flippedCards.includes(index) || matchedCards.includes(index)"
              :is-matched="matchedCards.includes(index)"
              @click="flipCard(index)"
            />
          </div>

          <Transition name="modal">
            <div
              v-if="gameState === 'won'"
              class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              @click.self="resetGame"
            >
              <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
                <h2 class="text-3xl font-bold mb-4 text-gray-800">Congratulations!</h2>
                <p class="text-xl mb-6 text-gray-600">You won in {{ moves }} moves!</p>
                <div class="space-y-3">
                  <button
                    @click="resetGame"
                    class="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-semibold transition-all"
                  >
                    Play Again
                  </button>
                  <button
                    @click="backToMenu"
                    class="w-full py-3 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-all"
                  >
                    Back to Menu
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { usePokemonStore } from '@/stores/pokemon';
import GameCard from '@/components/GameCard.vue';

const pokemonStore = usePokemonStore();

const gameState = ref('menu');
const cards = ref([]);
const flippedCards = ref([]);
const matchedCards = ref([]);
const moves = ref(0);
const totalPairs = ref(0);
const isProcessing = ref(false);

const difficulties = [
  { name: 'Easy', pairs: 6 },
  { name: 'Medium', pairs: 8 },
  { name: 'Hard', pairs: 12 },
];

const matchedPairs = computed(() => matchedCards.value.length / 2);

const gridClass = computed(() => {
  if (totalPairs.value <= 6) return 'grid-cols-3 md:grid-cols-4';
  if (totalPairs.value <= 8) return 'grid-cols-4 md:grid-cols-4';
  return 'grid-cols-4 md:grid-cols-6';
});

const startGame = async pairs => {
  totalPairs.value = pairs;
  await setupGame();
  gameState.value = 'playing';
};

const setupGame = async () => {
  if (pokemonStore.loadedPokemon.length === 0) {
    await pokemonStore.loadInitialBatch();
  }

  const availablePokemon = pokemonStore.loadedPokemon.slice(0, 150);
  const selectedPokemon = [];

  while (selectedPokemon.length < totalPairs.value) {
    const randomIndex = Math.floor(Math.random() * availablePokemon.length);
    const pokemon = availablePokemon[randomIndex];
    if (!selectedPokemon.find(p => p.id === pokemon.id)) {
      selectedPokemon.push(pokemon);
    }
  }

  const gameCards = [];
  selectedPokemon.forEach(pokemon => {
    const cardData = {
      id: pokemon.id,
      name: pokemon.name,
      image:
        pokemon.sprite ||
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`,
    };
    gameCards.push({ ...cardData });
    gameCards.push({ ...cardData });
  });

  cards.value = shuffleArray(gameCards);
  flippedCards.value = [];
  matchedCards.value = [];
  moves.value = 0;
  isProcessing.value = false;
};

const shuffleArray = array => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const flipCard = index => {
  if (isProcessing.value) return;
  if (matchedCards.value.includes(index)) return;
  if (flippedCards.value.includes(index)) return;

  if (flippedCards.value.length === 2) {
    flippedCards.value = [];
  }

  flippedCards.value.push(index);

  if (flippedCards.value.length === 2) {
    moves.value++;
    checkMatch();
  }
};

const checkMatch = () => {
  isProcessing.value = true;

  const [first, second] = flippedCards.value;
  const firstCard = cards.value[first];
  const secondCard = cards.value[second];

  if (firstCard.id === secondCard.id) {
    setTimeout(() => {
      matchedCards.value.push(...flippedCards.value);
      flippedCards.value = [];
      isProcessing.value = false;

      if (matchedCards.value.length === cards.value.length) {
        gameState.value = 'won';
      }
    }, 600);
  } else {
    setTimeout(() => {
      flippedCards.value = [];
      isProcessing.value = false;
    }, 1000);
  }
};

const resetGame = () => {
  setupGame();
  gameState.value = 'playing';
};

const backToMenu = () => {
  gameState.value = 'menu';
  cards.value = [];
  flippedCards.value = [];
  matchedCards.value = [];
  moves.value = 0;
};

onMounted(() => {
  if (pokemonStore.loadedPokemon.length === 0) {
    pokemonStore.loadInitialBatch();
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

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.9);
}
</style>
