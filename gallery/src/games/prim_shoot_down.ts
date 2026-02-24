import type { GameDSLConfig } from '@smallgami/engine';
import base from './orig_popcorn';

// Primitive (polygon-mode) variant — shared mechanic for all downward-shooting games.
const primShootDown: GameDSLConfig = {
  ...base,
  id: 'prim_shoot_down',
  name: 'shoot_downwards',
  assets: { models: { player: '', container: '', counter: '' }, skybox: '', ground: '' },
  world: {
    ...base.world,
    particles: { ...base.world.particles!, maxStars: 0 },
    fog:       { ...base.world.fog!,       enabled:  false },
  },
};

export default primShootDown;
