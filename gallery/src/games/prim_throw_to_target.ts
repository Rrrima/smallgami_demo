import type { GameDSLConfig } from '@smallgami/engine';

// Primitive (polygon-mode) — throw / shoot objects at stationary targets scattered
// across the arena.  Player aims by moving left/right; targets drift slowly so
// timing matters.  Shared mechanic for Pokemon Go and Bowling.
const primThrowToTarget: GameDSLConfig = {
  id: 'prim_throw_to_target',
  name: 'throw_to_target',
  mechanism: 'throw_to_target',
  assets: { models: { player: '', target: '' }, skybox: '', ground: '' },
  player: {
    description: 'player',
    size: 8,
    jumpPower: 0,
    moveSpeed: 38,
    friction: 0,
    mass: 10,
    restitution: 0,
    jumpAnimationDuration: 300,
    jumpSquishScale: 0.9,
    jumpStretchScale: 1.1,
    jumpOnlyOnGround: true,
    maxJumpCount: 0,
    jumpInterval: 500,
    bullets: {
      speed: 6,
      maxCount: 3,
      cooldown: 70,
      shape: { width: 4, height: 4, depth: 4 },
      maxDistance: 130,
      color: { r: 1, g: 0.4, b: 0.1 },
      opacity: 1,
    },
    startPosition: { x: 0, y: -28, z: 0 },
  },
  controls: {
    moveLeft:      ['arrowleft',  'a'],
    moveRight:     ['arrowright', 'd'],
    jump:          [''],
    squeezeToJump: [''],
    fireBullet:    [' '],
    bulletLeft:    [''],
    bulletRight:   [''],
  },
  world: {
    description: 'throw-to-target arena',
    gravityMultiplier: 1,
    hasGround: true,
    ground: { width: 400, height: 10, depth: 400, posY: -35 },
    cameraType: 'ortho',
    cameraFovScale: 1,
    cameraTargetDelta:  [0, 7, 0],
    cameraAlphaDelta:   14,
    cameraBetaDelta:    0,
    cameraRadiusDelta:  0,
    HemisphericLight: { intensity: 0.6, color: [1, 1, 1],       direction: [0, 0.3, 0.2] },
    DirectionalLight: { intensity: 0.4, color: [0.9, 0.9, 0.9], direction: [0, -0.85, 1] },
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
      name: 'target',
      id: 'target',
      size: { x: 6, y: 6, z: 6 } as any,
      onPlayerCollision:     { player: 'none', object: 'dispose' },
      onProjectileCollision: { object: 'dispose', projectile: 'dispose' },
      onGroundCollision: 'none',
      initialSpeed: { x: 7, y: 0, z: 0 } as any,  // slow side drift — must time the throw
      score: 10,
      motionType: 1,
      physics: { mass: 0, restitution: 0, friction: 0 },
    },
  ],
  spawn: [
    // Initial spread of targets
    { spawnTrigger: 'once', spawnTriggerTime: 100, spawnXrange: [-22, -22], spawnZrange: [-5, -5], spawnYrange: [18, 18], spawnLikelihood: { target: 1 }, scaleRangeX: [1, 1], scaleRangeY: [1, 1], scaleRangeZ: [1, 1] },
    { spawnTrigger: 'once', spawnTriggerTime: 100, spawnXrange: [0,    0  ], spawnZrange: [-5, -5], spawnYrange: [28, 28], spawnLikelihood: { target: 1 }, scaleRangeX: [1, 1], scaleRangeY: [1, 1], scaleRangeZ: [1, 1] },
    { spawnTrigger: 'once', spawnTriggerTime: 100, spawnXrange: [22,   22 ], spawnZrange: [-5, -5], spawnYrange: [18, 18], spawnLikelihood: { target: 1 }, scaleRangeX: [1, 1], scaleRangeY: [1, 1], scaleRangeZ: [1, 1] },
    // Continuous stream
    { spawnTrigger: 'timer', spawnTriggerTime: 3500, spawnXrange: [-30, 30], spawnZrange: [-5, -5], spawnYrange: [14, 38], spawnLikelihood: { target: 0.75 }, scaleRangeX: [0.8, 1.3], scaleRangeY: [0.8, 1.3], scaleRangeZ: [0.8, 1.3] },
  ],
};

export default primThrowToTarget;
