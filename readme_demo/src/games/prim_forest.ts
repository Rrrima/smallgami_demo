import type { GameDSLConfig } from '@smallgami/engine';
import base from './orig_forest';

// Primitive (polygon-mode) variant — identical mechanics, no asset files.
const primForest: GameDSLConfig = {
  ...base,
  id: 'prim_runner',
  name: 'runner',
  assets: { models: { player: '', tree: '', tree2: '', pinecone: '' }, skybox: '', ground: '' },
  world: {
    ...base.world,
    particles: { ...base.world.particles!, maxStars: 0 },
    fog:       { ...base.world.fog!,       enabled:  false },
  },
};

export default primForest;
