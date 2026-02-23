import { GameDSLConfig } from '@smallgami/engine';
import { Vector3 } from '@babylonjs/core';

export const testConfig: GameDSLConfig = {
  id: 'testConfig',
  name: 'Test Config',
  mechanism: 'dodge_and_catch',
  assets: {
    models: {
      player: '',
      box1: '',
      box2: '',
      box3: '',
      // player_jump: 'bear_jump.png',
    },
    sounds: {
      ambient: {
        file: 'test_audio.mp3',
        volume: 0.1,
        loop: true,
      },
      jump: {
        file: 'jump_sound.mp3',
      },
      collision_player_box2: {
        file: 'catch_gift_sound2.wav',
      },
      collision_player_box1: {
        file: 'ouch_sound.wav',
      },
    },
    skybox: '',
    ground: '',
  },
  player: {
    description: 'a cute bear',
    size: 5,
    jumpPower: 50,
    moveSpeed: 30,
    friction: 7,
    mass: 10,
    restitution: 0.4,
    jumpAnimationDuration: 500,
    jumpSquishScale: 0.9,
    jumpStretchScale: 1.1,
    jumpOnlyOnGround: false,
    maxJumpCount: 2,
    jumpInterval: 200,
    bullets: {
      speed: 0.6,
      maxCount: 1,
      cooldown: 1000,
      shape: {
        width: 1,
        height: 1,
        depth: 1,
      },
      maxDistance: 110,
      color: {
        r: 0.2,
        g: 0.8,
        b: 0.3,
      },
      opacity: 0.9,
    },
    startPosition: {
      x: 0,
      y: 4,
      z: 0,
    },
  },
  controls: {
    moveLeft: ['arrowleft'],
    moveRight: ['arrowright'],
    moveforward: ['arrowup', 'w'],
    movebackward: ['arrowdown', 's'],
    jump: ['arrowup', ''],
    squeezeToJump: [' '],
    fireBullet: [''],
    bulletLeft: [''],
    bulletRight: [''],
  },
  world: {
    description: 'test world environment',
    gravityMultiplier: 1.3,
    hasGround: true,
    ground: {
      width: 400,
      height: 10,
      depth: 400,
      posY: -20,
    },
    cameraType: 'normal',
    cameraFovScale: 1,
    cameraTargetDelta: [0, 7, 0],
    cameraAlphaDelta: 0,
    cameraBetaDelta: 27,
    cameraRadiusDelta: -20,
    HemisphericLight: {
      intensity: 0.6,
      color: [1, 1, 1],
      direction: [0, 0.3, 0.2],
    },
    DirectionalLight: {
      intensity: 0.4,
      color: [0.9, 0.9, 0.9],
      direction: [0, -0.85, 1],
    },
    BottomLight: {
      intensity: 0.1,
      color: [0.9, 0.9, 0.9],
      direction: [0, 1, 0],
    },
    skyboxType: 'sphere',
    particles: {
      maxStars: 80,
      ratioOfBlinkers: 0.4,
      size: {
        min: 0.1,
        max: 0.7,
      },
      colors: [[1, 1, 1, 0.8]],
      movement: {
        pattern: 'oscillate',
        direction: 'down',
        speed: 0.6,
        oscillation: {
          amplitude: 1,
          frequency: 0.05,
        },
      },
      blinking: {
        minInterval: 800,
        maxInterval: 2000,
      },
      texture: {
        path: '/assets/images/star.png',
        dimensions: {
          width: 128,
          height: 128,
        },
      },
    },
    fog: {
      enabled: false,
      color: [0.1, 0.1, 0.1],
      start: 0,
      end: 800,
      mode: 'linear',
    },
  },
  objects: [
    {
      name: 'hazard',
      id: 'box1',
      size: new Vector3(3, 3, 3),
      onPlayerCollision: {
        player: "none",
        object: 'dispose',
      },
      onProjectileCollision: {
        object: 'dispose',
        projectile: 'dispose',
      },
      onGroundCollision: 'disappearing',
      initialSpeed: new Vector3(0, -30, 0),
      motionType: 2,
    },
    {
      name: 'gift box',
      id: 'box2',
      size: new Vector3(3, 3, 3),
      onPlayerCollision: {
        player: 'score',
        object: 'dispose',
      },
      onProjectileCollision: {
        object: 'none',
        projectile: 'dispose',
      },
      onGroundCollision: 'disappearing',
      initialSpeed: new Vector3(0, -30, 0),
      score: 10,
      motionType: 2,
    },
  ],
  spawn: [
    {
      spawnTrigger: 'timer',
      spawnTriggerTime: 500,
      spawnXrange: [-200, 200],
      spawnZrange: [0, 0],
      spawnYrange: [10, 30],
      spawnLikelihood: {
        box1: 0.8,
      },

      uniformScaleRange: [0.9, 1],
    },
    {
      spawnTrigger: 'timer',
      spawnTriggerTime: 500,
      spawnXrange: [-80, 80],
      spawnZrange: [0, 0],
      spawnYrange: [10, 30],
      spawnLikelihood: {
        box2: 0.8,
      },

      uniformScaleRange: [0.9, 1.2],
    },
  ],
};

export default testConfig;

