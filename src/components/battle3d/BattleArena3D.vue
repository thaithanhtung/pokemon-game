<template>
  <div class="battle-arena-3d">
    <canvas ref="babylonCanvas" class="babylon-canvas"></canvas>

    <!-- UI Overlay -->
    <div class="battle-ui-overlay">
      <!-- HP Bars -->
      <div class="hp-bars">
        <div class="player-hp">
          <div class="hp-bar">
            <div class="hp-fill" :style="{ width: playerHPPercentage + '%' }"></div>
          </div>
          <span class="hp-text">{{ playerHP }} / {{ playerMaxHP }}</span>
        </div>
        <div class="opponent-hp">
          <div class="hp-bar">
            <div class="hp-fill opponent" :style="{ width: opponentHPPercentage + '%' }"></div>
          </div>
          <span class="hp-text">{{ opponentHP }} / {{ opponentMaxHP }}</span>
        </div>
      </div>

      <!-- Energy Orbs -->
      <div class="energy-orbs">
        <div
          v-for="i in 5"
          :key="i"
          class="energy-orb"
          :class="{ active: i <= currentEnergy, consumed: i > currentEnergy }"
        >
          <div class="orb-glow"></div>
          <span class="orb-icon">⚡</span>
        </div>
      </div>

      <!-- Skill Manager -->
      <div v-if="isPlayerTurn" class="skill-manager-container">
        <SkillManager
          :skills="playerSkills"
          :current-energy="currentEnergy"
          :max-energy="maxEnergy"
          :is-player-turn="isPlayerTurn"
          :last-used-skill="lastUsedSkill"
          @use-skill="executeSkill"
        />
      </div>

      <!-- Battle Log -->
      <div class="battle-log">
        <div v-for="(log, index) in battleLogs" :key="index" class="log-entry" :class="log.type">
          {{ log.message }}
        </div>
      </div>

      <!-- Settings Button -->
      <button class="settings-btn" @click="showSettings = !showSettings">
        <i class="fas fa-cog"></i>
      </button>
    </div>

    <!-- Settings Modal -->
    <div v-if="showSettings" class="settings-modal">
      <div class="settings-content">
        <h3>Battle Settings</h3>
        <div class="setting-item">
          <label>Quality</label>
          <select v-model="qualityLevel" @change="updateQuality">
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" v-model="audioEnabled" />
            Audio Enabled
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" v-model="effectsEnabled" />
            Particle Effects
          </label>
        </div>
        <button @click="showSettings = false" class="close-settings">Close</button>
      </div>
    </div>
    <!-- Victory/Defeat Notification -->
    <Transition name="battle-result">
      <div v-if="battleResult" class="battle-result-overlay">
        <div class="battle-result-container" :class="battleResult">
          <div class="result-effects">
            <div class="result-glow"></div>
            <div class="result-particles"></div>
          </div>
          
          <h1 class="result-text">
            {{ battleResult === 'victory' ? 'VICTORY!' : 'DEFEAT' }}
          </h1>
          
          <div class="result-details">
            <p v-if="battleResult === 'victory'">
              Congratulations! You have defeated your opponent!
            </p>
            <p v-else>
              Your Pokemon has fainted. Better luck next time!
            </p>
          </div>
          
          <div class="result-rewards" v-if="battleResult === 'victory'">
            <div class="reward-item">
              <i class="fas fa-coins"></i>
              <span>+500 Coins</span>
            </div>
            <div class="reward-item">
              <i class="fas fa-star"></i>
              <span>+100 XP</span>
            </div>
          </div>
          
          <div class="result-actions">
            <button @click="$emit('battle-end', battleResult)" class="result-button primary">
              Continue
            </button>
            <button @click="restartBattle" class="result-button secondary">
              Battle Again
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { BattleCamera3D } from './BattleCamera3D';
import { Pokemon3DModel } from './Pokemon3DModel';
import { useBattle3DStore } from '@/stores/battle3D';
import { useCardBattleStore } from '@/stores/cardBattle';
import SkillManager from '@/components/battle/SkillManager.vue';
import { SKILL_DATABASE, calculateDamage, getEffectivenessText, TYPE_EFFECTIVENESS, getSkillsByType } from '@/types/skills';
import type { Skill, SkillElement } from '@/types/skills';
import { soundService } from '@/services/soundService';

interface BattleLog {
  message: string;
  type: 'info' | 'attack' | 'damage' | 'heal';
}

const props = defineProps<{
  battleId?: string;
  playerPokemon?: any;
  opponentPokemon?: any;
}>();

const emit = defineEmits<{
  'battle-start': [];
  'attack-hit': [data: any];
  'pokemon-faint': [data: any];
  'battle-end': [result: 'victory' | 'defeat'];
  'skill-executed': [skill: any];
}>();

const babylonCanvas = ref<HTMLCanvasElement | null>(null);
const battle3DStore = useBattle3DStore();
const cardBattleStore = useCardBattleStore();

// Battle state
const playerHP = ref(100);
const playerMaxHP = ref(100);
const opponentHP = ref(100);
const opponentMaxHP = ref(100);
const currentEnergy = ref(3);
const maxEnergy = ref(5);
const isPlayerTurn = ref(true);
const selectedSkill = ref<Skill | null>(null);
const lastUsedSkill = ref<string>('');
const battleLogs = ref<BattleLog[]>([]);
const comboCount = ref(0);
const turnCount = ref(0);

// Pokemon stats
const playerStats = ref({
  atk: 50,
  def: 40,
  spd: 60,
  type: 'electric' as SkillElement
});

const opponentStats = ref({
  atk: 55,
  def: 45,
  spd: 45,
  type: 'fire' as SkillElement
});

// Settings
const showSettings = ref(false);
const qualityLevel = ref(battle3DStore.performanceLevel);
const audioEnabled = ref(battle3DStore.audioEnabled);
const effectsEnabled = ref(battle3DStore.effectsEnabled);

// Battle result state
const battleResult = ref<'victory' | 'defeat' | null>(null);

// Player skills - using the new skill system
const playerSkills = ref<Skill[]>([
  { ...SKILL_DATABASE.find(s => s.id === 'thunder_shock')! },
  { ...SKILL_DATABASE.find(s => s.id === 'thunderbolt')! },
  { ...SKILL_DATABASE.find(s => s.id === 'quick_attack')! },
  { ...SKILL_DATABASE.find(s => s.id === 'tackle')! },
].map(skill => ({ ...skill, currentCooldown: 0 })));

// Babylon.js references
let engine: BABYLON.Engine;
let scene: BABYLON.Scene;
let cameraSystem: BattleCamera3D;
let playerPokemon: Pokemon3DModel;
let opponentPokemon: Pokemon3DModel;
let defaultPipeline: BABYLON.DefaultRenderingPipeline;

// Computed properties
const playerHPPercentage = computed(() => (playerHP.value / playerMaxHP.value) * 100);
const opponentHPPercentage = computed(() => (opponentHP.value / opponentMaxHP.value) * 100);


onMounted(() => {
  // Detect optimal performance
  battle3DStore.detectOptimalPerformance();
  initializeBattleArena();
});

const initializeBattleArena = async () => {
  if (!babylonCanvas.value) return;

  try {
    // Create Babylon engine
    engine = new BABYLON.Engine(babylonCanvas.value, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
      adaptToDeviceRatio: true,
    });

    // Create scene
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.5, 0.7, 0.9, 1.0);
    
    // Setup camera system
    cameraSystem = new BattleCamera3D(scene);
    cameraSystem.transitionToState('battle', 0);
    
    // Enable image processing and post-processing for effects
    defaultPipeline = new BABYLON.DefaultRenderingPipeline(
      "defaultPipeline",
      true, // HDR
      scene,
      [scene.activeCamera]
    );
    
    // Configure bloom effect
    defaultPipeline.bloomEnabled = true;
    defaultPipeline.bloomThreshold = 0.8;
    defaultPipeline.bloomWeight = 0.3;
    defaultPipeline.bloomKernel = 64;
    defaultPipeline.bloomScale = 0.5;

    // Create battle field
    createBattleField();

    // Load Pokemon models
    await loadPokemonModels();

    // Start render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle resize
    window.addEventListener('resize', handleResize);

    // Add battle log
    addBattleLog('Battle started!', 'info');

    // Load battle data if provided
    if (props.battleId) {
      loadBattleData();
    }
  } catch (error) {
    console.error('Failed to initialize battle arena:', error);
  }
};

const createBattleField = () => {
  // Create ground
  const ground = BABYLON.MeshBuilder.CreateGround(
    'battleField',
    {
      width: 20,
      height: 15,
      subdivisions: 32,
    },
    scene
  );

  // Apply ground material
  const groundMaterial = new BABYLON.StandardMaterial('groundMat', scene);
  groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.6, 0.3);
  groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  ground.material = groundMaterial;

  // Create player platform
  const playerPlatform = BABYLON.MeshBuilder.CreateBox(
    'playerPlatform',
    {
      width: 3,
      height: 0.2,
      depth: 3,
    },
    scene
  );
  playerPlatform.position = new BABYLON.Vector3(-6, 0.1, 0);

  const playerPlatformMat = new BABYLON.StandardMaterial('playerPlatformMat', scene);
  playerPlatformMat.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.8);
  playerPlatform.material = playerPlatformMat;

  // Create opponent platform
  const opponentPlatform = BABYLON.MeshBuilder.CreateBox(
    'opponentPlatform',
    {
      width: 3,
      height: 0.2,
      depth: 3,
    },
    scene
  );
  opponentPlatform.position = new BABYLON.Vector3(6, 0.1, 0);

  const opponentPlatformMat = new BABYLON.StandardMaterial('opponentPlatformMat', scene);
  opponentPlatformMat.diffuseColor = new BABYLON.Color3(0.8, 0.4, 0.4);
  opponentPlatform.material = opponentPlatformMat;

  // Add lighting
  const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
  light.intensity = 1.2;

  // Add directional light for shadows
  const dirLight = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-1, -2, -1), scene);
  dirLight.intensity = 0.5;
};

const loadPokemonModels = async () => {
  // Load player Pokemon from props or default
  const playerData = props.playerPokemon || {
    id: 25,
    name: 'Pikachu',
    types: ['electric'],
    stats: { hp: 100, attack: 55, defense: 40, speed: 90 }
  };
  
  // Update player stats based on Pokemon data
  if (playerData.stats) {
    playerHP.value = playerData.stats.hp || 100;
    playerMaxHP.value = playerData.stats.hp || 100;
    playerStats.value = {
      atk: playerData.stats.attack || 50,
      def: playerData.stats.defense || 40,
      spd: playerData.stats.speed || 60,
      type: (playerData.types?.[0] || 'normal') as SkillElement
    };
  }
  
  // Load player Pokemon model
  playerPokemon = new Pokemon3DModel(scene);
  await playerPokemon.loadPokemon(playerData.id || 25, playerData.types?.[0] || 'electric');
  playerPokemon.setPosition(new BABYLON.Vector3(-6, 1, 0));
  playerPokemon.playIdleAnimation();
  
  // Update player skills based on Pokemon type
  updatePlayerSkills(playerStats.value.type);

  // Load opponent Pokemon from props or default
  const opponentData = props.opponentPokemon || {
    id: 6,
    name: 'Charizard',
    types: ['fire', 'flying'],
    stats: { hp: 120, attack: 84, defense: 78, speed: 100 }
  };
  
  // Update opponent stats based on Pokemon data
  if (opponentData.stats) {
    opponentHP.value = opponentData.stats.hp || 100;
    opponentMaxHP.value = opponentData.stats.hp || 100;
    opponentStats.value = {
      atk: opponentData.stats.attack || 55,
      def: opponentData.stats.defense || 45,
      spd: opponentData.stats.speed || 45,
      type: (opponentData.types?.[0] || 'fire') as SkillElement
    };
  }
  
  // Load opponent Pokemon model
  opponentPokemon = new Pokemon3DModel(scene);
  await opponentPokemon.loadPokemon(opponentData.id || 6, opponentData.types?.[0] || 'fire');
  opponentPokemon.setPosition(new BABYLON.Vector3(6, 1, 0));
  opponentPokemon.playIdleAnimation();
};

const loadBattleData = () => {
  // Load battle data from cardBattle store
  const battle = cardBattleStore.currentBattle;
  if (battle) {
    // Update HP values
    if (battle.player?.activePokemon) {
      playerHP.value = battle.player.activePokemon.hp;
      playerMaxHP.value = battle.player.activePokemon.maxHp;
    }
    if (battle.opponent?.activePokemon) {
      opponentHP.value = battle.opponent.activePokemon.hp;
      opponentMaxHP.value = battle.opponent.activePokemon.maxHp;
    }
    
    // Update energy
    currentEnergy.value = battle.player?.energy || 3;
    
    // Load correct Pokemon models
    // This would be expanded to load the actual Pokemon from the battle
  }
};

