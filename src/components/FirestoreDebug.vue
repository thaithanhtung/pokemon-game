<template>
  <div
    class="fixed bottom-4 right-4 bg-slate-900/90 backdrop-blur-sm rounded-lg p-4 border border-white/10 text-white text-xs max-w-sm"
  >
    <h4 class="font-bold text-green-400 mb-2">🔥 Firestore Debug</h4>

    <div class="space-y-2">
      <div>
        <span class="text-blue-400">User ID:</span>
        <span class="text-white">{{ userId || 'Not authenticated' }}</span>
      </div>

      <div>
        <span class="text-blue-400">Pack History:</span>
        <span class="text-white">{{ packHistoryCount }} packs</span>
      </div>

      <div>
        <span class="text-blue-400">Last Pack:</span>
        <span class="text-white">{{ lastPackType || 'None' }}</span>
      </div>

      <div>
        <span class="text-blue-400">User Cards:</span>
        <span class="text-white">{{ userCardsCount }} cards</span>
      </div>

      <div class="flex gap-2 mt-3">
        <button
          @click="refreshData"
          class="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
        >
          Refresh
        </button>
        <button
          @click="testAddPack"
          class="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
        >
          Test Pack
        </button>
      </div>

      <div v-if="lastError" class="text-red-400 text-xs mt-2">Error: {{ lastError }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useFirebase } from '@/composables/useFirebase';

const firebase = useFirebase();
const userId = computed(() => firebase.userId.value);
const packHistoryCount = ref(0);
const lastPackType = ref('');
const userCardsCount = ref(0);
const lastError = ref('');

const refreshData = async () => {
  try {
    lastError.value = '';
    const history = await firebase.getPackHistory();
    packHistoryCount.value = history.length;
    if (history.length > 0) {
      const lastPack = history[history.length - 1];
      lastPackType.value = `${lastPack.type} (${new Date(lastPack.timestamp).toLocaleTimeString()})`;
    } else {
      lastPackType.value = '';
    }

    // Load user cards count
    const userCards = await firebase.getUserCards();
    userCardsCount.value = userCards.length;
  } catch (error) {
    lastError.value = error.message;
  }
};

const testAddPack = async () => {
  try {
    lastError.value = '';
    const testPack = {
      id: `test_pack_${Date.now()}`,
      type: 'basic',
      timestamp: Date.now(),
      cards: [{ id: 'test1', name: 'Test Card', rarity: 'C', type: 'pokemon', element: 'normal' }],
      cost: { energy: 100 },
    };

    await firebase.addPackToHistory(testPack);
    await refreshData();
  } catch (error) {
    lastError.value = error.message;
  }
};

onMounted(() => {
  refreshData();
});
</script>
