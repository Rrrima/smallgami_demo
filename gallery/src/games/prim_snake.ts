import type { GameDSLConfig } from '@smallgami/engine';

// Primitive (polygon-mode) — top-down snake navigator.
// Player moves in 4 directions, collecting items that increase score.
// Hazards spawn over time, filling the arena — the longer you survive the harder
// it gets.  No gravity, no shooting, pure navigation skill.
const primSnake: GameDSLConfig = {
  id: 'prim_snake',
  name: 'snake',
  mechanism: 'navigator',
  assets: { models: { player: '', food: '', wall: '' }, skybox: '', ground: '' },
  player: {
    description: 'player',
    size: 4,
    jumpPower: 0,
    moveSpeed: 30,
    friction: 10,
    mass: 10,
    restitution: 0,
    jumpAnimationDuration: 300,
    jumpSquishScale: 1,
    jumpStretchScale: 1,
    jumpOnlyOnGround: true,
    maxJumpCount: 0,
    jumpInterval: 500,
    bullets: {
      speed: 0,
      maxCount: 0,
      cooldown: 99999,
      shape: { width: 1, height: 1, depth: 1 },
      maxDistance: 0,
      color: { r: 1, g: 1, b: 1 },
      opacity: 0,
    },
    startPosition: { x: 0, y: 0, z: 0 },
  },
  controls: {
    moveLeft:      ['arrowleft',  'a'],
    moveRight:     ['arrowright', 'd'],
    moveforward:   ['arrowup',   'w'],
    movebackward:  ['arrowdown', 's'],
    jump:          [''],
    squeezeToJump: [''],
    fireBullet:    [''],
    bulletLeft:    [''],
    bulletRight:   [''],
  },
  world: {
    description: 'top-down snake arena',
    gravityMultiplier: 0,
    hasGround: true,
    ground: { width: 400, height: 1, depth: 400, posY: -5 },
    cameraType: 'ortho',
    cameraFovScale: 1,
    cameraTargetDelta:  [0, 0, 0],
    cameraAlphaDelta:   0,
    cameraBetaDelta:    0,
    cameraRadiusDelta:  0,
    HemisphericLight: { intensity: 0.7, color: [1, 1, 1],       direction: [0, 1, 0] },
    DirectionalLight: { intensity: 0.3, color: [0.9, 0.9, 0.9], direction: [0, -1, 0.5] },
    BottomLight:      { intensity: 0.1, color: [0.9, 0.9, 0.9], direction: [0, 1, 0] },
    skyboxType: 'sphere',
    particles: {
      maxStars: 0,
      ratioOfBlinkers: 0,
      size: { min: 0.1, max: 0.3 },
      colors: [[1, 1, 1, 0.3]],
      movement: {
        pattern: 'drift',
        direction: 'down',
        speed: 0.05,
        oscillation: { amplitude: 0.5, frequency: 0.03 },
      },
      blinking: { minInterval: 1000, maxInterval: 3000 },
      texture: { path: '/texture/star.png', dimensions: { width: 128, height: 128 } },
    },
    fog: { enabled: false, color: [0.3, 0.3, 0.3], start: 200, end: 800, mode: 'linear' },
  },
  objects: [
    {
      name: 'food',
      id: 'food',
      size: { x: 3, y: 3, z: 3 } as any,
      onPlayerCollision:     { player: 'score', object: 'dispose' },
      onProjectileCollision: { object: 'none', projectile: 'none' },
      onGroundCollision: 'none',
      initialSpeed: { x: 0, y: 0, z: 0 } as any,
      score: 10,
      motionType: 0,
      physics: { mass: 0, restitution: 0, friction: 0 },
    },
    {
      name: 'wall',
      id: 'wall',
      size: { x: 4, y: 4, z: 4 } as any,
      onPlayerCollision:     { player: 'none', object: 'none' },
      onProjectileCollision: { object: 'none', projectile: 'none' },
      onGroundCollision: 'none',
      initialSpeed: { x: 0, y: 0, z: 0 } as any,
      motionType: 0,
      physics: { mass: 0, restitution: 0, friction: 0 },
    },
  ],
  spawn: [
    // Initial food items
    { spawnTrigger: 'once', spawnTriggerTime: 100,  spawnXrange: [-20, 20], spawnZrange: [-20, 20], spawnYrange: [0, 0], spawnLikelihood: { food: 1 }, scaleRangeX: [1, 1], scaleRangeY: [1, 1], scaleRangeZ: [1, 1] },
    { spawnTrigger: 'once', spawnTriggerTime: 100,  spawnXrange: [-20, 20], spawnZrange: [-20, 20], spawnYrange: [0, 0], spawnLikelihood: { food: 1 }, scaleRangeX: [1, 1], scaleRangeY: [1, 1], scaleRangeZ: [1, 1] },
    { spawnTrigger: 'once', spawnTriggerTime: 100,  spawnXrange: [-20, 20], spawnZrange: [-20, 20], spawnYrange: [0, 0], spawnLikelihood: { food: 1 }, scaleRangeX: [1, 1], scaleRangeY: [1, 1], scaleRangeZ: [1, 1] },
    // Continuous food respawn
    { spawnTrigger: 'timer', spawnTriggerTime: 3000, spawnXrange: [-22, 22], spawnZrange: [-22, 22], spawnYrange: [0, 0], spawnLikelihood: { food: 0.9 }, scaleRangeX: [0.8, 1.1], scaleRangeY: [0.8, 1.1], scaleRangeZ: [0.8, 1.1] },
    // Walls accumulate over time, shrinking navigable space
    { spawnTrigger: 'timer', spawnTriggerTime: 5000, spawnXrange: [-25, 25], spawnZrange: [-25, 25], spawnYrange: [0, 0], spawnLikelihood: { wall: 0.6 }, scaleRangeX: [1, 2], scaleRangeY: [1, 1], scaleRangeZ: [1, 2] },
  ],
};

export default primSnake;
