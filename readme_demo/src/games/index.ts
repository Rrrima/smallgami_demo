import type { GameDSLConfig } from '@smallgami/engine';

import flappyBird       from './orig_flappybird';
import forest           from './orig_forest';
import persimon         from './orig_persimon';
import apple            from './orig_apple';
import boat             from './orig_boat';
import popcorn          from './orig_popcorn';
import pizza            from './orig_pizza';
import spaceInvader     from './orig_spaceinvader';

import primFlappyBird   from './prim_flappybird';   // "flappybird"    — Dodge
import primForest       from './prim_forest';        // "runner"        — Dodge (shared by forest + boat)
import primApple        from './prim_apple';         // "side_view_catch" — Catcher (shared by persimon + apple)
import primShootDown    from './prim_shoot_down';    // "shoot downwards" — Shooter (shared by popcorn + pizza)
import primSpaceInvader from './prim_spaceinvader';  // "shoot upwards" — Shooter

export interface GameMeta {
  config:      GameDSLConfig;
  emoji:       string;
  tagline:     string;
  accentColor: string;
  controls:    string;
  /** True for polygon-mode (primitive mechanic) variants. */
  primitive?:  boolean;
  /** Config id of this game's primitive mechanic node. */
  primitiveId?: string;
}

export const games: GameMeta[] = [
  // ── Primitives ──────────────────────────────────────────────────────────────
  {
    config: primFlappyBird,
    emoji: '🐤',
    tagline: 'Dodge obstacles by flapping — pure reflex mechanic.',
    accentColor: '#f59e0b',
    controls: 'Space  flap',
    primitive: true,
  },
  {
    config: primForest,
    emoji: '🏃',
    tagline: 'Side-step and jump through obstacles — pure runner mechanic.',
    accentColor: '#f59e0b',
    controls: '← →  side-step   Space  jump',
    primitive: true,
  },
  {
    config: primApple,
    emoji: '🎯',
    tagline: 'Move to catch falling objects — pure side-view catcher mechanic.',
    accentColor: '#06b6d4',
    controls: '← → ↑ ↓  move',
    primitive: true,
  },
  {
    config: primShootDown,
    emoji: '🍿',
    tagline: 'Move and shoot downward into targets — pure shooter mechanic.',
    accentColor: '#818cf8',
    controls: '← →  move   Space  fire',
    primitive: true,
  },
  {
    config: primSpaceInvader,
    emoji: '👾',
    tagline: 'Move and shoot upward at descending enemies.',
    accentColor: '#818cf8',
    controls: '← →  move   Space  fire',
    primitive: true,
  },

  // ── Rendered games ───────────────────────────────────────────────────────────
  {
    config: flappyBird,
    emoji: '🐤',
    tagline: 'Tap to flap between pipes — one wrong move and it\'s game over.',
    accentColor: '#f59e0b',
    controls: 'Space  flap',
    primitiveId: 'prim_flappy_bird',
  },
  {
    config: forest,
    emoji: '🐻',
    tagline: 'A bear sprints through the forest — dodge trees, watch for pinecones.',
    accentColor: '#f59e0b',
    controls: '← →  side-step   Space  jump',
    primitiveId: 'prim_runner',
  },
  {
    config: boat,
    emoji: '🚢',
    tagline: 'Dodge icebergs on a frozen sea — one hit and you\'re done.',
    accentColor: '#f59e0b',
    controls: '← →  side-step   Space  jump',
    primitiveId: 'prim_runner',
  },
  {
    config: persimon,
    emoji: '🍊',
    tagline: 'A bear catches falling persimmons in an autumn orchard.',
    accentColor: '#06b6d4',
    controls: '← →  move   ↑  jump',
    primitiveId: 'prim_side_catcher',
  },
  {
    config: apple,
    emoji: '🎁',
    tagline: 'Catch gift boxes raining down — dodge the hazards.',
    accentColor: '#06b6d4',
    controls: '← → ↑ ↓  move   Space  jump',
    primitiveId: 'prim_side_catcher',
  },
  {
    config: popcorn,
    emoji: '🍿',
    tagline: 'Shoot popcorn into sliding containers — fill them up!',
    accentColor: '#818cf8',
    controls: '← →  move   Space  fire',
    primitiveId: 'prim_shoot_down',
  },
  {
    config: pizza,
    emoji: '🍕',
    tagline: 'Launch pizzas into sliding trays — time your shots!',
    accentColor: '#818cf8',
    controls: '← →  move   Space  fire',
    primitiveId: 'prim_shoot_down',
  },
  {
    config: spaceInvader,
    emoji: '👾',
    tagline: 'An alien grid descends — shoot them all before they reach you.',
    accentColor: '#818cf8',
    controls: '← →  move   Space  fire',
    primitiveId: 'prim_shoot_up',
  },
];
