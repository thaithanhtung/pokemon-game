<template>
  <div class="admin-marketplace">
    <div class="header">
      <h1>Admin Marketplace Management</h1>
      <div class="header-actions">
        <button @click="showAddModal = true" class="btn-primary">
          <i class="fas fa-plus"></i> Add Pokemon to Market
        </button>
      </div>
    </div>

    <!-- Market Listings -->
    <div class="market-section">
      <h2>Current Market Listings</h2>
      <div class="filters">
        <input v-model="searchQuery" placeholder="Search listings..." class="search-input" />
        <select v-model="filterType" class="filter-select">
          <option value="all">All Types</option>
          <option value="legendary">Legendary</option>
          <option value="mythical">Mythical</option>
          <option value="mega">Mega</option>
          <option value="ultra-beast">Ultra Beast</option>
        </select>
      </div>

      <div class="listings-grid">
        <div v-for="listing in filteredListings" :key="listing.id" class="listing-card">
          <div class="pokemon-info">
            <div class="listing-category-badge" :class="`category-${listing.category}`">
              {{ formatCategory(listing.category) }}
            </div>
            <img :src="listing.sprite" :alt="listing.name" />
            <h3>{{ formatPokemonName(listing.name) }}</h3>
            <p class="pokemon-id">#{{ String(listing.pokemonId).padStart(3, '0') }}</p>
            <div class="types">
              <span v-for="type in listing.types" :key="type" :class="`type-badge type-${type}`">
                {{ type }}
              </span>
            </div>
          </div>
          <div class="listing-details">
            <p class="price"><i class="fas fa-coins"></i> {{ listing.price }} Coins</p>
            <p class="stock">Stock: {{ listing.stock === -1 ? 'Unlimited' : listing.stock }}</p>
            <p class="status" :class="`status-${listing.status}`">
              {{ listing.status }}
            </p>
          </div>
          <div class="listing-actions">
            <button 
              @click="editListing(listing)" 
              class="action-btn btn-edit"
              title="Edit listing"
            >
              <i class="fas fa-edit"></i>
              <span class="btn-text">Edit</span>
            </button>
            <button 
              @click="toggleListingStatus(listing)" 
              class="action-btn"
              :class="listing.status === 'active' ? 'btn-deactivate' : 'btn-activate'"
              :title="listing.status === 'active' ? 'Deactivate listing' : 'Activate listing'"
            >
              <i :class="listing.status === 'active' ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"></i>
              <span class="btn-text">{{ listing.status === 'active' ? 'Active' : 'Inactive' }}</span>
            </button>
            <button 
              @click="deleteListing(listing)" 
              class="action-btn btn-delete"
              title="Delete listing"
            >
              <i class="fas fa-trash-alt"></i>
              <span class="btn-text">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Pokemon Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
      <div class="modal-content modal-content-large">
        <div class="modal-header">
          <h2>Add Pokemon to Market</h2>
          <button @click="closeAddModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <!-- Category Filter Tabs -->
          <div class="category-tabs">
            <button
              :class="['tab', { active: pokemonFilter === 'all' }]"
              @click="pokemonFilter = 'all'"
            >
              All Special Pokemon
            </button>
            <button
              :class="['tab', { active: pokemonFilter === 'legendary' }]"
              @click="pokemonFilter = 'legendary'"
            >
              Legendary
            </button>
            <button
              :class="['tab', { active: pokemonFilter === 'mythical' }]"
              @click="pokemonFilter = 'mythical'"
            >
              Mythical
            </button>
            <button
              :class="['tab', { active: pokemonFilter === 'mega' }]"
              @click="pokemonFilter = 'mega'"
            >
              Mega
            </button>
            <button
              :class="['tab', { active: pokemonFilter === 'ultra-beast' }]"
              @click="pokemonFilter = 'ultra-beast'"
            >
              Ultra Beast
            </button>
          </div>

          <!-- Search within displayed Pokemon -->
          <div class="pokemon-list-search">
            <input
              v-model="pokemonSearch"
              placeholder="Search within displayed Pokemon..."
              class="search-input"
            />
          </div>

          <!-- Pokemon Grid -->
          <div class="pokemon-select-grid">
            <div
              v-for="pokemon in filteredSpecialPokemon"
              :key="pokemon.uniqueId || pokemon.id"
              @click="selectPokemon(pokemon)"
              :class="['pokemon-select-card', { selected: selectedPokemon?.id === pokemon.id }]"
            >
              <div class="pokemon-card-badge" :class="`category-${pokemon.category}`">
                {{ formatCategory(pokemon.category) }}
              </div>
              <img :src="pokemon.sprite" :alt="pokemon.name" />
              <p class="pokemon-name">{{ pokemon.displayName || formatPokemonName(pokemon.name) }}</p>
              <p class="pokemon-id">#{{ String(pokemon.pokemonId || pokemon.id).padStart(3, '0') }}</p>
              <div class="types">
                <span v-for="type in pokemon.types" :key="type" :class="`type-badge type-${type}`">
                  {{ type }}
                </span>
              </div>
            </div>
          </div>

          <!-- Selected Pokemon Details -->
          <div v-if="selectedPokemon" class="selected-pokemon">
            <h3>Selected Pokemon</h3>
            <div class="pokemon-preview">
              <img :src="selectedPokemon.sprite" :alt="selectedPokemon.name" />
              <div class="pokemon-details">
                <h4>{{ selectedPokemon.displayName || formatPokemonName(selectedPokemon.name) }}</h4>
                <p>#{{ String(selectedPokemon.pokemonId || selectedPokemon.id).padStart(3, '0') }}</p>
                <div class="types">
                  <span
                    v-for="type in selectedPokemon.types"
                    :key="type"
                    :class="`type-badge type-${type}`"
                  >
                    {{ type }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Listing Configuration -->
            <div class="listing-config">
              <div class="form-group">
                <label>Price (Coins)</label>
                <input
                  v-model.number="newListing.price"
                  type="number"
                  min="1"
                  placeholder="Enter price"
                />
              </div>
              <div class="form-group">
                <label>Stock</label>
                <select v-model.number="newListing.stock">
                  <option value="-1">Unlimited</option>
                  <option value="1">1</option>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              <div class="form-group">
                <label>Status</label>
                <select v-model="newListing.status">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeAddModal" class="btn-cancel">Cancel</button>
          <button
            @click="addToMarket"
            :disabled="!selectedPokemon || !newListing.price"
            class="btn-primary"
          >
            Add to Market
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Edit Listing</h2>
          <button @click="closeEditModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div v-if="editingListing" class="editing-pokemon">
            <div class="pokemon-preview">
              <img :src="editingListing.sprite" :alt="editingListing.name" />
              <div class="pokemon-details">
                <h4>{{ formatPokemonName(editingListing.name) }}</h4>
                <p>#{{ String(editingListing.pokemonId).padStart(3, '0') }}</p>
              </div>
            </div>

            <div class="listing-config">
              <div class="form-group">
                <label>Price (Coins)</label>
                <input v-model.number="editingListing.price" type="number" min="1" />
              </div>
              <div class="form-group">
                <label>Stock</label>
                <select v-model.number="editingListing.stock">
                  <option value="-1">Unlimited</option>
                  <option value="1">1</option>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              <div class="form-group">
                <label>Status</label>
                <select v-model="editingListing.status">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeEditModal" class="btn-cancel">Cancel</button>
          <button @click="updateListing" class="btn-primary">Update Listing</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { marketService } from '@/firebase/marketService';
import { pokeAPI } from '@/services/pokeapi';
import { specialPokemon, legendaryPokemon, megaPokemon } from '@/data/legendaryPokemon';

const { showToast } = useToast();

// Data
const listings = ref([]);
const searchQuery = ref('');
const filterType = ref('all');
const showAddModal = ref(false);
const showEditModal = ref(false);
const pokemonSearch = ref('');
const searchResults = ref([]);
const selectedPokemon = ref(null);
const editingListing = ref(null);
const pokemonFilter = ref('all');

// All special Pokemon data loaded
const allSpecialPokemon = ref([]);
const isLoadingPokemon = ref(false);

const newListing = ref({
  price: null,
  stock: -1,
  status: 'active',
});

// Computed
const filteredListings = computed(() => {
  let filtered = listings.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      listing =>
        listing.name.toLowerCase().includes(query) || listing.pokemonId.toString().includes(query)
    );
  }

  if (filterType.value !== 'all') {
    filtered = filtered.filter(listing => listing.category === filterType.value);
  }

  return filtered;
});

