import {
  Menu,
  Pen,
  Eraser,
  Layers,
  ChevronDown,
} from 'lucide-react'
import { MODELS } from '../services/geminiService'

// eslint-disable-next-line no-unused-vars
function ToolBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button
      title={label}
      onClick={onClick}
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        color: active ? '#0a84ff' : '#aeaeb2',
        background: active ? 'rgba(10,132,255,0.18)' : 'transparent',
        transition: 'background 0.12s, color 0.12s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <Icon size={18} strokeWidth={1.8} />
    </button>
  )
}

export default function TopBar({
  tool, setTool,
  showLayers, setShowLayers,
  showColors, setShowColors,
  color,
  aiModel, setAiModel, aiLoading,
}) {
  return (
    <div style={{
      height: 52,
      background: 'rgba(28,28,30,0.92)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      alignItems: 'center',
      paddingInline: 12,
      gap: 4,
      zIndex: 10,
      flexShrink: 0,
    }}>
      {/* Left group: Gallery + Model selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          title="Gallery"
          style={{
            height: 36,
            paddingInline: 14,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.08)',
            color: '#f2f2f7',
            fontSize: 13,
            fontWeight: 500,
            gap: 6,
            display: 'flex',
            alignItems: 'center',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Menu size={16} strokeWidth={1.8} />
          <span style={{ marginLeft: 6 }}>Gallery</span>
        </button>

        {/* Model selector */}
        <div style={{ position: 'relative', height: 36 }}>
          <select
            value={aiModel}
            onChange={(e) => setAiModel(e.target.value)}
            disabled={aiLoading}
            style={{
              height: 36,
              paddingLeft: 10,
              paddingRight: 24,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 12,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              appearance: 'none',
              outline: 'none',
              transition: 'background 0.15s',
            }}
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <ChevronDown
            size={11}
            style={{
              position: 'absolute',
              right: 7,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: 'rgba(255,255,255,0.4)',
            }}
          />
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right group: drawing tools + layers + color */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ToolBtn icon={Pen}    label="Brush"  active={tool === 'brush'}  onClick={() => setTool('brush')} />
        <ToolBtn icon={Eraser} label="Eraser" active={tool === 'eraser'} onClick={() => setTool('eraser')} />

        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 6px' }} />

        <ToolBtn icon={Layers} label="Layers" active={showLayers} onClick={() => setShowLayers(v => !v)} />

        {/* Color circle */}
        <button
          title="Colors"
          onClick={() => setShowColors(v => !v)}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: color,
            border: showColors
              ? '2.5px solid #0a84ff'
              : '2.5px solid rgba(255,255,255,0.25)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            marginLeft: 4,
            transition: 'border-color 0.15s',
            cursor: 'pointer',
            padding: 0,
          }}
        />
      </div>
    </div>
  )
}
