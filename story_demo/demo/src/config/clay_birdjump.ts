import { GameDSLConfig } from '@smallgami/engine';
import { Vector3 } from '@babylonjs/core';

export const testConfig: GameDSLConfig = {
  id: 'flappy_bird',
  name: 'flappy_bird',
  mechanism: 'catching',
  lives: 1,
  assets: {
    models: {
      player: 'cbird.glb',
      box1: 'ctube.glb',
      box2: 'ctube.glb',
      tree1: 'ctree1.glb',
      greenstrip: 'greenstrip.glb',
      // tree2: 'ctree2.glb',
      // tree3: 'ctree3.glb',
      score: 'yellow_cube.glb',
    },
    sounds: {
      jump: {
        file: 'clay_swing.mp3',
        volume: 1,
      },
      collision_player_box2: {
        file: 'clay_hit.mp3',
        volume: 1,
      },
      collision_player_box1: {
        file: 'clay_hit.mp3',
        volume: 1,
      },
      collision_player_score: {
        file: 'clay_score.mp3',
        volume: 1,
      },
    },
    skybox: 'blue2.png',
    ground: 'clay_green.png',
  },
  player: {
    size: 6,
    jumpPower: 45,
    moveSpeed: 30,
    description: 'a bird',
    // maxVelocityY: 0.8,
    friction: 0,
    mass: 100,
    restitution: 0.4,
    // stability: 0.6,
    jumpAnimationDuration: 200,
    jumpSquishScale: 0.9,
    jumpStretchScale: 1.2,
    jumpOnlyOnGround: false,
    walkingStyle: 'normal',
    jumpingStyle: "rotate",
    initialRotation: [0, Math.PI / 2, 0],
    // walkingJumpHeight: 3,
    // walkingJumpDuration: 0.4,
    bullets: {
      speed: 0.6,
      maxCount: 40,
      cooldown: 120,
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
      z: -40,
    },
    lockXPosition: true,
    lockZPosition: true// Lock horizontal position for Flappy Bird style
  },
  controls: {
    moveLeft: [''],
    moveRight: [''],
    jump: [' '],
    squeezeToJump: [''],
    fireBullet: [''],
    bulletLeft: [''],
    bulletRight: [''],
  },
  world: {
    gravityMultiplier: 1.8 ,
    description: 'the trees',
    hasGround: true,
    cameraType: 'normal',
    cameraFovScale: 1,
    cameraTargetDelta: [0, 10,100],
    cameraAlphaDelta: 0,
    cameraBetaDelta: 14.5,
    cameraRadiusDelta: 63,
    HemisphericLight: {
      intensity: 1.2 ,
      color: [1, 1, 0.9],
      direction: [1, 0   , 0.2],
    },
    DirectionalLight: {
      intensity: 0.6 ,
      color: [0.9, 1, 1],
      direction: [-1.4, -0.85, 1],
    },
    BottomLight: {
      intensity: 0  ,
      color: [1, 0.9, 0.9],
      direction: [1, 0.8, 0],
    },
    ground: {
      posY: -35,
    },
    skyboxType: 'box',
    skyboxSize: 500,
    skyboxLightIntensity: 0.8,
    particles: {
      maxStars:    0,
      ratioOfBlinkers: 0.4,
      size: {
        min: 0.2,
        max: 1.2,
      },
      colors: [[1, 1, 1, 0.8]],
      movement: {
        pattern: 'scroll',
        direction: 'left',
        speed: 0.6,
        oscillation: {
          amplitude: 1.5,
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
      color: [0, 0.25, 0.5],
      start: 200,
      end: 1200,
      mode: 'linear',
    },
  },
  objects: [
    {
      name: 'yellow cubes',
      id: 'score',
      size: new Vector3(2, 4, 4),
      onPlayerCollision: {
        player: 'score',
        object: 'dispose',
      },
      onProjectileCollision: {
        object: 'dispose',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(-30, 0, 0),
      motionType: 1 ,
      // isTrigger: true, // No physical force on collision - acts as invisible score trigger
      score: 1,
       motionStyle: 'stopMotion',
      stopMotionInterval: 200,  
    },
     {
      name: 'tree1',
      id: 'tree1',
      size: new Vector3(15, 20, 15),
      onPlayerCollision: {
        player: 'jump',
        object: 'none',
      },
      onProjectileCollision: {
        object: 'dispose',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(-30, 0, 0),
      motionType: 1,
      initialRotation: new Vector3(0, 0, 0),
      motionStyle: 'stopMotion',
      stopMotionInterval: 200,  
    },
      {
      name: 'greenstrip',
      id: 'greenstrip',
      size: new Vector3(35, 50, 60),
      onPlayerCollision: {
        player: 'jump',
        object: 'none',
      },
      onProjectileCollision: {
        object: 'dispose',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(-30, 0, 0),
      motionType: 1,
      initialRotation: new Vector3(0, 0, 0),
      motionStyle: 'stopMotion',
      stopMotionInterval: 200,  
    },
   
  ],
  spawn: [
    // {
    //   spawnTrigger: 'timer',
    //   spawnTriggerTime: 5000,
    //   spawnXrange: [0, 0],
    //   spawnZrange: [0, 0],
    //   // spawnYrange: [25, 60],
    //   spawnYrange: [10, 25],
    //   spawnOffset: {
    //     box1: new Vector3(0, 30, 0),
    //     box2: new Vector3(0, -50, 0),
    //     score: new Vector3(0, -10, -10),
    //   },
    //   spawnLikelihood: {
    //     box1: 1,
    //     box2: 1,
    //     score: 1,
    //   },
    //   scaleRangeX: [1, 1],
    //   scaleRangeY: [1, 1],
    //   scaleRangeZ: [1, 1],
    // },

     {
      spawnTrigger: 'timer',
      spawnTriggerTime: 2000,
      spawnXrange: [120, 120],
      spawnZrange: [-50, -50],
      // spawnYrange: [25, 60],
      spawnYrange: [-20, -15],
      spawnLikelihood: {
        tree1: 1,
  
      },
       uniformScaleRange: [1, 1],
       rotationPerObject: {
         tree1: { y: [0, Math.PI * 2] } // Random Y-axis rotation 0-360 degrees
       },
    },
    {
      spawnTrigger: 'timer',
      spawnTriggerTime: 2000,
      spawnXrange: [120, 120],
      spawnZrange: [-70, -70],
      // spawnYrange: [25, 60],
      spawnYrange: [-32.5, -32.5],
      spawnLikelihood: {
        greenstrip: 1,
  
      },
       uniformScaleRange: [1, 1],
    },
    {
      spawnTrigger: 'timer',
      spawnTriggerTime: 2000,
      spawnXrange: [120, 120],
      spawnZrange: [-45, -45],
      // spawnYrange: [25, 60],
      spawnYrange: [15, 40],
      spawnLikelihood: {
        score: 0.6,
  
      },
       uniformScaleRange: [1, 1],
       rotationPerObject: {
         score: { x: [0, Math.PI * 2], y: [0, Math.PI * 2], z: [0, Math.PI * 2] } // Random Y-axis rotation 0-360 degrees
       },
    },
    // {
    //   spawnTrigger: 'timer',
    //   spawnTriggerTime: 3000,
    //   spawnXrange: [50, 50],
    //   spawnZrange: [-50, -50],
    //   // spawnYrange: [25, 60],
    //   spawnYrange: [-25, -25],
    //   spawnLikelihood: {
    //     tree2: 0.5,
       
    //   },
    //   scaleRangeX: [1, 1],
    //   scaleRangeY: [1, 1],
    //   scaleRangeZ: [1, 1],
    // },
    // {
    //   spawnTrigger: 'timer',
    //   spawnTriggerTime: 5000,
    //   spawnXrange: [190, 190],
    //   spawnZrange: [-50, -50],
    //   // spawnYrange: [25, 60],
    //   spawnYrange: [-15, -15],
    //   spawnLikelihood: {
    //     tree3: 0.6,
       
    //   },
    //   scaleRangeX: [1, 1],
    //   scaleRangeY: [1, 1],
    //   scaleRangeZ: [1, 1],
    // },
  ],
};

export default testConfig;

