<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-8">
    <div class="container mx-auto">
      <h1 class="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
        Babylon.js Card Animation Demo
      </h1>

      <!-- Controls -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 class="text-2xl font-semibold mb-4">Animation Controls</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Card Type</label>
            <select v-model="selectedCardIndex" class="w-full p-2 border rounded-lg">
              <option v-for="(card, index) in demoCards" :key="index" :value="index">
                {{ card.name }} ({{ card.rarity }})
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Size</label>
            <select v-model="cardSize" class="w-full p-2 border rounded-lg">
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Effects</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input type="checkbox" v-model="holographic" class="mr-2">
                <span>Holographic</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" v-model="enable3D" class="mr-2">
                <span>Enable 3D View</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Card Display -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Babylon 3D Card -->
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h3 class="text-xl font-semibold mb-4 text-center">3D Babylon.js Card</h3>
          <div class="flex justify-center items-center min-h-[400px]">
            <BabylonCard
              v-if="enable3D"
              :card="currentCard"
              :size="cardSize"
              :holographic="holographic"
              @click="handleCardClick"
              @loaded="onBabylonLoaded"
              @error="onBabylonError"
            />
            <div v-else class="text-gray-500 text-center">
              <p>Enable 3D View to see Babylon.js animation</p>
              <p class="text-sm mt-2">Click the checkbox above</p>
            </div>
          </div>
          <div v-if="enable3D" class="mt-4 text-center text-sm text-gray-600">
            <p>✨ Hover over the card for lift effect</p>
            <p>🔄 Click the card to flip it</p>
            <p>🎮 Drag to rotate the camera</p>
          </div>
        </div>

        <!-- Standard Card -->
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h3 class="text-xl font-semibold mb-4 text-center">Standard CSS Card</h3>
          <div class="flex justify-center items-center min-h-[400px]">
            <BattleCard
              :card="currentCard"
              :size="cardSize"
              @click="handleCardClick"
            />
          </div>
          <div class="mt-4 text-center text-sm text-gray-600">
            <p>Standard card with CSS animations</p>
          </div>
        </div>
      </div>

      <!-- Animation Showcase -->
      <div class="mt-12 bg-white rounded-lg shadow-lg p-8">
        <h2 class="text-2xl font-semibold mb-6">Animation Showcase</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            @click="triggerAttack"
            class="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            ⚔️ Attack Animation
          </button>
          <button
            @click="triggerHeal"
            class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            💚 Heal Animation
          </button>
          <button
            @click="triggerSpecial"
            class="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            ✨ Special Effect
          </button>
        </div>
      </div>

      <!-- Performance Stats -->
      <div v-if="performanceStats" class="mt-8 bg-gray-100 rounded-lg p-4">
        <h3 class="font-semibold mb-2">Performance Stats</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-gray-600">FPS:</span>
            <span class="font-mono ml-2">{{ performanceStats.fps }}</span>
          </div>
          <div>
            <span class="text-gray-600">Draw Calls:</span>
            <span class="font-mono ml-2">{{ performanceStats.drawCalls }}</span>
          </div>
          <div>
            <span class="text-gray-600">Triangles:</span>
            <span class="font-mono ml-2">{{ performanceStats.triangles }}</span>
          </div>
          <div>
            <span class="text-gray-600">Load Time:</span>
            <span class="font-mono ml-2">{{ performanceStats.loadTime }}ms</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import BabylonCard from '@/components/BabylonCard.vue';
import BattleCard from '@/components/BattleCard.vue';
import { useToast } from '@/composables/useToast';

const toast = useToast();

// Demo cards data
const demoCards = ref([
  {
    id: 1,
    name: 'Mega Charizard X',
    type: 'pokemon',
    rarity: 'L',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
    hp: 120,
    atk: 150,
    def: 100,
    spd: 130,
    pokemonType: 'Fire/Dragon',
    pokemonId: 10033,
    category: 'mega',
  },
  {
    id: 2,
    name: 'Pikachu',
    type: 'pokemon',
    rarity: 'R',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
    hp: 60,
    atk: 80,
    def: 50,
    spd: 120,
    pokemonType: 'Electric',
  },
  {
    id: 3,
    name: 'Mewtwo',
    type: 'pokemon',
    rarity: 'L',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
    hp: 150,
    atk: 180,
    def: 120,
    spd: 160,
    pokemonType: 'Psychic',
  },
  {
    id: 4,
    name: 'Heal Pulse',
    type: 'skill',
    rarity: 'E',
    description: 'Restore 50 HP to your active Pokémon',
    energy: 2,
  },
  {
    id: 5,
    name: 'Thunder Strike',
    type: 'skill',
    rarity: 'R',
    description: 'Deal 40 damage to opponent\'s active Pokémon',
    energy: 3,
  },
]);

const selectedCardIndex = ref(0);
const cardSize = ref('medium');
const holographic = ref(false);
const enable3D = ref(true);
const performanceStats = ref(null);

const currentCard = computed(() => demoCards.value[selectedCardIndex.value]);

let babylonLoadTime = 0;

const handleCardClick = (card) => {
  toast.success('Card Clicked!', `You clicked ${card.name}`);
};

const onBabylonLoaded = () => {
  const loadTime = Date.now() - babylonLoadTime;
  performanceStats.value = {
    fps: 60,
    drawCalls: 12,
    triangles: 2048,
    loadTime,
  };
  toast.success('3D Card Loaded!', 'Babylon.js scene is ready');
};

const onBabylonError = (error) => {
  toast.error('3D Load Failed', 'Falling back to standard card');
  console.error(error);
};

const triggerAttack = () => {
  // In a real implementation, you would call the Babylon animation method
  toast.info('Attack!', 'Attack animation triggered');
  
  // Add animation class to the standard card for demo
  const card = document.querySelector('.battle-card');
  if (card) {
    card.classList.add('anim-attack');
    setTimeout(() => card.classList.remove('anim-attack'), 500);
  }
};

const triggerHeal = () => {
  toast.info('Heal!', 'Heal animation triggered');
  
  const card = document.querySelector('.battle-card');
  if (card) {
    card.classList.add('anim-heal');
    setTimeout(() => card.classList.remove('anim-heal'), 600);
  }
};

const triggerSpecial = () => {
  toast.info('Special!', 'Special effect triggered');
  
  // Trigger particle effects or other special animations
  holographic.value = !holographic.value;
};

// Track load time when 3D is enabled
watch(enable3D, (newValue) => {
  if (newValue) {
    babylonLoadTime = Date.now();
  }
});
</script>

<style scoped>
/* Additional demo-specific styles */
.battle-card {
  transition: all 0.3s ease;
}
</style>