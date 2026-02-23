import type { GameDSLConfig } from '@smallgami/engine';
import base from './orig_popcorn';

// Primitive (polygon-mode) variant — identical mechanics, no asset files.
const primPopcorn: GameDSLConfig = {
  ...base,
  id: 'prim_s_popcorn',
  assets: { models: { player: '', container: '', counter: '' }, skybox: '', ground: '' },
  world: {
    ...base.world,
    particles: { ...base.world.particles!, maxStars: 0 },
    fog:       { ...base.world.fog!,       enabled:  false },
  },
};

export default primPopcorn;
