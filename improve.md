# Battle System Enhancement with Babylon.js

## Overview

This document outlines comprehensive improvements to transform the current 2D battle system into an immersive 3D experience using Babylon.js. The enhancements focus on creating deeper engagement through cinematic visuals, dynamic environments, and interactive 3D elements.

## Current State Analysis

### Existing Battle System

- **BattleArena.vue**: Basic 2D turn-based combat interface
- **BattleCard.vue**: Static card display with hover effects
- **ParticlesEffect.vue**: Simple 2D particle animations
- **Turn-based mechanics**: Energy management, skill usage, HP tracking

### Current Limitations

- Static 2D interface lacks visual depth
- Limited animation feedback for attacks
- No environmental context for battles
- Basic particle effects without spatial awareness
- Fixed camera angles throughout battle

## Proposed 3D Enhancements

### 1. 3D Battle Arena System

#### Core Components

```typescript
// BattleArena3D.vue - Main 3D battle interface
export class BattleArena3D {
  private scene: Scene;
  private camera: ArcRotateCamera;
  private battleField: Mesh;
  private playerPlatform: Mesh;
  private opponentPlatform: Mesh;
  private environmentSystem: Environment3D;
  private animationSystem: BattleAnimations3D;
  private cameraSystem: BattleCamera3D;
}
```

#### Battle Field Design

- **Dynamic Terrain**: Procedurally generated battle fields based on Pokemon types
- **Platform System**: Elevated platforms for Pokemon positioning
- **Environmental Hazards**: Interactive elements that affect battle mechanics
- **Weather Effects**: Dynamic weather systems that impact battle atmosphere

#### Platform Specifications

- **Player Platform**: 3x3 units, positioned at (-6, 0, 0)
- **Opponent Platform**: 3x3 units, positioned at (6, 0, 0)
- **Battle Field**: 20x15 units with 32 subdivisions for detailed terrain
- **Elevation System**: Variable height platforms for tactical positioning

### 2. Pokemon 3D Models

#### Model Creation Strategy

```typescript
// Pokemon3DModel.ts - 3D Pokemon representation
export class Pokemon3DModel {
  private pokemonMesh: Mesh;
  private animationGroups: AnimationGroup[] = [];
  private typeEffects: ParticleSystem[] = [];
  private idleAnimation: AnimationGroup;
  private attackAnimation: AnimationGroup;
  private hurtAnimation: AnimationGroup;
}
```

#### Visual Features

- **Sprite-to-3D Conversion**: Transform 2D sprites into 3D planes with depth
- **Type-Based Auras**: Dynamic particle effects around Pokemon based on their type
- **Animation States**: Idle, attack, hurt, victory, defeat animations
- **Scale Variations**: Pokemon size reflects their rarity and power level
- **Dynamic Materials**: Shader-based materials that react to battle state

#### Type-Specific Effects

- **Fire Types**: Lava particles, heat distortion, glowing embers
- **Water Types**: Water droplets, flowing streams, bubble effects
- **Electric Types**: Lightning bolts, electric sparks, energy fields
- **Grass Types**: Leaf particles, vine animations, nature aura
- **Psychic Types**: Mystical orbs, mind waves, telekinetic effects

### 3. Dynamic Attack Animations

#### Attack System Architecture

```typescript
// BattleAnimations3D.ts - Comprehensive attack system
export class BattleAnimations3D {
  private particleSystems: Map<string, ParticleSystem> = new Map();
  private attackTrails: Mesh[] = [];
  private impactEffects: ParticleSystem[] = [];
  private screenShake: ScreenShakeEffect;
  private slowMotion: SlowMotionEffect;
}
```

#### Attack Categories

##### Physical Attacks

- **Tackle**: Pokemon charges forward with dust particles
- **Quick Attack**: Blur effect with speed lines
- **Body Slam**: Ground impact with shockwave particles
- **Hyper Beam**: Charging energy with screen shake

##### Special Attacks

- **Flamethrower**: Continuous fire stream with heat distortion
- **Hydro Pump**: High-pressure water jet with splash effects
- **Thunderbolt**: Lightning bolt connecting attacker to target
- **Solar Beam**: Charging sunlight with beam projection

##### Status Effects

- **Poison**: Green gas particles around affected Pokemon
- **Burn**: Fire particles with damage over time visualization
- **Freeze**: Ice crystals forming on Pokemon
- **Paralysis**: Electric sparks with movement restriction

#### Animation Timing

- **Wind-up Phase**: 0.5 seconds for attack preparation
- **Execution Phase**: 1.0 seconds for attack animation
- **Impact Phase**: 0.3 seconds for damage visualization
- **Recovery Phase**: 0.2 seconds for return to idle

### 4. Cinematic Camera System

#### Camera States

```typescript
// BattleCamera3D.ts - Dynamic camera management
export class BattleCamera3D {
  private camera: ArcRotateCamera;
  private cameraStates: Map<string, CameraState> = new Map();
  private transitionAnimations: AnimationGroup[] = [];
  private shakeEffect: CameraShakeEffect;
}
```

#### Camera Positions

- **Battle Overview**: Wide angle showing both Pokemon (radius: 15, alpha: π/4, beta: π/3)
- **Attack Close-up**: Focused on attacking Pokemon (radius: 8, alpha: π/2, beta: π/4)
- **Critical Hit**: Dramatic low angle (radius: 12, alpha: π/6, beta: π/6)
- **Victory Pose**: Celebratory angle (radius: 10, alpha: π/3, beta: π/4)
- **Defeat**: Somber angle (radius: 12, alpha: π/2, beta: π/3)

#### Camera Transitions

- **Smooth Interpolation**: 1-second transitions between camera states
- **Easing Functions**: Cubic bezier curves for natural movement
- **Focus Tracking**: Camera follows active Pokemon during attacks
- **Shake Effects**: Screen shake for impact and critical hits

### 5. Enhanced UI Integration

#### 3D UI Elements

```typescript
// BattleUI3D.vue - Integrated 3D interface
export class BattleUI3D {
  private hpBars: HPBar3D[] = [];
  private energyOrbs: EnergyOrb3D[] = [];
  private skillCards: SkillCard3D[] = [];
  private statusEffects: StatusEffect3D[] = [];
  private damageNumbers: DamageNumber3D[] = [];
}
```

