import { useState, useCallback } from 'react'
import NowPlaying from './components/NowPlaying'
import PlayerBar from './components/PlayerBar'
import GAMES from './config/gameConfigs'
import './App.css'

const TRACKS = [
  { id: 1, title: 'Flappy Bird',       artist: 'smallGami',     duration: '3:24' },
  { id: 2, title: 'Pipe Dreams',       artist: 'Pixel Beats',   duration: '4:12' },
  { id: 3, title: 'Sky High Score',    artist: 'Chiptune Wave', duration: '2:58' },
  { id: 4, title: 'Wing Commander',    artist: 'smallGami',     duration: '3:45' },
  { id: 5, title: 'Game Over Blues',   artist: 'Retro Circuit', duration: '5:01' },
  { id: 6, title: 'Level Up',          artist: 'Pixel Beats',   duration: '3:33' },
  { id: 7, title: 'Checkpoint Waltz',  artist: 'Chiptune Wave', duration: '4:20' },
]

export default function App() {
  const [trackIndex, setTrackIndex] = useState(0)
  const [gameIndex, setGameIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const currentTrack = TRACKS[trackIndex]
  const currentGame = GAMES[gameIndex]

  const handleTogglePlay = useCallback(() => {
    setIsPlaying(prev => !prev)
  }, [])

  const handleNextTrack = useCallback(() => {
    setTrackIndex(prev => (prev + 1) % TRACKS.length)
  }, [])

  const handlePrevTrack = useCallback(() => {
    setTrackIndex(prev => (prev - 1 + TRACKS.length) % TRACKS.length)
  }, [])

  const handleNextGame = useCallback(() => {
    setIsPlaying(false)
    setGameIndex(prev => (prev + 1) % GAMES.length)
  }, [])

  const handlePrevGame = useCallback(() => {
    setIsPlaying(false)
    setGameIndex(prev => (prev - 1 + GAMES.length) % GAMES.length)
  }, [])

  return (
    <div className="app">
      <div className="app-content">
        <NowPlaying
          track={currentTrack}
          game={currentGame}
          gameIndex={gameIndex}
          gameCount={GAMES.length}
          isPlaying={isPlaying}
          onNextGame={handleNextGame}
          onPrevGame={handlePrevGame}
        />
        <PlayerBar
          track={currentTrack}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onNext={handleNextTrack}
          onPrev={handlePrevTrack}
        />
      </div>
    </div>
  )
}
