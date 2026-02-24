import type { GameDSLConfig } from '@smallgami/engine';
import base from './orig_platform';

// Primitive (polygon-mode) variant — sideway platformer mechanic, no assets.
const primPlatform: GameDSLConfig = {
  ...base,
  id: 'prim_sideway_platform',
  name: 'sideway_platformer',
  assets: { models: { player: '', spike: '', coin: '' }, skybox: '', ground: '' },
  world: {
    ...base.world,
    particles: { ...base.world.particles!, maxStars: 0 },
    fog:       { ...base.world.fog!,       enabled:  false },
  },
};

export default primPlatform;
