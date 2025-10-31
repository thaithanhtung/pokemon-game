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
          @use-skill="executeSkill"
        />
        <!-- Switch Pokemon Button -->
        <button 
          v-if="hasBenchPokemon"
          @click="$emit('request-switch')"
          class="switch-pokemon-btn"
          :disabled="!canSwitch"
        >
          <i class="fas fa-exchange-alt"></i>
          Switch Pokemon
        </button>
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
      
      <!-- Debug Button -->
      <button class="debug-btn" @click="debugSkills" style="position: absolute; top: 60px; right: 10px; background: red; color: white; padding: 5px 10px; border-radius: 5px;">
        Debug Skills
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
            <p v-else>Your Pokemon has fainted. Better luck next time!</p>
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
            <button @click="restartBattle" class="result-button secondary">Battle Again</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { BattleCamera3D } from './BattleCamera3D';
import { Pokemon3DModel } from './Pokemon3DModel';
import { useBattle3DStore } from '@/stores/battle3D';
import { useCardBattleStore } from '@/stores/cardBattle';
import SkillManager from '@/components/battle/SkillManager.vue';
import { SKILL_DATABASE, getSkillsByType } from '@/types/skills';
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
  'request-switch': [];
}>();

const babylonCanvas = ref<HTMLCanvasElement | null>(null);
const battle3DStore = useBattle3DStore();
const cardBattleStore = useCardBattleStore();

// Get battle data from store - this is the source of truth
const currentBattle = computed(() => cardBattleStore.currentBattle);
const battleLog = computed(() => cardBattleStore.battleLog);

// Computed battle state from store
const playerHP = computed(() => currentBattle.value?.player?.activePokemon?.hp || 100);
const playerMaxHP = computed(() => currentBattle.value?.player?.activePokemon?.maxHp || 100);
const opponentHP = computed(() => currentBattle.value?.opponent?.activePokemon?.hp || 100);
const opponentMaxHP = computed(() => currentBattle.value?.opponent?.activePokemon?.maxHp || 100);
const currentEnergy = computed(() => currentBattle.value?.player?.energy || 3);
const maxEnergy = ref(5);
const isPlayerTurn = computed(
  () => currentBattle.value?.currentTurn === 'player' && !currentBattle.value?.ended
);

// Switch Pokemon computed properties
const hasBenchPokemon = computed(() => 
  currentBattle.value?.player?.bench?.length > 0
);

const canSwitch = computed(() => 
  isPlayerTurn.value && 
  !currentBattle.value?.requiresSwitch && 
  currentBattle.value?.player?.activePokemon?.hp > 0
);

// UI state
const selectedSkill = ref<Skill | null>(null);
const battleLogs = ref<BattleLog[]>([]);
const showSettings = ref(false);
const qualityLevel = ref(battle3DStore.performanceLevel);
const audioEnabled = ref(battle3DStore.audioEnabled);
const effectsEnabled = ref(battle3DStore.effectsEnabled);
const battleResult = ref<'victory' | 'defeat' | null>(null);

// Player skills from active Pokemon
const playerSkills = computed(() => {
  const activePokemon = currentBattle.value?.player?.activePokemon;
  console.log('BattleArena3D - Computing playerSkills for:', activePokemon?.name);
  console.log('  - Raw skills array:', activePokemon?.skills);
  console.log('  - Skills is array?', Array.isArray(activePokemon?.skills));
  console.log('  - Skills length:', activePokemon?.skills?.length);
  
  if (activePokemon?.skills && Array.isArray(activePokemon.skills) && activePokemon.skills.length > 0) {
    const mappedSkills = activePokemon.skills.map(skill => ({
      ...skill,
      currentCooldown: skill.currentCooldown || 0,
      // Ensure required properties exist
      energy: skill.energy || 1,
      power: skill.power || skill.damage || 50,
      accuracy: skill.accuracy || 100,
      effects: skill.effects || [],
      // Add damage property if missing (for compatibility)
      damage: skill.damage || skill.power || 50
    }));
    console.log('  - Mapped skills:', mappedSkills);
    console.log('  - Mapped skills count:', mappedSkills.length);
    console.log('  - Mapped skills details:', JSON.stringify(mappedSkills, null, 2));
    return mappedSkills;
  }
  console.log('  - Returning empty skills array');
  return [];
});

// Babylon.js references
let engine: BABYLON.Engine;
let scene: BABYLON.Scene;
let cameraSystem: BattleCamera3D;
let playerPokemonModel: Pokemon3DModel;
let opponentPokemonModel: Pokemon3DModel;
let defaultPipeline: BABYLON.DefaultRenderingPipeline;

