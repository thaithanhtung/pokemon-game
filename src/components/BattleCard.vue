<template>
  <div
    :class="[
      'battle-card relative cursor-pointer transition-all duration-300 rounded-lg',
      sizeClasses,
      {
        'hover:scale-105 hover:shadow-2xl': !disabled,
        'opacity-50 cursor-not-allowed': disabled,
        'ring-4 ring-yellow-400 shadow-[0_0_30px_rgba(251,191,36,0.6)] scale-105': selected,
        'anim-attack': card && card.anim && card.anim.type === 'attack',
        'anim-hit': card && card.anim && card.anim.type === 'hit',
        'anim-heal': card && card.anim && card.anim.type === 'heal',
        'mega-pokemon-card': isMegaPokemon,
      },
    ]"
    :data-element="card && card.anim ? card.anim.element : null"
    :data-anim="card && card.anim ? card.anim.type : null"
    @click="$emit('click', card)"
  >
    <!-- Card Background -->
    <div :class="['absolute inset-0 rounded-lg shadow-lg', rarityBackground]"></div>

    <!-- Rarity Glow Border -->
    <div
      :class="[
        'absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300',
        rarityGlowClass,
      ]"
      style="padding: 1px"
    ></div>

    <!-- Card Content -->
    <div class="relative z-10 h-full flex flex-col">
      <!-- Card Header -->
      <div
        class="px-2 py-1 flex flex-col bg-black/20 backdrop-blur-sm relative"
      >
        <div class="flex justify-between items-center">
          <span class="font-bold text-xs text-white drop-shadow-lg">
            {{ card.name }}
          </span>
          <span :class="['text-xs font-bold drop-shadow-lg', rarityTextColor]">{{
            card.rarity
          }}</span>
        </div>
        <div v-if="card.type === 'pokemon'" class="text-center">
          <span :class="[
            'text-xs font-bold',
            card.level && card.level > 1 ? 'text-yellow-400' : 'text-gray-400'
          ]">
            Lv.{{ card.level || 1 }}
          </span>
        </div>
        
        <!-- Mega Pokemon Badge -->
        <div
          v-if="isMegaPokemon"
          class="absolute -top-3 left-1/2 transform -translate-x-1/2 mega-badge"
        >
          <span class="mega-badge-rainbow text-xs font-bold text-white px-3 py-1 rounded-full shadow-lg">
            MEGA
          </span>
        </div>

        <!-- Type Badge (moved here) -->
        <div
          v-if="card.pokemonType"
          :class="[
            'absolute -top-1 -right-1 px-2 py-0.5 rounded text-xs font-bold text-white shadow-lg backdrop-blur-sm',
            getTypeColor(card.pokemonType),
          ]"
        >
          {{ card.pokemonType }}
        </div>
      </div>

      <!-- Card Image -->
      <div class="flex-1 flex items-center justify-center p-2 relative">
        <div
          v-if="card.type === 'pokemon'"
          class="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"
        ></div>
        <img
          v-if="card.type === 'pokemon'"
          :src="card.image"
          :alt="card.name"
          class="w-full h-full object-contain image-rendering-pixelated relative z-10"
        />
        <div v-else class="text-4xl drop-shadow-lg filter brightness-110">
          {{ getCardIcon(card) }}
        </div>
      </div>

      <!-- Pokemon Stats -->
      <div
        v-if="card.type === 'pokemon'"
        class="px-2 py-2 bg-black/40 backdrop-blur-sm space-y-1.5"
      >
        <div class="flex justify-between items-center text-xs">
          <div class="flex items-center gap-1">
            <span class="text-red-400">❤️</span>
            <span class="text-white/80">HP</span>
          </div>
          <span class="font-bold text-red-300">{{ card.hp }}</span>
        </div>
        <div class="flex justify-between items-center text-xs">
          <div class="flex items-center gap-1">
            <span class="text-orange-400">⚔️</span>
            <span class="text-white/80">ATK</span>
          </div>
          <span class="font-bold text-orange-300">{{ card.atk }}</span>
        </div>
        <div class="flex justify-between items-center text-xs">
          <div class="flex items-center gap-1">
            <span class="text-blue-400">🛡️</span>
            <span class="text-white/80">DEF</span>
          </div>
          <span class="font-bold text-blue-300">{{ card.def }}</span>
        </div>
        <div class="flex justify-between items-center text-xs">
          <div class="flex items-center gap-1">
            <span class="text-green-400">⚡</span>
            <span class="text-white/80">SPD</span>
          </div>
          <span class="font-bold text-green-300">{{ card.spd }}</span>
        </div>
      </div>

      <!-- Skill/Item Description -->
      <div v-else class="px-2 py-2 bg-black/40 backdrop-blur-sm">
        <p class="text-xs text-white/90 leading-relaxed">{{ card.description }}</p>
        <div
          v-if="card.energy"
          class="mt-2 flex items-center justify-center gap-1 bg-yellow-900/30 rounded px-2 py-1 border border-yellow-500/30"
        >
          <span class="text-xs font-semibold text-yellow-300">Cost:</span>
          <span class="text-xs font-bold text-yellow-400">{{ card.energy }} ⚡</span>
        </div>
      </div>
    </div>

    <!-- Elemental overlay removed; handled by ParticlesEffect in BattleArena -->

    <!-- Hover Effect -->
    <div
      v-if="!disabled"
      class="absolute inset-0 rounded-lg bg-gradient-to-t from-transparent to-white opacity-0 hover:opacity-20 transition-opacity pointer-events-none"
    ></div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getTypeColor as pokeTypeColor } from '@/services/pokeapi';

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
  disabled: {
    type: Boolean,
    default: false,
  },
  selected: {
    type: Boolean,
    default: false,
  },
});

