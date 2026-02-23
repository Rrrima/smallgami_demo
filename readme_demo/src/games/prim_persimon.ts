import type { GameDSLConfig } from '@smallgami/engine';
import base from './orig_persimon';

// Primitive (polygon-mode) variant — identical mechanics, no asset files.
const primPersimon: GameDSLConfig = {
  ...base,
  id: 'prim_cr_persimon',
  assets: { models: { player: '', box1: '', box2: '', box3: '', player_jump: '' }, skybox: '', ground: '' },
  world: {
    ...base.world,
    particles: { ...base.world.particles!, maxStars: 0 },
    fog:       { ...base.world.fog!,       enabled:  false },
  },
};

export default primPersimon;
