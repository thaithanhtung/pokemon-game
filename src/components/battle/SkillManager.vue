<template>
  <div class="skill-manager">
    <!-- Energy Bar -->
    <div class="energy-bar-container">
      <div class="energy-bar">
        <div class="energy-fill" :style="{ width: energyPercentage + '%' }">
          <div class="energy-glow"></div>
        </div>
        <div class="energy-segments">
          <div v-for="i in maxEnergy" :key="i" class="energy-segment"></div>
        </div>
      </div>
      <div class="energy-text">{{ currentEnergy }} / {{ maxEnergy }} ⚡</div>
    </div>

    <!-- Combo Indicator -->
    <div v-if="comboChain.length > 0" class="combo-indicator">
      <div class="combo-chain">
        <div v-for="(skill, index) in comboChain" :key="index" class="combo-skill">
          <img :src="getSkillIcon(skill)" :alt="skill.name" />
          <span v-if="index < comboChain.length - 1">→</span>
        </div>
      </div>
      <div class="combo-bonus">Combo x{{ comboMultiplier }}!</div>
    </div>

    <!-- Skills Grid -->
    <div class="skills-grid">
      <div
        v-for="skill in availableSkills"
        :key="skill.id"
        class="skill-card"
        :class="{
          disabled: !canUseSkill(skill),
          selected: selectedSkill?.id === skill.id,
          combo: isComboSkill(skill),
          cooldown: skill.currentCooldown > 0,
          ultimate: skill.category === 'ultimate',
          [`element-${skill.element}`]: true
        }"
        @click="selectSkill(skill)"
        @mouseenter="hoveredSkill = skill"
        @mouseleave="hoveredSkill = null"
      >
        <!-- Background Effects -->
        <div class="skill-bg-effects">
          <div class="skill-glow"></div>
          <div class="skill-particles"></div>
        </div>

        <!-- Skill Icon -->
        <div class="skill-icon-wrapper">
          <div class="skill-icon-bg"></div>
          <div class="skill-icon" :class="`element-${skill.element}`">
            <span class="skill-emoji">{{ getSkillEmoji(skill) }}</span>
            <div v-if="skill.currentCooldown > 0" class="cooldown-overlay">
              <span class="cooldown-number">{{ skill.currentCooldown }}</span>
              <svg class="cooldown-circle" viewBox="0 0 60 60">
                <circle
                  cx="30"
                  cy="30"
                  r="28"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  stroke-width="4"
                />
                <circle
                  cx="30"
                  cy="30"
                  r="28"
                  fill="none"
                  stroke="rgba(255,255,255,0.8)"
                  stroke-width="4"
                  :stroke-dasharray="`${176 * (1 - skill.currentCooldown / skill.cooldown)} 176`"
                  transform="rotate(-90 30 30)"
                />
              </svg>
            </div>
          </div>
          <div class="skill-level" v-if="skill.level">Lv.{{ skill.level }}</div>
        </div>

        <!-- Category Badge -->
        <div class="category-badge" :class="skill.category">
          {{ skill.category }}
        </div>

        <!-- Skill Info -->
        <div class="skill-info">
          <h4 class="skill-name">{{ skill.name }}</h4>
          <div class="skill-type-line">
            <span class="element-tag" :class="`element-${skill.element}`">
              {{ skill.element }}
            </span>
          </div>
          <div class="skill-stats">
            <div class="stat-item power" v-if="skill.power > 0">
              <div class="stat-icon">⚔️</div>
              <div class="stat-value">{{ skill.power }}</div>
            </div>
            <div class="stat-item energy">
              <div class="stat-icon">⚡</div>
              <div class="stat-value">{{ skill.energy }}</div>
            </div>
            <div class="stat-item accuracy" v-if="skill.accuracy < 100">
              <div class="stat-icon">🎯</div>
              <div class="stat-value">{{ skill.accuracy }}%</div>
            </div>
          </div>
        </div>

        <!-- Effect Indicators -->
        <div class="effect-indicators">
          <div v-if="isComboSkill(skill)" class="effect-indicator combo">
            <i class="fas fa-link"></i>
          </div>
          <div v-if="skill.effects?.some(e => e.type === 'heal')" class="effect-indicator heal">
            <i class="fas fa-heart"></i>
          </div>
          <div v-if="skill.effects?.some(e => e.type === 'buff')" class="effect-indicator buff">
            <i class="fas fa-arrow-up"></i>
          </div>
          <div v-if="skill.effects?.some(e => e.type === 'status')" class="effect-indicator status">
            <i class="fas fa-dizzy"></i>
          </div>
        </div>

        <!-- Ready Indicator -->
        <div v-if="canUseSkill(skill)" class="ready-indicator"></div>
      </div>
    </div>

    <!-- Skill Tooltip -->
    <Transition name="tooltip">
      <div v-if="hoveredSkill" class="skill-tooltip">
        <h3>{{ hoveredSkill.name }}</h3>
        <p class="skill-description">{{ hoveredSkill.description }}</p>
        
        <div class="tooltip-stats">
          <div class="stat-row">
            <span class="stat-label">Type:</span>
            <span :class="`element-${hoveredSkill.element}`">{{ hoveredSkill.element }}</span>
          </div>
          <div class="stat-row" v-if="hoveredSkill.power > 0">
            <span class="stat-label">Power:</span>
            <span>{{ hoveredSkill.power }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Accuracy:</span>
            <span>{{ hoveredSkill.accuracy }}%</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Energy Cost:</span>
            <span>{{ hoveredSkill.energy }} ⚡</span>
          </div>
          <div class="stat-row" v-if="hoveredSkill.cooldown > 0">
            <span class="stat-label">Cooldown:</span>
            <span>{{ hoveredSkill.cooldown }} turns</span>
          </div>
        </div>

        <div v-if="hoveredSkill.effects?.length > 0" class="tooltip-effects">
          <h4>Effects:</h4>
          <div v-for="(effect, index) in hoveredSkill.effects" :key="index" class="effect-item">
            {{ getEffectDescription(effect) }}
          </div>
        </div>

        <div v-if="hoveredSkill.combo" class="tooltip-combo">
          <h4>Combo:</h4>
          <p v-if="hoveredSkill.combo.requiresSkill">
            Use after {{ getSkillById(hoveredSkill.combo.requiresSkill)?.name }}
          </p>
          <p v-if="hoveredSkill.combo.bonusDamage">
            +{{ hoveredSkill.combo.bonusDamage }}% damage bonus
          </p>
        </div>

        <div v-if="!canUseSkill(hoveredSkill)" class="tooltip-warning">
          {{ getSkillWarning(hoveredSkill) }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Skill, SkillEffect } from '@/types/skills';
import { getSkillById } from '@/types/skills';

interface Props {
  skills: Skill[];
  currentEnergy: number;
  maxEnergy: number;
  isPlayerTurn: boolean;
  lastUsedSkill?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'use-skill': [skill: Skill];
}>();

const selectedSkill = ref<Skill | null>(null);
const hoveredSkill = ref<Skill | null>(null);
const comboChain = ref<Skill[]>([]);
const comboTimer = ref<number | null>(null);

// Available skills (not on cooldown)
const availableSkills = computed(() => {
  console.log('SkillManager - Received skills:', props.skills);
  console.log('SkillManager - Current energy:', props.currentEnergy);
  console.log('SkillManager - Is player turn:', props.isPlayerTurn);
  
  const mapped = props.skills.map(skill => ({
    ...skill,
    currentCooldown: skill.currentCooldown || 0
  }));
  
  console.log('SkillManager - Available skills after mapping:', mapped);
  return mapped;
});

// Energy percentage for visual bar
const energyPercentage = computed(() => {
  return (props.currentEnergy / props.maxEnergy) * 100;
});

// Combo multiplier based on chain length
const comboMultiplier = computed(() => {
  return Math.min(1 + comboChain.value.length * 0.5, 3);
});

// Check if player can use a skill
const canUseSkill = (skill: Skill): boolean => {
  if (!props.isPlayerTurn) return false;
  if (props.currentEnergy < skill.energy) return false;
  if (skill.currentCooldown && skill.currentCooldown > 0) return false;
  return true;
};

// Check if skill is part of a combo
const isComboSkill = (skill: Skill): boolean => {
  if (!skill.combo) return false;
  if (!skill.combo.requiresSkill) return true;
  
  // Check if the required skill was used recently
  return comboChain.value.some(s => s.id === skill.combo!.requiresSkill);
};

// Select and use a skill
const selectSkill = (skill: Skill) => {
  if (!canUseSkill(skill)) return;

  selectedSkill.value = skill;
  
  // Check for combo
  if (isComboSkill(skill)) {
    comboChain.value.push(skill);
    resetComboTimer();
  } else {
    comboChain.value = [skill];
  }

  // Emit skill use event
  emit('use-skill', skill);

  // Clear selection after a short delay
  setTimeout(() => {
    selectedSkill.value = null;
  }, 500);
};

// Reset combo timer
const resetComboTimer = () => {
  if (comboTimer.value) {
    clearTimeout(comboTimer.value);
  }
  
  comboTimer.value = setTimeout(() => {
    comboChain.value = [];
  }, 5000) as any; // 5 seconds to continue combo
};

// Get skill icon (placeholder for now)
const getSkillIcon = (skill: Skill): string => {
  // In a real implementation, this would return actual skill icons
  const elementIcons: Record<string, string> = {
    fire: '🔥',
    water: '💧',
    grass: '🌿',
    electric: '⚡',
    ice: '❄️',
    psychic: '🔮',
    normal: '✨',
    fighting: '👊',
    flying: '🦅',
    poison: '☠️',
    ground: '⛰️',
    rock: '🪨',
    bug: '🐛',
    ghost: '👻',
    steel: '⚙️',
    dragon: '🐉',
    dark: '🌑',
    fairy: '🧚'
  };
  
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><text x="32" y="40" font-size="32" text-anchor="middle">${elementIcons[skill.element] || '❓'}</text></svg>`;
};

// Get skill emoji
const getSkillEmoji = (skill: Skill): string => {
  const elementIcons: Record<string, string> = {
    fire: '🔥',
    water: '💧',
    grass: '🌿',
    electric: '⚡',
    ice: '❄️',
    psychic: '🔮',
    normal: '✨',
    fighting: '👊',
    flying: '🦅',
    poison: '☠️',
    ground: '⛰️',
    rock: '🪨',
    bug: '🐛',
    ghost: '👻',
    steel: '⚙️',
    dragon: '🐉',
    dark: '🌑',
    fairy: '🧚'
  };
  return elementIcons[skill.element] || '❓';
};

// Get effect description
const getEffectDescription = (effect: SkillEffect): string => {
  switch (effect.type) {
    case 'damage':
      return `Deals ${effect.value} damage`;
    case 'heal':
      return `Restores ${effect.value} HP`;
    case 'buff':
      return `Increases ${effect.stat} by ${effect.value}% for ${effect.duration} turns`;
    case 'debuff':
      return `Decreases ${effect.stat} by ${effect.value}% for ${effect.duration} turns`;
    case 'status':
      return `${effect.chance}% chance to inflict ${effect.status}`;
    case 'shield':
      return `Creates a shield that blocks ${effect.value} damage for ${effect.duration} turns`;
    default:
      return 'Unknown effect';
  }
};

// Get warning message for unusable skills
const getSkillWarning = (skill: Skill): string => {
  if (props.currentEnergy < skill.energy) {
    return `Not enough energy (need ${skill.energy})`;
  }
  if (skill.currentCooldown && skill.currentCooldown > 0) {
    return `On cooldown (${skill.currentCooldown} turns)`;
  }
  if (!props.isPlayerTurn) {
    return "Not your turn";
  }
  return "";
};
</script>

<style scoped>
.skill-manager {
  position: relative;
}

/* Energy Bar */
.energy-bar-container {
  margin-bottom: 20px;
  text-align: center;
}

.energy-bar {
  position: relative;
  width: 100%;
  height: 30px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 15px;
  overflow: hidden;
}

.energy-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
  transition: width 0.5s ease;
}

.energy-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%);
  animation: pulse 2s ease-in-out infinite;
}

.energy-segments {
  position: absolute;
  inset: 0;
  display: flex;
  gap: 2px;
  padding: 2px;
}

.energy-segment {
  flex: 1;
  border-right: 2px solid rgba(0, 0, 0, 0.3);
}

.energy-segment:last-child {
  border-right: none;
}

.energy-text {
  margin-top: 5px;
  color: white;
  font-size: 14px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

/* Combo Indicator */
.combo-indicator {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #f59e0b;
  border-radius: 10px;
  padding: 10px 20px;
  animation: comboAppear 0.3s ease;
}

.combo-chain {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.combo-skill img {
  width: 30px;
  height: 30px;
  border-radius: 5px;
}

.combo-bonus {
  text-align: center;
  color: #fbbf24;
  font-weight: bold;
  font-size: 16px;
}

/* Skills Grid */
.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  padding: 10px;
}

.skill-card {
  position: relative;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%);
  border: 2px solid rgba(148, 163, 184, 0.3);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  backdrop-filter: blur(10px);
  min-height: 200px;
}

/* Background Effects */
.skill-bg-effects {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.skill-card:hover .skill-bg-effects {
  opacity: 1;
}

.skill-glow {
  position: absolute;
  inset: -50%;
  background: radial-gradient(circle at center, currentColor 0%, transparent 70%);
  opacity: 0.1;
  animation: rotate 20s linear infinite;
}

.skill-particles {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 20% 80%, currentColor 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, currentColor 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, currentColor 0%, transparent 50%);
  opacity: 0.05;
  animation: particleFloat 10s ease-in-out infinite;
}

/* Element-specific styles */
.skill-card.element-fire {
  border-color: rgba(239, 68, 68, 0.5);
  color: #ef4444;
}

.skill-card.element-water {
  border-color: rgba(59, 130, 246, 0.5);
  color: #3b82f6;
}

.skill-card.element-grass {
  border-color: rgba(16, 185, 129, 0.5);
  color: #10b981;
}

.skill-card.element-electric {
  border-color: rgba(234, 179, 8, 0.5);
  color: #eab308;
}

.skill-card.element-psychic {
  border-color: rgba(236, 72, 153, 0.5);
  color: #ec4899;
}

.skill-card.element-ice {
  border-color: rgba(6, 182, 212, 0.5);
  color: #06b6d4;
}

.skill-card.element-dragon {
  border-color: rgba(91, 33, 182, 0.5);
  color: #5b21b6;
}

.skill-card.element-dark {
  border-color: rgba(31, 41, 55, 0.5);
  color: #1f2937;
}

.skill-card.element-fairy {
  border-color: rgba(244, 114, 182, 0.5);
  color: #f472b6;
}

.skill-card:hover:not(.disabled) {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.skill-card.selected {
  transform: scale(1.05);
  box-shadow: 0 0 30px currentColor;
  animation: skillActivate 0.5s ease;
}

.skill-card.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

.skill-card.disabled:hover {
  transform: none;
  box-shadow: none;
}

.skill-card.combo {
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
}

.skill-card.ultimate {
  background: linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%);
}

/* Skill Icon */
.skill-icon-wrapper {
  position: relative;
  margin-bottom: 15px;
  display: flex;
  justify-content: center;
}

.skill-icon-bg {
  position: absolute;
  width: 70px;
  height: 70px;
  background: radial-gradient(circle, currentColor 0%, transparent 60%);
  opacity: 0.1;
  border-radius: 50%;
  animation: pulse 3s ease-in-out infinite;
}

.skill-icon {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 2px solid currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.skill-card:hover .skill-icon {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.skill-emoji {
  font-size: 32px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  z-index: 1;
}

.cooldown-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.cooldown-number {
  color: white;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  z-index: 2;
}

.cooldown-circle {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.skill-level {
  position: absolute;
  top: -5px;
  right: -5px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

/* Category Badge */
.category-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  background: rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.category-badge.physical {
  background: rgba(220, 38, 38, 0.2);
  border-color: rgba(220, 38, 38, 0.4);
}

.category-badge.special {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
}

.category-badge.status {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.4);
}

.category-badge.ultimate {
  background: linear-gradient(90deg, rgba(168, 85, 247, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%);
  border-color: rgba(168, 85, 247, 0.5);
}

/* Skill Info */
.skill-info {
  text-align: center;
  position: relative;
  z-index: 1;
}

.skill-name {
  color: white;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.skill-type-line {
  margin-bottom: 12px;
}

.element-tag {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid currentColor;
}

.skill-stats {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  font-size: 18px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}

.stat-value {
  font-size: 13px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.9);
}

/* Effect Indicators */
.effect-indicators {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  gap: 5px;
}

.effect-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.effect-indicator.combo {
  background: rgba(245, 158, 11, 0.2);
  border-color: rgba(245, 158, 11, 0.5);
  color: #f59e0b;
}

.effect-indicator.heal {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.5);
  color: #10b981;
}

.effect-indicator.buff {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
  color: #3b82f6;
}

.effect-indicator.status {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.5);
  color: #a855f7;
}

/* Ready Indicator */
.ready-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent 0%, currentColor 50%, transparent 100%);
  opacity: 0.8;
  animation: readyPulse 2s ease-in-out infinite;
}

@keyframes readyPulse {
  0%, 100% {
    opacity: 0.4;
    transform: scaleX(0.5);
  }
  50% {
    opacity: 1;
    transform: scaleX(1);
  }
}

/* Skill Tooltip */
.skill-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 280px;
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 10px;
  z-index: 100;
  pointer-events: none;
}

.skill-tooltip h3 {
  color: white;
  margin-bottom: 10px;
}

.skill-description {
  color: #94a3b8;
  font-size: 12px;
  margin-bottom: 10px;
}

.tooltip-stats {
  margin-bottom: 10px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 3px;
}

.stat-label {
  color: #64748b;
}

.tooltip-effects,
.tooltip-combo {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.tooltip-effects h4,
.tooltip-combo h4 {
  color: white;
  font-size: 12px;
  margin-bottom: 5px;
}

.effect-item {
  color: #94a3b8;
  font-size: 11px;
  margin-bottom: 3px;
}

.tooltip-warning {
  margin-top: 10px;
  padding: 5px;
  background: rgba(239, 68, 68, 0.2);
  border-radius: 5px;
  color: #f87171;
  font-size: 11px;
  text-align: center;
}

/* Element Colors */
.element-fire { color: #ef4444; }
.element-water { color: #3b82f6; }
.element-grass { color: #10b981; }
.element-electric { color: #eab308; }
.element-ice { color: #06b6d4; }
.element-psychic { color: #ec4899; }
.element-normal { color: #9ca3af; }
.element-fighting { color: #dc2626; }
.element-flying { color: #6366f1; }
.element-poison { color: #a855f7; }
.element-ground { color: #ca8a04; }
.element-rock { color: #a16207; }
.element-bug { color: #84cc16; }
.element-ghost { color: #7c3aed; }
.element-steel { color: #6b7280; }
.element-dragon { color: #5b21b6; }
.element-dark { color: #1f2937; }
.element-fairy { color: #f472b6; }

/* Animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes particleFloat {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  25% {
    transform: translateY(-10px) scale(1.1);
  }
  75% {
    transform: translateY(10px) scale(0.9);
  }
}

@keyframes comboAppear {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes skillActivate {
  0% {
    transform: scale(1) rotate(0deg);
  }
  25% {
    transform: scale(1.05) rotate(1deg);
  }
  50% {
    transform: scale(1.1) rotate(-1deg);
  }
  75% {
    transform: scale(1.05) rotate(1deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

/* Tooltip Transition */
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.2s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}
</style>