// Computed properties
const playerHPPercentage = computed(() => (playerHP.value / playerMaxHP.value) * 100);
const opponentHPPercentage = computed(() => (opponentHP.value / opponentMaxHP.value) * 100);

// Watch for battle end
watch(
  () => currentBattle.value?.ended,
  ended => {
    if (ended && currentBattle.value?.result) {
      const playerWon = currentBattle.value.result === 'victory';
      handleBattleEnd(playerWon);
    }
  }
);

// Watch for Pokemon switching - reload 3D models
watch(
  () => currentBattle.value?.player?.activePokemon?.uid,
  async (newUid, oldUid) => {
    if (newUid && oldUid && newUid !== oldUid && playerPokemonModel) {
      const pokemon = currentBattle.value?.player?.activePokemon;
      if (pokemon) {
        console.log('=== POKEMON SWITCH DETECTED ===');
        console.log('New Pokemon:', pokemon.name);
        console.log('Pokemon skills:', pokemon.skills);
        console.log('Skills count:', pokemon.skills?.length);
        console.log('Full Pokemon data:', pokemon);
        
        const pokemonId = pokemon.pokemonId || pokemon.id || 25;
        const pokemonType = pokemon.types?.[0] || pokemon.pokemonType || 'normal';
        await playerPokemonModel.loadPokemon(pokemonId, pokemonType);
        playerPokemonModel.playIdleAnimation();
        addBattleLog(`Switched to ${pokemon.name}!`, 'info');
      }
    }
  }
);

watch(
  () => currentBattle.value?.opponent?.activePokemon?.uid,
  async (newUid, oldUid) => {
    if (newUid && oldUid && newUid !== oldUid && opponentPokemonModel) {
      const pokemon = currentBattle.value?.opponent?.activePokemon;
      if (pokemon) {
        const pokemonId = pokemon.pokemonId || pokemon.id || 6;
        const pokemonType = pokemon.types?.[0] || pokemon.pokemonType || 'fire';
        await opponentPokemonModel.loadPokemon(pokemonId, pokemonType);
        opponentPokemonModel.playIdleAnimation();
        addBattleLog(`Opponent switched to ${pokemon.name}!`, 'info');
      }
    }
  }
);

// Watch for battle log updates from store
watch(
  battleLog,
  (newLogs, oldLogs) => {
    if (newLogs && newLogs.length > (oldLogs?.length || 0)) {
      // Get the latest log
      const latestLog = newLogs[newLogs.length - 1];
      if (latestLog) {
        // Determine log type based on message content
        let logType: BattleLog['type'] = 'info';
        if (latestLog.message.includes('damage')) logType = 'damage';
        else if (latestLog.message.includes('used') || latestLog.message.includes('attack'))
          logType = 'attack';
        else if (latestLog.message.includes('heal') || latestLog.message.includes('restored'))
          logType = 'heal';

        addBattleLog(latestLog.message, logType);

        // Play animations for opponent's turn based on log message
        if (latestLog.message.includes('Opponent') && latestLog.message.includes('used')) {
          // Opponent is attacking - play animations
          handleOpponentAttackAnimation();
        }
      }
    }
  },
  { deep: true }
);

onMounted(() => {
  // Detect optimal performance
  battle3DStore.detectOptimalPerformance();
  initializeBattleArena();
});

// Watch for player Pokemon changes - watch both store and props
watch(
  () => ({
    storeUid: currentBattle.value?.player?.activePokemon?.uid,
    storeName: currentBattle.value?.player?.activePokemon?.name,
    propId: props.playerPokemon?.id,
    propName: props.playerPokemon?.name
  }), 
  async (newVal, oldVal) => {
    // Skip if no scene or no model loaded yet
    if (!scene || !playerPokemonModel) return;
    
    // Check if this is a real change (not initial load)
    const hasOldValue = oldVal.storeUid || oldVal.propId;
    const hasNewValue = newVal.storeUid || newVal.propId;
    
    if (!hasOldValue || !hasNewValue) return;
    
    // Check if Pokemon actually changed
    const storeChanged = oldVal.storeUid && newVal.storeUid && oldVal.storeUid !== newVal.storeUid;
    const propsChanged = oldVal.propId && newVal.propId && oldVal.propId !== newVal.propId;
    const nameChanged = oldVal.storeName && newVal.storeName && oldVal.storeName !== newVal.storeName;
    
    if (storeChanged || propsChanged || nameChanged) {
      console.log('Player Pokemon changed, updating 3D model');
      console.log('Old:', oldVal);
      console.log('New:', newVal);
      await updatePlayerPokemonModel();
    }
  },
  { deep: true }
);

