import { Howl, Howler } from 'howler';

export interface SoundConfig {
  src: string[];
  volume?: number;
  loop?: boolean;
  preload?: boolean;
}

class SoundService {
  private sounds: Map<string, Howl> = new Map();
  private enabled: boolean = true;
  private masterVolume: number = 0.7;

  constructor() {
    // Load enabled state from localStorage
    const savedEnabled = localStorage.getItem('soundEnabled');
    if (savedEnabled !== null) {
      this.enabled = savedEnabled === 'true';
    }

    const savedVolume = localStorage.getItem('masterVolume');
    if (savedVolume !== null) {
      this.masterVolume = parseFloat(savedVolume);
      Howler.volume(this.masterVolume);
    }
  }

  /**
   * Register a new sound
   */
  register(name: string, config: SoundConfig): void {
    if (this.sounds.has(name)) {
      this.sounds.get(name)?.unload();
    }

    const sound = new Howl({
      src: config.src,
      volume: config.volume ?? 1,
      loop: config.loop ?? false,
      preload: config.preload ?? true,
      html5: true, // Use HTML5 Audio for better performance
    });

    this.sounds.set(name, sound);
  }

  /**
   * Play a sound by name
   */
  play(name: string, volume?: number): number | undefined {
    if (!this.enabled) return;

    const sound = this.sounds.get(name);
    if (!sound) {
      console.warn(`Sound "${name}" not found`);
      return;
    }

    if (volume !== undefined) {
      sound.volume(volume);
    }

    return sound.play();
  }

  /**
   * Stop a sound by name
   */
  stop(name: string): void {
    const sound = this.sounds.get(name);
    if (sound) {
      sound.stop();
    }
  }

  /**
   * Stop all sounds
   */
  stopAll(): void {
    this.sounds.forEach(sound => sound.stop());
  }

  /**
   * Fade in a sound
   */
  fadeIn(name: string, duration: number = 1000, to: number = 1): number | undefined {
    if (!this.enabled) return;

    const sound = this.sounds.get(name);
    if (!sound) return;

    const id = sound.play();
    sound.fade(0, to, duration, id);
    return id;
  }

  /**
   * Fade out a sound
   */
  fadeOut(name: string, duration: number = 1000, id?: number): void {
    const sound = this.sounds.get(name);
    if (!sound) return;

    sound.fade(sound.volume(), 0, duration, id);
    sound.once('fade', () => {
      sound.stop(id);
    });
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.masterVolume);
    localStorage.setItem('masterVolume', this.masterVolume.toString());
  }

  /**
   * Get master volume
   */
  getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * Toggle sound on/off
   */
  toggleEnabled(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem('soundEnabled', this.enabled.toString());
    
    if (!this.enabled) {
      this.stopAll();
    }
    
    return this.enabled;
  }

  /**
   * Check if sound is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set sound enabled state
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    localStorage.setItem('soundEnabled', enabled.toString());
    
    if (!enabled) {
      this.stopAll();
    }
  }

  /**
   * Preload all sounds
   */
  preloadAll(): Promise<void> {
    const promises: Promise<void>[] = [];
    
    this.sounds.forEach((sound, name) => {
      if (sound.state() === 'unloaded') {
        promises.push(
          new Promise((resolve, reject) => {
            sound.once('load', () => resolve());
            sound.once('loaderror', () => reject(new Error(`Failed to load sound: ${name}`)));
            sound.load();
          })
        );
      }
    });

    return Promise.all(promises).then(() => undefined);
  }

  /**
   * Unload all sounds and clear memory
   */
  dispose(): void {
    this.sounds.forEach(sound => sound.unload());
    this.sounds.clear();
  }
}

// Create singleton instance
export const soundService = new SoundService();

