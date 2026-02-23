/**
 * @file dslConfigs.ts
 * @description Registry of all bundled GameDSLConfig presets. Provides a typed
 * array of configs and a helper to look up a config by its ID.
 *
 * Key exports:
 *  - dslConfigs: DSLConfigOption[] — all available presets
 *  - getDSLConfigById: look up a config by its string ID
 */

import { GameDSLConfig } from '@smallgami/engine';
import testConfig from './testConfig';
import cr_forest from './cr_forest';
import cr_persimon_a from './cr_persimon_a';
import dc_apple from './dc_apple';
import dr_boat from './dr_boat';
import s_popcorn from './s_popcorn';
import s_pizza_a from './s_pizza_a';
import s_spaceinvader from './s_spaceinvader';

export interface DSLConfigOption {
  id: string;
  name: string;
  config: GameDSLConfig;
  filename: string;
}

export const dslConfigs: DSLConfigOption[] = [
  {
    id: 'testConfig',
    name: 'Test Config',
    config: testConfig,
    filename: 'testConfig.ts',
  },
  {
    id: 'cr_forest',
    name: 'Cartoon Runner - Forest',
    config: cr_forest,
    filename: 'cr_forest.ts',
  },
  {
    id: 'cr_persimon_a',
    name: 'Cartoon Runner - Persimon',
    config: cr_persimon_a,
    filename: 'cr_persimon_a.ts',
  },
  {
    id: 'dc_apple',
    name: 'Dodge & Catch - Apple',
    config: dc_apple,
    filename: 'dc_apple.ts',
  },
  {
    id: 'dr_boat',
    name: 'Dodge Runner - Boat',
    config: dr_boat,
    filename: 'dr_boat.ts',
  },
  {
    id: 's_popcorn',
    name: 'Shooter - Popcorn',
    config: s_popcorn,
    filename: 's_popcorn.ts',
  },
  {
    id: 's_pizza_a',
    name: 'Shooter - Pizza',
    config: s_pizza_a,
    filename: 's_pizza_a.ts',
  },
  {
    id: 's_spaceinvader',
    name: 'Shooter - Space Invader',
    config: s_spaceinvader,
    filename: 's_spaceinvader.ts',
  },
];

export const getDSLConfigById = (id: string): GameDSLConfig | undefined => {
  return dslConfigs.find(cfg => cfg.id === id)?.config;
};