// Watch for opponent Pokemon changes - watch both store and props
watch(
  () => ({
    storeUid: currentBattle.value?.opponent?.activePokemon?.uid,
    storeName: currentBattle.value?.opponent?.activePokemon?.name,
    propId: props.opponentPokemon?.id,
    propName: props.opponentPokemon?.name
  }), 
  async (newVal, oldVal) => {
    // Skip if no scene or no model loaded yet
    if (!scene || !opponentPokemonModel) return;
    
    // Check if this is a real change (not initial load)
    const hasOldValue = oldVal.storeUid || oldVal.propId;
    const hasNewValue = newVal.storeUid || newVal.propId;
    
    if (!hasOldValue || !hasNewValue) return;
    
    // Check if Pokemon actually changed
    const storeChanged = oldVal.storeUid && newVal.storeUid && oldVal.storeUid !== newVal.storeUid;
    const propsChanged = oldVal.propId && newVal.propId && oldVal.propId !== newVal.propId;
    const nameChanged = oldVal.storeName && newVal.storeName && oldVal.storeName !== newVal.storeName;
    
    if (storeChanged || propsChanged || nameChanged) {
      console.log('Opponent Pokemon changed, updating 3D model');
      console.log('Old:', oldVal);
      console.log('New:', newVal);
      await updateOpponentPokemonModel();
    }
  },
  { deep: true }
);

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
      'defaultPipeline',
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
  // Get Pokemon data from battle store or props as fallback
  const battle = currentBattle.value;
  const playerData = props.playerPokemon ||
    battle?.player?.activePokemon || {
      id: 25,
      name: 'Pikachu',
      types: ['electric'],
      stats: { hp: 100, attack: 55, defense: 40, speed: 90 },
    };

  const opponentData = props.opponentPokemon ||
    battle?.opponent?.activePokemon || {
      id: 6,
      name: 'Charizard',
      types: ['fire', 'flying'],
      stats: { hp: 120, attack: 84, defense: 78, speed: 100 },
    };

  // Load player Pokemon model
  const playerPokemonId = playerData.pokemonId || playerData.id || 25;
  const playerType = playerData.types?.[0] || playerData.pokemonType || 'electric';

  playerPokemonModel = new Pokemon3DModel(scene);
  await playerPokemonModel.loadPokemon(playerPokemonId, playerType);
  playerPokemonModel.setPosition(new BABYLON.Vector3(-6, 1, 0));
  playerPokemonModel.playIdleAnimation();

  // Load opponent Pokemon model
  const opponentPokemonId = opponentData.pokemonId || opponentData.id || 6;
  const opponentType = opponentData.types?.[0] || opponentData.pokemonType || 'fire';

  opponentPokemonModel = new Pokemon3DModel(scene);
  await opponentPokemonModel.loadPokemon(opponentPokemonId, opponentType);
  opponentPokemonModel.setPosition(new BABYLON.Vector3(6, 1, 0));
  opponentPokemonModel.playIdleAnimation();
};

// Update player Pokemon model when switching
const updatePlayerPokemonModel = async () => {
  if (!scene) return;

  // Get Pokemon data from props first (already transformed), fallback to store
  const playerData = props.playerPokemon || currentBattle.value?.player?.activePokemon;
  if (!playerData) return;

  const playerPokemonId = playerData.pokemonId || playerData.id || 25;
  const playerType = playerData.types?.[0] || playerData.pokemonType || 'electric';

  console.log('Updating player Pokemon model:', {
    name: playerData.name,
    id: playerPokemonId,
    type: playerType,
    data: playerData
  });

  // Create switch out effect
  if (playerPokemonModel) {
    createSwitchEffect(playerPokemonModel.getPosition(), true);
    
    // Wait a bit for the effect
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Dispose old model
    playerPokemonModel.dispose();
  }

  // Load new model
  playerPokemonModel = new Pokemon3DModel(scene);
  await playerPokemonModel.loadPokemon(playerPokemonId, playerType);
  playerPokemonModel.setPosition(new BABYLON.Vector3(-6, 1, 0));
  
  // Create switch in effect
  createSwitchEffect(playerPokemonModel.getPosition(), false);
  playerPokemonModel.playIdleAnimation();

  console.log(`Player switched to ${playerData.name} (ID: ${playerPokemonId})`);
};

