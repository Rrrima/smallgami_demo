import { GameDSLConfig } from '@smallgami/engine';
import { Vector3 } from '@babylonjs/core';

export const testConfig: GameDSLConfig = {
  id: 'testConfig',
  name: 'Test Config',
  mechanism: 'dodge_and_catch',
  assets: {
    models: {
      player: '',
      iceberg: '',
      icebreak: '',
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
    moveSpeed: 40,
    friction: 100,
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
      x: -20,
      y: -15,
      z: 0,
    },
  },
  controls: {
    moveLeft: ['arrowleft'],
    moveRight: ['arrowright'],
    jump: [],
    squeezeToJump: [' '],
    fireBullet: [''],
    bulletLeft: [''],
    bulletRight: [''],
  },
  world: {
    description: 'test world environment',
    gravityMultiplier: 1,
    hasGround: true,
    ground: {
      width: 400,
      height: 1,
      depth: 400,
      posY: -15,
    },
    cameraType: 'action',
    cameraFovScale: 1,
    cameraTargetDelta: [0, 7, 0],
    cameraAlphaDelta: 0,
    cameraBetaDelta: -15,
    cameraRadiusDelta: -10,
    HemisphericLight: {
      intensity: 0.1,
      color: [1, 1, 1],
      direction: [0, 0.3, 0.2],
    },
    DirectionalLight: {
      intensity: 0.3,
      color: [0.9, 0.9, 0.9],
      direction: [1, 0, 0],
    },
    BottomLight: {
      intensity: 0.2,
      color: [0.9, 0.9, 0.9],
      direction: [1, -0.5, 0],
    },
    skyboxType: 'sphere',
    particles: {
      maxStars: 80,
      ratioOfBlinkers: 0.4,
      size: {
        min: 0.3,
        max: 0.5,
      },
      colors: [[1, 1, 1, 0.3]],
      movement: {
        pattern: 'scroll',
        direction: 'down',
        speed: 0.4,
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
        path: '/texture/star.png',
        dimensions: {
          width: 128,
          height: 128,
        },
      },
    },
    fog: {
      enabled: true,
      color: [0.1, 0.4, 0.6],
      density: 0.1,
      mode: 'exponential',
    },
  },
  objects: [
    {
      name: 'icebreak',
      id: 'icebreak',
      size: new Vector3(10, 2, 10),
      onPlayerCollision: {
        player: "die",
        object: 'dispose',
      },
      onProjectileCollision: {
        object: 'dispose',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(-100, 0, 0),
      motionType: 2,
      physics: {
        mass: 0,
        restitution: 0.5,
        friction: 0,
      },
    },
    {
      name: 'iceberg',
      id: 'iceberg',
      size: new Vector3(5, 8, 5),
      onPlayerCollision: {
        player: 'die',
        object: 'dispose',
      },
      onProjectileCollision: {
        object: 'none',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(-100, 0, 0),
      score: 10,
      motionType: 2,
      physics: {
        mass: 0,
        restitution: 0.5,
        friction: 0,
      },
    },
  ],
  spawn: [
    {
      spawnTrigger: 'timer',
      spawnTriggerTime: 800,
      spawnXrange: [100, 100],
      spawnZrange: [-40, 40],
      spawnYrange: [-13, -13],
      spawnLikelihood: {
        icebreak: 0.8,
      },
      scaleRangeX: [0.9, 1],
      scaleRangeY: [1, 1],
      scaleRangeZ: [0.9, 1],
    },
    {
      spawnTrigger: 'timer',
      spawnTriggerTime: 1100,
      spawnXrange: [110, 110],
      spawnZrange: [-40, 340],
      spawnYrange: [-10, -10],
      spawnLikelihood: {
        iceberg: 0.6,
      },
      uniformScaleRange: [0.95, 1.05],
    },
  ],
};

export default testConfig;

