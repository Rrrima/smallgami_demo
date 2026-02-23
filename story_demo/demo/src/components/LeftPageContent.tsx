import React from 'react';
import { useGameStore, getCurrentMechanismConfig } from '@smallgami/engine';
import gameStore from '../config/gameStore';
import './LeftPageContent.scss';

interface Page {
  id: string;
  text: string;
  isNarrative: boolean;
}

interface LeftPageContentProps {
  page: Page;
  narrativeSlots: Record<string, string>;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  currentObjectIndex: number;
  setCurrentObjectIndex: (index: number) => void;
  gameId: string;
  setGameId: (id: string) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onPageTextChange: (id: string, text: string) => void;
}

const storyLabels: Record<string, string> = {
  christmas: 'Christmas Gift Catcher',
  flappy_bird: 'Flappy Bird',
  platform_forest: 'Forest Platformer',
  running_christmas: 'Christmas Runner',
};

export default function LeftPageContent({
  page,
  narrativeSlots,
  hoveredId,
  setHoveredId,
  currentObjectIndex,
  setCurrentObjectIndex,
  gameId,
  setGameId,
  editingId,
  setEditingId,
  onPageTextChange,
}: LeftPageContentProps) {
  const gameConfig = useGameStore(state => state.gameConfig);

  const renderNarrativeSlots = () => {
    const mechanismConfig = getCurrentMechanismConfig(gameConfig, gameId);
    if (!mechanismConfig) return <span className='placeholder-text'>Pick a story to begin writing...</span>;

    const narrative = mechanismConfig.narrative;
    const parts: (string | React.JSX.Element)[] = [];
    let lastIndex = 0;

    const placeholderRegex = /##(\w+)/g;
    let match;

    while ((match = placeholderRegex.exec(narrative)) !== null) {
      const placeholder = match[0];
      const key = match[1];
      const startIndex = match.index;

      if (startIndex > lastIndex) {
        parts.push(narrative.substring(lastIndex, startIndex));
      }

      const slotValue = narrativeSlots[key];
      const displayValue = slotValue || key;

      if (key === 'player') {
        parts.push(
          <span
            key={`${key}-${startIndex}`}
            className={`narrative-slot ${hoveredId === 'player' ? 'highlighted' : ''}`}
            onMouseEnter={() => setHoveredId('player')}
            onMouseLeave={() => setHoveredId(null)}
          >
            {displayValue}
          </span>
        );
      } else if (key === 'world') {
        parts.push(
          <span
            key={`${key}-${startIndex}`}
            className={`narrative-slot ${hoveredId === 'world' ? 'highlighted' : ''}`}
            onMouseEnter={() => setHoveredId('world')}
            onMouseLeave={() => setHoveredId(null)}
          >
            {displayValue}
          </span>
        );
      } else {
        const objectKeys = Object.keys(mechanismConfig.objects);
        const objectIndex = objectKeys.indexOf(key);

        if (objectIndex !== -1) {
          parts.push(
            <span
              key={`${key}-${startIndex}`}
              className={`narrative-slot ${key} ${hoveredId === 'object' && currentObjectIndex === objectIndex ? 'highlighted' : ''}`}
              onMouseEnter={() => {
                setHoveredId('object');
                setCurrentObjectIndex(objectIndex);
              }}
              onMouseLeave={() => setHoveredId(null)}
            >
              {displayValue}
            </span>
          );
        }
      }

      lastIndex = startIndex + placeholder.length;
    }

    if (lastIndex < narrative.length) {
      parts.push(narrative.substring(lastIndex));
    }

    return <span className='narrative-text'>{parts}</span>;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setEditingId(null);
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setEditingId(null);
    }
  };

  return (
    <div className='left-page-content'>
      <div className='story-header'>
        <div className='story-selector'>
          <select
            value={gameId}
            onChange={e => setGameId(e.target.value)}
          >
            {Object.keys(gameStore).map(id => (
              <option key={id} value={id}>
                {storyLabels[id] || id}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className='page-body'>
        {page.isNarrative ? (
          <div className='narrative-sentence'>
            {renderNarrativeSlots()}
          </div>
        ) : (
          <textarea
            className='page-textarea'
            value={page.text}
            onChange={e => onPageTextChange(page.id, e.target.value)}
            placeholder='Continue the story...'
          />
        )}
      </div>
    </div>
  );
}