// Update opponent Pokemon model when switching
const updateOpponentPokemonModel = async () => {
  if (!scene) return;

  // Get Pokemon data from props first (already transformed), fallback to store
  const opponentData = props.opponentPokemon || currentBattle.value?.opponent?.activePokemon;
  if (!opponentData) return;

  const opponentPokemonId = opponentData.pokemonId || opponentData.id || 6;
  const opponentType = opponentData.types?.[0] || opponentData.pokemonType || 'fire';

  console.log('Updating opponent Pokemon model:', {
    name: opponentData.name,
    id: opponentPokemonId,
    type: opponentType,
    data: opponentData
  });

  // Create switch out effect
  if (opponentPokemonModel) {
    createSwitchEffect(opponentPokemonModel.getPosition(), true);
    
    // Wait a bit for the effect
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Dispose old model
    opponentPokemonModel.dispose();
  }

  // Load new model
  opponentPokemonModel = new Pokemon3DModel(scene);
  await opponentPokemonModel.loadPokemon(opponentPokemonId, opponentType);
  opponentPokemonModel.setPosition(new BABYLON.Vector3(6, 1, 0));
  
  // Create switch in effect
  createSwitchEffect(opponentPokemonModel.getPosition(), false);
  opponentPokemonModel.playIdleAnimation();

  console.log(`Opponent switched to ${opponentData.name} (ID: ${opponentPokemonId})`);
};

const loadBattleData = () => {
  // This function is now mainly for logging/debugging
  // Battle data is automatically synced via computed properties
  const battle = currentBattle.value;
  if (battle) {
    console.log('Battle data loaded from store:', {
      playerHP: battle.player?.activePokemon?.hp,
      opponentHP: battle.opponent?.activePokemon?.hp,
      currentTurn: battle.currentTurn,
    });
  }
};

const executeSkill = async (skill: Skill) => {
  if (!isPlayerTurn.value) return;

  try {
    selectedSkill.value = skill;

    // Store HP before action for animation purposes
    const playerHPBefore = playerHP.value;
    const opponentHPBefore = opponentHP.value;

    // Transition camera based on skill category
    if (skill.category === 'ultimate') {
      await cameraSystem.transitionToState('critical', 800);
    } else {
      await cameraSystem.transitionToState('attack', 800);
    }

    // Focus on the center of action to see both Pokemon and skills
    const battleCenter = BABYLON.Vector3.Lerp(
      playerPokemonModel.getPosition(),
      opponentPokemonModel.getPosition(),
      0.5
    ).add(new BABYLON.Vector3(0, 1, 0));
    cameraSystem.focusOnTarget(battleCenter, 600);

    // Play attack animation
    playerPokemonModel.playAttackAnimation();

    // Add battle intensity effect
    addBattleIntensity();

    // Add subtle camera rotation for dynamic viewing
    cameraSystem.rotateAroundTarget(1500);

    // Add speed lines for quick attacks
    if (skill.id === 'quick_attack' || skill.category === 'physical') {
      createSpeedLines(playerPokemonModel.getPosition().x < 0 ? 1 : -1);
    }

    // Create skill visual effects
    await createSkillEffect(skill, playerPokemonModel, opponentPokemonModel);

    // Emit skill executed event
    emit('skill-executed', skill);

    // Add additional effects based on skill category
    if (skill.category === 'physical') {
      createSlashEffect(
        opponentPokemonModel.getPosition(),
        playerPokemonModel.getPosition().x < 0 ? 1 : -1
      );
    } else if (skill.category === 'special' && skill.element === 'psychic') {
      createEnergyDrain(opponentPokemonModel.getPosition(), playerPokemonModel.getPosition());
    }

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 800));

    // Execute the action through the store - this handles all damage calculation and state updates
    cardBattleStore.executePlayerAction({
      type: 'attack',
      skill,
    });

    // Wait a bit for store to update
    await new Promise(resolve => setTimeout(resolve, 200));

    // Calculate damage from HP difference for visual effects
    const opponentHPAfter = opponentHP.value;
    const damage = opponentHPBefore - opponentHPAfter;

    if (damage > 0) {
      // Play hurt animation
      opponentPokemonModel.playHurtAnimation();

      // Create multiple impact effects
      createImpactFlash(opponentPokemonModel.getPosition(), new BABYLON.Color3(1, 0.5, 0));
      createHitRipple(opponentPokemonModel.getPosition());
      createDamageWave(opponentPokemonModel.getPosition(), damage > 40);

      // Play impact sound
      if (soundService.isEnabled()) {
        soundService.play('attack-hit', 0.8);
      }

      // Screen effects for critical hits
      if (damage > 40) {
        createScreenFlash(new BABYLON.Color4(1, 0.8, 0, 0.3));
        createRadialBlur(opponentPokemonModel.getPosition());
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

      // Emit attack hit event
      emit('attack-hit', { damage, skill });

      // Show damage number
      await showDamageNumber(opponentPokemonModel.getPosition(), damage, damage > 40);
    }

    // Return camera to battle view
    await cameraSystem.transitionToState('battle', 1000);

    selectedSkill.value = null;
  } catch (error) {
    console.error('Error executing skill:', error);
    selectedSkill.value = null;
  }
};

