import { Wand2, RefreshCw } from 'lucide-react'

function EyeIcon({ visible }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {visible
        ? <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </>
        : <>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </>
      }
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

const PANEL_BG = 'rgb(44,44,46)'

export default function LayersPanel({
  layers,
  activeLayerId,
  setActiveLayerId,
  onAddLayer,
  onRemoveLayer,
  onUpdateLayer,
  onClose,
  propagate,
  setPropagate,
  onPropagate,
  propagating,
}) {
  // Split layers into locked and unlocked (rendered bottom-to-top)
  const reversed = [...layers].reverse()
  const lockedLayers = reversed.filter(l => l.locked)
  const unlockedLayers = reversed.filter(l => !l.locked)

  const renderLayer = (layer) => {
    const active = layer.id === activeLayerId
    const locked = layer.locked
    return (
      <div
        key={layer.id}
        onClick={() => { if (!locked) setActiveLayerId(layer.id) }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 14px 8px 0',
          background: active && !locked ? 'rgba(10,132,255,0.15)' : 'transparent',
          cursor: locked ? 'default' : 'pointer',
          opacity: locked ? 0.6 : 1,
          transition: 'background 0.12s',
        }}
      >
        {/* Thumbnail placeholder */}
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 6,
          background: 'rgba(255,255,255,0.06)',
          border: active && !locked ? '1.5px solid #0a84ff' : '1.5px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13,
            fontWeight: active && !locked ? 600 : 400,
            color: active && !locked ? '#f2f2f7' : '#aeaeb2',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}>
            {layer.name}
            {locked && <span style={{ color: '#636366' }}><LockIcon /></span>}
          </div>
          {/* Opacity mini-slider — hidden for locked layers */}
          {!locked && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <input
                type="range"
                min={0}
                max={100}
                value={layer.opacity}
                onChange={(e) => onUpdateLayer(layer.id, { opacity: Number(e.target.value) })}
                onClick={(e) => e.stopPropagation()}
                style={{ flex: 1, height: 3, accentColor: '#0a84ff', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 10, color: '#636366', width: 24 }}>{layer.opacity}%</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            title={layer.visible ? 'Hide' : 'Show'}
            onClick={(e) => { e.stopPropagation(); onUpdateLayer(layer.id, { visible: !layer.visible }) }}
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              color: layer.visible ? '#f2f2f7' : '#48484a',
              background: 'transparent',
            }}
          >
            <EyeIcon visible={layer.visible} />
          </button>

          {!locked && layers.filter(l => !l.locked).length > 1 && (
            <button
              title="Delete layer"
              onClick={(e) => { e.stopPropagation(); onRemoveLayer(layer.id) }}
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                color: '#ff453a',
                background: 'transparent',
              }}
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'absolute',
      top: 8,
      right: 8,
      width: 260,
      background: 'rgba(44,44,46,0.96)',
      backdropFilter: 'blur(24px)',
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
      zIndex: 50,
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
        <span style={{ fontWeight: 600, fontSize: 14 }}>Layers</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onAddLayer}
            title="Add layer"
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'rgba(10,132,255,0.2)',
              color: '#0a84ff',
              fontSize: 18,
              fontWeight: 300,
            }}
          >+</button>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'rgba(255,255,255,0.08)',
              color: '#8e8e93',
              fontSize: 16,
            }}
          >✕</button>
        </div>
      </div>

      {/* Layer list with sync bracket on the left */}
      <div style={{ maxHeight: 360, overflowY: 'auto', padding: '6px 0' }}>
        <div style={{ display: 'flex' }}>
          {/* Left gutter: sync bracket + controls */}
          <div style={{
            width: 28,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            {/* Bracket line spanning all layers */}
            <div style={{
              position: 'absolute',
              top: 8,
              bottom: 8,
              left: 13,
              width: 1.5,
              borderRadius: 1,
              background: propagate ? 'rgba(10,132,255,0.4)' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.15s',
            }} />
            {/* Top cap */}
            <div style={{
              position: 'absolute',
              top: 8,
              left: 13,
              width: 6,
              height: 1.5,
              borderRadius: 1,
              background: propagate ? 'rgba(10,132,255,0.4)' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.15s',
            }} />
            {/* Bottom cap */}
            <div style={{
              position: 'absolute',
              bottom: 8,
              left: 13,
              width: 6,
              height: 1.5,
              borderRadius: 1,
              background: propagate ? 'rgba(10,132,255,0.4)' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.15s',
            }} />

            {/* Buttons stacked vertically, centered, with solid bg to mask bracket */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              zIndex: 1,
            }}>
              {/* Auto-sync toggle */}
              <button
                title={propagate ? 'Auto-sync on (click to disable)' : 'Enable auto-sync'}
                onClick={(e) => { e.stopPropagation(); setPropagate(v => !v) }}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: PANEL_BG,
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: propagate ? '#0a84ff' : 'rgba(255,255,255,0.25)',
                  transition: 'color 0.15s',
                }}
              >
                <RefreshCw
                  size={12}
                  strokeWidth={2}
                  style={{
                    animation: propagating ? 'ai-spin 0.7s linear infinite' : 'none',
                  }}
                />
              </button>

              {/* One-shot propagate */}
              <button
                title="Propagate now"
                onClick={(e) => { e.stopPropagation(); onPropagate() }}
                disabled={propagating}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: PANEL_BG,
                  border: 'none',
                  cursor: propagating ? 'wait' : 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: propagating ? '#0a84ff' : 'rgba(255,255,255,0.25)',
                  transition: 'color 0.15s',
                }}
              >
                <Wand2 size={12} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Layer rows */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {unlockedLayers.map(renderLayer)}

            {/* Divider between unlocked and locked layers */}
            {lockedLayers.length > 0 && unlockedLayers.length > 0 && (
              <div style={{
                height: 1,
                background: 'rgba(255,255,255,0.08)',
                margin: '6px 14px 6px 0',
              }} />
            )}

            {lockedLayers.map(renderLayer)}
          </div>
        </div>
      </div>
    </div>
  )
}
