<template>
  <div class="quests-container">
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
              <span>📜</span> Daily Quests
            </h1>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8 max-w-6xl">
      <!-- Quest Progress Overview -->
      <div class="bg-white rounded-xl p-6 shadow-lg mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-800">Today's Progress</h2>
          <div class="text-sm text-gray-600">
            Resets in: <span class="font-bold text-blue-600">{{ timeUntilReset }}</span>
          </div>
        </div>
        
        <!-- Progress Bar -->
        <div class="relative">
          <div class="bg-gray-200 rounded-full h-8 overflow-hidden">
            <div
              class="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500 flex items-center justify-center"
              :style="{ width: `${questProgress}%` }"
            >
              <span class="text-white text-sm font-bold">{{ completedQuests }}/{{ totalQuests }}</span>
            </div>
          </div>
          
          <!-- Milestone Rewards -->
          <div class="flex justify-between mt-2">
            <div
              v-for="milestone in milestones"
              :key="milestone.id"
              class="text-center"
            >
              <div
                :class="[
                  'w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all',
                  completedQuests >= milestone.required
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600',
                ]"
              >
                {{ milestone.icon }}
              </div>
              <div class="text-xs mt-1 text-gray-600">{{ milestone.required }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quest Categories -->
      <div class="grid md:grid-cols-2 gap-6">
        <!-- Daily Quests -->
        <div class="bg-white rounded-xl p-6 shadow-lg">
          <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>☀️</span> Daily Quests
          </h3>
          
          <div class="space-y-4">
            <div
              v-for="quest in dailyQuests"
              :key="quest.id"
              :class="[
                'relative rounded-lg p-4 border-2 transition-all duration-300',
                quest.completed
                  ? 'bg-green-50 border-green-400'
                  : quest.progress > 0
                  ? 'bg-blue-50 border-blue-400'
                  : 'bg-gray-50 border-gray-300',
              ]"
            >
              <!-- Quest Info -->
              <div class="flex items-start justify-between mb-2">
                <div>
                  <h4 class="font-semibold text-gray-800">{{ quest.title }}</h4>
                  <p class="text-sm text-gray-600">{{ quest.description }}</p>
                </div>
                <div class="text-2xl">{{ quest.icon }}</div>
              </div>

              <!-- Progress Bar -->
              <div class="bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
                <div
                  :class="[
                    'h-full transition-all duration-500',
                    quest.completed ? 'bg-green-500' : 'bg-blue-500',
                  ]"
                  :style="{ width: `${(quest.progress / quest.target) * 100}%` }"
                ></div>
              </div>

              <!-- Progress Text & Reward -->
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-700">
                  {{ quest.progress }}/{{ quest.target }} {{ quest.unit }}
                </span>
                <div class="flex items-center gap-2">
                  <span class="text-gray-600">Reward:</span>
                  <span class="font-bold text-gray-800">{{ quest.reward.amount }} {{ quest.reward.type }}</span>
                </div>
              </div>

              <!-- Claim Button -->
              <button
                v-if="quest.completed && !quest.claimed"
                @click="claimReward(quest)"
                class="absolute -right-2 -top-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse"
              >
                Claim!
              </button>

              <!-- Completed Badge -->
              <div
                v-if="quest.claimed"
                class="absolute -right-2 -top-2 bg-gray-500 text-white w-8 h-8 rounded-full flex items-center justify-center"
              >
                ✓
              </div>
            </div>
          </div>
        </div>

        <!-- Weekly Challenges -->
        <div class="bg-white rounded-xl p-6 shadow-lg">
          <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🌟</span> Weekly Challenges
          </h3>
          
          <div class="space-y-4">
            <div
              v-for="quest in weeklyQuests"
              :key="quest.id"
              :class="[
                'relative rounded-lg p-4 border-2 transition-all duration-300',
                quest.completed
                  ? 'bg-purple-50 border-purple-400'
                  : quest.progress > 0
                  ? 'bg-pink-50 border-pink-400'
                  : 'bg-gray-50 border-gray-300',
              ]"
            >
              <!-- Quest Info -->
              <div class="flex items-start justify-between mb-2">
                <div>
                  <h4 class="font-semibold text-gray-800">{{ quest.title }}</h4>
                  <p class="text-sm text-gray-600">{{ quest.description }}</p>
                </div>
                <div class="text-2xl">{{ quest.icon }}</div>
              </div>

              <!-- Progress Bar -->
              <div class="bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
                <div
                  :class="[
                    'h-full transition-all duration-500',
                    quest.completed ? 'bg-purple-500' : 'bg-pink-500',
                  ]"
                  :style="{ width: `${(quest.progress / quest.target) * 100}%` }"
                ></div>
              </div>

              <!-- Progress Text & Reward -->
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-700">
                  {{ quest.progress }}/{{ quest.target }} {{ quest.unit }}
                </span>
                <div class="flex items-center gap-2">
                  <span class="text-gray-600">Reward:</span>
                  <span class="font-bold text-purple-700">{{ quest.reward.amount }} {{ quest.reward.type }}</span>
                </div>
              </div>

              <!-- Time Remaining -->
              <div class="text-xs text-gray-500 mt-2">
                {{ quest.daysRemaining }} days remaining
              </div>

              <!-- Claim Button -->
              <button
                v-if="quest.completed && !quest.claimed"
                @click="claimReward(quest)"
                class="absolute -right-2 -top-2 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse"
              >
                Claim!
              </button>

              <!-- Completed Badge -->
              <div
                v-if="quest.claimed"
                class="absolute -right-2 -top-2 bg-gray-500 text-white w-8 h-8 rounded-full flex items-center justify-center"
              >
                ✓
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Achievement Unlocks -->
      <div class="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 shadow-lg">
        <h3 class="text-lg font-bold text-gray-800 mb-4">Recent Achievements</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-for="achievement in recentAchievements"
            :key="achievement.id"
            class="text-center"
          >
            <div class="text-4xl mb-2">{{ achievement.icon }}</div>
            <div class="text-sm font-semibold text-gray-800">{{ achievement.name }}</div>
            <div class="text-xs text-gray-600">{{ achievement.date }}</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { usePlayerStore } from '@/stores/player';