// Opponent turn is now handled automatically by the cardBattleStore
// We just need to watch for changes and play animations
const handleOpponentAttackAnimation = async () => {
  if (!opponentPokemonModel || !playerPokemonModel) return;

  try {
    // Store HP before for damage calculation
    const playerHPBefore = playerHP.value;

    // Transition camera
    await cameraSystem.transitionToState('attack', 800);

    // Focus on battle center
    const battleCenter = BABYLON.Vector3.Lerp(
      opponentPokemonModel.getPosition(),
      playerPokemonModel.getPosition(),
      0.5
    ).add(new BABYLON.Vector3(0, 1, 0));
    cameraSystem.focusOnTarget(battleCenter, 600);

    // Play attack animation
    opponentPokemonModel.playAttackAnimation();

    // Add battle intensity
    addBattleIntensity();

    // Add subtle camera rotation
    cameraSystem.rotateAroundTarget(1500);

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Calculate damage from HP difference
    const playerHPAfter = playerHP.value;
    const damage = playerHPBefore - playerHPAfter;

    if (damage > 0) {
      // Play hurt animation
      playerPokemonModel.playHurtAnimation();

      // Create impact effects
      createImpactFlash(playerPokemonModel.getPosition(), new BABYLON.Color3(1, 0.5, 0));
      createHitRipple(playerPokemonModel.getPosition());
      createDamageWave(playerPokemonModel.getPosition(), damage > 40);

      // Play impact sound
      if (soundService.isEnabled()) {
        soundService.play('attack-hit', 0.8);
      }

      // Screen effects for critical hits
      if (damage > 40) {
        createScreenFlash(new BABYLON.Color4(1, 0, 0, 0.3));
        createRadialBlur(playerPokemonModel.getPosition());
        if (soundService.isEnabled()) {
          setTimeout(() => soundService.play('legendary-reveal', 0.5), 100);
        }
      }

      // Camera shake
      const shakeIntensity = Math.min(damage / 20, 10);
      cameraSystem.shake(shakeIntensity, 200);

      // Show damage number
      await showDamageNumber(playerPokemonModel.getPosition(), damage, damage > 40);
    }

    // Return camera to battle view
    await cameraSystem.transitionToState('battle', 1000);
  } catch (error) {
    console.error('Error in opponent attack animation:', error);
  }
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
    playerPokemonModel.playVictoryAnimation();
    opponentPokemonModel.playDefeatAnimation();
    addBattleLog('Player wins!', 'info');
    battle3DStore.transitionToPhase('victory');

    // Emit pokemon-faint event for opponent
    emit('pokemon-faint', {
      pokemon: 'opponent',
      isPlayer: false,
      remainingHP: 0,
    });
  } else {
    await cameraSystem.transitionToState('defeat', 1500);
    opponentPokemonModel.playVictoryAnimation();
    playerPokemonModel.playDefeatAnimation();
    addBattleLog('Player was defeated...', 'info');
    battle3DStore.transitionToPhase('defeat');

    // Emit pokemon-faint event for player
    emit('pokemon-faint', {
      pokemon: 'player',
      isPlayer: true,
      remainingHP: 0,
    });
  }

  // Emit battle end event
  emit('battle-end', playerWon ? 'victory' : 'defeat');
};

const restartBattle = async () => {
  // Hide battle result overlay
  battleResult.value = null;

  // Clear battle logs
  battleLogs.value = [];

  // Restart battle through store
  const battleMode = currentBattle.value?.mode || 'pvp';
  cardBattleStore.startBattle(battleMode);

  // Reset battle phase
  battle3DStore.transitionToPhase('preparation');

  // Reset camera
  await cameraSystem.transitionToState('battle', 1000);

  // Reload Pokemon models with new battle data
  await loadPokemonModels();

  // Play battle start sound
  if (soundService.isEnabled()) {
    soundService.play('battle-start', 0.7);
  }

  addBattleLog('Battle restarted!', 'info');

  // Emit battle start event
  emit('battle-start');
};

