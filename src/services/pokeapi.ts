import axios, { type AxiosInstance } from 'axios';
import type { PokemonDetails } from '@/types';

const BASE_URL = 'https://pokeapi.co/api/v2';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const pokeAPI = {
  async getPokemonList(limit = 20, offset = 0): Promise<{ results: Array<{ name: string; url: string }>; count: number }> {
    try {
      const response = await api.get(`/pokemon`, {
        params: { limit, offset },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Pokemon list:', error);
      throw error;
    }
  },

  async getPokemonByName(name: string | number): Promise<PokemonDetails> {
    try {
      const response = await api.get(`/pokemon/${name}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching Pokemon ${name}:`, error);
      throw error;
    }
  },

  async getPokemonSpecies(name: string | number): Promise<any> {
    try {
      const response = await api.get(`/pokemon-species/${name}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching Pokemon species ${name}:`, error);
      throw error;
    }
  },

  async getEvolutionChain(url: string): Promise<any> {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching evolution chain:', error);
      throw error;
    }
  },

  async getAbility(name: string): Promise<any> {
    try {
      const response = await api.get(`/ability/${name}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ability ${name}:`, error);
      throw error;
    }
  },

  async getType(name: string): Promise<any> {
    try {
      const response = await api.get(`/type/${name}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching type ${name}:`, error);
      throw error;
    }
  },

  async getMove(name: string): Promise<any> {
    try {
      const response = await api.get(`/move/${name}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching move ${name}:`, error);
      throw error;
    }
  },

  async getAllPokemon(): Promise<{ results: Array<{ name: string; url: string }>; count: number }> {
    try {
      const response = await api.get(`/pokemon?limit=1025`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all Pokemon:', error);
      throw error;
    }
  },

  async getGeneration(id: number): Promise<any> {
    try {
      const response = await api.get(`/generation/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching generation ${id}:`, error);
      throw error;
    }
  },

  async getPokemonBatch(names: string[]): Promise<PokemonDetails[]> {
    try {
      const promises = names.map(name => this.getPokemonByName(name));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error fetching Pokemon batch:', error);
      throw error;
    }
  },
};

export const pokemonTypes: Record<string, string> = {
  normal: '#A8A878',
  fighting: '#C03028',
  flying: '#A890F0',
  poison: '#A040A0',
  ground: '#E0C068',
  rock: '#B8A038',
  bug: '#A8B820',
  ghost: '#705898',
  steel: '#B8B8D0',
  fire: '#F08030',
  water: '#6890F0',
  grass: '#78C850',
  electric: '#F8D030',
  psychic: '#F85888',
  ice: '#98D8D8',
  dragon: '#7038F8',
  dark: '#705848',
  fairy: '#EE99AC',
};

export function getTypeColor(type: string): string {
  return pokemonTypes[type] || '#68A090';
}

export function formatPokemonId(id: number): string {
  return `#${String(id).padStart(3, '0')}`;
}

export function getGenerationFromId(id: number): number {
  if (id <= 151) return 1;
  if (id <= 251) return 2;
  if (id <= 386) return 3;
  if (id <= 493) return 4;
  if (id <= 649) return 5;
  if (id <= 721) return 6;
  if (id <= 809) return 7;
  if (id <= 905) return 8;
  if (id <= 1025) return 9;
  return 9;
}
