/**
 * @file gameStore.ts
 * @description Static mapping of game IDs to their bundled GameDSLConfig JSON
 * files. Used by App.tsx to load the initial configuration on startup.
 *
 * Key exports:
 *  - gameStore: Record<string, GameDSLConfig>
 */

import { GameDSLConfig } from '@smallgami/engine';
import christmas from './christmas.json';
import flappyBird from './flappy_bird.json';
import platformForest from './platform_forest.json';
import runningChristmas from './running_christmas.json';
import { testConfig as crPersimonA } from './cr_persimon_a';

// Game store mapping game IDs to their configurations
const gameStore: Record<string, GameDSLConfig> = {
  cr_persimon_a: crPersimonA,
  christmas: christmas as unknown as GameDSLConfig,
  flappy_bird: flappyBird as unknown as GameDSLConfig,
  platform_forest: platformForest as unknown as GameDSLConfig,
  running_christmas: runningChristmas as unknown as GameDSLConfig,
};

export default gameStore;
