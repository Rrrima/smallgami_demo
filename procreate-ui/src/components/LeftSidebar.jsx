import { useRef, useCallback } from 'react'
import { Undo2, Redo2 } from 'lucide-react'

function VerticalSlider({ value, min, max, onChange }) {
  const trackRef = useRef(null)

  const handleDrag = useCallback((e) => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const ratio = 1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    onChange(Math.round(min + ratio * (max - min)))
  }, [min, max, onChange])

  const onPointerDown = (e) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    handleDrag(e)
  }

  const pct = ((value - min) / (max - min)) * 100

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      flexShrink: 0,
    }}>
      <div
        ref={trackRef}
        style={{
          width: 32,
          height: 180,
          borderRadius: 4,
          background: 'rgba(255,255,255,0.07)',
          position: 'relative',
          cursor: 'ns-resize',
          overflow: 'hidden',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={(e) => e.buttons === 1 && handleDrag(e)}
      >
        {/* Fill */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${pct}%`,
          background: 'rgba(255,255,255,0.18)',
          transition: 'height 0.05s',
        }} />
        {/* Rectangular thumb */}
        <div style={{
          position: 'absolute',
          left: 3,
          right: 3,
          bottom: `${pct}%`,
          transform: 'translateY(50%)',
          height: 8,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.55)',
          pointerEvents: 'none',
          transition: 'bottom 0.05s',
        }} />
      </div>
    </div>
  )
}

export default function LeftSidebar({
  brushSize, setBrushSize,
  opacity, setOpacity,
  canUndo, canRedo,
  onUndo, onRedo,
}) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      padding: '10px 0',
      boxSizing: 'border-box',
      gap: 14,
    }}>
      <VerticalSlider
        value={brushSize}
        min={1}
        max={100}
        onChange={setBrushSize}
        label="Size"
      />

      <VerticalSlider
        value={opacity}
        min={1}
        max={100}
        onChange={setOpacity}
        label="Opacity"
      />

      {/* Undo / Redo */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <button
          title="Undo"
          onClick={onUndo}
          disabled={!canUndo}
          style={{
            width: 34,
            height: 28,
            borderRadius: 7,
            background: 'transparent',
            color: canUndo ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.12s',
            border: 'none',
            cursor: canUndo ? 'pointer' : 'default',
            padding: 0,
          }}
        >
          <Undo2 size={18} strokeWidth={2} />
        </button>
        <button
          title="Redo"
          onClick={onRedo}
          disabled={!canRedo}
          style={{
            width: 34,
            height: 28,
            borderRadius: 7,
            background: 'transparent',
            color: canRedo ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.12s',
            border: 'none',
            cursor: canRedo ? 'pointer' : 'default',
            padding: 0,
          }}
        >
          <Redo2 size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