import { useToast } from '@/composables/useToast';

const playerStore = usePlayerStore();
const toast = useToast();

// State
const timeUntilReset = ref('');
const dailyQuests = ref([
  {
    id: 'daily1',
    title: 'Win 3 Battles',
    description: 'Win any 3 battles in Story or PvP mode',
    icon: '⚔️',
    progress: 1,
    target: 3,
    unit: 'battles',
    reward: { amount: 100, type: 'Energy' },
    completed: false,
    claimed: false,
  },
  {
    id: 'daily2',
    title: 'Open 2 Packs',
    description: 'Open any 2 card packs from the shop',
    icon: '📦',
    progress: 0,
    target: 2,
    unit: 'packs',
    reward: { amount: 50, type: 'Gems' },
    completed: false,
    claimed: false,
  },
  {
    id: 'daily3',
    title: 'Play 10 Cards',
    description: 'Play 10 cards in battles',
    icon: '🎴',
    progress: 7,
    target: 10,
    unit: 'cards',
    reward: { amount: 1, type: 'Basic Pack' },
    completed: false,
    claimed: false,
  },
]);

const weeklyQuests = ref([
  {
    id: 'weekly1',
    title: 'Master Battler',
    description: 'Win 20 battles this week',
    icon: '🏆',
    progress: 12,
    target: 20,
    unit: 'battles',
    reward: { amount: 1, type: 'Legendary Pack' },
    completed: false,
    claimed: false,
    daysRemaining: 5,
  },
  {
    id: 'weekly2',
    title: 'Card Collector',
    description: 'Collect 50 new cards',
    icon: '📚',
    progress: 35,
    target: 50,
    unit: 'cards',
    reward: { amount: 200, type: 'Gems' },
    completed: false,
    claimed: false,
    daysRemaining: 5,
  },
  {
    id: 'weekly3',
    title: 'Energy Saver',
    description: 'Spend 1000 energy',
    icon: '⚡',
    progress: 650,
    target: 1000,
    unit: 'energy',
    reward: { amount: 2, type: 'Premium Packs' },
    completed: false,
    claimed: false,
    daysRemaining: 5,
  },
]);

