import type { GameDSLConfig } from '@smallgami/engine';

import platform         from './orig_platform';
import doodleJump       from './orig_doodle_jump';
import flappyBird       from './orig_flappybird';
import forest           from './orig_forest';
import persimon         from './orig_persimon';
import apple            from './orig_apple';
import boat             from './orig_boat';
import popcorn          from './orig_popcorn';
import pizza            from './orig_pizza';
import spaceInvader     from './orig_spaceinvader';

import fruitNinja       from './orig_fruit_ninja';
import primArcCatch     from './prim_arc_catch';      // "arc_catch"           — Catcher
import primDodgeCatch   from './prim_dodge_catch';    // "dodge_and_catch"     — Catcher
import primFlappyBird   from './prim_flappybird';   // "flappybird"          — Dodge
import primForest       from './prim_forest';        // "runner"              — Dodge (shared by forest + boat)
import primApple        from './prim_apple';         // "side_view_catch"     — Catcher (shared by persimon + apple)
import primShootDown      from './prim_shoot_down';          // "shoot downwards"     — Shooter (shared by popcorn + pizza)
import primSpaceInvader   from './prim_spaceinvader';        // "shoot upwards"       — Shooter
import primThrowToTarget  from './prim_throw_to_target';     // "throw_to_target"     — Shooter (shared by pokemon_go + bowling)
import primPlatform       from './prim_platform';            // "sideway_platformer"  — Platform
import primJumpUp         from './prim_jump_up';             // "jump_upwards"        — Platform
import primCollectAll     from './prim_collect_all';         // "collect_all"         — Navigator
import primSnake          from './prim_snake';               // "snake"               — Navigator

import pokemonGo  from './orig_pokemon_go';
import bowling    from './orig_bowling';
import pacman     from './orig_pacman';
import snakeGame  from './orig_snake';

export interface GameMeta {
  config:      GameDSLConfig;
  emoji:       string;
  tagline:     string;
  accentColor: string;
  controls:    string;
  /** True for polygon-mode (primitive mechanic) variants. */
  primitive?:  boolean;
  /** Short abstract description of the primitive mechanic for info tooltips. */
  primitiveInfo?: string;
  /** Config id of this game's primitive mechanic node. */
  primitiveId?: string;
}

