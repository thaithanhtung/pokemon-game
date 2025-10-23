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
              {{ battleMode === 'story' ? 'Story Battle' : 'PvP Battle' }}
            </h1>
          </div>
          <div class="flex items-center gap-4 text-gray-700">
            <div
              class="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-200"
            >
              <div class="flex items-center gap-2">
                <span class="text-yellow-500 text-lg">⚡</span>
                <span class="font-bold text-yellow-700">{{
                  playerStore.player.energy.toLocaleString()
                }}</span>
              </div>
              <div class="w-px h-5 bg-gray-300"></div>
              <div class="flex items-center gap-2">
                <span class="text-blue-500 text-lg">💎</span>
                <span class="font-bold text-blue-700">{{
                  playerStore.player.gems.toLocaleString()
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Battle Arena -->
    <div class="container mx-auto px-4 py-8">
      <BattleArena :battle-mode="battleMode" @back="$router.push('/card-clash/menu')" />
    </div>

    <!-- Debug Component (only in development) -->
    <FirebaseDebug v-if="isDev" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useCardBattleStore } from '@/stores/cardBattle';
import { usePlayerStore } from '@/stores/player';
import { useToast } from '@/composables/useToast';
import BattleArena from '@/components/BattleArena.vue';
import FirebaseDebug from '@/components/FirebaseDebug.vue';

const props = defineProps({
  mode: {
    type: String,
    required: true,
  },
});

const cardBattleStore = useCardBattleStore();
const playerStore = usePlayerStore();
const toast = useToast();

// Development mode check
const isDev = computed(() => import.meta.env.DEV);

// Battle mode from route
const battleMode = computed(() => props.mode);

onMounted(async () => {
  // Initialize player if not already done
  await cardBattleStore.initializePlayer();
  
  // Check if player has any cards
  if (!playerStore.player.cards || playerStore.player.cards.length === 0) {
    console.log('No cards found, initializing starter pack');
    cardBattleStore.giveStarterPack();
  }
  
  // Check if player has active deck
  if (!playerStore.player.activeDeck || playerStore.player.decks.length === 0) {
    toast.warning('No Active Deck', 'Creating a starter deck for you...');
    cardBattleStore.createStarterDeck();
  }

  // Start battle
  cardBattleStore.startBattle(battleMode.value);
  
  // Only show toast if battle was successfully started
  if (cardBattleStore.currentBattle) {
    toast.info('Battle Started!', 'Good luck!');
  } else {
    toast.error('Battle Failed', 'Could not start battle. Please try again.');
  }
});
</script>
