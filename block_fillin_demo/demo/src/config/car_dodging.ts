import { GameDSLConfig } from '@smallgami/engine';
import { Vector3 } from '@babylonjs/core';

export const testConfig: GameDSLConfig = {
  id: 'flappy_bird',
  name: 'flappy_bird',
  mechanism: 'flappy_bird',
  lives: 1,
  assets: {
    models: {
      player: 'car.glb',
      bird: 'cbird.glb',
      box1: 'ctube.glb',
      box2: 'ctube.glb',
      tree1: 'ctree1.glb',
      roadstrip: "road_strip.glb",
      greenstrip: 'greenstrip.glb',
      greenstrip2: 'greenstrip.glb',
      tree2: 'ctree1.glb',
      // tree2: 'ctree2.glb',
      // tree3: 'ctree3.glb',
      obstacle: 'clay_obstacle.glb',
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
    size: 18,
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
    jumpingStyle:"rotate",
    initialRotation: [0, Math.PI, 0],
    walkingStyle: 'normal',
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
      x: -40,
      y: 0,
      z: 20 ,
    },
    lockXPosition: true, // Lock horizontal position for Flappy Bird style
    // lockZPosition: true, // Lock vertical position for Flappy Bird style
  },
  controls: {
    moveLeft: [''],
    moveRight: [''],
    moveforward: ['arrowleft'],
    movebackward: ['arrowright'],
    jump: [' '],
    squeezeToJump: [''],
    fireBullet: [''],
    bulletLeft: [''],
    bulletRight: [''],
  },
  world: {
    gravityMultiplier: 1.8 ,
    description: 'the sky',
    hasGround: true,
    cameraType: 'birdeye',
    cameraFovScale: 1,
    cameraTargetDelta: [-10, 0, -15],
    cameraAlphaDelta: -50,
    cameraBetaDelta: 0,
    cameraRadiusDelta: 20,
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
      name: 'tube',
      id: 'box1',
      size: new Vector3(20, 30, 20),
      onPlayerCollision: {
        player: 'die',
        object: 'none',
      },
      onProjectileCollision: {
        object: 'dispose',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(-10, 0, 0),
      motionType: 1,
      initialRotation: new Vector3(0, 0, Math.PI),
      motionStyle: 'stopMotion',
      stopMotionInterval: 600,  
    },
    {
      name: 'tube',
      id: 'box2',
      size: new Vector3(20, 30, 20),
      onPlayerCollision: {
        player: 'die',
        object: 'none',
      },
      onProjectileCollision: {
        object: 'dispose',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(-10, 0, 0),
      motionType: 1,
      motionStyle: 'stopMotion', 
      stopMotionInterval: 600,
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
      initialSpeed: new Vector3(-60, 0, 0),
      motionType: 1,
      initialRotation: new Vector3(0, 0, 0),
      motionStyle: 'stopMotion',
      stopMotionInterval: 200,  
    },
     {
      name: 'tree2',
      id: 'tree2',
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
      initialSpeed: new Vector3(-60, 0, 0),
      motionType: 1,
      initialRotation: new Vector3(0, 0, 0),
      motionStyle: 'stopMotion',
      stopMotionInterval: 200,  
    },
      {
      name: 'greenstrip',
      id: 'greenstrip',
      size: new Vector3(63, 50, 70),
      onPlayerCollision: {
        player: 'none',
        object: 'none',
      },
      onProjectileCollision: {
        object: 'dispose',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(-60, 0, 0),
      motionType: 1,
      initialRotation: new Vector3(0, 0, 0),
      motionStyle: 'stopMotion',
      stopMotionInterval: 200,
      receiveShadows: true,
    },
    {
      name: 'greenstrip2',
      id: 'greenstrip2',
      size: new Vector3(63, 50, 70),
      onPlayerCollision: {
        player: 'none',
        object: 'none',
      },
      onProjectileCollision: {
        object: 'dispose',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(-60, 0, 0),
      motionType: 1,
      initialRotation: new Vector3(0, 0, 0),
      motionStyle: 'stopMotion',
      stopMotionInterval: 200,
      receiveShadows: true,
    },
       {
      name: 'roadstrip',
      id: 'roadstrip',
      size: new Vector3(63, 50, 210),
      onPlayerCollision: {
        player: 'none',
        object: 'none',
      },
      onProjectileCollision: {
        object: 'dispose',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(-60, 0, 0),
      motionType: 1,
      initialRotation: new Vector3(0, 0, 0),
      motionStyle: 'stopMotion',
      stopMotionInterval: 200,
      receiveShadows: true,
    },
    {
      name: 'bird',
      id: 'bird',
      size: new Vector3(4, 4, 4),
      onPlayerCollision: {
        player: 'none',
        object: 'none',
           },
      onProjectileCollision: {
        object: 'dispose',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(-20, 0, 30),
      motionType: 1,
      initialRotation: new Vector3(0, -Math.PI/6, 0),
      motionStyle: 'stopMotion',
      stopMotionInterval: 200,  
    },
     {
      name: 'obstacle',
      id: 'obstacle',
      size: new Vector3(4, 4, 4),
      onPlayerCollision: {
        player: 'none',
        object: 'none',
           },
      onProjectileCollision: {
        object: 'dispose',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(-20, 0, 0),
      motionType: 2,
      initialRotation: new Vector3(0, -Math.PI/6, 0),
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
      spawnXrange: [120, 150],
      spawnZrange: [-50, -50],
      // spawnYrange: [25, 60],
      spawnYrange: [30, 50],
      spawnLikelihood: {
        score: 0.8,
  
      },
       uniformScaleRange: [1, 1],
       rotationPerObject: {
         score: { x: [0, Math.PI * 2],y: [0, Math.PI * 2], z:[0, Math.PI * 2] } // Random Y-axis rotation 0-360 degrees
       },
    },

     {
      spawnTrigger: 'timer',
      spawnTriggerTime: 2000,
      spawnXrange: [180, 180],
      spawnZrange: [-48, -48],
      // spawnYrange: [25, 60],
      spawnYrange: [-20, -15],
      spawnLikelihood: {
        tree1: 1,
        tree2: 1,
      },
       uniformScaleRange: [1, 1],
       rotationPerObject: {
         tree1: { y: [0, Math.PI * 2] }, // Random Y-axis rotation 0-360 degrees
         tree2: { y: [0, Math.PI * 2] }, // Random Y-axis rotation 0-360 degrees
       },
       spawnOffset: {
         tree1: new Vector3(0, 0, 0),
         tree2: new Vector3(0, 0, 130),
       },
      
    },
    {
      spawnTrigger: 'timer',
      spawnTriggerTime: 2000,
      spawnXrange: [200, 200],
      spawnZrange: [-70, -70],
      // spawnYrange: [25, 60],
      spawnYrange: [-32.5, -32.5],
      spawnLikelihood: {
        greenstrip: 1,
        roadstrip: 1,
        greenstrip2: 1,
  
      },
       uniformScaleRange: [1, 1],
      spawnOffset: {
        greenstrip: new Vector3(0, 0, 0),
        roadstrip: new Vector3(0, 0, -8),
        greenstrip2: new Vector3(0, 0, 125),
       },
       
    },
     {
      spawnTrigger: 'timer',
      spawnTriggerTime: 5000,
      spawnXrange: [60, 60],
      spawnZrange: [-15, -15],
      spawnYrange: [60, 60],
      spawnLikelihood: {
        bird: 1,
      },
      scaleRangeX: [1, 1],
      scaleRangeY: [1, 1],
      scaleRangeZ: [1, 1],
    },
      {
      spawnTrigger: 'timer',
      spawnTriggerTime: 5000,
      spawnXrange: [60, 60],
      spawnZrange: [-15, 50],
      spawnYrange: [50, 50],
      spawnLikelihood: {
        obstacle: 1,
      },
      scaleRangeX: [1, 1],
      scaleRangeY: [1, 1],
      scaleRangeZ: [1, 1],
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

