<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-3xl font-bold text-white">Deck Builder</h2>
      <button
        @click="$emit('back')"
        class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
      >
        Back
      </button>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Deck List -->
      <div class="bg-gray-800/50 backdrop-blur rounded-xl p-4">
        <h3 class="text-xl font-bold text-white mb-4">Your Decks</h3>

        <div class="space-y-2 mb-4">
          <div
            v-for="deck in (playerStore.player?.decks || [])"
            :key="deck.id"
            @click="selectDeck(deck)"
            :class="[
              'p-3 rounded-lg cursor-pointer transition-all',
              selectedDeck?.id === deck.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600',
            ]"
          >
            <div class="flex justify-between items-center">
              <span class="font-semibold">{{ deck.name }}</span>
              <span class="text-sm">{{ deck.cards.length }}/30</span>
            </div>
            <div v-if="playerStore.player?.activeDeck === deck.id" class="text-xs mt-1 text-yellow-400">
              ⭐ Active
            </div>
          </div>
        </div>

        <button
          @click="createNewDeck"
          class="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold"
        >
          + New Deck
        </button>
      </div>

      <!-- Current Deck -->
      <div class="bg-gray-800/50 backdrop-blur rounded-xl p-4">
        <div v-if="selectedDeck">
          <div class="flex justify-between items-center mb-4">
            <input
              v-model="selectedDeck.name"
              class="bg-gray-700 text-white px-3 py-2 rounded-lg flex-1 mr-2"
              placeholder="Deck Name"
            />
            <button
              @click="setActiveDeck"
              :class="[
                'px-4 py-2 rounded-lg font-semibold',
                playerStore.player?.activeDeck === selectedDeck.id
                  ? 'bg-yellow-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white',
              ]"
            >
              {{ playerStore.player?.activeDeck === selectedDeck.id ? 'Active' : 'Set Active' }}
            </button>
          </div>

          <h3 class="text-lg font-bold text-white mb-2">Deck Cards ({{ deckCards.length }}/30)</h3>

          <div class="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
            <div
              v-for="card in deckCards"
              :key="card.uid"
              @click="removeFromDeck(card)"
              class="relative cursor-pointer group"
            >
              <BattleCard :card="card" size="small" />
              <div
                class="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/70 rounded-lg transition-all flex items-center justify-center"
              >
                <span class="text-white opacity-0 group-hover:opacity-100 text-2xl">✕</span>
              </div>
            </div>
          </div>

          <div class="mt-4 space-y-2">
            <button
              @click="deleteDeck"
              class="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold"
            >
              Delete Deck
            </button>
          </div>
        </div>

        <div v-else class="text-center text-gray-400 py-12">
          <p>Select or create a deck</p>
        </div>
      </div>

      <!-- Card Collection -->
      <div class="bg-gray-800/50 backdrop-blur rounded-xl p-4">
        <h3 class="text-lg font-bold text-white mb-4">Available Cards</h3>

        <!-- Filters -->
        <div class="mb-4 space-y-2">
          <select v-model="filterType" class="w-full bg-gray-700 text-white px-3 py-2 rounded-lg">
            <option value="all">All Types</option>
            <option value="pokemon">Pokemon</option>
            <option value="skill">Skills</option>
            <option value="item">Items</option>
          </select>

          <select v-model="filterRarity" class="w-full bg-gray-700 text-white px-3 py-2 rounded-lg">
            <option value="all">All Rarities</option>
            <option value="C">Common</option>
            <option value="R">Rare</option>
            <option value="E">Epic</option>
            <option value="L">Legendary</option>
          </select>
        </div>

        <!-- Card Grid -->
        <div class="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
          <div
            v-for="card in filteredCollection"
            :key="card.uid"
            @click="addToDeck(card)"
            class="relative cursor-pointer group"
          >
            <BattleCard :card="card" size="small" />
            <div
              class="absolute inset-0 bg-green-500/0 group-hover:bg-green-500/70 rounded-lg transition-all flex items-center justify-center"
            >
              <span class="text-white opacity-0 group-hover:opacity-100 text-2xl">+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCardBattleStore } from '@/stores/cardBattle';
import { usePlayerStore } from '@/stores/player';
import BattleCard from '@/components/BattleCard.vue';

defineEmits(['back']);

const cardBattleStore = useCardBattleStore();
const playerStore = usePlayerStore();

const selectedDeck = ref(null);
const filterType = ref('all');
const filterRarity = ref('all');

const selectDeck = deck => {
  selectedDeck.value = deck;
};

const setActiveDeck = () => {
  if (selectedDeck.value) {
    playerStore.setActiveDeck(selectedDeck.value.id);
  }
};

const deckCards = computed(() => {
  if (!selectedDeck.value) return [];
  console.log('DeckBuilder: Computing deck cards for deck:', selectedDeck.value.name);
  console.log('DeckBuilder: Deck card UIDs:', selectedDeck.value.cards);
  
  return selectedDeck.value.cards
    .map(cardUid => {
      // Deck now stores UIDs, so we need to find the card in the player's collection
      const card = playerStore.player?.cards?.find(c => c.uid === cardUid);
      if (!card) {
        console.warn(`DeckBuilder: Card with UID ${cardUid} not found in player collection`);
      }
      return card;
    })
    .filter(Boolean);
});

const filteredCollection = computed(() => {
  let cards = [...(playerStore.player?.cards || [])];

  if (filterType.value !== 'all') {
    cards = cards.filter(card => card.type === filterType.value);
  }

  if (filterRarity.value !== 'all') {
    cards = cards.filter(card => card.rarity === filterRarity.value);
  }

  return cards;
});

const addToDeck = card => {
  if (!selectedDeck.value) {
    alert('Please select a deck first!');
    return;
  }

  if (selectedDeck.value.cards.length >= 30) {
    alert('Deck is full! (Max 30 cards)');
    return;
  }

  // Add card to deck
  playerStore.addCardToDeck(selectedDeck.value.id, card);
};

const removeFromDeck = card => {
  if (!selectedDeck.value) return;
  
  playerStore.removeCardFromDeck(selectedDeck.value.id, card.uid);
};

const createNewDeck = () => {
  const newDeck = playerStore.createDeck(`New Deck ${(playerStore.player?.decks?.length || 0) + 1}`);
  selectedDeck.value = newDeck;
};

const deleteDeck = () => {
  if (!selectedDeck.value) return;

  if (confirm(`Delete ${selectedDeck.value.name}?`)) {
    playerStore.deleteDeck(selectedDeck.value.id);
    selectedDeck.value = null;
  }
};

// Initialize on mount
onMounted(async () => {
  await cardBattleStore.initializePlayer();
  
  // Select first deck if available
  if (playerStore.player?.decks && playerStore.player.decks.length > 0) {
    selectedDeck.value = playerStore.player.decks[0];
  }
});
</script>
