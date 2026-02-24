import type { GameDSLConfig } from '@smallgami/engine';
import base from './orig_flappybird';

// Primitive (polygon-mode) variant — identical mechanics, no asset files.
const primFlappyBird: GameDSLConfig = {
  ...base,
  id: 'prim_flappy_bird',
  name: 'flappybird',
  assets: { models: { player: '', box1: '', box2: '', score: '', player_jump: '' }, skybox: '', ground: '' },
  world: {
    ...base.world,
    particles: { ...base.world.particles!, maxStars: 0 },
    fog:       { ...base.world.fog!,       enabled:  false },
  },
};

export default primFlappyBird;