const filteredSpecialPokemon = computed(() => {
  let filtered = allSpecialPokemon.value;

  // Filter by category
  if (pokemonFilter.value !== 'all') {
    filtered = filtered.filter(pokemon => pokemon.category === pokemonFilter.value);
  }

  // Filter by search
  if (pokemonSearch.value) {
    const query = pokemonSearch.value.toLowerCase();
    filtered = filtered.filter(
      pokemon => pokemon.name.toLowerCase().includes(query) || pokemon.id.toString().includes(query)
    );
  }

  return filtered;
});

// Methods
const formatPokemonName = name => {
  if (!name) return '';
  
  // Special handling for mega forms
  const parts = name.split('-');
  
  // Handle Mega X and Mega Y forms
  if (parts.includes('mega')) {
    const megaIndex = parts.indexOf('mega');
    if (megaIndex > 0) {
      // Get base Pokemon name
      const baseName = parts.slice(0, megaIndex)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Check for X or Y designation
      const designation = parts[megaIndex + 1];
      if (designation === 'x' || designation === 'y') {
        return `${baseName} Mega ${designation.toUpperCase()}`;
      }
      
      return `${baseName} Mega`;
    }
  }
  
  // Default formatting
  return parts
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatCategory = category => {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const loadAllSpecialPokemon = async () => {
  if (allSpecialPokemon.value.length > 0 || isLoadingPokemon.value) return;

  isLoadingPokemon.value = true;
  try {
    const loadedPokemon = [];

    // Load legendary and mythical Pokemon
    for (const pokemonData of legendaryPokemon) {
      try {
        const pokemon = await pokeAPI.getPokemonByName(pokemonData.id);
        loadedPokemon.push({
          id: pokemon.id,
          name: pokemon.name,
          sprite:
            pokemon.sprites.other['official-artwork'].front_default ||
            pokemon.sprites.other.home.front_default ||
            pokemon.sprites.front_default,
          types: pokemon.types.map(t => t.type.name),
          category: pokemonData.category,
        });
      } catch (error) {
        console.error(`Failed to load ${pokemonData.name}:`, error);
      }
    }

    // Load mega Pokemon using their base forms
    for (const megaData of megaPokemon) {
      try {
        // For mega Pokemon, try to get the mega form data first
        let pokemonData;
        let megaSprite;
        
        // Always use base form for data, but try to get mega sprite
        pokemonData = await pokeAPI.getPokemonByName(megaData.baseId);
        
        // Construct sprite URL for mega forms
        // First try the specific mega form sprite
        const megaSpriteId = megaData.id;
        megaSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${megaSpriteId}.png`;
        
        // Create a promise to check if the mega sprite exists
        const checkMegaSprite = new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(megaSprite);
          img.onerror = () => {
            // Try official artwork
            const officialArtwork = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${megaSpriteId}.png`;
            const img2 = new Image();
            img2.onload = () => resolve(officialArtwork);
            img2.onerror = () => {
              // Fallback to base sprite
              resolve(pokemonData.sprites.other['official-artwork'].front_default ||
                     pokemonData.sprites.other.home.front_default ||
                     pokemonData.sprites.front_default);
            };
            img2.src = officialArtwork;
          };
          img.src = megaSprite;
        });
        
        megaSprite = await checkMegaSprite;
        
        loadedPokemon.push({
          id: megaData.id, // Use unique mega ID to prevent conflicts
          uniqueId: `${megaData.category}_${megaData.id}`, // Unique identifier
          pokemonId: megaData.baseId, // Base Pokemon ID for data
          megaId: megaData.id, // Store mega ID separately
          name: megaData.name,
          displayName: formatPokemonName(megaData.name), // Format for display
          sprite: megaSprite,
          types: pokemonData.types.map(t => t.type.name),
          category: megaData.category,
          baseId: megaData.baseId,
        });
      } catch (error) {
        console.error(`Failed to load ${megaData.name}:`, error);
      }
    }

    allSpecialPokemon.value = loadedPokemon;
    console.log('Loaded special Pokemon:', loadedPokemon.length);
  } catch (error) {
    console.error('Error loading special Pokemon:', error);
    showToast('Failed to load Pokemon data', 'error');
  } finally {
    isLoadingPokemon.value = false;
  }
};

