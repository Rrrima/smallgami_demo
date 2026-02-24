import type { GameDSLConfig } from '@smallgami/engine';
import base from './orig_spaceinvader';

// Primitive (polygon-mode) variant — identical mechanics, no asset files.
const primSpaceInvader: GameDSLConfig = {
  ...base,
  id: 'prim_shoot_up',
  name: 'shoot_upwards',
  assets: { models: { player: '', alien: '', alien2: '', pinecone: '' }, skybox: '', ground: '' },
  world: {
    ...base.world,
    particles: { ...base.world.particles!, maxStars: 0 },
    fog:       { ...base.world.fog!,       enabled:  false },
  },
};

export default primSpaceInvader;
