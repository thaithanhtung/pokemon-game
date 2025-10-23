<template>
  <div 
    ref="cardContainer" 
    class="babylon-card-container"
    :class="[sizeClasses, { 'is-loading': loading }]"
  >
    <!-- Babylon canvas will be inserted here -->
    
    <!-- Loading overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
    
    <!-- Fallback content if Babylon fails -->
    <div v-if="error" class="error-overlay">
      <BattleCard :card="card" :size="size" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { BabylonCardAnimation, createCardScene } from '@/utils/babylon-card-animations';
import BattleCard from './BattleCard.vue';

const props = defineProps({
  card: {
    type: Object,
    required: true,
  },
  size: {
    type: String,
    default: 'medium',
    validator: value => ['small', 'medium', 'large'].includes(value),
  },
  enableHover: {
    type: Boolean,
    default: true,
  },
  enableFlip: {
    type: Boolean,
    default: true,
  },
  holographic: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['click', 'loaded', 'error']);

const cardContainer = ref(null);
const loading = ref(true);
const error = ref(false);
let babylonAnimation = null;

const sizeClasses = computed(() => {
  const sizes = {
    small: 'w-32 h-44',
    medium: 'w-40 h-56',
    large: 'w-48 h-64',
  };
  return sizes[props.size];
});

const isMegaPokemon = computed(() => {
  return props.card.name?.toLowerCase().includes('mega') || 
         props.card.category === 'mega' ||
         (props.card.pokemonId >= 10001 && props.card.pokemonId <= 10500);
});

onMounted(async () => {
  try {
    if (!cardContainer.value) return;

    // Add delay for smooth loading
    await new Promise(resolve => setTimeout(resolve, 100));

    // Create Babylon scene
    babylonAnimation = createCardScene(cardContainer.value, props.card, {
      holographic: props.holographic || isMegaPokemon.value,
      rarity: props.card.rarity,
    });

    // Add click handler
    cardContainer.value.addEventListener('click', handleClick);

    loading.value = false;
    emit('loaded');
  } catch (err) {
    console.error('Failed to create Babylon card:', err);
    error.value = true;
    loading.value = false;
    emit('error', err);
  }
});

onUnmounted(() => {
  if (babylonAnimation) {
    babylonAnimation.dispose();
  }
  if (cardContainer.value) {
    cardContainer.value.removeEventListener('click', handleClick);
  }
});

const handleClick = () => {
  emit('click', props.card);
};

// Watch for card changes
watch(() => props.card, (newCard) => {
  if (babylonAnimation && newCard) {
    babylonAnimation.createCardMesh(newCard, {
      holographic: props.holographic || isMegaPokemon.value,
      rarity: newCard.rarity,
    });
  }
});
</script>

<style scoped>
.babylon-card-container {
  position: relative;
  cursor: pointer;
  transition: transform 0.3s ease;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.babylon-card-container:hover {
  transform: translateY(-4px);
}

.babylon-card-container canvas {
  border-radius: 12px;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  border-radius: 12px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-overlay {
  position: absolute;
  inset: 0;
}

/* Size-specific styles */
.w-32 {
  width: 8rem;
}

.h-44 {
  height: 11rem;
}

.w-40 {
  width: 10rem;
}

.h-56 {
  height: 14rem;
}

.w-48 {
  width: 12rem;
}

.h-64 {
  height: 16rem;
}

/* Glow effect for container */
.babylon-card-container::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 14px;
  padding: 2px;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: destination-out;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.babylon-card-container:hover::before {
  opacity: 1;
}

/* Special effects for loading state */
.is-loading::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>