// Check if this is a mega Pokemon
const isMegaPokemon = computed(() => {
  return props.card.name?.toLowerCase().includes('mega') || 
         props.card.category === 'mega' ||
         (props.card.pokemonId >= 10001 && props.card.pokemonId <= 10500); // Mega Pokemon ID range
});

defineEmits(['click']);

const sizeClasses = computed(() => {
  const sizes = {
    small: 'w-28 ',
    medium: 'w-36 ',
    large: 'w-44 ',
  };
  return sizes[props.size];
});

const rarityBackground = computed(() => {
  // Special background for mega Pokemon - rainbow gradient
  if (isMegaPokemon.value) {
    return 'mega-rainbow-gradient';
  }
  
  const backgrounds = {
    C: 'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-900',
    R: 'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900',
    E: 'bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900',
    L: 'bg-gradient-to-br from-orange-500 via-red-600 to-pink-700',
  };
  return backgrounds[props.card.rarity] || backgrounds.C;
});

const rarityTextColor = computed(() => {
  const colors = {
    C: 'text-gray-300',
    R: 'text-blue-300',
    E: 'text-purple-300',
    L: 'text-orange-300',
  };
  return colors[props.card.rarity] || colors.C;
});

const rarityGlowClass = computed(() => {
  // Special glow for mega Pokemon
  if (isMegaPokemon.value) {
    return 'shadow-[0_0_35px_rgba(236,72,153,0.9)]';
  }
  
  const glows = {
    C: 'shadow-[0_0_15px_rgba(156,163,175,0.3)]',
    R: 'shadow-[0_0_20px_rgba(59,130,246,0.5)]',
    E: 'shadow-[0_0_25px_rgba(147,51,234,0.6)]',
    L: 'shadow-[0_0_30px_rgba(249,115,22,0.8)]',
  };
  return glows[props.card.rarity] || glows.C;
});

const getCardIcon = card => {
  if (card.type === 'skill') {
    if (card.name.includes('Heal')) return '💚';
    if (card.name.includes('Attack')) return '⚔️';
    if (card.name.includes('Protect')) return '🛡️';
    if (card.name.includes('Cleanse')) return '✨';
    return '📜';
  }

  if (card.type === 'item') {
    if (card.name.includes('Potion')) return '🧪';
    if (card.name.includes('Energy')) return '💎';
    if (card.name.includes('Revive')) return '🔮';
    return '📦';
  }

  return '❓';
};

