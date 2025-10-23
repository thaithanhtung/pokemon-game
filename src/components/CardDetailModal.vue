<template>
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold">{{ card.name }}</h2>
          <button
            @click="$emit('close')"
            class="text-white/80 hover:text-white transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
        <div class="grid md:grid-cols-2 gap-8">
          <!-- Card Display -->
          <div class="flex flex-col items-center">
            <div class="mb-4">
              <BabylonCard
                v-if="enable3D"
                :card="card"
                size="large"
                :holographic="card.rarity === 'L' || card.name?.toLowerCase().includes('mega')"
              />
              <BattleCard
                v-else
                :card="card"
                size="large"
              />
            </div>
            
            <!-- 3D Controls -->
            <div v-if="enable3D" class="text-center text-sm text-gray-600 mt-4">
              <p>🖱️ Drag to rotate • Click to flip</p>
            </div>
          </div>

          <!-- Card Details -->
          <div class="space-y-6">
            <!-- Rarity and Type -->
            <div class="flex items-center gap-4">
              <span :class="[
                'px-3 py-1 rounded-lg font-semibold text-sm',
                rarityColors[card.rarity]
              ]">
                {{ rarityNames[card.rarity] }}
              </span>
              <span class="px-3 py-1 bg-gray-200 rounded-lg font-semibold text-sm text-gray-700">
                {{ card.type === 'pokemon' ? 'Pokémon' : card.type }}
              </span>
              <span v-if="card.pokemonType" :class="[
                'px-3 py-1 rounded-lg font-semibold text-sm text-white',
                getTypeColor(card.pokemonType)
              ]">
                {{ card.pokemonType }}
              </span>
            </div>

            <!-- Stats (for Pokémon) -->
            <div v-if="card.type === 'pokemon'" class="bg-gray-100 rounded-lg p-4">
              <h3 class="font-semibold text-lg mb-3">Stats</h3>
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">❤️ HP</span>
                  <div class="flex items-center gap-2">
                    <div class="w-32 bg-gray-300 rounded-full h-2">
                      <div 
                        class="bg-red-500 h-full rounded-full"
                        :style="{ width: `${(card.hp / 200) * 100}%` }"
                      ></div>
                    </div>
                    <span class="font-semibold w-12 text-right">{{ card.hp }}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">⚔️ Attack</span>
                  <div class="flex items-center gap-2">
                    <div class="w-32 bg-gray-300 rounded-full h-2">
                      <div 
                        class="bg-orange-500 h-full rounded-full"
                        :style="{ width: `${(card.atk / 200) * 100}%` }"
                      ></div>
                    </div>
                    <span class="font-semibold w-12 text-right">{{ card.atk }}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">🛡️ Defense</span>
                  <div class="flex items-center gap-2">
                    <div class="w-32 bg-gray-300 rounded-full h-2">
                      <div 
                        class="bg-blue-500 h-full rounded-full"
                        :style="{ width: `${(card.def / 200) * 100}%` }"
                      ></div>
                    </div>
                    <span class="font-semibold w-12 text-right">{{ card.def }}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">⚡ Speed</span>
                  <div class="flex items-center gap-2">
                    <div class="w-32 bg-gray-300 rounded-full h-2">
                      <div 
                        class="bg-green-500 h-full rounded-full"
                        :style="{ width: `${(card.spd / 200) * 100}%` }"
                      ></div>
                    </div>
                    <span class="font-semibold w-12 text-right">{{ card.spd }}</span>
                  </div>
                </div>
              </div>
              <div class="mt-3 text-center">
                <span class="text-sm text-gray-600">Total: </span>
                <span class="font-bold text-lg">{{ totalStats }}</span>
              </div>
            </div>

            <!-- Description (for skills/items) -->
            <div v-else class="bg-gray-100 rounded-lg p-4">
              <h3 class="font-semibold text-lg mb-2">Description</h3>
              <p class="text-gray-700">{{ card.description }}</p>
              <div v-if="card.energy" class="mt-3">
                <span class="text-sm text-gray-600">Energy Cost: </span>
                <span class="font-semibold text-yellow-600">{{ card.energy }} ⚡</span>
              </div>
            </div>

            <!-- Additional Info -->
            <div class="bg-gray-100 rounded-lg p-4">
              <h3 class="font-semibold text-lg mb-2">Collection Info</h3>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Owned:</span>
                  <span class="font-semibold">{{ card.count || 1 }}x</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Card ID:</span>
                  <span class="font-mono text-xs">{{ card.id }}</span>
                </div>
                <div v-if="card.addedAt" class="flex justify-between">
                  <span class="text-gray-600">Added:</span>
                  <span>{{ new Date(card.addedAt).toLocaleDateString() }}</span>
                </div>
              </div>
            </div>

            <!-- Special Badges -->
            <div v-if="specialBadges.length > 0" class="flex flex-wrap gap-2">
              <span
                v-for="badge in specialBadges"
                :key="badge.text"
                :class="['px-3 py-1 rounded-full text-xs font-semibold', badge.class]"
              >
                {{ badge.text }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="border-t border-gray-200 p-6 bg-gray-50">
        <div class="flex justify-end gap-4">
          <button
            @click="$emit('close')"
            class="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            @click="$emit('use-in-deck', card)"
            class="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <span>🃏</span>
            <span>Add to Deck</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import BattleCard from './BattleCard.vue';
import BabylonCard from './BabylonCard.vue';
import { getTypeColor as pokeTypeColor } from '@/services/pokeapi';

const props = defineProps({
  card: {
    type: Object,
    required: true,
  },
  enable3D: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['close', 'use-in-deck']);

const rarityNames = {
  C: 'Common',
  R: 'Rare',
  E: 'Epic',
  L: 'Legendary',
};

const rarityColors = {
  C: 'bg-gray-200 text-gray-700',
  R: 'bg-blue-200 text-blue-700',
  E: 'bg-purple-200 text-purple-700',
  L: 'bg-orange-200 text-orange-700',
};

const totalStats = computed(() => {
  if (props.card.type !== 'pokemon') return 0;
  return (props.card.hp || 0) + (props.card.atk || 0) + (props.card.def || 0) + (props.card.spd || 0);
});

const specialBadges = computed(() => {
  const badges = [];
  
  if (props.card.name?.toLowerCase().includes('mega')) {
    badges.push({
      text: 'MEGA EVOLUTION',
      class: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    });
  }
  
  if (props.card.category === 'legendary') {
    badges.push({
      text: 'LEGENDARY',
      class: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
    });
  }
  
  if (props.card.category === 'mythical') {
    badges.push({
      text: 'MYTHICAL',
      class: 'bg-gradient-to-r from-pink-500 to-purple-500 text-white',
    });
  }
  
  if (totalStats.value > 600) {
    badges.push({
      text: 'ULTRA POWERFUL',
      class: 'bg-gradient-to-r from-red-500 to-orange-500 text-white',
    });
  }
  
  return badges;
});

const getTypeColor = (type) => {
  return pokeTypeColor(type);
};
</script>

<style scoped>
/* Modal animations */
@keyframes modalFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modalSlideIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.fixed {
  animation: modalFadeIn 0.2s ease-out;
}

.bg-white.rounded-2xl {
  animation: modalSlideIn 0.3s ease-out;
}
</style>