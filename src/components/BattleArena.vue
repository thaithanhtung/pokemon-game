<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Loading State -->
    <div v-if="!battle" class="text-center py-12">
      <div class="text-white text-xl mb-4">Preparing battle...</div>
      <div class="animate-pulse flex justify-center">
        <div class="w-64 h-32 bg-gray-700 rounded-lg"></div>
      </div>
    </div>

    <!-- Battle Content -->
    <div v-else>
      <!-- Battle Header -->
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-white">
          {{ battleMode === 'story' ? 'Story Battle' : 'PvP Battle' }}
        </h2>
        <button
          @click="$emit('back')"
          class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
        >
          Retreat
        </button>
      </div>

      <!-- Battle Field -->
      <div class="grid lg:grid-cols-2 gap-8">
      <!-- Opponent Side -->
      <div class="order-2 lg:order-1">
        <div class="bg-red-900/30 backdrop-blur rounded-lg p-4 border border-red-500/50">
          <h3 class="text-lg font-bold text-white mb-2">{{ battle.opponent.name }}</h3>

          <!-- Active Pokemon -->
          <div class="mb-4">
            <div class="bg-black/30 rounded-lg p-4">
              <div class="relative inline-block align-top">
                <BattleCard
                  v-if="battle.opponent.activePokemon"
                  :card="battle.opponent.activePokemon"
                  size="large"
                  :disabled="true"
                />
                <div v-else class="w-32 h-40 bg-gray-700 rounded-lg flex items-center justify-center text-gray-500">
                  No Pokemon
                </div>

                <!-- Impact Effect on opponent when player attacks (confined to BattleCard) -->
                <ParticlesEffect
                  v-if="showOpponentImpact"
                  :key="impactKey"
                  :type="impactElement"
                  class="absolute inset-0 pointer-events-none"
                />
              </div>

              <!-- HP Bar -->
              <div v-if="battle.opponent.activePokemon" class="mt-2">
                <div class="flex justify-between text-xs text-white mb-1">
                  <span>HP</span>
                  <span
                    >{{ battle.opponent.activePokemon.hp }}/{{
                      battle.opponent.activePokemon.maxHp || 100
                    }}</span
                  >
                </div>
                <div class="bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div
                    class="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500"
                    :style="{
                      width: `${(battle.opponent.activePokemon.hp / (battle.opponent.activePokemon.maxHp || 100)) * 100}%`,
                    }"
                  ></div>
                </div>
              </div>

              <!-- Status Effects -->
              <div v-if="battle.opponent.statusEffects.length" class="mt-2 flex gap-1">
                <span
                  v-for="effect in battle.opponent.statusEffects"
                  :key="effect.type"
                  class="text-xs bg-black/50 px-2 py-1 rounded"
                >
                  {{ effect.icon }}
                </span>
              </div>
            </div>
          </div>

          <!-- Bench -->
          <div class="flex gap-2">
            <div
              v-for="pokemon in battle.opponent.bench"
              :key="pokemon.uid"
              class="w-16 h-20 bg-black/30 rounded-lg flex items-center justify-center"
            >
              <img :src="pokemon.image" :alt="pokemon.name" class="w-12 h-12 object-contain" />
            </div>
          </div>

          <!-- Energy -->
          <div class="mt-2 flex items-center gap-2 text-white">
            <span class="text-yellow-400">⚡</span>
            <span>{{ battle.opponent.energy }}/5</span>
          </div>
        </div>
      </div>

      <!-- Player Side -->
      <div class="order-1 lg:order-2">
        <div class="bg-blue-900/30 backdrop-blur rounded-lg p-4 border border-blue-500/50">
          <h3 class="text-lg font-bold text-white mb-2">{{ playerStore.name }}</h3>

          <!-- Active Pokemon -->
          <div class="mb-4">
            <div class="bg-black/30 rounded-lg p-4">
              <div class="relative inline-block align-top">
                <BattleCard
                  v-if="battle.player.activePokemon"
                  :card="battle.player.activePokemon"
                  size="large"
                  :disabled="battle.currentTurn !== 'player'"
                />
                <div v-else class="w-32 h-40 bg-gray-700 rounded-lg flex items-center justify-center text-gray-500">
                  No Pokemon
                </div>
                <!-- Impact Effect on player when opponent attacks -->
                <ParticlesEffect
                  v-if="showPlayerImpact"
                  :key="playerImpactKey"
                  :type="playerImpactElement"
                  class="absolute inset-0 pointer-events-none"
                />
              </div>

              <!-- HP Bar -->
              <div v-if="battle.player.activePokemon" class="mt-2">
                <div class="flex justify-between text-xs text-white mb-1">
                  <span>HP</span>
                  <span
                    >{{ battle.player.activePokemon.hp }}/{{
                      battle.player.activePokemon.maxHp || 100
                    }}</span
                  >
                </div>
                <div class="bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div
                    class="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500"
                    :style="{
                      width: `${(battle.player.activePokemon.hp / (battle.player.activePokemon.maxHp || 100)) * 100}%`,
                    }"
                  ></div>
                </div>
              </div>

              <!-- Status Effects -->
              <div v-if="battle.player.statusEffects.length" class="mt-2 flex gap-1">
                <span
                  v-for="effect in battle.player.statusEffects"
                  :key="effect.type"
                  class="text-xs bg-black/50 px-2 py-1 rounded"
                >
                  {{ effect.icon }}
                </span>
              </div>
            </div>
          </div>

          <!-- Bench -->
          <div class="flex gap-2 mb-2">
            <div
              v-for="pokemon in battle.player.bench"
              :key="pokemon.uid"
              @click="switchPokemon(pokemon)"
              :class="[
                'w-16 h-20 bg-black/30 rounded-lg flex items-center justify-center cursor-pointer transition-all',
                battle.currentTurn === 'player'
                  ? 'hover:bg-black/50'
                  : 'opacity-50 cursor-not-allowed',
              ]"
            >
              <img :src="pokemon.image" :alt="pokemon.name" class="w-12 h-12 object-contain" />
            </div>
          </div>

          <!-- Energy -->
          <div class="flex items-center gap-2 text-white">
            <span class="text-yellow-400">⚡</span>
            <span>{{ battle.player.energy }}/5</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Panel -->
    <div v-if="battle && battle.currentTurn === 'player' && !battle.ended && battle.player.activePokemon" class="mt-8">
      <div class="bg-gray-800/50 backdrop-blur rounded-lg p-4">
        <h3 class="text-lg font-bold text-white mb-4">Choose Action</h3>

        <!-- Skills -->
        <div v-if="battle.player.activePokemon.skills" class="mb-4">
          <h4 class="text-sm text-gray-400 mb-2">Pokemon Skills</h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              v-for="skill in battle.player.activePokemon.skills"
              :key="skill.name"
              @click="useSkill(skill)"
              :disabled="battle.player.energy < skill.energy"
              :class="[
                'bg-blue-600 text-white p-2 rounded-lg text-sm transition-all',
                battle.player.energy >= skill.energy
                  ? 'hover:bg-blue-700'
                  : 'opacity-50 cursor-not-allowed',
              ]"
            >
              <div>{{ skill.name }}</div>
              <div class="text-xs">{{ skill.damage }} DMG - {{ skill.energy }}⚡</div>
            </button>
          </div>
        </div>

        <!-- Hand Cards -->
        <div v-if="battle.player.hand.length">
          <h4 class="text-sm text-gray-400 mb-2">Hand Cards</h4>
          <div class="flex gap-2 overflow-x-auto">
            <BattleCard
              v-for="card in battle.player.hand"
              :key="card.uid"
              :card="card"
              size="small"
              @click="playCard(card)"
              :disabled="card.energy && battle.player.energy < card.energy"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Battle Log -->
    <div class="mt-4 bg-gray-800/50 backdrop-blur rounded-lg p-4 max-h-40 overflow-y-auto">
      <h3 class="text-sm font-bold text-gray-400 mb-2">Battle Log</h3>
      <div class="space-y-1">
        <div v-for="(log, index) in battleLog" :key="index" class="text-xs text-gray-300">
          {{ log.message }}
        </div>
      </div>
    </div>

    <!-- Victory/Defeat Modal -->
    <Transition name="modal">
      <div
        v-if="battle && battle.ended"
        class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      >
        <div class="bg-gray-800 rounded-lg p-8 max-w-md text-center">
          <h2
            class="text-3xl font-bold mb-4"
            :class="battle.result === 'victory' ? 'text-green-400' : 'text-red-400'"
          >
            {{ battle.result === 'victory' ? 'Victory!' : 'Defeat...' }}
          </h2>

          <div v-if="battle.result === 'victory'" class="text-white mb-6">
            <p class="mb-2">Rewards:</p>
            <div class="flex justify-center gap-4">
              <div class="flex items-center gap-1">
                <span class="text-yellow-400">⚡</span>
                <span>+50</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-purple-400">✨</span>
                <span>+100 EXP</span>
              </div>
            </div>
          </div>

          <button
            @click="$emit('back')"
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Continue
          </button>
        </div>
      </div>
    </Transition>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue';
