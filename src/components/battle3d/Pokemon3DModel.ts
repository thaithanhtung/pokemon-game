import * as BABYLON from '@babylonjs/core';

export type PokemonType = 'fire' | 'water' | 'grass' | 'electric' | 'psychic' | 'ice' | 
                          'dragon' | 'dark' | 'fairy' | 'normal' | 'fighting' | 'flying' | 
                          'poison' | 'ground' | 'rock' | 'bug' | 'ghost' | 'steel';

interface AnimationState {
  idle: BABYLON.AnimationGroup | null;
  attack: BABYLON.AnimationGroup | null;
  hurt: BABYLON.AnimationGroup | null;
  victory: BABYLON.AnimationGroup | null;
  defeat: BABYLON.AnimationGroup | null;
}

export class Pokemon3DModel {
  private scene: BABYLON.Scene;
  private pokemonMesh: BABYLON.Mesh;
  private spritePlane: BABYLON.Mesh | null = null;
  private typeEffects: BABYLON.ParticleSystem[] = [];
  private animations: AnimationState = {
    idle: null,
    attack: null,
    hurt: null,
    victory: null,
    defeat: null,
  };
  private currentAnimation: BABYLON.AnimationGroup | null = null;
  private pokemonId: number = 0;
  private pokemonType: PokemonType = 'normal';
  private shadowPlane: BABYLON.Mesh | null = null;

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
    
