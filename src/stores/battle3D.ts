import { defineStore } from 'pinia';

export type BattlePhase = 'preparation' | 'attack' | 'defense' | 'victory' | 'defeat';
export type CameraState = 'battle' | 'attack' | 'critical' | 'victory' | 'defeat';
export type EnvironmentType = 'neutral' | 'fire' | 'water' | 'grass' | 'electric' | 'psychic';
export type PerformanceLevel = 'high' | 'medium' | 'low';

interface Battle3DState {
  currentPhase: BattlePhase;
  cameraState: CameraState;
  environmentType: EnvironmentType;
  battleIntensity: number;
  performanceLevel: PerformanceLevel;
  audioEnabled: boolean;
  effectsEnabled: boolean;
  reducedMotion: boolean;
}

export const useBattle3DStore = defineStore('battle3D', {
  state: (): Battle3DState => ({
    currentPhase: 'preparation',
    cameraState: 'battle',
    environmentType: 'neutral',
    battleIntensity: 0,
    performanceLevel: 'high',
    audioEnabled: true,
    effectsEnabled: true,
    reducedMotion: false,
  }),

  getters: {
    isBattleActive: (state) => 
      state.currentPhase !== 'victory' && state.currentPhase !== 'defeat',
    
    shouldUseHighQuality: (state) => 
      state.performanceLevel === 'high' && state.effectsEnabled,
    
    particleCount: (state) => {
      switch (state.performanceLevel) {
        case 'high': return 1000;
        case 'medium': return 500;
        case 'low': return 100;
        default: return 500;
      }
    },
  },

  actions: {
    transitionToPhase(phase: BattlePhase) {
      this.currentPhase = phase;
      
      // Update camera state based on phase
      switch (phase) {
        case 'attack':
          this.cameraState = 'attack';
          this.battleIntensity = 0.5;
          break;
        case 'victory':
          this.cameraState = 'victory';
          this.battleIntensity = 0;
          break;
        case 'defeat':
          this.cameraState = 'defeat';
          this.battleIntensity = 0;
          break;
        default:
          this.cameraState = 'battle';
          this.battleIntensity = 0.3;
      }
    },

    updateCameraState(state: CameraState) {
      this.cameraState = state;
    },

    changeEnvironment(type: EnvironmentType) {
      this.environmentType = type;
    },

    adjustPerformanceLevel(level: PerformanceLevel) {
      this.performanceLevel = level;
    },

    toggleAudio() {
      this.audioEnabled = !this.audioEnabled;
    },

    toggleEffects() {
      this.effectsEnabled = !this.effectsEnabled;
    },

    setReducedMotion(value: boolean) {
      this.reducedMotion = value;
    },

    detectOptimalPerformance() {
      // Check if mobile device
      const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
      
      // Check device pixel ratio
      const pixelRatio = window.devicePixelRatio || 1;
      
      // Check available memory (if API available)
      const memory = (performance as any).memory;
      const hasLowMemory = memory && memory.totalJSHeapSize > 1073741824; // > 1GB
      
      if (isMobile) {
        this.performanceLevel = 'low';
      } else if (pixelRatio > 2 || hasLowMemory) {
        this.performanceLevel = 'medium';
      } else {
        this.performanceLevel = 'high';
      }
      
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.reducedMotion = prefersReducedMotion;
    },
  },
});