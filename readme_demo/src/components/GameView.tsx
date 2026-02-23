import '../styles/game-view.scss';
import { useRef, useEffect } from 'react';
import { Game, useGameStore } from '@smallgami/engine';
import { GameMeta } from '../games';
import DSLEditor from './DSLEditor';

interface Props {
  game: GameMeta;
  onBack: () => void;
}

export default function GameView({ game, onBack }: Props) {
  const setGameConfig = useGameStore(s => s.setGameConfig);
  const gameConfig    = useGameStore(s => s.gameConfig);
  const gameRef       = useRef<any>(null);

  // Load config when the selected game changes.
  // For primitive (no-asset) games also enable polygon mode in the store so
  // the engine renders boxes/sphere-hat shapes instead of missing models.
  useEffect(() => {
    useGameStore.setState({ polygonMode: game.primitive === true });
    setGameConfig(game.config);
  }, [game.config, game.primitive, setGameConfig]);

  const gameKey = gameConfig
    ? `${gameConfig.id}-${JSON.stringify(gameConfig.assets?.models ?? {})}`
    : 'loading';

  return (
    <div className="game-view-root">
      {/* ── left: game ── */}
      <div className="game-panel">
        <div className="game-topbar">
          <button className="back-btn" onClick={onBack}>
            ← Gallery
          </button>
          <span className="divider">|</span>
          <span className="game-title-badge">
            <span className="emoji">{game.emoji}</span>
            {game.config.name}
          </span>
          <span className="spacer" />
          <span className="controls-bar">{game.controls}</span>
        </div>

        <div className="game-canvas-wrapper">
          <div className="game-container">
            {gameConfig ? (
              <Game key={gameKey} ref={gameRef} />
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100%', color: '#999', fontSize: '13px',
              }}>
                Loading…
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── right: DSL editor ── */}
      <div className="editor-panel">
        <DSLEditor />
      </div>
    </div>
  );
}