// Update player skills based on Pokemon type
const updatePlayerSkills = (pokemonType: SkillElement) => {
  const typeSkills = getSkillsByType(pokemonType);
  
  // Select up to 4 skills for the Pokemon
  // Priority: 1 ultimate, 1 special, 1 physical, 1 status/additional
  const ultimate = typeSkills.find(s => s.category === 'ultimate');
  const special = typeSkills.filter(s => s.category === 'special' && s.id !== ultimate?.id);
  const physical = typeSkills.filter(s => s.category === 'physical');
  const status = typeSkills.filter(s => s.category === 'status');
  
  const selectedSkills: Skill[] = [];
  
  // Add one of each category if available
  if (ultimate) selectedSkills.push(ultimate);
  if (special.length > 0) selectedSkills.push(special[0]);
  if (physical.length > 0) selectedSkills.push(physical[0]);
  if (status.length > 0) selectedSkills.push(status[0]);
  
  // Fill remaining slots with other skills
  while (selectedSkills.length < 4) {
    const remaining = typeSkills.filter(s => !selectedSkills.some(sel => sel.id === s.id));
    if (remaining.length === 0) break;
    selectedSkills.push(remaining[0]);
  }
  
  // If still not enough skills, add basic moves
  if (selectedSkills.length < 4) {
    const basicMoves = ['tackle', 'quick_attack'].map(id => SKILL_DATABASE.find(s => s.id === id)!);
    for (const move of basicMoves) {
      if (selectedSkills.length < 4 && !selectedSkills.some(s => s.id === move.id)) {
        selectedSkills.push(move);
      }
    }
  }
  
  // Update player skills with cooldown tracking
  playerSkills.value = selectedSkills.slice(0, 4).map(skill => ({
    ...skill,
    currentCooldown: 0
  }));
};

const executeSkill = async (skill: Skill) => {
  try {
    // Disable player turn
    isPlayerTurn.value = false;
    selectedSkill.value = skill;

    // Consume energy
    currentEnergy.value -= skill.energy;

    // Update cooldown
    const skillIndex = playerSkills.value.findIndex(s => s.id === skill.id);
    if (skillIndex >= 0) {
      playerSkills.value[skillIndex].currentCooldown = skill.cooldown;
    }

    // Check for combo
    let comboBonus = 0;
    if (skill.combo && skill.combo.requiresSkill === lastUsedSkill.value) {
      comboBonus = skill.combo.bonusDamage || 0;
      comboCount.value++;
      addBattleLog(`COMBO x${comboCount.value}!`, 'info');
    } else {
      comboCount.value = 0;
    }

    // Update last used skill
    lastUsedSkill.value = skill.id;

    // Transition camera based on skill category
    if (skill.category === 'ultimate') {
      await cameraSystem.transitionToState('critical', 800);
    } else {
      await cameraSystem.transitionToState('attack', 800);
    }

    // Focus on the center of action to see both Pokemon and skills
    const battleCenter = BABYLON.Vector3.Lerp(
      playerPokemon.getPosition(),
      opponentPokemon.getPosition(),
      0.5
    ).add(new BABYLON.Vector3(0, 1, 0));
    cameraSystem.focusOnTarget(battleCenter, 600);

    // Play attack animation
    playerPokemon.playAttackAnimation();

    // Add battle intensity effect
    addBattleIntensity();
    
    // Add subtle camera rotation for dynamic viewing
    cameraSystem.rotateAroundTarget(1500);
    
    // Add speed lines for quick attacks
    if (skill.id === 'quick_attack' || skill.category === 'physical') {
      createSpeedLines(playerPokemon.getPosition().x < 0 ? 1 : -1);
    }

    // Create skill visual effects
    await createSkillEffect(skill, playerPokemon, opponentPokemon);
    
    // Emit skill executed event
    emit('skill-executed', skill);
    
    // Add additional effects based on skill category
    if (skill.category === 'physical') {
      createSlashEffect(opponentPokemon.getPosition(), playerPokemon.getPosition().x < 0 ? 1 : -1);
    } else if (skill.category === 'special' && skill.element === 'psychic') {
      createEnergyDrain(opponentPokemon.getPosition(), playerPokemon.getPosition());
    }

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Process skill effects
    for (const effect of skill.effects) {
      switch (effect.type) {
        case 'damage':
          // Calculate effectiveness first
          const effectiveness = TYPE_EFFECTIVENESS[skill.element]?.[opponentStats.value.type] || 1;
          const effectivenessText = getEffectivenessText(effectiveness);
          
          const damage = calculateDamage(
            skill,
            playerStats.value.type,
            opponentStats.value.type,
            playerStats.value,
            opponentStats.value,
            comboBonus
          );
          
          opponentHP.value = Math.max(0, opponentHP.value - damage);
          
          // Play hurt animation
          opponentPokemon.playHurtAnimation();
          
          // Create multiple impact effects
          createImpactFlash(opponentPokemon.getPosition(), new BABYLON.Color3(1, 0.5, 0));
          createHitRipple(opponentPokemon.getPosition());
          createDamageWave(opponentPokemon.getPosition(), effectiveness > 1);
          
          // Play impact sound
          if (soundService.isEnabled()) {
            soundService.play('attack-hit', 0.8);
          }
          
          // Screen effects for critical hits
          if (effectiveness > 1) {
            createScreenFlash(new BABYLON.Color4(1, 0.8, 0, 0.3));
            createRadialBlur(opponentPokemon.getPosition());
            // Play critical hit sound
            if (soundService.isEnabled()) {
              setTimeout(() => soundService.play('legendary-reveal', 0.5), 100);
            }
          }
          
          // Camera shake based on damage
          const shakeIntensity = Math.min(damage / 20, 10);
          cameraSystem.shake(shakeIntensity, 200);
          
          // Zoom effect for heavy hits
          if (damage > 50) {
            cameraSystem.zoomPunch(0.9, 300);
          }
          
          addBattleLog(
            `${skill.name} dealt ${damage} damage! ${effectivenessText}`,
            'attack'
          );
          
          // Emit attack hit event
          emit('attack-hit', { damage, effectiveness, skill });
          
          // Show damage number
          await showDamageNumber(opponentPokemon.getPosition(), damage, effectiveness > 1);
          break;
          
        case 'heal':
          const healAmount = effect.value || 0;
          playerHP.value = Math.min(playerMaxHP.value, playerHP.value + healAmount);
          addBattleLog(`Restored ${healAmount} HP!`, 'heal');
          await showHealEffect(playerPokemon.getPosition(), healAmount);
          break;
          
        case 'buff':
          // Apply buff to stats
          if (effect.stat && effect.value) {
            playerStats.value[effect.stat] += effect.value;
            addBattleLog(`${effect.stat.toUpperCase()} increased by ${effect.value}!`, 'info');
          }
          break;
          
        case 'status':
          // Apply status effect with chance
          if (effect.chance && Math.random() * 100 < effect.chance) {
            addBattleLog(`Inflicted ${effect.status} on opponent!`, 'info');
            await showStatusEffect(opponentPokemon.getPosition(), effect.status!);
          }
          break;
      }
    }

    // Check if opponent fainted
    if (opponentHP.value <= 0) {
      await handleBattleEnd(true);
      return;
    }

    // Return camera to battle view
    await cameraSystem.transitionToState('battle', 1000);

    // Opponent turn
    await opponentTurn();

    // Update cooldowns
    playerSkills.value.forEach(s => {
      if (s.currentCooldown && s.currentCooldown > 0) {
        s.currentCooldown--;
      }
    });

    // Regenerate energy
    const energyRegen = 2 + Math.floor(turnCount.value / 5); // More energy as battle progresses
    currentEnergy.value = Math.min(maxEnergy.value, currentEnergy.value + energyRegen);
    
    turnCount.value++;

    // Enable player turn
    isPlayerTurn.value = true;
    selectedSkill.value = null;
  } catch (error) {
    console.error('Error executing skill:', error);
    isPlayerTurn.value = true;
  }
};