import { useCardBattleStore } from '@/stores/cardBattle';
import { usePlayerStore } from '@/stores/player';
import BattleCard from '@/components/BattleCard.vue';
import ParticlesEffect from '@/components/ParticlesEffect.vue';

const props = defineProps({
  battleMode: {
    type: String,
    required: true,
  },
});

defineEmits(['back']);

const cardBattleStore = useCardBattleStore();
const battle = computed(() => cardBattleStore.currentBattle);
const battleLog = computed(() => cardBattleStore.battleLog);
const playerStore = usePlayerStore();

// Initialize maxHp for all Pokemon when battle starts
watch(
  battle,
  newBattle => {
    if (newBattle && !newBattle.player.activePokemon.maxHp) {
      newBattle.player.activePokemon.maxHp = newBattle.player.activePokemon.hp;
      newBattle.player.bench.forEach(p => (p.maxHp = p.hp));
      newBattle.opponent.activePokemon.maxHp = newBattle.opponent.activePokemon.hp;
      newBattle.opponent.bench.forEach(p => (p.maxHp = p.hp));
    }
  },
  { immediate: true }
);

// Opponent impact effect (when player attacks)
const showOpponentImpact = ref(false);
const impactElement = ref('neutral');
const impactKey = ref(0);
const showPlayerImpact = ref(false);
const playerImpactElement = ref('neutral');
const playerImpactKey = ref(0);

