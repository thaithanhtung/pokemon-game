<template>
  <div class="trading-container">
    <!-- Header -->
    <header class="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg z-20">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <router-link
              to="/card-clash/menu"
              class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 backdrop-blur-sm"
            >
              <span>←</span>
              <span>Back to Menu</span>
            </router-link>
            <h1 class="text-2xl font-bold text-white flex items-center gap-2">
              <span>🏪</span> Trading Market
            </h1>
          </div>
          <div class="flex items-center gap-4 text-white">
            <div class="bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm">
              <span class="text-sm">⚡ {{ playerStore.player.energy }}</span>
            </div>
            <div class="bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm">
              <span class="text-sm">💎 {{ playerStore.player.gems }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8 max-w-7xl">
      <!-- Trading Tabs -->
      <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div class="flex flex-wrap gap-2 mb-6">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-all duration-300',
              activeTab === tab.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ]"
          >
            {{ tab.name }}
          </button>
        </div>

        <!-- Create Trade Tab -->
        <div v-if="activeTab === 'create'" class="space-y-6">
          <div class="grid md:grid-cols-2 gap-6">
            <!-- Your Offer -->
            <div class="bg-gray-50 rounded-xl p-6">
              <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>📤</span> Your Offer
              </h3>

              <!-- Selected Cards -->
              <div class="mb-4">
                <div v-if="yourOffer.cards.length === 0" class="text-center py-8 text-gray-500">
                  Select cards from your collection below
                </div>
                <div v-else class="grid grid-cols-3 gap-2">
                  <div v-for="card in yourOffer.cards" :key="card.id" class="relative group">
                    <img
                      :src="getPokemonSprite(card.pokemonId, card.name)"
                      :alt="card.name"
                      class="w-full rounded-lg border-2"
                      :class="getRarityBorder(card.rarity)"
                    />
                    <button
                      @click="removeFromOffer(card)"
                      class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>

              <!-- Additional Items -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-gray-700">Energy</span>
                  <input
                    v-model.number="yourOffer.energy"
                    type="number"
                    min="0"
                    :max="playerStore.player.energy"
                    class="w-24 px-2 py-1 border rounded-lg"
                  />
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-700">Gems</span>
                  <input
                    v-model.number="yourOffer.gems"
                    type="number"
                    min="0"
                    :max="playerStore.player.gems"
                    class="w-24 px-2 py-1 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            <!-- Their Request -->
            <div class="bg-gray-50 rounded-xl p-6">
              <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>📥</span> Your Request
              </h3>

              <div class="mb-4">
                <input
                  v-model="tradePartner"
                  type="text"
                  placeholder="Enter player name"
                  class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-400 outline-none"
                />
              </div>

              <!-- Request specific cards -->
              <div class="mb-4">
                <label class="text-sm text-gray-600 mb-2 block"
                  >Request specific cards (optional)</label
                >
                <div class="flex gap-2">
                  <input
                    v-model="requestedCardName"
                    type="text"
                    placeholder="Card name"
                    class="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <button
                    @click="addRequestedCard"
                    class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                  >
                    Add
                  </button>
                </div>
                <div class="mt-2 flex flex-wrap gap-2">
                  <span
                    v-for="(card, index) in yourRequest.cards"
                    :key="index"
                    class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {{ card }}
                    <button @click="yourRequest.cards.splice(index, 1)" class="text-red-500">
                      ×
                    </button>
                  </span>
                </div>
              </div>

              <!-- Request items -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-gray-700">Energy</span>
                  <input
                    v-model.number="yourRequest.energy"
                    type="number"
                    min="0"
                    class="w-24 px-2 py-1 border rounded-lg"
                  />
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-700">Gems</span>
                  <input
                    v-model.number="yourRequest.gems"
                    type="number"
                    min="0"
                    class="w-24 px-2 py-1 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Your Collection -->
          <div class="bg-gray-50 rounded-xl p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">Your Collection</h3>
            <div
              class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-64 overflow-y-auto"
            >
              <div
                v-for="card in availableCards"
                :key="card.id"
                @click="addToOffer(card)"
                class="relative cursor-pointer hover:transform hover:scale-105 transition-transform"
              >
                <img
                  :src="getPokemonSprite(card.pokemonId, card.name)"
                  :alt="card.name"
                  class="w-full rounded-lg border-2"
                  :class="getRarityBorder(card.rarity)"
                />
                <div
                  class="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 rounded"
                >
                  x{{ card.count }}
                </div>
              </div>
            </div>
          </div>

          <!-- Send Trade Button -->
          <div class="text-center">
            <button
              @click="sendTradeOffer"
              :disabled="!canSendTrade"
              :class="[
                'px-8 py-3 rounded-lg font-bold text-lg transition-all',
                canSendTrade
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed',
              ]"
            >
              Send Trade Offer
            </button>
          </div>
        </div>

        <!-- Active Trades Tab -->
        <div v-if="activeTab === 'active'" class="space-y-4">
          <div v-if="activeTrades.length === 0" class="text-center py-12 text-gray-500">
            No active trades
          </div>
          <div
            v-for="trade in activeTrades"
            :key="trade.id"
            class="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <span class="text-2xl">{{ trade.type === 'sent' ? '📤' : '📥' }}</span>
                <div>
                  <h4 class="font-bold text-gray-800">
                    {{ trade.type === 'sent' ? 'Trade to' : 'Trade from' }} {{ trade.partner }}
                  </h4>
                  <p class="text-sm text-gray-600">{{ formatDate(trade.createdAt) }}</p>
                </div>
              </div>
              <div class="flex gap-2">
                <button
                  v-if="trade.type === 'received'"
                  @click="acceptTrade(trade)"
                  class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                >
                  Accept
                </button>
                <button
                  @click="cancelTrade(trade)"
                  class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                >
                  {{ trade.type === 'sent' ? 'Cancel' : 'Decline' }}
                </button>
              </div>
            </div>

            <!-- Trade Details -->
            <div class="grid md:grid-cols-2 gap-4">
              <div class="bg-white rounded-lg p-4">
                <h5 class="font-semibold text-gray-700 mb-2">
                  {{ trade.type === 'sent' ? 'Your Offer' : 'Their Offer' }}
                </h5>
                <div class="flex gap-2 mb-2">
                  <img
                    v-for="card in trade.offer.cards"
                    :key="card.id"
                    :src="getPokemonSprite(card.pokemonId, card.name)"
                    :alt="card.name"
                    class="w-12 h-12 rounded border"
                    :class="getRarityBorder(card.rarity)"
                  />
                </div>
                <div class="text-sm text-gray-600">
                  <div v-if="trade.offer.energy > 0">⚡ {{ trade.offer.energy }} Energy</div>
                  <div v-if="trade.offer.gems > 0">💎 {{ trade.offer.gems }} Gems</div>
                </div>
              </div>
              <div class="bg-white rounded-lg p-4">
                <h5 class="font-semibold text-gray-700 mb-2">
                  {{ trade.type === 'sent' ? 'Your Request' : 'Their Request' }}
                </h5>
                <div v-if="trade.request.cards.length > 0" class="mb-2">
                  <div
                    v-for="(card, index) in trade.request.cards"
                    :key="index"
                    class="text-sm text-gray-600"
                  >
                    • {{ card }}
                  </div>
                </div>
                <div class="text-sm text-gray-600">
                  <div v-if="trade.request.energy > 0">⚡ {{ trade.request.energy }} Energy</div>
                  <div v-if="trade.request.gems > 0">💎 {{ trade.request.gems }} Gems</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- History Tab -->
        <div v-if="activeTab === 'history'" class="space-y-4">
          <div v-if="tradeHistory.length === 0" class="text-center py-12 text-gray-500">
            No trade history
          </div>
          <div
            v-for="trade in tradeHistory"
            :key="trade.id"
            class="bg-gray-50 rounded-xl p-4 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ trade.status === 'completed' ? '✅' : '❌' }}</span>
              <div>
                <h4 class="font-semibold text-gray-800">Trade with {{ trade.partner }}</h4>
                <p class="text-sm text-gray-600">{{ formatDate(trade.completedAt) }}</p>
              </div>
            </div>
            <span
              :class="[
                'px-3 py-1 rounded-full text-sm font-medium',
                trade.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700',
              ]"
            >
              {{ trade.status }}
            </span>
          </div>
        </div>

        <!-- Sell Cards Tab -->
        <div v-if="activeTab === 'sell'" class="space-y-6">
          <div class="grid md:grid-cols-2 gap-6">
            <!-- Select Card to Sell -->
            <div class="bg-gray-50 rounded-xl p-6">
              <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>🎯</span> Select Card to Sell
              </h3>

              <div class="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                <div
                  v-for="card in availableCards"
                  :key="card.id"
                  @click="selectCardToSell(card)"
                  :class="[
                    'relative cursor-pointer hover:transform hover:scale-105 transition-transform rounded-lg border-2',
                    sellCard?.id === card.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
                  ]"
                >
                  <img
                    :src="getPokemonSprite(card.pokemonId, card.name)"
                    :alt="card.name"
                    class="w-full rounded-lg"
                  />
                  <div
                    class="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 rounded"
                  >
                    x{{ card.count }}
                  </div>
                  <div class="absolute top-1 left-1 bg-white bg-opacity-90 text-xs px-1 rounded">
                    {{ getRarityName(card.rarity) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Set Price -->
            <div class="bg-gray-50 rounded-xl p-6">
              <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>💰</span> Set Price
              </h3>

              <div v-if="sellCard" class="space-y-4">
                <div class="bg-white rounded-lg p-4">
                  <div class="text-center mb-3">
                    <img
                      :src="getPokemonSprite(sellCard.pokemonId, sellCard.name)"
                      :alt="sellCard.name"
                      class="w-16 h-16 mx-auto"
                    />
                    <h4 class="font-bold text-gray-800 mt-2">{{ sellCard.name }}</h4>
                    <span :class="getRarityClass(sellCard.rarity)">
                      {{ getRarityName(sellCard.rarity) }}
                    </span>
                  </div>
                </div>

                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-gray-700">Energy Price</span>
                    <input
                      v-model.number="sellPrice.energy"
                      type="number"
                      min="0"
                      class="w-24 px-2 py-1 border rounded-lg"
                    />
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-gray-700">Gems Price</span>
                    <input
                      v-model.number="sellPrice.gems"
                      type="number"
                      min="0"
                      class="w-24 px-2 py-1 border rounded-lg"
                    />
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-gray-700">Duration (hours)</span>
                    <select v-model="sellDuration" class="px-2 py-1 border rounded-lg">
                      <option value="6">6 hours</option>
                      <option value="12">12 hours</option>
                      <option value="24">24 hours</option>
                      <option value="48">48 hours</option>
                      <option value="72">72 hours</option>
                    </select>
                  </div>
                </div>

                <div class="bg-blue-50 rounded-lg p-3">
                  <h5 class="font-semibold text-blue-800 mb-2">Market Suggestions</h5>
                  <div class="text-sm text-blue-700">
                    <div>Similar cards sell for:</div>
                    <div>⚡ 200-400 Energy or 💎 50-100 Gems</div>
                  </div>
                </div>

                <button
                  @click="listCardForSale"
                  :disabled="!canListCard"
                  :class="[
                    'w-full py-3 rounded-lg font-bold transition-all',
                    canListCard
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed',
                  ]"
                >
                  List for Sale
                </button>
              </div>

              <div v-else class="text-center py-8 text-gray-500">
                Select a card from your collection to sell
              </div>
            </div>
          </div>
        </div>

        <!-- Market Tab -->
        <div v-if="activeTab === 'market'" class="space-y-6">
          <!-- Search and Filters -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
            <input
              v-model="marketSearch"
              type="text"
              placeholder="Search for cards..."
              class="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-400 outline-none"
            />
            <select
              v-model="marketFilter"
              class="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-400 outline-none"
            >
              <option value="all">All Rarities</option>
              <option value="C">Common</option>
              <option value="R">Rare</option>
              <option value="E">Epic</option>
              <option value="L">Legendary</option>
              <option value="M">Mega</option>
            </select>
            <select
              v-model="marketSortBy"
              class="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-400 outline-none"
            >
              <option value="price">Sort by Price</option>
              <option value="rarity">Sort by Rarity</option>
              <option value="name">Sort by Name</option>
              <option value="time">Sort by Time</option>
            </select>
            <button
              @click="marketSortOrder = marketSortOrder === 'asc' ? 'desc' : 'asc'"
              class="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <span>{{ marketSortOrder === 'asc' ? '↑' : '↓' }}</span>
              <span>{{ marketSortOrder === 'asc' ? 'Ascending' : 'Descending' }}</span>
            </button>
          </div>

          <!-- Market Listings -->
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="listing in filteredListings"
              :key="listing.id"
              class="bg-white rounded-xl p-4 shadow hover:shadow-lg transition-shadow"
            >
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-bold text-gray-800">{{ listing.card.name }}</h4>
                <span :class="getRarityClass(listing.card.rarity)">
                  {{ getRarityName(listing.card.rarity) }}
                </span>
              </div>

              <div class="text-center mb-3">
                <img
                  :src="getPokemonSprite(listing.card.pokemonId, listing.card.name)"
                  :alt="listing.card.name"
                  class="w-24 h-24 mx-auto"
                />
              </div>

              <div class="text-sm text-gray-600 mb-3">
                <div>Seller: {{ listing.seller }}</div>
                <div class="font-bold text-gray-800">
                  Price:
                  <span v-if="listing.price.energy > 0">⚡ {{ listing.price.energy }}</span>
                  <span v-if="listing.price.gems > 0">💎 {{ listing.price.gems }}</span>
                </div>
              </div>

              <button
                @click="buyFromMarket(listing)"
                :disabled="!canAfford(listing.price)"
                :class="[
                  'w-full py-2 rounded-lg font-medium transition-colors',
                  canAfford(listing.price)
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed',
                ]"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>

        <!-- Market Stats Tab -->
        <div v-if="activeTab === 'stats'" class="space-y-6">
          <!-- Stats Overview -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-bold">Total Listings</h3>
                  <p class="text-3xl font-bold">{{ marketStats.totalListings }}</p>
                </div>
                <span class="text-4xl">📊</span>
              </div>
            </div>
            <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-bold">Avg Energy Price</h3>
                  <p class="text-3xl font-bold">{{ marketStats.averagePrice.energy }}</p>
                </div>
                <span class="text-4xl">⚡</span>
              </div>
            </div>
            <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-bold">Avg Gems Price</h3>
                  <p class="text-3xl font-bold">{{ marketStats.averagePrice.gems }}</p>
                </div>
                <span class="text-4xl">💎</span>
              </div>
            </div>
          </div>

          <!-- Top Cards -->
          <div class="bg-white rounded-xl p-6 shadow-lg">
            <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🏆</span> Top Selling Cards
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="(card, index) in marketStats.topCards"
                :key="card.id"
                class="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div class="flex items-center gap-3">
                  <div class="text-2xl font-bold text-gray-400">#{{ index + 1 }}</div>
                  <img
                    :src="getPokemonSprite(card.pokemonId, card.name)"
                    :alt="card.name"
                    class="w-12 h-12"
                  />
                  <div class="flex-1">
                    <h4 class="font-bold text-gray-800">{{ card.name }}</h4>
                    <span :class="getRarityClass(card.rarity)">
                      {{ getRarityName(card.rarity) }}
                    </span>
                    <div class="text-sm text-gray-600 mt-1">
                      <div>{{ card.sales }} sales</div>
                      <div>Avg: ⚡{{ card.avgEnergy }} 💎{{ card.avgGems }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Price Trends -->
          <div class="bg-white rounded-xl p-6 shadow-lg">
            <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📈</span> Price Trends
            </h3>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="text-center py-8 text-gray-500">
                <span class="text-4xl mb-2 block">📊</span>
                <p>Price charts coming soon!</p>
                <p class="text-sm">Track card price history and trends</p>
              </div>
            </div>
          </div>

          <!-- Market Activity -->
          <div class="bg-white rounded-xl p-6 shadow-lg">
            <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>⚡</span> Recent Market Activity
            </h3>
            <div class="space-y-3">
              <div
                v-for="activity in recentActivity"
                :key="activity.id"
                class="flex items-center justify-between bg-gray-50 rounded-lg p-3"
              >
                <div class="flex items-center gap-3">
                  <span class="text-2xl">{{ activity.type === 'sale' ? '💰' : '🛒' }}</span>
                  <div>
                    <div class="font-semibold text-gray-800">{{ activity.cardName }}</div>
                    <div class="text-sm text-gray-600">{{ activity.action }}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-gray-800">
                    <span v-if="activity.price.energy > 0">⚡ {{ activity.price.energy }}</span>
                    <span v-if="activity.price.gems > 0">💎 {{ activity.price.gems }}</span>
                  </div>
                  <div class="text-sm text-gray-600">{{ formatTime(activity.timestamp) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { usePlayerStore } from '@/stores/player';
import { useToast } from '@/composables/useToast';
import { pokemonList } from '@/data/pokemon';

const playerStore = usePlayerStore();
const toast = useToast();

// Helper function to get Pokemon type
const getPokemonType = (pokemonId) => {
  const pokemon = pokemonList.find(p => p.id === pokemonId);
  return pokemon?.types?.[0] || 'normal';
};

// State
const activeTab = ref('market');
const tabs = [
  { id: 'market', name: '📈 Market', icon: '📈' },
  { id: 'sell', name: '💰 Sell Cards', icon: '💰' },
  { id: 'create', name: '🤝 Create Trade', icon: '🤝' },
  { id: 'active', name: '⏳ Active Trades', icon: '⏳' },
  { id: 'history', name: '📜 History', icon: '📜' },
  { id: 'stats', name: '📊 Market Stats', icon: '📊' },
];

// Create Trade State
const tradePartner = ref('');
const requestedCardName = ref('');
const yourOffer = ref({
  cards: [],
  energy: 0,
  gems: 0,
});
const yourRequest = ref({
  cards: [],
  energy: 0,
  gems: 0,
});

// Mock data - in real app, this would come from Firebase
const activeTrades = ref([
  {
    id: 1,
    type: 'received',
    partner: 'AshKetchum',
    createdAt: new Date(Date.now() - 3600000),
    offer: {
      cards: [{ id: 1, pokemonId: 25, name: 'Pikachu', rarity: 'R' }],
      energy: 100,
      gems: 0,
    },
    request: {
      cards: ['Charizard'],
      energy: 0,
      gems: 50,
    },
  },
  {
    id: 2,
    type: 'sent',
    partner: 'MistyWater',
    createdAt: new Date(Date.now() - 7200000),
    offer: {
      cards: [
        { id: 2, pokemonId: 7, name: 'Squirtle', rarity: 'C' },
        { id: 3, pokemonId: 8, name: 'Wartortle', rarity: 'C' },
      ],
      energy: 0,
      gems: 20,
    },
    request: {
      cards: [],
      energy: 200,
      gems: 0,
    },
  },
]);

const tradeHistory = ref([
  {
    id: 1,
    partner: 'BrockRock',
    completedAt: new Date(Date.now() - 86400000),
    status: 'completed',
  },
  {
    id: 2,
    partner: 'TeamRocket',
    completedAt: new Date(Date.now() - 172800000),
    status: 'cancelled',
  },
]);

// Market State
const marketSearch = ref('');
const marketFilter = ref('all');
const marketSortBy = ref('price'); // price, rarity, name, time
const marketSortOrder = ref('asc'); // asc, desc

// Sell Cards State
const sellCard = ref(null);
const sellPrice = ref({ energy: 0, gems: 0 });
const sellDuration = ref(24); // hours

// Market Stats State
const marketStats = ref({
  totalListings: 0,
  averagePrice: { energy: 0, gems: 0 },
  topCards: [],
  priceHistory: [],
});

const marketListings = ref([
  // Legendary Pokemon
  {
    id: 1,
    card: { id: 1, pokemonId: 6, name: 'Charizard', rarity: 'L' },
    seller: 'DragonMaster',
    price: { energy: 0, gems: 500 },
  },
  {
    id: 2,
    card: { id: 2, pokemonId: 144, name: 'Articuno', rarity: 'L' },
    seller: 'IceCold',
    price: { energy: 1000, gems: 200 },
  },
  {
    id: 3,
    card: { id: 3, pokemonId: 150, name: 'Mewtwo', rarity: 'L' },
    seller: 'PsychicPower',
    price: { energy: 0, gems: 1000 },
  },
  {
    id: 4,
    card: { id: 4, pokemonId: 145, name: 'Zapdos', rarity: 'L' },
    seller: 'ThunderLord',
    price: { energy: 800, gems: 300 },
  },
  {
    id: 5,
    card: { id: 5, pokemonId: 146, name: 'Moltres', rarity: 'L' },
    seller: 'FlameWing',
    price: { energy: 900, gems: 250 },
  },
  {
    id: 6,
    card: { id: 6, pokemonId: 151, name: 'Mew', rarity: 'L' },
    seller: 'MythicTrader',
    price: { energy: 0, gems: 1500 },
  },
  {
    id: 7,
    card: { id: 7, pokemonId: 149, name: 'Dragonite', rarity: 'L' },
    seller: 'DragonKeeper',
    price: { energy: 600, gems: 400 },
  },
  // Mega Pokemon
  {
    id: 34,
    card: { id: 34, pokemonId: 6, name: 'Mega Charizard X', rarity: 'M' },
    seller: 'MegaCollector',
    price: { energy: 0, gems: 2000 },
  },
  {
    id: 35,
    card: { id: 35, pokemonId: 6, name: 'Mega Charizard Y', rarity: 'M' },
    seller: 'SkyMaster',
    price: { energy: 0, gems: 2000 },
  },
  {
    id: 36,
    card: { id: 36, pokemonId: 9, name: 'Mega Blastoise', rarity: 'M' },
    seller: 'WaterCannon',
    price: { energy: 1800, gems: 800 },
  },
  {
    id: 37,
    card: { id: 37, pokemonId: 3, name: 'Mega Venusaur', rarity: 'M' },
    seller: 'PlantMega',
    price: { energy: 1700, gems: 900 },
  },
  {
    id: 38,
    card: { id: 38, pokemonId: 150, name: 'Mega Mewtwo X', rarity: 'M' },
    seller: 'PsychicSupreme',
    price: { energy: 0, gems: 3000 },
  },
  {
    id: 39,
    card: { id: 39, pokemonId: 150, name: 'Mega Mewtwo Y', rarity: 'M' },
    seller: 'MindMaster',
    price: { energy: 0, gems: 3000 },
  },
  {
    id: 40,
    card: { id: 40, pokemonId: 94, name: 'Mega Gengar', rarity: 'M' },
    seller: 'ShadowKing',
    price: { energy: 2000, gems: 500 },
  },
  {
    id: 41,
    card: { id: 41, pokemonId: 65, name: 'Mega Alakazam', rarity: 'M' },
    seller: 'MegaMind',
    price: { energy: 1500, gems: 1000 },
  },
  {
    id: 42,
    card: { id: 42, pokemonId: 130, name: 'Mega Gyarados', rarity: 'M' },
    seller: 'SeaDragon',
    price: { energy: 1600, gems: 700 },
  },
  {
    id: 43,
    card: { id: 43, pokemonId: 142, name: 'Mega Aerodactyl', rarity: 'M' },
    seller: 'FossilHunter',
    price: { energy: 1400, gems: 1100 },
  },
  {
    id: 44,
    card: { id: 44, pokemonId: 127, name: 'Mega Pinsir', rarity: 'M' },
    seller: 'BugMega',
    price: { energy: 1300, gems: 600 },
  },
  {
    id: 45,
    card: { id: 45, pokemonId: 115, name: 'Mega Kangaskhan', rarity: 'M' },
    seller: 'ParentPower',
    price: { energy: 1500, gems: 800 },
  },
  {
    id: 46,
    card: { id: 46, pokemonId: 181, name: 'Mega Ampharos', rarity: 'M' },
    seller: 'ElectricDragon',
    price: { energy: 1400, gems: 900 },
  },
  {
    id: 47,
    card: { id: 47, pokemonId: 80, name: 'Mega Slowbro', rarity: 'M' },
    seller: 'SlowMega',
    price: { energy: 1200, gems: 500 },
  },
  {
    id: 48,
    card: { id: 48, pokemonId: 248, name: 'Mega Tyranitar', rarity: 'M' },
    seller: 'RockTitan',
    price: { energy: 2200, gems: 1000 },
  },
  {
    id: 49,
    card: { id: 49, pokemonId: 254, name: 'Mega Sceptile', rarity: 'M' },
    seller: 'ForestBlade',
    price: { energy: 1600, gems: 800 },
  },
  {
    id: 50,
    card: { id: 50, pokemonId: 257, name: 'Mega Blaziken', rarity: 'M' },
    seller: 'FireFighter',
    price: { energy: 1800, gems: 700 },
  },
  {
    id: 51,
    card: { id: 51, pokemonId: 260, name: 'Mega Swampert', rarity: 'M' },
    seller: 'MudKing',
    price: { energy: 1700, gems: 750 },
  },
  {
    id: 52,
    card: { id: 52, pokemonId: 448, name: 'Mega Lucario', rarity: 'M' },
    seller: 'AuraMaster',
    price: { energy: 2000, gems: 1200 },
  },
  {
    id: 53,
    card: { id: 53, pokemonId: 445, name: 'Mega Garchomp', rarity: 'M' },
    seller: 'LandShark',
    price: { energy: 2500, gems: 1500 },
  },
  // Epic Pokemon
  {
    id: 8,
    card: { id: 8, pokemonId: 94, name: 'Gengar', rarity: 'E' },
    seller: 'GhostBuster',
    price: { energy: 500, gems: 0 },
  },
  {
    id: 9,
    card: { id: 9, pokemonId: 65, name: 'Alakazam', rarity: 'E' },
    seller: 'PsychicMind',
    price: { energy: 400, gems: 100 },
  },
  {
    id: 10,
    card: { id: 10, pokemonId: 68, name: 'Machamp', rarity: 'E' },
    seller: 'FightingChamp',
    price: { energy: 350, gems: 150 },
  },
  {
    id: 11,
    card: { id: 11, pokemonId: 131, name: 'Lapras', rarity: 'E' },
    seller: 'WaterRider',
    price: { energy: 450, gems: 0 },
  },
  {
    id: 12,
    card: { id: 12, pokemonId: 143, name: 'Snorlax', rarity: 'E' },
    seller: 'SleepyGiant',
    price: { energy: 300, gems: 200 },
  },
  {
    id: 13,
    card: { id: 13, pokemonId: 130, name: 'Gyarados', rarity: 'E' },
    seller: 'SeaSerpent',
    price: { energy: 400, gems: 50 },
  },
  {
    id: 14,
    card: { id: 14, pokemonId: 59, name: 'Arcanine', rarity: 'E' },
    seller: 'FireDog',
    price: { energy: 350, gems: 100 },
  },
]);

// Computed
const availableCards = computed(() => {
  const cardMap = {};
  playerStore.player?.cards?.forEach(card => {
    if (!cardMap[card.pokemonId]) {
      cardMap[card.pokemonId] = { ...card, count: 1 };
    } else {
      cardMap[card.pokemonId].count++;
    }
  });

  // Filter out cards already in offer
  const offeredIds = yourOffer.value.cards.map(c => c.pokemonId);
  return Object.values(cardMap).filter(card => !offeredIds.includes(card.pokemonId));
});

const canSendTrade = computed(() => {
  return (
    tradePartner.value &&
    (yourOffer.value.cards.length > 0 || yourOffer.value.energy > 0 || yourOffer.value.gems > 0)
  );
});

const filteredListings = computed(() => {
  let filtered = marketListings.value.filter(listing => {
    const matchesSearch =
      !marketSearch.value ||
      listing.card.name.toLowerCase().includes(marketSearch.value.toLowerCase());
    const matchesFilter =
      marketFilter.value === 'all' || listing.card.rarity === marketFilter.value;
    return matchesSearch && matchesFilter;
  });

  // Sort listings
  filtered.sort((a, b) => {
    let aValue, bValue;

    switch (marketSortBy.value) {
      case 'price':
        aValue = a.price.energy + a.price.gems * 10; // Gems worth 10x energy
        bValue = b.price.energy + b.price.gems * 10;
        break;
      case 'rarity':
        const rarityOrder = { L: 4, E: 3, R: 2, C: 1 };
        aValue = rarityOrder[a.card.rarity] || 0;
        bValue = rarityOrder[b.card.rarity] || 0;
        break;
      case 'name':
        aValue = a.card.name.toLowerCase();
        bValue = b.card.name.toLowerCase();
        break;
      case 'time':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return marketSortOrder.value === 'asc' ? -1 : 1;
    if (aValue > bValue) return marketSortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });

  return filtered;
});

const canListCard = computed(() => {
  return (
    sellCard.value &&
    (sellPrice.value.energy > 0 || sellPrice.value.gems > 0) &&
    sellDuration.value > 0
  );
});

const recentActivity = ref([
  {
    id: 1,
    type: 'sale',
    cardName: 'Charizard',
    action: 'Sold by DragonMaster',
    price: { energy: 0, gems: 500 },
    timestamp: new Date(Date.now() - 300000), // 5 minutes ago
  },
  {
    id: 2,
    type: 'purchase',
    cardName: 'Pikachu',
    action: 'Bought by AshKetchum',
    price: { energy: 200, gems: 0 },
    timestamp: new Date(Date.now() - 600000), // 10 minutes ago
  },
  {
    id: 3,
    type: 'sale',
    cardName: 'Mewtwo',
    action: 'Sold by PsychicPower',
    price: { energy: 0, gems: 1000 },
    timestamp: new Date(Date.now() - 900000), // 15 minutes ago
  },
  {
    id: 4,
    type: 'purchase',
    cardName: 'Eevee',
    action: 'Bought by EvolutionFan',
    price: { energy: 250, gems: 0 },
    timestamp: new Date(Date.now() - 1200000), // 20 minutes ago
  },
  {
    id: 5,
    type: 'sale',
    cardName: 'Dragonite',
    action: 'Sold by DragonKeeper',
    price: { energy: 600, gems: 400 },
    timestamp: new Date(Date.now() - 1500000), // 25 minutes ago
  },
  {
    id: 6,
    type: 'purchase',
    cardName: 'Bulbasaur',
    action: 'Bought by GrassTrainer',
    price: { energy: 50, gems: 0 },
    timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
  },
  {
    id: 7,
    type: 'sale',
    cardName: 'Alakazam',
    action: 'Sold by PsychicMind',
    price: { energy: 400, gems: 100 },
    timestamp: new Date(Date.now() - 2100000), // 35 minutes ago
  },
  {
    id: 8,
    type: 'purchase',
    cardName: 'Lapras',
    action: 'Bought by WaterTrainer',
    price: { energy: 450, gems: 0 },
    timestamp: new Date(Date.now() - 2400000), // 40 minutes ago
  },
  {
    id: 9,
    type: 'sale',
    cardName: 'Mega Charizard X',
    action: 'Sold by MegaCollector',
    price: { energy: 0, gems: 2000 },
    timestamp: new Date(Date.now() - 2700000), // 45 minutes ago
  },
  {
    id: 10,
    type: 'purchase',
    cardName: 'Mega Lucario',
    action: 'Bought by AuraKnight',
    price: { energy: 2000, gems: 1200 },
    timestamp: new Date(Date.now() - 3000000), // 50 minutes ago
  },
]);

// Methods
const getPokemonSprite = (pokemonId, name) => {
  // Special handling for Mega Pokemon
  if (name && name.toLowerCase().includes('mega')) {
    // For Mega Pokemon, we'll use the base form sprite
    // Since PokeAPI doesn't have direct mega sprites in the standard path
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
  }
  
  // For Pokemon with IDs > 649, use a different sprite source or fallback
  if (pokemonId > 649) {
    // Use official artwork for newer Pokemon
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
  }
  
  // Standard sprite URL for regular Pokemon
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
};

const getRarityBorder = rarity => {
  const borders = {
    C: 'border-gray-300',
    R: 'border-blue-400',
    E: 'border-purple-400',
    L: 'border-orange-400',
    M: 'border-pink-500',
  };
  return borders[rarity] || borders.C;
};

const getRarityClass = rarity => {
  const classes = {
    C: 'text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs',
    R: 'text-blue-600 bg-blue-100 px-2 py-1 rounded text-xs',
    E: 'text-purple-600 bg-purple-100 px-2 py-1 rounded text-xs',
    L: 'text-orange-600 bg-orange-100 px-2 py-1 rounded text-xs',
    M: 'text-pink-600 bg-pink-100 px-2 py-1 rounded text-xs font-bold',
  };
  return classes[rarity] || classes.C;
};

const getRarityName = rarity => {
  const names = {
    C: 'Common',
    R: 'Rare',
    E: 'Epic',
    L: 'Legendary',
    M: 'Mega',
  };
  return names[rarity] || 'Common';
};

const formatDate = date => {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  return `${days} days ago`;
};

const formatTime = date => {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return '1d+ ago';
};

const selectCardToSell = card => {
  sellCard.value = card;
  // Reset price when selecting new card
  sellPrice.value = { energy: 0, gems: 0 };
};

const listCardForSale = async () => {
  if (!canListCard.value) return;

  // Create new listing
  const newListing = {
    id: Date.now(),
    card: { ...sellCard.value },
    seller: 'You', // In real app, use actual username
    price: { ...sellPrice.value },
    duration: sellDuration.value,
    createdAt: new Date(),
  };

  // Add to market listings
  marketListings.value.push(newListing);

  // Remove card from player's collection
  const cardIndex = playerStore.player.cards.findIndex(c => c.id === sellCard.value.id);
  if (cardIndex > -1) {
    playerStore.player.cards.splice(cardIndex, 1);
  }

  // Update player data
  await playerStore.updateUserData({
    cards: playerStore.player.cards,
  });

  // Reset form
  sellCard.value = null;
  sellPrice.value = { energy: 0, gems: 0 };
  sellDuration.value = 24;

  // Update market stats
  updateMarketStats();

  toast.success('Card Listed!', `${sellCard.value?.name} has been listed for sale`);
};

const updateMarketStats = () => {
  // Calculate total listings
  marketStats.value.totalListings = marketListings.value.length;

  // Calculate average prices
  if (marketListings.value.length > 0) {
    const totalEnergy = marketListings.value.reduce(
      (sum, listing) => sum + listing.price.energy,
      0
    );
    const totalGems = marketListings.value.reduce((sum, listing) => sum + listing.price.gems, 0);

    marketStats.value.averagePrice.energy = Math.round(totalEnergy / marketListings.value.length);
    marketStats.value.averagePrice.gems = Math.round(totalGems / marketListings.value.length);
  }

  // Calculate top cards (mock data for now)
  marketStats.value.topCards = [
    {
      id: 1,
      pokemonId: 6,
      name: 'Charizard',
      rarity: 'L',
      sales: 42,
      avgEnergy: 0,
      avgGems: 450,
    },
    {
      id: 2,
      pokemonId: 150,
      name: 'Mewtwo',
      rarity: 'L',
      sales: 38,
      avgEnergy: 0,
      avgGems: 800,
    },
    {
      id: 3,
      pokemonId: 25,
      name: 'Pikachu',
      rarity: 'R',
      sales: 67,
      avgEnergy: 180,
      avgGems: 0,
    },
    {
      id: 4,
      pokemonId: 151,
      name: 'Mew',
      rarity: 'L',
      sales: 28,
      avgEnergy: 0,
      avgGems: 1500,
    },
    {
      id: 5,
      pokemonId: 133,
      name: 'Eevee',
      rarity: 'R',
      sales: 54,
      avgEnergy: 250,
      avgGems: 0,
    },
    {
      id: 6,
      pokemonId: 94,
      name: 'Gengar',
      rarity: 'E',
      sales: 31,
      avgEnergy: 500,
      avgGems: 0,
    },
    {
      id: 7,
      pokemonId: 6,
      name: 'Mega Charizard X',
      rarity: 'M',
      sales: 18,
      avgEnergy: 0,
      avgGems: 2000,
    },
    {
      id: 8,
      pokemonId: 448,
      name: 'Mega Lucario',
      rarity: 'M',
      sales: 15,
      avgEnergy: 2000,
      avgGems: 1200,
    },
  ];
};

const addToOffer = card => {
  if (yourOffer.value.cards.length >= 5) {
    toast.error('Trade Limit', 'You can only offer up to 5 cards per trade');
    return;
  }
  yourOffer.value.cards.push(card);
};

const removeFromOffer = card => {
  const index = yourOffer.value.cards.findIndex(c => c.id === card.id);
  if (index > -1) {
    yourOffer.value.cards.splice(index, 1);
  }
};

const addRequestedCard = () => {
  if (requestedCardName.value && yourRequest.value.cards.length < 5) {
    yourRequest.value.cards.push(requestedCardName.value);
    requestedCardName.value = '';
  }
};

const sendTradeOffer = async () => {
  if (!canSendTrade.value) return;

  // In real app, this would create a trade in Firebase
  const newTrade = {
    id: Date.now(),
    type: 'sent',
    partner: tradePartner.value,
    createdAt: new Date(),
    offer: { ...yourOffer.value },
    request: { ...yourRequest.value },
  };

  activeTrades.value.push(newTrade);

  // Reset form
  yourOffer.value = { cards: [], energy: 0, gems: 0 };
  yourRequest.value = { cards: [], energy: 0, gems: 0 };
  tradePartner.value = '';

  toast.success('Trade Sent!', `Your trade offer has been sent to ${newTrade.partner}`);
  activeTab.value = 'active';
};

const acceptTrade = async trade => {
  // In real app, this would update Firebase and transfer items

  // Check if player has requested items
  const hasRequestedCards = true; // Simplified check
  const hasEnergy = playerStore.player.energy >= trade.request.energy;
  const hasGems = playerStore.player.gems >= trade.request.gems;

  if (!hasRequestedCards || !hasEnergy || !hasGems) {
    toast.error('Cannot Accept', "You don't have the requested items");
    return;
  }

  // Remove from active trades
  const index = activeTrades.value.findIndex(t => t.id === trade.id);
  if (index > -1) {
    activeTrades.value.splice(index, 1);
  }

  // Add to history
  tradeHistory.value.unshift({
    id: trade.id,
    partner: trade.partner,
    completedAt: new Date(),
    status: 'completed',
  });

  toast.success('Trade Completed!', `You've successfully traded with ${trade.partner}`);
};

const cancelTrade = trade => {
  const index = activeTrades.value.findIndex(t => t.id === trade.id);
  if (index > -1) {
    activeTrades.value.splice(index, 1);
  }

  // Add to history
  tradeHistory.value.unshift({
    id: trade.id,
    partner: trade.partner,
    completedAt: new Date(),
    status: 'cancelled',
  });

  toast.info('Trade Cancelled', `The trade with ${trade.partner} has been cancelled`);
};

const canAfford = price => {
  return playerStore.player.energy >= price.energy && playerStore.player.gems >= price.gems;
};

const buyFromMarket = async listing => {
  if (!canAfford(listing.price)) return;

  try {
    // Deduct price
    playerStore.player.energy -= listing.price.energy;
    playerStore.player.gems -= listing.price.gems;

    // Create a proper card object for the collection
    const purchasedCard = {
      id: `pokemon_${listing.card.pokemonId}`,
      uid: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: listing.card.name,
      pokemonId: listing.card.pokemonId,
      rarity: listing.card.rarity,
      type: 'pokemon',
      pokemonType: listing.card.pokemonType || getPokemonType(listing.card.pokemonId),
      level: 1,
      hp: listing.card.hp || 100,
      maxHp: listing.card.hp || 100,
      atk: listing.card.atk || 50,
      def: listing.card.def || 50,
      spd: listing.card.spd || 50,
      energy: listing.card.energy || Math.ceil((listing.card.hp || 100) / 50),
      image: getPokemonSprite(listing.card.pokemonId, listing.card.name),
      skills: listing.card.skills || [
        {
          name: 'Tackle',
          damage: 20,
          energy: 1,
          description: 'A basic physical attack'
        }
      ],
      timestamp: Date.now(),
      source: 'market',
      purchasePrice: { ...listing.price },
    };

    // Add card to local collection
    playerStore.player.cards.push(purchasedCard);

    // Remove from market
    const index = marketListings.value.findIndex(l => l.id === listing.id);
    if (index > -1) {
      marketListings.value.splice(index, 1);
    }

    // Get Firebase instance
    const firebase = playerStore.getFirebase();
    
    // Save to Firebase using the same pattern as pack opening
    if (firebase?.isAuthenticated?.value) {
      // Save the purchased card to user's collection in Firebase
      await firebase.addCardsFromPack([purchasedCard], 'market_purchase');
      
      // Update player data (energy/gems) in Firebase
      await playerStore.updateUserData({
        energy: playerStore.player.energy,
        gems: playerStore.player.gems,
      });

      // Add to recent activity
      recentActivity.value.unshift({
        id: Date.now(),
        type: 'purchase',
        cardName: listing.card.name,
        action: `Bought by You`,
        price: { ...listing.price },
        timestamp: new Date(),
      });

      // Keep only last 10 activities
      if (recentActivity.value.length > 10) {
        recentActivity.value = recentActivity.value.slice(0, 10);
      }

      toast.success('Purchase Complete!', `You bought ${listing.card.name} from ${listing.seller}`);
    } else {
      // If not authenticated, still update locally but warn
      toast.warning('Purchase saved locally', 'Sign in to save your collection permanently');
    }
  } catch (error) {
    console.error('Error buying from market:', error);
    
    // Rollback the transaction on error
    playerStore.player.energy += listing.price.energy;
    playerStore.player.gems += listing.price.gems;
    
    // Remove the card that was added
    const cardIndex = playerStore.player.cards.findIndex(c => c.name === listing.card.name && c.source === 'market');
    if (cardIndex > -1) {
      playerStore.player.cards.splice(cardIndex, 1);
    }
    
    toast.error('Purchase Failed', 'There was an error completing your purchase');
  }
};

onMounted(() => {
  // Initialize market stats
  updateMarketStats();

  // In real app, load active trades and market listings from Firebase
  console.log('Loading trading data...');
});
</script>

<style scoped>
.trading-container {
  min-height: 100vh;
  background-color: #f9fafb;
}

/* Custom scrollbar */
.max-h-64::-webkit-scrollbar {
  width: 8px;
}

.max-h-64::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.max-h-64::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.max-h-64::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