const opponentTurn = async () => {
  // AI opponent turn with strategic skill selection
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Get opponent's available skills based on type
  const opponentSkills = getSkillsByType(opponentStats.value.type).slice(0, 4);
  
  // AI decision making
  const opponentEnergy = 5; // Assume opponent has full energy
  const playerHPPercent = (playerHP.value / playerMaxHP.value) * 100;
  const opponentHPPercent = (opponentHP.value / opponentMaxHP.value) * 100;
  
  let selectedSkill: Skill | null = null;
  
  // AI Strategy
  if (opponentHPPercent < 30 && opponentSkills.some(s => s.category === 'status' && s.effects.some(e => e.type === 'heal'))) {
    // Low health - try to heal
    selectedSkill = opponentSkills.find(s => s.effects.some(e => e.type === 'heal'))!;
  } else if (playerHPPercent < 40 && opponentSkills.some(s => s.category === 'ultimate' && s.energy <= opponentEnergy)) {
    // Player low health - use ultimate if available
    selectedSkill = opponentSkills.find(s => s.category === 'ultimate' && s.energy <= opponentEnergy)!;
  } else {
    // Normal attack - choose based on type effectiveness
    const damageSkills = opponentSkills.filter(s => s.power > 0 && s.energy <= opponentEnergy);
    
    // Calculate effectiveness for each skill
    const skillsWithEffectiveness = damageSkills.map(skill => {
      const effectiveness = TYPE_EFFECTIVENESS[skill.element]?.[playerStats.value.type] || 1;
      return { skill, effectiveness };
    });
    
    // Prefer super effective moves
    const superEffective = skillsWithEffectiveness.filter(s => s.effectiveness > 1);
    if (superEffective.length > 0) {
      selectedSkill = superEffective.reduce((best, current) => 
        current.skill.power * current.effectiveness > best.skill.power * best.effectiveness ? current : best
      ).skill;
    } else {
      // Otherwise use highest damage skill that's not resisted
      const notResisted = skillsWithEffectiveness.filter(s => s.effectiveness >= 1);
      if (notResisted.length > 0) {
        selectedSkill = notResisted.reduce((best, current) => 
          current.skill.power > best.skill.power ? current : best
        ).skill;
      } else {
        // Fall back to any available skill
        selectedSkill = damageSkills[0];
      }
    }
  }
  
  // Default skill if none selected
  if (!selectedSkill) {
    selectedSkill = {
      id: 'tackle',
      name: 'Tackle',
      description: 'A physical attack',
      element: 'normal',
      category: 'physical',
      power: 30,
      accuracy: 100,
      energy: 1,
      cooldown: 0,
      target: 'single',
      effects: [{ type: 'damage', value: 30 }]
    };
  }

  // Add battle log
  addBattleLog(`Opponent is preparing ${selectedSkill.name}!`, 'info');

  // Transition camera
  if (selectedSkill.category === 'ultimate') {
    await cameraSystem.transitionToState('critical', 800);
  } else {
    await cameraSystem.transitionToState('attack', 800);
  }
  
  // Focus on the center of action to see both Pokemon and skills
  const battleCenter = BABYLON.Vector3.Lerp(
    opponentPokemon.getPosition(),
    playerPokemon.getPosition(),
    0.5
  ).add(new BABYLON.Vector3(0, 1, 0));
  cameraSystem.focusOnTarget(battleCenter, 600);

  // Play attack animation
  opponentPokemon.playAttackAnimation();
  
  // Add battle intensity
  addBattleIntensity();
  
  // Add subtle camera rotation for dynamic viewing
  cameraSystem.rotateAroundTarget(1500);
  
  // Add speed lines for physical attacks
  if (selectedSkill.category === 'physical') {
    createSpeedLines(opponentPokemon.getPosition().x < 0 ? 1 : -1);
  }

  // Create skill effect
  await createSkillEffect(selectedSkill, opponentPokemon, playerPokemon);
  
  // Add additional effects based on skill category
  if (selectedSkill.category === 'physical') {
    createSlashEffect(playerPokemon.getPosition(), opponentPokemon.getPosition().x < 0 ? 1 : -1);
  } else if (selectedSkill.category === 'special' && selectedSkill.element === 'psychic') {
    createEnergyDrain(playerPokemon.getPosition(), opponentPokemon.getPosition());
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Process skill effects
  for (const effect of selectedSkill.effects) {
    switch (effect.type) {
      case 'damage':
        // Calculate effectiveness first
        const effectiveness = TYPE_EFFECTIVENESS[selectedSkill.element]?.[playerStats.value.type] || 1;
        const effectivenessText = getEffectivenessText(effectiveness);
        
        const damage = calculateDamage(
          selectedSkill,
          opponentStats.value.type,
          playerStats.value.type,
          opponentStats.value,
          playerStats.value,
          0
        );
        
        playerHP.value = Math.max(0, playerHP.value - damage);
        
        // Play hurt animation
        playerPokemon.playHurtAnimation();
        
        // Create multiple impact effects
        createImpactFlash(playerPokemon.getPosition(), new BABYLON.Color3(1, 0.5, 0));
        createHitRipple(playerPokemon.getPosition());
        createDamageWave(playerPokemon.getPosition(), effectiveness > 1);
        
        // Play impact sound
        if (soundService.isEnabled()) {
          soundService.play('attack-hit', 0.8);
        }
        
        // Screen effects for critical hits
        if (effectiveness > 1) {
          createScreenFlash(new BABYLON.Color4(1, 0, 0, 0.3));
          createRadialBlur(playerPokemon.getPosition());
          // Play critical hit sound
          if (soundService.isEnabled()) {
            setTimeout(() => soundService.play('legendary-reveal', 0.5), 100);
          }
        }
        
        // Camera shake
        const shakeIntensity = Math.min(damage / 20, 10);
        cameraSystem.shake(shakeIntensity, 200);
        
        // Zoom effect for heavy hits
        if (damage > 50) {
          cameraSystem.zoomPunch(1.1, 300);
        }
        
        addBattleLog(
          `Opponent's ${selectedSkill.name} dealt ${damage} damage! ${effectivenessText}`,
          'damage'
        );
        
        // Show damage number
        await showDamageNumber(playerPokemon.getPosition(), damage, effectiveness > 1);
        break;
        
      case 'heal':
        const healAmount = effect.value || 0;
        opponentHP.value = Math.min(opponentMaxHP.value, opponentHP.value + healAmount);
        addBattleLog(`Opponent restored ${healAmount} HP!`, 'heal');
        await showHealEffect(opponentPokemon.getPosition(), healAmount);
        break;
        
      case 'buff':
        if (effect.stat && effect.value) {
          opponentStats.value[effect.stat] += effect.value;
          addBattleLog(`Opponent's ${effect.stat.toUpperCase()} increased!`, 'info');
        }
        break;
        
      case 'status':
        if (effect.chance && Math.random() * 100 < effect.chance) {
          addBattleLog(`You were inflicted with ${effect.status}!`, 'info');
          await showStatusEffect(playerPokemon.getPosition(), effect.status!);
        }
        break;
    }
  }

  // Check if player fainted
  if (playerHP.value <= 0) {
    await handleBattleEnd(false);
    return;
  }

  // Return camera to battle view
  await cameraSystem.transitionToState('battle', 1000);
};

const handleBattleEnd = async (playerWon: boolean) => {
  // Set the battle result to show victory/defeat UI
  battleResult.value = playerWon ? 'victory' : 'defeat';
  
  // Play appropriate sound effects
  if (soundService.isEnabled()) {
    if (playerWon) {
      soundService.play('success', 0.8);
      // Play Pokemon faint sound for opponent
      setTimeout(() => soundService.play('pokemon-faint', 0.7), 500);
    } else {
      soundService.play('error', 0.8);
      // Play Pokemon faint sound for player
      setTimeout(() => soundService.play('pokemon-faint', 0.7), 500);
    }
  }
  
  // Camera transitions and animations
  if (playerWon) {
    await cameraSystem.transitionToState('victory', 1500);
    playerPokemon.playVictoryAnimation();
    opponentPokemon.playDefeatAnimation();
    addBattleLog('Player wins!', 'info');
    battle3DStore.transitionToPhase('victory');
    
    // Emit pokemon-faint event for opponent
    emit('pokemon-faint', {
      pokemon: 'opponent',
      isPlayer: false,
      remainingHP: 0
    });
  } else {
    await cameraSystem.transitionToState('defeat', 1500);
    opponentPokemon.playVictoryAnimation();
    playerPokemon.playDefeatAnimation();
    addBattleLog('Player was defeated...', 'info');
    battle3DStore.transitionToPhase('defeat');
    
    // Emit pokemon-faint event for player
    emit('pokemon-faint', {
      pokemon: 'player',
      isPlayer: true,
      remainingHP: 0
    });
  }
  
  // Emit battle end event
  emit('battle-end', playerWon ? 'victory' : 'defeat');
};

const restartBattle = async () => {
  // Hide battle result overlay
  battleResult.value = null;
  
  // Reset battle state
  playerHP.value = playerMaxHP.value;
  opponentHP.value = opponentMaxHP.value;
  currentEnergy.value = 3;
  isPlayerTurn.value = true;
  selectedSkill.value = null;
  lastUsedSkill.value = '';
  comboCount.value = 0;
  turnCount.value = 0;
  
  // Reset skill cooldowns
  playerSkills.value.forEach(skill => {
    skill.currentCooldown = 0;
  });
  
  // Clear battle logs
  battleLogs.value = [];
  addBattleLog('Battle restarted!', 'info');
  
  // Reset battle phase
  battle3DStore.transitionToPhase('preparation');
  
  // Reset camera
  await cameraSystem.transitionToState('battle', 1000);
  
  // Reset Pokemon animations
  playerPokemon.playIdleAnimation();
  opponentPokemon.playIdleAnimation();
  
  // Play battle start sound
  if (soundService.isEnabled()) {
    soundService.play('battle-start', 0.7);
  }
  
  // Emit battle start event
  emit('battle-start');
};


const addBattleLog = (message: string, type: BattleLog['type']) => {
  battleLogs.value.push({ message, type });
  if (battleLogs.value.length > 5) {
    battleLogs.value.shift();
  }
};

const updateQuality = () => {
  battle3DStore.adjustPerformanceLevel(qualityLevel.value as any);
  // Would update Babylon.js settings here
};

const handleResize = () => {
  engine?.resize();
};

// Visual effect functions
const createSkillEffect = async (skill: Skill, attacker: Pokemon3DModel, target: Pokemon3DModel) => {
  const attackerPos = attacker.getPosition();
  const targetPos = target.getPosition();
  
  // Play skill sound effect based on element
  const skillSoundName = `skill-${skill.element}`;
  if (soundService.isEnabled()) {
    soundService.play(skillSoundName, 0.7);
  }
  
  switch (skill.element) {
    case 'electric':
      await createLightningEffect(attackerPos, targetPos);
      break;
    case 'fire':
      await createFireballEffect(attackerPos, targetPos);
      break;
    case 'water':
      await createWaterEffect(attackerPos, targetPos);
      break;
    case 'grass':
      await createLeafStormEffect(attackerPos, targetPos);
      break;
    case 'ice':
      await createIceEffect(attackerPos, targetPos);
      break;
    case 'psychic':
      await createPsychicEffect(attackerPos, targetPos);
      break;
    case 'dark':
      await createDarkEffect(attackerPos, targetPos);
      break;
    case 'dragon':
      await createDragonEffect(attackerPos, targetPos);
      break;
    case 'fairy':
      await createFairyEffect(attackerPos, targetPos);
      break;
    case 'fighting':
      await createFightingEffect(attackerPos, targetPos);
      break;
    case 'flying':
      await createFlyingEffect(attackerPos, targetPos);
      break;
    case 'poison':
      await createPoisonEffect(attackerPos, targetPos);
      break;
    case 'ground':
      await createGroundEffect(attackerPos, targetPos);
      break;
    case 'rock':
      await createRockEffect(attackerPos, targetPos);
      break;
    case 'bug':
      await createBugEffect(attackerPos, targetPos);
      break;
    case 'ghost':
      await createGhostEffect(attackerPos, targetPos);
      break;
    case 'steel':
      await createSteelEffect(attackerPos, targetPos);
      break;
    case 'normal':
      await createNormalEffect(attackerPos, targetPos);
      break;
    default:
      await createGenericEffect(attackerPos, targetPos, skill.element);
  }
};

const createLightningEffect = async (start: BABYLON.Vector3, end: BABYLON.Vector3) => {
  // Create lightning bolt mesh
  const lightning = BABYLON.MeshBuilder.CreateLines('lightning', {
    points: generateLightningPath(start, end),
  }, scene);
  
  const lightningMat = new BABYLON.StandardMaterial('lightningMat', scene);
  lightningMat.emissiveColor = new BABYLON.Color3(1, 1, 0);
  lightning.material = lightningMat;
  
  // Add glow
  const gl = scene.getEngine();
  lightning.renderingGroupId = 1;
  
  // Animate
  let alpha = 1;
  const animateInterval = setInterval(() => {
    alpha -= 0.1;
    lightningMat.alpha = alpha;
    if (alpha <= 0) {
      clearInterval(animateInterval);
      lightning.dispose();
    }
  }, 50);
};

const generateLightningPath = (start: BABYLON.Vector3, end: BABYLON.Vector3): BABYLON.Vector3[] => {
  const points: BABYLON.Vector3[] = [start];
  const segments = 5;
  
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const basePoint = BABYLON.Vector3.Lerp(start, end, t);
    const offset = new BABYLON.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 1,
      (Math.random() - 0.5) * 2
    );
    points.push(basePoint.add(offset));
  }
  
  points.push(end);
  return points;
};

const createFireballEffect = async (start: BABYLON.Vector3, end: BABYLON.Vector3) => {
  // Create fireball
  const fireball = BABYLON.MeshBuilder.CreateSphere('fireball', { diameter: 0.5 }, scene);
  fireball.position = start.clone();
  
  const fireballMat = new BABYLON.StandardMaterial('fireballMat', scene);
  fireballMat.emissiveColor = new BABYLON.Color3(1, 0.3, 0);
  fireball.material = fireballMat;
  
  // Create fire particles
  const fireParticles = new BABYLON.ParticleSystem('fireParticles', 200, scene);
  fireParticles.particleTexture = new BABYLON.Texture('/particle.png', scene);
  fireParticles.emitter = fireball;
  fireParticles.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1);
  fireParticles.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);
  fireParticles.color1 = new BABYLON.Color4(1, 0.5, 0, 1);
  fireParticles.color2 = new BABYLON.Color4(1, 0, 0, 1);
  fireParticles.colorDead = new BABYLON.Color4(0, 0, 0, 0);
  fireParticles.minSize = 0.1;
  fireParticles.maxSize = 0.3;
  fireParticles.minLifeTime = 0.2;
  fireParticles.maxLifeTime = 0.5;
  fireParticles.emitRate = 100;
  fireParticles.start();
  
  // Animate fireball
  const moveAnimation = new BABYLON.Animation(
    'fireballMove',
    'position',
    60,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  moveAnimation.setKeys([
    { frame: 0, value: start },
    { frame: 30, value: end }
  ]);
  
  const animatable = scene.beginDirectAnimation(
    fireball,
    [moveAnimation],
    0,
    30,
    false,
    1,
    () => {
      fireParticles.stop();
      fireball.dispose();
      createExplosionEffect(end);
    }
  );
};

const createWaterEffect = async (start: BABYLON.Vector3, end: BABYLON.Vector3) => {
  // Create water sphere projectile
  const waterBall = BABYLON.MeshBuilder.CreateSphere('waterBall', { diameter: 0.8 }, scene);
  waterBall.position = start.clone();
  
  const waterMat = new BABYLON.StandardMaterial('waterMat', scene);
  waterMat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 1);
  waterMat.specularColor = new BABYLON.Color3(0.5, 0.8, 1);
  waterMat.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.6);
  waterMat.alpha = 0.8;
  waterBall.material = waterMat;
  
  // Water particles trail
  const waterTrail = new BABYLON.ParticleSystem('waterTrail', 100, scene);
  waterTrail.particleTexture = new BABYLON.Texture('/particle.png', scene);
  waterTrail.emitter = waterBall;
  waterTrail.minEmitBox = new BABYLON.Vector3(-0.2, -0.2, -0.2);
  waterTrail.maxEmitBox = new BABYLON.Vector3(0.2, 0.2, 0.2);
  waterTrail.color1 = new BABYLON.Color4(0.4, 0.7, 1, 1);
  waterTrail.color2 = new BABYLON.Color4(0.2, 0.5, 0.9, 0.5);
  waterTrail.colorDead = new BABYLON.Color4(0.1, 0.3, 0.8, 0);
  waterTrail.minSize = 0.1;
  waterTrail.maxSize = 0.3;
  waterTrail.minLifeTime = 0.3;
  waterTrail.maxLifeTime = 0.8;
  waterTrail.emitRate = 50;
  waterTrail.start();
  
  // Animate water ball
  const waterAnimation = new BABYLON.Animation(
    'waterMove',
    'position',
    60,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  waterAnimation.setKeys([
    { frame: 0, value: start },
    { frame: 20, value: end }
  ]);
  
  scene.beginDirectAnimation(
    waterBall,
    [waterAnimation],
    0,
    20,
    false,
    1,
    () => {
      waterTrail.stop();
      waterBall.dispose();
      createWaterSplashEffect(end);
    }
  );
};

