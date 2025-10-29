import * as BABYLON from '@babylonjs/core';
import type { CameraState } from '@/stores/battle3D';

interface CameraPosition {
  radius: number;
  alpha: number;
  beta: number;
  target: BABYLON.Vector3;
}

export class BattleCamera3D {
  private camera: BABYLON.ArcRotateCamera;
  private scene: BABYLON.Scene;
  private cameraStates: Map<CameraState, CameraPosition> = new Map();
  private currentState: CameraState = 'battle';
  private isTransitioning = false;

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
    
    // Create Arc Rotate Camera - start at a good overview distance
    this.camera = new BABYLON.ArcRotateCamera(
      'battleCamera',
      Math.PI / 4,
      Math.PI / 3,
      25,
      BABYLON.Vector3.Zero(),
      scene
    );

    // Setup camera properties - allow full range of zoom
    this.camera.lowerRadiusLimit = 15;
    this.camera.upperRadiusLimit = 40;
    this.camera.lowerBetaLimit = 0.1;
    this.camera.upperBetaLimit = Math.PI / 2.2;
    
    // Smooth camera movement
    this.camera.inertia = 0.5;
    this.camera.angularSensibilityX = 1000;
    this.camera.angularSensibilityY = 1000;
    this.camera.wheelPrecision = 30;
    
    // Attach camera controls to canvas
    const canvas = scene.getEngine().getRenderingCanvas();
    if (canvas) {
      this.camera.attachControl(canvas, true);
    }

