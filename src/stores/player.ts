import { defineStore } from 'pinia';
import { useFirebase } from '@/composables/useFirebase';
import { usePokemonStore } from './pokemon';
import type { Card, Deck } from '@/types';
import type { Skill, SkillElement } from '@/types/skills';
import { getSkillById, getSkillsByType } from '@/types/skills';

interface CardRarity {
  name: string;
  weight: number;
  color: string;
}

const CARD_RARITIES: Record<string, CardRarity> = {
  C: { name: 'Common', weight: 60, color: 'gray' },
  R: { name: 'Rare', weight: 30, color: 'blue' },
  E: { name: 'Epic', weight: 8, color: 'purple' },
  L: { name: 'Legendary', weight: 2, color: 'orange' },
};

interface Player {
  id: string;
  name: string;
  level: number;
  exp: number;
  energy: number;
  gems: number;
  cards: Card[];
  decks: Deck[];
  activeDeck: string | null;
  storyProgress: {
    chapter: number;
    stage: number;
  };
  pvpRank: string;
  wins: number;
  losses: number;
}

interface PlayerState {
  loaded: boolean;
  player: Player;
  isAuthenticated: boolean;
  cardDatabase: any[];
  skillCards: any[];
  itemCards: any[];
}

export const usePlayerStore = defineStore('player', {
  state: (): PlayerState => ({
    loaded: false,
    player: {
      id: 'player1',
      name: 'Trainer',
      level: 1,
      exp: 0,
      energy: 500,
      gems: 500,
      cards: [],
      decks: [],
      activeDeck: null,
      storyProgress: { chapter: 1, stage: 1 },
      pvpRank: 'Bronze',
      wins: 0,
      losses: 0,
    },
    isAuthenticated: false,
    // Card database managed by player store
    cardDatabase: [],
    skillCards: [],
    itemCards: [],
  }),

  actions: {
    getFirebase() {
      // Always use the same Firebase instance
      return useFirebase();
    },

    async ensureAuthReady() {
      const firebase = this.getFirebase();
      // Reuse cardBattle waitForAuth pattern lightly: poll composable state
      let attempts = 0;
      const maxAttempts = 100;
      console.log('ensureAuthReady called', firebase?.isAuthenticated?.value);
      while (attempts < maxAttempts) {
        const isAuth = firebase?.isAuthenticated?.value;
        const isLoading = firebase?.isLoading?.value;

        // If auth state is defined and loading is complete
        if (typeof isAuth !== 'undefined' && typeof isLoading !== 'undefined' && !isLoading) {
          console.log('Auth state ready:', { isAuth, isLoading });
          return isAuth === true;
        }

        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }

      console.warn('ensureAuthReady timeout after', maxAttempts * 100, 'ms');
      // If we timeout but firebase is initialized, check one more time
      const firebaseInstance = this.getFirebase();
      if (firebaseInstance?.isAuthenticated?.value === true) {
        console.log('Auth detected after timeout');
        return true;
      }

      return false;
    },

    // Load user profile once after login and cache in Pinia
    // Note: This is now handled automatically by startAuthListener in useFirebase.js
    async loadUserProfile() {
      console.log('loadUserProfile called - data should already be loaded by auth listener');
      return this.loaded;
    },

    // Update user data in Firestore, then cache in Pinia
    async updateUserData(updates) {
      await this.ensureAuthReady();
      const firebase = this.getFirebase();
      try {
        const success = await firebase.saveUserData({
          ...this.player,
          ...updates,
        });
        if (success) {
          this.player = { ...this.player, ...updates };
          return true;
        }
        return false;
      } catch (e) {
        console.error('PlayerStore: Error updating user data', e);
        return false;
      }
    },

    getPlayerDebug() {
      return {
        id: this.player.id,
        name: this.player.name,
        level: this.player.level,
        exp: this.player.exp,
        energy: this.player.energy,
        gems: this.player.gems,
        cardsCount: this.player.cards.length,
        decksCount: this.player.decks.length,
      };
    },

    // Pack-related methods
    async getPackHistory() {
      const firebase = this.getFirebase();

      const isAuthReady = await this.ensureAuthReady();
      console.log('isAuthReady', isAuthReady);
      if (!isAuthReady) {
        console.log('User not authenticated, returning empty pack history');
        return [];
      }

      try {
        console.log('Loading pack history from Firestore...');
        const history = await firebase.getPackHistory();
        console.log('Pack history loaded:', history);
        return history;
      } catch (error) {
        console.error('Error loading pack history:', error);
        return [];
      }
    },

    async getRecentPacks() {
      const isAuthReady = await this.ensureAuthReady();
      if (!isAuthReady) {
        return [];
      }

      const history = await this.getPackHistory();
      return history.slice(0, 10);
    },

    async getPackStats() {
      try {
        console.log('getPackStats');
        const firebase = this.getFirebase();
        return await firebase.getPackStats();
      } catch (error) {
        console.error('Error getting pack stats:', error);
        return {
          totalPacks: 0,
          basicPacks: 0,
          premiumPacks: 0,
          legendaryPacks: 0,
          totalCards: 0,
          legendaryCards: 0,
          epicCards: 0,
          rareCards: 0,
          commonCards: 0,
        };
      }
    },

    async buyPack(packType) {
      const firebase = this.getFirebase();

      // Ensure card database is initialized
      if (!this.cardDatabase || this.cardDatabase.length === 0) {
        console.log('Card database empty, generating...');
        await this.generateCardDatabase();
      }

      // Wait for authentication state to be ready
      const isAuthReady = await this.ensureAuthReady();
      console.log('Auth ready for pack opening:', isAuthReady);
      console.log('Current auth state:', {
        isAuthenticated: firebase?.isAuthenticated?.value,
        isLoading: firebase?.isLoading?.value,
        user: firebase?.user?.value?.uid,
      });

      // Validate card database
      if (!this.cardDatabase || this.cardDatabase.length === 0) {
        console.error('Card database not initialized');
        return [];
      }

      const packConfigs = {
        basic: {
          cards: 5,
          guaranteedRarity: 'R',
          cost: { energy: 100 },
        },
        premium: {
          cards: 8,
          guaranteedRarity: 'E',
          cost: { gems: 50 },
        },
        legendary: {
          cards: 10,
          guaranteedRarity: 'L',
          cost: { gems: 100 },
        },
      };

      const config = packConfigs[packType];

      if (!config) {
        console.error('Invalid pack type:', packType);
        return [];
      }

      // Check if player has enough resources
      if (config.cost.energy && this.player.energy < config.cost.energy) {
        console.error(
          'Not enough energy to buy pack. Required:',
          config.cost.energy,
          'Available:',
          this.player.energy
        );
        return [];
      }
      if (config.cost.gems && this.player.gems < config.cost.gems) {
        console.error(
          'Not enough gems to buy pack. Required:',
          config.cost.gems,
          'Available:',
          this.player.gems
        );
        return [];
      }

      // Deduct cost
      if (config.cost.energy) {
        this.player.energy -= config.cost.energy;
        console.log('Energy deducted:', config.cost.energy, 'Remaining:', this.player.energy);
      }
      if (config.cost.gems) {
        this.player.gems -= config.cost.gems;
        console.log('Gems deducted:', config.cost.gems, 'Remaining:', this.player.gems);
      }

      // Generate cards
      const cards = [];

      // Add guaranteed rarity card
      const guaranteedCards = this.cardDatabase.filter(c => c.rarity === config.guaranteedRarity);
      if (guaranteedCards.length > 0) {
        cards.push(guaranteedCards[Math.floor(Math.random() * guaranteedCards.length)]);
      }

      // Fill rest with weighted random cards
      while (cards.length < config.cards) {
        const randomCard = this.getRandomCard(this.cardDatabase);
        if (randomCard) {
          cards.push(randomCard);
        } else {
          console.error('Failed to get random card, stopping pack generation');
          break;
        }
      }

      console.log('cards', cards);

      // Filter out any null/undefined cards
      const validCards = cards.filter(card => card && card.id);

      if (validCards.length === 0) {
        console.error('No valid cards generated for pack');
        return [];
      }

      // Add to collection
      validCards.forEach(card => this.addCardToCollection(card.id));

      // Save pack history to Firestore only
      const packRecord = {
        id: `pack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: packType,
        timestamp: Date.now(),
        cards: validCards.map(card => {
          // Filter out undefined values to prevent Firebase error
          const cardData = {
            id: card.id,
            name: card.name,
            rarity: card.rarity,
            type: card.type,
            element: card.element,
          };

          // Remove any undefined fields
          return Object.fromEntries(
            Object.entries(cardData).filter(([key, value]) => value !== undefined)
          );
        }),
        cost: config.cost,
      };

      // Save to Firestore - check auth state directly
      const currentAuthState = firebase?.isAuthenticated?.value;
      console.log('Checking auth before save:', { isAuthReady, currentAuthState });

      if (isAuthReady || currentAuthState === true) {
        // Filter out undefined values from packRecord to prevent Firebase error
        const cleanPackRecord = Object.fromEntries(
          Object.entries(packRecord).filter(([key, value]) => value !== undefined)
        );

        try {
          // Save pack history to Firestore
          await firebase.addPackToHistory(cleanPackRecord);

          // Save cards to user collection
          await firebase.addCardsFromPack(validCards, packType);

          // Update player data in database (energy/gems deducted)
          await this.updateUserData({
            energy: this.player.energy,
            gems: this.player.gems,
          });

          console.log('Pack opened and saved to Firestore:', packType, packRecord.id);
        } catch (error) {
          console.error('Error saving pack to Firestore:', error);
        }
      } else {
        console.warn('User not authenticated, pack not saved to Firestore', {
          isAuthReady,
          currentAuthState,
          firebase: !!firebase,
        });

        // Try to save to Firestore after a short delay (in case auth is still loading)
        setTimeout(async () => {
          const retryAuthReady = await this.ensureAuthReady();
          if (retryAuthReady) {
            console.log('Retrying Firestore save after delay...');
            const retryFirebase = this.getFirebase();
            try {
              // Re-create cleanPackRecord for retry
              const cleanPackRecord = Object.fromEntries(
                Object.entries(packRecord).filter(([key, value]) => value !== undefined)
              );
              await retryFirebase.addPackToHistory(cleanPackRecord);
              await retryFirebase.addCardsFromPack(validCards, packType);

              // Update player data in database (energy/gems deducted)
              await this.updateUserData({
                energy: this.player.energy,
                gems: this.player.gems,
              });

              console.log('Pack saved to Firestore on retry:', packType, packRecord.id);
            } catch (error) {
              console.error('Error saving pack on retry:', error);
            }
          }
        }, 1000);
      }

      return validCards;
    },

    getRandomCard(cardDatabase) {
      const roll = Math.random() * 100;
      let rarity = 'C';

      if (roll < CARD_RARITIES.L.weight) rarity = 'L';
      else if (roll < CARD_RARITIES.L.weight + CARD_RARITIES.E.weight) rarity = 'E';
      else if (roll < CARD_RARITIES.L.weight + CARD_RARITIES.E.weight + CARD_RARITIES.R.weight)
        rarity = 'R';

      const eligibleCards = cardDatabase.filter(c => c.rarity === rarity);

      if (eligibleCards.length === 0) {
        console.warn(`No cards found for rarity ${rarity}, falling back to any card`);
        const fallbackCards = cardDatabase.filter(c => c && c.id);
        if (fallbackCards.length === 0) {
          console.error('No cards available in cardDatabase');
          return null;
        }
        return fallbackCards[Math.floor(Math.random() * fallbackCards.length)];
      }

      return eligibleCards[Math.floor(Math.random() * eligibleCards.length)];
    },

    addCardToCollection(cardId) {
      const card = this.getCardById(cardId);
      if (card) {
        // Deep copy the card to ensure all properties including skills are copied
        const newCard = {
          ...card,
          uid: `${cardId}_${Date.now()}_${Math.random()}`,
          level: card.level || 1,
          skills: card.skills ? [...card.skills] : [], // Ensure skills array is copied
          types: card.types ? [...card.types] : undefined, // Copy types array if it exists
        };
        
        // Add type and stats if missing
        if (card.type === 'pokemon' && !newCard.pokemonType && card.pokemonType) {
          newCard.pokemonType = card.pokemonType;
        }
        
        // Ensure types array exists for Pokemon cards
        if (card.type === 'pokemon' && !newCard.types) {
          newCard.types = [newCard.pokemonType || 'normal'];
        }
        
        // If it's a Pokemon card and has no skills, generate them
        if (card.type === 'pokemon' && (!newCard.skills || newCard.skills.length === 0)) {
          console.log(`Generating skills for ${newCard.name} as it has none`);
          // Create a pokemon object with the required structure for skill generation
          // Use types array if available, otherwise fall back to single pokemonType
          let types = newCard.types || [newCard.pokemonType || 'normal'];
          
          const pokemonData = {
            id: newCard.pokemonId || parseInt(cardId.split('_')[1]) || 1,
            name: newCard.name,
            types: types
          };
          console.log('Creating pokemonData for skill generation:', pokemonData);
          newCard.skills = this.generatePokemonSkills(pokemonData);
          console.log(`Generated ${newCard.skills.length} skills for ${newCard.name}`);
        }
        
        this.player.cards.push(newCard);
      }
    },

    // Migrate existing Pokemon cards to ensure they have proper skills
    migrateExistingPokemonCards() {
      console.log('Migrating existing Pokemon cards...');
      let migrated = 0;
      
      this.player.cards.forEach((card, index) => {
        if (card.type === 'pokemon') {
          let needsUpdate = false;
          
          // Ensure types array exists
          if (!card.types || card.types.length === 1) {
            // Try to get full Pokemon data to get all types
            const pokemonId = card.pokemonId || parseInt(card.id.split('_')[1]);
            const fullPokemon = this.cardDatabase.find(c => c.pokemonId === pokemonId);
            
            if (fullPokemon && fullPokemon.types && fullPokemon.types.length > 1) {
              card.types = [...fullPokemon.types];
              console.log(`Updated ${card.name} types from ${[card.pokemonType]} to ${card.types}`);
            } else {
              card.types = [card.pokemonType || 'normal'];
            }
            needsUpdate = true;
          }
          
          // Regenerate skills if missing or only has one skill
          if (!card.skills || card.skills.length <= 1) {
            console.log(`Regenerating skills for ${card.name} (currently has ${card.skills?.length || 0} skills)`);
            
            const pokemonData = {
              id: card.pokemonId || parseInt(card.id.split('_')[1]) || 1,
              name: card.name,
              types: card.types
            };
            
            card.skills = this.generatePokemonSkills(pokemonData);
            console.log(`Generated ${card.skills.length} skills for ${card.name}`);
            needsUpdate = true;
            migrated++;
          }
          
          if (needsUpdate) {
            // Update the card in the array
            this.player.cards[index] = { ...card };
          }
        }
      });
      
      console.log(`Migration complete. Updated ${migrated} Pokemon cards.`);
      return migrated;
    },

    clearAllPokemonSkills() {
      console.log('Clearing all Pokemon skills to force regeneration...');
      this.player.cards.forEach((card, index) => {
        if (card.type === 'pokemon') {
          card.skills = [];
          console.log(`Cleared skills for ${card.name}`);
        }
      });
    },

    giveStarterPack() {
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

      starterCards.forEach(cardId => this.addCardToCollection(cardId));
    },

    // Deck management methods
    createDeck(name = 'New Deck') {
      const newDeck = {
        id: `deck_${Date.now()}`,
        name,
        cards: [],
        createdAt: Date.now(),
      };

      this.player.decks.push(newDeck);

      // Set as active if it's the first deck
      if (this.player.decks.length === 1) {
        this.player.activeDeck = newDeck.id;
      }

      // Save to Firebase
      this.updateUserData({ decks: this.player.decks });

      return newDeck;
    },

    deleteDeck(deckId) {
      const index = this.player.decks.findIndex(d => d.id === deckId);
      if (index >= 0) {
        this.player.decks.splice(index, 1);

        // If this was the active deck, clear it
        if (this.player.activeDeck === deckId) {
          this.player.activeDeck = this.player.decks.length > 0 ? this.player.decks[0].id : null;
        }

        // Save to Firebase
        this.updateUserData({
          decks: this.player.decks,
          activeDeck: this.player.activeDeck,
        });
      }
    },

    setActiveDeck(deckId) {
      const deck = this.player.decks.find(d => d.id === deckId);
      if (deck) {
        this.player.activeDeck = deckId;

        // Save to Firebase
        this.updateUserData({ activeDeck: this.player.activeDeck });
      }
    },

    addCardToDeck(deckId, card) {
      const deck = this.player.decks.find(d => d.id === deckId);
      if (deck && deck.cards.length < 30) {
        deck.cards.push(card);

        // Save to Firebase
        this.updateUserData({ decks: this.player.decks });
      }
    },

    removeCardFromDeck(deckId, cardUid) {
      const deck = this.player.decks.find(d => d.id === deckId);
      if (deck) {
        const index = deck.cards.findIndex(c => c.uid === cardUid);
        if (index >= 0) {
          deck.cards.splice(index, 1);

          // Save to Firebase
          this.updateUserData({ decks: this.player.decks });
        }
      }
    },

    // ---------------- Card Database (moved from battle to player) ----------------
    getCardById(cardId) {
      return this.cardDatabase.find(card => card.id === cardId);
    },
    
    getSkillById(skillId) {
      return getSkillById(skillId);
    },
    
    getSkillsByType(type) {
      return getSkillsByType(type);
    },

    async generateCardDatabase() {
      const pokemonStore = usePokemonStore();

      if (pokemonStore.loadedPokemon.length === 0) {
        await pokemonStore.loadInitialBatch();
      }

      if (pokemonStore.loadedPokemon.length === 0) {
        console.error('Failed to load Pokemon data');
        this.cardDatabase = [];
        return;
      }

      // Create cards with basic data first, then fetch full stats asynchronously
      const basicCards = pokemonStore.loadedPokemon
        .slice(0, 1025)
        .map(pokemon => {
          if (!pokemon || !pokemon.id || !pokemon.name) {
            console.warn('Invalid pokemon data:', pokemon);
            return null;
          }

          const rarity = this.determineRarity(pokemon.id);

          // Use basic stats for now
          const stats = this.generateStats(pokemon, rarity);

          return {
            id: `pokemon_${pokemon.id}`,
            pokemonId: pokemon.id,
            name: pokemon.name,
            type: 'pokemon',
            pokemonType: pokemon.types[0], // Primary type for compatibility
            types: pokemon.types, // Store all types for skill generation
            rarity,
            level: 1,
            hp: stats.hp,
            maxHp: stats.hp,
            atk: stats.atk,
            def: stats.def,
            spd: stats.spd,
            energy: Math.ceil(stats.hp / 50),
            image: pokemon.sprite,
            skills: this.generatePokemonSkills(pokemon),
          };
        })
        .filter(card => card !== null);

      this.cardDatabase = basicCards;

      this.generateSkillCards();
      this.generateItemCards();
      console.log('PlayerStore: Card database generated:', this.cardDatabase.length, 'cards');
    },

    determineRarity(pokemonId) {
      if (pokemonId >= 144 && pokemonId <= 151) return 'L';
      if (pokemonId % 3 === 0 && pokemonId > 100) return 'E';
      if (pokemonId % 3 === 0 || pokemonId > 50) return 'R';
      return 'C';
    },

    generateStats(pokemon, rarity) {
      // Use actual Pokemon stats from API if available
      console.log('pokemon----->', pokemon.stats);
      if (pokemon.stats && pokemon.stats.length > 0) {
        // Pokemon stats order from API:
        // 0: HP, 1: Attack, 2: Defense, 3: Special Attack, 4: Special Defense, 5: Speed
        const hp = pokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 50;
        const attack = pokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 50;
        const defense = pokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 50;
        const speed = pokemon.stats.find(s => s.stat.name === 'speed')?.base_stat || 50;

        // Apply rarity multiplier to make rarer Pokemon stronger
        const rarityMultipliers = {
          C: 0.8, // Common: 80% of base stats
          R: 1.0, // Rare: 100% of base stats
          E: 1.2, // Epic: 120% of base stats
          L: 1.4, // Legendary: 140% of base stats
        };

        const multiplier = rarityMultipliers[rarity] || 1.0;

        // Add small random variance for uniqueness
        const variance = () => Math.floor(Math.random() * 10) - 5;

        return {
          hp: Math.round(hp * multiplier) + variance(),
          atk: Math.round(attack * multiplier) + variance(),
          def: Math.round(defense * multiplier) + variance(),
          spd: Math.round(speed * multiplier) + variance(),
        };
      }

      // Fallback to hard-coded stats if API data not available
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
      console.log('generatePokemonSkills called for:', pokemon.name, 'with types:', pokemon.types);
      const skills: Skill[] = [];
      const types = (pokemon.types || []) as SkillElement[];
      
      // If types is not an array or is empty, use a default type
      if (!Array.isArray(types) || types.length === 0) {
        console.log('No types found, using normal as default');
        types.push('normal' as SkillElement);
      }

      // Always add Tackle as a basic move
      const tackle = getSkillById('tackle');
      if (tackle) {
        skills.push({ ...tackle });
        console.log('Added Tackle skill');
      }

      // Add type-specific skills based on Pokemon's types
      for (const type of types) {
        console.log('Getting skills for type:', type);
        const typeSkills = getSkillsByType(type);

        // Add one basic and one advanced skill per type
        const basicSkill = typeSkills.find(s => s.category !== 'ultimate' && s.energy <= 2);
        const advancedSkill = typeSkills.find(
          s => s.category !== 'ultimate' && s.energy > 2 && s.energy <= 4
        );

        if (basicSkill && !skills.some(s => s.id === basicSkill.id)) {
          skills.push({ ...basicSkill });
          console.log(`Added basic ${type} skill: ${basicSkill.name}`);
        }
        if (advancedSkill && !skills.some(s => s.id === advancedSkill.id)) {
          skills.push({ ...advancedSkill });
          console.log(`Added advanced ${type} skill: ${advancedSkill.name}`);
        }
      }

      // If Pokemon is evolved (higher ID), add an ultimate skill
      if (pokemon.id > 50) {
        const ultimateType = types[0];
        const typeSkills = getSkillsByType(ultimateType);
        const ultimate = typeSkills.find(s => s.category === 'ultimate');
        if (ultimate && !skills.some(s => s.id === ultimate.id)) {
          skills.push({ ...ultimate });
        }
      }

      // Ensure we have at least 2 skills
      if (skills.length < 2) {
        const quickAttack = getSkillById('quick_attack');
        if (quickAttack) {
          skills.push({ ...quickAttack });
          console.log('Added Quick Attack as fallback');
        }
      }

      console.log(`Generated ${skills.length} skills for ${pokemon.name}:`, skills.map(s => s.name));
      return skills.slice(0, 4); // Max 4 skills
    },

    generateSkillCards() {
      this.skillCards = [
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

      this.cardDatabase.push(...this.skillCards);
    },

    generateItemCards() {
      this.itemCards = [
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

      this.cardDatabase.push(...this.itemCards);
    },
  },
});
