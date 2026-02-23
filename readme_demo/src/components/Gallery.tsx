import { useEffect, useRef, useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import '../styles/gallery.scss';
import { games as gamesData, GameMeta } from '../games';
// Stable identity key — bump GRAPH_VER whenever the simulation structure changes.
const GRAPH_VER = 3;
const GAMES_KEY = `v${GRAPH_VER}:` + gamesData.map(g => g.config.id).join(',');
const games = gamesData;
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceCenter,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from 'd3-force';
import {
  extractFeatures,
  buildDistMatrix,
  stressMDS,
  inferColor,
} from '../utils/graphEmbedding';

interface Props { onSelect: (game: GameMeta) => void; }

// ── Simulation types ──────────────────────────────────────────────────────────
//
// Three tiers:
//   'type'      — category hub (Flappy / Runner / Catcher / Shooter)
//                 position = centroid of its primitive mechanism nodes
//   'primitive' — pure mechanic, no assets, polygon-mode rendering
//   'rendered'  — mechanic + narrative (themed game with assets)
//                 linked to its primitive with the game emoji on the edge

interface GNode extends SimulationNodeDatum {
  uid:      string;
  label:    string;
  color:    string;
  game?:    GameMeta;   // undefined for type nodes
  controls: string;
  nodeType: 'root' | 'type' | 'primitive' | 'rendered';
  emoji?:   string;
}

interface GLink extends SimulationLinkDatum<GNode> {
  color:       string;
  opacity:     number;
  linkEmoji?:  string;   // emoji shown at mid-point (primitive → rendered links)
  dashed?:     boolean;  // structural type → primitive links
}

type ViewMode = 'graph' | 'grid';

// ── Helpers ───────────────────────────────────────────────────────────────────

function clusterLabel(color: string): string {
  const map: Record<string, string> = {
    '#f59e0b': 'Dodge',
    '#06b6d4': 'Catcher',
    '#818cf8': 'Shooter',
  };
  return map[color] ?? 'Other';
}

// ── Grid view ─────────────────────────────────────────────────────────────────

function GridView({ onSelect }: Props) {
  const [hoveredPrimId, setHoveredPrimId] = useState<string | null>(null);

  const grouped = new Map<string, { color: string; label: string; games: GameMeta[] }>();
  for (const game of games) {
    const color = inferColor(game.config);
    const label = clusterLabel(color);
    if (!grouped.has(color)) grouped.set(color, { color, label, games: [] });
    grouped.get(color)!.games.push(game);
  }
  const clusters = [...grouped.values()];

  return (
    <div className="grid-view">
      {clusters.map(({ color, label, games: clGames }) => {
        const primGames     = clGames.filter(g =>  g.primitive);
        const renderedGames = clGames.filter(g => !g.primitive);
        const css = { '--c': color, '--c-border': color + '55' } as React.CSSProperties;
        return (
          <div key={color} className="grid-cluster">

            {/* Left — category label + primitive blocks */}
            <div className="grid-cluster-left">
              <div
                className="grid-cluster-label"
                data-morph-id={`cluster-${color}`}
                style={css}
              >
                {label}
              </div>
              <div className="grid-primitives">
                {primGames.map(game => {
                  const active  = hoveredPrimId === game.config.id;
                  const dimmed  = hoveredPrimId !== null && !active;
                  return (
                    <div
                      key={game.config.id}
                      className={`grid-primitive-chip${active ? ' is-highlighted' : dimmed ? ' is-dimmed' : ''}`}
                      data-morph-id={game.config.id}
                      style={css}
                      onClick={() => onSelect(game)}
                      onMouseEnter={() => setHoveredPrimId(game.config.id)}
                      onMouseLeave={() => setHoveredPrimId(null)}
                    >
                      <span className="card-name">
                        {game.config.name.replace(/_/g, ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right — rendered game cards */}
            <div className="grid-cluster-right">
              {renderedGames.map(game => {
                const active = hoveredPrimId === game.primitiveId;
                const dimmed = hoveredPrimId !== null && !active;
                return (
                  <div
                    key={game.config.id}
                    className={`grid-card${active ? ' is-highlighted' : dimmed ? ' is-dimmed' : ''}`}
                    data-morph-id={game.config.id}
                    style={{ '--c': color, '--c-border': color + '44' } as React.CSSProperties}
                    onClick={() => onSelect(game)}
                    onMouseEnter={() => setHoveredPrimId(game.primitiveId ?? null)}
                    onMouseLeave={() => setHoveredPrimId(null)}
                  >
                    <span className="card-name">
                      {game.config.name.replace(/_/g, ' ')}
                    </span>
                    <span className="card-sub">{game.controls}</span>
                  </div>
                );
              })}
            </div>

          </div>
        );
      })}
    </div>
  );
}

// ── Graph view ────────────────────────────────────────────────────────────────

function GraphView({ onSelect }: Props) {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const simRef   = useRef<ReturnType<typeof forceSimulation<GNode>> | null>(null);
  const nodesRef = useRef<GNode[]>([]);
  const linksRef = useRef<GLink[]>([]);
  const [, setTick] = useState(0);

  const vtRef  = useRef({ x: 0, y: 0, k: 1 });
  const [vt, setVt] = useState({ x: 0, y: 0, k: 1 });
  const panRef  = useRef<{ ox: number; oy: number; tx: number; ty: number } | null>(null);
  const dragRef = useRef<{ uid: string; moved: boolean } | null>(null);
  const [hoveredUid, setHoveredUid] = useState<string | null>(null);

  const toGraph = useCallback((cx: number, cy: number) => {
    const r = wrapRef.current!.getBoundingClientRect();
    return {
      x: (cx - r.left - vtRef.current.x) / vtRef.current.k,
      y: (cy - r.top  - vtRef.current.y) / vtRef.current.k,
    };
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const wrap = wrapRef.current!
    const { width, height } = wrap.getBoundingClientRect();
    const cx = width / 2, cy = height / 2;
    const scale = Math.min(width, height) * 0.33;

    // ── 1. MDS on primitive games — they represent pure mechanics ──────────────
    const primGames = games.filter(g =>  g.primitive);
    const origGames = games.filter(g => !g.primitive);

    const features = primGames.map(g => extractFeatures(g.config));
    const distMat  = buildDistMatrix(features);
    const mds2d    = stressMDS(distMat);

    // Primitive positions keyed by config id
    const primPos = new Map<string, [number, number]>(
      primGames.map((g, i) => [g.config.id, [cx + mds2d[i][0] * scale, cy + mds2d[i][1] * scale]])
    );

    // ── 2. Type-node positions = centroid of their primitive children ──────────
    const typeAcc = new Map<string, { color: string; label: string; sx: number; sy: number; n: number }>();
    for (const g of primGames) {
      const color = inferColor(g.config);
      const label = clusterLabel(color);
      const [px, py] = primPos.get(g.config.id)!;
      if (!typeAcc.has(color)) typeAcc.set(color, { color, label, sx: 0, sy: 0, n: 0 });
      const acc = typeAcc.get(color)!;
      acc.sx += px; acc.sy += py; acc.n++;
    }

    // ── 3. Build all nodes ─────────────────────────────────────────────────────

    const allNodes: GNode[] = [];

    // Root node — centre of the whole graph
    allNodes.push({
      uid:      'root',
      label:    'smallgami',
      color:    '#1d1d1f',
      controls: '',
      nodeType: 'root',
      x: cx,
      y: cy,
    });

    // Type nodes
    for (const [color, acc] of typeAcc.entries()) {
      allNodes.push({
        uid:      `type-${color}`,
        label:    acc.label,
        color,
        controls: '',
        nodeType: 'type',
        x: acc.sx / acc.n,
        y: acc.sy / acc.n,
      });
    }

    // Primitive mechanism nodes
    for (const g of primGames) {
      const [nx, ny] = primPos.get(g.config.id)!;
      allNodes.push({
        uid:      `g-${g.config.id}`,
        label:    g.config.name.replace(/_/g, ' '),
        color:    inferColor(g.config),
        game:     g,
        controls: g.controls,
        nodeType: 'primitive',
        x: nx,
        y: ny,
      });
    }

    // Rendered game nodes — offset to the right of their primitive twin
    for (const g of origGames) {
      const twin = primGames.find(pg => pg.config.id === g.primitiveId);
      const [bx, by] = twin ? primPos.get(twin.config.id)! : [cx, cy];
      allNodes.push({
        uid:      `g-${g.config.id}`,
        label:    g.config.name.replace(/_/g, ' '),
        color:    inferColor(g.config),
        game:     g,
        controls: g.controls,
        nodeType: 'rendered',
        emoji:    g.emoji,
        x: bx + 68,
        y: by,
      });
    }

    nodesRef.current = allNodes;

    // ── 4. Build links ─────────────────────────────────────────────────────────

    const links: GLink[] = [];

    // Root → Type  (structural backbone)
    for (const n of allNodes.filter(n => n.nodeType === 'type')) {
      links.push({
        source:  'root',
        target:  n.uid,
        color:   '#94a3b8',
        opacity: 0.6,
      });
    }

    // Type → Primitive  (structural, dashed)
    for (const n of allNodes.filter(n => n.nodeType === 'primitive')) {
      links.push({
        source:  `type-${n.color}`,
        target:  n.uid,
        color:   n.color,
        opacity: 0.75,
        dashed:  true,
      });
    }

    // Primitive → Rendered  (narrative link, emoji at midpoint)
    for (const n of allNodes.filter(n => n.nodeType === 'rendered')) {
      const twin = primGames.find(pg => pg.config.id === n.game!.primitiveId);
      if (!twin) continue;
      links.push({
        source:    `g-${twin.config.id}`,
        target:    n.uid,
        color:     n.color,
        opacity:   1.0,
        linkEmoji: n.emoji,
      });
    }

    linksRef.current = links;

    // ── 5. D3 simulation ───────────────────────────────────────────────────────
    //
    // Mirrors the vis-network settings the user liked:
    //   gravitationalConstant -8000 → forceManyBody strength -380 / -700
    //   springLength 130            → forceLink distance 130 / 110
    //   damping 0.09               → velocityDecay 0.18  (low friction)
    //   centralGravity 0.25         → forceCenter strength 0.06
    //
    // NO forceX/forceY anchors — pure physics so dragging feels natural.
    // MDS positions are used only as starting positions, not as constraints.

    simRef.current = forceSimulation<GNode>(allNodes)
      .alphaDecay(0.008)
      .velocityDecay(0.18)
      .force('link',
        forceLink<GNode, GLink>(links)
          .id(d => d.uid)
          .distance((d) => {
            const s = d.source as GNode;
            const t = d.target as GNode;
            if (s.nodeType === 'root' || t.nodeType === 'root') return 160;
            if (s.nodeType === 'type' || t.nodeType === 'type') return 130;
            return 105;
          })
          .strength(0.7))
      .force('charge',
        forceManyBody<GNode>()
          .strength((d: GNode) => d.nodeType === 'root' ? -1200 : d.nodeType === 'type' ? -700 : -380)
          .distanceMin(20)
          .distanceMax(600))
      .force('collide',
        forceCollide<GNode>((d: GNode) => d.nodeType === 'root' ? 88 : d.nodeType === 'type' ? 72 : 52)
          .strength(0.9))
      .force('center', forceCenter(cx, cy).strength(0.06))
      .on('tick', () => setTick(n => n + 1));

    return () => { simRef.current?.stop(); };
  }, [GAMES_KEY]); // re-runs whenever the games list changes (HMR-safe)

  useEffect(() => {
    const el = wrapRef.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r  = el.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      const { x, y, k } = vtRef.current;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newK   = Math.max(0.25, Math.min(4, k * factor));
      const ratio  = newK / k;
      const next   = { x: mx - (mx - x) * ratio, y: my - (my - y) * ratio, k: newK };
      vtRef.current = next;
      setVt({ ...next });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const nodeEl = (e.target as HTMLElement).closest('[data-uid]') as HTMLElement | null;
    if (nodeEl) {
      const uid  = nodeEl.dataset.uid!;
      const node = nodesRef.current.find(n => n.uid === uid)!;
      dragRef.current = { uid, moved: false };
      const gc = toGraph(e.clientX, e.clientY);
      node.fx = gc.x; node.fy = gc.y;
      // High alphaTarget keeps simulation energetic while dragging so
      // neighbouring nodes react immediately (mirrors vis-network behaviour)
      simRef.current?.alphaTarget(0.5).restart();
      wrapRef.current!.style.cursor = 'grabbing';
    } else {
      panRef.current = { ox: e.clientX, oy: e.clientY, tx: vtRef.current.x, ty: vtRef.current.y };
      wrapRef.current!.style.cursor = 'grabbing';
    }
    wrapRef.current!.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      dragRef.current.moved = true;
      const gc   = toGraph(e.clientX, e.clientY);
      const node = nodesRef.current.find(n => n.uid === dragRef.current!.uid)!;
      node.fx = gc.x; node.fy = gc.y;
      // Keep simulation warm so the rest of the graph keeps reacting
      simRef.current?.restart();
    } else if (panRef.current) {
      const next = {
        ...vtRef.current,
        x: panRef.current.tx + (e.clientX - panRef.current.ox),
        y: panRef.current.ty + (e.clientY - panRef.current.oy),
      };
      vtRef.current = next;
      setVt({ ...next });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      const { uid, moved } = dragRef.current;
      const node = nodesRef.current.find(n => n.uid === uid)!;
      // Only launch game on click (no drag), and only for game nodes (not type hubs)
      if (!moved && node.game) onSelect(node.game);
      node.fx = null; node.fy = null;
      // Let alpha decay naturally from current level rather than snapping to 0
      simRef.current?.alphaTarget(0).alpha(0.3);
      dragRef.current = null;
    }
    panRef.current = null;
    wrapRef.current!.style.cursor = 'grab';
  };

  const { x: tx, y: ty, k: tk } = vt;

  // Build adjacency set for the currently hovered node
  const connectedUids = new Set<string>();
  if (hoveredUid) {
    connectedUids.add(hoveredUid);
    for (const lnk of linksRef.current) {
      const s = (lnk.source as GNode).uid;
      const t = (lnk.target as GNode).uid;
      if (s === hoveredUid) connectedUids.add(t);
      if (t === hoveredUid) connectedUids.add(s);
    }
  }
  const isHovering = hoveredUid !== null;

  return (
    <div
      className="graph-root"
      ref={wrapRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        className="graph-canvas"
        style={{ transform: `translate(${tx}px,${ty}px) scale(${tk})` }}
      >
        {/* ── SVG: edges + emoji labels ── */}
        <svg className="graph-svg" aria-hidden="true">
          {linksRef.current.map((lnk, i) => {
            const s = lnk.source as GNode;
            const t = lnk.target as GNode;
            if (s.x == null || t.x == null) return null;
            const mx = (s.x + t.x) / 2;
            const my = (s.y + t.y) / 2;
            const linked = !isHovering || (connectedUids.has(s.uid) && connectedUids.has(t.uid));
            const linkOpacity = linked ? lnk.opacity : 0.04;
            const linkWidth   = lnk.linkEmoji
              ? (linked && isHovering ? 3.5 : 3.0)
              : (linked && isHovering ? 2.5 : 2.0);
            return (
              <g key={i}>
                <line
                  x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  stroke={lnk.color}
                  strokeOpacity={linkOpacity}
                  strokeWidth={linkWidth}
                  strokeDasharray={lnk.dashed ? '5 4' : undefined}
                  style={{ transition: 'stroke-opacity 0.15s ease' }}
                />
                {lnk.linkEmoji && (
                  <text
                    x={mx} y={my}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="15"
                    opacity={linked ? 1 : 0.1}
                    style={{ pointerEvents: 'none', userSelect: 'none', transition: 'opacity 0.15s ease' }}
                  >
                    {lnk.linkEmoji}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* ── Root node ── */}
        {nodesRef.current
          .filter(n => n.nodeType === 'root')
          .map(n => {
            const dimmed = isHovering && !connectedUids.has(n.uid);
            return (
              <div
                key={n.uid}
                className={`root-hub${dimmed ? ' is-dimmed' : ''}`}
                data-uid={n.uid}
                style={{ left: n.x, top: n.y } as React.CSSProperties}
                onMouseEnter={() => setHoveredUid(n.uid)}
                onMouseLeave={() => setHoveredUid(null)}
              >
                {n.label}
              </div>
            );
          })}

        {/* ── Type hub nodes ── */}
        {nodesRef.current
          .filter(n => n.nodeType === 'type')
          .map(n => {
            const dimmed = isHovering && !connectedUids.has(n.uid);
            return (
              <div
                key={n.uid}
                className={`type-hub${dimmed ? ' is-dimmed' : ''}`}
                data-uid={n.uid}
                data-morph-id={`cluster-${n.color}`}
                style={{
                  left: n.x,
                  top:  n.y,
                  '--c':        n.color,
                  '--c-border': n.color + '55',
                } as React.CSSProperties}
                onMouseEnter={() => setHoveredUid(n.uid)}
                onMouseLeave={() => setHoveredUid(null)}
              >
                {n.label}
              </div>
            );
          })}

        {/* ── Primitive mechanism nodes ── */}
        {nodesRef.current
          .filter(n => n.nodeType === 'primitive')
          .map(n => {
            const dimmed = isHovering && !connectedUids.has(n.uid);
            return (
              <div
                key={n.uid}
                className={`game-node is-primitive${dimmed ? ' is-dimmed' : ''}`}
                data-uid={n.uid}
                data-morph-id={n.game!.config.id}
                style={{
                  left: n.x,
                  top:  n.y,
                  '--c':        n.color,
                  '--c-border': n.color + '88',
                } as React.CSSProperties}
                onMouseEnter={() => setHoveredUid(n.uid)}
                onMouseLeave={() => setHoveredUid(null)}
              >
                <span className="card-name">{n.label}</span>
                <span className="card-sub">◆ polygon</span>
              </div>
            );
          })}

        {/* ── Rendered game nodes (mechanism + narrative) ── */}
        {nodesRef.current
          .filter(n => n.nodeType === 'rendered')
          .map(n => {
            const dimmed = isHovering && !connectedUids.has(n.uid);
            return (
              <div
                key={n.uid}
                className={`game-node${dimmed ? ' is-dimmed' : ''}`}
                data-uid={n.uid}
                data-morph-id={n.game!.config.id}
                style={{
                  left: n.x,
                  top:  n.y,
                  '--c':        n.color,
                  '--c-border': n.color + '88',
                } as React.CSSProperties}
                onMouseEnter={() => setHoveredUid(n.uid)}
                onMouseLeave={() => setHoveredUid(null)}
              >
                <span className="card-name">{n.label}</span>
                <span className="card-sub">{n.controls}</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ── FLIP morph helper ─────────────────────────────────────────────────────────
//
// Strategy: clone the destination card, slide it from source-center to its
// natural destination position while fading in.  No scale → no text distortion.
// Crossfade at the end: real view fades in (JS-forced) while overlay fades out
// simultaneously, eliminating any blink regardless of browser quirks.

function morphBetween(
  container: HTMLElement,
  newMode: ViewMode,
  setMode: (m: ViewMode) => void,
  onDone: () => void,
) {
  // 1. Snapshot source rects
  const srcRects = new Map<string, DOMRect>();
  container.querySelectorAll<HTMLElement>('.view-layer--active [data-morph-id]')
    .forEach(el => srcRects.set(el.dataset.morphId!, el.getBoundingClientRect()));

  // 2. Overlay above everything
  const overlay = document.createElement('div');
  overlay.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:999;overflow:hidden';
  document.body.appendChild(overlay);

  // 3. Hide all view layers + switch mode synchronously
  container.classList.add('is-morphing');
  flushSync(() => setMode(newMode));

  // 4. Collect destination rects (DOM is now in new mode)
  const destEls   = new Map<string, HTMLElement>();
  const destRects = new Map<string, DOMRect>();
  container.querySelectorAll<HTMLElement>('.view-layer--active [data-morph-id]')
    .forEach(el => {
      const id = el.dataset.morphId!;
      destEls.set(id, el);
      destRects.set(id, el.getBoundingClientRect());
    });

  const SPRING  = 'cubic-bezier(0.25,0.46,0.45,0.94)';
  const DUR     = 320;
  const STAGGER = 6;

  const ghosts: Array<{ el: HTMLElement; delay: number }> = [];
  let idx = 0;

  destEls.forEach((destEl, id) => {
    const src  = srcRects.get(id);
    const dest = destRects.get(id);
    if (!src || !dest) return;

    const clone = destEl.cloneNode(true) as HTMLElement;

    clone.style.cssText = [
      `position:fixed`,
      `left:${dest.left}px`, `top:${dest.top}px`,
      `width:${dest.width}px`, `height:${dest.height}px`,
      `margin:0`, `pointer-events:none`, `overflow:hidden`,
      `will-change:transform,opacity`,
      `transform-origin:center center`,
      `transition:none`,
      // Hide text — only the glass card shape animates; text fades in with real element
      `color:transparent`,
    ].join(';');

    clone.querySelectorAll<HTMLElement>('span, p').forEach(el => {
      el.style.opacity = '0';
      el.style.transition = 'none';
    });

    // Start invisible at source center — slide to destination, fade in.
    // Pure translate (no scale) = zero text distortion.
    const dx = (src.left + src.width  / 2) - (dest.left + dest.width  / 2);
    const dy = (src.top  + src.height / 2) - (dest.top  + dest.height / 2);
    clone.style.transform = `translate(${dx}px,${dy}px)`;
    clone.style.opacity   = '0';

    overlay.appendChild(clone);
    ghosts.push({ el: clone, delay: idx * STAGGER });
    idx++;
  });

  // Double-rAF: paint the initial state (ghosts invisible at source),
  // then start the animation on the next frame.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ghosts.forEach(({ el, delay }) => {
        el.style.transition =
          `transform ${DUR}ms ${delay}ms ${SPRING}, opacity 80ms ${delay}ms ease`;
        el.style.transform = 'none';
        el.style.opacity   = '1';
      });

      // Start crossfade at 60% of total slide time so it overlaps with the tail.
      const totalMs    = DUR + (ghosts.length > 0 ? (ghosts.length - 1) * STAGGER : 0);
      const crossfadeAt = Math.round(totalMs * 0.6);
      const FADE_DUR   = 120; // ms

      setTimeout(() => {
        // ── Crossfade: real view in, overlay out, simultaneously ──────────────
        //
        // Simply removing is-morphing doesn't animate the view because both
        // `transition` and `opacity` change in the same style-update — browser
        // skips the tween and jumps to opacity:1 (blink).
        //
        // Fix: remove is-morphing, then immediately pin the active layer at
        // opacity:0 via inline style, force a reflow so the browser commits that
        // value, then animate to 1.  Overlay fades out in parallel.

        const activeLayer =
          container.querySelector<HTMLElement>('.view-layer--active');

        container.classList.remove('is-morphing');

        if (activeLayer) {
          activeLayer.style.opacity    = '0';
          activeLayer.style.transition = 'none';
          void activeLayer.offsetWidth;          // force reflow — commits opacity:0
          activeLayer.style.transition = `opacity ${FADE_DUR}ms ease`;
          activeLayer.style.opacity    = '1';
        }

        overlay.style.transition = `opacity ${FADE_DUR}ms ease`;
        overlay.style.opacity    = '0';

        setTimeout(() => {
          overlay.remove();
          if (activeLayer) {
            activeLayer.style.opacity    = '';
            activeLayer.style.transition = '';
          }
          onDone();
        }, FADE_DUR + 20);
      }, crossfadeAt);
    });
  });
}

// ── Gallery shell ─────────────────────────────────────────────────────────────

export default function Gallery({ onSelect }: Props) {
  const [mode, setMode]  = useState<ViewMode>('grid');
  const containerRef     = useRef<HTMLDivElement>(null);
  const morphingRef      = useRef(false);

  const switchMode = useCallback((newMode: ViewMode) => {
    if (newMode === mode || morphingRef.current) return;
    morphingRef.current = true;
    morphBetween(
      containerRef.current!,
      newMode,
      setMode,
      () => { morphingRef.current = false; },
    );
  }, [mode]);

  return (
    <div className="gallery-root" ref={containerRef}>
      {/* View toggle */}
      <div className="view-toggle">
        <button
          className={`toggle-btn${mode === 'grid' ? ' active' : ''}`}
          onClick={() => switchMode('grid')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor"/>
            <rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor"/>
            <rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor"/>
            <rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor"/>
          </svg>
          Grid
        </button>
        <button
          className={`toggle-btn${mode === 'graph' ? ' active' : ''}`}
          onClick={() => switchMode('graph')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7"  cy="2"  r="1.6" fill="currentColor"/>
            <circle cx="2"  cy="11" r="1.6" fill="currentColor"/>
            <circle cx="12" cy="11" r="1.6" fill="currentColor"/>
            <line x1="7" y1="2" x2="2"  y2="11" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="7" y1="2" x2="12" y2="11" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
          Graph
        </button>
      </div>

      <div className={`view-layer${mode === 'graph' ? ' view-layer--active' : ''}`}>
        <GraphView onSelect={onSelect} />
      </div>
      <div className={`view-layer${mode === 'grid' ? ' view-layer--active' : ''}`}>
        <GridView onSelect={onSelect} />
      </div>
    </div>
  );
}