const addBattleLog = (message: string, type: BattleLog['type']) => {
  battleLogs.value.push({ message, type });
  if (battleLogs.value.length > 5) {
    battleLogs.value.shift();
  }
};

const debugSkills = () => {
  console.log('=== DEBUG SKILLS ===');
  const activePokemon = currentBattle.value?.player?.activePokemon;
  console.log('Active Pokemon:', activePokemon?.name);
  console.log('Skills in currentBattle:', activePokemon?.skills);
  console.log('Skills count:', activePokemon?.skills?.length);
  console.log('playerSkills computed:', playerSkills.value);
  console.log('playerSkills count:', playerSkills.value.length);
  
  // Try to force regenerate skills
  if (activePokemon && activePokemon.skills?.length <= 1) {
    console.log('Attempting to force regenerate skills...');
    const types = activePokemon.types || [activePokemon.pokemonType || 'normal'];
    console.log('Pokemon types:', types);
    
    // Force add some skills for testing
    const testSkills = [
      { id: 'tackle', name: 'Tackle', energy: 1, power: 40, damage: 40, accuracy: 100, element: 'normal', effects: [] },
      { id: 'quick_attack', name: 'Quick Attack', energy: 2, power: 60, damage: 60, accuracy: 100, element: 'normal', effects: [] },
      { id: 'thunderbolt', name: 'Thunderbolt', energy: 3, power: 90, damage: 90, accuracy: 100, element: 'electric', effects: [] }
    ];
    
    console.log('Force setting test skills:', testSkills);
    activePokemon.skills = testSkills;
    console.log('Skills after force set:', activePokemon.skills);
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
const createSkillEffect = async (
  skill: Skill,
  attacker: Pokemon3DModel,
  target: Pokemon3DModel
) => {
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
  const lightning = BABYLON.MeshBuilder.CreateLines(
    'lightning',
    {
      points: generateLightningPath(start, end),
    },
    scene
  );

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
    { frame: 30, value: end },
  ]);

  const animatable = scene.beginDirectAnimation(fireball, [moveAnimation], 0, 30, false, 1, () => {
    fireParticles.stop();
    fireball.dispose();
    createExplosionEffect(end);
  });
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
    { frame: 20, value: end },
  ]);

  scene.beginDirectAnimation(waterBall, [waterAnimation], 0, 20, false, 1, () => {
    waterTrail.stop();
    waterBall.dispose();
    createWaterSplashEffect(end);
  });
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

const createGenericEffect = async (
  start: BABYLON.Vector3,
  end: BABYLON.Vector3,
  element: SkillElement
) => {
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
    normal: new BABYLON.Color3(0.8, 0.8, 0.8),
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
    { frame: 20, value: end },
  ]);

  scene.beginDirectAnimation(projectile, [projectileAnimation], 0, 20, false, 1, () => {
    projectile.dispose();
  });
};

// Ice type effect
const createIceEffect = async (start: BABYLON.Vector3, end: BABYLON.Vector3) => {
  // Create ice shard
  const iceShard = BABYLON.MeshBuilder.CreateCylinder(
    'iceShard',
    {
      height: 1,
      diameterTop: 0.1,
      diameterBottom: 0.4,
      tessellation: 6,
    },
    scene
  );
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
    { frame: 25, value: end },
  ]);

  scene.beginDirectAnimation(iceShard, [iceAnimation], 0, 25, false, 1, () => {
    iceParticles.stop();
    iceShard.dispose();
    // Create freeze effect at target
    createFreezeEffect(end);
  });
};

