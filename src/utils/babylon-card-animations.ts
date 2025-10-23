import { 
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  Color3,
  Color4,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  Texture,
  DynamicTexture,
  GlowLayer,
  ParticleSystem,
  Animation,
  QuadraticEase,
  EasingFunction
} from '@babylonjs/core';
import { Card } from '@/types';

export interface CardMeshOptions {
  width?: number;
  height?: number;
  depth?: number;
  cornerRadius?: number;
  holographic?: boolean;
  rarity?: 'C' | 'R' | 'E' | 'L';
}

export class BabylonCardAnimation {
  private engine: Engine;
  private scene: Scene;
  private camera: ArcRotateCamera;
  private canvas: HTMLCanvasElement;
  private cardMesh: Mesh | null = null;
  private glowLayer: GlowLayer;
  private particleSystem: ParticleSystem | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
    });

    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0, 0, 0, 0);

    // Setup camera
    this.camera = new ArcRotateCamera(
      'camera',
      0,
      Math.PI / 2,
      5,
      Vector3.Zero(),
      this.scene
    );
    this.camera.attachControl(canvas, true);
    this.camera.lowerRadiusLimit = 3;
    this.camera.upperRadiusLimit = 8;

    // Setup lighting
    const light = new HemisphericLight(
      'light',
      new Vector3(0, 1, 0),
      this.scene
    );
    light.intensity = 1.2;

    // Add ambient light
    this.scene.ambientColor = new Color3(0.3, 0.3, 0.3);

    // Setup glow layer for special effects
    this.glowLayer = new GlowLayer('glow', this.scene);
    this.glowLayer.intensity = 0.5;

    // Start render loop
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    // Handle resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  public createCardMesh(card: Card, options: CardMeshOptions = {}): Mesh {
    const {
      width = 2.5,
      height = 3.5,
      depth = 0.05,
      cornerRadius = 0.1,
      holographic = false,
      rarity = card.rarity || 'C',
    } = options;

    // Remove existing card mesh if any
    if (this.cardMesh) {
      this.cardMesh.dispose();
    }

    // Create rounded rectangle card shape
    const cardMesh = this.createRoundedCard(width, height, depth, cornerRadius);
    this.cardMesh = cardMesh;

    // Create material based on rarity
    const material = this.createCardMaterial(card, rarity, holographic);
    cardMesh.material = material;

    // Add glow effect for higher rarities
    if (rarity === 'E' || rarity === 'L') {
      this.glowLayer.addIncludedOnlyMesh(cardMesh);
      this.glowLayer.intensity = rarity === 'L' ? 1 : 0.7;
    }

    // Add particle effects for legendary cards
    if (rarity === 'L' || card.name?.toLowerCase().includes('mega')) {
      this.addParticleEffects(cardMesh, card);
    }

    return cardMesh;
  }

  private createRoundedCard(
    width: number,
    height: number,
    depth: number,
    cornerRadius: number
  ): Mesh {
    // Create a box as base
    const card = MeshBuilder.CreateBox(
      'card',
      { width, height, depth },
      this.scene
    );

    // Add slight bevel to edges
    card.edgesWidth = 4.0;
    card.edgesColor = new Color4(1, 1, 1, 0.2);

    return card;
  }

  private createCardMaterial(
    card: Card,
    rarity: string,
    holographic: boolean
  ): PBRMaterial {
    const material = new PBRMaterial('cardMaterial', this.scene);

    // Base color based on rarity
    const rarityColors = {
      C: new Color3(0.5, 0.5, 0.5),
      R: new Color3(0.2, 0.4, 0.8),
      E: new Color3(0.6, 0.2, 0.8),
      L: new Color3(1, 0.6, 0.2),
    };

    material.albedoColor = rarityColors[rarity] || rarityColors.C;
    material.metallic = holographic ? 0.8 : 0.3;
    material.roughness = holographic ? 0.2 : 0.5;

    // Add card texture if available
    if (card.image) {
      const texture = new Texture(card.image, this.scene);
      material.albedoTexture = texture;
    }

    // Add emissive for glow effect
    if (rarity === 'E' || rarity === 'L') {
      material.emissiveColor = rarityColors[rarity];
      material.emissiveIntensity = 0.3;
    }

    // Holographic effect
    if (holographic || card.name?.toLowerCase().includes('mega')) {
      this.addHolographicEffect(material);
    }

    return material;
  }

  private addHolographicEffect(material: PBRMaterial): void {
    // Create iridescent effect
    material.metallic = 0.9;
    material.roughness = 0.1;
    
    // Add rainbow reflection
    const rainbowTexture = this.createRainbowTexture();
    material.reflectionTexture = rainbowTexture;
    material.reflectionTexture.coordinatesMode = Texture.SPHERICAL_MODE;
    
    // Animate the reflection
    this.scene.registerBeforeRender(() => {
      if (material.reflectionTexture) {
        material.reflectionTexture.uOffset += 0.002;
      }
    });
  }

  private createRainbowTexture(): DynamicTexture {
    const texture = new DynamicTexture(
      'rainbowTexture',
      { width: 512, height: 512 },
      this.scene
    );
    
    const context = texture.getContext();
    const gradient = context.createLinearGradient(0, 0, 512, 512);
    
    // Rainbow colors
    gradient.addColorStop(0, '#ff0080');
    gradient.addColorStop(0.14, '#ff8c00');
    gradient.addColorStop(0.28, '#ffd700');
    gradient.addColorStop(0.42, '#00ff00');
    gradient.addColorStop(0.56, '#00ffff');
    gradient.addColorStop(0.70, '#0080ff');
    gradient.addColorStop(0.84, '#8000ff');
    gradient.addColorStop(1, '#ff0080');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);
    texture.update();
    
    return texture;
  }

  public addHoverEffect(mesh: Mesh): void {
    let isHovering = false;
    let originalPosition = mesh.position.clone();
    let originalRotation = mesh.rotation.clone();

    this.canvas.addEventListener('mouseenter', () => {
      isHovering = true;
      
      // Lift and tilt animation
      Animation.CreateAndStartAnimation(
        'hoverLift',
        mesh,
        'position.z',
        60,
        20,
        mesh.position.z,
        mesh.position.z + 0.5,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      Animation.CreateAndStartAnimation(
        'hoverTilt',
        mesh,
        'rotation.x',
        60,
        20,
        mesh.rotation.x,
        Math.PI / 12,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      // Increase glow
      if (this.glowLayer) {
        this.glowLayer.intensity = 1.2;
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      isHovering = false;
      
      // Return to original position
      Animation.CreateAndStartAnimation(
        'hoverLiftReturn',
        mesh,
        'position.z',
        60,
        20,
        mesh.position.z,
        originalPosition.z,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      Animation.CreateAndStartAnimation(
        'hoverTiltReturn',
        mesh,
        'rotation.x',
        60,
        20,
        mesh.rotation.x,
        originalRotation.x,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      // Reset glow
      if (this.glowLayer) {
        this.glowLayer.intensity = 0.5;
      }
    });

    // Subtle floating animation
    this.scene.registerBeforeRender(() => {
      if (!isHovering) {
        mesh.position.y = originalPosition.y + Math.sin(Date.now() * 0.001) * 0.05;
      }
    });
  }

  public addFlipAnimation(mesh: Mesh, duration: number = 30): void {
    const flipAnimation = new Animation(
      'flip',
      'rotation.y',
      60,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [
      { frame: 0, value: 0 },
      { frame: duration / 2, value: Math.PI / 2 },
      { frame: duration, value: Math.PI },
    ];

    flipAnimation.setKeys(keys);

    // Add easing
    const easingFunction = new QuadraticEase();
    easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    flipAnimation.setEasingFunction(easingFunction);

    mesh.animations.push(flipAnimation);

    // Trigger flip on click
    this.canvas.addEventListener('click', () => {
      this.scene.beginAnimation(mesh, 0, duration, false);
    });
  }

  private addParticleEffects(mesh: Mesh, card: Card): void {
    // Clean up existing particle system
    if (this.particleSystem) {
      this.particleSystem.dispose();
    }

    const particleSystem = new ParticleSystem(
      'particles',
      2000,
      this.scene
    );

    // Texture based on card type
    const isMega = card.name?.toLowerCase().includes('mega');
    const particleTexture = isMega
      ? '/textures/star.svg'
      : '/textures/sparkle.svg';

    particleSystem.particleTexture = new Texture(particleTexture, this.scene);

    // Emitter
    particleSystem.emitter = mesh;
    particleSystem.minEmitBox = new Vector3(-1.5, -2, -0.1);
    particleSystem.maxEmitBox = new Vector3(1.5, 2, 0.1);

    // Colors
    if (isMega) {
      // Rainbow colors for mega
      particleSystem.color1 = new Color4(1, 0, 0.5, 1);
      particleSystem.color2 = new Color4(0, 0.5, 1, 1);
      particleSystem.colorDead = new Color4(0.5, 0, 1, 0);
    } else {
      // Golden for legendary
      particleSystem.color1 = new Color4(1, 0.8, 0, 1);
      particleSystem.color2 = new Color4(1, 0.6, 0, 1);
      particleSystem.colorDead = new Color4(1, 0.4, 0, 0);
    }

    // Size
    particleSystem.minSize = 0.05;
    particleSystem.maxSize = 0.15;

    // Life time
    particleSystem.minLifeTime = 0.5;
    particleSystem.maxLifeTime = 2;

    // Emission
    particleSystem.emitRate = 100;

    // Speed
    particleSystem.minEmitPower = 0.5;
    particleSystem.maxEmitPower = 1;
    particleSystem.updateSpeed = 0.02;

    // Direction
    particleSystem.direction1 = new Vector3(-0.5, 1, 0);
    particleSystem.direction2 = new Vector3(0.5, 1, 0);

    // Gravity
    particleSystem.gravity = new Vector3(0, -1, 0);

    // Start
    particleSystem.start();
    this.particleSystem = particleSystem;
  }

  public addAttackAnimation(mesh: Mesh, targetPosition: Vector3): void {
    const attackAnimation = new Animation(
      'attack',
      'position',
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const originalPosition = mesh.position.clone();
    const keys = [
      { frame: 0, value: originalPosition },
      { frame: 10, value: originalPosition.add(new Vector3(0.2, 0, 0)) },
      { frame: 20, value: targetPosition },
      { frame: 30, value: originalPosition },
    ];

    attackAnimation.setKeys(keys);

    // Add shake effect at impact
    const shakeAnimation = new Animation(
      'shake',
      'rotation.z',
      60,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const shakeKeys = [
      { frame: 18, value: 0 },
      { frame: 20, value: Math.PI / 24 },
      { frame: 22, value: -Math.PI / 24 },
      { frame: 24, value: Math.PI / 36 },
      { frame: 26, value: -Math.PI / 36 },
      { frame: 28, value: 0 },
    ];

    shakeAnimation.setKeys(shakeKeys);

    mesh.animations.push(attackAnimation, shakeAnimation);
    this.scene.beginAnimation(mesh, 0, 30, false);
  }

  public dispose(): void {
    if (this.particleSystem) {
      this.particleSystem.dispose();
    }
    if (this.cardMesh) {
      this.cardMesh.dispose();
    }
    this.scene.dispose();
    this.engine.dispose();
  }
}

// Helper function to create a card scene in a container
export function createCardScene(
  container: HTMLElement,
  card: Card,
  options: CardMeshOptions = {}
): BabylonCardAnimation {
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  container.appendChild(canvas);

  const babylonCard = new BabylonCardAnimation(canvas);
  const mesh = babylonCard.createCardMesh(card, options);
  
  // Add default animations
  babylonCard.addHoverEffect(mesh);
  babylonCard.addFlipAnimation(mesh);

  return babylonCard;
}