<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
    <div class="sticky top-0 z-10 bg-black/40 backdrop-blur border-b border-white/10">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-2xl font-bold">Pokemon Elemental Hit Effects</h1>
        <router-link
          to="/card-clash"
          class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
          >Quay lại game</router-link
        >
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-4 py-8">
      <div class="mb-6 flex items-center gap-4">
        <button class="px-3 py-2 rounded bg-purple-600 hover:bg-purple-700" @click="replayAll">
          Phát lại tất cả
        </button>
        <div class="text-sm text-gray-300">Nhấp vào từng thẻ để phát lại riêng</div>
      </div>

      <div class="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div
          v-for="el in elements"
          :key="el.key"
          class="relative rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/10 transition-colors min-h-[220px]"
          @click="replay(el.key)"
        >
          <div class="px-4 py-2 flex items-center justify-between border-b border-white/10">
            <div class="flex items-center gap-2">
              <span class="text-xl">{{ el.icon }}</span>
              <span class="font-semibold">{{ el.label }}</span>
            </div>
            <span class="text-xs text-gray-300">{{ el.key }}</span>
          </div>
          <div class="relative h-56">
            <ParticlesEffect :key="keys[el.key]" :type="el.key" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import ParticlesEffect from '@/components/ParticlesEffect.vue';

const elements = [
  { key: 'fire', label: 'Fire', icon: '🔥' },
  { key: 'water', label: 'Water', icon: '💧' },
  { key: 'electric', label: 'Electric', icon: '⚡' },
  { key: 'grass', label: 'Grass', icon: '🌿' },
  { key: 'neutral', label: 'Neutral', icon: '✨' },
  { key: 'normal', label: 'Normal', icon: '🌀' },
  { key: 'fighting', label: 'Fighting', icon: '👊' },
  { key: 'flying', label: 'Flying', icon: '🌬️' },
  { key: 'poison', label: 'Poison', icon: '☠️' },
  { key: 'ground', label: 'Ground', icon: '🌍' },
  { key: 'rock', label: 'Rock', icon: '🪨' },
  { key: 'bug', label: 'Bug', icon: '🐛' },
  { key: 'ghost', label: 'Ghost', icon: '👻' },
  { key: 'steel', label: 'Steel', icon: '🔩' },
  { key: 'psychic', label: 'Psychic', icon: '🔮' },
  { key: 'ice', label: 'Ice', icon: '❄️' },
  { key: 'dragon', label: 'Dragon', icon: '🐉' },
  { key: 'dark', label: 'Dark', icon: '🌑' },
  { key: 'fairy', label: 'Fairy', icon: '👸' },
];

const keys = reactive({ fire: 0, water: 0, electric: 0, grass: 0, poison: 0, neutral: 0 });

const replay = el => {
  keys[el]++;
};

const replayAll = () => {
  for (const el of Object.keys(keys)) keys[el]++;
};

// Lottie no longer used on this page per request; using canvas particles instead.
</script>

<style scoped></style>
