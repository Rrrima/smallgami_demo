/**
 * @file Narrative.tsx
 * @description Renders the live narrative sentence for the current game, replacing
 * ##placeholder tokens with highlighted, hoverable slot labels. Hovering a slot
 * highlights the corresponding sticky block.
 *
 * Key exports:
 *  - Narrative: React component (default export)
 */

import React from 'react';
import { useGameStore, getCurrentMechanismConfig } from '@smallgami/engine';
import './Narrative.scss';

interface NarrativeProps {
  narrativeSlots: Record<string, string>;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  currentObjectIndex: number;
  setCurrentObjectIndex: (index: number) => void;
  gameId: string;
  transition?: string;
}

export default function Narrative({
  narrativeSlots,
  hoveredId,
  setHoveredId,
  currentObjectIndex,
  setCurrentObjectIndex,
  gameId,
  transition,
}: NarrativeProps) {
  const gameConfig = useGameStore(state => state.gameConfig);

  const renderNarrative = () => {
    const mechanismConfig = getCurrentMechanismConfig(gameConfig, gameId);
    if (!mechanismConfig || !narrativeSlots.player) return null;

    const narrative = mechanismConfig.narrative;
    const parts: (string | React.JSX.Element)[] = [];
    let lastIndex = 0;

    // Find all placeholders (##key) in the narrative
    const placeholderRegex = /##(\w+)/g;
    let match;

    while ((match = placeholderRegex.exec(narrative)) !== null) {
      const placeholder = match[0];
      const key = match[1];
      const startIndex = match.index;

      // Add text before placeholder
      if (startIndex > lastIndex) {
        parts.push(narrative.substring(lastIndex, startIndex));
      }

      // Add interactive slot for placeholder
      if (key === 'player') {
        parts.push(
          <span
            key={`${key}-${startIndex}`}
            className={`narrative-slot ${hoveredId === 'player' ? 'highlighted' : ''}`}
            onMouseEnter={() => setHoveredId('player')}
            onMouseLeave={() => setHoveredId(null)}
          >
            {narrativeSlots.player}
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
            {narrativeSlots.world}
          </span>
        );
      } else {
        // Handle object keys dynamically
        const objectKeys = Object.keys(mechanismConfig.objects);
        const objectIndex = objectKeys.indexOf(key);

        if (objectIndex !== -1 && narrativeSlots[key]) {
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
              {narrativeSlots[key]}
            </span>
          );
        }
      }

      lastIndex = startIndex + placeholder.length;
    }

    // Add remaining text
    if (lastIndex < narrative.length) {
      parts.push(narrative.substring(lastIndex));
    }

    return <span className='narrative-text'>{parts}</span>;
  };

  if (!narrativeSlots.player) return null;

  return (
    <div className='cohesive-narrative-container'>
      {transition && (
        <div className='transition-sentence'>
          ✨ {transition}
        </div>
      )}
      <div className='cohesive-narrative'>{renderNarrative()}</div>
    </div>
  );
}