const createFreezeEffect = (position: BABYLON.Vector3) => {
  // Create ice crystals forming
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const crystal = BABYLON.MeshBuilder.CreateBox('crystal', { size: 0.3 }, scene);
    crystal.position = position.add(
      new BABYLON.Vector3(Math.cos(angle) * 0.5, 0, Math.sin(angle) * 0.5)
    );

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
      { frame: 30, value: new BABYLON.Vector3(0, 0, 0) },
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
    const ring = BABYLON.MeshBuilder.CreateTorus(
      `psychicRing${i}`,
      {
        diameter: 1 + i * 0.3,
        thickness: 0.05,
      },
      scene
    );
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

  scene.beginDirectAnimation(psychicOrb, [psychicAnimation], 0, 30, false, 1, () => {
    rings.forEach(ring => ring.dispose());
    psychicOrb.dispose();
    createPsychicWave(end);
  });
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
    { frame: 25, value: end },
  ]);

  scene.beginDirectAnimation(darkSphere, [darkAnimation], 0, 25, false, 1, () => {
    darkParticles.stop();
    darkSphere.dispose();
    createDarkExplosion(end);
  });
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
  const dragonFlame = BABYLON.MeshBuilder.CreateCylinder(
    'dragonFlame',
    {
      height: 2,
      diameterTop: 0.2,
      diameterBottom: 0.8,
    },
    scene
  );
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

  scene.beginDirectAnimation(dragonFlame, [dragonAnimation], 0, 30, false, 1, () => {
    dragonParticles.stop();
    dragonFlame.dispose();
    createDragonBurst(end);
  });
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

  scene.beginDirectAnimation(sparkle, [fairyAnimation], 0, 30, false, 1, () => {
    fairyParticles.stop();
    sparkle.dispose();
    createWaterSplashEffect(end);
  });
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
    { frame: 10, value: end },
  ]);

  scene.beginDirectAnimation(fist, [punchAnimation], 0, 10, false, 1, () => {
    fist.dispose();
    createHitEffect(end);
  });
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

  scene.beginDirectAnimation(windSlash, [flyAnimation], 0, 20, false, 1, () => {
    windParticles.stop();
    windSlash.dispose();
  });
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

  scene.beginDirectAnimation(poisonBubble, [poisonAnimation], 0, 25, false, 1, () => {
    poisonGas.stop();
    poisonBubble.dispose();
    // Create lingering poison cloud
    createPoisonCloud(end);
  });
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
  const groundCrack = BABYLON.MeshBuilder.CreateGround(
    'groundCrack',
    { width: 2, height: 0.5 },
    scene
  );
  groundCrack.position = end.clone();
  groundCrack.position.y = 0;

  const crackMat = new BABYLON.StandardMaterial('crackMat', scene);
  crackMat.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0);
  crackMat.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0);
  groundCrack.material = crackMat;

  // Shake camera
  if (scene.activeCamera) {
    const originalCameraPosition = scene.activeCamera.position.clone();
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        if (scene.activeCamera) {
          scene.activeCamera.position.x = originalCameraPosition.x + (Math.random() - 0.5) * 0.2;
          scene.activeCamera.position.y = originalCameraPosition.y + (Math.random() - 0.5) * 0.2;
        }
      }, i * 50);
    }
    setTimeout(() => {
      if (scene.activeCamera) {
        scene.activeCamera.position = originalCameraPosition;
      }
    }, 500);
  }

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
    { frame: 20, value: new BABYLON.Vector3(Math.PI * 2, Math.PI * 2, 0) },
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

  scene.beginDirectAnimation(rock, [moveAnimation, rotAnimation], 0, 20, false, 1, () => {
    rock.dispose();
    createHitEffect(end);
  });
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
    { frame: 30, value: end.x },
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
  const moveY = new BABYLON.Animation(
    'bugMoveY',
    'y',
    60,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  moveY.setKeys([
    { frame: 0, value: start.y },
    { frame: 30, value: end.y },
  ]);

  const moveZ = new BABYLON.Animation(
    'bugMoveZ',
    'z',
    60,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  moveZ.setKeys([
    { frame: 0, value: start.z },
    { frame: 30, value: end.z },
  ]);

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
    { frame: 20, value: 0.5 },
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

  scene.beginDirectAnimation(ghost, [moveAnimation, phaseAnimation], 0, 25, false, 1, () => {
    ghostTrail.stop();
    ghost.dispose();
  });
};

const createSteelEffect = async (start: BABYLON.Vector3, end: BABYLON.Vector3) => {
  // Create metal blade
  const blade = BABYLON.MeshBuilder.CreateBox(
    'blade',
    { width: 1.5, height: 0.1, depth: 0.3 },
    scene
  );
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
    { frame: 20, value: Math.PI * 4 },
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
    { frame: 20, value: end },
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

  scene.beginDirectAnimation(blade, [moveAnimation, spinAnimation], 0, 20, false, 1, () => {
    sparks.stop();
    blade.dispose();
    createSlashEffect(end, 1);
  });
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
    { frame: 15, value: end },
  ]);

  scene.beginDirectAnimation(impact, [moveAnimation], 0, 15, false, 1, () => {
    normalParticles.stop();
    impact.dispose();
    createHitEffect(end);
  });
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
    { frame: 10, value: new BABYLON.Vector3(2, 2, 2) },
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
    { frame: 10, value: 0 },
  ]);

  scene.beginDirectAnimation(impact, [scaleAnimation, fadeAnimation], 0, 10, false, 1, () => {
    impact.dispose();
    hitParticles.stop();
  });
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

