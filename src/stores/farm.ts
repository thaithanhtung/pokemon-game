import { defineStore } from 'pinia';
import { authService } from '@/firebase/auth';
import { farmService, pokemonCollectionService } from '@/firebase/services';
import type { UserPokemon, FarmLayout, FarmResources } from '@/types';

interface Tile {
  id: string;
  x: number;
  z: number;
  type: string;
  state?: string;
  crop?: Crop;
}

interface Building {
  id: string;
  type: string;
  x: number;
  z: number;
  level: number;
}

interface Crop {
  id: string;
  type: string;
  x: number;
  z: number;
  plantedAt: number;
  harvestTime: number;
  growthStage: number;
  watered: boolean;
  fertilized: boolean;
}

interface GameTime {
  day: number;
  hour: number;
  minute: number;
  season: 'spring' | 'summer' | 'fall' | 'winter';
  weather: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
}

interface Resources {
  currency: number;
  seeds: Record<string, number>;
  items: Record<string, number>;
  berries: Record<string, number>;
  materials: Record<string, number>;
}

interface Farm {
  layout: {
    gridSize: number;
    tiles: Tile[];
  };
  buildings: Building[];
  crops: Crop[];
  expansions: any[];
  islandSize: number;
  farmingArea: {
    startX: number;
    endX: number;
    startZ: number;
    endZ: number;
  };
}

interface FarmState {
  isAuthenticated: boolean;
  userId: string | null;
  farm: Farm;
  farmPokemon: UserPokemon[];
  allUserPokemon: UserPokemon[];
  gameTime: GameTime;
  resources: Resources;
  isLoading: boolean;
  autoSaveEnabled: boolean;
  autoSaveInterval: number | null;
  lastSaveTime: number | null;
  settings: {
    soundEnabled: boolean;
    musicVolume: number;
    sfxVolume: number;
    graphicsQuality: 'low' | 'medium' | 'high';
    autoSave: boolean;
  };
}