#### HP Bar System

- **3D Health Bars**: Floating above Pokemon with depth and glow effects
- **Damage Visualization**: Smooth HP reduction with color transitions
- **Critical Health**: Red pulsing effect when HP drops below 25%
- **Healing Effects**: Green glow animation for HP restoration

#### Energy System

- **3D Energy Orbs**: Floating energy indicators with particle trails
- **Energy Consumption**: Visual energy transfer to skills
- **Energy Regeneration**: Gradual orb filling animation
- **Energy Overflow**: Special effects when energy exceeds maximum

#### Skill Card Interface

- **3D Card Models**: Elevated cards with hover effects
- **Type-Based Glow**: Cards glow with their elemental type color
- **Availability States**: Disabled cards fade and lower
- **Selection Feedback**: Selected cards lift and glow brighter

### 6. Environmental Dynamics

#### Environment Types

```typescript
// BattleEnvironment3D.ts - Dynamic battle environments
export class BattleEnvironment3D {
  private environmentMeshes: Mesh[] = [];
  private weatherSystem: WeatherSystem;
  private lightingSystem: DynamicLighting;
  private particleSystems: ParticleSystem[] = [];
}
```

#### Environment Categories

##### Type-Based Arenas

- **Fire vs Water**: Volcano island vs ocean platform
- **Grass vs Fire**: Forest clearing vs desert oasis
- **Electric vs Ground**: Storm clouds vs rocky cave
- **Psychic vs Dark**: Mystical realm vs shadow dimension
- **Ice vs Fire**: Frozen tundra vs lava fields

##### Weather Effects

- **Rain**: Water particles affecting visibility and movement
- **Snow**: Snowflakes with reduced visibility
- **Sandstorm**: Sand particles with obscured vision
- **Thunderstorm**: Lightning strikes with dramatic lighting
- **Sunny**: Bright lighting with heat distortion

##### Interactive Elements

- **Destructible Objects**: Rocks, trees, and structures that can be damaged
- **Environmental Hazards**: Lava pools, ice patches, electric fields
- **Weather Interactions**: Pokemon abilities that change weather
- **Terrain Effects**: Different ground types affecting movement

### 7. Audio-Visual Integration

#### Spatial Audio System

```typescript
// BattleAudio3D.ts - 3D audio implementation
export class BattleAudio3D {
  private audioContext: AudioContext;
  private spatialAudioSources: Map<string, AudioBufferSourceNode> = new Map();
  private reverbNodes: ConvolverNode[] = [];
  private dopplerEffects: Map<string, PannerNode> = new Map();
}
```

#### Audio Features

- **3D Sound Positioning**: Sounds originate from Pokemon locations
- **Distance Attenuation**: Volume decreases with distance
- **Environmental Reverb**: Different reverb for different environments
- **Doppler Effects**: Sound frequency changes with movement
- **Layered Audio**: Multiple audio tracks for complex soundscapes

#### Sound Categories

- **Attack Sounds**: Unique audio for each attack type
- **Impact Effects**: Crunch, splash, zap sounds for damage
- **Environmental Audio**: Wind, water, fire ambient sounds
- **UI Sounds**: Button clicks, card selections, menu navigation
- **Victory/Defeat**: Triumphant or somber musical themes

### 8. Performance Optimization

#### Rendering Optimization

```typescript
// PerformanceManager.ts - Optimization system
export class PerformanceManager {
  private lodSystem: LODSystem;
  private occlusionCulling: OcclusionCulling;
  private textureAtlas: TextureAtlas;
  private instancedRendering: InstancedRendering;
}
```

#### Optimization Strategies

- **Level of Detail (LOD)**: Different detail levels based on camera distance
- **Occlusion Culling**: Hide objects not visible to camera
- **Texture Atlasing**: Combine multiple textures into single atlas
- **Instanced Rendering**: Render multiple similar objects efficiently
- **Frustum Culling**: Only render objects within camera view

#### Quality Settings

- **High Quality**: Full particle effects, high-resolution textures, complex shaders
- **Medium Quality**: Reduced particle count, medium-resolution textures, simplified shaders
- **Low Quality**: Minimal particles, low-resolution textures, basic materials
- **Mobile Optimization**: Touch controls, reduced effects, battery optimization

### 9. Mobile Compatibility

#### Touch Controls

- **Gesture Recognition**: Swipe, tap, pinch gestures for battle actions
- **Haptic Feedback**: Vibration for attacks and impacts
- **Adaptive UI**: Larger touch targets for mobile devices
- **Orientation Support**: Landscape and portrait mode compatibility

#### Performance Scaling

- **Automatic Quality Detection**: Adjust quality based on device capabilities
- **Battery Optimization**: Reduce effects when battery is low
- **Thermal Management**: Lower quality when device overheats
- **Memory Management**: Efficient texture and model loading

### 10. Implementation Architecture

#### Component Structure

```
src/
├── components/
│   ├── battle3d/
│   │   ├── BattleArena3D.vue
│   │   ├── Pokemon3DModel.vue
│   │   ├── BattleAnimations3D.ts
│   │   ├── BattleCamera3D.ts
│   │   ├── BattleEnvironment3D.ts
│   │   ├── BattleUI3D.vue
│   │   └── BattleAudio3D.ts
│   ├── effects/
│   │   ├── ParticleEffects3D.ts
│   │   ├── ScreenEffects3D.ts
│   │   └── WeatherEffects3D.ts
│   └── utils/
│       ├── PerformanceManager.ts
│       ├── LODSystem.ts
│       └── MobileOptimizer.ts
```

#### State Management

```typescript
// stores/battle3D.ts
export const useBattle3DStore = defineStore('battle3D', {
  state: () => ({
    currentPhase: 'preparation' as BattlePhase,
    cameraState: 'battle' as CameraState,
    environmentType: 'neutral' as EnvironmentType,
    battleIntensity: 0,
    performanceLevel: 'high' as PerformanceLevel,
    audioEnabled: true,
    effectsEnabled: true,
  }),

  actions: {
    transitionToPhase(phase: BattlePhase) {
      /* ... */
    },
    updateCameraState(state: CameraState) {
      /* ... */
    },
    changeEnvironment(type: EnvironmentType) {
      /* ... */
    },
    adjustPerformanceLevel(level: PerformanceLevel) {
      /* ... */
    },
  },
});
```

