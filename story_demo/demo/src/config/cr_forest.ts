import { GameDSLConfig } from '@smallgami/engine';
import { Vector3 } from '@babylonjs/core';

export const testConfig: GameDSLConfig = {
  id: 'testConfig',
  name: 'Test Config',
  mechanism: 'dodge_and_catch',
  assets: {
    models: {
      player: '',
      tree: '',
      tree2: '',
      pinecone: '',
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
      x: 0,
      y:-10,
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
    cameraBetaDelta:0,
    cameraRadiusDelta: -18,
    HemisphericLight: {
      intensity: 0.4,
      color: [0.6, 0.6, 0.6],
      direction: [0, 0.3, 0.2],
    },
    DirectionalLight: {
      intensity: 0.4,
      color: [0.9, 0.9, 0.9],
      direction: [0, -0.85, 1],
    },
    BottomLight: {
      intensity: 0.2,
      color: [0.9, 0.9, 0.9],
      direction: [1, -0.5, 0],
    },
    skyboxType: 'sphere',
    particles: {
      maxStars: 50,
      ratioOfBlinkers: 0.4,
      size: {
        min: 0.3,
        max: 0.5,
      },
      colors: [[1, 1, 1, 0.3]],
      movement: {
        pattern: 'drift',
        direction: 'down',
        speed: 0.1,
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
      color: [0.4, 0.6, 0],
      start: 200,
      end: 1000,
      mode: 'linear',
    },
  },
  objects: [
    {
      name: 'tree',
      id: 'tree',
      size: new Vector3(10, 40, 10),
      onPlayerCollision: {
        player: "none",
        object: 'dispose',
      },
      onProjectileCollision: {
        object: 'dispose',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(-100, 0, 0),
      motionType: 1,
      physics: {
        mass: 0,
        restitution: 0.5,
        friction: 0,
      },
    },
    {
      name: 'tree2',
      id: 'tree2',
      size: new Vector3(8, 40, 8),
      onPlayerCollision: {
        player: "none",
        object: 'dispose',
      },
      onProjectileCollision: {
        object: 'dispose',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(-100, 0, 0),
      motionType: 1,
      physics: {
        mass: 0,
        restitution: 0.5,
        friction: 0,
      },
    },
    {
      name: 'pinecone',
      id: 'pinecone',
      size: new Vector3(3, 3, 3),
      onPlayerCollision: {
        player: "none",
        object: 'dispose',
      },
      onProjectileCollision: {
        object: 'dispose',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(-100, 0, 0),
      motionType: 2,
     
    },
  ],
  spawn: [
    {
      spawnTrigger: 'timer',
      spawnTriggerTime: 100,
      spawnXrange: [200, 200],
      spawnZrange: [-90, -40],
      spawnYrange: [-10, -10],
      spawnLikelihood: {
        tree: 0.8,
        tree2: 0.6,
      },
      scaleRangeX: [1, 1],
      scaleRangeY: [1.2, 1.5],
      scaleRangeZ: [1, 1],
    },
     {
      spawnTrigger: 'timer',
      spawnTriggerTime: 100,
      spawnXrange: [200, 200],
      spawnZrange: [40, 90],
      spawnYrange: [-10, -10],
      spawnLikelihood: {
        tree: 0.8,
        tree2: 0.6,
      },
      scaleRangeX: [1, 1],
      scaleRangeY: [1.2, 1.5],
      scaleRangeZ: [1, 1],
    },
     {
      spawnTrigger: 'timer',
      spawnTriggerTime: 1000,
      spawnXrange: [170, 180],
      spawnZrange: [-40, 40],
      spawnYrange: [-10, -10],
      spawnLikelihood: {
        pinecone: 0.8,
      },
      uniformScaleRange: [0.9, 1],
    },
  ],
};

export default testConfig;