const searchPokemon = () => {
  if (!pokemonSearch.value || pokemonSearch.value.length < 2) {
    searchResults.value = [];
    return;
  }

  const query = pokemonSearch.value.toLowerCase();

  // Filter from pre-loaded special Pokemon
  const results = allSpecialPokemon.value.filter(
    pokemon => pokemon.name.toLowerCase().includes(query) || pokemon.id.toString().includes(query)
  );

  searchResults.value = results.slice(0, 20);
};

const selectPokemon = pokemon => {
  selectedPokemon.value = pokemon;
};

const addToMarket = async () => {
  if (!selectedPokemon.value || !newListing.value.price) {
    showToast('Please select a Pokemon and set a price', 'error');
    return;
  }

  try {
    const listing = {
      pokemonId: selectedPokemon.value.pokemonId || selectedPokemon.value.id,
      name: selectedPokemon.value.name,
      sprite: selectedPokemon.value.sprite,
      types: selectedPokemon.value.types,
      category: selectedPokemon.value.category,
      price: newListing.value.price,
      stock: newListing.value.stock,
      status: newListing.value.status,
    };

    await marketService.addMarketListing(listing);
    await loadListings();
    closeAddModal();
    showToast('Pokemon added to market successfully', 'success');
  } catch (error) {
    console.error('Error adding to market:', error);
    showToast('Failed to add Pokemon to market', 'error');
  }
};

