/**
 * @file App.tsx
 * @description Chat Demo - 3-panel layout: Chat | Game+Narrative | DSL Editor
 * Left panel: Full-height ChatWindow with visible message history
 * Middle panel: Game canvas with Narrative below
 * Right panel: DSL Editor
 */

import './main.scss';
import './styles/app.scss';
import DSLEditorPanel from './components/DSLEditorPanel';
import ChatWindow from './components/ChatWindow';
import { useEffect, useState } from 'react';
import { GameDSLConfig, useGameStore, Game } from '@smallgami/engine';
import gameStore from './config/gameStore';
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
    const loadGameConfig = () => {
      setConfigLoaded(false);
      try {
        if (debugMode) {
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
      {/* Left Panel - Chat */}
      <div className='left-panel'>
        <ChatWindow
          narrativeSlots={narrativeSlots}
          setNarrativeSlots={setNarrativeSlots}
          gameId={gameId}
          generatingBlocks={generatingBlocks}
          setGeneratingBlocks={setGeneratingBlocks}
          setTransition={setTransition}
        />
      </div>
      {/* Middle Panel - Game + Narrative */}
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
      </div>
      {/* Right Panel - DSL Editor */}
      <div className='right-panel'>
        <div className='dsl-editor-section'>
          <DSLEditorPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
