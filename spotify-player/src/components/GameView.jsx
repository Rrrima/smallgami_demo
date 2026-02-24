import { useRef, useEffect, useState } from 'react'
import { Game, useGameStore } from '@smallgami/engine'

export default function GameView({ isPlaying, gameConfig, skybox }) {
  const gameRef = useRef(null)
  const setGameConfig = useGameStore(s => s.setGameConfig)
  const storedConfig = useGameStore(s => s.gameConfig)
  const [configLoaded, setConfigLoaded] = useState(false)

  useEffect(() => {
    if (isPlaying && gameConfig) {
      setConfigLoaded(false)
      setGameConfig({ ...gameConfig })
      requestAnimationFrame(() => setConfigLoaded(true))
    } else {
      const timer = setTimeout(() => {
        setConfigLoaded(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isPlaying, gameConfig, setGameConfig])

  useEffect(() => {
    if (isPlaying && configLoaded && gameRef.current) {
      const timer = setTimeout(() => gameRef.current?.play(), 100)
      return () => clearTimeout(timer)
    }
  }, [isPlaying, configLoaded])

  return (
    <div className="game-view">
      <div
        className="game-card-idle"
        style={{
          opacity: isPlaying && configLoaded ? 0 : 1,
          backgroundImage: skybox ? `url(/assets/${skybox})` : undefined,
        }}
      />

      {configLoaded && storedConfig && (
        <div
          className="game-view-live"
          style={{
            opacity: isPlaying ? 1 : 0,
            pointerEvents: isPlaying ? 'auto' : 'none',
          }}
        >
          <Game
            ref={gameRef}
            key={`${storedConfig.id}-${Date.now()}`}
          />
        </div>
      )}
    </div>
  )
}
