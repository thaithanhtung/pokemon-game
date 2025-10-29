<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-8">
    <div class="container mx-auto max-w-4xl">
      <h1
        class="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600"
      >
        Sound Effects Demo
      </h1>

      <!-- Sound Status -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-semibold">Sound Settings</h2>
          <div class="flex items-center gap-4">
            <span class="text-lg">{{ sound.enabled ? '🔊 Enabled' : '🔇 Disabled' }}</span>
            <button
              @click="sound.toggleSound()"
              class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Toggle Sound
            </button>
          </div>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Master Volume: {{ Math.round(sound.masterVolume.value * 100) }}%
          </label>
          <input
            type="range"
            :value="sound.masterVolume.value"
            @input="sound.setMasterVolume($event.target.value)"
            min="0"
            max="1"
            step="0.1"
            class="w-full"
          />
        </div>
      </div>

      <!-- Sound Categories -->
      <div class="space-y-8">
        <!-- Card Pack Sounds -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h3 class="text-xl font-semibold mb-4">🃏 Card Pack Sounds</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button @click="playSound('pack-shuffle')" class="sound-button">🔀 Card Shuffle</button>
            <button @click="playSound('pack-open')" class="sound-button">📦 Pack Open</button>
            <button @click="playSound('card-reveal')" class="sound-button">🎴 Card Reveal</button>
            <button @click="playSound('card-flip')" class="sound-button">🔄 Card Flip</button>
            <button @click="playSound('legendary-reveal')" class="sound-button legendary">
              ⭐ Legendary Reveal
            </button>
            <button @click="playSound('coins-spend')" class="sound-button">💰 Coins Spend</button>
          </div>
        </div>

        <!-- UI Sounds -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h3 class="text-xl font-semibold mb-4">🎮 UI Sounds</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button @click="playSound('button-click')" class="sound-button">🔘 Button Click</button>
            <button @click="playSound('success')" class="sound-button success">✅ Success</button>
            <button @click="playSound('error')" class="sound-button error">❌ Error</button>
          </div>
        </div>

        <!-- Battle Sounds -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h3 class="text-xl font-semibold mb-4">⚔️ Battle Sounds</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button @click="playSound('battle-start')" class="sound-button">🎯 Battle Start</button>
            <button @click="playSound('attack-hit')" class="sound-button">💥 Attack Hit</button>
            <button @click="playSound('pokemon-faint')" class="sound-button">
              😵 Pokemon Faint
            </button>
          </div>
        </div>

        <!-- Pack Opening Sequence -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h3 class="text-xl font-semibold mb-4">🎁 Pack Opening Sequence Demo</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button @click="demoPackOpening('basic')" class="sound-button pack-demo">
              📦 Basic Pack Demo
            </button>
            <button @click="demoPackOpening('premium')" class="sound-button pack-demo premium">
              🎁 Premium Pack Demo
            </button>
            <button @click="demoPackOpening('legendary')" class="sound-button pack-demo legendary">
              👑 Legendary Pack Demo
            </button>
          </div>
        </div>

        <!-- Background Music -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h3 class="text-xl font-semibold mb-4">🎵 Background Music</h3>
          <div class="flex gap-4">
            <button @click="playMusic()" class="sound-button">▶️ Play Shop Music</button>
            <button @click="stopMusic()" class="sound-button">⏹️ Stop Music</button>
          </div>
        </div>
      </div>

      <!-- Sound File Status -->
      <div class="mt-8 bg-gray-100 rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">📁 Sound File Status</h3>
        <p class="text-sm text-gray-600 mb-4">
          Place sound files in: <code class="bg-gray-200 px-2 py-1 rounded">/public/sounds/</code>
        </p>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div v-for="file in soundFiles" :key="file" class="flex items-center gap-2">
            <span class="text-gray-500">•</span>
            <code class="text-xs">{{ file }}</code>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSound } from '@/composables/useSound';
import { useToast } from '@/composables/useToast';
import { registerGameSounds } from '@/services/soundService';

const sound = useSound();
const toast = useToast();

// Register game sounds when component mounts
onMounted(() => {
  registerGameSounds();
});

const soundFiles = [
  'card-shuffle.mp3',
  'pack-open.mp3',
  'card-reveal.mp3',
  'card-flip.mp3',
  'legendary-reveal.mp3',
  'coins-spend.mp3',
  'button-click.mp3',
  'success.mp3',
  'error.mp3',
  'battle-start.mp3',
  'attack-hit.mp3',
  'pokemon-faint.mp3',
  'shop-music.mp3',
];

const playSound = soundName => {
  const id = sound.play(soundName);
  if (id === undefined) {
    toast.warning('Sound Not Found', `Sound file "${soundName}" might be missing`);
  } else {
    toast.info('Playing Sound', soundName);
  }
};

const demoPackOpening = async packType => {
  toast.info('Pack Opening Demo', `Opening ${packType} pack...`);

  const revealCard = await sound.playPackOpenSequence(packType);

  // Simulate revealing 5 cards
  const rarities =
    packType === 'legendary'
      ? ['C', 'R', 'R', 'E', 'L']
      : packType === 'premium'
        ? ['C', 'R', 'R', 'E', 'E']
        : ['C', 'C', 'R', 'R', 'R'];

  rarities.forEach((rarity, index) => {
    revealCard(rarity, index);
  });

  // Play success sound if legendary card
  if (rarities.includes('L')) {
    setTimeout(() => {
      sound.playSuccess();
      toast.success('Legendary!', 'You got a legendary card!');
    }, 1500);
  }
};

let musicId = null;

const playMusic = () => {
  if (musicId) {
    sound.stop('shop-music');
  }
  musicId = sound.fadeIn('shop-music', 2000, 0.3);
  toast.info('Music Started', 'Playing shop background music');
};

const stopMusic = () => {
  if (musicId) {
    sound.fadeOut('shop-music', 1000, musicId);
    musicId = null;
    toast.info('Music Stopped', 'Stopped background music');
  }
};
</script>

<style scoped>
.sound-button {
  padding: 0.75rem 1rem;
  background-color: #f3f4f6;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
  transform: scale(1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.sound-button:hover {
  background-color: #e5e7eb;
  transform: scale(1.05);
}

.sound-button.legendary {
  background: linear-gradient(to right, #fef3c7, #fed7aa);
}

.sound-button.legendary:hover {
  background: linear-gradient(to right, #fde68a, #fdba74);
}

.sound-button.success {
  background-color: #dcfce7;
}

.sound-button.success:hover {
  background-color: #bbf7d0;
}

.sound-button.error {
  background-color: #fee2e2;
}

.sound-button.error:hover {
  background-color: #fecaca;
}

.sound-button.pack-demo {
  padding: 1rem;
  font-size: 1.125rem;
}

.sound-button.pack-demo.premium {
  background: linear-gradient(to right, #f3e8ff, #fce7f3);
}

.sound-button.pack-demo.premium:hover {
  background: linear-gradient(to right, #e9d5ff, #fbcfe8);
}

.sound-button.pack-demo.legendary {
  background: linear-gradient(to right, #fef3c7, #fef3c7);
}

.sound-button.pack-demo.legendary:hover {
  background: linear-gradient(to right, #fde68a, #fde68a);
}
</style>
