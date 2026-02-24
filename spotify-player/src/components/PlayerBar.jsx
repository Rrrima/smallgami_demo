import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Play, Pause, SkipBack, SkipForward, Repeat, Shuffle,
  Volume2, VolumeX,
} from 'lucide-react'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function PlayerBar({
  track,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
}) {
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(75)
  const [muted, setMuted] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const progressInterval = useRef(null)
  const totalSeconds = useRef(parseDuration(track.duration))

  function parseDuration(dur) {
    const [m, s] = dur.split(':').map(Number)
    return m * 60 + s
  }

  useEffect(() => {
    totalSeconds.current = parseDuration(track.duration)
    setProgress(0)
  }, [track])

  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          const next = prev + 0.25
          if (next >= totalSeconds.current) {
            clearInterval(progressInterval.current)
            return totalSeconds.current
          }
          return next
        })
      }, 250)
    } else {
      clearInterval(progressInterval.current)
    }
    return () => clearInterval(progressInterval.current)
  }, [isPlaying])

  const progressPercent = totalSeconds.current > 0
    ? (progress / totalSeconds.current) * 100
    : 0

  const handleProgressChange = useCallback((e) => {
    const val = parseFloat(e.target.value)
    setProgress((val / 100) * totalSeconds.current)
  }, [])

  return (
    <div className="player-bar">
      <div className="player-progress">
        <span className="player-time">{formatTime(progress)}</span>
        <div className="player-progress-bar-wrapper">
          <div className="player-progress-bar-bg">
            <div
              className="player-progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progressPercent}
            onChange={handleProgressChange}
            className="player-progress-input"
          />
        </div>
        <span className="player-time">{track.duration}</span>
      </div>

      <div className="player-controls">
        <button
          className={`player-ctrl-btn small ${shuffle ? 'active' : ''}`}
          onClick={() => setShuffle(!shuffle)}
        >
          <Shuffle size={18} />
        </button>
        <button className="player-ctrl-btn" onClick={onPrev}>
          <SkipBack size={22} fill="currentColor" />
        </button>
        <button className="player-ctrl-btn play-btn" onClick={onTogglePlay}>
          {isPlaying
            ? <Pause size={22} fill="currentColor" />
            : <Play size={22} fill="currentColor" style={{ marginLeft: 2 }} />
          }
        </button>
        <button className="player-ctrl-btn" onClick={onNext}>
          <SkipForward size={22} fill="currentColor" />
        </button>
        <button
          className={`player-ctrl-btn small ${repeat ? 'active' : ''}`}
          onClick={() => setRepeat(!repeat)}
        >
          <Repeat size={18} />
        </button>
      </div>

      <div className="player-volume">
        <button
          className="player-ctrl-btn tiny"
          onClick={() => setMuted(!muted)}
        >
          {muted || volume === 0
            ? <VolumeX size={16} />
            : <Volume2 size={16} />
          }
        </button>
        <div className="player-volume-bar-wrapper">
          <div className="player-volume-bar-bg">
            <div
              className="player-volume-bar-fill"
              style={{ width: `${muted ? 0 : volume}%` }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={muted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseInt(e.target.value))
              if (muted) setMuted(false)
            }}
            className="player-volume-input"
          />
        </div>
      </div>
    </div>
  )
}
