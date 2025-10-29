// Pokemon types
export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  sprite: string;
  generation?: number;
  category?: string;
  baseId?: number;
  stats?: Array<{
    base_stat: number;
    effort: number;
    stat: {
      name: string;
      url: string;
    };
  }>;
  abilities?: Array<{
    ability: {
      name: string;
      url: string;
    };
    is_hidden: boolean;
  }>;
  height?: number;
  weight?: number;
}

export interface PokemonDetails {
  id: number;
  name: string;
  types: Array<{
    slot: number;
    type: {
      name: string;
      url: string;
    };
  }>;
  sprites: {
    front_default: string;
    other: {
      'official-artwork': {
        front_default: string;
      };
      home: {
        front_default: string;
      };
    };
  };
  height: number;
  weight: number;
  abilities: Array<{
    ability: {
      name: string;
      url: string;
    };
    is_hidden: boolean;
  }>;
  stats: Array<{
    base_stat: number;
    effort: number;
    stat: {
      name: string;
      url: string;
    };
  }>;
  moves: Array<{
    move: {
      name: string;
      url: string;
    };
  }>;
  species: {
    name: string;
    url: string;
  };
}

// Market types
export interface MarketListing {
  id: string;
  pokemonId: number;
  name: string;
  sprite: string;
  types: string[];
  category: 'legendary' | 'mythical' | 'mega' | 'ultra-beast';
  price: number;
  stock: number; // -1 for unlimited
  status: 'active' | 'inactive';
  sold: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketPurchase {
  id: string;
  userId: string;
  listingId: string;
  pokemonId: number;
  pokemonName: string;
  price: number;
  purchasedAt: Date;
}

// User types
export interface User {
  id: string;
  uid: string;
  email?: string;
  displayName?: string;
  coins: number;
  level: number;
  experience: number;
  wins: number;
  losses: number;
  pvpRank?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPokemon {
  id: string;
  pokemonId: number;
  name: string;
  nickname: string;
  sprite: string;
  types: string[];
  category?: string;
  level: number;
  experience: number;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  location?: 'farm' | 'pc' | 'team';
  x?: number;
  z?: number;
  obtainedFrom: 'market' | 'pack' | 'reward' | 'starter';
  obtainedAt: string;
  userId: string;
}

// Card types
export interface Card {
  id: string;
  uid: string;
  pokemonId: number;
  name: string;
  type: 'pokemon' | 'skill' | 'item';
  rarity: 'C' | 'R' | 'E' | 'L'; // Common, Rare, Epic, Legendary
  level: number;
  obtainedAt: number;
  obtainedFrom: string;
  isNew?: boolean;
}

export interface Deck {
  id: string;
  name: string;
  cards: string[]; // Card UIDs
  createdAt: number;
  updatedAt: number;
}

// Battle types
export interface Battle {
  id: string;
  userId: string;
  opponentId?: string;
  mode: 'ai' | 'pvp' | 'campaign';
  result: 'win' | 'loss' | 'draw';
  score: number;
  rewards?: {
    coins?: number;
    experience?: number;
    cards?: Card[];
  };
  timestamp: Date;
}

// Pack types
export interface Pack {
  id: string;
  type: 'basic' | 'premium' | 'legendary';
  cards: Card[];
  openedAt: number;
  cost: number;
}

// Farm types
export interface FarmLayout {
  layout: number[][];
  buildings: Array<{
    id: string;
    type: string;
    x: number;
    z: number;
  }>;
  crops: Array<{
    id: string;
    type: string;
    x: number;
    z: number;
    plantedAt: number;
    harvestTime: number;
  }>;
  updatedAt: Date;
}

export interface FarmResources {
  coins: number;
  berries: Record<string, number>;
  materials: Record<string, number>;
  updatedAt: Date;
}