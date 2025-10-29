<template>
  <div class="battle-3d-demo">
    <div class="battle-header">
      <h1>Trận Đấu 3D PvP</h1>
      <div class="controls">
        <button @click="toggleSound" class="sound-toggle">
          <i :class="soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute'"></i>
          Sound: {{ soundEnabled ? 'ON' : 'OFF' }}
        </button>
        <button
          v-if="battleActive"
          @click="
            battleActive = false;
            sound.stop('shop-music');
          "
          class="retreat-btn"
        >
          🏳️ Retreat
        </button>
        <button @click="router.push('/card-clash/menu')" class="back-btn">Back to Menu</button>
      </div>
    </div>

    <div class="battle-container">
      <!-- Battle Status Bar -->
      <div v-if="battleActive && currentBattle" class="battle-status-bar">
        <div class="pokemon-status player-status">
          <h4>Your Pokemon</h4>
          <div class="active-pokemon">
            <span class="pokemon-name">{{ currentBattle.player?.activePokemon?.name }}</span>
            <span class="pokemon-hp">HP: {{ currentBattle.player?.activePokemon?.hp }}/{{ currentBattle.player?.activePokemon?.maxHp || 100 }}</span>
          </div>
          <div class="bench-pokemon">
            <span class="bench-label">Bench: </span>
            <span class="bench-count">{{ currentBattle.player?.bench?.length || 0 }} Pokemon</span>
          </div>
        </div>
        
        <div class="pokemon-status opponent-status">
          <h4>Opponent Pokemon</h4>
          <div class="active-pokemon">
            <span class="pokemon-name">{{ currentBattle.opponent?.activePokemon?.name }}</span>
            <span class="pokemon-hp">HP: {{ currentBattle.opponent?.activePokemon?.hp }}/{{ currentBattle.opponent?.activePokemon?.maxHp || 100 }}</span>
          </div>
          <div class="bench-pokemon">
            <span class="bench-label">Bench: </span>
            <span class="bench-count">{{ currentBattle.opponent?.bench?.length || 0 }} Pokemon</span>
          </div>
        </div>
      </div>

      <BattleArena3D
        v-if="battleActive && playerPokemon && opponentPokemon"
        :player-pokemon="playerPokemon"
        :opponent-pokemon="opponentPokemon"
        battle-id="pvp-demo"
        @battle-start="onBattleStart"
        @attack-hit="onAttackHit"
        @pokemon-faint="onPokemonFaint"
        @battle-end="onBattleEnd"
        @skill-executed="onSkillExecuted"
      />

      <div v-else class="pre-battle">
        <!-- Loading State -->
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Khởi tạo hệ thống trận đấu...</p>
        </div>

        <!-- Ready to Battle -->
        <div v-else class="battle-ready">
          <h2>Sẵn sàng chiến đấu!</h2>
          <p class="battle-info">Bạn sẽ sử dụng deck đang active để đấu với đối thủ ngẫu nhiên.</p>
          <div v-if="playerStore.player?.activeDeck" class="deck-info">
            <p class="deck-name">
              Deck:
              {{
                playerStore.player.decks?.find(d => d.id === playerStore.player.activeDeck)?.name ||
                'Unknown'
              }}
            </p>
            <p class="deck-cards">
              Số lượng thẻ:
              {{
                playerStore.player.decks?.find(d => d.id === playerStore.player.activeDeck)?.cards
                  .length || 0
              }}
              ({{
                playerStore.player.decks?.find(d => d.id === playerStore.player.activeDeck)?.cards
                  .filter(cardId => {
                    const card = playerStore.player.cards.find(c => c.uid === cardId);
                    return card?.type === 'pokemon';
                  }).length || 0
              }} Pokemon)
            </p>
          </div>
          <div v-else class="no-deck-warning">
            <p>
              ⚠️ Bạn chưa có deck active. Hệ thống sẽ tạo deck mẫu cho bạn khi bắt đầu trận đấu.
            </p>
          </div>
          <button @click="startBattle" class="start-battle-big">
            <span class="btn-icon">⚔️</span>
            <span>Bắt đầu trận đấu</span>
          </button>
          <router-link to="/card-clash/deck-builder" class="deck-builder-link">
            🃏 Hoặc xây dựng deck mới
          </router-link>
        </div>
      </div>
    </div>

    <div class="sound-effects-panel" v-if="showSoundPanel">
      <h3>Sound Effects Demo</h3>
      <div class="sound-buttons">
        <button @click="playSound('battle-start')">Battle Start</button>
        <button @click="playSound('attack-hit')">Attack Hit</button>
        <button @click="playSound('pokemon-faint')">Pokemon Faint</button>
        <button @click="playSound('legendary-reveal')">Legendary Reveal</button>
        <button @click="playSound('success')">Victory</button>
        <button @click="playSound('error')">Defeat</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import BattleArena3D from '@/components/battle3d/BattleArena3D.vue';