const getTypeColor = type => {
  return pokeTypeColor(type);
};
</script>

<style scoped>
.battle-card {
  perspective: 1000px;
  position: relative;
  overflow: hidden;
}

.battle-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 70%
  );
  transform: rotate(45deg);
  pointer-events: none;
  transition: all 0.6s ease;
  opacity: 0;
}

.battle-card:hover::before {
  opacity: 1;
  animation: shine 2s ease-in-out infinite;
}

.battle-card:hover .absolute.inset-0.rounded-lg.opacity-0 {
  opacity: 1 !important;
}

@keyframes shine {
  0% {
    top: -50%;
    left: -50%;
  }
  100% {
    top: 150%;
    left: 150%;
  }
}

.image-rendering-pixelated {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  transition: transform 0.3s ease;
}

.battle-card:hover .image-rendering-pixelated {
  transform: scale(1.1) translateY(-2px);
}

/* Particle effect for legendary cards */
.battle-card {
  --particle-color: rgba(255, 255, 255, 0.3);
}

/* Add subtle border pulse for selected cards */
@keyframes pulse-ring {
  0%,
  100% {
    box-shadow: 0 0 30px rgba(251, 191, 36, 0.6);
  }
  50% {
    box-shadow: 0 0 50px rgba(251, 191, 36, 0.9);
  }
}

.ring-4.ring-yellow-400 {
  animation: pulse-ring 2s ease-in-out infinite;
}

/* Attack / Hit / Heal animations */
@keyframes lunge {
  0% {
    transform: translateX(0) scale(1);
  }
  30% {
    transform: translateX(6px) scale(1.03);
  }
  60% {
    transform: translateX(-2px) scale(1.01);
  }
  100% {
    transform: translateX(0) scale(1);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  15% {
    transform: translateX(-10px);
  }
  30% {
    transform: translateX(10px);
  }
  45% {
    transform: translateX(-8px);
  }
  60% {
    transform: translateX(8px);
  }
  75% {
    transform: translateX(-5px);
  }
}

@keyframes healPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6);
  }
  100% {
    box-shadow: 0 0 0 18px rgba(34, 197, 94, 0);
  }
}

.anim-attack {
  animation: lunge 0.45s ease-out both;
}

.anim-hit {
  animation: shake 0.55s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

/* subtle white flash on hit */
.anim-hit::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.25);
  filter: blur(2px);
  animation: hit-flash 220ms ease-out;
  pointer-events: none;
}

@keyframes hit-flash {
  0% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
  }
}

.anim-heal::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 0.5rem; /* match rounded-lg */
  pointer-events: none;
  animation: healPulse 0.6s ease-out;
}

/* Element overlays for elemental attacks (soft glow) */
.anim-attack[data-element='fire']::after,
.anim-hit[data-element='fire']::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(248, 113, 113, 0.25), transparent 60%);
  pointer-events: none;
}
.anim-attack[data-element='water']::after,
.anim-hit[data-element='water']::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(96, 165, 250, 0.25), transparent 60%);
  pointer-events: none;
}
.anim-attack[data-element='grass']::after,
.anim-hit[data-element='grass']::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(74, 222, 128, 0.25), transparent 60%);
  pointer-events: none;
}
.anim-attack[data-element='electric']::after,
.anim-hit[data-element='electric']::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(250, 204, 21, 0.25), transparent 60%);
  pointer-events: none;
}

