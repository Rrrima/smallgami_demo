import type { GameDSLConfig } from '@smallgami/engine';
import base from './orig_apple';

// Primitive (polygon-mode) variant — identical mechanics, no asset files.
const primApple: GameDSLConfig = {
  ...base,
  id: 'prim_side_catcher',
  name: 'side_view_catch',
  assets: { models: { player: '', box1: '', box2: '', box3: '' }, skybox: '', ground: '' },
  world: {
    ...base.world,
    particles: { ...base.world.particles!, maxStars: 0 },
    fog:       { ...base.world.fog!,       enabled:  false },
  },
};

export default primApple;