import { useSound } from '@/composables/useSound';
import { useBattle3DStore } from '@/stores/battle3D';
import { usePlayerStore } from '@/stores/player';
import { useCardBattleStore } from '@/stores/cardBattle';
import { useToast } from '@/composables/useToast';
import type { Pokemon, Card } from '@/types';

const router = useRouter();
const sound = useSound();
const battle3DStore = useBattle3DStore();
const playerStore = usePlayerStore();
const cardBattleStore = useCardBattleStore();
const toast = useToast();

const battleActive = ref(false);
const showSoundPanel = ref(false);
const isLoading = ref(true);

const soundEnabled = computed(() => sound.enabled.value);

// Get battle data from store - same as regular Battle page
const currentBattle = computed(() => cardBattleStore.currentBattle);

// Convert battle card to Pokemon format for 3D rendering
const cardToBattlePokemon = (card: any): any => {
  // The card from battle state is a BattleCard with extended properties
  return {
    id: card.pokemonId || 1,
    name: card.name,
    types: card.types || [],
    stats: {
      hp: card.hp || card.maxHp || 100,
      attack: card.attack || 50,
      defense: card.defense || 40,
      speed: card.speed || 60,
    },
  };
};

const playerPokemon = computed(() => {
  if (currentBattle.value?.player?.activePokemon) {
    return cardToBattlePokemon(currentBattle.value.player.activePokemon);
  }
  return null;
});

const opponentPokemon = computed(() => {
  if (currentBattle.value?.opponent?.activePokemon) {
    return cardToBattlePokemon(currentBattle.value.opponent.activePokemon);
  }
  return null;
});

// Watch for Pokemon changes to trigger animations
watch(() => currentBattle.value?.player?.activePokemon?.uid, (newUid, oldUid) => {
  if (newUid && oldUid && newUid !== oldUid && battleActive.value) {
    // Pokemon switched - the store already handles the switch logic
    console.log('Player Pokemon switched to:', currentBattle.value?.player?.activePokemon?.name);
  }
});

watch(() => currentBattle.value?.opponent?.activePokemon?.uid, (newUid, oldUid) => {
  if (newUid && oldUid && newUid !== oldUid && battleActive.value) {
    // Opponent Pokemon switched
    console.log('Opponent Pokemon switched to:', currentBattle.value?.opponent?.activePokemon?.name);
  }
});

// Watch for battle end
watch(() => currentBattle.value?.ended, (ended) => {
  if (ended && currentBattle.value?.result) {
    onBattleEnd(currentBattle.value.result === 'victory' ? 'victory' : 'defeat');
  }
});

const toggleSound = () => {
  sound.toggleSound();
  if (sound.enabled.value) {
    sound.playButtonClick();
  }
};

const playSound = (soundName: string) => {
  sound.play(soundName);
};

const startBattle = async () => {
  battleActive.value = true;
  battle3DStore.transitionToPhase('preparation');
  sound.play('battle-start');

  // Start battle music after a short delay
  setTimeout(() => {
    sound.fadeIn('shop-music', 2000, 0.3);
  }, 1000);
};

const onBattleStart = () => {
  console.log('Battle started!');
  battle3DStore.transitionToPhase('attack');
};

const onAttackHit = (data: any) => {
  console.log('Attack hit!', data);
  sound.play('attack-hit', 0.7);

  // Play additional sounds based on attack type
  if (data.critical) {
    setTimeout(() => sound.play('legendary-reveal', 0.5), 200);
  }
};

const onSkillExecuted = (skill: any) => {
  console.log('Skill executed:', skill);
  // Sound effects are now handled directly in BattleArena3D component
};

const onPokemonFaint = (data: any) => {
  console.log('Pokemon fainted!', data);
  sound.play('pokemon-faint');

  // Fade out battle music
  sound.fadeOut('shop-music', 1000);
};

const onBattleEnd = (result: 'victory' | 'defeat') => {
  console.log('Battle ended:', result);
  battleActive.value = false;

  if (result === 'victory') {
    sound.play('success');
    battle3DStore.transitionToPhase('victory');
  } else {
    sound.play('error');
    battle3DStore.transitionToPhase('defeat');
  }

  // Stop battle music
  setTimeout(() => {
    sound.stop('shop-music');
  }, 2000);
};

onMounted(async () => {
  // Enable sound effects for the battle
  battle3DStore.toggleAudio(true);

  // Show sound panel in demo mode
  showSoundPanel.value = true;

  // Initialize player if not already done
  await cardBattleStore.initializePlayer();
  
  // Check if player has any cards
  if (!playerStore.player.cards || playerStore.player.cards.length === 0) {
    console.log('No cards found, initializing starter pack');
    cardBattleStore.giveStarterPack();
  }
  
  // Log current cards for debugging
  console.log('Current player cards:', playerStore.player.cards?.length || 0);
  console.log('Pokemon cards:', playerStore.player.cards?.filter(c => c.type === 'pokemon').map(c => c.name));
  
  // Check if player has active deck
  if (!playerStore.player.activeDeck || playerStore.player.decks.length === 0) {
    toast.warning('No Active Deck', 'Creating a starter deck for you...');
    cardBattleStore.createStarterDeck();
  }

  // Start battle
  cardBattleStore.startBattle('pvp');
  
  // Only show toast if battle was successfully started
  if (cardBattleStore.currentBattle) {
    toast.info('Battle Started!', 'Good luck!');
  } else {
    toast.error('Battle Failed', 'Could not start battle. Please try again.');
  }

  isLoading.value = false;
});

