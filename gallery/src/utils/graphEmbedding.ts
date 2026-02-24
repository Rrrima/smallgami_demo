import type { GameDSLConfig } from '@smallgami/engine';

// ── Feature extraction ────────────────────────────────────────────────────────
//
// Each config is projected onto a 12-dimensional numeric vector.
// Dimensions are chosen to separate the 8 games along axes that matter for gameplay:
//   camera type, gravity, lock-X, can-shoot, 4-direction, left/right,
//   object horizontal speed, object vertical speed, player Y position,
//   has ground, once-spawn ratio, bullet direction.

export function extractFeatures(config: GameDSLConfig): number[] {
  // [0] Camera type — ortho=0, action=0.33, normal=1 (×2 weight)
  const camMap: Record<string, number> = { ortho: 0, action: 0.33, normal: 1 };
  const cam = (camMap[config.world?.cameraType ?? 'normal'] ?? 0.5) * 2;

  // [1] Gravity — normalized to [0,1], then ×1.5
  const grav = Math.min((config.world?.gravityMultiplier ?? 1) / 2, 1) * 1.5;

  // [2] Lock-X axis (flappy-bird style) — ×3 so flappy is clearly isolated
  const lockX = (config.player?.lockXPosition ? 1 : 0) * 3;

  // [3] Has shoot / fire-bullet — ×2
  // Note: space key is stored as ' ' — k?.trim() would falsely filter it out, so use k !== ''
  const fire = (config.controls?.fireBullet?.some(k => k !== '') ? 1 : 0) * 2;

  // [4] 4-direction movement (forward/backward controls present) — ×2
  const dir4 = ((config.controls as any)?.moveforward?.some((k: string) => k !== '') ? 1 : 0) * 2;

  // [5] Has left / right movement
  const hasLR = config.controls?.moveLeft?.some(k => k !== '') ? 1 : 0;

  // [6] Max object X-speed (horizontal-scroll games)
  const xSpeeds = config.objects?.map(o => Math.abs((o as any).initialSpeed?.x ?? 0)) ?? [0];
  const maxX = Math.min(Math.max(...xSpeeds) / 100, 1);

  // [7] Max object Y-speed (falling-object games)
  const ySpeeds = config.objects?.map(o => Math.abs((o as any).initialSpeed?.y ?? 0)) ?? [0];
  const maxY = Math.min(Math.max(...ySpeeds) / 30, 1);

  // [8] Player start Y — top-shooter (y≈40) vs normal (y≈0) vs bottom (y≈-30) — ×1.5
  const startY = config.player?.startPosition?.y ?? 0;
  const normY = Math.max(0, Math.min(1, (startY + 40) / 80)) * 1.5;

  // [9] Has ground
  const hasGnd = config.world?.hasGround ? 1 : 0;

  // [10] Ratio of once-spawn entries — ×1.5 (unique to space-invader)
  const spawns = config.spawn ?? [];
  const onceRatio =
    spawns.length > 0
      ? (spawns.filter(s => s.spawnTrigger === 'once').length / spawns.length) * 1.5
      : 0;

  // [11] Bullet direction — up=1, down=0, no-fire=0.5
  const bSpeed = config.player?.bullets?.speed ?? 0;
  const bulletDir = fire > 0 ? (bSpeed > 0 ? 1 : 0) : 0.5;

  return [cam, grav, lockX, fire, dir4, hasLR, maxX, maxY, normY, hasGnd, onceRatio, bulletDir];
}

// ── Distance matrix ───────────────────────────────────────────────────────────

export function euclidean(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
}

export function buildDistMatrix(feats: number[][]): number[][] {
  return feats.map(a => feats.map(b => euclidean(a, b)));
}

// ── Stress-minimization MDS ───────────────────────────────────────────────────
//
// Gradient descent on the stress function: Σ (d_ij - D_ij)².
// Uses a deterministic ring initialization so layout is stable across renders.
// Returns positions in the range [-1, 1] (normalized after convergence).

export function stressMDS(D: number[][], iters = 700): [number, number][] {
  const n = D.length;
  const maxD = Math.max(...D.flatMap(r => r)) || 1;
  // Normalize target distances to [0, 1]
  const Dn = D.map(r => r.map(v => v / maxD));

  // Deterministic ring initialization
  let pos: [number, number][] = Array.from({ length: n }, (_, i) => [
    Math.cos((i / n) * Math.PI * 2) * 0.5,
    Math.sin((i / n) * Math.PI * 2) * 0.5,
  ]);

  for (let iter = 0; iter < iters; iter++) {
    // Cosine annealing learning rate
    const lr = 0.055 * (1 - iter / iters) + 0.004;
    const g: [number, number][] = pos.map(() => [0, 0]);

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx  = pos[i][0] - pos[j][0];
        const dy  = pos[i][1] - pos[j][1];
        const cur = Math.sqrt(dx * dx + dy * dy) + 1e-9;
        const t   = Dn[i][j];
        const s   = (cur - t) / cur; // gradient of stress w.r.t. displacement
        g[i][0] -= s * dx;  g[i][1] -= s * dy;
        g[j][0] += s * dx;  g[j][1] += s * dy;
      }
    }
    pos = pos.map(([x, y], i) => [x - lr * g[i][0], y - lr * g[i][1]]);
  }

  // Center and normalize to [-1, 1]
  const cx = pos.reduce((s, p) => s + p[0], 0) / n;
  const cy = pos.reduce((s, p) => s + p[1], 0) / n;
  const shifted = pos.map(([x, y]) => [x - cx, y - cy] as [number, number]);
  const maxAbs  = Math.max(...shifted.flatMap(([x, y]) => [Math.abs(x), Math.abs(y)])) || 1;
  return shifted.map(([x, y]) => [x / maxAbs, y / maxAbs]);
}

// ── Color inference ───────────────────────────────────────────────────────────

export function inferColor(config: GameDSLConfig): string {
  if (config.id === 'prim_dodge_catch')                      return '#c084fc'; // combined (dodge + catch)
  if ((config as any).mechanism === 'navigator')             return '#fb923c'; // navigator (collect-all, snake)
  if (config.controls?.fireBullet?.some(k => k !== ''))     return '#818cf8'; // shooter
  if (config.player?.lockXPosition ||
      config.world?.cameraType === 'action')                 return '#f59e0b'; // dodge (flappy + runner)
  if ((config as any).mechanism === 'platformer')            return '#34d399'; // platform
  return '#06b6d4';                                                             // catcher
}
