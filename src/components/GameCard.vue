<template>
  <div class="relative aspect-square cursor-pointer select-none" @click="$emit('click')">
    <div
      :class="[
        'absolute inset-0 transition-all duration-500 transform-gpu preserve-3d',
        isFlipped ? 'rotate-y-180' : '',
      ]"
    >
      <!-- Card Back -->
      <div
        class="absolute inset-0 backface-hidden rounded-lg bg-gradient-to-br from-red-500 to-red-700 border-4 border-yellow-400 shadow-lg flex items-center justify-center"
      >
        <div class="text-white">
          <svg class="w-16 h-16 md:w-20 md:h-20" viewBox="0 0 100 100" fill="currentColor">
            <circle cx="50" cy="50" r="48" stroke="white" stroke-width="2" fill="none" />
            <circle cx="50" cy="50" r="20" fill="white" />
            <circle cx="50" cy="50" r="18" fill="currentColor" />
            <line x1="20" y1="50" x2="80" y2="50" stroke="white" stroke-width="4" />
          </svg>
        </div>
      </div>

      <!-- Card Front -->
      <div
        :class="[
          'absolute inset-0 rotate-y-180 backface-hidden rounded-lg border-4 shadow-lg flex flex-col items-center justify-center p-4 transition-all duration-300',
          isMatched ? 'bg-green-400 border-green-600 scale-105' : 'bg-white border-gray-300',
        ]"
      >
        <img
          :src="card.image"
          :alt="card.name"
          class="w-20 h-20 md:w-24 md:h-24 object-contain image-rendering-pixelated mb-2"
          loading="lazy"
        />
        <p class="text-sm md:text-base font-semibold capitalize text-gray-800">
          {{ card.name }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  card: {
    type: Object,
    required: true,
  },
  isFlipped: {
    type: Boolean,
    default: false,
  },
  isMatched: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['click']);
</script>

<style scoped>
.preserve-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}

.image-rendering-pixelated {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}
</style>
