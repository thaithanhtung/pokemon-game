import { defineStore } from 'pinia';
import { usePokemonStore } from './pokemon';
import { usePlayerStore } from './player';
import { useFirebase } from '@/composables/useFirebase';
import { authService } from '@/firebase/auth';
import type { Card, Battle } from '@/types';

interface TypeEffectiveness {
  weak: string[];
  strong: string[];
}

interface CardRarity {
  name: string;
  weight: number;
  color: string;
}

interface StatusEffect {
  damage?: number;
  skipTurn?: number;
  duration: number;
  icon: string;
}

interface BattleCard extends Card {
  hp?: number;
  currentHP?: number;
  attack: number;
  defense: number;
  speed: number;
  energy: number;
  maxEnergy: number;
  statusEffects: string[];
  canAttack: boolean;
  isExhausted: boolean;
}

interface BattleState {
  active: boolean;
  mode: 'campaign' | 'pvp' | 'ai' | null;
  turn: number;
  phase: 'draw' | 'main' | 'battle' | 'end';
  turnPlayer: 'player' | 'opponent';
  timeLeft: number;
  winner: string | null;
  rewards: {
    exp: number;
    gold: number;
    cards: Card[];
  } | null;
}

interface CardBattleState {
  isOnline: boolean;
  syncEnabled: boolean;
  player: {
    id: string;
    name: string;
    avatar: string;
    health: number;
    maxHealth: number;
    energy: number;
    maxEnergy: number;
    level: number;
    exp: number;
    cards: Card[];
    hand: BattleCard[];
    field: BattleCard[];
    graveyard: Card[];
    deck: Card[];
    activeDeck: string | null;
    decks: any[];
  };
  opponent: {
    id: string;
    name: string;
    avatar: string;
    health: number;
    maxHealth: number;
    energy: number;
    maxEnergy: number;
    level: number;
    hand: BattleCard[];
    field: BattleCard[];
    graveyard: Card[];
    deck: Card[];
    isAI: boolean;
  };
  battle: BattleState;
  shop: {
    isOpen: boolean;
    packs: any[];
    lastPurchase: any | null;
    packHistory: any[];
  };
  animations: {
    enabled: boolean;
    speed: number;
    queue: any[];
  };
  tutorial: {
    completed: boolean;
    step: number;
  };
}

const TYPE_EFFECTIVENESS: Record<string, TypeEffectiveness> = {
  fire: { weak: ['water', 'rock', 'ground'], strong: ['grass', 'bug', 'ice', 'steel'] },
  water: { weak: ['grass', 'electric'], strong: ['fire', 'rock', 'ground'] },
  grass: { weak: ['fire', 'ice', 'poison', 'flying', 'bug'], strong: ['water', 'rock', 'ground'] },
  electric: { weak: ['ground'], strong: ['water', 'flying'] },
  psychic: { weak: ['bug', 'ghost', 'dark'], strong: ['fighting', 'poison'] },
  ice: {
    weak: ['fire', 'fighting', 'rock', 'steel'],
    strong: ['grass', 'ground', 'flying', 'dragon'],
  },
  dragon: { weak: ['ice', 'dragon', 'fairy'], strong: ['dragon'] },
  dark: { weak: ['fighting', 'bug', 'fairy'], strong: ['psychic', 'ghost'] },
  fairy: { weak: ['poison', 'steel'], strong: ['fighting', 'dragon', 'dark'] },
  normal: { weak: ['fighting'], strong: [] },
  fighting: {
    weak: ['flying', 'psychic', 'fairy'],
    strong: ['normal', 'ice', 'rock', 'dark', 'steel'],
  },
  flying: { weak: ['electric', 'ice', 'rock'], strong: ['grass', 'fighting', 'bug'] },
  poison: { weak: ['ground', 'psychic'], strong: ['grass', 'fairy'] },
  ground: {
    weak: ['water', 'grass', 'ice'],
    strong: ['fire', 'electric', 'poison', 'rock', 'steel'],
  },
  rock: {
    weak: ['water', 'grass', 'fighting', 'ground', 'steel'],
    strong: ['fire', 'ice', 'flying', 'bug'],
  },
  bug: { weak: ['fire', 'flying', 'rock'], strong: ['grass', 'psychic', 'dark'] },
  ghost: { weak: ['ghost', 'dark'], strong: ['psychic', 'ghost'] },
  steel: { weak: ['fire', 'fighting', 'ground'], strong: ['ice', 'rock', 'fairy'] },
};

const CARD_RARITIES: Record<string, CardRarity> = {
  C: { name: 'Common', weight: 60, color: 'gray' },
  R: { name: 'Rare', weight: 30, color: 'blue' },
  E: { name: 'Epic', weight: 8, color: 'purple' },
  L: { name: 'Legendary', weight: 2, color: 'orange' },
};

const STATUS_EFFECTS: Record<string, StatusEffect> = {
  burn: { damage: 5, duration: 3, icon: '🔥' },
  poison: { damage: 3, duration: 5, icon: '☠️' },
  paralysis: { skipTurn: 0.5, duration: 2, icon: '⚡' },
  sleep: { skipTurn: 1, duration: 2, icon: '💤' },
  freeze: { skipTurn: 1, duration: 1, icon: '❄️' },
};

