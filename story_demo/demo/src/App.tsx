/**
 * @file App.tsx
 * @description Story Demo — Children's storybook layout.
 * Left page: narrative text (page 0) or user sentences + 2x2 sticky block cards below.
 * Right page: persistent game canvas.
 * Page flipping replaces "add another line".
 */

import './main.scss';
import './styles/app.scss';
import LeftPageContent from './components/LeftPageContent';
import PageNavigation from './components/PageNavigation';
import StickyBlocks from './components/StickyBlocks';
import { useEffect, useState, useCallback } from 'react';
import { useGameStore, Game } from '@smallgami/engine';
import gameStore from './config/gameStore';

const storyLabels: Record<string, string> = {
  cr_persimon_a: 'Bear & Persimmons',
  christmas: 'Christmas',
  flappy_bird: 'Flappy Bird',
  platform_forest: 'Forest Platformer',
  running_christmas: 'Christmas Runner',
};

const mechanismLabels: Record<string, string> = {
  cr_persimon_a: 'Catcher',
  christmas: 'Dodge & Catch',
  running_christmas: 'Run & Catch',
  flappy_bird: 'Flappy Bird',
  platform_forest: 'Platformer',
};

interface Page {
  id: string;
  text: string;
  isNarrative: boolean;
}

function App() {
  const [gameId, setGameId] = useState('cr_persimon_a');
  const [configLoaded, setConfigLoaded] = useState(false);
  const [narrativeSlots, setNarrativeSlots] = useState<Record<string, string>>(
    {}
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [currentObjectIndex, setCurrentObjectIndex] = useState(0);
  const [generatingBlocks, setGeneratingBlocks] = useState<Set<string>>(
    new Set()
  );
  const setGameConfig = useGameStore(state => state.setGameConfig);
  const gameConfig = useGameStore(state => state.gameConfig);

  // Page state — lifted from StoryEditor
  const [pages, setPages] = useState<Page[]>([
    { id: 'narrative-main', text: '', isNarrative: true },
  ]);
  const [currentPage, setCurrentPage] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load game config
  useEffect(() => {
    const loadGameConfig = () => {
      setConfigLoaded(false);
      try {
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
  }, [gameId, setGameConfig]);

  // Page navigation handlers
  const handleNextPage = useCallback(() => {
    if (currentPage === pages.length - 1) {
      // On last page — create a new blank page
      const newPage: Page = {
        id: `page-${Date.now()}`,
        text: '',
        isNarrative: false,
      };
      setPages(prev => [...prev, newPage]);
      setCurrentPage(prev => prev + 1);
    } else {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, pages.length]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const handleDeletePage = useCallback(() => {
    if (pages[currentPage]?.isNarrative) return;
    setPages(prev => prev.filter((_, i) => i !== currentPage));
    setCurrentPage(prev => Math.max(0, prev - 1));
  }, [currentPage, pages]);

  const handlePageTextChange = useCallback((id: string, text: string) => {
    setPages(prev => prev.map(p => (p.id === id ? { ...p, text } : p)));
  }, []);

  const handleSlotChange = useCallback((key: string, value: string) => {
    setNarrativeSlots(prev => ({ ...prev, [key]: value }));
  }, []);

  // Story change resets pages
  const handleStoryChange = useCallback((newGameId: string) => {
    setGameId(newGameId);
    setPages([{ id: 'narrative-main', text: '', isNarrative: true }]);
    setCurrentPage(0);
  }, []);

  const activePage = pages[currentPage];

  return (
    <div className='app-container'>
      <div className='book-wrapper'>
        {/* Bookmarks — mechanism selector tabs on the left edge */}
        <div className='book-bookmarks'>
          {Object.keys(gameStore).map(id => (
            <button
              key={id}
              className={`book-bookmark ${gameId === id ? 'active' : ''}`}
              onClick={() => handleStoryChange(id)}
            >
              {storyLabels[id] || id}
            </button>
          ))}
        </div>

        <div className='storybook'>
          {/* Left Page — narrative / text + cards */}
          <div className='left-page'>
            <div className='mechanism-caption'>{mechanismLabels[gameId] || gameId}</div>
            <LeftPageContent
              page={activePage}
              narrativeSlots={narrativeSlots}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
              currentObjectIndex={currentObjectIndex}
              setCurrentObjectIndex={setCurrentObjectIndex}
              gameId={gameId}
              editingId={editingId}
              setEditingId={setEditingId}
              onPageTextChange={handlePageTextChange}
              onSlotChange={handleSlotChange}
            />

            {!activePage?.isNarrative && (
              <div className='change-caption'>What changed?</div>
            )}

            <StickyBlocks
              gameId={gameId}
              setGameId={handleStoryChange}
              narrativeSlots={narrativeSlots}
              setNarrativeSlots={setNarrativeSlots}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
              currentObjectIndex={currentObjectIndex}
              setCurrentObjectIndex={setCurrentObjectIndex}
              generatingBlocks={generatingBlocks}
              setGeneratingBlocks={setGeneratingBlocks}
            />

            <PageNavigation
              currentPage={currentPage}
              totalPages={pages.length}
              onPrev={handlePrevPage}
              onNext={handleNextPage}
              onDelete={handleDeletePage}
              isNarrativePage={activePage?.isNarrative ?? true}
            />
          </div>

          {/* Book Spine */}
          <div className='book-spine' />

          {/* Right Page — Game Canvas */}
          <div className='right-page'>
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
                  color: '#aaa',
                  fontFamily: "'Patrick Hand', 'Caveat', cursive",
                  fontSize: '18px',
                }}
              >
                Loading story...
              </div>
            )}
            <div className='right-page-number'>
              p.{currentPage + 1}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
