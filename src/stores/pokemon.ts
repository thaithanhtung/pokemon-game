import { defineStore } from 'pinia';
import { pokeAPI, getGenerationFromId } from '@/services/pokeapi';
import type { Pokemon, PokemonDetails } from '@/types';

interface PokemonState {
  pokemonList: Array<{ name: string; url: string }>;
  pokemonDetails: Record<string, PokemonDetails>;
  loadedPokemon: Pokemon[];
  isLoading: boolean;
  error: string | null;
  loadingProgress: number;
  totalPokemon: number;
  cachedSpecies: Record<string, any>;
  cachedEvolutions: Record<string, any>;
}

export const usePokemonStore = defineStore('pokemon', {
  state: (): PokemonState => ({
    pokemonList: [],
    pokemonDetails: {},
    loadedPokemon: [],
    isLoading: false,
    error: null,
    loadingProgress: 0,
    totalPokemon: 0,
    cachedSpecies: {},
    cachedEvolutions: {},
  }),

  getters: {
    getPokemonById: state => id => {
      return state.loadedPokemon.find(p => p.id === parseInt(id));
    },

    getPokemonDetails: state => id => {
      return state.pokemonDetails[id];
    },

    filteredPokemon: state => (searchQuery, selectedGeneration) => {
      let filtered = [...state.loadedPokemon];

      if (selectedGeneration) {
        filtered = filtered.filter(pokemon => pokemon.generation === selectedGeneration);
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          pokemon =>
            pokemon.name.toLowerCase().includes(query) || pokemon.id.toString().includes(query)
        );
      }

      return filtered;
    },

    isAllDataLoaded: state => {
      return state.loadedPokemon.length === state.totalPokemon && state.totalPokemon > 0;
    },
  },

  actions: {
    async loadAllPokemon() {
      if (this.isAllDataLoaded) {
        return;
      }

      try {
        this.isLoading = true;
        this.error = null;

        if (this.pokemonList.length === 0) {
          const response = await pokeAPI.getAllPokemon();
          this.pokemonList = response.results;
          this.totalPokemon = response.results.length;
        }

        const batchSize = 20;
        const startIndex = this.loadedPokemon.length;

        for (let i = startIndex; i < this.pokemonList.length; i += batchSize) {
          const batch = this.pokemonList.slice(i, Math.min(i + batchSize, this.pokemonList.length));

          const pokemonDetails = await Promise.all(
            batch.map(async pokemon => {
              try {
                const existingPokemon = this.getPokemonById(
                  pokemon.url.split('/').filter(Boolean).pop()
                );
                if (existingPokemon) {
                  return existingPokemon;
                }

                const data = await pokeAPI.getPokemonByName(pokemon.name);
                return {
                  id: data.id,
                  name: data.name,
                  types: data.types.map(t => t.type.name),
                  sprite:
                    data.sprites.other['official-artwork'].front_default ||
                    data.sprites.other.home.front_default ||
                    data.sprites.front_default,
                  generation: getGenerationFromId(data.id),
                  stats: data.stats, // Include stats data
                  abilities: data.abilities,
                  height: data.height,
                  weight: data.weight,
                };
              } catch (err) {
                console.error(`Failed to load ${pokemon.name}:`, err);
                return null;
              }
            })
          );

          const validPokemon = pokemonDetails.filter(p => p !== null);
          this.loadedPokemon.push(...validPokemon);
          this.loadedPokemon.sort((a, b) => a.id - b.id);

          this.loadingProgress = Math.round((this.loadedPokemon.length / this.totalPokemon) * 100);

          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (err) {
        this.error = 'Failed to load Pokémon data. Please try again later.';
        console.error('Error loading Pokemon:', err);
      } finally {
        this.isLoading = false;
      }
    },

    async loadPokemonDetails(id) {
      const existingDetails = this.pokemonDetails[id];
      if (existingDetails) {
        return existingDetails;
      }

      try {
        // First load Pokemon data
        const pokemonData = await pokeAPI.getPokemonByName(id);
        this.pokemonDetails[id] = pokemonData;

        // Extract species ID from the Pokemon data
        const speciesId = pokemonData.species.url.split('/').filter(Boolean).pop();

        // Load species data using the correct species ID
        if (!this.cachedSpecies[speciesId]) {
          const speciesData = await pokeAPI.getPokemonSpecies(speciesId);
          this.cachedSpecies[speciesId] = speciesData;

          if (speciesData.evolution_chain) {
            const evolutionData = await pokeAPI.getEvolutionChain(speciesData.evolution_chain.url);
            this.cachedEvolutions[speciesId] = evolutionData;
          }
        }

        return pokemonData;
      } catch (error) {
        console.error(`Failed to load details for Pokemon ${id}:`, error);
        throw error;
      }
    },

    async loadInitialBatch() {
      if (this.loadedPokemon.length > 0) {
        return;
      }

      try {
        this.isLoading = true;
        this.error = null;

        const response = await pokeAPI.getAllPokemon();
        this.pokemonList = response.results;
        this.totalPokemon = response.results.length;

        const initialBatch = this.pokemonList.slice(0, 1025);

        const pokemonDetails = await Promise.all(
          initialBatch.map(async pokemon => {
            try {
              const data = await pokeAPI.getPokemonByName(pokemon.name);
              return {
                id: data.id,
                name: data.name,
                types: data.types.map(t => t.type.name),
                sprite:
                  data.sprites.other['official-artwork'].front_default ||
                  data.sprites.other.home.front_default ||
                  data.sprites.front_default,
                generation: getGenerationFromId(data.id),
              };
            } catch (err) {
              console.error(`Failed to load ${pokemon.name}:`, err);
              return null;
            }
          })
        );

        const validPokemon = pokemonDetails.filter(p => p !== null);
        this.loadedPokemon = validPokemon.sort((a, b) => a.id - b.id);
        this.loadingProgress = Math.round((this.loadedPokemon.length / this.totalPokemon) * 100);
      } catch (err) {
        this.error = 'Failed to load Pokémon data. Please try again later.';
        console.error('Error loading initial batch:', err);
      } finally {
        this.isLoading = false;
      }
    },

    getPokemonSpecies(id) {
      // id might be a species ID or a Pokemon name/ID
      // Check if we have it cached by the given ID first
      if (this.cachedSpecies[id]) {
        return this.cachedSpecies[id];
      }

      // If not found and we have Pokemon details, get species ID from Pokemon data
      const pokemonData = this.pokemonDetails[id];
      if (pokemonData && pokemonData.species) {
        const speciesId = pokemonData.species.url.split('/').filter(Boolean).pop();
        return this.cachedSpecies[speciesId] || null;
      }

      return null;
    },

    getEvolutionChain(id) {
      // Similar logic for evolution chain
      if (this.cachedEvolutions[id]) {
        return this.cachedEvolutions[id];
      }

      const pokemonData = this.pokemonDetails[id];
      if (pokemonData && pokemonData.species) {
        const speciesId = pokemonData.species.url.split('/').filter(Boolean).pop();
        return this.cachedEvolutions[speciesId] || null;
      }

      return null;
    },

    clearError() {
      this.error = null;
    },
  },
});
