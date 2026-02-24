import type { GameDSLConfig } from '@smallgami/engine';

// Classic bowling lane — line up the shot, roll the ball, knock down all 10 pins.
// A new rack respawns once the timer cycles.
const bowling: GameDSLConfig = {
  id: 'bowling',
  name: 'Bowling',
  mechanism: 'throw_to_target',
  assets: {
    models: { player: '', pin: '' },
    sounds: {
      ambient:                  { file: 'test_audio.mp3', volume: 0.04, loop: true },
      jump:                     { file: 'jump_sound.mp3' },
      collision_player_pin:     { file: 'catch_gift_sound2.wav' },
    },
    skybox: '',
    ground: '',
  },
  player: {
    description: 'a bowler at the end of the lane',
    size: 8,
    jumpPower: 0,
    moveSpeed: 28,
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
      speed: 8,
      maxCount: 1,           // one ball in play at a time
      cooldown: 180,
      shape: { width: 5, height: 5, depth: 5 },
      maxDistance: 145,
      color: { r: 0.15, g: 0.15, b: 0.85 },
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
    description: 'a polished hardwood bowling lane — line up your shot and roll',
    gravityMultiplier: 1,
    hasGround: true,
    ground: { width: 400, height: 10, depth: 400, posY: -35 },
    cameraType: 'ortho',
    cameraFovScale: 1,
    cameraTargetDelta:  [0, 7, 0],
    cameraAlphaDelta:   14,
    cameraBetaDelta:    0,
    cameraRadiusDelta:  0,
    HemisphericLight: { intensity: 0.70, color: [1.0, 0.95, 0.85], direction: [0, 0.3, 0.2] },
    DirectionalLight: { intensity: 0.50, color: [1.0, 0.95, 0.90], direction: [0, -0.85, 1] },
    BottomLight:      { intensity: 0.15, color: [0.80, 0.80, 0.70], direction: [0, 1, 0] },
    skyboxType: 'sphere',
    particles: {
      maxStars: 8,
      ratioOfBlinkers: 0.3,
      size: { min: 0.2, max: 0.4 },
      colors: [[1, 1, 0.9, 0.2]],
      movement: {
        pattern: 'drift',
        direction: 'up',
        speed: 0.03,
        oscillation: { amplitude: 0.5, frequency: 0.03 },
      },
      blinking: { minInterval: 1000, maxInterval: 3000 },
      texture: { path: '/texture/star.png', dimensions: { width: 128, height: 128 } },
    },
    fog: { enabled: false, color: [0.5, 0.5, 0.4], start: 300, end: 800, mode: 'linear' },
  },
  objects: [
    {
      name: 'pin',
      id: 'pin',
      size: { x: 4, y: 9, z: 4 } as any,
      onPlayerCollision:     { player: 'none', object: 'dispose' },
      onProjectileCollision: { object: 'dispose', projectile: 'dispose' },
      onGroundCollision: 'none',
      initialSpeed: { x: 0, y: 0, z: 0 } as any,  // pins are stationary
      score: 10,
      motionType: 1,
      physics: { mass: 0, restitution: 0, friction: 0 },
    },
  ],
  spawn: [
    // 10-pin triangle — re-rack every 12 s
    // Row 1 (front) — 1 pin
    { spawnTrigger: 'once', spawnTriggerTime: 200,  spawnXrange: [0,    0  ], spawnZrange: [-5, -5], spawnYrange: [40, 40], spawnLikelihood: { pin: 1 }, scaleRangeX: [1, 1], scaleRangeY: [1, 1], scaleRangeZ: [1, 1] },
    // Row 2 — 2 pins
    { spawnTrigger: 'once', spawnTriggerTime: 200,  spawnXrange: [-5,  -5 ], spawnZrange: [-5, -5], spawnYrange: [48, 48], spawnLikelihood: { pin: 1 }, scaleRangeX: [1, 1], scaleRangeY: [1, 1], scaleRangeZ: [1, 1] },
    { spawnTrigger: 'once', spawnTriggerTime: 200,  spawnXrange: [5,    5  ], spawnZrange: [-5, -5], spawnYrange: [48, 48], spawnLikelihood: { pin: 1 }, scaleRangeX: [1, 1], scaleRangeY: [1, 1], scaleRangeZ: [1, 1] },
    // Row 3 — 3 pins
    { spawnTrigger: 'once', spawnTriggerTime: 200,  spawnXrange: [-10, -10], spawnZrange: [-5, -5], spawnYrange: [56, 56], spawnLikelihood: { pin: 1 }, scaleRangeX: [1, 1], scaleRangeY: [1, 1], scaleRangeZ: [1, 1] },
    { spawnTrigger: 'once', spawnTriggerTime: 200,  spawnXrange: [0,    0  ], spawnZrange: [-5, -5], spawnYrange: [56, 56], spawnLikelihood: { pin: 1 }, scaleRangeX: [1, 1], scaleRangeY: [1, 1], scaleRangeZ: [1, 1] },
    { spawnTrigger: 'once', spawnTriggerTime: 200,  spawnXrange: [10,  10  ], spawnZrange: [-5, -5], spawnYrange: [56, 56], spawnLikelihood: { pin: 1 }, scaleRangeX: [1, 1], scaleRangeY: [1, 1], scaleRangeZ: [1, 1] },
    // Row 4 — 4 pins
    { spawnTrigger: 'once', spawnTriggerTime: 200,  spawnXrange: [-15, -15], spawnZrange: [-5, -5], spawnYrange: [64, 64], spawnLikelihood: { pin: 1 }, scaleRangeX: [1, 1], scaleRangeY: [1, 1], scaleRangeZ: [1, 1] },
    { spawnTrigger: 'once', spawnTriggerTime: 200,  spawnXrange: [-5,  -5 ], spawnZrange: [-5, -5], spawnYrange: [64, 64], spawnLikelihood: { pin: 1 }, scaleRangeX: [1, 1], scaleRangeY: [1, 1], scaleRangeZ: [1, 1] },
    { spawnTrigger: 'once', spawnTriggerTime: 200,  spawnXrange: [5,    5  ], spawnZrange: [-5, -5], spawnYrange: [64, 64], spawnLikelihood: { pin: 1 }, scaleRangeX: [1, 1], scaleRangeY: [1, 1], scaleRangeZ: [1, 1] },
    { spawnTrigger: 'once', spawnTriggerTime: 200,  spawnXrange: [15,  15  ], spawnZrange: [-5, -5], spawnYrange: [64, 64], spawnLikelihood: { pin: 1 }, scaleRangeX: [1, 1], scaleRangeY: [1, 1], scaleRangeZ: [1, 1] },
    // Re-rack after 12 s
    { spawnTrigger: 'timer', spawnTriggerTime: 12000, spawnXrange: [-5,  5 ], spawnZrange: [-5, -5], spawnYrange: [40, 64], spawnLikelihood: { pin: 0.5 }, scaleRangeX: [1, 1], scaleRangeY: [1, 1], scaleRangeZ: [1, 1] },
  ],
};

export default bowling;
