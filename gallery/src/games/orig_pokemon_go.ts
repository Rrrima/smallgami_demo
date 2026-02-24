import type { GameDSLConfig } from '@smallgami/engine';

// Pokemon roam freely across a sunlit meadow — throw pokeballs to catch them
// before they wander off the edge.
const pokemonGo: GameDSLConfig = {
  id: 'pokemon_go',
  name: 'Pokémon Go',
  mechanism: 'throw_to_target',
  assets: {
    models: { player: '', pokemon: '', rare_pokemon: '' },
    sounds: {
      ambient:                    { file: 'test_audio.mp3', volume: 0.06, loop: true },
      jump:                       { file: 'jump_sound.mp3' },
      collision_player_pokemon:      { file: 'catch_gift_sound2.wav' },
      collision_player_rare_pokemon: { file: 'catch_gift_sound2.wav' },
    },
    skybox: '',
    ground: '',
  },
  player: {
    description: 'a Pokémon trainer ready to throw',
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
      speed: 5,
      maxCount: 5,
      cooldown: 50,
      shape: { width: 3, height: 3, depth: 3 },
      maxDistance: 130,
      color: { r: 0.9, g: 0.1, b: 0.1 },
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
    description: 'a sunlit meadow where wild Pokémon roam free',
    gravityMultiplier: 1,
    hasGround: true,
    ground: { width: 400, height: 10, depth: 400, posY: -35 },
    cameraType: 'ortho',
    cameraFovScale: 1,
    cameraTargetDelta:  [0, 7, 0],
    cameraAlphaDelta:   14,
    cameraBetaDelta:    0,
    cameraRadiusDelta:  0,
    HemisphericLight: { intensity: 0.65, color: [1.0, 0.95, 0.80], direction: [0, 0.3, 0.2] },
    DirectionalLight: { intensity: 0.50, color: [1.0, 0.90, 0.70], direction: [0.3, -0.8, 0.5] },
    BottomLight:      { intensity: 0.20, color: [0.80, 0.95, 0.60], direction: [0, 1, 0] },
    skyboxType: 'sphere',
    particles: {
      maxStars: 25,
      ratioOfBlinkers: 0.5,
      size: { min: 0.3, max: 0.6 },
      colors: [[0.6, 1, 0.4, 0.3]],
      movement: {
        pattern: 'drift',
        direction: 'up',
        speed: 0.04,
        oscillation: { amplitude: 1, frequency: 0.04 },
      },
      blinking: { minInterval: 800, maxInterval: 2000 },
      texture: { path: '/texture/star.png', dimensions: { width: 128, height: 128 } },
    },
    fog: { enabled: true, color: [0.7, 0.9, 0.5], start: 200, end: 700, mode: 'linear' },
  },
  objects: [
    {
      // Common Pokémon — wander at medium pace
      name: 'pokémon',
      id: 'pokemon',
      size: { x: 7, y: 7, z: 7 } as any,
      onPlayerCollision:     { player: 'none', object: 'dispose' },
      onProjectileCollision: { object: 'dispose', projectile: 'dispose' },
      onGroundCollision: 'none',
      initialSpeed: { x: 9, y: 0, z: 0 } as any,
      score: 10,
      motionType: 1,
      physics: { mass: 0, restitution: 0, friction: 0 },
    },
    {
      // Rare Pokémon — drifts faster, worth more
      name: 'rare pokémon',
      id: 'rare_pokemon',
      size: { x: 8, y: 8, z: 8 } as any,
      onPlayerCollision:     { player: 'none', object: 'dispose' },
      onProjectileCollision: { object: 'dispose', projectile: 'dispose' },
      onGroundCollision: 'none',
      initialSpeed: { x: 16, y: 0, z: 0 } as any,
      score: 30,
      motionType: 1,
      physics: { mass: 0, restitution: 0, friction: 0 },
    },
  ],
  spawn: [
    // Common Pokémon appear regularly
    { spawnTrigger: 'timer', spawnTriggerTime: 1800, spawnXrange: [-30, 30], spawnZrange: [-5, -5], spawnYrange: [5, 38], spawnLikelihood: { pokemon: 0.8 }, scaleRangeX: [0.7, 1.3], scaleRangeY: [0.7, 1.3], scaleRangeZ: [0.7, 1.3] },
    // Rare Pokémon appear occasionally
    { spawnTrigger: 'timer', spawnTriggerTime: 5000, spawnXrange: [-25, 25], spawnZrange: [-5, -5], spawnYrange: [10, 32], spawnLikelihood: { rare_pokemon: 0.45 }, scaleRangeX: [0.9, 1.1], scaleRangeY: [0.9, 1.1], scaleRangeZ: [0.9, 1.1] },
  ],
};

export default pokemonGo;
