<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
      <div class="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 class="text-3xl font-bold">Pokemon Market</h1>
        <div class="flex items-center gap-6">
          <div class="text-right">
            <p class="text-sm opacity-90">{{ userName }}</p>
            <p class="text-xs opacity-75">Lv. {{ userLevel }}</p>
          </div>
          <div class="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
            <i class="fas fa-gems text-yellow-300"></i>
            <span class="font-semibold">{{ userCoins }} Gems</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter and Search -->
    <div class="bg-white shadow-sm border-b">
      <div class="container mx-auto px-4 py-4 flex flex-wrap gap-4">
        <input
          v-model="searchQuery"
          placeholder="Search Pokemon..."
          class="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select v-model="categoryFilter" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="all">All Categories</option>
          <option value="legendary">Legendary</option>
          <option value="mythical">Mythical</option>
          <option value="mega">Mega</option>
          <option value="ultra-beast">Ultra Beast</option>
        </select>
        <select v-model="sortBy" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="name">Name: A-Z</option>
          <option value="newest">Newest First</option>
        </select>
      </div>
    </div>

    <!-- Market Listings -->
    <div v-if="isLoading" class="text-center py-24">
      <i class="fas fa-spinner fa-spin text-5xl text-gray-500 mb-4"></i>
      <p class="text-xl text-gray-500">Loading market...</p>
    </div>

    <div v-else-if="filteredListings.length === 0" class="text-center py-24">
      <i class="fas fa-store-slash text-6xl text-gray-500 mb-4"></i>
      <p class="text-xl text-gray-500">No Pokemon available in the market</p>
    </div>

    <div v-else class="container mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
      <div
        v-for="listing in filteredListings"
        :key="listing.id"
        class="bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col"
        :class="{ 'opacity-70': listing.stock === 0 }"
        @click="showPokemonDetails(listing)"
      >
        <div class="relative p-6 text-center" :class="listing.category === 'mega' ? 'bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 animate-gradient-xy' : 'bg-gradient-to-br from-purple-600 to-blue-700'">
          <img :src="listing.sprite" :alt="listing.name" class="w-32 h-32 mx-auto object-contain drop-shadow-2xl" />
          <div class="absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold uppercase text-white"
            :class="{
              'bg-yellow-500': listing.category === 'legendary',
              'bg-red-500': listing.category === 'mythical',
              'bg-gradient-to-r from-pink-500 to-purple-500': listing.category === 'mega',
              'bg-gray-800': listing.category === 'ultra-beast'
            }">
            {{ formatCategory(listing.category) }}
          </div>
        </div>
        
        <div class="p-4 text-center flex-1">
          <h3 class="text-xl font-bold text-gray-800 mb-1">{{ formatPokemonName(listing.name) }}</h3>
          <p class="text-sm text-gray-600 mb-3">#{{ String(listing.pokemonId).padStart(3, '0') }}</p>
          <div class="flex justify-center gap-2 mb-4">
            <span
              v-for="type in listing.types"
              :key="type"
              class="px-3 py-1 rounded-full text-xs text-white font-medium uppercase"
              :class="getTypeColor(type)"
            >
              {{ type }}
            </span>
          </div>
        </div>

        <div class="px-4 pb-4 flex justify-between items-center">
          <div class="flex items-center gap-1 text-xl font-bold text-yellow-600">
            <i class="fas fa-gems"></i>
            <span>{{ listing.price }}</span>
          </div>
          <div class="text-sm">
            <span v-if="listing.stock === -1" class="text-gray-600">Unlimited</span>
            <span v-else-if="listing.stock === 0" class="text-red-600 font-bold">Out of Stock</span>
            <span v-else class="text-gray-600">{{ listing.stock }} left</span>
          </div>
        </div>

        <button
          @click.stop="purchasePokemon(listing)"
          :disabled="listing.stock === 0 || userCoins < listing.price || isPurchasing"
          class="w-full py-3 font-bold text-white transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          :class="listing.stock === 0 || userCoins < listing.price ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'"
        >
          <span v-if="listing.stock === 0">Out of Stock</span>
          <span v-else-if="userCoins < listing.price">Insufficient Gems</span>
          <span v-else>Purchase</span>
        </button>
      </div>
    </div>

    <!-- Purchase Modal -->
    <div v-if="showPurchaseModal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" @click.self="closePurchaseModal">
      <div class="bg-white rounded-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        <div class="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 class="text-2xl font-bold text-gray-800">Confirm Purchase</h2>
          <button @click="closePurchaseModal" class="text-gray-500 hover:text-gray-700 text-2xl">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div v-if="selectedListing" class="p-6">
          <div class="flex gap-6 items-center">
            <div class="bg-gradient-to-br from-purple-600 to-blue-700 p-5 rounded-xl">
              <img :src="selectedListing.sprite" :alt="selectedListing.name" class="w-32 h-32 object-contain drop-shadow-2xl" />
            </div>
            <div class="flex-1">
              <h3 class="text-2xl font-bold text-gray-800">{{ formatPokemonName(selectedListing.name) }}</h3>
              <p class="text-gray-600 mb-3">#{{ String(selectedListing.pokemonId).padStart(3, '0') }}</p>
              <div class="flex gap-2 mb-5">
                <span
                  v-for="type in selectedListing.types"
                  :key="type"
                  :class="['px-3 py-1 rounded-full text-xs text-white font-medium uppercase', getTypeColor(type)]"
                >
                  {{ type }}
                </span>
              </div>
              <div class="space-y-3 pt-5 border-t border-gray-200">
                <div>
                  <p class="text-sm text-gray-600">Price:</p>
                  <p class="text-2xl font-bold text-gray-800">
                    <i class="fas fa-gems text-yellow-600"></i>
                    {{ selectedListing.price }} Gems
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Your balance after purchase:</p>
                  <p class="text-xl font-bold" :class="userCoins - selectedListing.price < 0 ? 'text-red-600' : 'text-gray-800'">
                    <i class="fas fa-gems"></i>
                    {{ userCoins - selectedListing.price }} Gems
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 p-5 bg-gray-50 border-t border-gray-200">
          <button @click="closePurchaseModal" class="px-5 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">Cancel</button>
          <button
            @click="confirmPurchase"
            :disabled="isPurchasing"
            class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            @mousedown="console.log('Button mousedown')"
          >
            <span v-if="isPurchasing">
              <i class="fas fa-spinner fa-spin"></i> Processing...
            </span>
            <span v-else>Confirm Purchase</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" @click.self="closeSuccessModal">
      <div class="bg-white rounded-xl p-8 max-w-md w-full text-center animate-fade-in-up">
        <div class="text-6xl text-green-500 mb-4">
          <i class="fas fa-check-circle"></i>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Purchase Successful!</h2>
        <div v-if="purchasedPokemon" class="mb-6">
          <img :src="purchasedPokemon.sprite" :alt="purchasedPokemon.name" class="w-24 h-24 mx-auto mb-4 object-contain" />
          <p class="text-gray-700">{{ formatPokemonName(purchasedPokemon.name) }} has been added to your collection!</p>
        </div>
        <button @click="closeSuccessModal" class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
          Continue Shopping
        </button>
      </div>
    </div>

    <!-- Pokemon Details Modal -->
    <div v-if="showDetailsModal && detailPokemon" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" @click.self="closeDetailsModal">
      <div class="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-up">
        <div class="flex justify-between items-center p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 class="text-2xl font-bold text-gray-800">{{ formatPokemonName(detailPokemon.name) }}</h2>
          <button @click="closeDetailsModal" class="text-gray-500 hover:text-gray-700 text-2xl">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="p-6">
          <div class="flex flex-col md:flex-row gap-8">
            <!-- Pokemon Image Section -->
            <div class="md:w-1/3 text-center">
              <div class="rounded-2xl p-8 mb-5" :class="detailPokemon.category === 'mega' ? 'bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 animate-gradient-xy' : 'bg-gradient-to-br from-purple-600 to-blue-700'">
                <img :src="detailPokemon.sprite" :alt="detailPokemon.name" class="w-48 h-48 mx-auto object-contain drop-shadow-2xl" />
              </div>
              <div>
                <p class="text-xl font-semibold text-gray-700 mb-3">#{{ String(detailPokemon.pokemonId).padStart(3, '0') }}</p>
                <div class="inline-block px-5 py-2 rounded-full text-white font-bold uppercase shadow-lg"
                  :class="{
                    'bg-yellow-500': detailPokemon.category === 'legendary',
                    'bg-red-500': detailPokemon.category === 'mythical',
                    'bg-gradient-to-r from-pink-500 to-purple-500': detailPokemon.category === 'mega',
                    'bg-gray-800': detailPokemon.category === 'ultra-beast'
                  }">
                  {{ formatCategory(detailPokemon.category) }}
                </div>
              </div>
            </div>
            
            <!-- Pokemon Info Section -->
            <div class="md:flex-1 space-y-6">
              <!-- Types -->
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-3">Type</h3>
                <div class="flex gap-3">
                  <span
                    v-for="type in detailPokemon.types"
                    :key="type"
                    :class="['px-5 py-2 rounded-full text-white font-semibold uppercase', getTypeColor(type)]"
                  >
                    {{ type }}
                  </span>
                </div>
              </div>

              <!-- Stats Preview -->
              <div class="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  Base Stats 
                  <span v-if="!isLoadingStats && detailPokemon.stats" class="text-xs text-blue-600 font-normal ml-2">(from PokeAPI)</span>
                </h3>
                <div v-if="isLoadingStats" class="text-center py-5 text-gray-600">
                  <i class="fas fa-spinner fa-spin mb-2"></i>
                  <p class="text-sm">Loading stats...</p>
                </div>
                <div v-else class="grid grid-cols-2 gap-3">
                  <div class="flex justify-between items-center bg-white px-3 py-2 rounded-md">
                    <span class="text-sm font-medium text-gray-600">HP</span>
                    <span class="text-lg font-bold text-gray-800">{{ getBaseStats(detailPokemon).hp }}</span>
                  </div>
                  <div class="flex justify-between items-center bg-white px-3 py-2 rounded-md">
                    <span class="text-sm font-medium text-gray-600">ATK</span>
                    <span class="text-lg font-bold text-gray-800">{{ getBaseStats(detailPokemon).atk }}</span>
                  </div>
                  <div class="flex justify-between items-center bg-white px-3 py-2 rounded-md">
                    <span class="text-sm font-medium text-gray-600">DEF</span>
                    <span class="text-lg font-bold text-gray-800">{{ getBaseStats(detailPokemon).def }}</span>
                  </div>
                  <div class="flex justify-between items-center bg-white px-3 py-2 rounded-md">
                    <span class="text-sm font-medium text-gray-600">SPD</span>
                    <span class="text-lg font-bold text-gray-800">{{ getBaseStats(detailPokemon).spd }}</span>
                  </div>
                </div>
              </div>

              <!-- Market Info -->
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-3">Market Information</h3>
                <div class="space-y-2">
                  <div class="flex items-center gap-3">
                    <i class="fas fa-gems text-yellow-600 w-5 text-center"></i>
                    <span class="text-gray-700">Price: <span class="font-semibold">{{ detailPokemon.price }} Gems</span></span>
                  </div>
                  <div class="flex items-center gap-3">
                    <i class="fas fa-box text-gray-600 w-5 text-center"></i>
                    <span class="text-gray-700">Stock: <span class="font-semibold">{{ detailPokemon.stock === -1 ? 'Unlimited' : detailPokemon.stock }}</span></span>
                  </div>
                  <div class="flex items-center gap-3">
                    <i class="fas fa-circle w-5 text-center" :class="detailPokemon.status === 'active' ? 'text-green-500' : 'text-gray-500'"></i>
                    <span class="text-gray-700">Status: <span class="font-semibold capitalize">{{ detailPokemon.status }}</span></span>
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-3">Description</h3>
                <p class="text-gray-600 leading-relaxed">
                  {{ getPokemonDescription(detailPokemon) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 p-5 bg-gray-50 border-t border-gray-200">
          <button @click="closeDetailsModal" class="px-5 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">Close</button>
          <button
            @click="purchaseFromDetails()"
            :disabled="detailPokemon.stock === 0 || userCoins < detailPokemon.price || isPurchasing"
            class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <span v-if="detailPokemon.stock === 0">Out of Stock</span>
            <span v-else-if="userCoins < detailPokemon.price">Insufficient Gems</span>
            <span v-else>Purchase for {{ detailPokemon.price }} Gems</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@keyframes gradient-xy {
  0%, 100% {
    background-position: left top;
  }
  50% {
    background-position: right bottom;
  }
}

.animate-gradient-xy {
  animation: gradient-xy 15s ease infinite;
  background-size: 200% 200%;
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.3s ease-out;
}
</style>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { marketService } from '@/firebase/marketService';
import { pokemonCollectionService, userCardsService } from '@/firebase/services';
import { authService } from '@/firebase/auth';
import { userService } from '@/firebase/services';
import { usePlayerStore } from '@/stores/player';
import { pokeAPI } from '@/services/pokeapi';

const router = useRouter();
const { showToast } = useToast();
const playerStore = usePlayerStore();

// Data
const listings = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');
const categoryFilter = ref('all');
const sortBy = ref('price-low');
const showPurchaseModal = ref(false);
const showSuccessModal = ref(false);
const showDetailsModal = ref(false);
const selectedListing = ref(null);
const purchasedPokemon = ref(null);
const detailPokemon = ref(null);
const isPurchasing = ref(false);
const isLoadingStats = ref(false);
let unsubscribeListings = null;

// Computed properties for user data
const currentUser = computed(() => authService.getCurrentUser());
const userCoins = computed(() => playerStore.player?.gems || 0); // Using gems as coins
const userName = computed(() => playerStore.player?.name || 'Trainer');
const userLevel = computed(() => playerStore.player?.level || 1);

// Computed
const filteredListings = computed(() => {
  let filtered = listings.value.filter(listing => listing.status === 'active');

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(listing =>
      listing.name.toLowerCase().includes(query) ||
      listing.pokemonId.toString().includes(query)
    );
  }

  // Category filter
  if (categoryFilter.value !== 'all') {
    filtered = filtered.filter(listing => listing.category === categoryFilter.value);
  }

  // Sort
  switch (sortBy.value) {
    case 'price-low':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'name':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'newest':
      // Already sorted by createdAt desc from Firebase
      break;
  }

  return filtered;
});

// Methods
const formatPokemonName = (name) => {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatCategory = (category) => {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getTypeColor = (type) => {
  const colors = {
    fire: 'bg-red-500',
    water: 'bg-blue-500',
    grass: 'bg-green-500',
    electric: 'bg-yellow-500',
    psychic: 'bg-pink-500',
    ice: 'bg-blue-300',
    dragon: 'bg-purple-700',
    dark: 'bg-gray-800',
    fairy: 'bg-pink-400',
    normal: 'bg-gray-600',
    fighting: 'bg-red-700',
    flying: 'bg-indigo-400',
    poison: 'bg-purple-500',
    ground: 'bg-yellow-600',
    rock: 'bg-yellow-800',
    bug: 'bg-green-600',
    ghost: 'bg-purple-600',
    steel: 'bg-gray-500',
  };
  return colors[type] || 'bg-gray-600';
};


const purchasePokemon = (listing) => {
  console.log('purchasePokemon called with listing:', listing);
  selectedListing.value = listing;
  showPurchaseModal.value = true;
  console.log('Modal should be shown:', showPurchaseModal.value);
};

const showPokemonDetails = async (listing) => {
  detailPokemon.value = listing;
  showDetailsModal.value = true;
  isLoadingStats.value = true;
  
  // Fetch full Pokemon data including stats
  try {
    const fullPokemonData = await pokeAPI.getPokemonByName(listing.pokemonId);
    if (fullPokemonData) {
      // Merge the API data with the listing data
      detailPokemon.value = {
        ...listing,
        stats: fullPokemonData.stats,
        abilities: fullPokemonData.abilities,
        height: fullPokemonData.height,
        weight: fullPokemonData.weight,
      };
    }
  } catch (error) {
    console.error('Failed to fetch Pokemon details:', error);
    // Continue showing the modal with basic data
  } finally {
    isLoadingStats.value = false;
  }
};

const closeDetailsModal = () => {
  showDetailsModal.value = false;
  detailPokemon.value = null;
};

const purchaseFromDetails = () => {
  if (detailPokemon.value) {
    closeDetailsModal();
    purchasePokemon(detailPokemon.value);
  }
};

const getBaseStats = (pokemon) => {
  // If we have the actual Pokemon stats from API, use them
  if (pokemon.stats) {
    const hp = pokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 100;
    const attack = pokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 50;
    const defense = pokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 50;
    const speed = pokemon.stats.find(s => s.stat.name === 'speed')?.base_stat || 50;
    
    return { hp, atk: attack, def: defense, spd: speed };
  }
  
  // Fallback to category-based stats if no API data
  return generatePokemonStats(pokemon.category);
};

const getPokemonDescription = (pokemon) => {
  const descriptions = {
    'legendary': 'A legendary Pokemon of immense power, rarely seen by humans.',
    'mythical': 'A mythical Pokemon shrouded in mystery and ancient tales.',
    'mega': 'A Pokemon capable of Mega Evolution, unlocking tremendous power.',
    'ultra-beast': 'An Ultra Beast from another dimension with extraordinary abilities.'
  };
  
  return descriptions[pokemon.category] || 'A special Pokemon with unique abilities.';
};

// Generate stats based on Pokemon category
const generatePokemonStats = (category) => {
  switch (category) {
    case 'legendary':
    case 'mythical':
      return { hp: 150, atk: 80, def: 70, spd: 60 };
    case 'mega':
      return { hp: 130, atk: 70, def: 60, spd: 55 };
    case 'ultra-beast':
      return { hp: 120, atk: 75, def: 55, spd: 65 };
    default:
      return { hp: 100, atk: 50, def: 50, spd: 50 };
  }
};

const confirmPurchase = async () => {
  console.log('confirmPurchase called', {
    selectedListing: selectedListing.value,
    currentUser: currentUser.value,
    userCoins: userCoins.value
  });

  if (!selectedListing.value || !currentUser.value) {
    console.error('Missing data:', { selectedListing: selectedListing.value, currentUser: currentUser.value });
    return;
  }

  // Check if user has enough gems
  if (userCoins.value < selectedListing.value.price) {
    showToast('Insufficient gems!', 'error');
    return;
  }

  isPurchasing.value = true;
  try {
    console.log('Calling marketService.purchasePokemon...');
    // Purchase the Pokemon
    const result = await marketService.purchasePokemon(
      currentUser.value.uid,
      selectedListing.value.id,
      userCoins.value
    );
    console.log('Purchase result:', result);

    if (result.success) {
      // Generate stats based on category
      const stats = generatePokemonStats(result.pokemon.category);
      
      // Create a card from the Pokemon for the card collection
      const cardData = {
        id: `pokemon_${result.pokemon.id}`,
        pokemonId: result.pokemon.id,
        name: result.pokemon.name,
        type: 'pokemon',
        category: result.pokemon.category, // Include category for mega detection
        rarity: result.pokemon.category === 'legendary' || result.pokemon.category === 'mythical' ? 'L' : 
                result.pokemon.category === 'mega' ? 'E' : 'R',
        level: 1,
        hp: stats.hp,
        maxHp: stats.hp,
        atk: stats.atk,
        def: stats.def,
        spd: stats.spd,
        energy: result.pokemon.category === 'legendary' || result.pokemon.category === 'mythical' ? 4 : 3,
        pokemonType: result.pokemon.types[0] || 'normal',
        image: result.pokemon.sprite,
        skills: [
          {
            name: 'Tackle',
            damage: 20,
            energy: 1,
            description: 'A basic physical attack',
          }
        ],
        obtainedAt: Date.now(),
        obtainedFrom: 'market',
        isNew: true,
      };
      
      // Log purchase details for debugging
      console.log('Purchase completed:', {
        listing: selectedListing.value,
        result: result,
        cardCreated: cardData
      });

      // Add card to user's card collection via userCardsService
      await userCardsService.addCardToUser(currentUser.value.uid, cardData, 'market');
      
      // Reload cards from Firebase to ensure consistency
      const firebase = playerStore.getFirebase();
      if (firebase) {
        const latestCards = await firebase.getUserCards();
        if (latestCards && latestCards.length > 0) {
          playerStore.player.cards = latestCards;
          console.log('Cards reloaded after purchase:', latestCards.length);
        }
      }
      
      // Also add Pokemon to user's Pokemon collection (for farm/battles)
      await pokemonCollectionService.addPokemonToUser(currentUser.value.uid, {
        pokemonId: result.pokemon.id,
        name: result.pokemon.name,
        sprite: result.pokemon.sprite,
        types: result.pokemon.types,
        category: result.pokemon.category,
        level: 1,
        experience: 0,
        stats: {
          hp: 100,
          attack: 50,
          defense: 50,
          speed: 50,
        },
        nickname: result.pokemon.name,
        obtainedFrom: 'market',
        obtainedAt: new Date().toISOString(),
      });

      // Update user's gems
      const newGems = userCoins.value - result.price;
      await userService.updateUserStats(currentUser.value.uid, { gems: newGems });
      
      // Update player store
      playerStore.player.gems = newGems;

      // Show success
      purchasedPokemon.value = result.pokemon;
      showPurchaseModal.value = false;
      showSuccessModal.value = true;
      
      showToast('Pokemon purchased successfully!', 'success');
    }
  } catch (error) {
    console.error('Error purchasing Pokemon:', error);
    showToast(error.message || 'Failed to purchase Pokemon', 'error');
  } finally {
    isPurchasing.value = false;
  }
};

const closePurchaseModal = () => {
  showPurchaseModal.value = false;
  selectedListing.value = null;
};

const closeSuccessModal = () => {
  showSuccessModal.value = false;
  purchasedPokemon.value = null;
};

// Lifecycle
onMounted(async () => {
  // Check if user is authenticated
  const user = authService.getCurrentUser();
  if (!user) {
    router.push('/');
    return;
  }

  // Ensure player store is loaded
  await playerStore.ensureAuthReady();
  
  // Log player data for debugging
  console.log('Player data loaded:', {
    player: playerStore.player,
    gems: playerStore.player?.gems,
    currentUser: currentUser.value
  });

  // Subscribe to market listings
  isLoading.value = true;
  unsubscribeListings = marketService.subscribeToMarketListings((marketListings) => {
    listings.value = marketListings;
    isLoading.value = false;
    console.log('Market listings loaded:', listings.value.length);
  }, true); // Only active listings
});

onUnmounted(() => {
  if (unsubscribeListings) {
    unsubscribeListings();
  }
});
</script>