const milestones = [
  { id: 1, required: 1, icon: '🎁', reward: { amount: 50, type: 'Energy' } },
  { id: 2, required: 3, icon: '💎', reward: { amount: 20, type: 'Gems' } },
  { id: 3, required: 5, icon: '📦', reward: { amount: 1, type: 'Premium Pack' } },
  { id: 4, required: 7, icon: '👑', reward: { amount: 1, type: 'Legendary Pack' } },
];

const recentAchievements = ref([
  { id: 1, name: 'First Victory', icon: '🏅', date: 'Today' },
  { id: 2, name: 'Pack Opener', icon: '📦', date: 'Yesterday' },
  { id: 3, name: 'Deck Builder', icon: '🃏', date: '2 days ago' },
  { id: 4, name: 'Streak Master', icon: '🔥', date: '3 days ago' },
]);

// Computed
const completedQuests = computed(() => {
  return dailyQuests.value.filter(q => q.completed).length;
});

const totalQuests = computed(() => {
  return dailyQuests.value.length;
});

const questProgress = computed(() => {
  return (completedQuests.value / totalQuests.value) * 100;
});

// Timer
let timerInterval = null;

const updateTimer = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diff = tomorrow - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  timeUntilReset.value = `${hours}h ${minutes}m ${seconds}s`;
};

// Methods
const claimReward = async (quest) => {
  if (!quest.completed || quest.claimed) return;

  // Apply reward based on type
  switch (quest.reward.type) {
    case 'Energy':
      playerStore.player.energy += quest.reward.amount;
      break;
    case 'Gems':
      playerStore.player.gems += quest.reward.amount;
      break;
    case 'Basic Pack':
      await playerStore.buyPack('basic', true);
      break;
    case 'Premium Pack':
    case 'Premium Packs':
      for (let i = 0; i < quest.reward.amount; i++) {
        await playerStore.buyPack('premium', true);
      }
      break;
    case 'Legendary Pack':
      await playerStore.buyPack('legendary', true);
      break;
  }

  quest.claimed = true;

  // Update player data
  await playerStore.updateUserData({
    energy: playerStore.player.energy,
    gems: playerStore.player.gems,
  });

  toast.success('Quest Completed!', `You received ${quest.reward.amount} ${quest.reward.type}!`);
  
  // Save quest progress
  saveQuestProgress();
};

const saveQuestProgress = () => {
  const questData = {
    daily: dailyQuests.value,
    weekly: weeklyQuests.value,
    lastUpdate: new Date().toISOString(),
  };
  localStorage.setItem('questProgress', JSON.stringify(questData));
};

const loadQuestProgress = () => {
  const saved = localStorage.getItem('questProgress');
  if (saved) {
    const data = JSON.parse(saved);
    const lastUpdate = new Date(data.lastUpdate);
    const today = new Date();
    
    // Reset daily quests if it's a new day
    if (lastUpdate.toDateString() !== today.toDateString()) {
      resetDailyQuests();
    } else {
      dailyQuests.value = data.daily || dailyQuests.value;
    }
    
    // Load weekly quests
    weeklyQuests.value = data.weekly || weeklyQuests.value;
  }
};

const resetDailyQuests = () => {
  dailyQuests.value.forEach(quest => {
    quest.progress = 0;
    quest.completed = false;
    quest.claimed = false;
  });
};

// Check quest completion
const checkQuestCompletion = () => {
  [...dailyQuests.value, ...weeklyQuests.value].forEach(quest => {
    if (quest.progress >= quest.target && !quest.completed) {
      quest.completed = true;
      toast.info('Quest Complete!', `${quest.title} is ready to claim!`);
    }
  });
};

// Simulate quest progress (in real app, this would be triggered by game events)
const simulateProgress = () => {
  // Randomly increase progress on some quests
  if (Math.random() > 0.7) {
    const randomQuest = dailyQuests.value[Math.floor(Math.random() * dailyQuests.value.length)];
    if (!randomQuest.completed) {
      randomQuest.progress = Math.min(randomQuest.progress + 1, randomQuest.target);
      checkQuestCompletion();
      saveQuestProgress();
    }
  }
};

onMounted(() => {
  loadQuestProgress();
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
  
  // Simulate quest progress every 5 seconds
  const progressInterval = setInterval(simulateProgress, 5000);
  
  onUnmounted(() => {
    clearInterval(progressInterval);
  });
});

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});
</script>

<style scoped>
.quests-container {
  min-height: 100vh;
  background-color: #f9fafb;
}
</style>