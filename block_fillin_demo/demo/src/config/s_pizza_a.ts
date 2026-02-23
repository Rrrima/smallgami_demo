import { GameDSLConfig } from '@smallgami/engine';
import { Vector3 } from '@babylonjs/core';

export const testConfig: GameDSLConfig = {
  id: 'testConfig',
  name: 'Test Config',
  mechanism: 'dodge_and_catch',
  assets: {
    models: {
      player: '',
      container: 'pizza.glb',
      counter: '',
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
    size: 30,
    jumpPower: 50,
    moveSpeed: 55,
    friction: 0,
    mass: 10,
    restitution: 0.4,
    jumpAnimationDuration: 500,
    jumpSquishScale: 0.9,
    jumpStretchScale: 1.1,
    jumpOnlyOnGround: false,
    maxJumpCount: 2,
    jumpInterval: 200,
    bullets: {
      speed: -6,
      numOfBullets: 4,
      offset: { x: 0, y: 0, z: -20 },
      maxCount: 100,
      cooldown: 10,
      isObject:true,
      shape: {
        width: 1.2,
        height:0.1 ,
        depth: 1,
      },
      physics: {
        mass: 1,
        restitution: 0,
        friction: 100,
      },
      maxDistance: 110,
      color: {
        r: 0.98,
        g: 0.95,
        b: 0.85,
      },
      opacity: 0.9,
    },
    startPosition: {
      x: 0,
      y:40,
      z: 0,
    },
  },
  controls: {
    moveLeft: ['arrowleft'],
    moveRight: ['arrowright'],
    moveforward: [],
    movebackward: [],
    jump: [],
    squeezeToJump: [''],
    fireBullet: [' '],
    bulletLeft: [''],
    bulletRight: [''],
  },
  world: {
    description: 'test world environment',
    gravityMultiplier: 1,
    hasGround: false,
    ground: {
      width: 400,
      height: 0,
      depth: 400,
      posY: 32,
    },
    cameraType: 'normal',
    cameraFovScale: 0.7,
    cameraTargetDelta: [0, 7, 0],
    cameraAlphaDelta: -30,
    cameraBetaDelta:-20,
    cameraRadiusDelta: 10  ,
    HemisphericLight: {
      intensity: 1,
      color: [0.6, 0.6, 0.6],
      direction: [0, 1, 0],
    },
    DirectionalLight: {
      intensity: 1,
      color: [0.9, 0.9, 0.9],
      direction: [0, -0.85, 0],
    },
    BottomLight: {
      intensity: 0.1,
      color: [0.9, 0.9, 0.9],
      direction: [1, -0.5, 0],
    },
    skyboxType: 'box',
    particles: {
      maxStars: 30,
      ratioOfBlinkers: 0.1,
      size: {
        min: 0.5,
        max: 0.7,
      },
      colors: [[1, 1, 1, 0.3]],
      movement: {
        pattern: 'drift',
        direction: 'down',
        speed: 0.05,
        oscillation: {
          amplitude: 1,
          frequency: 0.05,
        },
      },
      blinking: {
        minInterval: 600,
        maxInterval: 800,
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
      enabled: false,
      color: [0.4, 0.6, 0],
      start: 200,
      end: 1000,
      mode: 'linear',
    },
  },
  objects: [
    {
      name: 'container',
      id: 'container',
      size: new Vector3(20, 15, 20),
      onPlayerCollision: {
        player: "none",
        object: 'dispose',
      },
      onProjectileCollision: {
        object: 'none',
        projectile: 'none',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(20, 0, 0),
      motionType: 1,
      physics: {
        mass: 1,
        restitution: 0,
        friction: 100,
      },
      score: 1,
    },
    {
      name: 'counter',
      id: 'counter',
      size: new Vector3(500, 2, 80),
      onPlayerCollision: {
        player: "none",
        object: 'dispose',
      },
      onProjectileCollision: {
        object: 'none',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(0, 0, 0),
      motionType: 1,
      physics: {
        mass: 1,
        restitution: 0,
        friction: 500,
      },
      score:-1
    },
  ],
  spawn: [
    {
      spawnTrigger: 'timer',
      spawnTriggerTime: 3000,
      spawnXrange: [-50, -50],
      spawnZrange: [-30, -30],
      spawnYrange: [-20, -20],
      spawnLikelihood: {
        container: 1,
      },
      uniformScaleRange: [2, 2],
    },
    {
      spawnTrigger: 'once',
      spawnTriggerTime: 100,
      spawnXrange: [0, 0],
      spawnZrange: [-30, -30],
      spawnYrange: [-28, -28],
      spawnLikelihood: {
        counter: 1,
      },
      scaleRangeX: [1, 1],
      scaleRangeY: [1, 1],
      scaleRangeZ: [1, 1],
    },
    
     
  ],
};

export default testConfig;

