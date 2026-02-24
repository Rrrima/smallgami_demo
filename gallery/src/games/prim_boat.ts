import type { GameDSLConfig } from '@smallgami/engine';
import base from './orig_boat';

// Primitive (polygon-mode) variant — identical mechanics, no asset files.
const primBoat: GameDSLConfig = {
  ...base,
  id: 'prim_dr_boat',
  assets: { models: { player: '', iceberg: '', icebreak: '', box3: '' }, skybox: '', ground: '' },
  world: {
    ...base.world,
    particles: { ...base.world.particles!, maxStars: 0 },
    fog:       { ...base.world.fog!,       enabled:  false },
  },
};

export default primBoat;
