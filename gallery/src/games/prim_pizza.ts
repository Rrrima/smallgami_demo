import type { GameDSLConfig } from '@smallgami/engine';
import base from './orig_pizza';

// Primitive (polygon-mode) variant — identical mechanics, no asset files.
const primPizza: GameDSLConfig = {
  ...base,
  id: 'prim_s_pizza',
  assets: { models: { player: '', container: '', counter: '' }, skybox: '', ground: '' },
  world: {
    ...base.world,
    particles: { ...base.world.particles!, maxStars: 0 },
    fog:       { ...base.world.fog!,       enabled:  false },
  },
};

export default primPizza;
