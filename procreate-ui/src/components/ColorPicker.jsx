import { useState, useRef, useEffect, useCallback } from 'react'

// ── Color math ─────────────────────────────────────────────
function hsvToHex(h, s, v) {
  s /= 100; v /= 100
  const f = (n) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return '#' + [f(5), f(3), f(1)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
}

function hexToHsv(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break
      case g: h = ((b - r) / d + 2) * 60; break
      case b: h = ((r - g) / d + 4) * 60; break
    }
  }
  return { h, s: s * 100, v: v * 100 }
}

// ── Preset palette ──────────────────────────────────────────
const PRESETS = [
  '#000000', '#ffffff', '#ff453a', '#ff9f0a',
  '#ffd60a', '#30d158', '#0a84ff', '#bf5af2',
  '#5e5ce6', '#ff375f', '#64d2ff', '#ac8e68',
]

// ── Component ───────────────────────────────────────────────
export default function ColorPicker({ color, onChange, onClose }) {
  const [hsv, setHsv] = useState(() => hexToHsv(color || '#000000'))
  const svRef = useRef(null)
  const hueRef = useRef(null)

  // Draw SV square
  useEffect(() => {
    const canvas = svRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { width: w, height: h } = canvas
    ctx.clearRect(0, 0, w, h)

    ctx.fillStyle = `hsl(${hsv.h}, 100%, 50%)`
    ctx.fillRect(0, 0, w, h)

    const wGrad = ctx.createLinearGradient(0, 0, w, 0)
    wGrad.addColorStop(0, 'rgba(255,255,255,1)')
    wGrad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = wGrad
    ctx.fillRect(0, 0, w, h)

    const bGrad = ctx.createLinearGradient(0, 0, 0, h)
    bGrad.addColorStop(0, 'rgba(0,0,0,0)')
    bGrad.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.fillStyle = bGrad
    ctx.fillRect(0, 0, w, h)
  }, [hsv.h])

  // Draw hue strip
  useEffect(() => {
    const canvas = hueRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0)
    for (let i = 0; i <= 12; i++) {
      grad.addColorStop(i / 12, `hsl(${i * 30}, 100%, 50%)`)
    }
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  const pickSV = useCallback((e) => {
    const canvas = svRef.current
    const rect = canvas.getBoundingClientRect()
    const s = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const v = Math.max(0, Math.min(100, (1 - (e.clientY - rect.top) / rect.height) * 100))
    const newHsv = { ...hsv, s, v }
    setHsv(newHsv)
    onChange(hsvToHex(newHsv.h, newHsv.s, newHsv.v))
  }, [hsv, onChange])

  const pickHue = useCallback((e) => {
    const canvas = hueRef.current
    const rect = canvas.getBoundingClientRect()
    const h = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360))
    const newHsv = { ...hsv, h }
    setHsv(newHsv)
    onChange(hsvToHex(newHsv.h, newHsv.s, newHsv.v))
  }, [hsv, onChange])

  const makeDragHandler = (pickFn) => (e) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    pickFn(e)
  }

  const svCursorX = `${hsv.s}%`
  const svCursorY = `${100 - hsv.v}%`
  const hueCursorX = `${(hsv.h / 360) * 100}%`

  return (
    <div style={{
      position: 'absolute',
      top: 8,
      right: 8,
      width: 256,
      background: 'rgba(44,44,46,0.97)',
      backdropFilter: 'blur(24px)',
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
      zIndex: 60,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Colors</span>
        <button
          onClick={onClose}
          style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'rgba(255,255,255,0.08)', color: '#8e8e93', fontSize: 16,
          }}
        >✕</button>
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* SV square */}
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', cursor: 'crosshair' }}>
          <canvas
            ref={svRef}
            width={228}
            height={160}
            style={{ display: 'block', width: '100%', height: 160 }}
            onPointerDown={makeDragHandler(pickSV)}
            onPointerMove={(e) => e.buttons === 1 && pickSV(e)}
          />
          {/* Crosshair cursor */}
          <div style={{
            position: 'absolute',
            left: svCursorX,
            top: svCursorY,
            transform: 'translate(-50%, -50%)',
            width: 14,
            height: 14,
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.4)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Hue strip */}
        <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', cursor: 'ew-resize' }}>
          <canvas
            ref={hueRef}
            width={228}
            height={18}
            style={{ display: 'block', width: '100%', height: 18 }}
            onPointerDown={makeDragHandler(pickHue)}
            onPointerMove={(e) => e.buttons === 1 && pickHue(e)}
          />
          {/* Hue cursor */}
          <div style={{
            position: 'absolute',
            left: hueCursorX,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 14,
            height: 14,
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.4)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Current color + hex */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            background: color,
            border: '1px solid rgba(255,255,255,0.1)',
            flexShrink: 0,
          }} />
          <input
            value={color}
            onChange={(e) => {
              const v = e.target.value
              if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                onChange(v)
                setHsv(hexToHsv(v))
              }
            }}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '6px 10px',
              color: '#f2f2f7',
              fontFamily: 'monospace',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>

        {/* Preset swatches */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
          {PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => { onChange(c); setHsv(hexToHsv(c)) }}
              style={{
                aspectRatio: '1',
                borderRadius: 7,
                background: c,
                border: color === c ? '2px solid #0a84ff' : '1.5px solid rgba(255,255,255,0.1)',
                transition: 'border-color 0.1s',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
