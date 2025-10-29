<template>
  <div class="sound-settings">
    <button
      @click="toggleSettings"
      class="sound-toggle-btn"
      :class="{ 'sound-off': !soundEnabled }"
    >
      <span v-if="soundEnabled">🔊</span>
      <span v-else>🔇</span>
    </button>

    <Transition name="settings-slide">
      <div v-if="showSettings" class="settings-panel">
        <h3 class="text-lg font-semibold mb-4">Sound Settings</h3>
        
        <div class="mb-4">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              v-model="soundEnabled"
              @change="handleToggleSound"
              class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            >
            <span class="text-sm font-medium">Enable Sound Effects</span>
          </label>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">
            Master Volume: {{ Math.round(masterVolume * 100) }}%
          </label>
          <input
            type="range"
            v-model="masterVolume"
            @input="handleVolumeChange"
            min="0"
            max="1"
            step="0.1"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          >
        </div>

        <div class="space-y-2">
          <button
            @click="testSound('button-click')"
            class="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
          >
            Test Button Click
          </button>
          <button
            @click="testSound('card-reveal')"
            class="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
          >
            Test Card Reveal
          </button>
          <button
            @click="testSound('legendary-reveal')"
            class="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
          >
            Test Legendary Reveal
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useSound } from '@/composables/useSound';

const sound = useSound();
const showSettings = ref(false);
const soundEnabled = ref(sound.enabled.value);
const masterVolume = ref(sound.masterVolume.value);

const toggleSettings = () => {
  showSettings.value = !showSettings.value;
  if (sound.enabled.value) {
    sound.playButtonClick();
  }
};

const handleToggleSound = () => {
  sound.setEnabled(soundEnabled.value);
  if (soundEnabled.value) {
    sound.playSuccess();
  }
};

const handleVolumeChange = () => {
  sound.setMasterVolume(masterVolume.value);
  // Play a test sound when changing volume
  if (sound.enabled.value) {
    sound.play('button-click', 0.3);
  }
};

const testSound = (soundName) => {
  sound.play(soundName);
};

// Close settings when clicking outside
const handleClickOutside = (event) => {
  const settingsEl = document.querySelector('.sound-settings');
  if (settingsEl && !settingsEl.contains(event.target)) {
    showSettings.value = false;
  }
};

watch(showSettings, (newValue) => {
  if (newValue) {
    document.addEventListener('click', handleClickOutside);
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
});
</script>

<style scoped>
.sound-settings {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.sound-toggle-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 2px solid #e5e7eb;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sound-toggle-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.sound-toggle-btn.sound-off {
  background: #fee2e2;
  border-color: #fecaca;
}

.settings-panel {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 280px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  padding: 20px;
  border: 1px solid #e5e7eb;
}

/* Custom range slider styles */
input[type="range"] {
  -webkit-appearance: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: #8b5cf6;
  cursor: pointer;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #8b5cf6;
  cursor: pointer;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: none;
}

input[type="range"]::-webkit-slider-runnable-track {
  background: linear-gradient(to right, #8b5cf6 0%, #8b5cf6 var(--value), #e5e7eb var(--value), #e5e7eb 100%);
  border-radius: 4px;
}

/* Animation */
.settings-slide-enter-active,
.settings-slide-leave-active {
  transition: all 0.3s ease;
}

.settings-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.settings-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}
</style>