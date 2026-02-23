import { GameDSLConfig } from '@smallgami/engine';
import { Vector3 } from '@babylonjs/core';

export const testConfig: GameDSLConfig = {
  id: 'testConfig',
  name: 'Test Config',
  mechanism: 'dodge_and_catch',
  assets: {
    models: {
      player: 'running_figure.glb',
      // player: '',
      // box1: '',
      // box2: '',
      sewing_machine: 'sewing_machine.glb',
      window: 'window.glb',
      shelf: 'shelf.glb',
      curtain: 'curtain.glb',
      thread:"thred.glb",
      // web: 'web.glb',
      voodoo3: 'voodoo3.glb',
      dead_doll: 'dead_doll.glb',
      desk: "broken_desk.glb"
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
    skybox: 'wall.png',
    ground: 'floorboard.png',
  },
  player: {
    description: '',
    size: 12,
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
      x: 10,
      y: 0,
      z: 100,
    },
    initialRotation: [0, Math.PI, 0],
  },
  controls: {
    moveLeft: ['arrowleft'],
    moveRight: ['arrowright'],
    moveforward: ['arrowup', 'w'],
    movebackward: ['arrowdown', 's'],
    jump: [' ', ''],
    squeezeToJump: [''],
    fireBullet: [''],
    bulletLeft: [''],
    bulletRight: [''],
  },
  world: {
    description: 'test world environment',
    gravityMultiplier: 1.3,
    skyboxSize: 300,
    hasGround: true,
    ground: {
      width: 400,
      height: 10,
      depth: 400,
      posY: -20,
    },
    cameraType:'tracking',
    cameraFovScale: 1,
    cameraTargetDelta: [0, -7, 100],
    cameraAlphaDelta: 0,
    cameraBetaDelta: 10,
    cameraRadiusDelta: 60,
    HemisphericLight: {
      intensity: 0,
      color: [1, 1, 1],
      direction: [0, 1, 0],
    },
    DirectionalLight: {
      intensity: 1,
      color: [0.9, 0.9, 0.9],
      direction: [0, -0.85, 1],
    },
    BottomLight: {
      intensity: 0,
      color: [0.9, 0.9, 0.9],
      direction: [0, 1, 0],
    },
    skyboxType: 'box',
    skyboxLightIntensity: 0.25,
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
      enabled: true,
      color: [0.1, 0.1, 0.1],
      start: 0,
      end: 800,
      density: 0.1,
      mode: 'exponential',
    },
  },
  objects: [
     {
      name: 'sewing_machine',
      id: 'sewing_machine',
      size: new Vector3(70, 70, 70),
      onPlayerCollision: {
        player: 'none',
        object: 'none',
      },
      onProjectileCollision: {
        object: 'none',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(0, 0, 0),
       motionType: 0,
      physics: {
        mass: 0,
        restitution: 0,
        friction: 0,
      },
      initialRotation: new Vector3(0, -Math.PI/3, 0),
    },
     {
      name: 'window',
      id: 'window',
      size: new Vector3(110, 110, 110),
      onPlayerCollision: {
        player: 'none',
        object: 'none',
      },
      onProjectileCollision: {
        object: 'none',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(0, 0, 0),
       motionType: 0,
      physics: {
        mass: 0,
        restitution: 0,
        friction: 0,
      },
       initialRotation: new Vector3(0, 0, 0),
      
    },
     {
      name: 'curtain',
      id: 'curtain',
      size: new Vector3(100, 100, 100),
      onPlayerCollision: {
        player: 'none',
        object: 'none',
      },
      onProjectileCollision: {
        object: 'none',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(0, 0, 0),
       motionType: 0,
      physics: {
        mass: 0,
        restitution: 0,
        friction: 0,
      },
      initialRotation: new Vector3(0, 0, 0),
    },
     {
      name: 'shelf',
      id: 'shelf',
      size: new Vector3(30, 30, 30),
      onPlayerCollision: {
        player: 'none',
        object: 'none',
      },
      onProjectileCollision: {
        object: 'none',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(0, 0, 0),
       motionType: 0,
      physics: {
        mass: 0,
        restitution: 0,
        friction: 0,
      },
      initialRotation: new Vector3(0, 0, 0),
    },
     {
      name: 'desk',
      id: 'desk',
      size: new Vector3(20, 20, 20),
      onPlayerCollision: {
        player: 'none',
        object: 'none',
      },
      onProjectileCollision: {
        object: 'none',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(0, 0, 0),
       motionType: 0,
      physics: {
        mass: 0,
        restitution: 0,
        friction: 0,
      },
      initialRotation: new Vector3(0, 0, 0),
    },
      {
      name: 'voodoo3',
      id: 'voodoo3',
      size: new Vector3(12, 12, 12),
      onPlayerCollision: {
        player: 'none',
        object: 'none',
      },
      onProjectileCollision: {
        object: 'none',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(0, 0, 0),
       motionType: 0,
      physics: {
        mass: 0,
        restitution: 0,
        friction: 0,
      },
      initialRotation: new Vector3(0, 0, 0),
    },
      {
      name: 'creepy_doll',
      id: 'creepy_doll',
      size: new Vector3(10, 10, 10),
      onPlayerCollision: {
        player: 'none',
        object: 'none',
      },
      onProjectileCollision: {
        object: 'none',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(0, 0, 0),
       motionType: 0,
      physics: {
        mass: 0,
        restitution: 0,
        friction: 0,
      },
      initialRotation: new Vector3(0, 0, 0),
    },
       {
      name: 'dead_doll',
      id: 'dead_doll',
      size: new Vector3(8, 8, 8),
      onPlayerCollision: {
        player: 'none',
        object: 'none',
      },
      onProjectileCollision: {
        object: 'none',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(0, 0, 0),
       motionType: 0,
      physics: {
        mass: 0,
        restitution: 0,
        friction: 0,
      },
      initialRotation: new Vector3(0,0, 0),
    },
    {
      name: 'thread',
      id: 'thread',
      size: new Vector3(8, 8, 8),
      onPlayerCollision: {
        player: 'none',
        object: 'none',
      },
      onProjectileCollision: {
        object: 'none',
        projectile: 'dispose',
      },
      onGroundCollision: 'none',
      initialSpeed: new Vector3(0, 0, -120),
       motionType: 2,
      physics: {
        mass: 0.1,
        restitution: 0,
        friction: 0,
      },
       initialRotation: new Vector3(0, 0, Math.PI/2),
    },
    
    
     
     
  ],
  spawn: [
    {
      spawnTrigger: 'once',
      spawnTriggerTime: 0,
      spawnXrange: [-80, -80],
      spawnZrange: [-150, -150],
      spawnYrange: [-20, -20],
      spawnLikelihood: {
        sewing_machine: 1,
      },
      uniformScaleRange: [1, 1],
    },
     {
      spawnTrigger: 'once',
      spawnTriggerTime: 0,
      spawnXrange: [-20, -20],
      spawnZrange: [-190, -190],
      spawnYrange: [30, 30],
      spawnLikelihood: {
        window: 1,
      },
      uniformScaleRange: [1, 1],
    },
    {
      spawnTrigger: 'once',
      spawnTriggerTime: 0,
      spawnXrange: [-20, -20],
      spawnZrange: [-180, -180],
      spawnYrange: [33, 33],
      spawnLikelihood: {
        curtain: 1,
      },
      uniformScaleRange: [1, 1],
    },
       {
      spawnTrigger: 'once',
      spawnTriggerTime: 0,
      spawnXrange: [60, 60],
      spawnZrange: [-150, -150],
      spawnYrange: [12, 12],
      spawnLikelihood: {
        shelf: 1,
      },
      uniformScaleRange: [1, 1],
    },
     {
      spawnTrigger: 'once',
      spawnTriggerTime: 0,
      spawnXrange: [10, 10],
      spawnZrange: [-150, -150],
      spawnYrange: [0, 0],
      spawnLikelihood: {
        desk: 1,
      },
      uniformScaleRange: [1, 1],
    },
    {
      spawnTrigger: 'once',
      spawnTriggerTime: 0,
      spawnXrange: [-33, -33],
      spawnZrange: [-100, -100],
      spawnYrange: [-6, -6],
      spawnLikelihood: {
        dead_doll: 1,
      },
      uniformScaleRange: [1, 1],
    },
    {
      spawnTrigger: 'timer',
      spawnTriggerTime: 200,
      spawnXrange: [-33, 33],
      spawnZrange: [-100, -100],
      spawnYrange: [0, 0],
      spawnLikelihood: {
        thread: 1,
      },
      uniformScaleRange: [1, 1.2],
    },
   
  ],
};

export default testConfig;