const showDamageNumber = async (
  position: BABYLON.Vector3,
  damage: number,
  isCritical: boolean = false
) => {
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
const createImpactFlash = (
  position: BABYLON.Vector3,
  color: BABYLON.Color3 = new BABYLON.Color3(1, 1, 1)
) => {
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
  const ripple = BABYLON.MeshBuilder.CreateTorus(
    'hitRipple',
    {
      diameter: 2,
      thickness: 0.1,
      tessellation: 32,
    },
    scene
  );
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

// Create Pokemon switch effect
const createSwitchEffect = (position: BABYLON.Vector3, isOut: boolean) => {
  // Create pokeball-like effect
  const pokeball = BABYLON.MeshBuilder.CreateSphere('pokeball', { diameter: 1.5 }, scene);
  pokeball.position = position.clone();
  pokeball.position.y += 1;

  const pokeballMat = new BABYLON.StandardMaterial('pokeballMat', scene);
  pokeballMat.emissiveColor = isOut ? new BABYLON.Color3(1, 0.2, 0.2) : new BABYLON.Color3(0.2, 0.2, 1);
  pokeballMat.alpha = 0.8;
  pokeball.material = pokeballMat;

  // Create beam effect
  const beam = BABYLON.MeshBuilder.CreateCylinder('beam', { 
    height: 4, 
    diameterTop: isOut ? 2 : 0.1, 
    diameterBottom: isOut ? 0.1 : 2 
  }, scene);
  beam.position = position.clone();
  beam.position.y = 2;

  const beamMat = new BABYLON.StandardMaterial('beamMat', scene);
  beamMat.emissiveColor = isOut ? new BABYLON.Color3(1, 0.5, 0.5) : new BABYLON.Color3(0.5, 0.5, 1);
  beamMat.alpha = 0.6;
  beam.material = beamMat;

  // Animate
  let scale = isOut ? 1 : 0.1;
  let alpha = 0.8;
  let rotation = 0;

  const animateInterval = setInterval(() => {
    if (isOut) {
      scale -= 0.1;
      rotation += 0.3;
    } else {
      scale += 0.1;
      rotation -= 0.3;
    }
    alpha -= 0.08;

    pokeball.scaling = new BABYLON.Vector3(scale, scale, scale);
    pokeball.rotation.y = rotation;
    beam.scaling.y = scale;
    pokeballMat.alpha = alpha;
    beamMat.alpha = alpha * 0.6;

    if (alpha <= 0 || (isOut && scale <= 0) || (!isOut && scale >= 1)) {
      clearInterval(animateInterval);
      pokeball.dispose();
      beam.dispose();
    }
  }, 16);

  // Sound effect
  if (soundService.isEnabled()) {
    soundService.play(isOut ? 'pokemon-return' : 'pokemon-send', 0.5);
  }
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
  const flash = BABYLON.MeshBuilder.CreatePlane(
    'screenFlash',
    {
      width: 100,
      height: 100,
    },
    scene
  );

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
    const blurLine = BABYLON.MeshBuilder.CreatePlane(
      'blurLine',
      {
        width: 0.1,
        height: 3,
      },
      scene
    );

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

      const offset = new BABYLON.Vector3(Math.cos(angle) * distance, Math.sin(angle) * distance, 0);
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
  const slash = BABYLON.MeshBuilder.CreatePlane(
    'slash',
    {
      width: 3,
      height: 0.5,
    },
    scene
  );

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
      const particle = BABYLON.MeshBuilder.CreateSphere(
        'energyParticle',
        {
          diameter: 0.1,
        },
        scene
      );

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
        { frame: 30, value: to },
      ]);

      scene.beginDirectAnimation(particle, [animation], 0, 30, false, 1, () => {
        particle.dispose();
      });
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
    confusion: '💫',
  };

  texture.drawText(
    statusIcons[status] || '!',
    null,
    null,
    '60px Arial',
    'white',
    'transparent',
    true
  );

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

.switch-pokemon-btn {
  position: absolute;
  top: -50px;
  right: 0;
  padding: 10px 20px;
  background: linear-gradient(45deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.switch-pokemon-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.switch-pokemon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.switch-pokemon-btn i {
  margin-right: 8px;
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
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.result-text {
  font-size: 4rem;
  font-weight: bold;
  margin: 0 0 20px;
  background: linear-gradient(45deg, #fbbf24, #f59e0b);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 40px rgba(251, 191, 36, 0.5);
  animation: resultPulse 2s ease-in-out infinite;
}

.defeat .result-text {
  background: linear-gradient(45deg, #ef4444, #dc2626);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 40px rgba(239, 68, 68, 0.5);
}

@keyframes resultPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
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
