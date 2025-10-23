<script setup>
import { ref, computed, onMounted, onUnmounted, watch, getCurrentInstance } from 'vue';
import { usePokemonStore } from '@/stores/pokemon';
import PokemonCard from '@/components/PokemonCard.vue';
import PokemonCardSkeleton from '@/components/PokemonCardSkeleton.vue';

const pokemonStore = usePokemonStore();

// Debug helper
const instance = getCurrentInstance();
window.$pokedex = instance?.ctx;
// Dùng onMounted để đảm bảo component đã mount
onMounted(() => {
  const instance = getCurrentInstance();
  if (instance) {
    window.$pokedex = instance.ctx;
    console.log('✅ $pokedex exposed:', instance.ctx);
  }
});

const selectedGeneration = ref(null);
const searchQuery = ref('');
const showScrollTop = ref(false);
const isLoadingMore = ref(false);

const generations = [
  { id: 1, name: 'Generation I', region: 'Kanto', start: 1, end: 151 },
  { id: 2, name: 'Generation II', region: 'Johto', start: 152, end: 251 },
  { id: 3, name: 'Generation III', region: 'Hoenn', start: 252, end: 386 },
  { id: 4, name: 'Generation IV', region: 'Sinnoh', start: 387, end: 493 },
  { id: 5, name: 'Generation V', region: 'Unova', start: 494, end: 649 },
  { id: 6, name: 'Generation VI', region: 'Kalos', start: 650, end: 721 },
  { id: 7, name: 'Generation VII', region: 'Alola', start: 722, end: 809 },
  { id: 8, name: 'Generation VIII', region: 'Galar', start: 810, end: 905 },
  { id: 9, name: 'Generation IX', region: 'Paldea', start: 906, end: 1025 },
];

const filteredPokemon = computed(() =>
  pokemonStore.filteredPokemon(searchQuery.value, selectedGeneration.value)
);

const groupedPokemon = computed(() => {
  const groups = {};

  filteredPokemon.value.forEach(pokemon => {
    if (!groups[pokemon.generation]) {
      groups[pokemon.generation] = {
        generation: generations.find(g => g.id === pokemon.generation),
        pokemon: [],
      };
    }
    groups[pokemon.generation].pokemon.push(pokemon);
  });

  return Object.values(groups).sort((a, b) => a.generation.id - b.generation.id);
});

const showingPartialData = computed(() => {
  if (!selectedGeneration.value) return false;
  const gen = generations.find(g => g.id === selectedGeneration.value);
  if (!gen) return false;

  const loadedInGeneration = pokemonStore.loadedPokemon.filter(
    p => p.id >= gen.start && p.id <= gen.end
  ).length;
  const totalInGeneration = gen.end - gen.start + 1;

  return loadedInGeneration < totalInGeneration;
});

const skeletonCount = computed(() => {
  if (pokemonStore.isLoading && pokemonStore.loadedPokemon.length === 0) {
    return 60;
  }
  if (showingPartialData.value) {
    return 20;
  }
  return 0;
});

const clearFilters = () => {
  selectedGeneration.value = null;
  searchQuery.value = '';
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 300;

  if (!pokemonStore.isAllDataLoaded && !isLoadingMore.value) {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const clientHeight = window.innerHeight;

    if (scrollTop + clientHeight >= scrollHeight - 1000) {
      loadMorePokemon();
    }
  }
};

const loadMorePokemon = async () => {
  if (isLoadingMore.value || pokemonStore.isAllDataLoaded) return;

  isLoadingMore.value = true;
  await pokemonStore.loadAllPokemon();
  isLoadingMore.value = false;
};

watch(selectedGeneration, async newGen => {
  if (newGen && showingPartialData.value) {
    await loadMorePokemon();
  }
});

onMounted(async () => {
  window.addEventListener('scroll', handleScroll);

  if (pokemonStore.loadedPokemon.length === 0) {
    await pokemonStore.loadInitialBatch();
  }

  setTimeout(() => {
    if (!pokemonStore.isAllDataLoaded) {
      pokemonStore.loadAllPokemon();
    }
  }, 1000);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div class="pokedex-container">
    <header class="sticky top-0 bg-white shadow-md z-20">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-3xl font-bold text-gray-800">National Pokédex</h1>
          <div class="flex gap-2">
            <router-link
              to="/pokemon-farm"
              class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <span>🌾</span>
              Pokemon Farm
            </router-link>
            <router-link
              to="/card-clash/menu"
              class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
            >
              <span>🎴</span>
              Card Clash
            </router-link>
          </div>
        </div>

        <div class="filters flex flex-col md:flex-row gap-4">
          <div class="search-container flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name or number..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="generation-filter flex items-center gap-2">
            <label class="text-gray-700 whitespace-nowrap">Generation:</label>
            <select
              v-model="selectedGeneration"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option :value="null">All Generations</option>
              <option v-for="gen in generations" :key="gen.id" :value="gen.id">
                {{ gen.name }}
              </option>
            </select>
          </div>

          <button
            @click="clearFilters"
            class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Clear Filters
          </button>
        </div>

        <div v-if="!pokemonStore.isAllDataLoaded && pokemonStore.totalPokemon > 0" class="mt-2">
          <div class="flex items-center gap-2">
            <div class="flex-1 bg-gray-200 rounded-full h-2">
              <div
                class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${pokemonStore.loadingProgress}%` }"
              ></div>
            </div>
            <span class="text-sm text-gray-600">
              {{ pokemonStore.loadedPokemon.length }} / {{ pokemonStore.totalPokemon }}
            </span>
          </div>
        </div>
      </div>
    </header>

    <main class="container mx-auto px-4 py-8">
      <div v-if="pokemonStore.error" class="text-center py-16">
        <p class="text-xl text-red-600">{{ pokemonStore.error }}</p>
        <button
          @click="pokemonStore.loadInitialBatch"
          class="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>

      <div
        v-else-if="filteredPokemon.length === 0 && !pokemonStore.isLoading"
        class="text-center py-16"
      >
        <p class="text-xl text-gray-600">No Pokémon found matching your search.</p>
      </div>

      <div v-else class="pokemon-groups">
        <section
          v-for="group in groupedPokemon"
          :key="group.generation.id"
          class="generation-section mb-12"
        >
          <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span>{{ group.generation.name }}</span>
            <span class="text-base font-normal text-gray-600">
              ({{ group.generation.region }} - #{{ group.generation.start }}-{{
                group.generation.end
              }})
            </span>
          </h2>

          <div
            class="pokemon-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            <PokemonCard v-for="pokemon in group.pokemon" :key="pokemon.id" :pokemon="pokemon" />
          </div>
        </section>

        <div
          v-if="pokemonStore.isLoading && pokemonStore.loadedPokemon.length === 0"
          class="skeleton-grid"
        >
          <h2 class="text-2xl font-bold text-gray-800 mb-6">Loading Pokémon...</h2>
          <div
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            <PokemonCardSkeleton v-for="i in skeletonCount" :key="`skeleton-${i}`" />
          </div>
        </div>

        <div
          v-if="
            showingPartialData.value ||
            (!pokemonStore.isAllDataLoaded && pokemonStore.loadedPokemon.length > 0)
          "
          class="skeleton-grid mt-8"
        >
          <div
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            <PokemonCardSkeleton v-for="i in 18" :key="`skeleton-more-${i}`" />
          </div>
        </div>
      </div>
    </main>

    <button
      v-show="showScrollTop"
      @click="scrollToTop"
      class="fixed bottom-8 right-8 w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.pokedex-container {
  min-height: 100vh;
  background-color: #f9fafb;
}

.generation-section {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