/* Advanced Elemental Effects */
/* Water attack - waves sweeping right */
.effect-water {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.effect-water .wave {
  position: absolute;
  left: -20%;
  width: 40%;
  height: 20%;
  background: rgba(96, 165, 250, 0.35);
  filter: blur(2px);
  border-radius: 9999px;
  animation: wave-sweep 0.6s ease-out forwards;
}
.effect-water .wave:nth-child(1) {
  top: 15%;
  animation-delay: 0ms;
}
.effect-water .wave:nth-child(2) {
  top: 35%;
  animation-delay: 40ms;
}
.effect-water .wave:nth-child(3) {
  top: 55%;
  animation-delay: 80ms;
}
.effect-water .wave:nth-child(4) {
  top: 75%;
  animation-delay: 120ms;
}
.effect-water .wave:nth-child(5) {
  top: 25%;
  animation-delay: 160ms;
}
.effect-water .wave:nth-child(6) {
  top: 65%;
  animation-delay: 200ms;
}
@keyframes wave-sweep {
  0% {
    transform: translateX(0) skewX(-10deg);
    opacity: 0.8;
  }
  100% {
    transform: translateX(260%) skewX(-10deg);
    opacity: 0;
  }
}
.impact-water {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.55), transparent 45%),
    radial-gradient(circle at 60% 52%, rgba(125, 211, 252, 0.35), transparent 55%);
  animation: impact-pop 0.48s ease-out;
}
@keyframes impact-pop {
  0% {
    opacity: 0.95;
    transform: scale(0.85);
  }
  100% {
    opacity: 0;
    transform: scale(1.35);
  }
}

/* Fire attack - embers flying */
.effect-fire {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.effect-fire .ember {
  position: absolute;
  left: 0%;
  bottom: 10%;
  width: 6px;
  height: 6px;
  background: linear-gradient(to top, rgba(248, 113, 113, 0.9), rgba(251, 146, 60, 0.9));
  border-radius: 9999px;
  box-shadow: 0 0 10px rgba(251, 146, 60, 0.8);
  animation: ember-fly 0.6s ease-out forwards;
}
.effect-fire .ember:nth-child(odd) {
  bottom: 20%;
}
.effect-fire .ember:nth-child(3) {
  bottom: 35%;
}
.effect-fire .ember:nth-child(4) {
  bottom: 50%;
}
.effect-fire .ember:nth-child(5) {
  bottom: 65%;
}
.effect-fire .ember:nth-child(6) {
  bottom: 30%;
}
.effect-fire .ember:nth-child(7) {
  bottom: 45%;
}
.effect-fire .ember:nth-child(8) {
  bottom: 55%;
}
.effect-fire .ember:nth-child(9) {
  bottom: 25%;
}
.effect-fire .ember:nth-child(10) {
  bottom: 40%;
}
@keyframes ember-fly {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  70% {
    transform: translate(140%, -40%) scale(1.2);
    opacity: 0.9;
  }
  100% {
    transform: translate(260%, -60%) scale(0.9);
    opacity: 0;
  }
}
.impact-fire {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 60% 50%, rgba(251, 146, 60, 0.65), transparent 52%),
    radial-gradient(circle at 40% 50%, rgba(248, 113, 113, 0.45), transparent 60%),
    radial-gradient(circle at 50% 60%, rgba(234, 88, 12, 0.35), transparent 65%);
  animation: burn 0.55s ease-out;
}
@keyframes burn {
  0% {
    opacity: 0.95;
    transform: scale(0.95);
  }
  100% {
    opacity: 0;
    transform: scale(1.15);
  }
}

