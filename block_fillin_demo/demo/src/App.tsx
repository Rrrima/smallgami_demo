/**
 * @file App.tsx
 * @description Root application component. Bootstraps the game store, wires up
 * the game configuration, and composes the top-level UI panels (Game canvas,
 * StickyBlocks, ChatWindow, Narrative, DSLEditorPanel).
 *
 * Key exports:
 *  - App: top-level React component
 */

import './main.scss';
import './styles/app.scss';
import DSLEditorPanel from './components/DSLEditorPanel';
import ChatWindow from './components/ChatWindow';
import { useEffect, useState } from 'react';
import { GameDSLConfig, useGameStore, Game } from '@smallgami/engine';
import gameStore from './config/gameStore';
import StickyBlocks from './components/StickyBlocks';
import Narrative from './components/Narrative';
import { dslConfigs, getDSLConfigById } from './config/dslConfigs';

function App() {
  const [gameId, setGameId] = useState('christmas');
  const [selectedDSLConfig, setSelectedDSLConfig] = useState(dslConfigs[0].id);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [narrativeSlots, setNarrativeSlots] = useState<Record<string, string>>(
    {}
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [currentObjectIndex, setCurrentObjectIndex] = useState(0);
  const [generatingBlocks, setGeneratingBlocks] = useState<Set<string>>(
    new Set()
  );
  const [transition, setTransition] = useState<string | undefined>(undefined);
  const setGameConfig = useGameStore(state => state.setGameConfig);
  const gameConfig = useGameStore(state => state.gameConfig);
  const debugMode = useGameStore(state => state.debugMode);

  useEffect(() => {
    // Load the corresponding config from gameStore when gameId changes
    const loadGameConfig = () => {
      setConfigLoaded(false);
      try {
        // In debug mode, use the TypeScript config for hot reload
        if (debugMode) {
          console.log('🐛 Debug Mode: Loading TypeScript config from:', selectedDSLConfig);
          const config = getDSLConfigById(selectedDSLConfig);
          if (config) {
            setGameConfig(config);
            setConfigLoaded(true);
          } else {
            console.error(`DSL Config not found for ${selectedDSLConfig}`);
            setConfigLoaded(true);
          }
          return;
        }

        // Normal mode: load from JSON gameStore
        const config = gameStore[gameId];
        if (config) {
          setGameConfig(config);
          setConfigLoaded(true);
        } else {
          console.error(`Config not found for ${gameId}`);
          setConfigLoaded(true);
        }
      } catch (error) {
        console.error(`Error loading config for ${gameId}:`, error);
        setConfigLoaded(true);
      }
    };

    loadGameConfig();
  }, [gameId, selectedDSLConfig, setGameConfig, debugMode]);

  return (
    <div className='app-container'>
      {/* Left Panel */}
      <div className='left-panel'>
        <StickyBlocks
          gameId={gameId}
          setGameId={setGameId}
          narrativeSlots={narrativeSlots}
          setNarrativeSlots={setNarrativeSlots}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          currentObjectIndex={currentObjectIndex}
          setCurrentObjectIndex={setCurrentObjectIndex}
          generatingBlocks={generatingBlocks}
          setGeneratingBlocks={setGeneratingBlocks}
        />
      </div>
      {/* Middle Panel */}
      <div className='middle-panel'>
        {debugMode && (
          <div className='game-selector'>
            <select
              value={selectedDSLConfig}
              onChange={(e) => setSelectedDSLConfig(e.target.value)}
            >
              {dslConfigs.map((config) => (
                <option key={config.id} value={config.id}>
                  {config.name} ({config.filename})
                </option>
              ))}
            </select>
          </div>
        )}
        <div className='game-canvas-section'>
          {configLoaded && gameConfig ? (
            <Game
              key={`${gameConfig.id}-${JSON.stringify(gameConfig.assets?.models || {})}`}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#666',
              }}
            >
              Loading game...
            </div>
          )}
        </div>
        <Narrative
          narrativeSlots={narrativeSlots}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          currentObjectIndex={currentObjectIndex}
          setCurrentObjectIndex={setCurrentObjectIndex}
          gameId={gameId}
          transition={transition}
        />
        <div className='chat-window-section'>
          <ChatWindow
            narrativeSlots={narrativeSlots}
            setNarrativeSlots={setNarrativeSlots}
            gameId={gameId}
            generatingBlocks={generatingBlocks}
            setGeneratingBlocks={setGeneratingBlocks}
            setTransition={setTransition}
          />
        </div>
      </div>
      {/* Right Panel */}
      <div className='right-panel'>
        <div className='dsl-editor-section'>
          <DSLEditorPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