watch(
  battleLog,
  (logs, oldLogs) => {
    if (!battle.value || !logs?.length) return;
    const last = logs[logs.length - 1]?.message || '';
    const playerName = battle.value.player.activePokemon?.name || '';
    const oppName = battle.value.opponent.activePokemon?.name || '';
    // If player's Pokemon used a skill → impact on opponent
    if (last.includes('used') && last.startsWith(playerName)) {
      // Try to map to pokemonType; fallback neutral
      const el = (battle.value.player.activePokemon?.pokemonType || 'neutral').toLowerCase();
      impactElement.value = el;
      showOpponentImpact.value = false;
      // re-trigger
      requestAnimationFrame(() => {
        impactKey.value += 1;
        showOpponentImpact.value = true;
      });
      // hide after short duration
      setTimeout(() => (showOpponentImpact.value = false), 800);
      return;
    }
    // If opponent attacked → impact on player
    if (last.includes('used') && last.startsWith(oppName)) {
      const el = (battle.value.opponent.activePokemon?.pokemonType || 'neutral').toLowerCase();
      playerImpactElement.value = el;
      showPlayerImpact.value = false;
      requestAnimationFrame(() => {
        playerImpactKey.value += 1;
        showPlayerImpact.value = true;
      });
      setTimeout(() => (showPlayerImpact.value = false), 800);
    }
  },
  { deep: true }
);

const useSkill = skill => {
  cardBattleStore.executePlayerAction({
    type: 'attack',
    skill,
  });
};

const playCard = card => {
  if (card.type === 'skill') {
    cardBattleStore.executePlayerAction({
      type: 'useSkill',
      skill: card,
    });
  } else if (card.type === 'item') {
    cardBattleStore.executePlayerAction({
      type: 'useItem',
      item: card,
    });
  }
};

const switchPokemon = pokemon => {
  if (battle.value.currentTurn === 'player' && pokemon.hp > 0) {
    cardBattleStore.executePlayerAction({
      type: 'switch',
      pokemon,
    });
  }
};
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
