import { ref, computed } from 'vue';
import soundService from '@/services/soundService';

export function useSound() {
  const enabled = ref(soundService.isEnabled());
  const masterVolume = ref(soundService.getMasterVolume());

  const play = (name: string, volume?: number) => {
    return soundService.play(name, volume);
  };

  const stop = (name: string) => {
    soundService.stop(name);
  };

  const fadeIn = (name: string, duration?: number, to?: number) => {
    return soundService.fadeIn(name, duration, to);
  };

  const fadeOut = (name: string, duration?: number, id?: number) => {
    soundService.fadeOut(name, duration, id);
  };

  const toggleSound = () => {
    enabled.value = soundService.toggleEnabled();
    return enabled.value;
  };

  const setEnabled = (value: boolean) => {
    soundService.setEnabled(value);
    enabled.value = value;
  };

  const setMasterVolume = (volume: number) => {
    soundService.setMasterVolume(volume);
    masterVolume.value = volume;
  };

  // Special sound sequences for card packs
  const playPackOpenSequence = async (packType: 'basic' | 'premium' | 'legendary' = 'basic') => {
    // Play shuffle sound
    play('pack-shuffle');
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Play open sound
    play('pack-open');
    
    // Return a function to play reveal sounds for each card (optional - not used in shop)
    return (cardRarity: string, index: number) => {
      setTimeout(() => {
        if (cardRarity === 'L' || cardRarity === 'E') {
          play('legendary-reveal');
        } else {
          play('card-reveal');
        }
      }, index * 200); // Stagger the reveal sounds
    };
  };

  const playCardFlip = () => {
    play('card-flip');
  };

  const playPurchase = () => {
    play('coins-spend');
  };

  const playSuccess = () => {
    play('success');
  };

  const playError = () => {
    play('error');
  };

  const playButtonClick = () => {
    play('button-click');
  };

  return {
    // State
    enabled: computed(() => enabled.value),
    masterVolume: computed(() => masterVolume.value),
    
    // Core functions
    play,
    stop,
    fadeIn,
    fadeOut,
    toggleSound,
    setEnabled,
    setMasterVolume,
    
    // Convenience functions
    playPackOpenSequence,
    playCardFlip,
    playPurchase,
    playSuccess,
    playError,
    playButtonClick,
  };
}