### 11. Technical Specifications

#### Babylon.js Integration

- **Engine Version**: Babylon.js 8.32.2
- **WebGL Requirements**: WebGL 2.0 support
- **Browser Compatibility**: Chrome 80+, Firefox 75+, Safari 13+
- **Mobile Support**: iOS 13+, Android 8+

#### Performance Targets

- **Frame Rate**: 60 FPS on desktop, 30 FPS on mobile
- **Memory Usage**: < 512MB on desktop, < 256MB on mobile
- **Loading Time**: < 3 seconds for initial battle setup
- **Battery Impact**: Minimal drain on mobile devices

#### Asset Requirements

- **Texture Resolution**: 512x512 for Pokemon sprites, 1024x1024 for environments
- **Model Complexity**: < 1000 vertices per Pokemon model
- **Particle Count**: < 1000 particles per effect system
- **Audio Quality**: 44.1kHz, 16-bit audio files

### 12. User Experience Enhancements

#### Immersive Features

- **Cinematic Transitions**: Smooth camera movements between battle phases
- **Dynamic Lighting**: Lighting changes based on battle intensity
- **Particle Overload**: Spectacular effects for critical hits and special attacks
- **Environmental Storytelling**: Battle arena reflects Pokemon types and battle context

#### Accessibility Features

- **Visual Indicators**: Clear visual feedback for all actions
- **Audio Cues**: Sound effects for important events
- **Reduced Motion**: Option to disable excessive animations
- **High Contrast**: Alternative color schemes for better visibility

#### Customization Options

- **Effect Intensity**: Slider to adjust particle effect intensity
- **Camera Sensitivity**: Adjustable camera movement speed
- **Audio Levels**: Separate volume controls for music, effects, and voice
- **Quality Presets**: Easy quality switching for different devices

### 13. Implementation Roadmap

#### Phase 1: Foundation (Weeks 1-2)

**Objectives**:

- Setup Babylon.js 3D scene infrastructure
- Create base BattleArena3D component
- Implement camera system with state management
- Basic Pokemon sprite-to-3D conversion

**Tasks**:

- Install and configure Babylon.js packages
- Create 3D scene initialization logic
- Implement ArcRotateCamera with controls
- Setup ground and platform meshes
- Convert Pokemon sprites to 3D planes
- Implement basic lighting system

**Deliverables**:

- Working 3D battle arena with camera controls
- Functional Pokemon 3D models
- Basic scene rendering at 60 FPS

#### Phase 2: Core Animations (Weeks 3-4)

**Objectives**:

- Implement attack animation system
- Create particle effects for all Pokemon types
- Develop impact and damage visualization
- Add camera transitions for battle events

**Tasks**:

- Create BattleAnimations3D class
- Implement particle systems for each element type
- Add attack trail effects
- Create screen shake and slow motion effects
- Develop damage number animations
- Implement HP bar animations

**Deliverables**:

- Fully animated attack system
- Type-specific particle effects
- Cinematic camera transitions

#### Phase 3: Environment & Audio (Weeks 5-6)

**Objectives**:

- Dynamic environment generation
- Weather system implementation
- Spatial audio integration
- Environmental hazards and interactions

**Tasks**:

- Create BattleEnvironment3D class
- Implement type-based arena generation
- Add weather particle systems
- Setup spatial audio context
- Create environmental sound effects
- Add ambient audio layers

**Deliverables**:

- Immersive battle environments
- Dynamic weather effects
- 3D spatial audio system

#### Phase 4: UI & Polish (Weeks 7-8)

**Objectives**:

- 3D UI element integration
- HP bars, energy orbs, skill cards in 3D
- Performance optimization
- Mobile compatibility testing

**Tasks**:

- Create 3D HP bar components
- Implement floating energy orbs
- Add 3D skill card interface
- Optimize particle counts
- Implement LOD system
- Add mobile touch controls

**Deliverables**:

- Production-ready battle system
- Optimized performance across devices
- Mobile-friendly interface

#### Phase 5: Testing & Optimization (Weeks 9-10)

**Objectives**:

- Cross-browser testing
- Mobile device optimization
- Performance profiling
- Bug fixes and refinements

**Tasks**:

- Test on Chrome, Firefox, Safari, Edge
- Test on iOS and Android devices
- Profile memory usage and FPS
- Fix identified bugs
- Optimize asset loading
- Fine-tune animations

**Deliverables**:

- Stable, optimized release
- Comprehensive test coverage
- Performance benchmarks

### 14. Testing & Quality Assurance

#### Unit Testing

**Component Tests**:

```typescript
// BattleArena3D.spec.ts
describe('BattleArena3D', () => {
  it('should initialize Babylon engine', () => {
    const arena = new BattleArena3D(canvas);
    expect(arena.engine).toBeDefined();
    expect(arena.scene).toBeDefined();
  });

  it('should create battle field with correct dimensions', () => {
    const arena = new BattleArena3D(canvas);
    const battleField = arena.getBattleField();
    expect(battleField.width).toBe(20);
    expect(battleField.height).toBe(15);
  });
});
```

**Animation Tests**:

```typescript
// BattleAnimations3D.spec.ts
describe('BattleAnimations3D', () => {
  it('should create fire attack animation', async () => {
    const animations = new BattleAnimations3D(scene);
    const animation = await animations.createFireAttack(attacker, target);
    expect(animation).toBeDefined();
    expect(animation.duration).toBeCloseTo(2000);
  });

  it('should apply correct damage timing', () => {
    const animations = new BattleAnimations3D(scene);
    const timing = animations.getAttackTiming('flamethrower');
    expect(timing.windUp).toBe(500);
    expect(timing.execution).toBe(1000);
    expect(timing.impact).toBe(300);
  });
});
```

**State Management Tests**:

