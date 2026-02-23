import { useEffect, useState } from 'react';
import { Game, useGameStore } from '@smallgami/engine';
import { GameMeta } from '../games';
import '../styles/preview-panel.scss';

interface Props {
  game:     GameMeta | null;
  onClose:  () => void;
  onExpand: () => void;
}

export default function GamePreviewPanel({ game, onClose, onExpand }: Props) {
  const [rendered, setRendered]       = useState<GameMeta | null>(null);
  const [open, setOpen]               = useState(false);
  const [wrapHovered, setWrapHovered] = useState(false);
  const [gameHovered, setGameHovered] = useState(false);
  const setGameConfig = useGameStore(s => s.setGameConfig);

  const showControls = wrapHovered && !gameHovered;

  useEffect(() => {
    if (game) {
      setRendered(game);
      useGameStore.setState({ polygonMode: game.primitive === true });
      setGameConfig(game.config);
      requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
    } else {
      setOpen(false);
      const t = setTimeout(() => setRendered(null), 380);
      return () => clearTimeout(t);
    }
  }, [game, setGameConfig]);

  if (!rendered) return null;

  return (
    <div
      className={`pip-wrapper${open ? ' is-open' : ''}`}
      onMouseEnter={() => setWrapHovered(true)}
      onMouseLeave={() => { setWrapHovered(false); setGameHovered(false); }}
    >
      <div className={`pip-controls${showControls ? ' is-visible' : ''}`}>
        <button className="pip-btn" onClick={onExpand} title="Expand">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 1h4v4M5 13H1V9M13 1L8 6M1 13l5-5"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="pip-btn" onClick={onClose} title="Close">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M1 1l9 9M10 1L1 10"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="pip-panel">
        <div
          className="pip-game"
          onMouseEnter={() => setGameHovered(true)}
          onMouseLeave={() => setGameHovered(false)}
        >
          <div style={{ position: 'absolute', inset: 0 }}>
            <Game key={`pip-${rendered.config.id}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
