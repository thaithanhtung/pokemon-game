import { ref, computed } from 'vue';
import { authService } from '@/firebase/auth.js';
import { usePlayerStore } from '@/stores/player';
import {
  userService,
  cardService,
  deckService,
  battleService,
  leaderboardService,
  packHistoryService,
  userCardsService,
  farmService,
  pokemonCollectionService,
} from '@/firebase/services.js';

// ✅ Singleton state - chia sẻ giữa tất cả các component
const user = ref(null);
const isAuthenticated = ref(false);
const isLoading = ref(true);
const error = ref(null);
let unsubscribeAuth = null;

export function useFirebase() {
  // Auth methods
  const signInAnonymously = async () => {
    isLoading.value = true;
    error.value = null;

    const result = await authService.signInAnonymously();

    if (result.error) {
      error.value = result.error;
    }

    isLoading.value = false;
    return result;
  };

  const signInWithGoogle = async () => {
    isLoading.value = true;
    error.value = null;

    const result = await authService.signInWithGoogle();

    if (result.error) {
      error.value = result.error;
    }

    isLoading.value = false;
    return result;
  };

  const signInWithEmail = async (email, password) => {
    isLoading.value = true;
    error.value = null;

    const result = await authService.signInWithEmail(email, password);

    if (result.error) {
      error.value = result.error;
    }

    isLoading.value = false;
    return result;
  };

  const createAccount = async (email, password, displayName) => {
    isLoading.value = true;
    error.value = null;

    const result = await authService.createAccount(email, password, displayName);

    if (result.error) {
      error.value = result.error;
    }

    isLoading.value = false;
    return result;
  };

  const signOut = async () => {
    isLoading.value = true;
    error.value = null;

    const result = await authService.signOut();

    if (result.error) {
      error.value = result.error;
    }

    isLoading.value = false;
    return result;
  };

  // User data methods
  const saveUserData = async userData => {
    console.log('saveUserData called:', {
      isAuthenticated: isAuthenticated.value,
      user: user.value?.uid,
      userData: userData,
    });

    // Sanitize payload: drop undefined, remap keys
    const cleanedUserDataBase = Object.fromEntries(
      Object.entries(userData || {}).filter(([_, v]) => v !== undefined)
    );
    // Map experience -> exp for consistency with Firestore schema
    if (cleanedUserDataBase.experience !== undefined) {
      cleanedUserDataBase.exp = cleanedUserDataBase.experience ?? 0;
      delete cleanedUserDataBase.experience;
    }
    // Ensure numeric fields are numbers (not null/NaN)
    if (cleanedUserDataBase.energy !== undefined && cleanedUserDataBase.energy == null)
      cleanedUserDataBase.energy = 0;
    if (cleanedUserDataBase.gems !== undefined && cleanedUserDataBase.gems == null)
      cleanedUserDataBase.gems = 0;
    if (cleanedUserDataBase.exp !== undefined && cleanedUserDataBase.exp == null)
      cleanedUserDataBase.exp = 0;

    if (!isAuthenticated.value) {
      console.error('User not authenticated, cannot save user data');
      return false;
    }

    try {
      console.log('Saving user data to Firestore (cleaned)...', cleanedUserDataBase);
      await userService.saveUser(user.value.uid, cleanedUserDataBase);
      console.log('User data saved successfully:', cleanedUserDataBase);
      return true;
    } catch (err) {
      console.error('Error saving user data:', err);
      error.value = err.message;
      return false;
    }
  };

  const saveUserCards = async cards => {
    if (!isAuthenticated.value) return false;

    try {
      await cardService.saveUserCards(user.value.uid, cards);
      return true;
    } catch (err) {
      console.error('Error saving user cards:', err);
      error.value = err.message;
      return false;
    }
  };

  const saveUserDecks = async decks => {
    if (!isAuthenticated.value) return false;

    try {
      await deckService.saveUserDecks(user.value.uid, decks);
      return true;
    } catch (err) {
      console.error('Error saving user decks:', err);
      error.value = err.message;
      return false;
    }
  };

  const saveBattleResult = async battleData => {
    if (!isAuthenticated.value) return null;

    try {
      const battleId = await battleService.saveBattle(user.value.uid, battleData);
      return battleId;
    } catch (err) {
      console.error('Error saving battle result:', err);
      error.value = err.message;
      return null;
    }
  };

  const updateLeaderboard = async userData => {
    if (!isAuthenticated.value) return false;

    try {
      await leaderboardService.updateLeaderboardEntry(user.value.uid, userData);
      return true;
    } catch (err) {
      console.error('Error updating leaderboard:', err);
      error.value = err.message;
      return false;
    }
  };

  // Pack History methods
  const savePackHistory = async packHistory => {
    if (!isAuthenticated.value) return false;

    try {
      await packHistoryService.savePackHistory(user.value.uid, packHistory);
      console.log('Pack history saved to Firestore successfully');
      return true;
    } catch (err) {
      console.error('Error saving pack history:', err);
      error.value = err.message;
      return false;
    }
  };

  const getPackHistory = async () => {
    if (!isAuthenticated.value) return [];

    try {
      const history = await packHistoryService.getPackHistory(user.value.uid);
      console.log('Pack history loaded from Firestore:', history.length, 'packs');
      return history;
    } catch (err) {
      console.error('Error getting pack history:', err);
      error.value = err.message;
      return [];
    }
  };

  const addPackToHistory = async packData => {
    if (!isAuthenticated.value) return false;

    try {
      await packHistoryService.addPackToHistory(user.value.uid, packData);
      console.log('Pack added to Firestore history:', packData.id);
      return true;
    } catch (err) {
      console.error('Error adding pack to history:', err);
      error.value = err.message;
      return false;
    }
  };

  const getPackStats = async () => {
    console.log('getPackStats auth state', {
      isAuthenticated: isAuthenticated.value,
      userId: user.value?.uid || null,
    });
    if (!isAuthenticated.value || !user.value || !user.value.uid) {
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

    try {
      const stats = await packHistoryService.getPackStats(user.value.uid);
      return stats;
    } catch (err) {
      console.error('Error getting pack stats:', err);
      error.value = err.message;
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
  };

  // User Cards methods
  const saveUserCardsToFirestore = async cards => {
    if (!isAuthenticated.value) return false;

    try {
      await userCardsService.saveUserCards(user.value.uid, cards);
      console.log('User cards saved to Firestore successfully');
      return true;
    } catch (err) {
      console.error('Error saving user cards:', err);
      error.value = err.message;
      return false;
    }
  };

  const getUserCards = async () => {
    if (!isAuthenticated.value) return [];

    try {
      const cards = await userCardsService.getUserCards(user.value.uid);
      console.log('User cards loaded from Firestore:', cards.length, 'cards');
      return cards;
    } catch (err) {
      console.error('Error getting user cards:', err);
      error.value = err.message;
      return [];
    }
  };

  const addCardToUser = async cardData => {
    if (!isAuthenticated.value) return false;

    try {
      await userCardsService.addCardToUser(user.value.uid, cardData);
      console.log('Card added to user collection:', cardData.id);
      return true;
    } catch (err) {
      console.error('Error adding card to user:', err);
      error.value = err.message;
      return false;
    }
  };

  const addCardsFromPack = async (packCards, packType) => {
    if (!isAuthenticated.value) return null;

    try {
      const result = await userCardsService.addCardsFromPack(user.value.uid, packCards, packType);
      console.log('Cards from pack added to user collection:', packCards.length, 'cards');
      return result;
    } catch (err) {
      console.error('Error adding cards from pack:', err);
      error.value = err.message;
      return null;
    }
  };

  const getUserCardStats = async () => {
    if (!isAuthenticated.value) return null;

    try {
      const stats = await userCardsService.getUserCardStats(user.value.uid);
      console.log('User card stats loaded from Firestore:', stats);
      return stats;
    } catch (err) {
      console.error('Error getting user card stats:', err);
      error.value = err.message;
      return null;
    }
  };

  // Log card merge event
  const logCardMerge = async mergeData => {
    if (!isAuthenticated.value) return null;

    try {
      const mergeRecord = {
        userId: user.value.uid,
        timestamp: Date.now(),
        sourceCards: mergeData.sourceCards,
        resultCard: {
          id: mergeData.resultCard.id,
          name: mergeData.resultCard.name,
          level: mergeData.resultCard.level,
          pokemonId: mergeData.resultCard.pokemonId,
          rarity: mergeData.resultCard.rarity,
        },
        statsIncrease: {
          hp: mergeData.resultCard.hp,
          atk: mergeData.resultCard.atk,
          def: mergeData.resultCard.def,
          spd: mergeData.resultCard.spd,
        },
      };

      // For now, we'll save this as part of user data update
      // In a production app, you might want a separate collection
      console.log('Card merge logged:', mergeRecord);
      return true;
    } catch (err) {
      console.error('Error logging card merge:', err);
      error.value = err.message;
      return false;
    }
  };

  // Create new user profile in Firestore
  const createNewUserProfile = async firebaseUser => {
    try {
      const newUserData = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'Trainer',
        email: firebaseUser.email,
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
        packHistory: [],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        provider: firebaseUser.providerData[0]?.providerId || 'google.com',
      };

      // Save user profile to Firestore
      await userService.saveUser(firebaseUser.uid, newUserData);

      // Initialize empty pack history
      await packHistoryService.savePackHistory(firebaseUser.uid, []);

      // Initialize empty user cards
      await userCardsService.saveUserCards(firebaseUser.uid, []);

      // Update user object with new data
      user.value = { ...firebaseUser, ...newUserData };

      console.log('New user profile created successfully:', {
        uid: firebaseUser.uid,
        name: newUserData.name,
        email: newUserData.email,
        provider: newUserData.provider,
      });

      return newUserData;
    } catch (err) {
      console.error('Error creating new user profile:', err);
      throw err;
    }
  };

  // Start/Stop Auth Listener (shared for stores and components)
  const startAuthListener = () => {
    if (unsubscribeAuth) {
      console.log('Auth listener already started');
      return unsubscribeAuth;
    }

    console.log('Starting global auth listener...');
    isLoading.value = true;
    unsubscribeAuth = authService.onAuthStateChanged(async firebaseUser => {
      try {
        if (firebaseUser) {
          // Try load profile
          try {
            const userData = await userService.getUser(firebaseUser.uid);
            if (userData) {
              user.value = { ...firebaseUser, ...userData };
              isAuthenticated.value = true;

              console.log('Existing user loaded from Firestore:', userData);

              // Update Pinia player store with loaded data
              const playerStore = usePlayerStore();

              // Load user cards from dedicated collection (source of truth)
              let cards = [];
              try {
                const userCards = await userCardsService.getUserCards(firebaseUser.uid);
                if (Array.isArray(userCards) && userCards.length > 0) {
                  cards = userCards;
                  console.log(
                    'User cards loaded from userCards collection:',
                    userCards.length,
                    'cards'
                  );
                } else {
                  // Fallback to users collection if userCards is empty
                  cards = userData.cards || [];
                  console.log(
                    'Fallback: User cards loaded from users collection:',
                    cards.length,
                    'cards'
                  );
                }
              } catch (e) {
                console.warn('Could not load user cards, using fallback:', e);
                cards = userData.cards || [];
              }

              playerStore.player = {
                ...playerStore.player,
                ...userData,
                id: userData.id || firebaseUser.uid,
                name: userData.name || firebaseUser.displayName || 'Trainer',
                level: userData.level ?? 1,
                exp: userData.exp ?? 0,
                energy: userData.energy ?? 500,
                gems: userData.gems ?? 500,
                cards: cards, // Use cards from userCards collection
                decks: userData.decks || [],
                activeDeck: userData.activeDeck || null,
                storyProgress: userData.storyProgress || { chapter: 1, stage: 1 },
                pvpRank: userData.pvpRank || 'Bronze',
                wins: userData.wins ?? 0,
                losses: userData.losses ?? 0,
              };

              playerStore.loaded = true;
              console.log('Player data updated in Pinia store');
              
              // Ensure card database is initialized before migrating decks
              if (!playerStore.cardDatabase || playerStore.cardDatabase.length === 0) {
                console.log('Initializing card database before deck migration...');
                await playerStore.generateCardDatabase();
              }
              
              // Run deck format migration after loading data from Firebase
              console.log('Running deck format migration...');
              playerStore.migrateDeckFormat();
            } else {
              await createNewUserProfile(firebaseUser);
              console.log('New user created in Firestore:', firebaseUser.uid);

              // Update Pinia with new user data
              const playerStore = usePlayerStore();
              playerStore.player = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'Trainer',
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
              };
              playerStore.loaded = true;
              console.log('New player data set in Pinia store');
            }
          } catch (e) {
            console.error('Auth listener: error loading/creating user data', e);
            user.value = firebaseUser;
          }
        } else {
          isAuthenticated.value = false;
          user.value = null;

          // Reset Pinia player store to default when user signs out
          const playerStore = usePlayerStore();
          playerStore.player = {
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
          };
          playerStore.loaded = false;
          console.log('Player data reset to defaults in Pinia store');
        }
      } finally {
        isLoading.value = false;
      }
    });

    return unsubscribeAuth;
  };

  const stopAuthListener = () => {
    if (unsubscribeAuth) {
      console.log('Stopping auth listener');
      unsubscribeAuth();
      unsubscribeAuth = null;
    }
  };

  // Computed properties
  const userId = computed(() => user.value?.uid || null);
  const displayName = computed(() => user.value?.displayName || 'Guest Player');
  const email = computed(() => user.value?.email || null);

  return {
    // State
    user: computed(() => user.value),
    isAuthenticated: computed(() => isAuthenticated.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),

    // Computed
    userId,
    displayName,
    email,

    // Methods
    startAuthListener,
    stopAuthListener,
    signInAnonymously,
    signInWithGoogle,
    signInWithEmail,
    createAccount,
    signOut,
    saveUserData,
    saveUserCards,
    saveUserDecks,
    saveBattleResult,
    updateLeaderboard,
    savePackHistory,
    getPackHistory,
    addPackToHistory,
    getPackStats,
    createNewUserProfile,
    saveUserCardsToFirestore,
    getUserCards,
    addCardToUser,
    addCardsFromPack,
    getUserCardStats,
    logCardMerge,
  };
}