```typescript
// battle3D.spec.ts
describe('battle3D store', () => {
  it('should transition to attack phase', () => {
    const store = useBattle3DStore();
    store.transitionToPhase('attack');
    expect(store.currentPhase).toBe('attack');
    expect(store.cameraState).toBe('attack');
  });

  it('should update battle intensity', () => {
    const store = useBattle3DStore();
    store.transitionToPhase('critical');
    expect(store.battleIntensity).toBeGreaterThan(0);
  });
});
```

#### Integration Testing

**Battle Flow Tests**:

```typescript
describe('Complete Battle Flow', () => {
  it('should execute full battle sequence', async () => {
    const battle = await initBattle();

    // Start battle
    await battle.start();
    expect(battle.state).toBe('ready');

    // Execute attack
    await battle.executeAttack('flamethrower');
    expect(battle.opponentHP).toBeLessThan(100);

    // Verify animations played
    expect(battle.animationsPlayed).toContain('fire_attack');

    // End battle
    await battle.end();
    expect(battle.state).toBe('completed');
  });
});
```

**Camera Transition Tests**:

```typescript
describe('Camera System Integration', () => {
  it('should smoothly transition between states', async () => {
    const camera = new BattleCamera3D(scene);
    const startPosition = camera.getPosition();

    await camera.transitionToState('attack', 1000);
    const endPosition = camera.getPosition();

    expect(endPosition).not.toEqual(startPosition);
    expect(camera.currentState).toBe('attack');
  });
});
```

**Environment Change Tests**:

```typescript
describe('Environment System Integration', () => {
  it('should change environment based on Pokemon types', async () => {
    const environment = new BattleEnvironment3D(scene);

    await environment.createDynamicEnvironment('fire', 'water');

    expect(environment.hasVolcano).toBe(true);
    expect(environment.hasOcean).toBe(true);
    expect(environment.weatherType).toBe('sunny');
  });
});
```

#### Performance Testing

**Load Testing**:

```typescript
describe('Performance Load Tests', () => {
  it('should maintain 60 FPS with multiple particle systems', () => {
    const battle = new BattleArena3D(canvas);

    // Create multiple particle systems
    for (let i = 0; i < 10; i++) {
      battle.addParticleSystem('fire', i);
    }

    const fps = battle.measureFPS(5000); // 5 seconds
    expect(fps).toBeGreaterThanOrEqual(55); // Allow 5 FPS variance
  });

  it('should not exceed memory limits', () => {
    const battle = new BattleArena3D(canvas);
    const initialMemory = performance.memory.usedJSHeapSize;

    // Run battle for 2 minutes
    battle.runForDuration(120000);

    const finalMemory = performance.memory.usedJSHeapSize;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;

    expect(memoryIncrease).toBeLessThan(100); // Less than 100MB increase
  });
});
```

**FPS Monitoring**:

```typescript
describe('FPS Performance', () => {
  it('should maintain target FPS on desktop', () => {
    const battle = new BattleArena3D(canvas);
    battle.setQualityLevel('high');

    const fps = battle.measureFPS(10000);
    expect(fps).toBeGreaterThanOrEqual(58);
  });

  it('should maintain target FPS on mobile', () => {
    const battle = new BattleArena3D(canvas);
    battle.setQualityLevel('low');
    battle.setMobileMode(true);

    const fps = battle.measureFPS(10000);
    expect(fps).toBeGreaterThanOrEqual(28);
  });
});
```

#### Cross-Platform Testing

**Browser Compatibility**:

- Chrome 80+: Full feature support
- Firefox 75+: Full feature support
- Safari 13+: WebGL limitations, test audio
- Edge 80+: Full feature support

**Mobile Device Testing**:

- iOS 13+ (iPhone 11, 12, 13, 14)
- Android 8+ (Samsung, Google Pixel, OnePlus)
- Tablet devices (iPad Pro, Samsung Tab)

**Screen Size Testing**:

- Desktop: 1920x1080, 2560x1440, 3840x2160
- Laptop: 1366x768, 1920x1080
- Mobile: 375x667, 414x896, 390x844
- Tablet: 768x1024, 1024x768

### 15. Complete Implementation Example

#### BattleArena3D.vue - Full Component

