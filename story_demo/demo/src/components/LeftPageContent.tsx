import React from 'react';
import { useGameStore, getCurrentMechanismConfig } from '@smallgami/engine';
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
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onPageTextChange: (id: string, text: string) => void;
  onSlotChange: (key: string, value: string) => void;
}

export default function LeftPageContent({
  page,
  narrativeSlots,
  hoveredId,
  setHoveredId,
  currentObjectIndex,
  setCurrentObjectIndex,
  gameId,
  editingId,
  setEditingId,
  onPageTextChange,
  onSlotChange,
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
          <input
            key={`${key}-${startIndex}`}
            className={`narrative-slot narrative-slot-input ${hoveredId === 'player' ? 'highlighted' : ''}`}
            value={displayValue}
            onChange={e => onSlotChange(key, e.target.value)}
            onMouseEnter={() => setHoveredId('player')}
            onMouseLeave={() => setHoveredId(null)}
            size={Math.max(1, displayValue.length)}
          />
        );
      } else if (key === 'world') {
        parts.push(
          <input
            key={`${key}-${startIndex}`}
            className={`narrative-slot narrative-slot-input ${hoveredId === 'world' ? 'highlighted' : ''}`}
            value={displayValue}
            onChange={e => onSlotChange(key, e.target.value)}
            onMouseEnter={() => setHoveredId('world')}
            onMouseLeave={() => setHoveredId(null)}
            size={Math.max(1, displayValue.length)}
          />
        );
      } else {
        const objectKeys = Object.keys(mechanismConfig.objects);
        const objectIndex = objectKeys.indexOf(key);

        if (objectIndex !== -1) {
          parts.push(
            <input
              key={`${key}-${startIndex}`}
              className={`narrative-slot narrative-slot-input ${key} ${hoveredId === 'object' && currentObjectIndex === objectIndex ? 'highlighted' : ''}`}
              value={displayValue}
              onChange={e => onSlotChange(key, e.target.value)}
              onMouseEnter={() => {
                setHoveredId('object');
                setCurrentObjectIndex(objectIndex);
              }}
              onMouseLeave={() => setHoveredId(null)}
              size={Math.max(1, displayValue.length)}
            />
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