const createWaterSplashEffect = async (position: BABYLON.Vector3) => {
  // Create water splash particles
  const splash = new BABYLON.ParticleSystem('waterSplash', 500, scene);
  splash.particleTexture = new BABYLON.Texture('/particle.png', scene);
  splash.emitter = position;
  splash.minEmitBox = new BABYLON.Vector3(-0.5, 0, -0.5);
  splash.maxEmitBox = new BABYLON.Vector3(0.5, 0, 0.5);
  splash.color1 = new BABYLON.Color4(0.2, 0.5, 1, 1);
  splash.color2 = new BABYLON.Color4(0.5, 0.8, 1, 0.8);
  splash.colorDead = new BABYLON.Color4(0.5, 0.8, 1, 0);
  splash.minSize = 0.1;
  splash.maxSize = 0.5;
  splash.minLifeTime = 0.5;
  splash.maxLifeTime = 1;
  splash.emitRate = 200;
  splash.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
  splash.gravity = new BABYLON.Vector3(0, -5, 0);
  splash.direction1 = new BABYLON.Vector3(-1, 3, -1);
  splash.direction2 = new BABYLON.Vector3(1, 5, 1);
  splash.minAngularSpeed = 0;
  splash.maxAngularSpeed = Math.PI;
  splash.minEmitPower = 2;
  splash.maxEmitPower = 4;
  splash.updateSpeed = 0.01;
  
  splash.start();
  
  setTimeout(() => {
    splash.stop();
  }, 300);
};

const createLeafStormEffect = async (start: BABYLON.Vector3, end: BABYLON.Vector3) => {
  // Create leaf particles
  const leafStorm = new BABYLON.ParticleSystem('leafStorm', 300, scene);
  leafStorm.particleTexture = new BABYLON.Texture('/leaf.png', scene);
  leafStorm.emitter = start;
  leafStorm.minEmitBox = new BABYLON.Vector3(-1, -1, -1);
  leafStorm.maxEmitBox = new BABYLON.Vector3(1, 1, 1);
  leafStorm.color1 = new BABYLON.Color4(0.2, 0.8, 0.2, 1);
  leafStorm.color2 = new BABYLON.Color4(0.4, 1, 0.4, 1);
  leafStorm.colorDead = new BABYLON.Color4(0.2, 0.8, 0.2, 0);
  leafStorm.minSize = 0.2;
  leafStorm.maxSize = 0.5;
  leafStorm.minLifeTime = 1;
  leafStorm.maxLifeTime = 2;
  leafStorm.emitRate = 100;
  leafStorm.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
  leafStorm.gravity = new BABYLON.Vector3(0, -1, 0);
  leafStorm.minAngularSpeed = -Math.PI;
  leafStorm.maxAngularSpeed = Math.PI;
  leafStorm.minEmitPower = 3;
  leafStorm.maxEmitPower = 5;
  
  // Move emitter towards target
  leafStorm.start();
  
  let t = 0;
  const moveInterval = setInterval(() => {
    t += 0.05;
    leafStorm.emitter = BABYLON.Vector3.Lerp(start, end, t);
    if (t >= 1) {
      clearInterval(moveInterval);
      setTimeout(() => leafStorm.stop(), 500);
    }
  }, 50);
};