```vue
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

      <!-- Skill Cards -->
      <div v-if="isPlayerTurn" class="skill-cards">
        <div
          v-for="skill in playerSkills"
          :key="skill.name"
          class="skill-card"
          :class="{
            disabled: !canUseSkill(skill),
            selected: selectedSkill?.name === skill.name,
          }"
          @click="selectSkill(skill)"
        >
          <div class="skill-icon">{{ getSkillIcon(skill.element) }}</div>
          <div class="skill-name">{{ skill.name }}</div>
          <div class="skill-damage">{{ skill.damage }} DMG</div>
          <div class="skill-cost">{{ skill.energy }}⚡</div>
        </div>
      </div>

      <!-- Battle Log -->
      <div class="battle-log">
        <div v-for="(log, index) in battleLogs" :key="index" class="log-entry" :class="log.type">
          {{ log.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import * as BABYLON from '@babylonjs/core';
import { BattleCamera3D } from './BattleCamera3D';
import { Pokemon3DModel } from './Pokemon3DModel';
import { BattleAnimations3D } from './BattleAnimations3D';
import { BattleEnvironment3D } from './BattleEnvironment3D';
import { BattleAudio3D } from './BattleAudio3D';

interface Skill {
  name: string;
  element: string;
  damage: number;
  energy: number;
}

interface BattleLog {
  message: string;
  type: 'info' | 'attack' | 'damage' | 'heal';
}

const babylonCanvas = ref<HTMLCanvasElement | null>(null);

// Battle state
const playerHP = ref(100);
const playerMaxHP = ref(100);
const opponentHP = ref(100);
const opponentMaxHP = ref(100);
const currentEnergy = ref(3);
const isPlayerTurn = ref(true);
const selectedSkill = ref<Skill | null>(null);
const battleLogs = ref<BattleLog[]>([]);

// Player skills
const playerSkills = ref<Skill[]>([
  { name: 'Flamethrower', element: 'fire', damage: 30, energy: 2 },
  { name: 'Hydro Pump', element: 'water', damage: 35, energy: 3 },
  { name: 'Thunderbolt', element: 'electric', damage: 25, energy: 2 },
  { name: 'Solar Beam', element: 'grass', damage: 40, energy: 4 },
]);

// Babylon.js references
let engine: BABYLON.Engine;
let scene: BABYLON.Scene;
let cameraSystem: BattleCamera3D;
let playerPokemon: Pokemon3DModel;
let opponentPokemon: Pokemon3DModel;
let animationSystem: BattleAnimations3D;
let environmentSystem: BattleEnvironment3D;
let audioSystem: BattleAudio3D;

// Computed properties
const playerHPPercentage = computed(() => (playerHP.value / playerMaxHP.value) * 100);
const opponentHPPercentage = computed(() => (opponentHP.value / opponentMaxHP.value) * 100);

const canUseSkill = (skill: Skill) => {
  return currentEnergy.value >= skill.energy && isPlayerTurn.value;
};

const getSkillIcon = (element: string) => {
  const icons: Record<string, string> = {
    fire: '🔥',
    water: '💧',
    electric: '⚡',
    grass: '🌿',
    ice: '❄️',
    psychic: '🔮',
  };
  return icons[element] || '⭐';
};

onMounted(() => {
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
    cameraSystem.setupCameraStates();
    cameraSystem.transitionToState('battle', 0);

    // Setup environment
    environmentSystem = new BattleEnvironment3D(scene);
    await environmentSystem.createDynamicEnvironment('fire', 'water');

    // Create battle field
    createBattleField();

    // Load Pokemon models
    await loadPokemonModels();

    // Setup animation system
    animationSystem = new BattleAnimations3D(scene);

    // Setup audio system
    audioSystem = new BattleAudio3D();
    await audioSystem.initialize();

    // Start render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle resize
    window.addEventListener('resize', handleResize);

    // Add battle log
    addBattleLog('Battle started!', 'info');
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
};

const loadPokemonModels = async () => {
  // Load player Pokemon (Pikachu)
  playerPokemon = new Pokemon3DModel(scene);
  await playerPokemon.loadPokemon(25, 'electric');
  playerPokemon.setPosition(new BABYLON.Vector3(-6, 1, 0));
  playerPokemon.playIdleAnimation();

  // Load opponent Pokemon (Charizard)
  opponentPokemon = new Pokemon3DModel(scene);
  await opponentPokemon.loadPokemon(6, 'fire');
  opponentPokemon.setPosition(new BABYLON.Vector3(6, 1, 0));
  opponentPokemon.playIdleAnimation();
};

const selectSkill = async (skill: Skill) => {
  if (!canUseSkill(skill)) return;

  selectedSkill.value = skill;
  await executeAttack(skill);
};

const executeAttack = async (skill: Skill) => {
  try {
    // Disable player turn
    isPlayerTurn.value = false;

    // Consume energy
    currentEnergy.value -= skill.energy;

    // Transition camera to attack view
    await cameraSystem.transitionToState('attack', 1000);

    // Play player attack animation
    playerPokemon.playAttackAnimation();

    // Play attack sound
    audioSystem.playSound(`${skill.element}_attack`, playerPokemon.getPosition());

    // Create attack animation
    await animationSystem.createAttackAnimation(playerPokemon, opponentPokemon, skill);

    // Calculate damage
    const damage = skill.damage;
    opponentHP.value = Math.max(0, opponentHP.value - damage);

    // Play opponent hurt animation
    opponentPokemon.playHurtAnimation();

    // Play impact sound
    audioSystem.playSound('impact', opponentPokemon.getPosition());

    // Add battle log
    addBattleLog(`Player used ${skill.name}! Dealt ${damage} damage!`, 'attack');

    // Check if opponent fainted
    if (opponentHP.value <= 0) {
      await handleBattleEnd(true);
      return;
    }

    // Return camera to battle view
    await cameraSystem.transitionToState('battle', 1000);

    // Opponent turn
    await opponentTurn();

    // Regenerate energy
    currentEnergy.value = Math.min(5, currentEnergy.value + 2);

    // Enable player turn
    isPlayerTurn.value = true;
    selectedSkill.value = null;
  } catch (error) {
    console.error('Error executing attack:', error);
    isPlayerTurn.value = true;
  }
};

const opponentTurn = async () => {
  // Simple AI: random skill
  await new Promise(resolve => setTimeout(resolve, 1000));

  const opponentSkill = {
    name: 'Fire Blast',
    element: 'fire',
    damage: 25,
    energy: 2,
  };

  // Transition camera to opponent attack
  await cameraSystem.transitionToState('attack', 1000);

  // Play opponent attack animation
  opponentPokemon.playAttackAnimation();
  audioSystem.playSound(`${opponentSkill.element}_attack`, opponentPokemon.getPosition());

  // Create attack animation
  await animationSystem.createAttackAnimation(opponentPokemon, playerPokemon, opponentSkill);

  // Apply damage
  const damage = opponentSkill.damage;
  playerHP.value = Math.max(0, playerHP.value - damage);

  // Play player hurt animation
  playerPokemon.playHurtAnimation();
  audioSystem.playSound('impact', playerPokemon.getPosition());

  // Add battle log
  addBattleLog(`Opponent used ${opponentSkill.name}! Dealt ${damage} damage!`, 'damage');

  // Check if player fainted
  if (playerHP.value <= 0) {
    await handleBattleEnd(false);
    return;
  }

  // Return camera to battle view
  await cameraSystem.transitionToState('battle', 1000);
};

const handleBattleEnd = async (playerWon: boolean) => {
  if (playerWon) {
    await cameraSystem.transitionToState('victory', 1500);
    playerPokemon.playVictoryAnimation();
    audioSystem.playSound('victory');
    addBattleLog('Player wins!', 'info');
  } else {
    await cameraSystem.transitionToState('defeat', 1500);
    opponentPokemon.playVictoryAnimation();
    audioSystem.playSound('defeat');
    addBattleLog('Player was defeated...', 'info');
  }
};

const addBattleLog = (message: string, type: BattleLog['type']) => {
  battleLogs.value.push({ message, type });
  if (battleLogs.value.length > 5) {
    battleLogs.value.shift();
  }
};

const handleResize = () => {
  engine?.resize();
};

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  audioSystem?.dispose();
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

/* Skill Cards */
.skill-cards {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  z-index: 10;
}

.skill-card {
  width: 120px;
  padding: 15px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%);
  border: 2px solid rgba(148, 163, 184, 0.5);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.skill-card:hover:not(.disabled) {
  transform: translateY(-10px);
  border-color: rgba(59, 130, 246, 0.8);
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
}

.skill-card.selected {
  border-color: #3b82f6;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
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
</style>
```