export const games: GameMeta[] = [
  // ── Primitives ──────────────────────────────────────────────────────────────
  {
    config: primPlatform,
    emoji: '🏃',
    tagline: 'Run and jump sideways through obstacles — pure sideway platformer mechanic.',
    accentColor: '#34d399',
    controls: '← →  move   ↑ Space  jump',
    primitive: true,
    primitiveInfo: 'Move horizontally across surfaces, jump between platforms, and avoid ground-level hazards.',
  },
  {
    config: primJumpUp,
    emoji: '🐸',
    tagline: 'Leap upward from platform to platform — pure jump-upwards mechanic.',
    accentColor: '#34d399',
    controls: '← →  move   ↑ Space  jump',
    primitive: true,
    primitiveInfo: 'Bounce ever upward from platform to platform. Fall below the screen and it\'s over.',
  },
  {
    config: primFlappyBird,
    emoji: '🐤',
    tagline: 'Dodge obstacles by flapping — pure reflex mechanic.',
    accentColor: '#f59e0b',
    controls: 'Space  flap',
    primitive: true,
    primitiveInfo: 'Tap to stay airborne while obstacles scroll toward you. Position is locked — only vertical control.',
  },
  {
    config: primForest,
    emoji: '🏃',
    tagline: 'Side-step and jump through obstacles — pure runner mechanic.',
    accentColor: '#f59e0b',
    controls: '← →  side-step   Space  jump',
    primitive: true,
    primitiveInfo: 'The world rushes past — side-step or jump to dodge incoming obstacles. Pure reaction.',
  },
  {
    config: primApple,
    emoji: '🎯',
    tagline: 'Move to catch falling objects — pure side-view collecting mechanic.',
    accentColor: '#06b6d4',
    controls: '← → ↑ ↓  move',
    primitive: true,
    primitiveInfo: 'Objects fall from above. Position yourself underneath to catch the good ones, avoid the bad.',
  },
  {
    config: primArcCatch,
    emoji: '🍉',
    tagline: 'Intercept objects that arc through the air from both sides — pure arc-catch mechanic.',
    accentColor: '#06b6d4',
    controls: '← →  move   ↑ Space  jump',
    primitive: true,
    primitiveInfo: 'Objects arc in from both sides. Move and leap to intercept them before they hit the ground.',
  },
  {
    config: primDodgeCatch,
    emoji: '⚡',
    tagline: 'Dodge scrolling hazards while catching falling items — both at once.',
    accentColor: '#06b6d4',
    controls: '← →  move   ↑ Space  jump',
    primitive: true,
    primitiveInfo: 'Hazards scroll in horizontally while collectibles rain down — dodge and catch simultaneously.',
  },
  {
    config: primShootDown,
    emoji: '🍿',
    tagline: 'Move and shoot downward into targets — pure shooter mechanic.',
    accentColor: '#818cf8',
    controls: '← →  move   Space  fire',
    primitive: true,
    primitiveInfo: 'Move above and fire projectiles downward into targets sliding below.',
  },
  {
    config: primSpaceInvader,
    emoji: '👾',
    tagline: 'Move and shoot upward at descending enemies.',
    accentColor: '#818cf8',
    controls: '← →  move   Space  fire',
    primitive: true,
    primitiveInfo: 'Enemies descend from above. Move along the bottom and fire upward to eliminate them.',
  },
  {
    config: primThrowToTarget,
    emoji: '🎯',
    tagline: 'Move and throw at drifting targets — aim, lead the shot, score.',
    accentColor: '#818cf8',
    controls: '← →  move   Space  throw',
    primitive: true,
    primitiveInfo: 'Targets drift across the field. Aim by positioning, then launch a projectile to hit them.',
  },
  {
    config: primCollectAll,
    emoji: '👻',
    tagline: 'Navigate freely and collect every item while dodging roaming enemies.',
    accentColor: '#fb923c',
    controls: '← → ↑ ↓  move',
    primitive: true,
    primitiveInfo: 'Move freely in all directions. Collect every item scattered across the arena while avoiding roaming enemies.',
  },
  {
    config: primSnake,
    emoji: '🐍',
    tagline: 'Eat, grow, survive — navigate a shrinking arena without hitting the walls.',
    accentColor: '#fb923c',
    controls: '← → ↑ ↓  move',
    primitive: true,
    primitiveInfo: 'Navigate and consume to grow. The space around you shrinks over time — survive as long as you can.',
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
    config: fruitNinja,
    emoji: '🍉',
    tagline: "Fruits arc from both sides — leap and slash before they hit the ground.",
    accentColor: '#06b6d4',
    controls: '← →  move   ↑ Space  jump',
    primitiveId: 'prim_arc_catch',
  },
  {
    config: spaceInvader,
    emoji: '👾',
    tagline: 'An alien grid descends — shoot them all before they reach you.',
    accentColor: '#818cf8',
    controls: '← →  move   Space  fire',
    primitiveId: 'prim_shoot_up',
  },
  {
    config: platform,
    emoji: '🦊',
    tagline: "Kiko the fox dashes through ancient ruins — leap over spikes, grab the golden coins.",
    accentColor: '#34d399',
    controls: '← →  move   ↑ Space  jump',
    primitiveId: 'prim_sideway_platform',
  },
  {
    config: doodleJump,
    emoji: '🐸',
    tagline: "Bounce ever upward through an endless pastel sky — don't fall, don't touch the monsters.",
    accentColor: '#34d399',
    controls: '← →  move   ↑ Space  jump',
    primitiveId: 'prim_jump_up',
  },
  {
    config: pokemonGo,
    emoji: '🎮',
    tagline: 'Wild Pokémon roam the meadow — throw pokéballs to catch them all before they escape!',
    accentColor: '#818cf8',
    controls: '← →  move   Space  throw',
    primitiveId: 'prim_throw_to_target',
  },
  {
    config: bowling,
    emoji: '🎳',
    tagline: 'Roll down the lane and knock out all 10 pins — aim for the strike.',
    accentColor: '#818cf8',
    controls: '← →  move   Space  roll',
    primitiveId: 'prim_throw_to_target',
  },
  {
    config: pacman,
    emoji: '👻',
    tagline: 'Chomp every pellet in the neon maze — but the ghosts are closing in.',
    accentColor: '#fb923c',
    controls: '← → ↑ ↓  move',
    primitiveId: 'prim_collect_all',
  },
  {
    config: snakeGame,
    emoji: '🐍',
    tagline: 'Slither across the field eating apples — dodge the rocks piling up around you.',
    accentColor: '#fb923c',
    controls: '← → ↑ ↓  move',
    primitiveId: 'prim_snake',
  },
];
