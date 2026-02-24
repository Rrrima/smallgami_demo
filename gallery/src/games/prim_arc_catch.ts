import type { GameDSLConfig } from '@smallgami/engine';
import base from './orig_fruit_ninja';

// Primitive (polygon-mode) variant — pure arc-catch mechanic, no assets.
// Objects launch from both sides and arc through the air; player intercepts them.
const primArcCatch: GameDSLConfig = {
  ...base,
  id: 'prim_arc_catch',
  name: 'arc_catch',
  assets: { models: { player: '', fruit_l: '', fruit_r: '', bomb: '' }, skybox: '', ground: '' },
  world: {
    ...base.world,
    particles: { ...base.world.particles!, maxStars: 0 },
    fog:       { ...base.world.fog!,       enabled:  false },
  },
};

export default primArcCatch;