### 16. Common Issues & Solutions

#### Performance Issues

**Issue**: Low FPS on mobile devices

- **Symptom**: Frame rate drops below 30 FPS, choppy animations
- **Root Cause**: Too many particles, high-resolution textures, complex shaders
- **Solution**:

  ```typescript
  // Detect mobile and adjust quality
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

  if (isMobile) {
    // Reduce particle count
    particleSystem.particleCount = 100; // Instead of 1000

    // Disable shadows
    scene.shadowsEnabled = false;

    // Lower texture resolution
    const textureSize = 512; // Instead of 1024

    // Simplify materials
    material.specularPower = 32; // Instead of 64
  }
  ```

**Issue**: High memory usage leading to crashes

- **Symptom**: Browser tab crashes after extended play
- **Root Cause**: Memory leaks from undisposed resources
- **Solution**:

  ```typescript
  // Proper disposal of resources
  class ResourceManager {
    private disposables: BABYLON.IDisposable[] = [];

    register(resource: BABYLON.IDisposable) {
      this.disposables.push(resource);
    }

    disposeAll() {
      this.disposables.forEach(resource => {
        resource.dispose();
      });
      this.disposables = [];
    }
  }

  // Use texture atlas to reduce memory
  const atlas = new BABYLON.DynamicTexture('atlas', 2048, scene);
  // Combine multiple textures into atlas
  ```

**Issue**: Slow loading times

- **Symptom**: Battle takes more than 5 seconds to start
- **Root Cause**: Synchronous asset loading
- **Solution**:

  ```typescript
  // Async parallel loading
  const loadAssets = async () => {
    const promises = [
      loadPokemonSprite(25),
      loadPokemonSprite(6),
      loadTexture('ground'),
      loadTexture('sky'),
      loadAudio('battle-theme'),
    ];

    await Promise.all(promises);
  };

  // Show loading progress
  const loadWithProgress = async () => {
    let loaded = 0;
    const total = assets.length;

    for (const asset of assets) {
      await loadAsset(asset);
      loaded++;
      updateLoadingBar((loaded / total) * 100);
    }
  };
  ```

#### Visual Issues

**Issue**: Flickering textures or z-fighting

- **Symptom**: Textures appear to flash or flicker
- **Root Cause**: Near/far plane clipping issues or overlapping meshes
- **Solution**:

  ```typescript
  // Adjust camera clipping planes
  camera.minZ = 0.1;
  camera.maxZ = 1000;

  // Enable antialiasing
  engine.setHardwareScalingLevel(1 / window.devicePixelRatio);

  // Separate overlapping meshes
  mesh1.position.y += 0.01; // Slight offset
  ```

**Issue**: Particle effects not visible

- **Symptom**: Attack animations show no particles
- **Root Cause**: Incorrect emitter position or texture not loaded
- **Solution**:

  ```typescript
  // Ensure texture is loaded
  await particleTexture.whenAllReady();

  // Verify emitter position
  particleSystem.emitter = pokemonMesh.position.clone();

  // Check particle system is started
  particleSystem.start();

  // Verify particle count
  console.log('Active particles:', particleSystem.getActiveCount());
  ```

**Issue**: Dark or poorly lit scene

- **Symptom**: Models appear too dark to see details
- **Root Cause**: Insufficient or incorrect lighting
- **Solution**:

  ```typescript
  // Add multiple light sources
  const mainLight = new BABYLON.HemisphericLight('main', new BABYLON.Vector3(0, 1, 0), scene);
  mainLight.intensity = 1.2;

  // Add directional light for shadows
  const dirLight = new BABYLON.DirectionalLight('dir', new BABYLON.Vector3(-1, -2, -1), scene);
  dirLight.intensity = 0.5;

  // Add ambient color
  scene.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.3);
  ```

#### Audio Issues

**Issue**: Spatial audio not working

- **Symptom**: All sounds play at same volume regardless of distance
- **Root Cause**: AudioContext not initialized properly
- **Solution**:

  ```typescript
  // Request audio permission and resume context
  const initAudio = async () => {
    try {
      // Resume audio context
      await audioContext.resume();

      // Verify state
      console.log('AudioContext state:', audioContext.state);

      // Setup spatial audio
      const panner = audioContext.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'exponential';
      panner.refDistance = 1;
      panner.maxDistance = 10000;
      panner.rolloffFactor = 1;

      return panner;
    } catch (error) {
      console.error('Audio initialization failed:', error);
    }
  };
  ```

**Issue**: Audio clicks or pops

- **Symptom**: Audible artifacts when playing sounds
- **Root Cause**: Audio buffer issues or improper fade in/out
- **Solution**:

  ```typescript
  // Add fade in/out
  const playWithFade = (buffer: AudioBuffer, duration: number = 0.1) => {
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Fade in
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + duration);

    // Fade out before end
    const fadeOutStart = buffer.duration - duration;
    gainNode.gain.setValueAtTime(1, audioContext.currentTime + fadeOutStart);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + buffer.duration);

    source.start();
  };
  ```

#### Input Issues

**Issue**: Touch controls not responsive on mobile

- **Symptom**: Skill cards don't respond to taps
- **Root Cause**: Touch events not properly handled
- **Solution**:

  ```typescript
  // Add touch event listeners
  const setupTouchControls = () => {
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
  };

  const handleTouchStart = (event: TouchEvent) => {
    event.preventDefault();
    const touch = event.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Handle touch input
    checkSkillCardTouch(x, y);
  };
  ```

**Issue**: Camera controls feel sluggish

