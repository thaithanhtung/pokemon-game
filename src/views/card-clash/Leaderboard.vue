<template>
  <div class="leaderboard-container">
    <!-- Header -->
    <header class="sticky top-0 bg-white shadow-md z-20">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <router-link
              to="/card-clash/menu"
              class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <span>←</span>
              <span>Back to Menu</span>
            </router-link>
            <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span>🏆</span> Leaderboard
            </h1>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8 max-w-6xl">
      <!-- Leaderboard Tabs -->
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

        <!-- Your Rank Card -->
        <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6 border-2 border-blue-200">
          <h3 class="text-lg font-bold text-gray-800 mb-4">Your Ranking</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="text-center">
              <div class="text-3xl font-bold text-blue-600">#{{ myRank[activeTab] }}</div>
              <div class="text-sm text-gray-600">Rank</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600">{{ myStats[activeTab].score }}</div>
              <div class="text-sm text-gray-600">{{ getScoreLabel(activeTab) }}</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">{{ myStats[activeTab].wins }}</div>
              <div class="text-sm text-gray-600">Wins</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-orange-600">{{ myStats[activeTab].winRate }}%</div>
              <div class="text-sm text-gray-600">Win Rate</div>
            </div>
          </div>
        </div>

        <!-- Top 3 Players -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div
            v-for="(player, index) in topPlayers"
            :key="player.id"
            :class="[
              'relative rounded-xl p-6 text-center transition-all duration-300 hover:shadow-lg',
              index === 0
                ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-400'
                : index === 1
                ? 'bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-400'
                : 'bg-gradient-to-br from-orange-100 to-orange-200 border-2 border-orange-400',
            ]"
          >
            <!-- Crown for top 3 -->
            <div class="absolute -top-4 left-1/2 transform -translate-x-1/2 text-3xl">
              {{ index === 0 ? '👑' : index === 1 ? '🥈' : '🥉' }}
            </div>

            <!-- Player Info -->
            <div class="mt-4">
              <div class="text-4xl mb-2">{{ player.avatar }}</div>
              <h4 class="font-bold text-lg text-gray-800 mb-1">{{ player.name }}</h4>
              <p class="text-sm text-gray-600 mb-3">Level {{ player.level }}</p>
              <div class="text-2xl font-bold" :class="index === 0 ? 'text-yellow-700' : 'text-gray-700'">
                {{ player.score }}
              </div>
              <div class="text-xs text-gray-600">{{ getScoreLabel(activeTab) }}</div>
            </div>
          </div>
        </div>

        <!-- Rankings Table -->
        <div class="bg-gray-50 rounded-xl p-6">
          <table class="w-full">
            <thead>
              <tr class="text-left text-sm text-gray-600 border-b border-gray-200">
                <th class="pb-3">Rank</th>
                <th class="pb-3">Player</th>
                <th class="pb-3">Level</th>
                <th class="pb-3">{{ getScoreLabel(activeTab) }}</th>
                <th class="pb-3">Wins</th>
                <th class="pb-3">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(player, index) in leaderboardData"
                :key="player.id"
                :class="[
                  'border-b border-gray-200 transition-colors',
                  player.isMe ? 'bg-blue-50' : 'hover:bg-gray-100',
                ]"
              >
                <td class="py-4">
                  <div class="flex items-center gap-2">
                    <span class="font-bold" :class="getRankColor(index + 4)">
                      #{{ index + 4 }}
                    </span>
                    <span v-if="player.rankChange > 0" class="text-green-500 text-xs">▲{{ player.rankChange }}</span>
                    <span v-else-if="player.rankChange < 0" class="text-red-500 text-xs">▼{{ Math.abs(player.rankChange) }}</span>
                  </div>
                </td>
                <td class="py-4">
                  <div class="flex items-center gap-3">
                    <span class="text-2xl">{{ player.avatar }}</span>
                    <div>
                      <div class="font-semibold text-gray-800">{{ player.name }}</div>
                      <div v-if="player.isMe" class="text-xs text-blue-600">(You)</div>
                    </div>
                  </div>
                </td>
                <td class="py-4 text-gray-700">{{ player.level }}</td>
                <td class="py-4 font-bold text-gray-800">{{ player.score }}</td>
                <td class="py-4 text-gray-700">{{ player.wins }}</td>
                <td class="py-4">
                  <span class="font-semibold" :class="player.winRate >= 60 ? 'text-green-600' : 'text-gray-700'">
                    {{ player.winRate }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Load More Button -->
          <div class="text-center mt-6">
            <button
              @click="loadMore"
              class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Load More
            </button>
          </div>
        </div>

        <!-- Season Info -->
        <div class="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-bold text-gray-800">Season 1</h4>
              <p class="text-sm text-gray-600">Ends in 14 days</p>
            </div>
            <div class="text-right">
              <div class="text-sm text-gray-600 mb-1">Season Rewards</div>
              <div class="flex gap-2 justify-end">
                <span class="text-xl" title="Top 10: Legendary Pack">👑</span>
                <span class="text-xl" title="Top 50: Premium Pack">🎁</span>
                <span class="text-xl" title="Top 100: Basic Pack">📦</span>
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

const playerStore = usePlayerStore();

// State
const activeTab = ref('level');
const tabs = [
  { id: 'level', name: 'Level' },
  { id: 'pvp', name: 'PvP Rating' },
  { id: 'collection', name: 'Collection' },
  { id: 'weekly', name: 'Weekly Wins' },
];

// Mock data - in real app, this would come from Firebase
const myRank = ref({
  level: 42,
  pvp: 156,
  collection: 89,
  weekly: 23,
});

const myStats = ref({
  level: {
    score: playerStore.player?.level || 1,
    wins: playerStore.player?.wins || 0,
    winRate: playerStore.player?.wins ? Math.round((playerStore.player.wins / (playerStore.player.wins + playerStore.player.losses)) * 100) : 0,
  },
  pvp: {
    score: 1250,
    wins: 45,
    winRate: 68,
  },
  collection: {
    score: playerStore.player?.cards?.length || 0,
    wins: playerStore.player?.wins || 0,
    winRate: 55,
  },
  weekly: {
    score: 12,
    wins: 12,
    winRate: 75,
  },
});

// Mock top 3 players
const topPlayers = ref([
  { id: 1, name: 'AshKetchum', avatar: '🎯', level: 50, score: 2500 },
  { id: 2, name: 'MistyWater', avatar: '💧', level: 48, score: 2350 },
  { id: 3, name: 'BrockRock', avatar: '🪨', level: 47, score: 2200 },
]);

// Mock leaderboard data
const leaderboardData = ref([
  { id: 4, name: 'PikachuFan', avatar: '⚡', level: 45, score: 2100, wins: 180, winRate: 72, rankChange: 2 },
  { id: 5, name: 'CharizardX', avatar: '🔥', level: 44, score: 2050, wins: 165, winRate: 68, rankChange: -1 },
  { id: 6, name: 'VenusaurPro', avatar: '🌿', level: 43, score: 2000, wins: 155, winRate: 65, rankChange: 0 },
  { id: 7, name: playerStore.player?.name || 'You', avatar: '🎮', level: playerStore.player?.level || 1, score: 1950, wins: playerStore.player?.wins || 0, winRate: 55, rankChange: 3, isMe: true },
  { id: 8, name: 'BlastoiseKing', avatar: '🌊', level: 42, score: 1900, wins: 140, winRate: 62, rankChange: -2 },
]);

// Methods
const getScoreLabel = (tab) => {
  switch (tab) {
    case 'level':
      return 'Level';
    case 'pvp':
      return 'Rating';
    case 'collection':
      return 'Cards';
    case 'weekly':
      return 'Weekly Wins';
    default:
      return 'Score';
  }
};

const getRankColor = (rank) => {
  if (rank <= 10) return 'text-orange-600';
  if (rank <= 50) return 'text-purple-600';
  if (rank <= 100) return 'text-blue-600';
  return 'text-gray-600';
};

const loadMore = () => {
  // Mock loading more data
  const newPlayers = Array.from({ length: 10 }, (_, i) => ({
    id: leaderboardData.value.length + i + 10,
    name: `Player${leaderboardData.value.length + i + 1}`,
    avatar: ['🎲', '🎪', '🎨', '🎭'][Math.floor(Math.random() * 4)],
    level: Math.floor(Math.random() * 20) + 20,
    score: Math.floor(Math.random() * 1000) + 1000,
    wins: Math.floor(Math.random() * 100) + 50,
    winRate: Math.floor(Math.random() * 30) + 40,
    rankChange: Math.floor(Math.random() * 5) - 2,
  }));
  leaderboardData.value.push(...newPlayers);
};

onMounted(() => {
  // In real app, fetch leaderboard data from Firebase
  console.log('Loading leaderboard data...');
});
</script>

<style scoped>
.leaderboard-container {
  min-height: 100vh;
  background-color: #f9fafb;
}

/* Custom scrollbar for tables */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>