/* Electric attack - lightning bolts */
.effect-electric {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.effect-electric .bolt {
  position: absolute;
  left: 5%;
  top: 10%;
  width: 2px;
  height: 28%;
  background: linear-gradient(to bottom, rgba(250, 204, 21, 1), rgba(234, 179, 8, 0.8));
  box-shadow: 0 0 14px rgba(250, 204, 21, 0.9);
  transform: skewX(-20deg);
  animation: bolt-zap 0.45s ease-out forwards;
}
.effect-electric .bolt--light {
  height: 20%;
  opacity: 0.8;
}
.effect-electric .bolt--heavy {
  height: 34%;
  box-shadow: 0 0 20px rgba(250, 204, 21, 1);
}
.effect-electric .bolt:nth-child(2) {
  top: 40%;
  left: 10%;
  transform: skewX(15deg);
}
.effect-electric .bolt:nth-child(3) {
  top: 20%;
  left: 15%;
  transform: skewX(-10deg);
}
.effect-electric .bolt:nth-child(4) {
  top: 60%;
  left: 6%;
  transform: skewX(10deg);
}
@keyframes bolt-zap {
  0% {
    transform: translateX(0) skewX(-20deg);
    opacity: 1;
  }
  100% {
    transform: translateX(260%) skewX(-20deg);
    opacity: 0;
  }
}
.impact-electric {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 50%, rgba(250, 204, 21, 0.65), transparent 50%),
    radial-gradient(circle at 52% 48%, rgba(253, 224, 71, 0.35), transparent 60%);
  animation: shock 0.45s ease-out;
}
@keyframes shock {
  0% {
    opacity: 1;
    filter: brightness(1.35) saturate(1.1);
    transform: scale(0.95);
  }
  100% {
    opacity: 0;
    filter: brightness(1);
    transform: scale(1.1);
  }
}

/* Grass attack - leaves flying */
.effect-grass {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.effect-grass .leaf {
  position: absolute;
  left: -10%;
  top: 20%;
  font-size: 14px;
  animation: leaf-fly 0.7s ease-out forwards;
}
.effect-grass .leaf--heavy {
  font-size: 18px;
  filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.6));
}
.effect-grass .leaf:nth-child(2) {
  top: 35%;
}
.effect-grass .leaf:nth-child(3) {
  top: 50%;
}
.effect-grass .leaf:nth-child(4) {
  top: 65%;
}
.effect-grass .leaf:nth-child(5) {
  top: 28%;
}
.effect-grass .leaf:nth-child(6) {
  top: 42%;
}
.effect-grass .leaf:nth-child(7) {
  top: 58%;
}
.effect-grass .leaf:nth-child(8) {
  top: 72%;
}
@keyframes leaf-fly {
  0% {
    transform: translateX(0) rotate(0deg);
    opacity: 0.95;
  }
  60% {
    transform: translateX(180%) rotate(45deg);
    opacity: 0.9;
  }
  100% {
    transform: translateX(260%) rotate(90deg);
    opacity: 0;
  }
}
.impact-grass {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.5), transparent 50%),
    radial-gradient(circle at 48% 52%, rgba(74, 222, 128, 0.35), transparent 60%);
  animation: impact-pop 0.48s ease-out;
}

/* Element overlays for elemental attacks */
.anim-attack[data-element='fire']::after,
.anim-hit[data-element='fire']::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(248, 113, 113, 0.35), transparent 60%);
  pointer-events: none;
}

.anim-attack[data-element='water']::after,
.anim-hit[data-element='water']::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(96, 165, 250, 0.35), transparent 60%);
  pointer-events: none;
}

.anim-attack[data-element='grass']::after,
.anim-hit[data-element='grass']::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(74, 222, 128, 0.35), transparent 60%);
  pointer-events: none;
}

.anim-attack[data-element='electric']::after,
.anim-hit[data-element='electric']::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(250, 204, 21, 0.35), transparent 60%);
  pointer-events: none;
}