- **Symptom**: Delayed or unresponsive camera movement
- **Root Cause**: Input throttling or performance issues
- **Solution**:

  ```typescript
  // Optimize camera controls
  camera.inertia = 0.5; // Reduce inertia for snappier feel
  camera.angularSensibilityX = 1000;
  camera.angularSensibilityY = 1000;
  camera.wheelPrecision = 50;

  // Use requestAnimationFrame for smooth updates
  const updateCamera = () => {
    if (isDragging) {
      camera.alpha += deltaX * 0.01;
      camera.beta += deltaY * 0.01;
    }
    requestAnimationFrame(updateCamera);
  };
  ```

### 17. Best Practices & Guidelines

#### Code Organization

**Separation of Concerns**

```typescript
// ❌ Bad: Everything in one file
class BattleArena {
  render() {
    /* rendering logic */
  }
  updateGameState() {
    /* game logic */
  }
  handleInput() {
    /* input logic */
  }
  playAudio() {
    /* audio logic */
  }
}

// ✅ Good: Separated responsibilities
class BattleRenderer {
  render(scene: Scene) {
    /* rendering only */
  }
}

class BattleGameLogic {
  update(deltaTime: number) {
    /* game logic only */
  }
}

class BattleInputHandler {
  handleInput(event: InputEvent) {
    /* input only */
  }
}

class BattleAudioManager {
  playSound(soundName: string) {
    /* audio only */
  }
}
```

**Component Reusability**

```typescript
// ✅ Create reusable particle system factory
class ParticleSystemFactory {
  static createFireEffect(scene: Scene, emitter: Vector3): ParticleSystem {
    const system = new BABYLON.ParticleSystem('fire', 500, scene);
    system.particleTexture = new BABYLON.Texture('/textures/fire.png', scene);
    system.emitter = emitter;
    // ... configure fire effect
    return system;
  }

  static createWaterEffect(scene: Scene, emitter: Vector3): ParticleSystem {
    // ... similar pattern
  }
}

// Usage
const fireEffect = ParticleSystemFactory.createFireEffect(scene, position);
```

**Type Safety**

```typescript
// ✅ Use TypeScript interfaces and types
interface PokemonData {
  id: number;
  name: string;
  type: PokemonType;
  hp: number;
  attack: number;
  defense: number;
}

type PokemonType = 'fire' | 'water' | 'grass' | 'electric' | 'psychic';
type BattlePhase = 'preparation' | 'attack' | 'defense' | 'victory' | 'defeat';

// Function with proper types
const createPokemon = (data: PokemonData): Pokemon3DModel => {
  // Type-safe implementation
};
```

**Error Handling**

```typescript
// ✅ Comprehensive error handling
const loadPokemonModel = async (pokemonId: number): Promise<Pokemon3DModel> => {
  try {
    const data = await pokeAPI.getPokemonByName(pokemonId);
    return new Pokemon3DModel(data);
  } catch (error) {
    if (error instanceof NetworkError) {
      console.error('Network error loading Pokemon:', error.message);
      throw new Error('Failed to load Pokemon due to network issues');
    } else if (error instanceof NotFoundError) {
      console.error('Pokemon not found:', pokemonId);
      throw new Error(`Pokemon with ID ${pokemonId} does not exist`);
    } else {
      console.error('Unexpected error:', error);
      throw new Error('An unexpected error occurred while loading Pokemon');
    }
  }
};
```

#### Performance Guidelines

**Lazy Loading**

```typescript
// ✅ Load assets only when needed
class AssetManager {
  private loadedAssets = new Map<string, any>();

  async loadWhenNeeded(assetName: string): Promise<any> {
    if (this.loadedAssets.has(assetName)) {
      return this.loadedAssets.get(assetName);
    }

    const asset = await this.loadAsset(assetName);
    this.loadedAssets.set(assetName, asset);
    return asset;
  }
}
```

**Object Pooling**

```typescript
// ✅ Reuse particle systems instead of creating new ones
class ParticlePool {
  private pool: ParticleSystem[] = [];
  private active: Set<ParticleSystem> = new Set();

  acquire(): ParticleSystem {
    let system = this.pool.pop();
    if (!system) {
      system = this.createNew();
    }
    this.active.add(system);
    return system;
  }

  release(system: ParticleSystem) {
    system.stop();
    this.active.delete(system);
    this.pool.push(system);
  }
}
```

**Event Throttling**

```typescript
// ✅ Throttle expensive operations
const throttle = (func: Function, delay: number) => {
  let lastCall = 0;
  return (...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// Usage
const handleCameraMove = throttle((x: number, y: number) => {
  updateCamera(x, y);
}, 16); // ~60 FPS
```

**Memory Management**

```typescript
// ✅ Dispose resources immediately
class ResourceTracker {
  private resources: BABYLON.IDisposable[] = [];

  track<T extends BABYLON.IDisposable>(resource: T): T {
    this.resources.push(resource);
    return resource;
  }

  disposeAll() {
    this.resources.forEach(r => r.dispose());
    this.resources = [];
  }
}

// Usage
const tracker = new ResourceTracker();
const mesh = tracker.track(BABYLON.MeshBuilder.CreateBox('box', {}, scene));
// Later: tracker.disposeAll();
```

#### Visual Design

**Consistent Style**

```typescript
// ✅ Define and use consistent color palette
const COLORS = {
  fire: new BABYLON.Color3(1, 0.4, 0),
  water: new BABYLON.Color3(0.2, 0.6, 1),
  grass: new BABYLON.Color3(0.3, 0.8, 0.3),
  electric: new BABYLON.Color3(1, 0.9, 0.2),

  ui: {
    primary: new BABYLON.Color3(0.23, 0.51, 0.96),
    secondary: new BABYLON.Color3(0.61, 0.65, 0.73),
    success: new BABYLON.Color3(0.27, 0.77, 0.33),
    danger: new BABYLON.Color3(0.94, 0.27, 0.27),
  },
};

// Apply consistently
const createTypeMaterial = (type: PokemonType) => {
  const material = new BABYLON.StandardMaterial(`${type}Mat`, scene);
  material.diffuseColor = COLORS[type];
  return material;
};
```

**Animation Timing**