export const useFarmStore = defineStore('farm', {
  state: (): FarmState => ({
    // Auth state
    isAuthenticated: false,
    userId: null,

    // Farm data
    farm: {
      layout: {
        gridSize: 20,
        tiles: [], // Array of tile states
      },
      buildings: [],
      crops: [],
      expansions: [], // Track purchased expansions
      islandSize: 50, // Current island diameter
      farmingArea: {
        startX: 5,
        endX: 15,
        startZ: 8,
        endZ: 23
      }
    },

    // Pokemon on farm
    farmPokemon: [],
    
    // All user's Pokemon
    allUserPokemon: [],

    // Game time
    gameTime: {
      day: 1,
      hour: 8,
      minute: 0,
      season: 'spring', // spring, summer, fall, winter
      weather: 'sunny', // sunny, cloudy, rainy, stormy
    },

    // Resources
    resources: {
      currency: 1000,
      seeds: {
        wheat: 10,
        corn: 5,
        berries: 20,
        oranBerry: 5,
        pechaBerry: 3,
        cheriBerry: 2,
        tomato: 15,
        rareCandy: 0,
      },
      items: {
        pokemonFood: 50,
        fertilizer: 10,
        water: 100,
      },
    },

    // Quests
    quests: {
      daily: [],
      weekly: [],
      story: [],
    },
  }),

  getters: {
    getTileAt: state => (x, z) => {
      return state.farm.tiles.find(tile => tile.x === x && tile.z === z);
    },

    getBuildingAt: state => (x, z) => {
      return state.farm.buildings.find(building => building.x === x && building.z === z);
    },

    getCropAt: state => (x, z) => {
      return state.farm.crops.find(crop => crop.x === x && crop.z === z);
    },

    getPokemonOnFarm: state => {
      return state.farmPokemon.filter(pokemon => pokemon.location === 'farm');
    },

    getCurrentSeason: state => {
      const seasons = ['spring', 'summer', 'fall', 'winter'];
      const seasonIndex = Math.floor((state.gameTime.day - 1) / 30) % 4;
      return seasons[seasonIndex];
    },
  },

  actions: {
    // Initialize auth listener
    initializeFirebase() {
      // Listen to auth state changes
      authService.onAuthStateChanged((user) => {
        if (user) {
          this.isAuthenticated = true;
          this.userId = user.uid;
          this.loadFarmData();
        } else {
          this.isAuthenticated = false;
          this.userId = null;
          this.loadLocalFarmData();
        }
      });
    },

    // Load farm data from Firebase - REFACTORED
    async loadFarmData() {
      if (!this.isAuthenticated || !this.userId) {
        console.log('User not authenticated, using local farm data');
        this.loadLocalFarmData();
        return;
      }

      try {
        const userId = this.userId;

        // Load farm layout using new service
        const farmData = await farmService.loadFarmLayout(userId);

        if (farmData) {
          this.farm = {
            layout: farmData.layout || this.farm.layout,
            buildings: farmData.buildings || [],
            crops: farmData.crops || [],
            expansions: farmData.expansions || [],
            islandSize: farmData.islandSize || 50,
            farmingArea: farmData.farmingArea || {
              startX: 5,
              endX: 15,
              startZ: 8,
              endZ: 23
            }
          };
        } else {
          // Initialize new farm
          this.initializeFarm();
          await this.initializeUserPokemon(userId);
        }

        // Load all user's Pokemon
        const allPokemon = await pokemonCollectionService.getUserPokemon(userId);
        this.allUserPokemon = allPokemon;
        
        // Filter Pokemon on farm
        this.farmPokemon = allPokemon.filter(p => p.location === 'farm' || p.location === 'Farm');

        // Load resources
        const resources = await farmService.loadFarmResources(userId);
        if (resources) {
          this.resources = resources;
        }

        console.log('Farm data loaded successfully from Firestore');
      } catch (error) {
        console.error('Error loading farm data:', error);
        this.loadLocalFarmData();
      }
    },

    // Initialize starter Pokemon for new users
    async initializeUserPokemon(userId) {
      if (!this.isAuthenticated) return;
      
      try {
        // Check if user already has Pokemon
        const existingPokemon = await pokemonCollectionService.getUserPokemon(userId);
        if (existingPokemon && existingPokemon.length > 0) {
          return; // User already has Pokemon
        }
        
        // Create starter Pokemon
        const starterPokemon = [
          {
            species: 25, // Pikachu
            nickname: 'Pikachu',
            level: 5,
            happiness: 80,
            hunger: 60,
            location: 'farm',
            x: -2,
            z: 2,
            nature: 'Hardy',
            stats: {
              hp: 35,
              attack: 55,
              defense: 40,
              specialAttack: 50,
              specialDefense: 50,
              speed: 90
            }
          },
          {
            species: 1, // Bulbasaur
            nickname: 'Bulbasaur',
            level: 3,
            happiness: 90,
            hunger: 40,
            location: 'farm',
            x: 0,
            z: 2,
            nature: 'Modest',
            stats: {
              hp: 45,
              attack: 49,
              defense: 49,
              specialAttack: 65,
              specialDefense: 65,
              speed: 45
            }
          },
          {
            species: 7, // Squirtle
            nickname: 'Squirtle',
            level: 4,
            happiness: 70,
            hunger: 80,
            location: 'farm',
            x: 2,
            z: 2,
            nature: 'Bold',
            stats: {
              hp: 44,
              attack: 48,
              defense: 65,
              specialAttack: 50,
              specialDefense: 64,
              speed: 43
            }
          },
          {
            species: 4, // Charmander
            nickname: 'Charmander',
            level: 3,
            happiness: 75,
            hunger: 50,
            location: 'PC',
            nature: 'Adamant',
            stats: {
              hp: 39,
              attack: 52,
              defense: 43,
              specialAttack: 60,
              specialDefense: 50,
              speed: 65
            }
          },
          {
            species: 133, // Eevee
            nickname: 'Eevee',
            level: 2,
            happiness: 85,
            hunger: 45,
            location: 'PC',
            nature: 'Timid',
            stats: {
              hp: 55,
              attack: 55,
              defense: 50,
              specialAttack: 45,
              specialDefense: 65,
              speed: 55
            }
          }
        ];
        
        // Add Pokemon to Firebase
        for (const pokemon of starterPokemon) {
          await pokemonCollectionService.addPokemonToUser(userId, pokemon);
        }
        
        console.log('Starter Pokemon created for new user');
      } catch (error) {
        console.error('Error initializing starter Pokemon:', error);
      }
    },

    // Initialize a new farm
    initializeFarm() {
      const gridSize = 20;
      const tiles = [];

      for (let x = 0; x < gridSize; x++) {
        for (let z = 0; z < gridSize; z++) {
          tiles.push({
            x,
            z,
            type: 'grass', // grass, tilled, planted, water
            moisture: 50,
            fertility: 80,
          });
        }
      }

      this.farm.layout.tiles = tiles;

      // Add starter buildings
      this.farm.buildings = [
        {
          id: 'house_1',
          type: 'house',
          x: 10,
          z: 10,
          level: 1,
          constructedAt: Date.now(),
        },
      ];

      // Initialize farm size if not set
      if (!this.farm.islandSize) {
        this.farm.islandSize = 50;
      }
      if (!this.farm.farmingArea) {
        this.farm.farmingArea = {
          startX: 5,
          endX: 15,
          startZ: 8,
          endZ: 23
        };
      }

      // Save to Firebase
      this.saveFarmData();
    },

    // Save farm data to Firebase - REFACTORED
    async saveFarmData() {
      if (!this.isAuthenticated || !this.userId) {
        this.saveLocalFarmData();
        return;
      }

      try {
        const userId = this.userId;

        // Save farm layout
        await farmService.saveFarmLayout(userId, this.farm);

        // Save resources
        await farmService.saveFarmResources(userId, this.resources);

        console.log('Farm data saved successfully to Firestore');
      } catch (error) {
        console.error('Error saving farm data:', error);
      }
    },

    // Plant a crop
    async plantCrop(x, z, cropType) {
      const tile = this.getTileAt(x, z);
      if (!tile || tile.type !== 'tilled') {
        return { success: false, message: 'Invalid tile for planting' };
      }

      // Check if player has seeds
      const seedKey = cropType.toLowerCase();
      if (!this.resources.seeds[seedKey] || this.resources.seeds[seedKey] <= 0) {
        return { success: false, message: 'No seeds available' };
      }

      // Create crop
      const crop = {
        id: `crop_${Date.now()}`,
        type: cropType,
        x,
        z,
        plantedAt: Date.now(),
        growth: 0,
        watered: false,
        fertilized: false,
        health: 100,
      };

      this.farm.crops.push(crop);
      this.resources.seeds[seedKey]--;
      tile.type = 'planted';

      await this.saveFarmData();
      return { success: true, crop };
    },

    // Water a crop
    async waterCrop(cropId) {
      const crop = this.farm.crops.find(c => c.id === cropId);
      if (!crop) return { success: false, message: 'Crop not found' };

      if (this.resources.items.water <= 0) {
        return { success: false, message: 'No water available' };
      }

      crop.watered = true;
      crop.lastWatered = Date.now();
      this.resources.items.water--;

      await this.saveFarmData();
      return { success: true };
    },

    // Harvest a crop
    async harvestCrop(cropId) {
      const cropIndex = this.farm.crops.findIndex(c => c.id === cropId);
      if (cropIndex === -1) return { success: false, message: 'Crop not found' };

      const crop = this.farm.crops[cropIndex];
      if (crop.growth < 100) {
        return { success: false, message: 'Crop not ready for harvest' };
      }

      // Calculate yield based on crop health and type
      const baseYield = {
        wheat: 10,
        corn: 8,
        berries: 15,
      };

      const harvestYield = Math.floor((baseYield[crop.type] || 5) * (crop.health / 100));

      // Add to inventory (simplified - just add currency)
      this.resources.currency += harvestYield * 10;

      // Remove crop and reset tile
      this.farm.crops.splice(cropIndex, 1);
      const tile = this.getTileAt(crop.x, crop.z);
      if (tile) tile.type = 'tilled';

      await this.saveFarmData();
      return { success: true, yield: harvestYield };
    },

    // Build a structure
    async buildStructure(type, x, z) {
      // Check if location is available
      if (this.getBuildingAt(x, z) || this.getCropAt(x, z)) {
        return { success: false, message: 'Location occupied' };
      }

      // Check cost
      const buildingCosts = {
        coop: 500,
        barn: 1000,
        field: 200,
        pond: 300,
      };

      const cost = buildingCosts[type] || 1000;
      if (this.resources.currency < cost) {
        return { success: false, message: 'Insufficient funds' };
      }

      // Create building
      const building = {
        id: `${type}_${Date.now()}`,
        type,
        x,
        z,
        level: 1,
        constructedAt: Date.now(),
      };

      this.farm.buildings.push(building);
      this.resources.currency -= cost;

      await this.saveFarmData();
      return { success: true, building };
    },

    // Move Pokemon to location - REFACTORED
    async movePokemon(pokemonId, location, x = null, z = null) {
      // Find Pokemon in all user Pokemon
      const pokemon = this.allUserPokemon.find(p => p.id === pokemonId);
      if (!pokemon) return { success: false, message: 'Pokemon not found' };

      // Update Pokemon data
      pokemon.location = location;
      if (x !== null) pokemon.x = x;
      if (z !== null) pokemon.z = z;

      // Update farm Pokemon list
      if (location === 'farm' || location === 'Farm') {
        // Add to farm if not already there
        if (!this.farmPokemon.find(p => p.id === pokemonId)) {
          this.farmPokemon.push(pokemon);
        }
      } else {
        // Remove from farm
        const index = this.farmPokemon.findIndex(p => p.id === pokemonId);
        if (index >= 0) {
          this.farmPokemon.splice(index, 1);
        }
      }

      // Save to Firebase
      if (this.isAuthenticated && this.userId) {
        try {
          await farmService.updatePokemonLocation(this.userId, pokemonId, location, x, z);
        } catch (error) {
          console.error('Error updating Pokemon location:', error);
          return { success: false, message: error.message };
        }
      }

      return { success: true };
    },

    // Update game time
    updateGameTime() {
      this.gameTime.minute += 10; // 10 minutes per tick

      if (this.gameTime.minute >= 60) {
        this.gameTime.minute = 0;
        this.gameTime.hour++;

        if (this.gameTime.hour >= 24) {
          this.gameTime.hour = 0;
          this.gameTime.day++;

          // Update season
          this.gameTime.season = this.getCurrentSeason;
        }
      }

      // Update weather randomly
      if (Math.random() < 0.1) {
        const weathers = ['sunny', 'cloudy', 'rainy', 'stormy'];
        this.gameTime.weather = weathers[Math.floor(Math.random() * weathers.length)];
      }
    },

    // Expand island size
    async expandIsland(expansionLevel) {
      const expansionCosts = {
        1: { cost: 1000, size: 60 },
        2: { cost: 2500, size: 70 },
        3: { cost: 5000, size: 80 },
        4: { cost: 10000, size: 90 },
        5: { cost: 20000, size: 100 }
      };

      const currentLevel = this.farm.expansions.length;
      const nextLevel = currentLevel + 1;
      
      if (!expansionCosts[nextLevel]) {
        return { success: false, message: 'Maximum island size reached' };
      }

      const expansion = expansionCosts[nextLevel];
      
      if (this.resources.currency < expansion.cost) {
        return { success: false, message: 'Insufficient funds' };
      }

      const expansionData = {
        id: `expansion_${Date.now()}`,
        level: nextLevel,
        cost: expansion.cost,
        newSize: expansion.size,
        purchasedAt: Date.now()
      };

      // Update island size
      this.farm.islandSize = expansion.size;
      
      // Expand farming area proportionally
      const expansionRatio = expansion.size / 50; // Base size is 50
      const centerX = 15;
      const centerZ = 15;
      const baseWidth = 10;
      const baseHeight = 15;
      
      this.farm.farmingArea = {
        startX: Math.floor(centerX - (baseWidth * expansionRatio) / 2),
        endX: Math.floor(centerX + (baseWidth * expansionRatio) / 2),
        startZ: Math.floor(centerZ - (baseHeight * expansionRatio) / 2),
        endZ: Math.floor(centerZ + (baseHeight * expansionRatio) / 2)
      };

      this.farm.expansions.push(expansionData);
      this.resources.currency -= expansion.cost;

      await this.saveFarmData();
      return { success: true, expansion: expansionData };
    },

    // Update crop growth
    updateCropGrowth() {
      const growthRate = {
        wheat: 5,
        corn: 3,
        berries: 7,
      };

      this.farm.crops.forEach(crop => {
        if (crop.growth < 100) {
          // Base growth
          let growth = growthRate[crop.type] || 5;

          // Modifiers
          if (crop.watered) growth *= 1.5;
          if (crop.fertilized) growth *= 1.3;
          if (this.gameTime.weather === 'rainy') growth *= 1.2;
          if (this.gameTime.weather === 'stormy') growth *= 0.8;

          crop.growth = Math.min(100, crop.growth + growth);

          // Reduce health if not watered
          if (!crop.watered) {
            crop.health = Math.max(0, crop.health - 2);
          }

          // Reset watered status
          crop.watered = false;
        }
      });
    },

    // Local storage fallback
    loadLocalFarmData() {
      const saved = localStorage.getItem('pokemonFarmData');
      if (saved) {
        const data = JSON.parse(saved);
        this.farm = data.farm || this.farm;
        this.resources = data.resources || this.resources;
        this.gameTime = data.gameTime || this.gameTime;
        this.allUserPokemon = data.allUserPokemon || [];
        this.farmPokemon = data.farmPokemon || [];
        
        // Ensure island size and farming area exist
        if (!this.farm.islandSize) {
          this.farm.islandSize = 50;
        }
        if (!this.farm.farmingArea) {
          this.farm.farmingArea = {
            startX: 5,
            endX: 15,
            startZ: 8,
            endZ: 23
          };
        }
      } else {
        this.initializeFarm();
        this.initializeLocalPokemon();
      }
    },
    
    // Initialize local Pokemon for testing
    initializeLocalPokemon() {
      this.allUserPokemon = [
        {
          id: 'pokemon_1',
          species: 25, // Pikachu
          nickname: 'Pikachu',
          level: 5,
          happiness: 80,
          hunger: 60,
          location: 'farm',
          x: -2,
          z: 2
        },
        {
          id: 'pokemon_2',
          species: 1, // Bulbasaur
          nickname: 'Bulbasaur',
          level: 3,
          happiness: 90,
          hunger: 40,
          location: 'farm',
          x: 0,
          z: 2
        },
        {
          id: 'pokemon_3',
          species: 7, // Squirtle
          nickname: 'Squirtle',
          level: 4,
          happiness: 70,
          hunger: 80,
          location: 'farm',
          x: 2,
          z: 2
        },
        {
          id: 'pokemon_4',
          species: 4, // Charmander
          nickname: 'Charmander',
          level: 3,
          happiness: 75,
          hunger: 50,
          location: 'PC'
        },
        {
          id: 'pokemon_5',
          species: 133, // Eevee
          nickname: 'Eevee',
          level: 2,
          happiness: 85,
          hunger: 45,
          location: 'PC'
        }
      ];
      
      this.farmPokemon = this.allUserPokemon.filter(p => p.location === 'farm' || p.location === 'Farm');
    },

    saveLocalFarmData() {
      localStorage.setItem(
        'pokemonFarmData',
        JSON.stringify({
          farm: this.farm,
          resources: this.resources,
          gameTime: this.gameTime,
          allUserPokemon: this.allUserPokemon,
          farmPokemon: this.farmPokemon,
          savedAt: Date.now(),
        })
      );
    },
  },
});