/* Poison effects */
.effect-poison {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.effect-poison .cloud {
  position: absolute;
  left: 10%;
  top: 20%;
  width: 40%;
  height: 30%;
  background: radial-gradient(circle at 60% 40%, rgba(139, 92, 246, 0.35), rgba(34, 197, 94, 0.25));
  filter: blur(6px) saturate(1.2);
  border-radius: 9999px;
  animation: toxic 0.9s ease-out forwards;
}
.effect-poison--light .cloud {
  width: 30%;
  height: 20%;
  opacity: 0.8;
}
.effect-poison .cloud:nth-child(2) {
  left: 35%;
  top: 35%;
  animation-delay: 60ms;
}
.effect-poison .cloud:nth-child(3) {
  left: 20%;
  top: 55%;
  animation-delay: 120ms;
}
.effect-poison .cloud:nth-child(4) {
  left: 50%;
  top: 25%;
  animation-delay: 180ms;
}
.effect-poison .cloud:nth-child(5) {
  left: 60%;
  top: 45%;
  animation-delay: 220ms;
}
@keyframes toxic {
  0% {
    transform: scale(0.9);
    opacity: 0.7;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}
.impact-poison {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 50%, rgba(185, 28, 28, 0.35), transparent 55%),
    radial-gradient(circle at 52% 48%, rgba(22, 163, 74, 0.25), transparent 65%);
  animation: impact-pop 0.48s ease-out;
}

/* Mega Pokemon Special Styles */
.mega-pokemon-card {
  position: relative;
  overflow: visible;
}

.mega-pokemon-card::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 12px;
  background: linear-gradient(
    45deg,
    #ff0000,
    #ff7f00,
    #ffff00,
    #00ff00,
    #0000ff,
    #4b0082,
    #9400d3,
    #ff0000
  );
  background-size: 400% 400%;
  animation: rainbow-shift 3s ease infinite;
  opacity: 0.9;
  z-index: -1;
}

.mega-pokemon-card:hover::before {
  opacity: 1;
  animation: rainbow-shift 1.5s ease infinite;
  filter: brightness(1.2);
}

@keyframes rainbow-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Mega Rainbow Gradient Background */
.mega-rainbow-gradient {
  background: linear-gradient(
    135deg,
    #ff0080 0%,
    #ff8c00 14%,
    #ffd700 28%,
    #00ff00 42%,
    #00ffff 56%,
    #0080ff 70%,
    #8000ff 84%,
    #ff0080 100%
  );
  background-size: 200% 200%;
  animation: rainbow-wave 8s ease infinite;
}

@keyframes rainbow-wave {
  0% {
    background-position: 0% 0%;
  }
  25% {
    background-position: 100% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
  75% {
    background-position: 0% 100%;
  }
  100% {
    background-position: 0% 0%;
  }
}

.mega-rainbow-gradient::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(255, 255, 255, 0.3) 0%,
    transparent 50%
  );
  mix-blend-mode: overlay;
  animation: mega-pulse 2s ease-in-out infinite;
}

@keyframes mega-pulse {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.6;
  }
}

.mega-badge {
  z-index: 20;
  animation: badge-float 2s ease-in-out infinite;
}

.mega-badge-rainbow {
  background: linear-gradient(
    90deg,
    #ff0080,
    #ff8c00,
    #ffd700,
    #00ff00,
    #00ffff,
    #0080ff,
    #8000ff,
    #ff0080
  );
  background-size: 200% 100%;
  animation: rainbow-slide 2s linear infinite;
  border: 2px solid rgba(255, 255, 255, 0.8);
  font-weight: 900;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
}

@keyframes rainbow-slide {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}

@keyframes badge-float {
  0%, 100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-2px);
  }
}

/* Mega Pokemon Image Effects */
.mega-pokemon-card .image-rendering-pixelated {
  filter: drop-shadow(0 0 10px rgba(236, 72, 153, 0.5));
}

.mega-pokemon-card:hover .image-rendering-pixelated {
  filter: drop-shadow(0 0 20px rgba(236, 72, 153, 0.8));
  transform: scale(1.15) translateY(-2px);
}

/* Enhanced stats section for Mega Pokemon */
.mega-pokemon-card .px-2.py-2.bg-black\/40 {
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), rgba(147, 51, 234, 0.2));
  border-top: 1px solid rgba(236, 72, 153, 0.5);
}

/* Mega Pokemon Particle Effect */
.mega-pokemon-card::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  background-image: 
    radial-gradient(circle, rgba(236, 72, 153, 0.8) 1px, transparent 1px),
    radial-gradient(circle, rgba(147, 51, 234, 0.8) 1px, transparent 1px);
  background-size: 50px 50px, 30px 30px;
  background-position: 0 0, 25px 25px;
  animation: mega-particles 20s linear infinite;
  opacity: 0.1;
  pointer-events: none;
}

@keyframes mega-particles {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}
</style>
