import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import type { User, UserPokemon, Card, Deck, Battle, Pack, FarmLayout, FarmResources } from '@/types';

// Collections
const COLLECTIONS = {
  USERS: 'users',
  CARDS: 'cards',
  DECKS: 'decks',
  BATTLES: 'battles',
  LEADERBOARD: 'leaderboard',
  PACK_HISTORY: 'packHistory',
  USER_CARDS: 'userCards',
};

// User data operations
export const userService = {
  // Create or update user profile
  async saveUser(userId, userData) {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await setDoc(
      userRef,
      {
        ...userData,
        updatedAt: serverTimestamp(),
        createdAt: userData.createdAt || serverTimestamp(),
      },
      { merge: true }
    );
  },

  // Get user profile
  async getUser(userId) {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null;
  },

  // Update user stats
  async updateUserStats(userId, stats) {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      ...stats,
      updatedAt: serverTimestamp(),
    });
  },

  // Listen to user changes
  subscribeToUser(userId, callback) {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    return onSnapshot(userRef, doc => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      } else {
        callback(null);
      }
    });
  },
};

// Card collection operations
export const cardService = {
  // Save user's card collection
  async saveUserCards(userId, cards) {
    const cardsRef = doc(db, COLLECTIONS.CARDS, userId);
    await setDoc(
      cardsRef,
      {
        userId,
        cards,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  // Get user's card collection
  async getUserCards(userId) {
    const cardsRef = doc(db, COLLECTIONS.CARDS, userId);
    const cardsSnap = await getDoc(cardsRef);
    return cardsSnap.exists() ? cardsSnap.data().cards || [] : [];
  },

  // Listen to card collection changes
  subscribeToUserCards(userId, callback) {
    const cardsRef = doc(db, COLLECTIONS.CARDS, userId);
    return onSnapshot(cardsRef, doc => {
      if (doc.exists()) {
        callback(doc.data().cards || []);
      } else {
        callback([]);
      }
    });
  },
};

// Deck operations
export const deckService = {
  // Save user's decks
  async saveUserDecks(userId, decks) {
    const decksRef = doc(db, COLLECTIONS.DECKS, userId);
    await setDoc(
      decksRef,
      {
        userId,
        decks,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  // Get user's decks
  async getUserDecks(userId) {
    const decksRef = doc(db, COLLECTIONS.DECKS, userId);
    const decksSnap = await getDoc(decksRef);
    return decksSnap.exists() ? decksSnap.data().decks || [] : [];
  },

  // Listen to deck changes
  subscribeToUserDecks(userId, callback) {
    const decksRef = doc(db, COLLECTIONS.DECKS, userId);
    return onSnapshot(decksRef, doc => {
      if (doc.exists()) {
        callback(doc.data().decks || []);
      } else {
        callback([]);
      }
    });
  },
};

// Battle history operations
export const battleService = {
  // Save battle result
  async saveBattle(userId, battleData) {
    const battleRef = doc(collection(db, COLLECTIONS.BATTLES));
    await setDoc(battleRef, {
      userId,
      ...battleData,
      timestamp: serverTimestamp(),
    });
    return battleRef.id;
  },

  // Get user's battle history
  async getUserBattles(userId, limitCount = 50) {
    const battlesQuery = query(
      collection(db, COLLECTIONS.BATTLES),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const battlesSnap = await getDocs(battlesQuery);
    return battlesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Listen to battle history
  subscribeToUserBattles(userId, callback, limitCount = 20) {
    const battlesQuery = query(
      collection(db, COLLECTIONS.BATTLES),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(battlesQuery, snapshot => {
      const battles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(battles);
    });
  },
};

// Leaderboard operations
export const leaderboardService = {
  // Update user's leaderboard entry
  async updateLeaderboardEntry(userId, userData) {
    const leaderboardRef = doc(db, COLLECTIONS.LEADERBOARD, userId);
    await setDoc(
      leaderboardRef,
      {
        userId,
        name: userData.name,
        level: userData.level,
        wins: userData.wins,
        losses: userData.losses,
        pvpRank: userData.pvpRank,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  // Get top players
  async getTopPlayers(limitCount = 100) {
    const leaderboardQuery = query(
      collection(db, COLLECTIONS.LEADERBOARD),
      orderBy('level', 'desc'),
      orderBy('wins', 'desc'),
      limit(limitCount)
    );

    const leaderboardSnap = await getDocs(leaderboardQuery);
    return leaderboardSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Listen to leaderboard changes
  subscribeToLeaderboard(callback, limitCount = 50) {
    const leaderboardQuery = query(
      collection(db, COLLECTIONS.LEADERBOARD),
      orderBy('level', 'desc'),
      orderBy('wins', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(leaderboardQuery, snapshot => {
      const players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(players);
    });
  },

  // Pack History Service - moved to separate service below
};

// Pack History Service
export const packHistoryService = {
  // Save pack history to Firestore
  async savePackHistory(userId, packHistory) {
    try {
      const packHistoryRef = doc(db, COLLECTIONS.PACK_HISTORY, userId);
      await setDoc(
        packHistoryRef,
        {
          userId,
          packHistory,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      console.log('Pack history saved to Firestore for user:', userId);
    } catch (error) {
      console.error('Error saving pack history to Firestore:', error);
      throw error;
    }
  },

  // Get pack history from Firestore
  async getPackHistory(userId) {
    try {
      const packHistoryDoc = await getDoc(doc(db, COLLECTIONS.PACK_HISTORY, userId));
      if (packHistoryDoc.exists()) {
        const data = packHistoryDoc.data();
        console.log('Pack history loaded from Firestore for user:', userId);
        return data.packHistory || [];
      }
      console.log('No pack history found for user:', userId);
      return [];
    } catch (error) {
      console.error('Error getting pack history from Firestore:', error);
      return [];
    }
  },

  // Add single pack to history
  async addPackToHistory(userId, packData) {
    try {
      const packHistoryRef = doc(db, COLLECTIONS.PACK_HISTORY, userId);
      const packHistoryDoc = await getDoc(packHistoryRef);

      let currentHistory = [];
      if (packHistoryDoc.exists()) {
        currentHistory = packHistoryDoc.data().packHistory || [];
      }

      // Clean packData to remove undefined values
      const cleanPackData = JSON.parse(
        JSON.stringify(packData, (key, value) => {
          return value === undefined ? null : value;
        })
      );

      // Add new pack to history
      currentHistory.push(cleanPackData);

      // Save updated history
      await setDoc(
        packHistoryRef,
        {
          userId,
          packHistory: currentHistory,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log('Pack added to history in Firestore:', packData.id);
      return currentHistory;
    } catch (error) {
      console.error('Error adding pack to history:', error);
      throw error;
    }
  },

  // Get pack statistics
  async getPackStats(userId) {
    try {
      const packHistory = await this.getPackHistory(userId);
      const stats = {
        totalPacks: packHistory.length,
        basicPacks: packHistory.filter(p => p.type === 'basic').length,
        premiumPacks: packHistory.filter(p => p.type === 'premium').length,
        legendaryPacks: packHistory.filter(p => p.type === 'legendary').length,
        totalCards: packHistory.reduce((sum, pack) => sum + pack.cards.length, 0),
        legendaryCards: packHistory.reduce(
          (sum, pack) => sum + pack.cards.filter(card => card.rarity === 'L').length,
          0
        ),
        epicCards: packHistory.reduce(
          (sum, pack) => sum + pack.cards.filter(card => card.rarity === 'E').length,
          0
        ),
        rareCards: packHistory.reduce(
          (sum, pack) => sum + pack.cards.filter(card => card.rarity === 'R').length,
          0
        ),
        commonCards: packHistory.reduce(
          (sum, pack) => sum + pack.cards.filter(card => card.rarity === 'C').length,
          0
        ),
      };
      return stats;
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

  // Listen to pack history changes
  subscribeToPackHistory(userId, callback) {
    const packHistoryRef = doc(db, COLLECTIONS.PACK_HISTORY, userId);
    return onSnapshot(packHistoryRef, doc => {
      if (doc.exists()) {
        const data = doc.data();
        callback(data.packHistory || []);
      } else {
        callback([]);
      }
    });
  },
};

// User Cards Service
export const userCardsService = {
  // Save user's card collection
  async saveUserCards(userId, cards) {
    try {
      const userCardsRef = doc(db, COLLECTIONS.USER_CARDS, userId);
      await setDoc(
        userCardsRef,
        {
          userId,
          cards,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      console.log('User cards saved to Firestore for user:', userId);
    } catch (error) {
      console.error('Error saving user cards to Firestore:', error);
      throw error;
    }
  },

  // Get user's card collection
  async getUserCards(userId) {
    try {
      const userCardsDoc = await getDoc(doc(db, COLLECTIONS.USER_CARDS, userId));
      if (userCardsDoc.exists()) {
        const data = userCardsDoc.data();
        console.log('User cards loaded from Firestore for user:', userId);
        return data.cards || [];
      }
      console.log('No user cards found for user:', userId);
      return [];
    } catch (error) {
      console.error('Error getting user cards from Firestore:', error);
      return [];
    }
  },

  // Add single card to user's collection
  async addCardToUser(userId, cardData, obtainedFrom = 'reward') {
    try {
      const userCardsRef = doc(db, COLLECTIONS.USER_CARDS, userId);
      const userCardsDoc = await getDoc(userCardsRef);

      let currentCards = [];
      if (userCardsDoc.exists()) {
        currentCards = userCardsDoc.data().cards || [];
      }

      // Always add as new entry (support duplicates)
      const newCard = {
        ...cardData,
        uid: `${cardData.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        level: cardData.level || 1,
        obtainedAt: Date.now(),
        obtainedFrom: obtainedFrom, // pack, shop, reward, etc.
      };

      currentCards.push(newCard);
      console.log('Card added to collection:', cardData.id);

      // Save updated cards
      await setDoc(
        userCardsRef,
        {
          userId,
          cards: currentCards,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log('Card added to user collection in Firestore:', cardData.id);
      return currentCards;
    } catch (error) {
      console.error('Error adding card to user collection:', error);
      throw error;
    }
  },

  // Add multiple cards from pack opening
  async addCardsFromPack(userId, packCards, packType) {
    try {
      const userCardsRef = doc(db, COLLECTIONS.USER_CARDS, userId);
      const userCardsDoc = await getDoc(userCardsRef);

      let currentCards = [];
      if (userCardsDoc.exists()) {
        currentCards = userCardsDoc.data().cards || [];
      }

      const addedCards = [];

      // Add each card as a separate entry (support duplicates)
      for (const cardData of packCards) {
        const newCard = {
          ...cardData,
          uid: `${cardData.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          level: cardData.level || 1,
          obtainedAt: Date.now(),
          obtainedFrom: 'pack',
          packType: packType,
        };

        currentCards.push(newCard);
        addedCards.push(newCard);
      }

      // Save updated cards
      await setDoc(
        userCardsRef,
        {
          userId,
          cards: currentCards,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log('Cards from pack added to user collection:', packCards.length, 'cards');
      return { cards: currentCards, addedCards };
    } catch (error) {
      console.error('Error adding cards from pack:', error);
      throw error;
    }
  },

  // Get card statistics for user
  async getUserCardStats(userId) {
    try {
      const cards = await this.getUserCards(userId);
      const stats = {
        totalCards: cards.length,
        legendaryCards: cards.filter(card => card.rarity === 'L').length,
        epicCards: cards.filter(card => card.rarity === 'E').length,
        rareCards: cards.filter(card => card.rarity === 'R').length,
        commonCards: cards.filter(card => card.rarity === 'C').length,
        pokemonCards: cards.filter(card => card.type === 'pokemon').length,
        skillCards: cards.filter(card => card.type === 'skill').length,
        itemCards: cards.filter(card => card.type === 'item').length,
        newCards: cards.filter(card => card.isNew).length,
      };
      return stats;
    } catch (error) {
      console.error('Error getting user card stats:', error);
      return {
        totalCards: 0,
        legendaryCards: 0,
        epicCards: 0,
        rareCards: 0,
        commonCards: 0,
        pokemonCards: 0,
        skillCards: 0,
        itemCards: 0,
        newCards: 0,
      };
    }
  },

  // Listen to user cards changes
  subscribeToUserCards(userId, callback) {
    const userCardsRef = doc(db, COLLECTIONS.USER_CARDS, userId);
    return onSnapshot(userCardsRef, doc => {
      if (doc.exists()) {
        const data = doc.data();
        callback(data.cards || []);
      } else {
        callback([]);
      }
    });
  },
};

// Batch operations for multiple updates
export const batchService = {
  async batchUpdateUserData(userId, userData, cards, decks) {
    const batch = writeBatch(db);

    // Update user profile
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    batch.set(
      userRef,
      {
        ...userData,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Update cards
    const cardsRef = doc(db, COLLECTIONS.CARDS, userId);
    batch.set(
      cardsRef,
      {
        userId,
        cards,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Update decks
    const decksRef = doc(db, COLLECTIONS.DECKS, userId);
    batch.set(
      decksRef,
      {
        userId,
        decks,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();
  },
};

// Pokemon Collection Service
export const pokemonCollectionService = {
  // Get all user's Pokemon
  async getUserPokemon(userId) {
    try {
      const pokemonQuery = query(collection(db, COLLECTIONS.USERS, userId, 'pokemon'));

      const snapshot = await getDocs(pokemonQuery);
      const userPokemon = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log('User Pokemon loaded:', userPokemon.length);
      return userPokemon;
    } catch (error) {
      console.error('Error loading user Pokemon:', error);
      return [];
    }
  },

  // Add Pokemon to user's collection
  async addPokemonToUser(userId, pokemonData) {
    try {
      const pokemonRef = doc(collection(db, COLLECTIONS.USERS, userId, 'pokemon'));
      await setDoc(pokemonRef, {
        ...pokemonData,
        obtainedAt: serverTimestamp(),
        userId,
      });

      console.log('Pokemon added to user collection:', pokemonData.nickname);
      return pokemonRef.id;
    } catch (error) {
      console.error('Error adding Pokemon to user:', error);
      throw error;
    }
  },

  // Update Pokemon data
  async updatePokemon(userId, pokemonId, updateData) {
    try {
      const pokemonRef = doc(db, COLLECTIONS.USERS, userId, 'pokemon', pokemonId);
      await updateDoc(pokemonRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      console.log('Pokemon updated:', pokemonId);
    } catch (error) {
      console.error('Error updating Pokemon:', error);
      throw error;
    }
  },

  // Listen to user's Pokemon collection
  subscribeToUserPokemon(userId, callback) {
    const pokemonQuery = query(collection(db, COLLECTIONS.USERS, userId, 'pokemon'));

    return onSnapshot(pokemonQuery, snapshot => {
      const pokemon = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(pokemon);
    });
  },
};

// Farm Service
export const farmService = {
  // Load farm layout
  async loadFarmLayout(userId) {
    try {
      const farmDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId, 'farm', 'layout'));

      if (farmDoc.exists()) {
        console.log('Farm layout loaded from Firestore');
        return farmDoc.data();
      }

      console.log('No farm layout found, needs initialization');
      return null;
    } catch (error) {
      console.error('Error loading farm layout:', error);
      throw error;
    }
  },

  // Save farm layout
  async saveFarmLayout(userId, farmData) {
    try {
      const farmRef = doc(db, COLLECTIONS.USERS, userId, 'farm', 'layout');
      await setDoc(
        farmRef,
        {
          layout: farmData.layout,
          buildings: farmData.buildings || [],
          crops: farmData.crops || [],
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      console.log('Farm layout saved to Firestore');
    } catch (error) {
      console.error('Error saving farm layout:', error);
      throw error;
    }
  },

  // Load farm Pokemon
  async loadFarmPokemon(userId) {
    try {
      const pokemonQuery = query(
        collection(db, COLLECTIONS.USERS, userId, 'pokemon'),
        where('location', '==', 'farm')
      );

      const snapshot = await getDocs(pokemonQuery);
      const farmPokemon = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log('Farm Pokemon loaded:', farmPokemon.length);
      return farmPokemon;
    } catch (error) {
      console.error('Error loading farm Pokemon:', error);
      throw error;
    }
  },

  // Load farm resources
  async loadFarmResources(userId) {
    try {
      const resourcesDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId, 'game', 'resources'));

      if (resourcesDoc.exists()) {
        console.log('Farm resources loaded from Firestore');
        return resourcesDoc.data();
      }

      return null;
    } catch (error) {
      console.error('Error loading farm resources:', error);
      throw error;
    }
  },

  // Save farm resources
  async saveFarmResources(userId, resources) {
    try {
      const resourcesRef = doc(db, COLLECTIONS.USERS, userId, 'game', 'resources');
      await setDoc(
        resourcesRef,
        {
          ...resources,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      console.log('Farm resources saved to Firestore');
    } catch (error) {
      console.error('Error saving farm resources:', error);
      throw error;
    }
  },

  // Update Pokemon location
  async updatePokemonLocation(userId, pokemonId, location, x = null, z = null) {
    try {
      const pokemonRef = doc(db, COLLECTIONS.USERS, userId, 'pokemon', pokemonId);
      const updateData = {
        location,
        updatedAt: serverTimestamp(),
      };

      if (x !== null) updateData.x = x;
      if (z !== null) updateData.z = z;

      await updateDoc(pokemonRef, updateData);
      console.log('Pokemon location updated:', pokemonId, location);
    } catch (error) {
      console.error('Error updating Pokemon location:', error);
      throw error;
    }
  },
};