// Register common game sounds
export function registerGameSounds(): void {
  // Card pack sounds
  soundService.register('pack-shuffle', {
    src: ['/sounds/card-shuffle.mp3', '/sounds/card-shuffle.ogg'],
    volume: 0.6,
  });

  soundService.register('pack-open', {
    src: ['/sounds/pack-open.mp3', '/sounds/pack-open.ogg'],
    volume: 0.8,
  });

  soundService.register('card-reveal', {
    src: ['/sounds/card-reveal.mp3', '/sounds/card-reveal.ogg'],
    volume: 0.7,
  });

  soundService.register('card-flip', {
    src: ['/sounds/card-flip.mp3', '/sounds/card-flip.ogg'],
    volume: 0.5,
  });

  soundService.register('legendary-reveal', {
    src: ['/sounds/legendary-reveal.mp3', '/sounds/legendary-reveal.ogg'],
    volume: 0.9,
  });

  soundService.register('coins-spend', {
    src: ['/sounds/coins-spend.mp3', '/sounds/coins-spend.ogg'],
    volume: 0.6,
  });

  // UI sounds
  soundService.register('button-click', {
    src: ['/sounds/button-click.mp3', '/sounds/button-click.ogg'],
    volume: 0.4,
  });

  soundService.register('success', {
    src: ['/sounds/success.mp3', '/sounds/success.ogg'],
    volume: 0.5,
  });

  soundService.register('error', {
    src: ['/sounds/error.mp3', '/sounds/error.ogg'],
    volume: 0.5,
  });

  // Battle sounds
  soundService.register('battle-start', {
    src: ['/sounds/battle-start.mp3', '/sounds/battle-start.ogg'],
    volume: 0.7,
  });

  soundService.register('attack-hit', {
    src: ['/sounds/attack-hit.mp3', '/sounds/attack-hit.ogg'],
    volume: 0.6,
  });

  soundService.register('pokemon-faint', {
    src: ['/sounds/pokemon-faint.mp3', '/sounds/pokemon-faint.ogg'],
    volume: 0.7,
  });

  // Skill element sounds
  soundService.register('skill-fire', {
    src: ['/sounds/skill-fire.mp3', '/sounds/skill-fire.ogg'],
    volume: 0.7,
  });

  soundService.register('skill-water', {
    src: ['/sounds/skill-water.mp3', '/sounds/skill-water.ogg'],
    volume: 0.6,
  });

  soundService.register('skill-grass', {
    src: ['/sounds/skill-grass.mp3', '/sounds/skill-grass.ogg'],
    volume: 0.6,
  });

  soundService.register('skill-electric', {
    src: ['/sounds/skill-electric.mp3', '/sounds/skill-electric.ogg'],
    volume: 0.7,
  });

  soundService.register('skill-psychic', {
    src: ['/sounds/skill-psychic.mp3', '/sounds/skill-psychic.ogg'],
    volume: 0.6,
  });

  soundService.register('skill-ice', {
    src: ['/sounds/skill-ice.mp3', '/sounds/skill-ice.ogg'],
    volume: 0.6,
  });

  soundService.register('skill-dragon', {
    src: ['/sounds/skill-dragon.mp3', '/sounds/skill-dragon.ogg'],
    volume: 0.7,
  });

  soundService.register('skill-dark', {
    src: ['/sounds/skill-dark.mp3', '/sounds/skill-dark.ogg'],
    volume: 0.6,
  });

  soundService.register('skill-fairy', {
    src: ['/sounds/skill-fairy.mp3', '/sounds/skill-fairy.ogg'],
    volume: 0.6,
  });

  soundService.register('skill-fighting', {
    src: ['/sounds/skill-fighting.mp3', '/sounds/skill-fighting.ogg'],
    volume: 0.7,
  });

  soundService.register('skill-poison', {
    src: ['/sounds/skill-poison.mp3', '/sounds/skill-poison.ogg'],
    volume: 0.6,
  });

  soundService.register('skill-ground', {
    src: ['/sounds/skill-ground.mp3', '/sounds/skill-ground.ogg'],
    volume: 0.7,
  });

  soundService.register('skill-flying', {
    src: ['/sounds/skill-flying.mp3', '/sounds/skill-flying.ogg'],
    volume: 0.6,
  });

  soundService.register('skill-bug', {
    src: ['/sounds/skill-bug.mp3', '/sounds/skill-bug.ogg'],
    volume: 0.5,
  });

  soundService.register('skill-rock', {
    src: ['/sounds/skill-rock.mp3', '/sounds/skill-rock.ogg'],
    volume: 0.7,
  });

  soundService.register('skill-ghost', {
    src: ['/sounds/skill-ghost.mp3', '/sounds/skill-ghost.ogg'],
    volume: 0.6,
  });

  soundService.register('skill-steel', {
    src: ['/sounds/skill-steel.mp3', '/sounds/skill-steel.ogg'],
    volume: 0.7,
  });

  soundService.register('skill-normal', {
    src: ['/sounds/skill-normal.mp3', '/sounds/skill-normal.ogg'],
    volume: 0.6,
  });

  // Background music
  soundService.register('shop-music', {
    src: ['/sounds/shop-music.mp3', '/sounds/shop-music.ogg'],
    volume: 0.3,
    loop: true,
  });
}

export default soundService;