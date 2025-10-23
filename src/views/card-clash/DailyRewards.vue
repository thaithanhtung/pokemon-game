<template>
  <div class="daily-rewards-container">
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
              <span>🎁</span> Daily Rewards
            </h1>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8 max-w-6xl">
      <!-- Streak Counter -->
      <div class="bg-white rounded-xl p-6 shadow-lg mb-8 text-center">
        <h2 class="text-xl font-bold text-gray-800 mb-4">Login Streak</h2>
        <div class="flex items-center justify-center gap-8">
          <div>
            <div class="text-4xl font-bold text-orange-600">{{ currentStreak }}</div>
            <div class="text-sm text-gray-600">Current Streak</div>
          </div>
          <div class="text-4xl">🔥</div>
          <div>
            <div class="text-4xl font-bold text-purple-600">{{ bestStreak }}</div>
            <div class="text-sm text-gray-600">Best Streak</div>
          </div>
        </div>
      </div>

      <!-- Weekly Rewards Grid -->
      <div class="bg-white rounded-xl p-6 shadow-lg">
        <h3 class="text-xl font-bold text-gray-800 mb-6">This Week's Rewards</h3>
        <div class="grid grid-cols-7 gap-4">
          <div
            v-for="(reward, index) in weeklyRewards"
            :key="index"
            :class="[
              'relative rounded-xl p-4 text-center transition-all duration-300',
              reward.claimed
                ? 'bg-green-100 border-2 border-green-400'
                : reward.available
                ? 'bg-blue-50 border-2 border-blue-400 hover:shadow-lg cursor-pointer'
                : 'bg-gray-100 border-2 border-gray-300 opacity-50',
            ]"
            @click="claimReward(index)"
          >
            <!-- Day Label -->
            <div class="text-xs font-semibold text-gray-600 mb-2">Day {{ index + 1 }}</div>
            
            <!-- Reward Icon -->
            <div class="text-3xl mb-2">{{ reward.icon }}</div>
            
            <!-- Reward Amount -->
            <div class="text-sm font-bold" :class="reward.claimed ? 'text-green-700' : 'text-gray-700'">
              {{ reward.amount }} {{ reward.type }}
            </div>

            <!-- Status Badge -->
            <div
              v-if="reward.claimed"
              class="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
            >
              ✓
            </div>
            <div
              v-else-if="reward.available"
              class="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center animate-pulse"
            >
              !
            </div>

            <!-- Special Day Badge -->
            <div
              v-if="index === 6"
              class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-bold"
            >
              BONUS
            </div>
          </div>
        </div>

        <!-- Next Reward Timer -->
        <div v-if="!canClaimToday" class="mt-6 text-center">
          <p class="text-gray-600">Next reward available in:</p>
          <p class="text-2xl font-bold text-blue-600">{{ timeUntilNextReward }}</p>
        </div>
      </div>

      <!-- Monthly Bonus -->
      <div class="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 shadow-lg border-2 border-purple-200">
        <h3 class="text-xl font-bold text-gray-800 mb-4">Monthly Login Bonus</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-3xl mb-2">📅</div>
            <div class="text-sm text-gray-600">Days Logged</div>
            <div class="text-xl font-bold text-purple-600">{{ monthlyLoginDays }}/30</div>
          </div>
          <div class="text-center">
            <div class="text-3xl mb-2">🎁</div>
            <div class="text-sm text-gray-600">7 Day Bonus</div>
            <div class="text-lg font-bold" :class="monthlyLoginDays >= 7 ? 'text-green-600' : 'text-gray-400'">
              {{ monthlyLoginDays >= 7 ? 'Claimed' : 'Locked' }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-3xl mb-2">💎</div>
            <div class="text-sm text-gray-600">15 Day Bonus</div>
            <div class="text-lg font-bold" :class="monthlyLoginDays >= 15 ? 'text-green-600' : 'text-gray-400'">
              {{ monthlyLoginDays >= 15 ? 'Claimed' : 'Locked' }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-3xl mb-2">👑</div>
            <div class="text-sm text-gray-600">30 Day Bonus</div>
            <div class="text-lg font-bold" :class="monthlyLoginDays >= 30 ? 'text-green-600' : 'text-gray-400'">
              {{ monthlyLoginDays >= 30 ? 'Claimed' : 'Locked' }}
            </div>
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
const currentStreak = ref(0);
const bestStreak = ref(0);
const monthlyLoginDays = ref(0);
const lastClaimDate = ref(null);
const canClaimToday = ref(false);
const timeUntilNextReward = ref('');
const weeklyRewards = ref([]);

// Timer interval
let timerInterval = null;

// Initialize rewards
const initializeRewards = () => {
  const rewards = [
    { icon: '⚡', amount: 50, type: 'Energy', claimed: false, available: false },
    { icon: '💎', amount: 10, type: 'Gems', claimed: false, available: false },
    { icon: '📦', amount: 1, type: 'Basic Pack', claimed: false, available: false },
    { icon: '⚡', amount: 100, type: 'Energy', claimed: false, available: false },
    { icon: '💎', amount: 20, type: 'Gems', claimed: false, available: false },
    { icon: '🎁', amount: 1, type: 'Premium Pack', claimed: false, available: false },
    { icon: '👑', amount: 1, type: 'Legendary Pack', claimed: false, available: false },
  ];

  // Load saved state from localStorage
  const savedData = localStorage.getItem('dailyRewards');
  if (savedData) {
    const data = JSON.parse(savedData);
    currentStreak.value = data.currentStreak || 0;
    bestStreak.value = data.bestStreak || 0;
    monthlyLoginDays.value = data.monthlyLoginDays || 0;
    lastClaimDate.value = data.lastClaimDate;
    
    // Restore claimed status
    if (data.weeklyRewards) {
      rewards.forEach((reward, index) => {
        if (data.weeklyRewards[index]) {
          reward.claimed = data.weeklyRewards[index].claimed;
        }
      });
    }
  }

  weeklyRewards.value = rewards;
  checkRewardAvailability();
};

// Check if player can claim today's reward
const checkRewardAvailability = () => {
  const today = new Date().toDateString();
  const lastClaim = lastClaimDate.value ? new Date(lastClaimDate.value).toDateString() : null;

  canClaimToday.value = lastClaim !== today;

  // Update available status for rewards
  const dayOfWeek = currentStreak.value % 7;
  weeklyRewards.value.forEach((reward, index) => {
    reward.available = index === dayOfWeek && canClaimToday.value && !reward.claimed;
  });
};

// Calculate time until next reward
const updateTimer = () => {
  if (canClaimToday.value) {
    timeUntilNextReward.value = 'Available Now!';
    return;
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diff = tomorrow - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  timeUntilNextReward.value = `${hours}h ${minutes}m ${seconds}s`;
};

// Claim reward
const claimReward = async (index) => {
  const reward = weeklyRewards.value[index];
  
  if (!reward.available || reward.claimed) {
    return;
  }

  // Apply reward
  switch (reward.type) {
    case 'Energy':
      playerStore.player.energy += reward.amount;
      break;
    case 'Gems':
      playerStore.player.gems += reward.amount;
      break;
    case 'Basic Pack':
      await playerStore.buyPack('basic', true); // Free pack
      break;
    case 'Premium Pack':
      await playerStore.buyPack('premium', true); // Free pack
      break;
    case 'Legendary Pack':
      await playerStore.buyPack('legendary', true); // Free pack
      break;
  }

  // Update state
  reward.claimed = true;
  reward.available = false;
  currentStreak.value++;
  if (currentStreak.value > bestStreak.value) {
    bestStreak.value = currentStreak.value;
  }
  monthlyLoginDays.value++;
  lastClaimDate.value = new Date().toISOString();
  canClaimToday.value = false;

  // Save state
  saveProgress();

  // Update player data
  await playerStore.updateUserData({
    energy: playerStore.player.energy,
    gems: playerStore.player.gems,
  });

  toast.success('Reward Claimed!', `You received ${reward.amount} ${reward.type}!`);

  // Check for streak milestones
  if (currentStreak.value === 7) {
    toast.info('Weekly Streak!', 'Amazing! You\'ve logged in for 7 days straight!');
  }
};

// Save progress to localStorage
const saveProgress = () => {
  const data = {
    currentStreak: currentStreak.value,
    bestStreak: bestStreak.value,
    monthlyLoginDays: monthlyLoginDays.value,
    lastClaimDate: lastClaimDate.value,
    weeklyRewards: weeklyRewards.value.map(r => ({ claimed: r.claimed })),
  };
  localStorage.setItem('dailyRewards', JSON.stringify(data));
};

// Reset weekly rewards if needed
const checkWeeklyReset = () => {
  const allClaimed = weeklyRewards.value.every(r => r.claimed);
  if (allClaimed) {
    // Reset for new week
    weeklyRewards.value.forEach(r => {
      r.claimed = false;
      r.available = false;
    });
    saveProgress();
  }
};

onMounted(() => {
  initializeRewards();
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
  checkWeeklyReset();
});

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});
</script>

<style scoped>
.daily-rewards-container {
  min-height: 100vh;
  background-color: #f9fafb;
}
</style>