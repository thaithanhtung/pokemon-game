<template>
  <div class="achievements-container">
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
              <span>🏅</span> Achievements
            </h1>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8 max-w-7xl">
      <!-- Achievement Stats -->
      <div class="bg-white rounded-xl p-6 shadow-lg mb-8">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div class="text-3xl font-bold text-blue-600">{{ completedCount }}</div>
            <div class="text-sm text-gray-600">Completed</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-purple-600">{{ totalCount }}</div>
            <div class="text-sm text-gray-600">Total</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-orange-600">{{ totalPoints }}</div>
            <div class="text-sm text-gray-600">Points</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-green-600">{{ completionPercentage }}%</div>
            <div class="text-sm text-gray-600">Progress</div>
          </div>
        </div>
        
        <!-- Progress Bar -->
        <div class="mt-6">
          <div class="bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              class="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500"
              :style="{ width: `${completionPercentage}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Category Tabs -->
      <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div class="flex flex-wrap gap-2 mb-6">
          <button
            v-for="category in categories"
            :key="category.id"
            @click="activeCategory = category.id"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-all duration-300',
              activeCategory === category.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ]"
          >
            <span class="mr-2">{{ category.icon }}</span>
            {{ category.name }}
          </button>
        </div>

        <!-- Achievements Grid -->
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="achievement in filteredAchievements"
            :key="achievement.id"
            :class="[
              'relative rounded-xl p-6 transition-all duration-300',
              achievement.completed
                ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-400'
                : achievement.progress > 0
                ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-400'
                : 'bg-gray-50 border-2 border-gray-300',
            ]"
          >
            <!-- Achievement Icon -->
            <div class="flex items-start justify-between mb-3">
              <div class="text-4xl">{{ achievement.icon }}</div>
              <div class="text-right">
                <div class="text-2xl font-bold" :class="achievement.completed ? 'text-green-600' : 'text-gray-600'">
                  {{ achievement.points }}
                </div>
                <div class="text-xs text-gray-500">points</div>
              </div>
            </div>

            <!-- Achievement Info -->
            <h3 class="font-bold text-gray-800 mb-1">{{ achievement.name }}</h3>
            <p class="text-sm text-gray-600 mb-3">{{ achievement.description }}</p>

            <!-- Progress Bar -->
            <div v-if="!achievement.completed && achievement.target > 1" class="mb-2">
              <div class="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  class="bg-blue-500 h-full transition-all duration-500"
                  :style="{ width: `${(achievement.progress / achievement.target) * 100}%` }"
                ></div>
              </div>
              <div class="text-xs text-gray-600 mt-1">
                {{ achievement.progress }} / {{ achievement.target }}
              </div>
            </div>

            <!-- Reward Info -->
            <div v-if="achievement.reward" class="flex items-center gap-2 text-sm">
              <span class="text-gray-600">Reward:</span>
              <span class="font-semibold text-purple-700">
                {{ achievement.reward.amount }} {{ achievement.reward.type }}
              </span>
            </div>

            <!-- Completed Badge -->
            <div
              v-if="achievement.completed"
              class="absolute top-4 right-4 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
            >
              ✓
            </div>

            <!-- Claim Button -->
            <button
              v-if="achievement.completed && !achievement.claimed && achievement.reward"
              @click="claimReward(achievement)"
              class="mt-3 w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-colors"
            >
              Claim Reward
            </button>

            <!-- Completion Date -->
            <div v-if="achievement.completedAt" class="text-xs text-gray-500 mt-2">
              Completed: {{ formatDate(achievement.completedAt) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Hall of Fame -->
      <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 shadow-lg">
        <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>🏆</span> Hall of Fame
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-for="badge in hallOfFameBadges"
            :key="badge.id"
            class="text-center"
          >
            <div class="text-5xl mb-2 filter" :class="badge.earned ? '' : 'grayscale opacity-50'">
              {{ badge.icon }}
            </div>
            <div class="text-sm font-semibold" :class="badge.earned ? 'text-gray-800' : 'text-gray-500'">
              {{ badge.name }}
            </div>
            <div class="text-xs text-gray-600">{{ badge.requirement }}</div>
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

const playerStore = usePlayerStore();
const toast = useToast();

// State
const activeCategory = ref('all');
const categories = [
  { id: 'all', name: 'All', icon: '📋' },
  { id: 'battle', name: 'Battle', icon: '⚔️' },
  { id: 'collection', name: 'Collection', icon: '📚' },
  { id: 'social', name: 'Social', icon: '🤝' },
  { id: 'special', name: 'Special', icon: '⭐' },
];

const achievements = ref([
  // Battle Achievements
  {
    id: 'first_win',
    category: 'battle',
    name: 'First Victory',
    description: 'Win your first battle',
    icon: '🏆',
    points: 10,
    progress: 1,
    target: 1,
    completed: true,
    claimed: true,
    completedAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'win_streak_5',
    category: 'battle',
    name: 'Winning Streak',
    description: 'Win 5 battles in a row',
    icon: '🔥',
    points: 25,
    progress: 3,
    target: 5,
    completed: false,
    reward: { amount: 100, type: 'Energy' },
  },
  {
    id: 'win_100',
    category: 'battle',
    name: 'Century Club',
    description: 'Win 100 battles total',
    icon: '💯',
    points: 100,
    progress: playerStore.player?.wins || 0,
    target: 100,
    completed: false,
    reward: { amount: 1, type: 'Legendary Pack' },
  },
  {
    id: 'perfect_battle',
    category: 'battle',
    name: 'Flawless Victory',
    description: 'Win a battle without losing any Pokemon',
    icon: '✨',
    points: 50,
    progress: 0,
    target: 1,
    completed: false,
    reward: { amount: 200, type: 'Gems' },
  },

  // Collection Achievements
  {
    id: 'first_pack',
    category: 'collection',
    name: 'Pack Opener',
    description: 'Open your first card pack',
    icon: '📦',
    points: 10,
    progress: 1,
    target: 1,
    completed: true,
    claimed: true,
    completedAt: new Date(Date.now() - 172800000),
  },
  {
    id: 'collect_25',
    category: 'collection',
    name: 'Card Collector',
    description: 'Collect 25 unique cards',
    icon: '🃏',
    points: 25,
    progress: playerStore.player?.cards?.length || 0,
    target: 25,
    completed: playerStore.player?.cards?.length >= 25,
  },
  {
    id: 'collect_legendary',
    category: 'collection',
    name: 'Legendary Hunter',
    description: 'Collect your first Legendary card',
    icon: '👑',
    points: 50,
    progress: playerStore.player?.cards?.filter(c => c.rarity === 'L').length > 0 ? 1 : 0,
    target: 1,
    completed: playerStore.player?.cards?.filter(c => c.rarity === 'L').length > 0,
    reward: { amount: 100, type: 'Gems' },
  },
  {
    id: 'full_evolution',
    category: 'collection',
    name: 'Evolution Master',
    description: 'Collect a complete evolution line',
    icon: '🔄',
    points: 75,
    progress: 0,
    target: 1,
    completed: false,
    reward: { amount: 1, type: 'Premium Pack' },
  },

  // Social Achievements
  {
    id: 'first_trade',
    category: 'social',
    name: 'Trader',
    description: 'Complete your first trade',
    icon: '🤝',
    points: 25,
    progress: 0,
    target: 1,
    completed: false,
    reward: { amount: 50, type: 'Energy' },
  },
  {
    id: 'trade_10',
    category: 'social',
    name: 'Master Trader',
    description: 'Complete 10 successful trades',
    icon: '💼',
    points: 50,
    progress: 0,
    target: 10,
    completed: false,
    reward: { amount: 200, type: 'Gems' },
  },
  {
    id: 'tournament_win',
    category: 'social',
    name: 'Tournament Champion',
    description: 'Win a tournament',
    icon: '🏅',
    points: 100,
    progress: 0,
    target: 1,
    completed: false,
    reward: { amount: 1, type: 'Legendary Pack' },
  },

  // Special Achievements
  {
    id: 'daily_streak_7',
    category: 'special',
    name: 'Dedicated Player',
    description: 'Login for 7 consecutive days',
    icon: '📅',
    points: 50,
    progress: 3,
    target: 7,
    completed: false,
    reward: { amount: 1, type: 'Premium Pack' },
  },
  {
    id: 'night_owl',
    category: 'special',
    name: 'Night Owl',
    description: 'Play a battle after midnight',
    icon: '🦉',
    points: 25,
    progress: 0,
    target: 1,
    completed: false,
  },
  {
    id: 'lucky_day',
    category: 'special',
    name: 'Lucky Day',
    description: 'Pull 3 rare or better cards in one pack',
    icon: '🍀',
    points: 75,
    progress: 0,
    target: 1,
    completed: false,
    reward: { amount: 300, type: 'Energy' },
  },
]);

const hallOfFameBadges = ref([
  { id: 1, name: 'Beginner', icon: '🌱', requirement: '10 Achievements', earned: true },
  { id: 2, name: 'Expert', icon: '⭐', requirement: '25 Achievements', earned: false },
  { id: 3, name: 'Master', icon: '🎯', requirement: '50 Achievements', earned: false },
  { id: 4, name: 'Legend', icon: '🏆', requirement: 'All Achievements', earned: false },
]);

// Computed
const filteredAchievements = computed(() => {
  if (activeCategory.value === 'all') {
    return achievements.value;
  }
  return achievements.value.filter(a => a.category === activeCategory.value);
});

const completedCount = computed(() => {
  return achievements.value.filter(a => a.completed).length;
});

const totalCount = computed(() => {
  return achievements.value.length;
});

const totalPoints = computed(() => {
  return achievements.value
    .filter(a => a.completed)
    .reduce((sum, a) => sum + a.points, 0);
});

const completionPercentage = computed(() => {
  return Math.round((completedCount.value / totalCount.value) * 100);
});

// Methods
const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

const claimReward = async (achievement) => {
  if (!achievement.reward || achievement.claimed) return;

  // Apply reward
  switch (achievement.reward.type) {
    case 'Energy':
      playerStore.player.energy += achievement.reward.amount;
      break;
    case 'Gems':
      playerStore.player.gems += achievement.reward.amount;
      break;
    case 'Premium Pack':
      await playerStore.buyPack('premium', true);
      break;
    case 'Legendary Pack':
      await playerStore.buyPack('legendary', true);
      break;
  }

  achievement.claimed = true;

  // Update player data
  await playerStore.updateUserData({
    energy: playerStore.player.energy,
    gems: playerStore.player.gems,
  });

  toast.success('Reward Claimed!', `You received ${achievement.reward.amount} ${achievement.reward.type}!`);
  
  // Save achievements progress
  saveAchievements();
};

const checkAchievements = () => {
  achievements.value.forEach(achievement => {
    if (!achievement.completed && achievement.progress >= achievement.target) {
      achievement.completed = true;
      achievement.completedAt = new Date();
      toast.info('Achievement Unlocked!', `${achievement.name} - ${achievement.points} points!`);
    }
  });

  // Update hall of fame badges
  const completed = completedCount.value;
  hallOfFameBadges.value[0].earned = completed >= 10;
  hallOfFameBadges.value[1].earned = completed >= 25;
  hallOfFameBadges.value[2].earned = completed >= 50;
  hallOfFameBadges.value[3].earned = completed === totalCount.value;
};

const saveAchievements = () => {
  const data = {
    achievements: achievements.value.map(a => ({
      id: a.id,
      progress: a.progress,
      completed: a.completed,
      claimed: a.claimed,
      completedAt: a.completedAt,
    })),
    lastUpdate: new Date().toISOString(),
  };
  localStorage.setItem('achievementsProgress', JSON.stringify(data));
};

const loadAchievements = () => {
  const saved = localStorage.getItem('achievementsProgress');
  if (saved) {
    const data = JSON.parse(saved);
    data.achievements.forEach(savedAchievement => {
      const achievement = achievements.value.find(a => a.id === savedAchievement.id);
      if (achievement) {
        achievement.progress = savedAchievement.progress;
        achievement.completed = savedAchievement.completed;
        achievement.claimed = savedAchievement.claimed || false;
        achievement.completedAt = savedAchievement.completedAt;
      }
    });
  }
};

onMounted(() => {
  loadAchievements();
  checkAchievements();
});
</script>

<style scoped>
.achievements-container {
  min-height: 100vh;
  background-color: #f9fafb;
}

/* Grayscale filter for unearned badges */
.grayscale {
  filter: grayscale(100%);
}
</style>