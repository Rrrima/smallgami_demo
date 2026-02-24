import { useState } from 'react';
import Gallery          from './components/Gallery';
import GameView         from './components/GameView';
import GamePreviewPanel from './components/GamePreviewPanel';
import { GameMeta }     from './games';

export default function App() {
  const [selected, setSelected] = useState<GameMeta | null>(null);
  const [preview,  setPreview]  = useState<GameMeta | null>(null);

  // Full-page game view
  if (selected) {
    return <GameView game={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <>
      <Gallery onSelect={setPreview} />
      <GamePreviewPanel
        game={preview}
        onClose={() => setPreview(null)}
        onExpand={() => {
          if (preview) { setSelected(preview); setPreview(null); }
        }}
      />
    </>
  );
}