const createGenericEffect = async (start: BABYLON.Vector3, end: BABYLON.Vector3, element: SkillElement) => {
  // Create generic projectile
  const projectile = BABYLON.MeshBuilder.CreateSphere('projectile', { diameter: 0.4 }, scene);
  projectile.position = start.clone();
  
  const projectileMat = new BABYLON.StandardMaterial('projectileMat', scene);
  
  // Set color based on element
  const elementColors: Record<string, BABYLON.Color3> = {
    psychic: new BABYLON.Color3(1, 0, 1),
    ice: new BABYLON.Color3(0.5, 0.8, 1),
    dragon: new BABYLON.Color3(0.5, 0, 1),
    dark: new BABYLON.Color3(0.2, 0, 0.3),
    fairy: new BABYLON.Color3(1, 0.5, 0.8),
    fighting: new BABYLON.Color3(0.8, 0.2, 0.2),
    flying: new BABYLON.Color3(0.6, 0.8, 1),
    poison: new BABYLON.Color3(0.6, 0.2, 0.8),
    ground: new BABYLON.Color3(0.8, 0.6, 0.2),
    rock: new BABYLON.Color3(0.6, 0.5, 0.3),
    bug: new BABYLON.Color3(0.6, 0.8, 0.2),
    ghost: new BABYLON.Color3(0.4, 0.3, 0.6),
    steel: new BABYLON.Color3(0.6, 0.6, 0.7),
    normal: new BABYLON.Color3(0.8, 0.8, 0.8)
  };
  
  projectileMat.emissiveColor = elementColors[element] || new BABYLON.Color3(1, 1, 1);
  projectile.material = projectileMat;
  
  // Animate projectile
  const projectileAnimation = new BABYLON.Animation(
    'projectileMove',
    'position',
    60,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  projectileAnimation.setKeys([
    { frame: 0, value: start },
    { frame: 20, value: end }
  ]);
  
  scene.beginDirectAnimation(
    projectile,
    [projectileAnimation],
    0,
    20,
    false,
    1,
    () => {
      projectile.dispose();
    }
  );
};

// Ice type effect
const createIceEffect = async (start: BABYLON.Vector3, end: BABYLON.Vector3) => {
  // Create ice shard
  const iceShard = BABYLON.MeshBuilder.CreateCylinder('iceShard', { 
    height: 1, 
    diameterTop: 0.1, 
    diameterBottom: 0.4,
    tessellation: 6 
  }, scene);
  iceShard.position = start.clone();
  iceShard.rotation.z = Math.PI / 2;
  
  const iceMat = new BABYLON.StandardMaterial('iceMat', scene);
  iceMat.diffuseColor = new BABYLON.Color3(0.7, 0.9, 1);
  iceMat.specularColor = new BABYLON.Color3(1, 1, 1);
  iceMat.emissiveColor = new BABYLON.Color3(0.3, 0.5, 0.7);
  iceMat.alpha = 0.9;
  iceShard.material = iceMat;
  
  // Ice particles
  const iceParticles = new BABYLON.ParticleSystem('iceParticles', 50, scene);
  iceParticles.particleTexture = new BABYLON.Texture('/particle.png', scene);
  iceParticles.emitter = iceShard;
  iceParticles.color1 = new BABYLON.Color4(0.8, 0.9, 1, 1);
  iceParticles.color2 = new BABYLON.Color4(0.6, 0.8, 1, 0.5);
  iceParticles.minSize = 0.05;
  iceParticles.maxSize = 0.2;
  iceParticles.emitRate = 30;
  iceParticles.start();
  
  // Rotate while moving
  scene.registerBeforeRender(() => {
    if (iceShard) iceShard.rotation.x += 0.1;
  });
  
  // Animate
  const iceAnimation = new BABYLON.Animation(
    'iceMove',
    'position',
    60,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  iceAnimation.setKeys([
    { frame: 0, value: start },
    { frame: 25, value: end }
  ]);
  
  scene.beginDirectAnimation(
    iceShard,
    [iceAnimation],
    0,
    25,
    false,
    1,
    () => {
      iceParticles.stop();
      iceShard.dispose();
      // Create freeze effect at target
      createFreezeEffect(end);
    }
  );
};

const createFreezeEffect = (position: BABYLON.Vector3) => {
  // Create ice crystals forming
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const crystal = BABYLON.MeshBuilder.CreateBox('crystal', { size: 0.3 }, scene);
    crystal.position = position.add(new BABYLON.Vector3(
      Math.cos(angle) * 0.5,
      0,
      Math.sin(angle) * 0.5
    ));
    
    const crystalMat = new BABYLON.StandardMaterial('crystalMat', scene);
    crystalMat.diffuseColor = new BABYLON.Color3(0.7, 0.9, 1);
    crystalMat.alpha = 0.7;
    crystal.material = crystalMat;
    
    // Grow animation
    crystal.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
    const growAnimation = new BABYLON.Animation(
      'crystalGrow',
      'scaling',
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    growAnimation.setKeys([
      { frame: 0, value: new BABYLON.Vector3(0.1, 0.1, 0.1) },
      { frame: 10, value: new BABYLON.Vector3(1, 2, 1) },
      { frame: 30, value: new BABYLON.Vector3(0, 0, 0) }
    ]);
    
    scene.beginDirectAnimation(crystal, [growAnimation], 0, 30, false, 1, () => {
      crystal.dispose();
    });
  }
};

// Psychic type effect
const createPsychicEffect = async (start: BABYLON.Vector3, end: BABYLON.Vector3) => {
  // Create psychic orb
  const psychicOrb = BABYLON.MeshBuilder.CreateSphere('psychicOrb', { diameter: 0.6 }, scene);
  psychicOrb.position = start.clone();
  
  const psychicMat = new BABYLON.StandardMaterial('psychicMat', scene);
  psychicMat.diffuseColor = new BABYLON.Color3(1, 0.3, 0.8);
  psychicMat.emissiveColor = new BABYLON.Color3(0.8, 0.2, 0.6);
  psychicMat.alpha = 0.7;
  psychicOrb.material = psychicMat;
  
  // Psychic rings
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const ring = BABYLON.MeshBuilder.CreateTorus(`psychicRing${i}`, {
      diameter: 1 + i * 0.3,
      thickness: 0.05
    }, scene);
    ring.parent = psychicOrb;
    ring.rotation.x = Math.PI / 2;
    
    const ringMat = new BABYLON.StandardMaterial(`ringMat${i}`, scene);
    ringMat.emissiveColor = new BABYLON.Color3(1, 0.5, 1);
    ringMat.alpha = 0.5;
    ring.material = ringMat;
    rings.push(ring);
  }
  
  // Rotate rings
  scene.registerBeforeRender(() => {
    rings.forEach((ring, i) => {
      if (ring && !ring.isDisposed()) {
        ring.rotation.y += 0.05 * (i + 1);
        ring.rotation.z += 0.03 * (i + 1);
      }
    });
  });
  
  // Wavy movement
  const psychicAnimation = new BABYLON.Animation(
    'psychicMove',
    'position',
    60,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  
  const keys = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    const pos = BABYLON.Vector3.Lerp(start, end, t);
    pos.y += Math.sin(t * Math.PI * 4) * 0.5;
    keys.push({ frame: i, value: pos });
  }
  psychicAnimation.setKeys(keys);
  
  scene.beginDirectAnimation(
    psychicOrb,
    [psychicAnimation],
    0,
    30,
    false,
    1,
    () => {
      rings.forEach(ring => ring.dispose());
      psychicOrb.dispose();
      createPsychicWave(end);
    }
  );
};

const createPsychicWave = (position: BABYLON.Vector3) => {
  const wave = BABYLON.MeshBuilder.CreateSphere('psychicWave', { diameter: 0.5 }, scene);
  wave.position = position;
  
  const waveMat = new BABYLON.StandardMaterial('psychicWaveMat', scene);
  waveMat.emissiveColor = new BABYLON.Color3(1, 0.3, 1);
  waveMat.alpha = 0.6;
  wave.material = waveMat;
  
  let scale = 0.5;
  let alpha = 0.6;
  
  const expandInterval = setInterval(() => {
    scale += 0.3;
    alpha -= 0.06;
    wave.scaling = new BABYLON.Vector3(scale, scale, scale);
    waveMat.alpha = alpha;
    
    if (alpha <= 0) {
      clearInterval(expandInterval);
      wave.dispose();
    }
  }, 16);
};

// Dark type effect
const createDarkEffect = async (start: BABYLON.Vector3, end: BABYLON.Vector3) => {
  // Create dark sphere
  const darkSphere = BABYLON.MeshBuilder.CreateSphere('darkSphere', { diameter: 0.8 }, scene);
  darkSphere.position = start.clone();
  
  const darkMat = new BABYLON.StandardMaterial('darkMat', scene);
  darkMat.diffuseColor = new BABYLON.Color3(0.1, 0, 0.2);
  darkMat.emissiveColor = new BABYLON.Color3(0.3, 0, 0.4);
  darkMat.alpha = 0.8;
  darkSphere.material = darkMat;
  
  // Dark particles
  const darkParticles = new BABYLON.ParticleSystem('darkParticles', 100, scene);
  darkParticles.particleTexture = new BABYLON.Texture('/particle.png', scene);
  darkParticles.emitter = darkSphere;
  darkParticles.color1 = new BABYLON.Color4(0.5, 0, 0.6, 1);
  darkParticles.color2 = new BABYLON.Color4(0.2, 0, 0.3, 0.5);
  darkParticles.minSize = 0.1;
  darkParticles.maxSize = 0.4;
  darkParticles.emitRate = 50;
  darkParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
  darkParticles.start();
  
  // Shadow trail
  const trail = [];
  scene.registerBeforeRender(() => {
    if (darkSphere && !darkSphere.isDisposed()) {
      const shadow = BABYLON.MeshBuilder.CreateSphere('shadow', { diameter: 0.6 }, scene);
      shadow.position = darkSphere.position.clone();
      const shadowMat = new BABYLON.StandardMaterial('shadowMat', scene);
      shadowMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
      shadowMat.alpha = 0.3;
      shadow.material = shadowMat;
      trail.push(shadow);
      
      // Fade out trail
      setTimeout(() => {
        let alpha = 0.3;
        const fadeInterval = setInterval(() => {
          alpha -= 0.03;
          shadowMat.alpha = alpha;
          if (alpha <= 0) {
            clearInterval(fadeInterval);
            shadow.dispose();
          }
        }, 50);
      }, 100);
    }
  });
  
  // Animate
  const darkAnimation = new BABYLON.Animation(
    'darkMove',
    'position',
    60,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  darkAnimation.setKeys([
    { frame: 0, value: start },
    { frame: 25, value: end }
  ]);
  
  scene.beginDirectAnimation(
    darkSphere,
    [darkAnimation],
    0,
    25,
    false,
    1,
    () => {
      darkParticles.stop();
      darkSphere.dispose();
      createDarkExplosion(end);
    }
  );
};

const createDarkExplosion = (position: BABYLON.Vector3) => {
  const darkBurst = new BABYLON.ParticleSystem('darkBurst', 200, scene);
  darkBurst.particleTexture = new BABYLON.Texture('/particle.png', scene);
  darkBurst.emitter = position;
  darkBurst.color1 = new BABYLON.Color4(0.6, 0, 0.8, 1);
  darkBurst.color2 = new BABYLON.Color4(0.3, 0, 0.4, 0.5);
  darkBurst.minSize = 0.2;
  darkBurst.maxSize = 0.6;
  darkBurst.minLifeTime = 0.5;
  darkBurst.maxLifeTime = 1;
  darkBurst.emitRate = 1000;
  darkBurst.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
  darkBurst.gravity = new BABYLON.Vector3(0, -2, 0);
  darkBurst.direction1 = new BABYLON.Vector3(-2, 2, -2);
  darkBurst.direction2 = new BABYLON.Vector3(2, 4, 2);
  darkBurst.minEmitPower = 3;
  darkBurst.maxEmitPower = 5;
  darkBurst.targetStopDuration = 0.2;
  darkBurst.disposeOnStop = true;
  darkBurst.start();
};

// Dragon type effect
const createDragonEffect = async (start: BABYLON.Vector3, end: BABYLON.Vector3) => {
  // Create dragon flame
  const dragonFlame = BABYLON.MeshBuilder.CreateCylinder('dragonFlame', {
    height: 2,
    diameterTop: 0.2,
    diameterBottom: 0.8
  }, scene);
  dragonFlame.position = start.clone();
  dragonFlame.rotation.z = Math.PI / 2;
  
  const flameMat = new BABYLON.StandardMaterial('dragonFlameMat', scene);
  flameMat.diffuseColor = new BABYLON.Color3(0.5, 0, 1);
  flameMat.emissiveColor = new BABYLON.Color3(0.8, 0.2, 1);
  flameMat.alpha = 0.8;
  dragonFlame.material = flameMat;
  
  // Dragon particles
  const dragonParticles = new BABYLON.ParticleSystem('dragonParticles', 150, scene);
  dragonParticles.particleTexture = new BABYLON.Texture('/particle.png', scene);
  dragonParticles.emitter = dragonFlame;
  dragonParticles.color1 = new BABYLON.Color4(0.8, 0.2, 1, 1);
  dragonParticles.color2 = new BABYLON.Color4(0.5, 0, 0.8, 0.5);
  dragonParticles.minSize = 0.2;
  dragonParticles.maxSize = 0.5;
  dragonParticles.emitRate = 100;
  dragonParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
  dragonParticles.start();
  
  // Spiral movement
  const dragonAnimation = new BABYLON.Animation(
    'dragonMove',
    'position',
    60,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  
  const keys = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    const pos = BABYLON.Vector3.Lerp(start, end, t);
    const angle = t * Math.PI * 4;
    pos.x += Math.cos(angle) * 0.3;
    pos.z += Math.sin(angle) * 0.3;
    keys.push({ frame: i, value: pos });
  }
  dragonAnimation.setKeys(keys);
  
  scene.beginDirectAnimation(
    dragonFlame,
    [dragonAnimation],
    0,
    30,
    false,
    1,
    () => {
      dragonParticles.stop();
      dragonFlame.dispose();
      createDragonBurst(end);
    }
  );
};

const createDragonBurst = (position: BABYLON.Vector3) => {
  const burst = new BABYLON.ParticleSystem('dragonBurst', 300, scene);
  burst.particleTexture = new BABYLON.Texture('/particle.png', scene);
  burst.emitter = position;
  burst.color1 = new BABYLON.Color4(1, 0.3, 1, 1);
  burst.color2 = new BABYLON.Color4(0.5, 0, 0.8, 0.5);
  burst.minSize = 0.3;
  burst.maxSize = 0.8;
  burst.minLifeTime = 0.5;
  burst.maxLifeTime = 1.5;
  burst.emitRate = 1000;
  burst.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
  burst.direction1 = new BABYLON.Vector3(-3, 0, -3);
  burst.direction2 = new BABYLON.Vector3(3, 5, 3);
  burst.minEmitPower = 5;
  burst.maxEmitPower = 8;
  burst.targetStopDuration = 0.2;
  burst.disposeOnStop = true;
  burst.start();
};

const createFairyEffect = async (start: BABYLON.Vector3, end: BABYLON.Vector3) => {
  // Create fairy sparkle
  const sparkle = BABYLON.MeshBuilder.CreateSphere('fairySparkle', { diameter: 0.6 }, scene);
  sparkle.position = start.clone();
  
  const sparkleMat = new BABYLON.StandardMaterial('fairyMat', scene);
  sparkleMat.diffuseColor = new BABYLON.Color3(1, 0.7, 0.9);
  sparkleMat.emissiveColor = new BABYLON.Color3(1, 0.5, 0.8);
  sparkleMat.alpha = 0.8;
  sparkle.material = sparkleMat;
  
  // Fairy particles
  const fairyParticles = new BABYLON.ParticleSystem('fairyParticles', 100, scene);
  fairyParticles.particleTexture = new BABYLON.Texture('/particle.png', scene);
  fairyParticles.emitter = sparkle;
  fairyParticles.color1 = new BABYLON.Color4(1, 0.7, 0.9, 1);
  fairyParticles.color2 = new BABYLON.Color4(1, 0.5, 0.8, 0.5);
  fairyParticles.minSize = 0.1;
  fairyParticles.maxSize = 0.3;
  fairyParticles.emitRate = 50;
  fairyParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
  fairyParticles.start();
  
  // Zigzag animation
  const fairyAnimation = new BABYLON.Animation(
    'fairyMove',
    'position',
    60,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  
  const keys = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    const pos = BABYLON.Vector3.Lerp(start, end, t);
    pos.y += Math.sin(t * Math.PI * 4) * 0.5;
    keys.push({ frame: i, value: pos });
  }
  fairyAnimation.setKeys(keys);
  
  scene.beginDirectAnimation(
    sparkle,
    [fairyAnimation],
    0,
    30,
    false,
    1,
    () => {
      fairyParticles.stop();
      sparkle.dispose();
      createWaterSplashEffect(end);
    }
  );
};

const createFightingEffect = async (start: BABYLON.Vector3, end: BABYLON.Vector3) => {
  // Create fist mesh
  const fist = BABYLON.MeshBuilder.CreateSphere('fist', { diameter: 0.8 }, scene);
  fist.position = start.clone();
  
  const fistMat = new BABYLON.StandardMaterial('fistMat', scene);
  fistMat.diffuseColor = new BABYLON.Color3(0.8, 0.6, 0.4);
  fistMat.emissiveColor = new BABYLON.Color3(0.5, 0.3, 0.2);
  fist.material = fistMat;
  
  // Speed lines
  createSpeedLines(start.x < 0 ? 1 : -1);
  
  // Direct punch animation
  const punchAnimation = new BABYLON.Animation(
    'punch',
    'position',
    60,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  
  punchAnimation.setKeys([
    { frame: 0, value: start },
    { frame: 10, value: end }
  ]);
  
  scene.beginDirectAnimation(
    fist,
    [punchAnimation],
    0,
    10,
    false,
    1,
    () => {
      fist.dispose();
      createHitEffect(end);
    }
  );
};

const createFlyingEffect = async (start: BABYLON.Vector3, end: BABYLON.Vector3) => {
  // Create wind slash
  const windSlash = BABYLON.MeshBuilder.CreatePlane('windSlash', { size: 1.5 }, scene);
  windSlash.position = start.clone();
  windSlash.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  
  const windMat = new BABYLON.StandardMaterial('windMat', scene);
  windMat.diffuseColor = new BABYLON.Color3(0.7, 0.9, 1);
  windMat.emissiveColor = new BABYLON.Color3(0.5, 0.7, 0.9);
  windMat.alpha = 0.6;
  windSlash.material = windMat;
  
  // Wind particles
  const windParticles = new BABYLON.ParticleSystem('windParticles', 50, scene);
  windParticles.particleTexture = new BABYLON.Texture('/particle.png', scene);
  windParticles.emitter = windSlash;
  windParticles.color1 = new BABYLON.Color4(0.7, 0.9, 1, 0.8);
  windParticles.color2 = new BABYLON.Color4(0.5, 0.7, 0.9, 0.3);
  windParticles.minSize = 0.2;
  windParticles.maxSize = 0.4;
  windParticles.emitRate = 30;
  windParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
  windParticles.start();
  
  // Spiral flight
  const flyAnimation = new BABYLON.Animation(
    'fly',
    'position',
    60,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  
  const keys = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const pos = BABYLON.Vector3.Lerp(start, end, t);
    const angle = t * Math.PI * 2;
    pos.x += Math.cos(angle) * 0.3;
    pos.y += Math.sin(angle) * 0.3;
    keys.push({ frame: i, value: pos });
  }
  flyAnimation.setKeys(keys);
  
  scene.beginDirectAnimation(
    windSlash,
    [flyAnimation],
    0,
    20,
    false,
    1,
    () => {
      windParticles.stop();
      windSlash.dispose();
    }
  );
};

const createPoisonEffect = async (start: BABYLON.Vector3, end: BABYLON.Vector3) => {
  // Create poison bubble
  const poisonBubble = BABYLON.MeshBuilder.CreateSphere('poisonBubble', { diameter: 0.7 }, scene);
  poisonBubble.position = start.clone();
  
  const poisonMat = new BABYLON.StandardMaterial('poisonMat', scene);
  poisonMat.diffuseColor = new BABYLON.Color3(0.5, 0, 0.5);
  poisonMat.emissiveColor = new BABYLON.Color3(0.3, 0, 0.3);
  poisonMat.alpha = 0.7;
  poisonBubble.material = poisonMat;
  
  // Poison gas particles
  const poisonGas = new BABYLON.ParticleSystem('poisonGas', 80, scene);
  poisonGas.particleTexture = new BABYLON.Texture('/particle.png', scene);
  poisonGas.emitter = poisonBubble;
  poisonGas.color1 = new BABYLON.Color4(0.5, 0, 0.5, 0.8);
  poisonGas.color2 = new BABYLON.Color4(0.3, 0, 0.3, 0.3);
  poisonGas.minSize = 0.3;
  poisonGas.maxSize = 0.6;
  poisonGas.emitRate = 40;
  poisonGas.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
  poisonGas.start();
  
  // Wobbly movement
  const poisonAnimation = new BABYLON.Animation(
    'poisonMove',
    'position',
    60,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  
  const keys = [];
  for (let i = 0; i <= 25; i++) {
    const t = i / 25;
    const pos = BABYLON.Vector3.Lerp(start, end, t);
    pos.y += Math.sin(t * Math.PI * 6) * 0.2;
    keys.push({ frame: i, value: pos });
  }
  poisonAnimation.setKeys(keys);
  
  scene.beginDirectAnimation(
    poisonBubble,
    [poisonAnimation],
    0,
    25,
    false,
    1,
    () => {
      poisonGas.stop();
      poisonBubble.dispose();
      // Create lingering poison cloud
      createPoisonCloud(end);
    }
  );
};

const createPoisonCloud = (position: BABYLON.Vector3) => {
  const cloud = new BABYLON.ParticleSystem('poisonCloud', 100, scene);
  cloud.particleTexture = new BABYLON.Texture('/particle.png', scene);
  cloud.emitter = position;
  cloud.minEmitBox = new BABYLON.Vector3(-0.5, 0, -0.5);
  cloud.maxEmitBox = new BABYLON.Vector3(0.5, 0, 0.5);
  cloud.color1 = new BABYLON.Color4(0.5, 0, 0.5, 0.5);
  cloud.color2 = new BABYLON.Color4(0.3, 0, 0.3, 0.2);
  cloud.colorDead = new BABYLON.Color4(0, 0, 0, 0);
  cloud.minSize = 0.5;
  cloud.maxSize = 1;
  cloud.minLifeTime = 0.5;
  cloud.maxLifeTime = 1;
  cloud.emitRate = 50;
  cloud.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
  cloud.gravity = new BABYLON.Vector3(0, -0.5, 0);
  cloud.start();
  
  setTimeout(() => cloud.stop(), 1000);
};

const createGroundEffect = async (start: BABYLON.Vector3, end: BABYLON.Vector3) => {
  // Create earthquake effect
  const groundCrack = BABYLON.MeshBuilder.CreateGround('groundCrack', { width: 2, height: 0.5 }, scene);
  groundCrack.position = end.clone();
  groundCrack.position.y = 0;
  
  const crackMat = new BABYLON.StandardMaterial('crackMat', scene);
  crackMat.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0);
  crackMat.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0);
  groundCrack.material = crackMat;
  
  // Shake camera
  const originalCameraPosition = camera.position.clone();
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      camera.position.x = originalCameraPosition.x + (Math.random() - 0.5) * 0.2;
      camera.position.y = originalCameraPosition.y + (Math.random() - 0.5) * 0.2;
    }, i * 50);
  }
  setTimeout(() => {
    camera.position = originalCameraPosition;
  }, 500);
  
  // Rock particles
  const rocks = new BABYLON.ParticleSystem('rocks', 50, scene);
  rocks.particleTexture = new BABYLON.Texture('/particle.png', scene);
  rocks.emitter = end;
  rocks.minEmitBox = new BABYLON.Vector3(-1, 0, -1);
  rocks.maxEmitBox = new BABYLON.Vector3(1, 0, 1);
  rocks.color1 = new BABYLON.Color4(0.4, 0.2, 0, 1);
  rocks.color2 = new BABYLON.Color4(0.3, 0.15, 0, 1);
  rocks.minSize = 0.3;
  rocks.maxSize = 0.6;
  rocks.minInitialRotation = 0;
  rocks.maxInitialRotation = Math.PI * 2;
  rocks.minAngularSpeed = -5;
  rocks.maxAngularSpeed = 5;
  rocks.emitRate = 50;
  rocks.minLifeTime = 0.5;
  rocks.maxLifeTime = 1;
  rocks.gravity = new BABYLON.Vector3(0, -9.8, 0);
  rocks.start();
  
  setTimeout(() => {
    rocks.stop();
    groundCrack.dispose();
  }, 1000);
};

