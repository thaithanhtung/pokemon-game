import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  serverTimestamp,
  increment,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import type { MarketListing, MarketPurchase } from '@/types';

const COLLECTIONS = {
  MARKET: 'market',
  MARKET_PURCHASES: 'marketPurchases',
};

export const marketService = {
  // Add a new Pokemon listing to the market
  async addMarketListing(listingData) {
    try {
      const marketRef = doc(collection(db, COLLECTIONS.MARKET));
      await setDoc(marketRef, {
        ...listingData,
        sold: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('Market listing added:', marketRef.id);
      return marketRef.id;
    } catch (error) {
      console.error('Error adding market listing:', error);
      throw error;
    }
  },

  // Get all market listings
  async getMarketListings(onlyActive = false) {
    try {
      let marketQuery;
      
      if (onlyActive) {
        // Simple query without ordering to avoid index requirement
        marketQuery = query(
          collection(db, COLLECTIONS.MARKET),
          where('status', '==', 'active')
        );
      } else {
        marketQuery = query(
          collection(db, COLLECTIONS.MARKET),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(marketQuery);
      let listings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort client-side when filtering by status
      if (onlyActive) {
        listings.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime - aTime; // Descending order
        });
      }

      console.log('Market listings loaded:', listings.length);
      return listings;
    } catch (error) {
      console.error('Error loading market listings:', error);
      throw error;
    }
  },

  // Get active market listings for users
  async getActiveMarketListings() {
    return this.getMarketListings(true);
  },

  // Update a market listing
  async updateMarketListing(listingId, updateData) {
    try {
      const listingRef = doc(db, COLLECTIONS.MARKET, listingId);
      await updateDoc(listingRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
      console.log('Market listing updated:', listingId);
    } catch (error) {
      console.error('Error updating market listing:', error);
      throw error;
    }
  },

  // Delete a market listing
  async deleteMarketListing(listingId) {
    try {
      const listingRef = doc(db, COLLECTIONS.MARKET, listingId);
      await deleteDoc(listingRef);
      console.log('Market listing deleted:', listingId);
    } catch (error) {
      console.error('Error deleting market listing:', error);
      throw error;
    }
  },

  // Purchase a Pokemon from the market
  async purchasePokemon(userId, listingId, userCoins) {
    try {
      // Get the listing
      const listingRef = doc(db, COLLECTIONS.MARKET, listingId);
      const listingSnap = await getDoc(listingRef);
      
      if (!listingSnap.exists()) {
        throw new Error('Listing not found');
      }

      const listing = listingSnap.data();

      // Check if listing is active
      if (listing.status !== 'active') {
        throw new Error('This Pokemon is not available for purchase');
      }

      // Check if user has enough coins
      if (userCoins < listing.price) {
        throw new Error('Insufficient coins');
      }

      // Check stock
      if (listing.stock !== -1 && listing.stock <= 0) {
        throw new Error('Out of stock');
      }

      // Create purchase record
      const purchaseRef = doc(collection(db, COLLECTIONS.MARKET_PURCHASES));
      await setDoc(purchaseRef, {
        userId,
        listingId,
        pokemonId: listing.pokemonId,
        pokemonName: listing.name,
        price: listing.price,
        purchasedAt: serverTimestamp(),
      });

      // Update listing stock and sold count
      const updateData = {
        sold: increment(1),
      };

      if (listing.stock !== -1) {
        updateData.stock = increment(-1);
        
        // If stock reaches 0, set status to inactive
        if (listing.stock - 1 <= 0) {
          updateData.status = 'inactive';
        }
      }

      await updateDoc(listingRef, updateData);

      console.log('Pokemon purchased successfully');
      return {
        success: true,
        pokemon: {
          id: listing.pokemonId,
          name: listing.name,
          sprite: listing.sprite,
          types: listing.types,
          category: listing.category,
        },
        price: listing.price,
      };
    } catch (error) {
      console.error('Error purchasing Pokemon:', error);
      throw error;
    }
  },

  // Get user's purchase history
  async getUserPurchases(userId) {
    try {
      // Simple query without ordering to avoid index requirement
      const purchasesQuery = query(
        collection(db, COLLECTIONS.MARKET_PURCHASES),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(purchasesQuery);
      let purchases = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort client-side
      purchases.sort((a, b) => {
        const aTime = a.purchasedAt?.toDate?.() || new Date(0);
        const bTime = b.purchasedAt?.toDate?.() || new Date(0);
        return bTime - aTime; // Descending order
      });

      console.log('User purchases loaded:', purchases.length);
      return purchases;
    } catch (error) {
      console.error('Error loading user purchases:', error);
      throw error;
    }
  },

  // Listen to market listings changes
  subscribeToMarketListings(callback, onlyActive = false) {
    let marketQuery;
    
    if (onlyActive) {
      // Simple query without ordering to avoid index requirement
      marketQuery = query(
        collection(db, COLLECTIONS.MARKET),
        where('status', '==', 'active')
      );
    } else {
      marketQuery = query(
        collection(db, COLLECTIONS.MARKET),
        orderBy('createdAt', 'desc')
      );
    }

    return onSnapshot(marketQuery, snapshot => {
      let listings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Sort client-side when filtering by status
      if (onlyActive) {
        listings.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime - aTime; // Descending order
        });
      }
      
      callback(listings);
    });
  },

  // Get market statistics
  async getMarketStats() {
    try {
      const listingsSnap = await getDocs(collection(db, COLLECTIONS.MARKET));
      const purchasesSnap = await getDocs(collection(db, COLLECTIONS.MARKET_PURCHASES));

      const stats = {
        totalListings: listingsSnap.size,
        activeListings: 0,
        totalSold: 0,
        totalRevenue: 0,
      };

      listingsSnap.forEach(doc => {
        const data = doc.data();
        if (data.status === 'active') {
          stats.activeListings++;
        }
        stats.totalSold += data.sold || 0;
      });

      purchasesSnap.forEach(doc => {
        const data = doc.data();
        stats.totalRevenue += data.price || 0;
      });

      return stats;
    } catch (error) {
      console.error('Error getting market stats:', error);
      throw error;
    }
  },
};