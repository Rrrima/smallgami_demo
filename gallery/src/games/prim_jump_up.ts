import type { GameDSLConfig } from '@smallgami/engine';
import base from './orig_doodle_jump';

// Primitive (polygon-mode) variant — pure jump-upwards mechanic, no assets.
const primJumpUp: GameDSLConfig = {
  ...base,
  id: 'prim_jump_up',
  name: 'jump_upwards',
  assets: { models: { player: '', platform: '', monster: '' }, skybox: '', ground: '' },
  world: {
    ...base.world,
    particles: { ...base.world.particles!, maxStars: 0 },
    fog:       { ...base.world.fog!,       enabled:  false },
  },
};

export default primJumpUp;
