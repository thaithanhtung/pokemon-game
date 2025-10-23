<template>
  <div class="pokemon-market">
    <div class="market-header">
      <h1>Pokemon Market</h1>
      <div class="user-info">
        <div class="user-details">
          <span class="user-name">{{ userName }}</span>
          <span class="user-level">Lv. {{ userLevel }}</span>
        </div>
        <div class="coins">
          <i class="fas fa-coins"></i>
          <span>{{ userCoins }} Gems</span>
        </div>
      </div>
    </div>

    <!-- Filter and Search -->
    <div class="market-controls">
      <input
        v-model="searchQuery"
        placeholder="Search Pokemon..."
        class="search-input"
      />
      <select v-model="categoryFilter" class="filter-select">
        <option value="all">All Categories</option>
        <option value="legendary">Legendary</option>
        <option value="mythical">Mythical</option>
        <option value="mega">Mega</option>
        <option value="ultra-beast">Ultra Beast</option>
      </select>
      <select v-model="sortBy" class="filter-select">
        <option value="price-low">Price: Low to High</option>
        <option value="price-high">Price: High to Low</option>
        <option value="name">Name: A-Z</option>
        <option value="newest">Newest First</option>
      </select>
    </div>

    <!-- Market Listings -->
    <div v-if="isLoading" class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading market...</p>
    </div>

    <div v-else-if="filteredListings.length === 0" class="empty-state">
      <i class="fas fa-store-slash"></i>
      <p>No Pokemon available in the market</p>
    </div>

    <div v-else class="market-grid">
      <div
        v-for="listing in filteredListings"
        :key="listing.id"
        class="market-card"
        :class="{ 'out-of-stock': listing.stock === 0 }"
        @click="showPokemonDetails(listing)"
      >
        <div class="pokemon-image" :class="{ 'mega-pokemon-image': listing.category === 'mega' }">
          <img :src="listing.sprite" :alt="listing.name" />
          <div class="category-badge" :class="`category-${listing.category}`">
            {{ formatCategory(listing.category) }}
          </div>
        </div>
        
        <div class="pokemon-info">
          <h3>{{ formatPokemonName(listing.name) }}</h3>
          <p class="pokemon-id">#{{ String(listing.pokemonId).padStart(3, '0') }}</p>
          <div class="types">
            <span
              v-for="type in listing.types"
              :key="type"
              :class="`type-badge type-${type}`"
            >
              {{ type }}
            </span>
          </div>
        </div>

        <div class="listing-details">
          <div class="price">
            <i class="fas fa-gems"></i>
            <span>{{ listing.price }} Gems</span>
          </div>
          <div class="stock">
            <span v-if="listing.stock === -1">Unlimited</span>
            <span v-else-if="listing.stock === 0" class="out-of-stock-text">Out of Stock</span>
            <span v-else>{{ listing.stock }} left</span>
          </div>
        </div>

        <button
          @click.stop="purchasePokemon(listing)"
          :disabled="listing.stock === 0 || userCoins < listing.price || isPurchasing"
          class="purchase-btn"
        >
          <span v-if="listing.stock === 0">Out of Stock</span>
          <span v-else-if="userCoins < listing.price">Insufficient Gems</span>
          <span v-else>Purchase</span>
        </button>
      </div>
    </div>

    <!-- Purchase Modal -->
    <div v-if="showPurchaseModal" class="modal-overlay" @click.self="closePurchaseModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Confirm Purchase</h2>
          <button @click="closePurchaseModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div v-if="selectedListing" class="modal-body">
          <div class="purchase-preview">
            <img :src="selectedListing.sprite" :alt="selectedListing.name" />
            <div class="purchase-details">
              <h3>{{ formatPokemonName(selectedListing.name) }}</h3>
              <p class="pokemon-id">#{{ String(selectedListing.pokemonId).padStart(3, '0') }}</p>
              <div class="types">
                <span
                  v-for="type in selectedListing.types"
                  :key="type"
                  :class="`type-badge type-${type}`"
                >
                  {{ type }}
                </span>
              </div>
              <div class="purchase-cost">
                <p class="price-label">Price:</p>
                <p class="price-value">
                  <i class="fas fa-gems"></i>
                  {{ selectedListing.price }} Gems
                </p>
              </div>
              <div class="balance-after">
                <p class="balance-label">Your balance after purchase:</p>
                <p class="balance-value" :class="{ 'insufficient': userCoins - selectedListing.price < 0 }">
                  <i class="fas fa-gems"></i>
                  {{ userCoins - selectedListing.price }} Gems
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closePurchaseModal" class="btn-cancel">Cancel</button>
          <button
            @click="confirmPurchase"
            :disabled="isPurchasing"
            class="btn-confirm"
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
    <div v-if="showSuccessModal" class="modal-overlay" @click.self="closeSuccessModal">
      <div class="modal-content success-modal">
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h2>Purchase Successful!</h2>
        <div v-if="purchasedPokemon" class="purchased-pokemon">
          <img :src="purchasedPokemon.sprite" :alt="purchasedPokemon.name" />
          <p>{{ formatPokemonName(purchasedPokemon.name) }} has been added to your collection!</p>
        </div>
        <button @click="closeSuccessModal" class="btn-primary">
          Continue Shopping
        </button>
      </div>
    </div>

    <!-- Pokemon Details Modal -->
    <div v-if="showDetailsModal && detailPokemon" class="modal-overlay" @click.self="closeDetailsModal">
      <div class="modal-content details-modal">
        <div class="modal-header">
          <h2>{{ formatPokemonName(detailPokemon.name) }}</h2>
          <button @click="closeDetailsModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="pokemon-detail-container">
            <!-- Pokemon Image Section -->
            <div class="pokemon-image-section">
              <div class="pokemon-detail-image" :class="{ 'mega-detail-image': detailPokemon.category === 'mega' }">
                <img :src="detailPokemon.sprite" :alt="detailPokemon.name" />
              </div>
              <div class="pokemon-basic-info">
                <p class="pokemon-id">#{{ String(detailPokemon.pokemonId).padStart(3, '0') }}</p>
                <div class="category-badge-large" :class="`category-${detailPokemon.category}`">
                  {{ formatCategory(detailPokemon.category) }}
                </div>
              </div>
            </div>
            
            <!-- Pokemon Info Section -->
            <div class="pokemon-info-section">
              <!-- Types -->
              <div class="info-group">
                <h3>Type</h3>
                <div class="types-display">
                  <span
                    v-for="type in detailPokemon.types"
                    :key="type"
                    :class="`type-badge-large type-${type}`"
                  >
                    {{ type }}
                  </span>
                </div>
              </div>

              <!-- Stats Preview -->
              <div class="info-group">
                <h3>Base Stats</h3>
                <div class="stats-preview">
                  <div class="stat-item">
                    <span class="stat-label">HP</span>
                    <span class="stat-value">{{ getBaseStats(detailPokemon.category).hp }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">ATK</span>
                    <span class="stat-value">{{ getBaseStats(detailPokemon.category).atk }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">DEF</span>
                    <span class="stat-value">{{ getBaseStats(detailPokemon.category).def }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">SPD</span>
                    <span class="stat-value">{{ getBaseStats(detailPokemon.category).spd }}</span>
                  </div>
                </div>
              </div>

              <!-- Market Info -->
              <div class="info-group">
                <h3>Market Information</h3>
                <div class="market-info">
                  <div class="market-info-item">
                    <i class="fas fa-gems"></i>
                    <span>Price: {{ detailPokemon.price }} Gems</span>
                  </div>
                  <div class="market-info-item">
                    <i class="fas fa-box"></i>
                    <span>Stock: {{ detailPokemon.stock === -1 ? 'Unlimited' : detailPokemon.stock }}</span>
                  </div>
                  <div class="market-info-item">
                    <i class="fas fa-circle" :class="detailPokemon.status === 'active' ? 'text-green' : 'text-gray'"></i>
                    <span>Status: {{ detailPokemon.status }}</span>
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div class="info-group">
                <h3>Description</h3>
                <p class="pokemon-description">
                  {{ getPokemonDescription(detailPokemon) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeDetailsModal" class="btn-cancel">Close</button>
          <button
            @click="purchaseFromDetails()"
            :disabled="detailPokemon.stock === 0 || userCoins < detailPokemon.price || isPurchasing"
            class="btn-confirm"
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

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { marketService } from '@/firebase/marketService';
import { pokemonCollectionService, userCardsService } from '@/firebase/services';
import { authService } from '@/firebase/auth';
import { userService } from '@/firebase/services';
import { usePlayerStore } from '@/stores/player';

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


const purchasePokemon = (listing) => {
  console.log('purchasePokemon called with listing:', listing);
  selectedListing.value = listing;
  showPurchaseModal.value = true;
  console.log('Modal should be shown:', showPurchaseModal.value);
};

const showPokemonDetails = (listing) => {
  detailPokemon.value = listing;
  showDetailsModal.value = true;
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

const getBaseStats = (category) => {
  return generatePokemonStats(category);
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

<style scoped>
.pokemon-market {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

.market-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.market-header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 10px;
}

.user-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
}

.user-level {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.coins {
  background: #9b59b6;
  color: white;
  padding: 10px 20px;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.market-controls {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.search-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.filter-select {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  min-width: 180px;
  background: white;
}

.loading {
  text-align: center;
  padding: 100px 20px;
  color: #7f8c8d;
}

.loading i {
  font-size: 3rem;
  margin-bottom: 20px;
}

.empty-state {
  text-align: center;
  padding: 100px 20px;
  color: #7f8c8d;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 20px;
}

.market-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.market-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
}

.market-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
}

.market-card.out-of-stock {
  opacity: 0.7;
}

.pokemon-image {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  text-align: center;
}

.pokemon-image img {
  width: 150px;
  height: 150px;
  object-fit: contain;
  filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.3));
}

.category-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  color: white;
}

.category-legendary { background: #f39c12; }
.category-mythical { background: #e74c3c; }
.category-mega { background: #9b59b6; }
.category-ultra-beast { background: #2c3e50; }

.pokemon-info {
  padding: 20px;
  text-align: center;
  flex: 1;
}

.pokemon-info h3 {
  margin: 0 0 5px;
  font-size: 1.3rem;
  color: #2c3e50;
}

.pokemon-id {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-bottom: 10px;
}

.types {
  display: flex;
  justify-content: center;
  gap: 5px;
  margin-bottom: 15px;
}

.type-badge {
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 0.8rem;
  color: white;
  text-transform: uppercase;
  font-weight: 500;
}

.type-fire { background: #F08030; }
.type-water { background: #6890F0; }
.type-grass { background: #78C850; }
.type-electric { background: #F8D030; }
.type-psychic { background: #F85888; }
.type-ice { background: #98D8D8; }
.type-dragon { background: #7038F8; }
.type-dark { background: #705848; }
.type-fairy { background: #EE99AC; }
.type-normal { background: #A8A878; }
.type-fighting { background: #C03028; }
.type-flying { background: #A890F0; }
.type-poison { background: #A040A0; }
.type-ground { background: #E0C068; }
.type-rock { background: #B8A038; }
.type-bug { background: #A8B820; }
.type-ghost { background: #705898; }
.type-steel { background: #B8B8D0; }

.listing-details {
  padding: 0 20px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 1.3rem;
  font-weight: bold;
  color: #f39c12;
}

.stock {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.out-of-stock-text {
  color: #e74c3c;
  font-weight: bold;
}

.purchase-btn {
  margin: 0 20px 20px;
  padding: 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.purchase-btn:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-2px);
}

.purchase-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  transform: none;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  overflow: hidden;
  animation: modalSlide 0.3s ease-out;
}

@keyframes modalSlide {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #7f8c8d;
  cursor: pointer;
  padding: 5px;
}

.close-btn:hover {
  color: #2c3e50;
}

.modal-body {
  padding: 30px;
}

.purchase-preview {
  display: flex;
  gap: 30px;
  align-items: center;
}

.purchase-preview img {
  width: 150px;
  height: 150px;
  object-fit: contain;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 12px;
}

.purchase-details {
  flex: 1;
}

.purchase-details h3 {
  margin: 0 0 5px;
  font-size: 1.5rem;
  color: #2c3e50;
}

.purchase-cost {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.price-label, .balance-label {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.price-value, .balance-value {
  font-size: 1.3rem;
  font-weight: bold;
  color: #2c3e50;
}

.balance-after {
  margin-top: 15px;
}

.balance-value.insufficient {
  color: #e74c3c;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

.btn-cancel {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-cancel:hover {
  background: #7f8c8d;
}

.btn-confirm {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-confirm:hover:not(:disabled) {
  background: #2980b9;
}

.btn-confirm:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

/* Success Modal */
.success-modal {
  text-align: center;
}

.success-icon {
  font-size: 4rem;
  color: #2ecc71;
  margin: 30px 0 20px;
}

.success-modal h2 {
  color: #2c3e50;
  margin-bottom: 30px;
}

.purchased-pokemon img {
  width: 120px;
  height: 120px;
  object-fit: contain;
  margin-bottom: 20px;
}

.purchased-pokemon p {
  font-size: 1.1rem;
  color: #7f8c8d;
  margin-bottom: 30px;
}

.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 20px;
}

.btn-primary:hover {
  background: #2980b9;
}

/* Mega Pokemon Special Styles */
.mega-pokemon-image {
  position: relative;
  background: linear-gradient(
    135deg,
    #ff0080 0%,
    #ff8c00 14%,
    #ffd700 28%,
    #00ff00 42%,
    #00ffff 56%,
    #0080ff 70%,
    #8000ff 84%,
    #ff0080 100%
  ) !important;
  background-size: 200% 200%;
  animation: rainbow-market 8s ease infinite;
  overflow: hidden;
}

@keyframes rainbow-market {
  0% {
    background-position: 0% 0%;
  }
  25% {
    background-position: 100% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
  75% {
    background-position: 0% 100%;
  }
  100% {
    background-position: 0% 0%;
  }
}

.mega-pokemon-image::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 60%);
  mix-blend-mode: overlay;
  animation: mega-pulse 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes mega-pulse {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

.mega-pokemon-image img {
  filter: 
    drop-shadow(0 5px 15px rgba(255, 0, 128, 0.4))
    drop-shadow(0 5px 15px rgba(0, 128, 255, 0.4))
    brightness(1.1);
}

.market-card:hover .mega-pokemon-image img {
  filter: 
    drop-shadow(0 8px 25px rgba(255, 0, 128, 0.6))
    drop-shadow(0 8px 25px rgba(0, 128, 255, 0.6))
    brightness(1.2);
  transform: scale(1.15) translateY(-5px);
}

/* Enhanced mega category badge */
.category-mega {
  background: linear-gradient(
    90deg,
    #ff0080,
    #ff8c00,
    #ffd700,
    #00ff00,
    #00ffff,
    #0080ff,
    #8000ff,
    #ff0080
  ) !important;
  background-size: 200% 100%;
  animation: rainbow-badge 2s linear infinite;
  box-shadow: 0 2px 15px rgba(255, 255, 255, 0.5);
  font-weight: bold;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.8);
}

@keyframes rainbow-badge {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}

@keyframes badge-pulse {
  0%, 100% {
    box-shadow: 0 2px 10px rgba(236, 72, 153, 0.5);
  }
  50% {
    box-shadow: 0 4px 20px rgba(236, 72, 153, 0.8);
  }
}

/* Pokemon Details Modal */
.details-modal {
  max-width: 800px;
}

.pokemon-detail-container {
  display: flex;
  gap: 30px;
}

.pokemon-image-section {
  flex: 0 0 300px;
  text-align: center;
}

.pokemon-detail-image {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}

.mega-detail-image {
  background: linear-gradient(
    135deg,
    #ff0080 0%,
    #ff8c00 14%,
    #ffd700 28%,
    #00ff00 42%,
    #00ffff 56%,
    #0080ff 70%,
    #8000ff 84%,
    #ff0080 100%
  );
  background-size: 200% 200%;
  animation: rainbow-wave 8s ease infinite;
}

.pokemon-detail-image img {
  width: 200px;
  height: 200px;
  object-fit: contain;
  filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.3));
}

.pokemon-basic-info {
  margin-top: 15px;
}

.pokemon-basic-info .pokemon-id {
  font-size: 1.2rem;
  font-weight: 600;
  color: #7f8c8d;
  margin-bottom: 10px;
}

.category-badge-large {
  display: inline-block;
  padding: 10px 20px;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: bold;
  text-transform: uppercase;
  color: white;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
}

.pokemon-info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.info-group h3 {
  margin: 0 0 10px;
  color: #2c3e50;
  font-size: 1.1rem;
}

.types-display {
  display: flex;
  gap: 10px;
}

.type-badge-large {
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 1rem;
  color: white;
  text-transform: uppercase;
  font-weight: 600;
}

.stats-preview {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-label {
  font-weight: 600;
  color: #7f8c8d;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #2c3e50;
}

.market-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.market-info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.market-info-item i {
  width: 20px;
  text-align: center;
  color: #7f8c8d;
}

.text-green {
  color: #2ecc71;
}

.text-gray {
  color: #95a5a6;
}

.pokemon-description {
  color: #555;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .pokemon-detail-container {
    flex-direction: column;
  }
  
  .pokemon-image-section {
    flex: none;
  }
}
</style>