```typescript
// ✅ Use standard easing functions
const EASING = {
  easeInOut: BABYLON.EasingFunction.EASINGMODE_EASEINOUT,
  easeOut: BABYLON.EasingFunction.EASINGMODE_EASEOUT,

  // Custom cubic bezier
  cubicBezier: new BABYLON.BezierCurveEase(0.42, 0, 0.58, 1),
};

// Standard animation durations
const DURATION = {
  fast: 300, // Quick UI responses
  normal: 500, // Standard transitions
  slow: 1000, // Dramatic effects
  epic: 2000, // Victory/defeat sequences
};
```

**Feedback Loops**

```typescript
// ✅ Provide immediate visual feedback
const provideVisualFeedback = (action: string) => {
  switch (action) {
    case 'attack':
      // Flash effect
      flashScreen(0.2, 100);
      // Camera shake
      shakeCamera(5, 200);
      // Particle burst
      createImpactParticles();
      break;

    case 'heal':
      // Green glow
      glowEffect(COLORS.ui.success, 500);
      // Floating particles
      createHealingParticles();
      break;
  }
};
```

#### Accessibility

**Keyboard Support**

```typescript
// ✅ Full keyboard navigation
const setupKeyboardControls = () => {
  document.addEventListener('keydown', event => {
    switch (event.key) {
      case '1':
      case '2':
      case '3':
      case '4':
        selectSkill(parseInt(event.key) - 1);
        break;
      case 'Enter':
      case ' ':
        confirmSelection();
        break;
      case 'Escape':
        cancelAction();
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        navigateMenu(event.key);
        break;
    }
  });
};
```

**Screen Reader Support**

```vue
<!-- ✅ Add ARIA labels -->
<template>
  <div class="battle-arena" role="application" aria-label="Pokemon Battle Arena">
    <div
      class="hp-bar"
      role="progressbar"
      :aria-valuenow="playerHP"
      aria-valuemin="0"
      :aria-valuemax="playerMaxHP"
      aria-label="Player HP"
    >
      <div class="hp-fill" :style="{ width: playerHPPercentage + '%' }"></div>
    </div>

    <button
      v-for="skill in skills"
      :key="skill.name"
      :aria-label="`Use ${skill.name}. Costs ${skill.energy} energy. Deals ${skill.damage} damage`"
      @click="useSkill(skill)"
    >
      {{ skill.name }}
    </button>
  </div>
</template>
```

**Reduced Motion**

```typescript
// ✅ Respect user preferences
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const createAnimation = (duration: number) => {
  // Reduce or disable animations if user prefers
  const actualDuration = prefersReducedMotion ? 0 : duration;

  return BABYLON.Animation.CreateAndStartAnimation(
    'anim',
    mesh,
    'position.y',
    60,
    actualDuration / 16.67, // Convert ms to frames
    startValue,
    endValue,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
};
```

### 18. Dependencies & Requirements

#### Required Packages

```json
{
  "name": "pokemon-battle-3d",
  "version": "1.0.0",
  "dependencies": {
    "@babylonjs/core": "^8.32.2",
    "@babylonjs/loaders": "^8.32.2",
    "@babylonjs/materials": "^8.32.2",
    "@babylonjs/gui": "^8.32.2",
    "vue": "^3.5.22",
    "pinia": "^3.0.3",
    "vue-router": "^4.0.0",
    "axios": "^1.12.2"
  },
  "devDependencies": {
    "@types/node": "^24.9.1",
    "@vitejs/plugin-vue": "^6.0.1",
    "typescript": "^5.9.3",
    "vite": "^7.1.7",
    "vitest": "^2.0.0",
    "@vue/test-utils": "^2.4.0"
  }
}
```

#### Browser Requirements

**Desktop Browsers**:

- Chrome 80+ ✅ Full WebGL 2.0 support
- Firefox 75+ ✅ Full WebGL 2.0 support
- Safari 13+ ⚠️ WebGL 2.0 with some limitations
- Edge 80+ ✅ Full WebGL 2.0 support

**Required APIs**:

- WebGL 2.0: Required for advanced rendering features
- Web Audio API: Required for spatial audio
- Canvas API: Required for rendering
- ES6+ Support: Required for modern JavaScript features
- WebAssembly: Optional, improves performance

**Feature Detection**:

```typescript
const checkBrowserSupport = () => {
  const support = {
    webgl2: !!document.createElement('canvas').getContext('webgl2'),
    webAudio: !!(window.AudioContext || (window as any).webkitAudioContext),
    es6: typeof Symbol !== 'undefined',
    webAssembly: typeof WebAssembly !== 'undefined',
  };

  const allSupported = Object.values(support).every(Boolean);

  if (!allSupported) {
    console.warn('Browser support check:', support);
    showCompatibilityWarning();
  }

  return allSupported;
};
```

#### Development Tools

**Recommended VSCode Extensions**:

- Vue Language Features (Volar)
- TypeScript Vue Plugin (Volar)
- ESLint
- Prettier
- Babylon.js Viewer

**Development Commands**:

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Type check
npm run type-check

# Lint code
npm run lint
```

**Performance Monitoring**:

```typescript
// Use Babylon.js Inspector
scene.debugLayer.show({
  embedMode: true,
});

// Monitor FPS
const fpsMonitor = new BABYLON.PerformanceMonitor();
fpsMonitor.enable();

// Track memory
if (performance.memory) {
  console.log('Used:', (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2), 'MB');
  console.log('Total:', (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2), 'MB');
}
```

## Conclusion

The proposed 3D battle system enhancement will transform the current static 2D interface into an immersive, cinematic experience that significantly increases player engagement. By leveraging Babylon.js's powerful 3D capabilities, we can create dynamic environments, spectacular attack animations, and responsive camera work that makes every battle feel unique and exciting.

The modular architecture ensures maintainability while the performance optimization strategies guarantee smooth operation across all target devices. The enhanced visual and audio feedback will create a more satisfying gameplay experience that encourages longer play sessions and increased player retention.

With comprehensive testing strategies, detailed implementation examples, and thorough troubleshooting guides, this document provides everything needed to successfully implement a production-ready 3D battle system that will elevate the game to the next level.