onUnmounted(() => {
  // Clean up sounds
  sound.stop('shop-music');
});
</script>

<style scoped>
.battle-3d-demo {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);
  color: white;
  padding: 20px;
}

.battle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.battle-header h1 {
  font-size: 2.5rem;
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.controls {
  display: flex;
  gap: 15px;
}

.sound-toggle,
.retreat-btn,
.back-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sound-toggle {
  background: #4a5568;
  color: white;
}

.sound-toggle:hover {
  background: #5a6578;
}

.retreat-btn {
  background: linear-gradient(45deg, #f59e0b, #d97706);
  color: white;
  font-weight: bold;
}

.retreat-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(217, 119, 6, 0.4);
}

.back-btn {
  background: #2d3748;
  color: white;
}

.back-btn:hover {
  background: #3d4758;
}

.battle-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 200px);
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  overflow: hidden;
}

.pre-battle {
  padding: 40px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.battle-ready {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.battle-ready h2 {
  font-size: 2.5rem;
  margin-bottom: 20px;
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.battle-info {
  color: #e2e8f0;
  font-size: 1.1rem;
  margin-bottom: 30px;
  line-height: 1.6;
}

.deck-info {
  background: rgba(255, 215, 0, 0.1);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
}

.deck-name {
  font-size: 1.3rem;
  color: #fbbf24;
  font-weight: bold;
  margin-bottom: 10px;
}

.deck-cards {
  color: #e2e8f0;
  font-size: 1rem;
}

.no-deck-warning {
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
}

.no-deck-warning p {
  color: #fca5a5;
  font-size: 1rem;
  margin: 0;
}

.start-battle-big {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  padding: 20px 40px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 0 auto 20px;
  box-shadow: 0 10px 30px rgba(238, 90, 36, 0.3);
}

.start-battle-big:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(238, 90, 36, 0.5);
}

.start-battle-big:active {
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 2rem;
}

.deck-builder-link {
  display: inline-block;
  color: #60a5fa;
  text-decoration: none;
  font-size: 1.1rem;
  transition: all 0.2s ease;
  padding: 10px 20px;
  border-radius: 8px;
  background: rgba(96, 165, 250, 0.1);
}

.deck-builder-link:hover {
  background: rgba(96, 165, 250, 0.2);
  color: #93c5fd;
  transform: translateY(-2px);
}

.types {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.type {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
}

.type.electric {
  background: #f7d02c;
  color: #000;
}

.type.grass {
  background: #7ac74c;
  color: #fff;
}

.type.poison {
  background: #a33ea1;
  color: #fff;
}

.type.fire {
  background: #ee8130;
  color: #fff;
}

.type.water {
  background: #6390f0;
  color: #fff;
}

.type.flying {
  background: #a98ff3;
  color: #fff;
}

.sound-effects-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 20px;
  width: 300px;
}

.sound-effects-panel h3 {
  margin: 0 0 15px 0;
  color: #ffd700;
  font-size: 1.2rem;
}

.sound-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.sound-buttons button {
  padding: 8px 12px;
  background: rgba(255, 215, 0, 0.2);
  border: 1px solid rgba(255, 215, 0, 0.4);
  border-radius: 6px;
  color: #ffd700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.sound-buttons button:hover {
  background: rgba(255, 215, 0, 0.3);
  transform: scale(1.05);
}

.sound-buttons button:active {
  transform: scale(0.95);
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 215, 0, 0.3);
  border-top-color: #ffd700;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-container p {
  font-size: 1.2rem;
  color: #fbbf24;
}

/* Battle Status Bar */
.battle-status-bar {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 800px;
  display: flex;
  justify-content: space-between;
  z-index: 10;
  pointer-events: none;
}

.pokemon-status {
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 15px 20px;
  min-width: 250px;
  color: white;
}

.pokemon-status h4 {
  margin: 0 0 10px 0;
  font-size: 1rem;
  color: #ffd700;
  text-transform: uppercase;
}

.active-pokemon {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.pokemon-name {
  font-weight: bold;
  font-size: 1.1rem;
}

.pokemon-hp {
  font-size: 0.9rem;
  color: #10b981;
}

.bench-pokemon {
  font-size: 0.9rem;
  color: #94a3b8;
}

.bench-label {
  color: #64748b;
}

.bench-count {
  color: #fbbf24;
  font-weight: bold;
}

.player-status {
  align-self: flex-start;
}

.opponent-status {
  align-self: flex-start;
  text-align: right;
}

.opponent-status .active-pokemon,
.opponent-status .bench-pokemon {
  justify-content: flex-end;
}
</style>