    // Create container mesh for Pokemon
    this.pokemonMesh = new BABYLON.Mesh('pokemon', scene);
  }

  async loadPokemon(pokemonId: number, type: PokemonType): Promise<void> {
    this.pokemonId = pokemonId;
    this.pokemonType = type;

    // Create sprite plane (converting 2D sprite to 3D)
    this.spritePlane = BABYLON.MeshBuilder.CreatePlane(
      'pokemonSprite',
      { width: 2, height: 2 },
      this.scene
    );
    this.spritePlane.parent = this.pokemonMesh;
    this.spritePlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;

    // Load Pokemon sprite texture
    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
    const texture = new BABYLON.Texture(spriteUrl, this.scene);
    texture.hasAlpha = true;

    // Create material with sprite
    const material = new BABYLON.StandardMaterial(`pokemon${pokemonId}Mat`, this.scene);
    material.diffuseTexture = texture;
    material.emissiveTexture = texture;
    material.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    material.specularColor = new BABYLON.Color3(0, 0, 0);
    material.useAlphaFromDiffuseTexture = true;
    material.backFaceCulling = false;
    
    this.spritePlane.material = material;

    // Add shadow
    this.createShadow();

    // Add type-based aura effects
    this.createTypeEffects(type);

    // Setup animations
    this.setupAnimations();
  }

  private createShadow() {
    this.shadowPlane = BABYLON.MeshBuilder.CreateDisc(
      'shadow',
      { radius: 0.8 },
      this.scene
    );
    this.shadowPlane.parent = this.pokemonMesh;
    this.shadowPlane.position.y = -1;
    this.shadowPlane.rotation.x = Math.PI / 2;

    const shadowMaterial = new BABYLON.StandardMaterial('shadowMat', this.scene);
    shadowMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    shadowMaterial.alpha = 0.3;
    this.shadowPlane.material = shadowMaterial;
  }

  private createTypeEffects(type: PokemonType) {
    // Clear existing effects
    this.typeEffects.forEach(effect => effect.dispose());
    this.typeEffects = [];

    const particleSystem = new BABYLON.ParticleSystem(
      `${type}Particles`,
      100,
      this.scene
    );

    // Set emitter
    particleSystem.emitter = this.pokemonMesh;
    particleSystem.minEmitBox = new BABYLON.Vector3(-0.5, -0.5, -0.5);
    particleSystem.maxEmitBox = new BABYLON.Vector3(0.5, 0.5, 0.5);

    // Create particle texture using data URI (simple circle)
    const particleDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAUklEQVQoU2NkYGBgKD1w4P+HDx8YGCAI+P//P8N/BgYwxcjAyMjI8OfPH7CkhoaGBqMopaCgoABFAUjCgIGB4f+DBw8YGBgYGH79+sVQXl7OwAAANocSHAwdJYkAAAAASUVORK5CYII=';
    particleSystem.particleTexture = new BABYLON.Texture(particleDataUri, this.scene);

    // Configure based on type
    switch (type) {
      case 'fire':
        particleSystem.color1 = new BABYLON.Color4(1, 0.5, 0, 1);
        particleSystem.color2 = new BABYLON.Color4(1, 0.2, 0, 0.5);
        particleSystem.minLifeTime = 0.3;
        particleSystem.maxLifeTime = 0.8;
        particleSystem.emitRate = 20;
        particleSystem.direction1 = new BABYLON.Vector3(-0.5, 1, -0.5);
        particleSystem.direction2 = new BABYLON.Vector3(0.5, 2, 0.5);
        break;

      case 'water':
        particleSystem.color1 = new BABYLON.Color4(0.2, 0.6, 1, 1);
        particleSystem.color2 = new BABYLON.Color4(0.1, 0.3, 0.8, 0.5);
        particleSystem.minLifeTime = 0.5;
        particleSystem.maxLifeTime = 1;
        particleSystem.emitRate = 15;
        particleSystem.gravity = new BABYLON.Vector3(0, -2, 0);
        break;

      case 'electric':
        particleSystem.color1 = new BABYLON.Color4(1, 1, 0, 1);
        particleSystem.color2 = new BABYLON.Color4(1, 0.8, 0, 0.5);
        particleSystem.minLifeTime = 0.1;
        particleSystem.maxLifeTime = 0.3;
        particleSystem.emitRate = 30;
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.3;
        break;

      case 'grass':
        particleSystem.color1 = new BABYLON.Color4(0.3, 0.8, 0.3, 1);
        particleSystem.color2 = new BABYLON.Color4(0.2, 0.6, 0.2, 0.5);
        particleSystem.minLifeTime = 1;
        particleSystem.maxLifeTime = 2;
        particleSystem.emitRate = 10;
        particleSystem.gravity = new BABYLON.Vector3(0, -1, 0);
        particleSystem.minAngularSpeed = -Math.PI;
        particleSystem.maxAngularSpeed = Math.PI;
        break;

      case 'psychic':
        particleSystem.color1 = new BABYLON.Color4(1, 0.3, 1, 1);
        particleSystem.color2 = new BABYLON.Color4(0.8, 0.1, 0.8, 0.5);
        particleSystem.minLifeTime = 1;
        particleSystem.maxLifeTime = 2;
        particleSystem.emitRate = 8;
        particleSystem.minEmitPower = 0.5;
        particleSystem.maxEmitPower = 1;
        particleSystem.updateSpeed = 0.01;
        break;
    }

    // Common settings
    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.5;
    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 2;
    particleSystem.updateSpeed = 0.01;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;

    particleSystem.start();
    this.typeEffects.push(particleSystem);
  }

  private setupAnimations() {
    // Create idle animation (floating up and down)
    const idleAnim = new BABYLON.AnimationGroup('idle', this.scene);
    const floatAnim = new BABYLON.Animation(
      'float',
      'position.y',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    
    floatAnim.setKeys([
      { frame: 0, value: 1 },
      { frame: 30, value: 1.2 },
      { frame: 60, value: 1 },
    ]);

    if (this.spritePlane) {
      idleAnim.addTargetedAnimation(floatAnim, this.spritePlane);
    }
    this.animations.idle = idleAnim;

    // Create attack animation
    const attackAnim = new BABYLON.AnimationGroup('attack', this.scene);
    const attackMove = new BABYLON.Animation(
      'attackMove',
      'position.z',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    attackMove.setKeys([
      { frame: 0, value: 0 },
      { frame: 15, value: -0.5 }, // Pull back
      { frame: 30, value: 2 }, // Lunge forward
      { frame: 45, value: 0 }, // Return
    ]);

    if (this.spritePlane) {
      attackAnim.addTargetedAnimation(attackMove, this.spritePlane);
    }
    this.animations.attack = attackAnim;

    // Create hurt animation
    const hurtAnim = new BABYLON.AnimationGroup('hurt', this.scene);
    const hurtShake = new BABYLON.Animation(
      'hurtShake',
      'position.x',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    hurtShake.setKeys([
      { frame: 0, value: 0 },
      { frame: 5, value: -0.2 },
      { frame: 10, value: 0.2 },
      { frame: 15, value: -0.1 },
      { frame: 20, value: 0.1 },
      { frame: 25, value: 0 },
    ]);

    if (this.spritePlane) {
      hurtAnim.addTargetedAnimation(hurtShake, this.spritePlane);
    }
    this.animations.hurt = hurtAnim;

    // Create victory animation
    const victoryAnim = new BABYLON.AnimationGroup('victory', this.scene);
    const victoryJump = new BABYLON.Animation(
      'victoryJump',
      'position.y',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    const victorySpin = new BABYLON.Animation(
      'victorySpin',
      'rotation.y',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    victoryJump.setKeys([
      { frame: 0, value: 1 },
      { frame: 15, value: 2.5 },
      { frame: 30, value: 1 },
      { frame: 45, value: 2 },
      { frame: 60, value: 1 },
    ]);

    victorySpin.setKeys([
      { frame: 0, value: 0 },
      { frame: 60, value: Math.PI * 2 },
    ]);

    if (this.spritePlane) {
      victoryAnim.addTargetedAnimation(victoryJump, this.spritePlane);
      victoryAnim.addTargetedAnimation(victorySpin, this.spritePlane);
    }
    this.animations.victory = victoryAnim;

    // Create defeat animation
    const defeatAnim = new BABYLON.AnimationGroup('defeat', this.scene);
    const defeatFall = new BABYLON.Animation(
      'defeatFall',
      'position.y',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    const defeatFade = new BABYLON.Animation(
      'defeatFade',
      'material.alpha',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    defeatFall.setKeys([
      { frame: 0, value: 1 },
      { frame: 30, value: 0 },
    ]);

    defeatFade.setKeys([
      { frame: 30, value: 1 },
      { frame: 60, value: 0.3 },
    ]);

    if (this.spritePlane) {
      defeatAnim.addTargetedAnimation(defeatFall, this.spritePlane);
      defeatAnim.addTargetedAnimation(defeatFade, this.spritePlane);
    }
    this.animations.defeat = defeatAnim;
  }

  playIdleAnimation() {
    this.stopCurrentAnimation();
    if (this.animations.idle) {
      this.animations.idle.play(true);
      this.currentAnimation = this.animations.idle;
    }
  }

  playAttackAnimation() {
    this.stopCurrentAnimation();
    
    if (!this.spritePlane) return;
    
    // Enhanced attack animation with multiple effects
    const originalPosition = this.pokemonMesh.position.clone();
    const attackDistance = 2;
    const direction = this.pokemonMesh.position.x < 0 ? 1 : -1;
    
    // Store original material values
    const originalEmissive = this.spritePlane.material as BABYLON.StandardMaterial;
    const originalEmissiveColor = originalEmissive.emissiveColor.clone();
    
    // Create attack glow effect
    originalEmissive.emissiveColor = new BABYLON.Color3(1, 1, 0.5);
    
    // Create animation group for attack
    const attackGroup = new BABYLON.AnimationGroup('attackGroup', this.scene);
    
    // Scale animation
    const scaleAnim = new BABYLON.Animation(
      'attackScale',
      'scaling',
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    scaleAnim.setKeys([
      { frame: 0, value: new BABYLON.Vector3(1, 1, 1) },
      { frame: 10, value: new BABYLON.Vector3(1.3, 1.3, 1.3) },
      { frame: 20, value: new BABYLON.Vector3(1, 1, 1) }
    ]);
    
    // Position animation
    const positionAnim = new BABYLON.Animation(
      'attackPosition',
      'position.x',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    positionAnim.setKeys([
      { frame: 0, value: originalPosition.x },
      { frame: 20, value: originalPosition.x + (attackDistance * direction) },
      { frame: 35, value: originalPosition.x }
    ]);
    
    // Rotation animation
    const rotationAnim = new BABYLON.Animation(
      'attackRotation',
      'rotation.z',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    rotationAnim.setKeys([
      { frame: 0, value: 0 },
      { frame: 15, value: direction * 0.3 },
      { frame: 30, value: 0 }
    ]);
    
    attackGroup.addTargetedAnimation(scaleAnim, this.spritePlane);
    attackGroup.addTargetedAnimation(positionAnim, this.pokemonMesh);
    attackGroup.addTargetedAnimation(rotationAnim, this.spritePlane);
    
    attackGroup.play(false);
    
    // Reset after animation
    attackGroup.onAnimationGroupEndObservable.addOnce(() => {
      originalEmissive.emissiveColor = originalEmissiveColor;
      this.playIdleAnimation();
    });
    
    // Add attack trail effect
    this.createAttackTrail(direction);
  }

  playHurtAnimation() {
    this.stopCurrentAnimation();
    
    if (!this.spritePlane) return;
    
    // Enhanced hurt animation with multiple effects
    const material = this.spritePlane.material as BABYLON.StandardMaterial;
    const originalEmissiveColor = material.emissiveColor.clone();
    
    // Flash red effect
    let flashCount = 0;
    const hurtColor = new BABYLON.Color3(1, 0, 0);
    const flashInterval = setInterval(() => {
      if (flashCount % 2 === 0) {
        material.emissiveColor = hurtColor.scale(2);
      } else {
        material.emissiveColor = originalEmissiveColor;
      }
      flashCount++;
      
      if (flashCount > 6) {
        clearInterval(flashInterval);
        material.emissiveColor = originalEmissiveColor;
      }
    }, 100);
    
    // Complex shake animation
    const originalX = this.pokemonMesh.position.x;
    const originalZ = this.pokemonMesh.position.z;
    const shakeIntensity = 0.4;
    const knockbackDistance = 1;
    const direction = this.pokemonMesh.position.x < 0 ? -1 : 1;
    
    // Create hurt animation group
    const hurtGroup = new BABYLON.AnimationGroup('hurtGroup', this.scene);
    
    // X-axis shake animation
    const shakeAnimation = new BABYLON.Animation(
      'hurtShakeX',
      'position.x',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    shakeAnimation.setKeys([
      { frame: 0, value: originalX },
      { frame: 5, value: originalX + shakeIntensity },
      { frame: 10, value: originalX - shakeIntensity },
      { frame: 15, value: originalX + shakeIntensity * 0.7 },
      { frame: 20, value: originalX - shakeIntensity * 0.7 },
      { frame: 25, value: originalX + shakeIntensity * 0.3 },
      { frame: 30, value: originalX }
    ]);
    
    // Knockback animation
    const knockbackAnimation = new BABYLON.Animation(
      'knockback',
      'position.z',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    knockbackAnimation.setKeys([
      { frame: 0, value: originalZ },
      { frame: 20, value: originalZ + (knockbackDistance * direction) },
      { frame: 35, value: originalZ }
    ]);
    
    // Squash and stretch animation
    const squashAnimation = new BABYLON.Animation(
      'hurtSquash',
      'scaling',
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    squashAnimation.setKeys([
      { frame: 0, value: new BABYLON.Vector3(1, 1, 1) },
      { frame: 15, value: new BABYLON.Vector3(1.1, 0.7, 1.1) },
      { frame: 25, value: new BABYLON.Vector3(0.9, 1.2, 0.9) },
      { frame: 35, value: new BABYLON.Vector3(1, 1, 1) }
    ]);
    
    hurtGroup.addTargetedAnimation(shakeAnimation, this.pokemonMesh);
    hurtGroup.addTargetedAnimation(knockbackAnimation, this.pokemonMesh);
    hurtGroup.addTargetedAnimation(squashAnimation, this.spritePlane);
    
    hurtGroup.play(false);
    
    // Return to idle after hurt
    hurtGroup.onAnimationGroupEndObservable.addOnce(() => {
      this.playIdleAnimation();
    });
    
    // Create hurt particles
    this.createHurtParticles();
  }
  
  private createAttackTrail(direction: number) {
    // Create trail particle system
    const trail = new BABYLON.ParticleSystem('attackTrail', 50, this.scene);
    trail.particleTexture = new BABYLON.Texture('/particle.png', this.scene);
    trail.emitter = this.pokemonMesh;
    trail.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1);
    trail.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);
    trail.color1 = new BABYLON.Color4(1, 1, 0.5, 1);
    trail.color2 = new BABYLON.Color4(1, 0.8, 0, 0.5);
    trail.colorDead = new BABYLON.Color4(1, 0.5, 0, 0);
    trail.minSize = 0.2;
    trail.maxSize = 0.5;
    trail.minLifeTime = 0.1;
    trail.maxLifeTime = 0.3;
    trail.emitRate = 100;
    trail.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    trail.gravity = new BABYLON.Vector3(0, 0, 0);
    trail.direction1 = new BABYLON.Vector3(-direction, 0, 0);
    trail.direction2 = new BABYLON.Vector3(-direction, 0.5, 0);
    trail.minEmitPower = 2;
    trail.maxEmitPower = 4;
    trail.updateSpeed = 0.01;
    
    trail.start();
    
    // Stop after attack duration
    setTimeout(() => {
      trail.stop();
    }, 500);
  }
  
  private createHurtParticles() {
    // Create impact particles
    const impact = new BABYLON.ParticleSystem('hurtImpact', 30, this.scene);
    impact.particleTexture = new BABYLON.Texture('/particle.png', this.scene);
    impact.emitter = this.pokemonMesh.position.add(new BABYLON.Vector3(0, 1, 0));
    impact.minEmitBox = new BABYLON.Vector3(0, 0, 0);
    impact.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
    impact.color1 = new BABYLON.Color4(1, 0.5, 0, 1);
    impact.color2 = new BABYLON.Color4(1, 0, 0, 1);
    impact.colorDead = new BABYLON.Color4(0.5, 0, 0, 0);
    impact.minSize = 0.1;
    impact.maxSize = 0.3;
    impact.minLifeTime = 0.2;
    impact.maxLifeTime = 0.5;
    impact.emitRate = 1000;
    impact.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    impact.gravity = new BABYLON.Vector3(0, -5, 0);
    impact.direction1 = new BABYLON.Vector3(-1, 1, -1);
    impact.direction2 = new BABYLON.Vector3(1, 2, 1);
    impact.minAngularSpeed = 0;
    impact.maxAngularSpeed = Math.PI;
    impact.minEmitPower = 3;
    impact.maxEmitPower = 5;
    impact.updateSpeed = 0.01;
    impact.targetStopDuration = 0.1;
    impact.disposeOnStop = true;
    
    impact.start();
  }

  playVictoryAnimation() {
    this.stopCurrentAnimation();
    if (this.animations.victory) {
      this.animations.victory.play(true);
      this.currentAnimation = this.animations.victory;
    }
  }

  playDefeatAnimation() {
    this.stopCurrentAnimation();
    if (this.animations.defeat) {
      this.animations.defeat.play(false);
      this.currentAnimation = this.animations.defeat;
    }
  }

  private stopCurrentAnimation() {
    if (this.currentAnimation) {
      this.currentAnimation.stop();
      this.currentAnimation = null;
    }
  }

  setPosition(position: BABYLON.Vector3) {
    this.pokemonMesh.position = position;
  }

  getPosition(): BABYLON.Vector3 {
    return this.pokemonMesh.position;
  }

  getMesh(): BABYLON.Mesh {
    return this.pokemonMesh;
  }

  dispose() {
    this.stopCurrentAnimation();
    
    // Dispose animations
    Object.values(this.animations).forEach(anim => {
      if (anim) anim.dispose();
    });

    // Dispose particle systems
    this.typeEffects.forEach(effect => effect.dispose());

    // Dispose meshes
    if (this.spritePlane) this.spritePlane.dispose();
    if (this.shadowPlane) this.shadowPlane.dispose();
    this.pokemonMesh.dispose();
  }
}