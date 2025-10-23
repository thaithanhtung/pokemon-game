import { ref, onMounted, onUnmounted, Ref } from 'vue';
import { BabylonCardAnimation } from '@/utils/babylon-card-animations';
import { Card } from '@/types';
import { Vector3 } from '@babylonjs/core';

export interface UseBabylonCardOptions {
  enableHover?: boolean;
  enableFlip?: boolean;
  holographic?: boolean;
  autoRotate?: boolean;
  rotationSpeed?: number;
}

export function useBabylonCard(
  containerRef: Ref<HTMLElement | null>,
  card: Ref<Card>,
  options: UseBabylonCardOptions = {}
) {
  const babylonAnimation = ref<BabylonCardAnimation | null>(null);
  const isLoading = ref(true);
  const error = ref<Error | null>(null);

  const {
    enableHover = true,
    enableFlip = true,
    holographic = false,
    autoRotate = false,
    rotationSpeed = 0.01,
  } = options;

  const initBabylon = async () => {
    if (!containerRef.value) return;

    try {
      isLoading.value = true;
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      containerRef.value.appendChild(canvas);

      // Initialize Babylon
      babylonAnimation.value = new BabylonCardAnimation(canvas);
      
      // Create card mesh
      const mesh = babylonAnimation.value.createCardMesh(card.value, {
        holographic: holographic || card.value.name?.toLowerCase().includes('mega'),
        rarity: card.value.rarity,
      });

      // Add animations
      if (enableHover) {
        babylonAnimation.value.addHoverEffect(mesh);
      }
      
      if (enableFlip) {
        babylonAnimation.value.addFlipAnimation(mesh);
      }

      // Auto rotate
      if (autoRotate && babylonAnimation.value) {
        const scene = babylonAnimation.value['scene'];
        scene.registerBeforeRender(() => {
          mesh.rotation.y += rotationSpeed;
        });
      }

      isLoading.value = false;
    } catch (err) {
      console.error('Failed to initialize Babylon card:', err);
      error.value = err as Error;
      isLoading.value = false;
    }
  };

  const triggerAttack = (targetPosition?: { x: number; y: number; z: number }) => {
    if (!babylonAnimation.value || !babylonAnimation.value['cardMesh']) return;
    
    const target = targetPosition 
      ? new Vector3(targetPosition.x, targetPosition.y, targetPosition.z)
      : new Vector3(2, 0, 0);
    
    babylonAnimation.value.addAttackAnimation(babylonAnimation.value['cardMesh'], target);
  };

  const updateCard = (newCard: Card) => {
    if (!babylonAnimation.value) return;
    
    babylonAnimation.value.createCardMesh(newCard, {
      holographic: holographic || newCard.name?.toLowerCase().includes('mega'),
      rarity: newCard.rarity,
    });
  };

  const dispose = () => {
    if (babylonAnimation.value) {
      babylonAnimation.value.dispose();
      babylonAnimation.value = null;
    }
  };

  onMounted(() => {
    initBabylon();
  });

  onUnmounted(() => {
    dispose();
  });

  return {
    babylonAnimation,
    isLoading,
    error,
    triggerAttack,
    updateCard,
    dispose,
  };
}