    this.setupCameraStates();
  }

  setupCameraStates() {
    // Battle overview - wide angle to see full battlefield and skills
    this.cameraStates.set('battle', {
      radius: 25,
      alpha: Math.PI / 4,
      beta: Math.PI / 3,
      target: new BABYLON.Vector3(0, 1, 0),
    });

    // Attack view - medium distance to see both Pokemon and skill effects
    this.cameraStates.set('attack', {
      radius: 22,
      alpha: Math.PI / 3,
      beta: Math.PI / 3.5,
      target: new BABYLON.Vector3(0, 1.5, 0), // Center between Pokemon
    });

    // Critical hit - dramatic angle but still showing full action
    this.cameraStates.set('critical', {
      radius: 20,
      alpha: Math.PI / 6,
      beta: Math.PI / 4,
      target: new BABYLON.Vector3(0, 1, 0),
    });

    // Victory pose - celebratory angle
    this.cameraStates.set('victory', {
      radius: 18,
      alpha: Math.PI / 3,
      beta: Math.PI / 4,
      target: new BABYLON.Vector3(-6, 1, 0), // Player Pokemon position
    });

    // Defeat - somber angle
    this.cameraStates.set('defeat', {
      radius: 20,
      alpha: Math.PI / 2,
      beta: Math.PI / 3,
      target: new BABYLON.Vector3(0, 0, 0),
    });
  }

  async transitionToState(state: CameraState, duration: number = 1000): Promise<void> {
    if (this.isTransitioning || this.currentState === state) return;

    const targetState = this.cameraStates.get(state);
    if (!targetState) return;

    this.isTransitioning = true;
    this.currentState = state;

    // Create smooth camera transition animations
    const animations: BABYLON.Animation[] = [];

    // Radius animation
    const radiusAnim = new BABYLON.Animation(
      'cameraRadius',
      'radius',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    // Alpha animation
    const alphaAnim = new BABYLON.Animation(
      'cameraAlpha',
      'alpha',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    // Beta animation
    const betaAnim = new BABYLON.Animation(
      'cameraBeta',
      'beta',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    // Target animation
    const targetAnim = new BABYLON.Animation(
      'cameraTarget',
      'target',
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    // Set up keyframes
    const frames = duration / 16.67; // Convert ms to 60fps frames

    radiusAnim.setKeys([
      { frame: 0, value: this.camera.radius },
      { frame: frames, value: targetState.radius },
    ]);

    alphaAnim.setKeys([
      { frame: 0, value: this.camera.alpha },
      { frame: frames, value: targetState.alpha },
    ]);

    betaAnim.setKeys([
      { frame: 0, value: this.camera.beta },
      { frame: frames, value: targetState.beta },
    ]);

    targetAnim.setKeys([
      { frame: 0, value: this.camera.target.clone() },
      { frame: frames, value: targetState.target },
    ]);

    // Apply easing
    const easingFunction = new BABYLON.CubicEase();
    easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

    radiusAnim.setEasingFunction(easingFunction);
    alphaAnim.setEasingFunction(easingFunction);
    betaAnim.setEasingFunction(easingFunction);
    targetAnim.setEasingFunction(easingFunction);

    animations.push(radiusAnim, alphaAnim, betaAnim, targetAnim);

    // Start animations
    return new Promise((resolve) => {
      this.scene.beginDirectAnimation(
        this.camera,
        animations,
        0,
        frames,
        false,
        1,
        () => {
          this.isTransitioning = false;
          resolve();
        }
      );
    });
  }

  shake(intensity: number = 5, duration: number = 200) {
    const originalPosition = this.camera.position.clone();
    const shakeAnimation = new BABYLON.Animation(
      'cameraShake',
      'position',
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [];
    const frames = duration / 16.67;
    const steps = 10;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const damping = 1 - progress; // Reduce shake over time
      
      keys.push({
        frame: (frames / steps) * i,
        value: new BABYLON.Vector3(
          originalPosition.x + (Math.random() - 0.5) * intensity * damping,
          originalPosition.y + (Math.random() - 0.5) * intensity * damping,
          originalPosition.z + (Math.random() - 0.5) * intensity * damping
        ),
      });
    }

    // Return to original position
    keys.push({
      frame: frames,
      value: originalPosition,
    });

    shakeAnimation.setKeys(keys);

    this.scene.beginDirectAnimation(
      this.camera,
      [shakeAnimation],
      0,
      frames,
      false,
      1
    );
  }

  focusOnTarget(target: BABYLON.Vector3, duration: number = 500) {
    const targetAnim = new BABYLON.Animation(
      'cameraFocus',
      'target',
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const frames = duration / 16.67;
    targetAnim.setKeys([
      { frame: 0, value: this.camera.target.clone() },
      { frame: frames, value: target },
    ]);

    const easingFunction = new BABYLON.CubicEase();
    easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
    targetAnim.setEasingFunction(easingFunction);

    this.scene.beginDirectAnimation(
      this.camera,
      [targetAnim],
      0,
      frames,
      false,
      1
    );
  }

  zoomPunch(targetRadius: number, duration: number = 300) {
    const originalRadius = this.camera.radius;
    const radiusAnim = new BABYLON.Animation(
      'cameraZoomPunch',
      'radius',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const frames = duration / 16.67;
    radiusAnim.setKeys([
      { frame: 0, value: originalRadius },
      { frame: frames / 2, value: originalRadius * targetRadius },
      { frame: frames, value: originalRadius },
    ]);

    const easingFunction = new BABYLON.ElasticEase();
    easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
    radiusAnim.setEasingFunction(easingFunction);

    this.scene.beginDirectAnimation(
      this.camera,
      [radiusAnim],
      0,
      frames,
      false,
      1
    );
  }

  // Add a subtle rotation during attacks for dynamic viewing
  rotateAroundTarget(duration: number = 2000) {
    const originalAlpha = this.camera.alpha;
    const rotationAnim = new BABYLON.Animation(
      'cameraRotate',
      'alpha',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const frames = duration / 16.67;
    rotationAnim.setKeys([
      { frame: 0, value: originalAlpha },
      { frame: frames, value: originalAlpha + Math.PI / 16 }, // Rotate 11.25 degrees for subtle effect
    ]);

    const easingFunction = new BABYLON.SineEase();
    easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
    rotationAnim.setEasingFunction(easingFunction);

    this.scene.beginDirectAnimation(
      this.camera,
      [rotationAnim],
      0,
      frames,
      false,
      1
    );
  }

  getCurrentState(): CameraState {
    return this.currentState;
  }

  getCamera(): BABYLON.ArcRotateCamera {
    return this.camera;
  }

  setEnabled(enabled: boolean) {
    if (enabled) {
      const canvas = this.scene.getEngine().getRenderingCanvas();
      if (canvas) {
        this.camera.attachControl(canvas, true);
      }
    } else {
      this.camera.detachControl();
    }
  }

  dispose() {
    this.camera.dispose();
  }
}