import { useState, useRef, useCallback, useMemo } from 'react'
import { Heart, MoreHorizontal } from 'lucide-react'
import GameView from './GameView'
import GAMES from '../config/gameConfigs'

const SWIPE_THRESHOLD = 60

export default function NowPlaying({
  track,
  game,
  gameIndex,
  gameCount,
  isPlaying,
  onNextGame,
  onPrevGame,
}) {
  const [dragY, setDragY] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [animate, setAnimate] = useState(true)
  const dragging = useRef(false)
  const startY = useRef(0)
  const startX = useRef(0)
  const locked = useRef(null)

  const nextGame = useMemo(
    () => GAMES[(gameIndex + 1) % gameCount],
    [gameIndex, gameCount],
  )

  const onPointerDown = useCallback((e) => {
    if (isPlaying || transitioning) return
    dragging.current = true
    locked.current = null
    startY.current = e.clientY
    startX.current = e.clientX
    setAnimate(false)
    setDragY(0)
  }, [isPlaying, transitioning])

  const onPointerMove = useCallback((e) => {
    if (!dragging.current || transitioning) return
    const dy = e.clientY - startY.current
    const dx = e.clientX - startX.current

    if (!locked.current) {
      if (Math.abs(dy) > 8 || Math.abs(dx) > 8) {
        locked.current = Math.abs(dy) > Math.abs(dx) ? 'vertical' : 'horizontal'
      }
      return
    }

    if (locked.current !== 'vertical') return
    e.preventDefault()
    const clamped = Math.min(0, dy * 0.7)
    setDragY(clamped)
  }, [transitioning])

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false

    if (locked.current !== 'vertical') {
      setAnimate(true)
      setDragY(0)
      return
    }

    if (dragY < -SWIPE_THRESHOLD) {
      setTransitioning(true)
      setAnimate(true)
      setDragY(-window.innerHeight)

      setTimeout(() => {
        onNextGame()
        setAnimate(false)
        setDragY(0)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTransitioning(false)
          })
        })
      }, 350)
    } else {
      setAnimate(true)
      setDragY(0)
    }
  }, [dragY, onNextGame])

  const currentStyle = {
    transform: `translateY(${dragY}px)`,
    transition: animate ? 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
    zIndex: 2,
  }

  return (
    <div className="now-playing">
      <div
        className="game-feed"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: 'pan-x', cursor: isPlaying ? 'default' : 'grab' }}
      >
        {/* Next game sitting underneath */}
        <div className="game-card next-card">
          <div
            className="game-card-idle"
            style={{ backgroundImage: `url(/assets/${nextGame.skybox})` }}
          />
          <div className="game-card-caption">{nextGame.name}</div>
        </div>

        {/* Current game on top, moves with drag */}
        <div className="game-card" style={currentStyle}>
          <GameView isPlaying={isPlaying} gameConfig={game.config} skybox={game.skybox} />
          <div className="game-card-caption">{game.name}</div>
        </div>
      </div>

      <div className="now-playing-info">
        <div className="now-playing-text">
          <div className="now-playing-title">{track.title}</div>
          <div className="now-playing-artist">{track.artist}</div>
        </div>
        <div className="now-playing-meta">
          <div className="game-dots">
            {Array.from({ length: gameCount }, (_, i) => (
              <div
                key={i}
                className={`game-dot ${i === gameIndex ? 'active' : ''}`}
              />
            ))}
          </div>
          <div className="now-playing-actions">
            <button className="now-playing-action-btn">
              <Heart size={20} strokeWidth={1.8} />
            </button>
            <button className="now-playing-action-btn">
              <MoreHorizontal size={20} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