export const useCardBattleStore = defineStore('cardBattle', {
  state: (): any => ({
    // Firebase integration
    isOnline: true,
    syncEnabled: true,

    currentBattle: null,
    battleLog: [],

    // Card database moved to player store

    aiOpponents: [
      { id: 'ai1', name: 'Rookie Trainer', level: 1, difficulty: 'easy' },
      { id: 'ai2', name: 'Ace Trainer', level: 5, difficulty: 'medium' },
      { id: 'ai3', name: 'Elite Four', level: 10, difficulty: 'hard' },
    ],
  }),

  getters: {
    getCardById: () => cardId => {
      const playerStore = usePlayerStore();
      if (!playerStore.cardDatabase) return null;
      return playerStore.cardDatabase.find(card => card.id === cardId);
    },
    
    getPlayerActiveSkills: (state) => {
      if (!state.currentBattle?.player?.activePokemon?.skills) return [];
      const skills = state.currentBattle.player.activePokemon.skills;
      console.log('Getter - Player active skills:', skills);
      return skills;
    },

    getPlayerDeck: () => {
      const playerStore = usePlayerStore();
      if (!playerStore.player?.activeDeck) return [];
      const deck = playerStore.player.decks?.find(d => d.id === playerStore.player.activeDeck);
      if (!deck) return [];
      
      // Map deck card UIDs to actual card objects
      return deck.cards
        .map(cardUid => playerStore.player.cards.find(c => c.uid === cardUid))
        .filter(Boolean);
    },

    calculateTypeMultiplier: () => (attackerType, defenderType) => {
      const typeChart = TYPE_EFFECTIVENESS[attackerType];
      if (!typeChart) return 1;

      if (typeChart.strong.includes(defenderType)) return 1.5;
      if (typeChart.weak.includes(defenderType)) return 0.5;
      return 1;
    },
  },

  actions: {
    // Check authentication status
    isAuthenticated() {
      return this.firebase?.isAuthenticated?.value || false;
    },

    // Get current user info
    getCurrentUser() {
      return this.firebase?.user?.value || null;
    },

    // Firebase initialization
    initializeFirebase() {
      if (!this.firebase) {
        this.firebase = useFirebase();
        console.log('Firebase initialized in store:', !!this.firebase);

        // Manually start auth listener since onMounted doesn't work in Pinia store
        this.firebase.startAuthListener();
        console.log('Auth listener started manually from store');
      }
    },

    // Force initialize auth state
    forceInitializeAuthState() {
      console.log('forceInitializeAuthState called', !this.firebase);
      if (!this.firebase) {
        this.initializeFirebase();
      }

      // Force set initial values if they're undefined
      if (
        this.firebase.isAuthenticated &&
        typeof this.firebase.isAuthenticated.value !== 'undefined'
      ) {
        if (this.firebase.isAuthenticated.value === undefined) {
          this.firebase.isAuthenticated.value = false;
        }
      }
      if (this.firebase.isLoading && typeof this.firebase.isLoading.value !== 'undefined') {
        if (this.firebase.isLoading.value === undefined) {
          this.firebase.isLoading.value = true;
        }
      }
      if (this.firebase.user && typeof this.firebase.user.value !== 'undefined') {
        if (this.firebase.user.value === undefined) {
          this.firebase.user.value = null;
        }
      }

      console.log('Force initialized auth state:', {
        isAuthenticated: this.firebase.isAuthenticated?.value,
        isLoading: this.firebase.isLoading?.value,
        user: this.firebase.user?.value,
      });
    },

    // Cleanup auth listener
    cleanupAuthListener() {
      if (this.firebase?.unsubscribeAuth) {
        console.log('Cleaning up auth listener...');
        this.firebase.unsubscribeAuth();
        this.firebase.unsubscribeAuth = null;
      }
    },

    // Simple check if user is authenticated
    isUserAuthenticated() {
      try {
        const isAuth = this.firebase?.isAuthenticated?.value === true;
        console.log('isUserAuthenticated check:', {
          firebase: !!this.firebase,
          isAuthenticated: this.firebase?.isAuthenticated?.value,
          result: isAuth,
        });
        return isAuth;
      } catch (error) {
        console.error('Error checking authentication status:', error);
        return false;
      }
    },

    // Wait for authentication state to be ready
    async waitForAuth() {
      console.log('waitForAuth called');

      if (!this.firebase) {
        console.log('Firebase not initialized, initializing...');
        this.initializeFirebase();
      }

      // Force initialize auth state if values are undefined
      if (
        (this.firebase.isAuthenticated && this.firebase.isAuthenticated.value === undefined) ||
        (this.firebase.isLoading && this.firebase.isLoading.value === undefined)
      ) {
        console.log('Auth state undefined, force initializing...');
        this.forceInitializeAuthState();
      }

      // Wait for auth state to be loaded
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max

      while (attempts < maxAttempts) {
        // Check if Firebase is ready and auth state is defined
        if (
          this.firebase?.isAuthenticated !== undefined &&
          this.firebase?.isLoading !== undefined
        ) {
          const isAuth = this.firebase.isAuthenticated.value;
          const isLoading = this.firebase.isLoading.value;

          console.log('Auth state ready:', {
            isAuthenticated: isAuth,
            isLoading: isLoading,
            user: this.firebase.user?.value,
          });

          // Return true if authenticated, false if not authenticated and not loading
          return isAuth || (!isLoading && !isAuth);
        }

        // If auth listener hasn't started yet, wait a bit more
        if (this.firebase?.isAuthenticated === undefined && attempts === 0) {
          console.log('Auth state still undefined, waiting for useFirebase composable...');
        }

        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      console.warn('Auth state timeout after 5 seconds');
      return false;
    },

    // Save battle result to Firebase
    async saveBattleResult(result) {
      if (!this.firebase?.isAuthenticated.value || !this.syncEnabled) return;

      try {
        const battleData = {
          mode: this.currentBattle?.mode || 'story',
          result,
          playerTeam: this.currentBattle?.player?.bench || [],
          opponentTeam: this.currentBattle?.opponent?.bench || [],
          turnCount: this.currentBattle?.turnCount || 0,
          duration: Date.now() - (this.currentBattle?.startTime || Date.now()),
        };

        await this.firebase.saveBattleResult(battleData);
      } catch (error) {
        console.error('Error saving battle result:', error);
      }
    },

    async initializePlayer() {
      console.log('initializePlayer');

      // Initialize Firebase if not already done
      if (!this.firebase) {
        this.initializeFirebase();
      }

      // Ensure player card database is generated
      const playerStore = usePlayerStore();
      if (!playerStore.cardDatabase || playerStore.cardDatabase.length === 0) {
        await playerStore.generateCardDatabase();
      }

      // Wait for auth state to be ready
      const isAuthReady = await this.waitForAuth();

      if (isAuthReady && this.isUserAuthenticated()) {
        console.log('User authenticated, loading player data...');
        await playerStore.loadUserProfile();
      } else {
        console.log('User not authenticated, using default player data');
      }

      // Give starter pack if no cards
      if (!playerStore.player?.cards || playerStore.player.cards.length === 0) {
        this.giveStarterPack();
      }

      // Create starter deck if no decks
      if (!playerStore.player?.decks || playerStore.player.decks.length === 0) {
        this.createStarterDeck();
      }

      // Migrate existing Pokemon cards to ensure they have proper skills
      playerStore.migrateExistingPokemonCards();

      console.log('initializePlayer done');
    },

    // Database generation moved to player store

    determineRarity(pokemonId) {
      if (pokemonId >= 144 && pokemonId <= 151) return 'L'; // Legendary birds & Mewtwo/Mew
      if (pokemonId % 3 === 0 && pokemonId > 100) return 'E'; // Some evolved forms
      if (pokemonId % 3 === 0 || pokemonId > 50) return 'R'; // Some evolved forms
      return 'C';
    },

    generateStats(pokemon, rarity) {
      const baseStats = {
        C: { hp: 40, atk: 30, def: 25, spd: 35 },
        R: { hp: 60, atk: 45, def: 40, spd: 50 },
        E: { hp: 80, atk: 65, def: 55, spd: 70 },
        L: { hp: 100, atk: 90, def: 80, spd: 95 },
      };

      const stats = baseStats[rarity];
      const variance = () => Math.floor(Math.random() * 10) - 5;

      return {
        hp: stats.hp + variance(),
        atk: stats.atk + variance(),
        def: stats.def + variance(),
        spd: stats.spd + variance(),
      };
    },

    generatePokemonSkills(pokemon) {
      // Use the same skill generation from player store
      const playerStore = usePlayerStore();
      return playerStore.generatePokemonSkills(pokemon);
    },

    generateSkillCards() {
      const playerStore = usePlayerStore();
      playerStore.skillCards = [
        {
          id: 'skill_heal',
          name: 'Heal',
          type: 'skill',
          rarity: 'C',
          effect: { heal: 30 },
          energy: 2,
          description: 'Restore 30 HP to active Pokemon',
        },
        {
          id: 'skill_boost',
          name: 'Attack Boost',
          type: 'skill',
          rarity: 'R',
          effect: { boost: { atk: 10 } },
          energy: 1,
          description: 'Increase ATK by 10 for 3 turns',
        },
        {
          id: 'skill_shield',
          name: 'Protect',
          type: 'skill',
          rarity: 'R',
          effect: { shield: 20 },
          energy: 2,
          description: 'Block 20 damage next turn',
        },
        {
          id: 'skill_cleanse',
          name: 'Cleanse',
          type: 'skill',
          rarity: 'E',
          effect: { cleanse: true },
          energy: 1,
          description: 'Remove all status effects',
        },
      ];

      playerStore.cardDatabase.push(...playerStore.skillCards);
    },

    generateItemCards() {
      const playerStore = usePlayerStore();
      playerStore.itemCards = [
        {
          id: 'item_potion',
          name: 'Potion',
          type: 'item',
          rarity: 'C',
          effect: { heal: 20 },
          description: 'Restore 20 HP instantly',
        },
        {
          id: 'item_energy',
          name: 'Energy Crystal',
          type: 'item',
          rarity: 'R',
          effect: { energy: 2 },
          description: 'Gain 2 extra energy this turn',
        },
        {
          id: 'item_revive',
          name: 'Revive',
          type: 'item',
          rarity: 'E',
          effect: { revive: 50 },
          description: 'Revive fainted Pokemon with 50% HP',
        },
      ];

      playerStore.cardDatabase.push(...playerStore.itemCards);
    },

    giveStarterPack() {
      const playerStore = usePlayerStore();

      // Ensure card database is generated
      if (!playerStore.cardDatabase || playerStore.cardDatabase.length === 0) {
        console.log('Card database not initialized, generating...');
        playerStore.generateCardDatabase();
      }

      const starterCards = [
        'pokemon_1',   // Bulbasaur
        'pokemon_4',   // Charmander
        'pokemon_7',   // Squirtle
        'pokemon_25',  // Pikachu
        'pokemon_16',  // Pidgey
        'pokemon_19',  // Rattata
        'pokemon_10',  // Caterpie
        'pokemon_13',  // Weedle
        'skill_heal',
        'skill_heal',
        'skill_boost',
        'skill_shield',
        'item_potion',
        'item_potion',
        'item_potion',
        'item_energy',
        'item_energy',
      ];

      starterCards.forEach(cardId => {
        playerStore.addCardToCollection(cardId);
      });

      console.log('Starter pack given, player now has', playerStore.player.cards.length, 'cards');
    },

    createStarterDeck() {
      const playerStore = usePlayerStore();
      
      // Get actual card UIDs from player's collection
      const pokemonCards = playerStore.player.cards
        .filter(c => c.type === 'pokemon')
        .slice(0, 8) // Get first 8 Pokemon
        .map(c => c.uid);
      
      const skillCards = playerStore.player.cards
        .filter(c => c.type === 'skill')
        .slice(0, 4)
        .map(c => c.uid);
      
      const itemCards = playerStore.player.cards
        .filter(c => c.type === 'item')
        .slice(0, 4)
        .map(c => c.uid);
      
      const deck = {
        id: 'deck_1',
        name: 'Starter Deck',
        cards: [...pokemonCards, ...skillCards, ...itemCards],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      if (!playerStore.player.decks) {
        playerStore.player.decks = [];
      }
      playerStore.player.decks.push(deck);
      playerStore.player.activeDeck = deck.id;
    },

    getRandomCard() {
      const playerStore = usePlayerStore();
      const roll = Math.random() * 100;
      let rarity = 'C';

      if (roll < CARD_RARITIES.L.weight) rarity = 'L';
      else if (roll < CARD_RARITIES.L.weight + CARD_RARITIES.E.weight) rarity = 'E';
      else if (roll < CARD_RARITIES.L.weight + CARD_RARITIES.E.weight + CARD_RARITIES.R.weight)
        rarity = 'R';

      const eligibleCards = playerStore.cardDatabase.filter(c => c.rarity === rarity);

      if (eligibleCards.length === 0) {
        console.warn(`No cards found for rarity ${rarity}, falling back to any card`);
        const fallbackCards = playerStore.cardDatabase.filter(c => c && c.id);
        if (fallbackCards.length === 0) {
          console.error('No cards available in cardDatabase');
          return null;
        }
        return fallbackCards[Math.floor(Math.random() * fallbackCards.length)];
      }

      return eligibleCards[Math.floor(Math.random() * eligibleCards.length)];
    },

    startBattle(mode, opponentId = null) {
      const playerStore = usePlayerStore();

      // Ensure player has cards and a deck
      if (!playerStore.player?.cards || playerStore.player.cards.length === 0) {
        console.log('No cards in collection, giving starter pack');
        this.giveStarterPack();
      }

      if (!playerStore.player?.decks || playerStore.player.decks.length === 0) {
        console.log('No decks found, creating starter deck');
        this.createStarterDeck();
      }
      
      // Force migrate existing cards to ensure they have skills
      console.log('Running skill migration before battle...');
      playerStore.migrateExistingPokemonCards();

      // Get player deck - getPlayerDeck already returns card objects
      let playerDeck = this.getPlayerDeck;

      // If still no deck or empty deck, create a basic one from available cards
      if (playerDeck.length === 0) {
        console.log('Active deck is empty, creating temporary deck from available cards');
        const availablePokemon = (playerStore.player?.cards || [])
          .filter(c => c.type === 'pokemon')
          .slice(0, 6);
        const availableOther = (playerStore.player?.cards || [])
          .filter(c => c.type !== 'pokemon')
          .slice(0, 6);
        playerDeck = [...availablePokemon, ...availableOther];

        // If still no Pokemon cards, generate some basic ones
        if (availablePokemon.length === 0) {
          console.error('No Pokemon cards available, cannot start battle');
          return;
        }
      }

      const pokemonCards = playerDeck.filter(c => c.type === 'pokemon').map(card => {
        console.log('Loading Pokemon card for battle:', card.name, 'Skills:', card.skills);
        
        // If Pokemon has no skills or only one skill, generate them
        let skills = card.skills || [];
        console.log(`${card.name} current skills:`, skills);
        console.log(`${card.name} skills count: ${skills.length}`);
        
        if (skills.length <= 1) {
          console.log(`${card.name} has ${skills.length} skills, regenerating...`);
          console.log(`Card data:`, card);
          console.log(`Card pokemonType: ${card.pokemonType}, types array:`, card.types);
          
          // Use types array if available, otherwise fall back to single pokemonType
          let types = card.types || [card.pokemonType || 'normal'];
          
          // If we still only have one type, try to look up the Pokemon's full data
          if (types.length === 1 && card.pokemonId) {
            const fullPokemon = playerStore.cardDatabase.find(c => c.pokemonId === card.pokemonId);
            if (fullPokemon && fullPokemon.types && fullPokemon.types.length > 1) {
              types = [...fullPokemon.types];
              console.log(`Found full types for ${card.name}: ${types}`);
            }
          }
          
          const pokemonData = {
            id: card.pokemonId || 1,
            name: card.name,
            types: types
          };
          console.log(`Pokemon data for skill generation:`, pokemonData);
          skills = playerStore.generatePokemonSkills(pokemonData);
          console.log(`Generated ${skills.length} skills for ${card.name}:`, skills.map(s => s.name));
          
          // If still only one skill, force add more skills
          if (skills.length <= 1) {
            console.warn(`Still only ${skills.length} skills for ${card.name}, forcing additional skills`);
            // Add Quick Attack if not present
            if (!skills.some(s => s.id === 'quick_attack')) {
              const quickAttack = playerStore.getSkillById('quick_attack');
              if (quickAttack) skills.push({...quickAttack});
            }
            // Add a type-specific move
            const typeSkills = playerStore.getSkillsByType(types[0]);
            const extraSkill = typeSkills.find(s => !skills.some(existing => existing.id === s.id) && s.energy <= 3);
            if (extraSkill) skills.push({...extraSkill});
          }
        }
        
        // Validate skills before creating battle card
        const validSkills = skills.filter(s => s && s.id && s.name).map(s => ({...s}));
        console.log(`Valid skills for ${card.name}: ${validSkills.length}`);
        
        const battleCard = {
          ...card,
          hp: card.hp || 100,
          maxHp: card.maxHp || card.hp || 100,
          skills: validSkills, // Use validated skills
          atk: card.atk || 50,
          def: card.def || 40,
          spd: card.spd || 45
        };
        
        console.log(`Battle card created for ${battleCard.name} with ${battleCard.skills.length} skills`);
        console.log(`  Skills:`, battleCard.skills.map(s => ({ id: s.id, name: s.name, energy: s.energy })));
        return battleCard;
      });

      // Ensure we have at least one Pokemon
      if (pokemonCards.length === 0) {
        console.error('No Pokemon cards in deck, cannot start battle');
        return;
      }

      this.currentBattle = {
        mode,
        turn: 1,
        currentTurn: 'player',
        player: {
          activePokemon: pokemonCards[0],
          bench: pokemonCards.slice(1),
          hand: playerDeck.filter(c => c.type !== 'pokemon'),
          energy: 3,
          statusEffects: [],
        },
        opponent: this.generateOpponent(mode, opponentId),
        log: [],
        startTime: Date.now(),
        turnCount: 0,
      };

      // Debug: Log all Pokemon and their skills
      console.log('Battle Start - Active Pokemon:', this.currentBattle.player.activePokemon.name);
      console.log('  Skills array:', this.currentBattle.player.activePokemon.skills);
      console.log('  Skills count:', this.currentBattle.player.activePokemon.skills?.length);
      console.log('  Full active Pokemon data:', this.currentBattle.player.activePokemon);
      
      console.log('Battle Start - Bench Pokemon:');
      this.currentBattle.player.bench.forEach((p, i) => {
        console.log(`  Bench ${i}: ${p.name}`);
        console.log(`    Skills:`, p.skills);
        console.log(`    Skills count:`, p.skills?.length);
      });

      this.battleLog = [];
      this.addBattleLog('Battle started!');
    },

    generateOpponent(mode, opponentId) {
      if (mode === 'story' || mode === 'pvp') {
        const opponent = this.aiOpponents[0]; // Start with easy
        const deck = this.generateAIDeck(opponent.difficulty);
        const pokemonCards = deck.filter(c => c.type === 'pokemon').map(card => {
          console.log('Loading AI Pokemon:', card.name, 'Skills:', card.skills);
          
          // If Pokemon has no skills or only one skill, generate them
          let skills = card.skills || [];
          if (skills.length <= 1) {
            console.log(`No skills for AI ${card.name}, generating...`);
            
            // Use types array if available, otherwise fall back to single pokemonType
            let types = card.types || [card.pokemonType || 'normal'];
            
            const pokemonData = {
              id: card.pokemonId || 1,
              name: card.name,
              types: types
            };
            const playerStore = usePlayerStore();
            skills = playerStore.generatePokemonSkills(pokemonData);
            console.log(`Generated ${skills.length} skills for AI ${card.name}`);
          }
          
          const battleCard = {
            ...card,
            hp: card.hp || 100,
            maxHp: card.maxHp || card.hp || 100,
            skills: skills.map(s => ({...s})), // Deep copy skills to prevent mutation
            atk: card.atk || 50,
            def: card.def || 40,
            spd: card.spd || 45
          };
          
          console.log(`AI battle card created for ${battleCard.name} with ${battleCard.skills.length} skills`);
          return battleCard;
        });

        return {
          ...opponent,
          activePokemon: pokemonCards[0],
          bench: pokemonCards.slice(1),
          hand: deck.filter(c => c.type !== 'pokemon'),
          energy: 3,
          statusEffects: [],
        };
      }

      // Real PvP would load opponent data
      return null;
    },

    generateAIDeck(difficulty) {
      // Build an AI deck with a guaranteed number of Pokemon
      const deckSize = 12;
      const minPokemon = 4; // ensure enough bench to switch
      const maxPokemon = 6;
      const numPokemon = Math.min(
        maxPokemon,
        Math.max(minPokemon, Math.floor(3 + Math.random() * 3))
      );

      const playerStore = usePlayerStore();
      const pokemonPool = playerStore.cardDatabase.filter(c => c.type === 'pokemon');
      const nonPokemonPool = playerStore.cardDatabase.filter(c => c.type !== 'pokemon');

      // Helper to pick random unique cards from a pool
      const pickUnique = (pool, count) => {
        const chosen = [];
        const used = new Set();
        while (chosen.length < count && used.size < pool.length) {
          const idx = Math.floor(Math.random() * pool.length);
          if (used.has(idx)) continue;
          used.add(idx);
          chosen.push(pool[idx]);
        }
        return chosen;
      };

      const pokemonCards = pickUnique(pokemonPool, numPokemon);
      const remaining = deckSize - pokemonCards.length;
      const supportCards = pickUnique(nonPokemonPool, remaining);

      return [...pokemonCards, ...supportCards];
    },

    executePlayerAction(action) {
      console.log('=== EXECUTE PLAYER ACTION START ===');
      console.log('Action:', action);
      
      if (!this.currentBattle) {
        console.error('No current battle!');
        return;
      }
      
      // Check if a Pokemon switch is required
      if (this.currentBattle.requiresSwitch) {
        if (action.type !== 'switch') {
          this.addBattleLog('You must choose a Pokemon to send out!');
          return;
        }
      }
      
      if (this.currentBattle.currentTurn !== 'player') {
        console.log('Not player turn, skipping');
        return;
      }

      const battle = this.currentBattle;

      switch (action.type) {
        case 'attack':
          this.executeAttack('player', action.skill);
          break;
        case 'useItem':
          this.useItem('player', action.item);
          break;
        case 'useSkill':
          this.useSkillCard('player', action.skill);
          break;
        case 'switch':
          this.switchPokemon('player', action.pokemon);
          // Don't return early - switching counts as a turn
          break;
      }

      this.checkBattleEnd();

      // SIMPLIFIED AI TURN - Execute immediately after player
      // Switch action also triggers AI turn (switching costs a turn)
      if (!this.currentBattle.ended && this.currentBattle.opponent.activePokemon.hp > 0) {
        console.log('Player turn complete, AI will counter-attack');
        
        // Execute AI attack immediately
        this.aiCounterAttack();
      }
    },
    
    // New simplified AI counter-attack method
    aiCounterAttack() {
      console.log('=== AI COUNTER ATTACK ===');
      
      if (!this.currentBattle || this.currentBattle.ended) {
        console.log('No battle or battle ended');
        return;
      }
      
      const ai = this.currentBattle.opponent;
      const player = this.currentBattle.player;
      
      if (!ai.activePokemon || ai.activePokemon.hp <= 0) {
        console.log('AI Pokemon fainted');
        return;
      }
      
      if (!player.activePokemon || player.activePokemon.hp <= 0) {
        console.log('Player Pokemon fainted');
        return;
      }
      
      // Select a skill for AI to use
      const availableSkills = ai.activePokemon.skills || [];
      console.log('AI available skills:', availableSkills.map(s => s.name));
      
      let selectedSkill = null;
      if (availableSkills.length > 0) {
        // Filter skills by energy cost
        const affordableSkills = availableSkills.filter(skill => 
          (skill.energy || 1) <= ai.energy
        );
        
        if (affordableSkills.length > 0) {
          // Pick a random affordable skill
          selectedSkill = affordableSkills[Math.floor(Math.random() * affordableSkills.length)];
        } else {
          // Use basic attack if no affordable skills
          selectedSkill = availableSkills.find(s => s.id === 'tackle') || availableSkills[0];
        }
      }
      
      // Fallback to basic attack
      if (!selectedSkill) {
        selectedSkill = {
          id: 'tackle',
          name: 'Tackle',
          power: 40,
          damage: 40,
          energy: 1,
          element: 'normal'
        };
      }
      
      console.log('AI selected skill:', selectedSkill.name);
      
      // Use the existing executeAttack method for consistent damage calculation
      this.executeAttack('opponent', selectedSkill);
      
      // Check if player Pokemon fainted
      this.checkBattleEnd();
      
      // Restore energy for both sides
      this.currentBattle.player.energy = Math.min(5, this.currentBattle.player.energy + 2);
      this.currentBattle.opponent.energy = Math.min(5, this.currentBattle.opponent.energy + 2);
      
      // Set turn back to player
      this.currentBattle.currentTurn = 'player';
      this.currentBattle.turn++;
      
      console.log('AI attack complete, turn:', this.currentBattle.turn);
    },

    executeAttack(attacker, skill) {
      console.log(`executeAttack called by ${attacker} with skill:`, skill);
      const battle = this.currentBattle;
      if (!battle) {
        console.error('No current battle in executeAttack');
        return;
      }
      
      const source = battle[attacker];
      const target = battle[attacker === 'player' ? 'opponent' : 'player'];
      
      if (!source || !target) {
        console.error('Invalid source or target', { source, target });
        return;
      }

      // Ensure skill has required properties
      if (!skill || !skill.name) {
        console.error('Invalid skill object:', skill);
        return;
      }
      
      const skillEnergy = skill.energy || 1;
      console.log(`${attacker} attempting attack with ${skill.name}, energy: ${source.energy}/${skillEnergy}`);
      
      if (source.energy < skillEnergy) {
        this.addBattleLog(`${attacker === 'player' ? 'You don\'t' : 'Opponent doesn\'t'} have enough energy!`);
        console.log('Attack failed - not enough energy');
        return;
      }

      source.energy -= skillEnergy;

      const typeMultiplier = skill.element
        ? this.calculateTypeMultiplier(skill.element, target.activePokemon.pokemonType)
        : 1;

      const baseDamage = skill.damage || skill.power || 50;
      const attackStat = source.activePokemon.atk || 50;
      const defenseStat = target.activePokemon.def || 40;
      
      // Use balanced damage formula to prevent one-hit KOs
      let damage = Math.floor((baseDamage * 0.4 + (attackStat - defenseStat) * 0.5) * typeMultiplier);
      
      // Ensure minimum damage
      damage = Math.max(5, damage);
      
      // Cap damage to prevent one-hit KOs (max 40% of target's max HP)
      const maxDamage = Math.floor((target.activePokemon.maxHp || target.activePokemon.hp || 100) * 0.4);
      damage = Math.min(damage, maxDamage);
      
      console.log(`Damage calculation: base=${baseDamage}, atk=${attackStat}, def=${defenseStat}, type=${typeMultiplier}, final=${damage}`);

      target.activePokemon.hp -= damage;
      if (target.activePokemon.hp < 0) target.activePokemon.hp = 0;

      this.addBattleLog(`${source.activePokemon.name} used ${skill.name} for ${damage} damage!`);
      console.log(`${attacker} dealt ${damage} damage. Target HP: ${target.activePokemon.hp}/${target.activePokemon.maxHp}`);

      if (typeMultiplier > 1) {
        this.addBattleLog('Super effective!');
      } else if (typeMultiplier < 1) {
        this.addBattleLog('Not very effective...');
      }

      // Trigger animations on attack/hit, carry element type if any
      const now = Date.now();
      const elem = skill.element || source.activePokemon.pokemonType || null;
      source.activePokemon.anim = { type: 'attack', ts: now, element: elem };
      target.activePokemon.anim = { type: 'hit', ts: now, element: elem };
      setTimeout(() => {
        if (source.activePokemon?.anim?.ts === now && source.activePokemon.anim.type === 'attack') {
          source.activePokemon.anim = null;
        }
        if (target.activePokemon?.anim?.ts === now && target.activePokemon.anim.type === 'hit') {
          target.activePokemon.anim = null;
        }
      }, 600);
    },

    // Keep old executeAITurn for compatibility but redirect to new method
    executeAITurn() {
      console.log('executeAITurn called - redirecting to aiCounterAttack');
      this.aiCounterAttack();
    },

    checkBattleEnd() {
      const battle = this.currentBattle;

      if (battle.opponent.activePokemon.hp <= 0) {
        if (battle.opponent.bench.length === 0) {
          this.endBattle('victory');
        } else {
          // Delay switch to allow impact animation to show
          const next = battle.opponent.bench[0];
          setTimeout(() => {
            if (this.currentBattle && this.currentBattle === battle) {
              battle.opponent.activePokemon = battle.opponent.bench.shift();
              this.addBattleLog(`Opponent sent out ${next.name}!`);
            }
          }, 700);
        }
      }

      if (battle.player.activePokemon.hp <= 0) {
        if (battle.player.bench.length === 0) {
          this.endBattle('defeat');
        } else {
          // Set battle state to require Pokemon switch
          battle.requiresSwitch = true;
          battle.switchingSide = 'player';
          this.addBattleLog(`${battle.player.activePokemon.name} fainted! Choose a Pokemon to send out!`);
        }
      }
    },

    endBattle(result) {
      this.currentBattle.ended = true;
      this.currentBattle.result = result;

      const playerStore = usePlayerStore();

      if (result === 'victory') {
        playerStore.player.wins++;
        playerStore.player.energy += 50;
        playerStore.player.exp += 100;
        this.addBattleLog('Victory! You earned 50 energy and 100 EXP!');

        // Check level up
        if (playerStore.player.exp >= playerStore.player.level * 200) {
          playerStore.player.level++;
          playerStore.player.gems += 10;
          this.addBattleLog(`Level up! You're now level ${playerStore.player.level}!`);
        }
      } else {
        playerStore.player.losses++;
        this.addBattleLog('Defeat... Try again!');
      }

      // Save battle result to Firebase
      this.saveBattleResult(result);

      // Update player data in Firebase
      playerStore.updateUserData({
        wins: playerStore.player.wins,
        losses: playerStore.player.losses,
        energy: playerStore.player.energy,
        exp: playerStore.player.exp,
        level: playerStore.player.level,
        gems: playerStore.player.gems,
      });
    },

    addBattleLog(message) {
      this.battleLog.push({
        message,
        timestamp: Date.now(),
      });
      console.log('Battle Log:', message);
    },
    
    // Debug function to test AI attack
    testAIAttack() {
      console.log('=== TEST AI ATTACK ===');
      if (!this.currentBattle) {
        console.error('No battle active');
        return;
      }
      
      console.log('Forcing AI turn...');
      this.currentBattle.currentTurn = 'opponent';
      this.executeAITurn();
    },

    switchPokemon(side, pokemon) {
      const battle = this.currentBattle[side];
      const index = battle.bench.findIndex(p => p.uid === pokemon.uid);

      if (index !== -1) {
        const temp = battle.activePokemon;
        battle.activePokemon = battle.bench[index];
        
        // Only add fainted Pokemon back to bench if it still has HP
        if (temp.hp > 0) {
          battle.bench[index] = temp;
        } else {
          // Remove the selected Pokemon from bench since fainted Pokemon was replaced
          battle.bench.splice(index, 1);
        }

        console.log('Manual switch - Active Pokemon:', battle.activePokemon.name, 'Skills:', battle.activePokemon.skills);
        console.log('Manual switch - Benched Pokemon:', temp.name, 'Skills:', temp.skills);

        this.addBattleLog(
          `${side === 'player' ? 'You' : 'Opponent'} switched to ${battle.activePokemon.name}!`
        );
        
        // Clear the switch requirement flag if this was a forced switch
        if (this.currentBattle.requiresSwitch && this.currentBattle.switchingSide === side) {
          this.currentBattle.requiresSwitch = false;
          this.currentBattle.switchingSide = null;
          
          // For forced switches due to fainting, immediately trigger opponent's turn
          if (side === 'player') {
            this.currentBattle.currentTurn = 'opponent';
            // Trigger AI turn after a short delay
            setTimeout(() => {
              if (this.currentBattle && !this.currentBattle.ended) {
                this.aiCounterAttack();
              }
            }, 1000);
          }
        } else {
          // This was a voluntary switch - it counts as the player's turn
          // The AI turn will be triggered by executePlayerAction
          console.log('Voluntary switch completed');
        }
      }
    },

    useItem(side, item) {
      const actor = this.currentBattle[side];
      const target = actor.activePokemon;

      if (item.effect?.heal) {
        const before = target.hp;
        target.hp = Math.min(target.maxHp || target.hp, target.hp + item.effect.heal);
        this.addBattleLog(
          `${side === 'player' ? 'You' : 'Opponent'} used ${item.name} and healed ${
            target.hp - before
          } HP!`
        );

        const now = Date.now();
        target.anim = { type: 'heal', ts: now };
        setTimeout(() => {
          if (target?.anim?.ts === now && target.anim.type === 'heal') {
            target.anim = null;
          }
        }, 600);
      }

      if (item.effect?.energy) {
        actor.energy += item.effect.energy;
        this.addBattleLog(
          `${side === 'player' ? 'You' : 'Opponent'} gained ${item.effect.energy}⚡ energy!`
        );
      }

      if (item.effect?.revive) {
        // Revive only if fainted
        if (target.hp <= 0) {
          target.hp = Math.floor(((target.maxHp || 100) * item.effect.revive) / 100);
          this.addBattleLog(
            `${side === 'player' ? 'You' : 'Opponent'} revived ${target.name} to ${target.hp} HP!`
          );

          const now = Date.now();
          target.anim = { type: 'heal', ts: now };
          setTimeout(() => {
            if (target?.anim?.ts === now && target.anim.type === 'heal') {
              target.anim = null;
            }
          }, 600);
        }
      }

      // Remove item from hand if player used
      if (side === 'player') {
        const handIndex = this.currentBattle.player.hand.findIndex(c => c.uid === item.uid);
        if (handIndex !== -1) this.currentBattle.player.hand.splice(handIndex, 1);
      }
    },

    useSkillCard(side, skill) {
      const actor = this.currentBattle[side];
      const opponent = this.currentBattle[side === 'player' ? 'opponent' : 'player'];

      // Energy check
      if (typeof skill.energy === 'number') {
        if (actor.energy < skill.energy) {
          this.addBattleLog(`${side === 'player' ? 'You' : 'Opponent'} lack energy to use skill.`);
          return;
        }
        actor.energy -= skill.energy;
      }

      // Apply common skill effects
      const target = actor.activePokemon;
      if (skill.name === 'Heal' || skill.effect?.heal) {
        const amount = skill.effect?.heal || 30;
        const before = target.hp;
        target.hp = Math.min(target.maxHp || target.hp, target.hp + amount);
        this.addBattleLog(
          `${side === 'player' ? 'You' : 'Opponent'} used ${skill.name} and healed ${
            target.hp - before
          } HP!`
        );

        const now = Date.now();
        target.anim = { type: 'heal', ts: now };
        setTimeout(() => {
          if (target?.anim?.ts === now && target.anim.type === 'heal') {
            target.anim = null;
          }
        }, 600);
      } else if (skill.name === 'Attack Boost' || skill.effect?.boost?.atk) {
        const inc = skill.effect?.boost?.atk || 10;
        target.atk += inc;
        this.addBattleLog(
          `${side === 'player' ? 'You' : 'Opponent'} used ${skill.name}, ATK +${inc}!`
        );
      } else if (skill.name === 'Protect' || skill.effect?.shield) {
        const shield = skill.effect?.shield || 20;
        target.def += shield;
        this.addBattleLog(
          `${side === 'player' ? 'You' : 'Opponent'} used ${skill.name}, DEF +${shield} (this turn)!`
        );
      } else if (skill.name === 'Cleanse' || skill.effect?.cleanse) {
        actor.statusEffects = [];
        this.addBattleLog(
          `${side === 'player' ? 'You' : 'Opponent'} used ${skill.name}, cleansed!`
        );
      } else {
        // Fallback: treat as an attack card if damage present
        if (skill.damage) {
          this.executeAttack(side, skill);
        } else {
          this.addBattleLog(`${skill.name} had no effect.`);
        }
      }

      // Remove skill card from hand if player used
      if (side === 'player') {
        const handIndex = this.currentBattle.player.hand.findIndex(c => c.uid === skill.uid);
        if (handIndex !== -1) this.currentBattle.player.hand.splice(handIndex, 1);
      }
    },
  },
});