const editListing = listing => {
  editingListing.value = { ...listing };
  showEditModal.value = true;
};

const updateListing = async () => {
  if (!editingListing.value) return;

  try {
    await marketService.updateMarketListing(editingListing.value.id, {
      price: editingListing.value.price,
      stock: editingListing.value.stock,
      status: editingListing.value.status,
    });
    await loadListings();
    closeEditModal();
    showToast('Listing updated successfully', 'success');
  } catch (error) {
    console.error('Error updating listing:', error);
    showToast('Failed to update listing', 'error');
  }
};

const toggleListingStatus = async listing => {
  try {
    const newStatus = listing.status === 'active' ? 'inactive' : 'active';
    await marketService.updateMarketListing(listing.id, { status: newStatus });
    await loadListings();
    showToast(`Listing ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
  } catch (error) {
    console.error('Error toggling listing status:', error);
    showToast('Failed to update listing status', 'error');
  }
};

const deleteListing = async listing => {
  // Create a more stylish confirmation using a custom modal-like approach
  const confirmDelete = () => {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'delete-confirm-modal';
      modal.innerHTML = `
        <div class="delete-confirm-overlay" onclick="this.parentElement.remove(); resolve(false)">
          <div class="delete-confirm-content" onclick="event.stopPropagation()">
            <div class="delete-confirm-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Delete Listing?</h3>
            <p>Are you sure you want to delete <strong>${formatPokemonName(listing.name)}</strong> from the market?</p>
            <p class="delete-confirm-warning">This action cannot be undone.</p>
            <div class="delete-confirm-actions">
              <button class="btn-cancel-delete" onclick="this.closest('.delete-confirm-modal').remove(); resolve(false)">
                <i class="fas fa-times"></i> Cancel
              </button>
              <button class="btn-confirm-delete" onclick="this.closest('.delete-confirm-modal').remove(); resolve(true)">
                <i class="fas fa-trash-alt"></i> Delete
              </button>
            </div>
          </div>
        </div>
      `;
      
      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        .delete-confirm-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
        }
        
        .delete-confirm-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease-out;
        }
        
        .delete-confirm-content {
          background: white;
          padding: 30px;
          border-radius: 16px;
          max-width: 400px;
          text-align: center;
          animation: slideIn 0.3s ease-out;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }
        
        .delete-confirm-icon {
          width: 60px;
          height: 60px;
          background: rgba(231, 76, 60, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: #e74c3c;
          font-size: 28px;
        }
        
        .delete-confirm-content h3 {
          margin: 0 0 15px;
          color: #2c3e50;
          font-size: 1.5rem;
        }
        
        .delete-confirm-content p {
          margin: 0 0 10px;
          color: #555;
          line-height: 1.5;
        }
        
        .delete-confirm-warning {
          color: #e74c3c;
          font-size: 0.9rem;
          font-style: italic;
        }
        
        .delete-confirm-actions {
          display: flex;
          gap: 10px;
          margin-top: 25px;
        }
        
        .delete-confirm-actions button {
          flex: 1;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .btn-cancel-delete {
          background: #ecf0f1;
          color: #555;
        }
        
        .btn-cancel-delete:hover {
          background: #bdc3c7;
        }
        
        .btn-confirm-delete {
          background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
          color: white;
        }
        
        .btn-confirm-delete:hover {
          background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      
      document.head.appendChild(style);
      document.body.appendChild(modal);
      
      // Clean up style when modal is removed
      modal.addEventListener('DOMNodeRemoved', () => {
        style.remove();
      });
    });
  };

  const confirmed = await confirmDelete();
  if (!confirmed) return;

  try {
    await marketService.deleteMarketListing(listing.id);
    await loadListings();
    showToast('Listing deleted successfully', 'success');
  } catch (error) {
    console.error('Error deleting listing:', error);
    showToast('Failed to delete listing', 'error');
  }
};

const loadListings = async () => {
  try {
    listings.value = await marketService.getMarketListings();
  } catch (error) {
    console.error('Error loading listings:', error);
    showToast('Failed to load market listings', 'error');
  }
};

const closeAddModal = () => {
  showAddModal.value = false;
  pokemonSearch.value = '';
  searchResults.value = [];
  selectedPokemon.value = null;
  pokemonFilter.value = 'all';
  newListing.value = {
    price: null,
    stock: -1,
    status: 'active',
  };
};

const closeEditModal = () => {
  showEditModal.value = false;
  editingListing.value = null;
};

// Lifecycle
onMounted(() => {
  loadListings();
  loadAllSpecialPokemon();
});
</script>

<style scoped>
.admin-marketplace {
  padding: 30px;
  max-width: 1600px;
  margin: 0 auto;
  background: #f0f2f5;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  background: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.header h1 {
  font-size: 3rem;
  color: #2c3e50;
  font-weight: 700;
  margin: 0;
}

.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-primary:hover {
  background: #2980b9;
  transform: translateY(-2px);
}

.btn-primary:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  transform: none;
}

.market-section {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
}

.market-section h2 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.filter-select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  min-width: 150px;
}

.listings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
}

.listing-card {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.listing-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3498db, #9b59b6, #3498db);
  background-size: 200% 100%;
  transform: translateY(-100%);
  transition: transform 0.3s ease;
}

.listing-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  border-color: rgba(52, 152, 219, 0.3);
  background: #ffffff;
}

.listing-card:hover::before {
  transform: translateY(0);
  animation: gradient-slide 3s linear infinite;
}

@keyframes gradient-slide {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}

.pokemon-info {
  text-align: center;
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  position: relative;
}

.listing-category-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  color: white;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
  z-index: 10;
}

.category-legendary {
  background: linear-gradient(135deg, #f39c12 0%, #f1c40f 100%);
}
.category-mythical {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
}
.category-mega {
  background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
}
.category-ultra-beast {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
}

.pokemon-info img {
  width: 180px;
  height: 180px;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  transition: transform 0.3s;
}

.listing-card:hover .pokemon-info img {
  transform: scale(1.05);
}

.pokemon-info h3 {
  margin: 15px 0 8px;
  color: #2c3e50;
  font-size: 1.4rem;
  font-weight: 600;
}

.pokemon-id {
  color: #7f8c8d;
  font-size: 1rem;
  font-weight: 500;
}

.types {
  display: flex;
  justify-content: center;
  gap: 5px;
  margin-top: 10px;
}

.type-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  color: white;
  text-transform: uppercase;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  display: inline-block;
}

.type-fire {
  background: #f08030;
}
.type-water {
  background: #6890f0;
}
.type-grass {
  background: #78c850;
}
.type-electric {
  background: #f8d030;
}
.type-psychic {
  background: #f85888;
}
.type-ice {
  background: #98d8d8;
}
.type-dragon {
  background: #7038f8;
}
.type-dark {
  background: #705848;
}
.type-fairy {
  background: #ee99ac;
}
.type-normal {
  background: #a8a878;
}
.type-fighting {
  background: #c03028;
}
.type-flying {
  background: #a890f0;
}
.type-poison {
  background: #a040a0;
}
.type-ground {
  background: #e0c068;
}
.type-rock {
  background: #b8a038;
}
.type-bug {
  background: #a8b820;
}
.type-ghost {
  background: #705898;
}
.type-steel {
  background: #b8b8d0;
}

.listing-details {
  border-top: 1px solid #e0e0e0;
  padding-top: 10px;
  margin-bottom: 10px;
}

.price {
  font-size: 1.5rem;
  font-weight: bold;
  color: #f39c12;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.price i {
  font-size: 1.3rem;
}

.stock {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 25px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  overflow: hidden;
}

.status::before {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.status-active {
  background: linear-gradient(135deg, rgba(46, 204, 113, 0.15) 0%, rgba(39, 174, 96, 0.15) 100%);
  color: #27ae60;
  border: 1.5px solid #27ae60;
  padding-left: 24px;
}

.status-active::before {
  background: #27ae60;
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0% {
    box-shadow: 0 0 0 0 rgba(39, 174, 96, 0.7);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(39, 174, 96, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(39, 174, 96, 0);
  }
}

.status-inactive {
  background: linear-gradient(135deg, rgba(149, 165, 166, 0.15) 0%, rgba(127, 140, 141, 0.15) 100%);
  color: #7f8c8d;
  border: 1.5px solid #95a5a6;
  padding-left: 24px;
}

.status-inactive::before {
  background: #95a5a6;
}

.listing-actions {
  display: flex;
  gap: 8px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.action-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.action-btn i {
  font-size: 0.95rem;
  transition: transform 0.3s ease;
}

.action-btn:hover i {
  transform: scale(1.1);
}

.btn-text {
  font-size: 0.85rem;
  letter-spacing: 0.02em;
}

/* Edit Button */
.btn-edit {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

.btn-edit:hover {
  background: linear-gradient(135deg, #2980b9 0%, #21618c 100%);
}

.btn-edit::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn-edit:hover::before {
  left: 100%;
}

/* Activate Button */
.btn-activate {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  color: white;
}

.btn-activate:hover {
  background: linear-gradient(135deg, #229954 0%, #1e8449 100%);
}

/* Deactivate Button */
.btn-deactivate {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
}

.btn-deactivate:hover {
  background: linear-gradient(135deg, #e67e22 0%, #d68910 100%);
}

.btn-deactivate i,
.btn-activate i {
  transition: transform 0.3s ease;
}

.btn-deactivate:hover i {
  transform: rotate(-20deg) scale(1.1);
}

.btn-activate:hover i {
  transform: rotate(20deg) scale(1.1);
}

/* Delete Button */
.btn-delete {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
}

.btn-delete:hover {
  background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
}

.btn-delete:hover i {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .btn-text {
    display: none;
  }
  
  .action-btn {
    padding: 10px;
  }
  
  .action-btn i {
    font-size: 1.1rem;
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-content-large {
  max-width: 1200px;
  width: 95%;
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
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.pokemon-search {
  margin-bottom: 20px;
}

.search-results {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-top: 10px;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  cursor: pointer;
  transition: background 0.3s;
}

.search-result-item:hover {
  background: #f0f0f0;
}

.search-result-item.selected {
  background: #e3f2fd;
}

.search-result-item img {
  width: 60px;
  height: 60px;
  object-fit: contain;
}

.selected-pokemon {
  margin-top: 20px;
}

.pokemon-preview {
  display: flex;
  align-items: center;
  gap: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.pokemon-preview img {
  width: 150px;
  height: 150px;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 10px;
}

.pokemon-details h4 {
  margin: 0 0 5px;
  color: white;
  font-size: 1.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.pokemon-details p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
}

.listing-config {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-weight: 500;
  color: #2c3e50;
}

.form-group input,
.form-group select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

.btn-cancel {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #7f8c8d;
}

/* Category Tabs */
.category-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 10px;
  flex-wrap: wrap;
}

.category-tabs .tab {
  padding: 10px 20px;
  border: none;
  background: #f5f5f5;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  color: #666;
}

.category-tabs .tab:hover {
  background: #e0e0e0;
}

.category-tabs .tab.active {
  background: #3498db;
  color: white;
}

/* Pokemon List Search */
.pokemon-list-search {
  margin-bottom: 20px;
}

/* Pokemon Select Grid */
.pokemon-select-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.pokemon-select-card {
  background: white;
  border-radius: 12px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  border: 3px solid transparent;
  position: relative;
}

.pokemon-select-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.pokemon-select-card.selected {
  border-color: #3498db;
  background: #e8f4fd;
}

.pokemon-select-card img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 8px;
}

.pokemon-select-card .pokemon-name {
  font-weight: 600;
  color: #2c3e50;
  margin: 5px 0;
  font-size: 0.9rem;
}

.pokemon-select-card .pokemon-id {
  color: #7f8c8d;
  font-size: 0.8rem;
  margin: 3px 0;
}

.pokemon-card-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: white;
}

/* Special styling for mega Pokemon in the select grid */
.pokemon-select-card:has(.category-mega) {
  background: linear-gradient(135deg, rgba(255, 0, 128, 0.1) 0%, rgba(0, 128, 255, 0.1) 100%);
}

.pokemon-select-card.selected:has(.category-mega) {
  border-color: #ff0080;
  background: linear-gradient(135deg, rgba(255, 0, 128, 0.2) 0%, rgba(0, 128, 255, 0.2) 100%);
}
</style>