const createRockEffect = async (start: BABYLON.Vector3, end: BABYLON.Vector3) => {
  // Create rock projectile
  const rock = BABYLON.MeshBuilder.CreateBox('rock', { size: 0.6 }, scene);
  rock.position = start.clone();
  
  const rockMat = new BABYLON.StandardMaterial('rockMat', scene);
  rockMat.diffuseColor = new BABYLON.Color3(0.5, 0.4, 0.3);
  rockMat.emissiveColor = new BABYLON.Color3(0.2, 0.15, 0.1);
  rock.material = rockMat;
  
  // Rock rotation
  const rotAnimation = new BABYLON.Animation(
    'rockRot',
    'rotation',
    60,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  rotAnimation.setKeys([
    { frame: 0, value: new BABYLON.Vector3(0, 0, 0) },
    { frame: 20, value: new BABYLON.Vector3(Math.PI * 2, Math.PI * 2, 0) }
  ]);
  
  // Rock movement
  const moveAnimation = new BABYLON.Animation(
    'rockMove',
    'position',
    60,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  
  // Arc trajectory
  const keys = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const pos = BABYLON.Vector3.Lerp(start, end, t);
    pos.y += Math.sin(t * Math.PI) * 2;
    keys.push({ frame: i, value: pos });
  }
  moveAnimation.setKeys(keys);
  
  scene.beginDirectAnimation(
    rock,
    [moveAnimation, rotAnimation],
    0,
    20,
    false,
    1,
    () => {
      rock.dispose();
      createHitEffect(end);
    }
  );
};

const createBugEffect = async (start: BABYLON.Vector3, end: BABYLON.Vector3) => {
  // Create swarm of bugs
  const bugSwarm = new BABYLON.ParticleSystem('bugSwarm', 100, scene);
  bugSwarm.particleTexture = new BABYLON.Texture('/particle.png', scene);
  bugSwarm.emitter = start;
  bugSwarm.color1 = new BABYLON.Color4(0.4, 0.6, 0.2, 1);
  bugSwarm.color2 = new BABYLON.Color4(0.3, 0.5, 0.1, 0.8);
  bugSwarm.minSize = 0.1;
  bugSwarm.maxSize = 0.2;
  bugSwarm.emitRate = 100;
  bugSwarm.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
  bugSwarm.direction1 = new BABYLON.Vector3(-0.5, 0, -0.5);
  bugSwarm.direction2 = new BABYLON.Vector3(0.5, 0, 0.5);
  bugSwarm.minEmitPower = 3;
  bugSwarm.maxEmitPower = 5;
  bugSwarm.start();
  
  // Move emitter to target
  const moveAnimation = new BABYLON.Animation(
    'bugMove',
    'x',
    60,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  
  moveAnimation.setKeys([
    { frame: 0, value: start.x },
    { frame: 30, value: end.x }
  ]);
  
  const animatable = scene.beginDirectAnimation(
    bugSwarm.emitter,
    [moveAnimation],
    0,
    30,
    false,
    1,
    () => {
      bugSwarm.stop();
    }
  );
  
  // Also animate Y and Z
  const moveY = new BABYLON.Animation('bugMoveY', 'y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
  moveY.setKeys([{ frame: 0, value: start.y }, { frame: 30, value: end.y }]);
  
  const moveZ = new BABYLON.Animation('bugMoveZ', 'z', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
  moveZ.setKeys([{ frame: 0, value: start.z }, { frame: 30, value: end.z }]);
  
  scene.beginDirectAnimation(bugSwarm.emitter, [moveY, moveZ], 0, 30, false, 1);
};

const createGhostEffect = async (start: BABYLON.Vector3, end: BABYLON.Vector3) => {
  // Create ghost orb
  const ghost = BABYLON.MeshBuilder.CreateSphere('ghost', { diameter: 0.8 }, scene);
  ghost.position = start.clone();
  
  const ghostMat = new BABYLON.StandardMaterial('ghostMat', scene);
  ghostMat.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.7);
  ghostMat.emissiveColor = new BABYLON.Color3(0.3, 0.2, 0.5);
  ghostMat.alpha = 0.5;
  ghost.material = ghostMat;
  
  // Ghost trail
  const ghostTrail = new BABYLON.ParticleSystem('ghostTrail', 50, scene);
  ghostTrail.particleTexture = new BABYLON.Texture('/particle.png', scene);
  ghostTrail.emitter = ghost;
  ghostTrail.color1 = new BABYLON.Color4(0.5, 0.3, 0.7, 0.6);
  ghostTrail.color2 = new BABYLON.Color4(0.3, 0.2, 0.5, 0.2);
  ghostTrail.minSize = 0.2;
  ghostTrail.maxSize = 0.4;
  ghostTrail.emitRate = 30;
  ghostTrail.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
  ghostTrail.start();
  
  // Phasing animation
  const phaseAnimation = new BABYLON.Animation(
    'ghostPhase',
    'material.alpha',
    60,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  phaseAnimation.setKeys([
    { frame: 0, value: 0.5 },
    { frame: 10, value: 0.2 },
    { frame: 20, value: 0.5 }
  ]);
  
  // Wavy movement
  const moveAnimation = new BABYLON.Animation(
    'ghostMove',
    'position',
    60,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  
  const keys = [];
  for (let i = 0; i <= 25; i++) {
    const t = i / 25;
    const pos = BABYLON.Vector3.Lerp(start, end, t);
    pos.y += Math.sin(t * Math.PI * 4) * 0.3;
    pos.x += Math.cos(t * Math.PI * 4) * 0.2;
    keys.push({ frame: i, value: pos });
  }
  moveAnimation.setKeys(keys);
  
  scene.beginDirectAnimation(
    ghost,
    [moveAnimation, phaseAnimation],
    0,
    25,
    false,
    1,
    () => {
      ghostTrail.stop();
      ghost.dispose();
    }
  );
};

const createSteelEffect = async (start: BABYLON.Vector3, end: BABYLON.Vector3) => {
  // Create metal blade
  const blade = BABYLON.MeshBuilder.CreateBox('blade', { width: 1.5, height: 0.1, depth: 0.3 }, scene);
  blade.position = start.clone();
  
  const steelMat = new BABYLON.StandardMaterial('steelMat', scene);
  steelMat.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.8);
  steelMat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.6);
  steelMat.specularColor = new BABYLON.Color3(1, 1, 1);
  steelMat.specularPower = 64;
  blade.material = steelMat;
  
  // Spinning animation
  const spinAnimation = new BABYLON.Animation(
    'bladeSpin',
    'rotation.y',
    60,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  spinAnimation.setKeys([
    { frame: 0, value: 0 },
    { frame: 20, value: Math.PI * 4 }
  ]);
  
  // Movement
  const moveAnimation = new BABYLON.Animation(
    'bladeMove',
    'position',
    60,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  moveAnimation.setKeys([
    { frame: 0, value: start },
    { frame: 20, value: end }
  ]);
  
  // Metal sparks
  const sparks = new BABYLON.ParticleSystem('metalSparks', 30, scene);
  sparks.particleTexture = new BABYLON.Texture('/particle.png', scene);
  sparks.emitter = blade;
  sparks.color1 = new BABYLON.Color4(1, 1, 0.8, 1);
  sparks.color2 = new BABYLON.Color4(1, 0.8, 0.6, 0.5);
  sparks.minSize = 0.05;
  sparks.maxSize = 0.1;
  sparks.emitRate = 30;
  sparks.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
  sparks.start();
  
  scene.beginDirectAnimation(
    blade,
    [moveAnimation, spinAnimation],
    0,
    20,
    false,
    1,
    () => {
      sparks.stop();
      blade.dispose();
      createSlashEffect(end, 1);
    }
  );
};

const createNormalEffect = async (start: BABYLON.Vector3, end: BABYLON.Vector3) => {
  // Create simple impact
  const impact = BABYLON.MeshBuilder.CreateSphere('normalImpact', { diameter: 0.6 }, scene);
  impact.position = start.clone();
  
  const normalMat = new BABYLON.StandardMaterial('normalMat', scene);
  normalMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
  normalMat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
  normalMat.alpha = 0.8;
  impact.material = normalMat;
  
  // Simple particles
  const normalParticles = new BABYLON.ParticleSystem('normalParticles', 30, scene);
  normalParticles.particleTexture = new BABYLON.Texture('/particle.png', scene);
  normalParticles.emitter = impact;
  normalParticles.color1 = new BABYLON.Color4(0.9, 0.9, 0.9, 1);
  normalParticles.color2 = new BABYLON.Color4(0.7, 0.7, 0.7, 0.5);
  normalParticles.minSize = 0.1;
  normalParticles.maxSize = 0.2;
  normalParticles.emitRate = 20;
  normalParticles.start();
  
  // Direct movement
  const moveAnimation = new BABYLON.Animation(
    'normalMove',
    'position',
    60,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  moveAnimation.setKeys([
    { frame: 0, value: start },
    { frame: 15, value: end }
  ]);
  
  scene.beginDirectAnimation(
    impact,
    [moveAnimation],
    0,
    15,
    false,
    1,
    () => {
      normalParticles.stop();
      impact.dispose();
      createHitEffect(end);
    }
  );
};

const createHitEffect = (position: BABYLON.Vector3) => {
  // Create impact circle
  const impact = BABYLON.MeshBuilder.CreateDisc('hitImpact', { radius: 0.5 }, scene);
  impact.position = position.clone();
  impact.rotation.x = Math.PI / 2;
  
  const impactMat = new BABYLON.StandardMaterial('impactMat', scene);
  impactMat.diffuseColor = new BABYLON.Color3(1, 0.8, 0);
  impactMat.emissiveColor = new BABYLON.Color3(1, 0.6, 0);
  impactMat.alpha = 0.8;
  impact.material = impactMat;
  
  // Hit particles
  const hitParticles = new BABYLON.ParticleSystem('hitParticles', 50, scene);
  hitParticles.particleTexture = new BABYLON.Texture('/particle.png', scene);
  hitParticles.emitter = position;
  hitParticles.minEmitBox = new BABYLON.Vector3(-0.2, 0, -0.2);
  hitParticles.maxEmitBox = new BABYLON.Vector3(0.2, 0, 0.2);
  hitParticles.color1 = new BABYLON.Color4(1, 0.8, 0, 1);
  hitParticles.color2 = new BABYLON.Color4(1, 0.5, 0, 0.5);
  hitParticles.colorDead = new BABYLON.Color4(0, 0, 0, 0);
  hitParticles.minSize = 0.1;
  hitParticles.maxSize = 0.3;
  hitParticles.minLifeTime = 0.3;
  hitParticles.maxLifeTime = 0.5;
  hitParticles.emitRate = 100;
  hitParticles.burst = 50;
  hitParticles.targetStopDuration = 0.2;
  hitParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
  hitParticles.gravity = new BABYLON.Vector3(0, -2, 0);
  hitParticles.direction1 = new BABYLON.Vector3(-1, 1, -1);
  hitParticles.direction2 = new BABYLON.Vector3(1, 2, 1);
  hitParticles.minEmitPower = 2;
  hitParticles.maxEmitPower = 4;
  hitParticles.start();
  
  // Scale animation for impact
  const scaleAnimation = new BABYLON.Animation(
    'hitScale',
    'scaling',
    60,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  scaleAnimation.setKeys([
    { frame: 0, value: new BABYLON.Vector3(0.1, 0.1, 0.1) },
    { frame: 5, value: new BABYLON.Vector3(1.5, 1.5, 1.5) },
    { frame: 10, value: new BABYLON.Vector3(2, 2, 2) }
  ]);
  
  // Fade animation
  const fadeAnimation = new BABYLON.Animation(
    'hitFade',
    'material.alpha',
    60,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  fadeAnimation.setKeys([
    { frame: 0, value: 0.8 },
    { frame: 5, value: 0.5 },
    { frame: 10, value: 0 }
  ]);
  
  scene.beginDirectAnimation(
    impact,
    [scaleAnimation, fadeAnimation],
    0,
    10,
    false,
    1,
    () => {
      impact.dispose();
      hitParticles.stop();
    }
  );
};

const createExplosionEffect = (position: BABYLON.Vector3) => {
  // Create explosion particles
  const explosion = new BABYLON.ParticleSystem('explosion', 200, scene);
  explosion.particleTexture = new BABYLON.Texture('/particle.png', scene);
  explosion.emitter = position;
  explosion.minEmitBox = new BABYLON.Vector3(0, 0, 0);
  explosion.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
  explosion.color1 = new BABYLON.Color4(1, 0.5, 0, 1);
  explosion.color2 = new BABYLON.Color4(1, 0, 0, 1);
  explosion.colorDead = new BABYLON.Color4(0, 0, 0, 0);
  explosion.minSize = 0.3;
  explosion.maxSize = 1;
  explosion.minLifeTime = 0.2;
  explosion.maxLifeTime = 0.5;
  explosion.emitRate = 200;
  explosion.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
  explosion.gravity = new BABYLON.Vector3(0, 0, 0);
  explosion.direction1 = new BABYLON.Vector3(-1, -1, -1);
  explosion.direction2 = new BABYLON.Vector3(1, 1, 1);
  explosion.minAngularSpeed = 0;
  explosion.maxAngularSpeed = Math.PI;
  explosion.minEmitPower = 5;
  explosion.maxEmitPower = 10;
  explosion.updateSpeed = 0.01;
  
  explosion.start();
  
  setTimeout(() => {
    explosion.stop();
  }, 100);
};

const showDamageNumber = async (position: BABYLON.Vector3, damage: number, isCritical: boolean = false) => {
  // Create 3D text for damage number
  const damageText = BABYLON.MeshBuilder.CreatePlane('damageText', { size: 1 }, scene);
  damageText.position = position.clone();
  damageText.position.y += 1;
  damageText.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  
  // Create dynamic texture for text
  const texture = new BABYLON.DynamicTexture('damageTexture', { width: 256, height: 128 }, scene);
  const textMat = new BABYLON.StandardMaterial('textMat', scene);
  textMat.diffuseTexture = texture;
  textMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
  texture.hasAlpha = true;
  damageText.material = textMat;
  
  // Draw text
  const font = isCritical ? 'bold 80px Arial' : '60px Arial';
  const color = isCritical ? '#FFD700' : '#FF0000';
  texture.drawText(damage.toString(), null, null, font, color, 'transparent', true);
  
  // Animate floating up and fading
  const startY = damageText.position.y;
  let alpha = 1;
  let y = 0;
  
  const animateInterval = setInterval(() => {
    y += 0.05;
    alpha -= 0.02;
    damageText.position.y = startY + y;
    textMat.alpha = alpha;
    
    if (alpha <= 0) {
      clearInterval(animateInterval);
      damageText.dispose();
    }
  }, 16);
};

const showHealEffect = async (position: BABYLON.Vector3, amount: number) => {
  // Create healing particles
  const heal = new BABYLON.ParticleSystem('heal', 100, scene);
  heal.particleTexture = new BABYLON.Texture('/particle.png', scene);
  heal.emitter = position;
  heal.minEmitBox = new BABYLON.Vector3(-0.5, -0.5, -0.5);
  heal.maxEmitBox = new BABYLON.Vector3(0.5, 0.5, 0.5);
  heal.color1 = new BABYLON.Color4(0.2, 1, 0.2, 1);
  heal.color2 = new BABYLON.Color4(0.5, 1, 0.5, 0.8);
  heal.colorDead = new BABYLON.Color4(0.5, 1, 0.5, 0);
  heal.minSize = 0.1;
  heal.maxSize = 0.3;
  heal.minLifeTime = 0.5;
  heal.maxLifeTime = 1;
  heal.emitRate = 50;
  heal.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
  heal.gravity = new BABYLON.Vector3(0, 2, 0);
  heal.direction1 = new BABYLON.Vector3(-0.5, 1, -0.5);
  heal.direction2 = new BABYLON.Vector3(0.5, 2, 0.5);
  heal.minEmitPower = 1;
  heal.maxEmitPower = 2;
  
  heal.start();
  
  // Show heal amount with green color
  const healText = BABYLON.MeshBuilder.CreatePlane('healText', { size: 1 }, scene);
  healText.position = position.clone();
  healText.position.y += 1.5;
  healText.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  
  const texture = new BABYLON.DynamicTexture('healTexture', { width: 256, height: 128 }, scene);
  const textMat = new BABYLON.StandardMaterial('textMat', scene);
  textMat.diffuseTexture = texture;
  textMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
  texture.hasAlpha = true;
  healText.material = textMat;
  
  texture.drawText(`+${amount}`, null, null, '60px Arial', '#00FF00', 'transparent', true);
  
  const startY = healText.position.y;
  let alpha = 1;
  let y = 0;
  
  const animateInterval = setInterval(() => {
    y += 0.05;
    alpha -= 0.02;
    healText.position.y = startY + y;
    textMat.alpha = alpha;
    
    if (alpha <= 0) {
      clearInterval(animateInterval);
      healText.dispose();
    }
  }, 16);
  
  setTimeout(() => {
    heal.stop();
  }, 1000);
};

// Add battle intensity effects
const addBattleIntensity = () => {
  // Add bloom effect temporarily
  if (defaultPipeline) {
    const originalBloomWeight = defaultPipeline.bloomWeight;
    defaultPipeline.bloomWeight = 0.8;
    
    setTimeout(() => {
      defaultPipeline.bloomWeight = originalBloomWeight;
    }, 1000);
  }
  
  // Flash the background slightly
  const originalClearColor = scene.clearColor.clone();
  scene.clearColor = new BABYLON.Color4(0.8, 0.8, 1, 1);
  
  setTimeout(() => {
    scene.clearColor = originalClearColor;
  }, 200);
};

// Add impact flash on hit
const createImpactFlash = (position: BABYLON.Vector3, color: BABYLON.Color3 = new BABYLON.Color3(1, 1, 1)) => {
  // Create a flash sphere
  const flash = BABYLON.MeshBuilder.CreateSphere('impactFlash', { diameter: 3 }, scene);
  flash.position = position;
  
  const flashMat = new BABYLON.StandardMaterial('flashMat', scene);
  flashMat.emissiveColor = color;
  flashMat.alpha = 0.6;
  flash.material = flashMat;
  
  // Expand and fade
  let scale = 1;
  let alpha = 0.6;
  
  const expandInterval = setInterval(() => {
    scale += 0.3;
    alpha -= 0.06;
    
    flash.scaling = new BABYLON.Vector3(scale, scale, scale);
    flashMat.alpha = alpha;
    
    if (alpha <= 0) {
      clearInterval(expandInterval);
      flash.dispose();
    }
  }, 16);
};

// Create hit ripple effect
const createHitRipple = (position: BABYLON.Vector3) => {
  const ripple = BABYLON.MeshBuilder.CreateTorus('hitRipple', {
    diameter: 2,
    thickness: 0.1,
    tessellation: 32
  }, scene);
  ripple.position = position;
  ripple.rotation.x = Math.PI / 2;
  
  const rippleMat = new BABYLON.StandardMaterial('rippleMat', scene);
  rippleMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
  rippleMat.alpha = 0.8;
  ripple.material = rippleMat;
  
  // Animate ripple expansion
  let scale = 0.1;
  let alpha = 0.8;
  
  const expandInterval = setInterval(() => {
    scale += 0.2;
    alpha -= 0.08;
    
    ripple.scaling = new BABYLON.Vector3(scale, scale, scale);
    rippleMat.alpha = alpha;
    
    if (alpha <= 0) {
      clearInterval(expandInterval);
      ripple.dispose();
    }
  }, 16);
};

// Create damage wave effect
const createDamageWave = (position: BABYLON.Vector3, isCritical: boolean = false) => {
  // Create distortion wave
  const wave = BABYLON.MeshBuilder.CreateSphere('damageWave', { diameter: 0.5 }, scene);
  wave.position = position;
  
  const waveMat = new BABYLON.StandardMaterial('waveMat', scene);
  waveMat.emissiveColor = isCritical ? new BABYLON.Color3(1, 0.5, 0) : new BABYLON.Color3(1, 1, 1);
  waveMat.alpha = 0.3;
  waveMat.backFaceCulling = false;
  wave.material = waveMat;
  
  // Create wave particles
  const waveParticles = new BABYLON.ParticleSystem('waveParticles', 100, scene);
  waveParticles.particleTexture = new BABYLON.Texture('/particle.png', scene);
  waveParticles.emitter = wave;
  waveParticles.minEmitBox = new BABYLON.Vector3(0, 0, 0);
  waveParticles.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
  waveParticles.color1 = new BABYLON.Color4(1, 0.8, 0, 1);
  waveParticles.color2 = new BABYLON.Color4(1, 0.4, 0, 0.5);
  waveParticles.colorDead = new BABYLON.Color4(1, 0, 0, 0);
  waveParticles.minSize = 0.1;
  waveParticles.maxSize = 0.3;
  waveParticles.minLifeTime = 0.3;
  waveParticles.maxLifeTime = 0.6;
  waveParticles.emitRate = 1000;
  waveParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
  waveParticles.gravity = new BABYLON.Vector3(0, 0, 0);
  waveParticles.direction1 = new BABYLON.Vector3(-1, -1, -1);
  waveParticles.direction2 = new BABYLON.Vector3(1, 1, 1);
  waveParticles.minEmitPower = 3;
  waveParticles.maxEmitPower = 5;
  waveParticles.updateSpeed = 0.01;
  waveParticles.targetStopDuration = 0.1;
  waveParticles.disposeOnStop = true;
  
  waveParticles.start();
  
  // Animate wave
  let scale = 1;
  let alpha = 0.3;
  
  const expandInterval = setInterval(() => {
    scale += 0.4;
    alpha -= 0.03;
    
    wave.scaling = new BABYLON.Vector3(scale, scale, scale);
    waveMat.alpha = alpha;
    
    if (alpha <= 0) {
      clearInterval(expandInterval);
      wave.dispose();
    }
  }, 16);
};

// Create screen flash effect
const createScreenFlash = (color: BABYLON.Color4) => {
  const flash = BABYLON.MeshBuilder.CreatePlane('screenFlash', {
    width: 100,
    height: 100
  }, scene);
  
  flash.position = scene.activeCamera!.position.add(
    scene.activeCamera!.getDirection(BABYLON.Vector3.Forward()).scale(5)
  );
  flash.lookAt(scene.activeCamera!.position);
  
  const flashMat = new BABYLON.StandardMaterial('screenFlashMat', scene);
  flashMat.emissiveColor = new BABYLON.Color3(color.r, color.g, color.b);
  flashMat.alpha = color.a;
  flashMat.backFaceCulling = false;
  flash.material = flashMat;
  
  // Fade out
  let alpha = color.a;
  const fadeInterval = setInterval(() => {
    alpha -= 0.05;
    flashMat.alpha = alpha;
    
    if (alpha <= 0) {
      clearInterval(fadeInterval);
      flash.dispose();
    }
  }, 16);
};

// Create radial blur effect (simulated)
const createRadialBlur = (position: BABYLON.Vector3) => {
  // Create blur lines radiating from impact point
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const blurLine = BABYLON.MeshBuilder.CreatePlane('blurLine', {
      width: 0.1,
      height: 3
    }, scene);
    
    blurLine.position = position;
    blurLine.rotation.z = angle;
    
    const blurMat = new BABYLON.StandardMaterial('blurMat', scene);
    blurMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    blurMat.alpha = 0.3;
    blurLine.material = blurMat;
    
    // Animate outward
    let distance = 0;
    let alpha = 0.3;
    
    const moveInterval = setInterval(() => {
      distance += 0.3;
      alpha -= 0.03;
      
      const offset = new BABYLON.Vector3(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        0
      );
      blurLine.position = position.add(offset);
      blurMat.alpha = alpha;
      
      if (alpha <= 0) {
        clearInterval(moveInterval);
        blurLine.dispose();
      }
    }, 16);
  }
};

// Add slash effect for physical attacks
const createSlashEffect = (position: BABYLON.Vector3, direction: number) => {
  const slash = BABYLON.MeshBuilder.CreatePlane('slash', {
    width: 3,
    height: 0.5
  }, scene);
  
  slash.position = position;
  slash.rotation.z = direction > 0 ? -Math.PI / 4 : Math.PI / 4;
  
  const slashMat = new BABYLON.StandardMaterial('slashMat', scene);
  slashMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
  slashMat.alpha = 0.8;
  slash.material = slashMat;
  
  // Animate slash
  let progress = 0;
  const animateInterval = setInterval(() => {
    progress += 0.1;
    
    // Scale X to create slash motion
    slash.scaling.x = Math.sin(progress * Math.PI) * 3;
    slashMat.alpha = 0.8 * (1 - progress);
    
    if (progress >= 1) {
      clearInterval(animateInterval);
      slash.dispose();
    }
  }, 16);
};

// Add energy drain effect for special attacks
const createEnergyDrain = (from: BABYLON.Vector3, to: BABYLON.Vector3) => {
  const particleCount = 20;
  
  for (let i = 0; i < particleCount; i++) {
    setTimeout(() => {
      const particle = BABYLON.MeshBuilder.CreateSphere('energyParticle', {
        diameter: 0.1
      }, scene);
      
      particle.position = from.add(
        new BABYLON.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        )
      );
      
      const particleMat = new BABYLON.StandardMaterial('energyMat', scene);
      particleMat.emissiveColor = new BABYLON.Color3(0, 1, 1);
      particle.material = particleMat;
      
      // Animate to target
      const animation = new BABYLON.Animation(
        'energyDrain',
        'position',
        60,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      animation.setKeys([
        { frame: 0, value: particle.position },
        { frame: 30, value: to }
      ]);
      
      scene.beginDirectAnimation(
        particle,
        [animation],
        0,
        30,
        false,
        1,
        () => {
          particle.dispose();
        }
      );
    }, i * 50);
  }
};

// Add speed lines effect for fast attacks
const createSpeedLines = (direction: number) => {
  const speedLines = new BABYLON.ParticleSystem('speedLines', 100, scene);
  speedLines.particleTexture = new BABYLON.Texture('/particle.png', scene);
  
  // Position behind the camera
  const cameraPos = scene.activeCamera?.position || new BABYLON.Vector3(0, 5, -10);
  speedLines.emitter = cameraPos;
  speedLines.minEmitBox = new BABYLON.Vector3(-10, -5, 0);
  speedLines.maxEmitBox = new BABYLON.Vector3(10, 5, 0);
  
  speedLines.color1 = new BABYLON.Color4(1, 1, 1, 0.3);
  speedLines.color2 = new BABYLON.Color4(1, 1, 1, 0.1);
  speedLines.colorDead = new BABYLON.Color4(1, 1, 1, 0);
  
  speedLines.minSize = 0.1;
  speedLines.maxSize = 5;
  speedLines.minLifeTime = 0.1;
  speedLines.maxLifeTime = 0.3;
  speedLines.emitRate = 200;
  
  speedLines.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
  speedLines.gravity = new BABYLON.Vector3(0, 0, 0);
  speedLines.direction1 = new BABYLON.Vector3(0, 0, 20);
  speedLines.direction2 = new BABYLON.Vector3(0, 0, 30);
  speedLines.minEmitPower = 10;
  speedLines.maxEmitPower = 20;
  speedLines.updateSpeed = 0.01;
  
  speedLines.start();
  
  setTimeout(() => {
    speedLines.stop();
  }, 300);
};

const showStatusEffect = async (position: BABYLON.Vector3, status: string) => {
  // Create status icon
  const statusPlane = BABYLON.MeshBuilder.CreatePlane('statusIcon', { size: 0.5 }, scene);
  statusPlane.position = position.clone();
  statusPlane.position.y += 2;
  statusPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  
  // Create texture for status
  const texture = new BABYLON.DynamicTexture('statusTexture', { width: 128, height: 128 }, scene);
  const statusMat = new BABYLON.StandardMaterial('statusMat', scene);
  statusMat.diffuseTexture = texture;
  texture.hasAlpha = true;
  statusPlane.material = statusMat;
  
  // Draw status icon/text
  const statusIcons: Record<string, string> = {
    burn: '🔥',
    freeze: '❄️',
    paralyze: '⚡',
    poison: '☠️',
    sleep: '💤',
    confusion: '💫'
  };
  
  texture.drawText(statusIcons[status] || '!', null, null, '60px Arial', 'white', 'transparent', true);
  
  // Animate
  let alpha = 1;
  const animateInterval = setInterval(() => {
    alpha -= 0.01;
    statusMat.alpha = alpha;
    statusPlane.rotation.y += 0.05;
    
    if (alpha <= 0) {
      clearInterval(animateInterval);
      statusPlane.dispose();
    }
  }, 16);
};

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  scene?.dispose();
  engine?.dispose();
});
</script>

<style scoped>
.battle-arena-3d {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.babylon-canvas {
  width: 100%;
  height: 100%;
  outline: none;
  display: block;
}

.battle-ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.battle-ui-overlay > * {
  pointer-events: auto;
}

/* HP Bars */
.hp-bars {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 100px;
  z-index: 10;
}

.player-hp,
.opponent-hp {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.hp-bar {
  width: 200px;
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  overflow: hidden;
}

.hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ade80 0%, #22c55e 100%);
  transition: width 0.5s ease;
}

.hp-fill.opponent {
  background: linear-gradient(90deg, #f87171 0%, #ef4444 100%);
}

.hp-text {
  color: white;
  font-size: 14px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

/* Energy Orbs */
.energy-orbs {
  position: absolute;
  bottom: 200px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 15px;
  z-index: 10;
}

.energy-orb {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.energy-orb.active {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-color: #fbbf24;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.6);
}

.energy-orb.consumed {
  opacity: 0.3;
}

.orb-glow {
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.energy-orb.active .orb-glow {
  opacity: 1;
  animation: pulse 2s ease-in-out infinite;
}

.orb-icon {
  font-size: 20px;
  filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.5));
}

/* Skill Manager Container */
.skill-manager-container {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 800px;
  z-index: 10;
}

.skill-card.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.skill-icon {
  font-size: 32px;
  filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.5));
}

.skill-name {
  color: white;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
}

.skill-damage {
  color: #f87171;
  font-size: 12px;
  font-weight: bold;
}

.skill-cost {
  color: #fbbf24;
  font-size: 12px;
  font-weight: bold;
}

/* Battle Log */
.battle-log {
  position: absolute;
  top: 100px;
  right: 20px;
  width: 300px;
  max-height: 200px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  overflow-y: auto;
  z-index: 10;
}

.log-entry {
  color: white;
  font-size: 12px;
  margin-bottom: 5px;
  padding: 5px;
  border-radius: 5px;
  animation: slideIn 0.3s ease;
}

.log-entry.info {
  background: rgba(59, 130, 246, 0.2);
}

.log-entry.attack {
  background: rgba(239, 68, 68, 0.2);
}

.log-entry.damage {
  background: rgba(251, 146, 60, 0.2);
}

.log-entry.heal {
  background: rgba(34, 197, 94, 0.2);
}

/* Settings */
.settings-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 20;
}

.settings-btn:hover {
  background: rgba(0, 0, 0, 0.7);
  border-color: rgba(255, 255, 255, 0.5);
}

.settings-modal {
  position: absolute;
  top: 70px;
  right: 20px;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 20px;
  z-index: 20;
}

.settings-content h3 {
  color: white;
  margin-bottom: 15px;
}

.setting-item {
  color: white;
  margin-bottom: 10px;
}

.setting-item label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-item select {
  padding: 5px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.close-settings {
  margin-top: 15px;
  padding: 5px 15px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Victory/Defeat Overlay */
.battle-result-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.battle-result-container {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 3px solid #fbbf24;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  max-width: 500px;
  position: relative;
  overflow: hidden;
}

.battle-result-container.victory {
  border-color: #fbbf24;
  box-shadow: 0 0 60px rgba(251, 191, 36, 0.5);
}

.battle-result-container.defeat {
  border-color: #ef4444;
  box-shadow: 0 0 60px rgba(239, 68, 68, 0.5);
}

.result-effects {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.result-glow {
  position: absolute;
  inset: -50%;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, transparent 70%);
  animation: rotate 10s linear infinite;
}

.defeat .result-glow {
  background: radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%);
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.result-particles {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 20% 80%, rgba(251, 191, 36, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(251, 191, 36, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(251, 191, 36, 0.2) 0%, transparent 50%);
  animation: particleFloat 6s ease-in-out infinite;
}

.defeat .result-particles {
  background-image: 
    radial-gradient(circle at 20% 80%, rgba(239, 68, 68, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(239, 68, 68, 0.2) 0%, transparent 50%);
}

@keyframes particleFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.result-text {
  font-size: 4rem;
  font-weight: bold;
  margin: 0 0 20px;
  background: linear-gradient(45deg, #fbbf24, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 40px rgba(251, 191, 36, 0.5);
  animation: resultPulse 2s ease-in-out infinite;
}

.defeat .result-text {
  background: linear-gradient(45deg, #ef4444, #dc2626);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 40px rgba(239, 68, 68, 0.5);
}

@keyframes resultPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.result-details {
  color: #e2e8f0;
  font-size: 1.2rem;
  margin-bottom: 30px;
}

.result-rewards {
  display: flex;
  gap: 30px;
  justify-content: center;
  margin-bottom: 30px;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 10px;
  color: #fbbf24;
  font-size: 1.1rem;
  font-weight: bold;
}

.reward-item i {
  font-size: 1.5rem;
}

.result-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.result-button {
  padding: 12px 30px;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.result-button.primary {
  background: linear-gradient(45deg, #fbbf24, #f59e0b);
  color: #1e293b;
}

.result-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(251, 191, 36, 0.4);
}

.result-button.secondary {
  background: rgba(71, 85, 105, 0.5);
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.result-button.secondary:hover {
  background: rgba(71, 85, 105, 0.7);
  border-color: rgba(148, 163, 184, 0.5);
}

/* Transitions */
.battle-result-enter-active,
.battle-result-leave-active {
  transition: all 0.5s ease;
}

.battle-result-enter-from {
  opacity: 0;
}

.battle-result-leave-to {
  opacity: 0;
}

.battle-result-enter-active .battle-result-container {
  animation: resultBounceIn 0.6s ease-out;
}

@keyframes resultBounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>