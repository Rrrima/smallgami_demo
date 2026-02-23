/**
 * @file StoryEditor.tsx
 * @description Paper-style story editor with narrative sentences.
 * The first sentence is the narrative template with interactive slots (##placeholders).
 * Users can add additional plain-text sentences below.
 * Includes a story selector to switch between different games/narratives.
 * Hovering slots highlights the corresponding StickyBlock card on the right.
 */

import React, { useState } from 'react';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import { useGameStore, getCurrentMechanismConfig } from '@smallgami/engine';
import gameStore from '../config/gameStore';
import './StoryEditor.scss';

interface Sentence {
  id: string;
  text: string;
  isNarrative: boolean;
}

interface StoryEditorProps {
  narrativeSlots: Record<string, string>;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  currentObjectIndex: number;
  setCurrentObjectIndex: (index: number) => void;
  gameId: string;
  setGameId: (id: string) => void;
}

const storyLabels: Record<string, string> = {
  christmas: 'Christmas Gift Catcher',
  flappy_bird: 'Flappy Bird',
  platform_forest: 'Forest Platformer',
  running_christmas: 'Christmas Runner',
};

export default function StoryEditor({
  narrativeSlots,
  hoveredId,
  setHoveredId,
  currentObjectIndex,
  setCurrentObjectIndex,
  gameId,
  setGameId,
}: StoryEditorProps) {
  const gameConfig = useGameStore(state => state.gameConfig);

  const [sentences, setSentences] = useState<Sentence[]>([
    { id: 'narrative-main', text: '', isNarrative: true },
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const handleAddSentence = () => {
    const newSentence: Sentence = {
      id: `sentence-${Date.now()}`,
      text: '',
      isNarrative: false,
    };
    setSentences(prev => [...prev, newSentence]);
    setEditingId(newSentence.id);
  };

  const handleDeleteSentence = (id: string) => {
    setSentences(prev => prev.filter(s => s.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const handleSentenceChange = (id: string, text: string) => {
    setSentences(prev =>
      prev.map(s => (s.id === id ? { ...s, text } : s))
    );
  };

  const handleSentenceKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    id: string
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setEditingId(null);
      const lastSentence = sentences[sentences.length - 1];
      if (lastSentence.id === id && lastSentence.text.trim()) {
        handleAddSentence();
      }
    }
    if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const handleStoryChange = (newGameId: string) => {
    setGameId(newGameId);
    // Reset sentences to just the narrative when switching stories
    setSentences([{ id: 'narrative-main', text: '', isNarrative: true }]);
    setEditingId(null);
  };

  return (
    <div className='story-editor'>
      <div className='story-header'>
        <div className='header-title'>
          <BookOpen size={20} strokeWidth={1.5} />
          <h2>My Story</h2>
        </div>
        <div className='story-selector'>
          <select
            value={gameId}
            onChange={e => handleStoryChange(e.target.value)}
          >
            {Object.keys(gameStore).map(id => (
              <option key={id} value={id}>
                {storyLabels[id] || id}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className='ruled-paper'>
        <div className='sentences-container'>
          {sentences.map((sentence, index) => (
            <div
              key={sentence.id}
              className={`sentence-row ${sentence.isNarrative ? 'narrative' : 'plain'}`}
            >
              <div className='sentence-content'>
                {sentence.isNarrative ? (
                  <div className='narrative-sentence'>
                    {renderNarrativeSlots()}
                  </div>
                ) : editingId === sentence.id ? (
                  <textarea
                    className='sentence-textarea'
                    value={sentence.text}
                    onChange={e =>
                      handleSentenceChange(sentence.id, e.target.value)
                    }
                    onKeyDown={e => handleSentenceKeyDown(e, sentence.id)}
                    onBlur={() => setEditingId(null)}
                    placeholder='Continue the story...'
                    autoFocus
                  />
                ) : (
                  <div
                    className='sentence-display'
                    onDoubleClick={() => setEditingId(sentence.id)}
                  >
                    {sentence.text || (
                      <span className='placeholder-text'>
                        Double-click to write...
                      </span>
                    )}
                  </div>
                )}
              </div>
              {!sentence.isNarrative && (
                <button
                  className='delete-sentence-btn'
                  onClick={() => handleDeleteSentence(sentence.id)}
                  title='Delete sentence'
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        <button className='add-sentence-btn' onClick={handleAddSentence}>
          <Plus size={16} />
          <span>add another line</span>
        </button>
      </div>
    </div>
  );
}
