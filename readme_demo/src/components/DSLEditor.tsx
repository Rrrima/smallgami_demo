import { useState, useEffect, useCallback } from 'react';
import {
  useGameStore,
  WorldConfig,
  PlayerConfig,
  PlayObjectConfig,
  SpawnConfig,
  ControlConfig,
  AssetConfig,
} from '@smallgami/engine';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-json';

type Section = 'world' | 'player' | 'objects' | 'spawn' | 'controls' | 'assets';

export default function DSLEditor() {
  const gameConfig   = useGameStore(s => s.gameConfig);
  const gameName     = useGameStore(s => s.gameName);
  const setWorldConfig   = useGameStore(s => s.setWorldConfig);
  const setPlayerConfig  = useGameStore(s => s.setPlayerConfig);
  const updateObjects    = useGameStore(s => s.updateObjects);
  const updateSpawn      = useGameStore(s => s.updateSpawn);
  const updateControls   = useGameStore(s => s.updateControls);
  const updateAssets     = useGameStore(s => s.updateAssets);

  const [active, setActive] = useState<Section>('world');
  const [sections, setSections] = useState({
    world: '', player: '', objects: '', spawn: '', controls: '', assets: '',
  });
  const [error, setError] = useState('');

  // Sync editor content whenever the live config changes
  useEffect(() => {
    if (!gameConfig) return;
    setSections({
      world:    JSON.stringify(gameConfig.world,    null, 2),
      player:   JSON.stringify(gameConfig.player,   null, 2),
      objects:  JSON.stringify(gameConfig.objects,  null, 2),
      spawn:    JSON.stringify(gameConfig.spawn,    null, 2),
      controls: JSON.stringify(gameConfig.controls, null, 2),
      assets:   JSON.stringify(gameConfig.assets,   null, 2),
    });
    setError('');
  }, [gameConfig]);

  const apply = useCallback(() => {
    try {
      const parsed = JSON.parse(sections[active]);
      setError('');
      switch (active) {
        case 'world':    setWorldConfig(parsed as WorldConfig); break;
        case 'player':   setPlayerConfig(parsed as PlayerConfig); break;
        case 'objects':  updateObjects(parsed as PlayObjectConfig[]); break;
        case 'spawn':    updateSpawn(parsed as SpawnConfig[]); break;
        case 'controls': updateControls(parsed as ControlConfig); break;
        case 'assets':   updateAssets(parsed as AssetConfig); break;
      }
    } catch (e) {
      setError(String(e));
    }
  }, [sections, active, setWorldConfig, setPlayerConfig, updateObjects, updateSpawn, updateControls, updateAssets]);

  const reset = useCallback(() => {
    if (!gameConfig) return;
    setSections(prev => ({
      ...prev,
      [active]: JSON.stringify((gameConfig as any)[active], null, 2),
    }));
    setError('');
  }, [gameConfig, active]);

  // Cmd+S / Ctrl+S to apply
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        apply();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [apply]);

  const highlightCode = (code: string) => {
    const html = highlight(code, languages.json, 'json');
    return html.split('\n').map(line => `<span class="token-line">${line}</span>`).join('\n');
  };

  const TABS: Section[] = ['world', 'player', 'objects', 'spawn', 'controls', 'assets'];

  return (
    <div className="dsl-editor-panel">
      <div className="dsl-header">
        <div className="dsl-header-title">
          <span className="game-name">{gameName?.replace(/_/g, ' ') || 'Game'}</span>
          <span className="game-id">Specification</span>
        </div>
      </div>

      <div className="dsl-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`dsl-tab${active === tab ? ' active' : ''}`}
            onClick={() => { setActive(tab); setError(''); }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="dsl-content">
        <Editor
          value={sections[active]}
          onValueChange={val => setSections(prev => ({ ...prev, [active]: val }))}
          highlight={highlightCode}
          padding={0}
          placeholder={`${active} config…`}
          className="dsl-code-editor"
          textareaClassName="dsl-textarea"
          preClassName="dsl-pre"
        />
      </div>

      {error && <div className="dsl-error">{error}</div>}

      <div className="dsl-actions">
        <button className="dsl-btn secondary" onClick={reset}>Reset</button>
        <button className="dsl-btn primary" onClick={apply}>
          Apply <span style={{ fontSize: '10px', color: '#999' }}>(⌘S)</span>
        </button>
      </div>
    </div>
  );
}
