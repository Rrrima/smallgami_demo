import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, X, Info, ChevronUp, ChevronDown, Sparkles, ImageUp } from 'lucide-react'
import Canvas from './components/Canvas'
import TopBar from './components/TopBar'
import LeftSidebar from './components/LeftSidebar'
import LayersPanel from './components/LayersPanel'
import ColorPicker from './components/ColorPicker'
import { generateBirdVariations, generateWorldAssets, MODELS } from './services/geminiService'
import './App.css'

let nextLayerId = 4

export default function App() {
  const [mode, setMode] = useState('edit') // 'edit' | 'play'
  const [tool, setTool] = useState('brush')
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(24)
  const [opacity, setOpacity] = useState(80)
  const [layers, setLayers] = useState([
    { id: 1, name: 'World',      visible: true, opacity: 100, locked: true, type: 'world' },
    { id: 2, name: 'Obstacles',  visible: true, opacity: 100, locked: true, type: 'obstacles' },
    { id: 3, name: 'Bird Sketch', visible: true, opacity: 100 },
  ])
  const [activeLayerId, setActiveLayerId] = useState(3)
  const [showLayers, setShowLayers] = useState(false)
  const [showColors, setShowColors] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [aiResults, setAiResults] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiModel, setAiModel] = useState(MODELS[0].id)
  const [selectedBirdInfo, setSelectedBirdInfo] = useState(null)
  const [propagate, setPropagate] = useState(false)
  const [selectedBirdCard, setSelectedBirdCard] = useState(null)
  const [propagatedAssets, setPropagatedAssets] = useState(null)
  const [propagating, setPropagating] = useState(false)
  const [resultsExpanded, setResultsExpanded] = useState(false)
  const [uploadImage, setUploadImage] = useState(null)
  const fileInputRef = useRef(null)
  const canvasActionsRef = useRef(null)

  const handleUndo = () => canvasActionsRef.current?.undo()
  const handleRedo = () => canvasActionsRef.current?.redo()

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setUploadImage(reader.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  const handleUploadConfirm = useCallback((croppedDataUrl) => {
    canvasActionsRef.current?.drawImageToBirdArea(croppedDataUrl)
    setUploadImage(null)
  }, [])

  const handleUploadCancel = useCallback(() => {
    setUploadImage(null)
  }, [])

  const handleAiClick = useCallback(async () => {
    if (aiLoading) return
    setAiLoading(true)
    setSelectedBirdInfo(null)
    setResultsExpanded(true)
    try {
      const sketchDataUrl = canvasActionsRef.current?.exportBirdRegion?.()
      console.log('[AI] Bird area empty:', !sketchDataUrl)
      console.log(`[AI] Calling ${aiModel}...`)
      const results = await generateBirdVariations(sketchDataUrl || null, aiModel)
      console.log('[AI] Got results:', results.length, 'items')

      // Prepend original drawing if sketch exists
      const finalResults = sketchDataUrl
        ? [
            {
              image: sketchDataUrl,
              info: { name: 'The OG', characteristics: 'Straight from your fingertips — raw, unfiltered, legendary.', speed: 50, mass: 50, stability: 50, jumpPower: 50 },
              label: 'Original',
            },
            ...results,
          ]
        : results

      setAiResults(finalResults)
    } catch (err) {
      console.error('[AI] Generation failed:', err)
    } finally {
      setAiLoading(false)
    }
  }, [aiLoading, aiModel])

  const addLayer = () => {
    const id = nextLayerId++
    setLayers(prev => [...prev, { id, name: `Layer ${id}`, visible: true, opacity: 100 }])
    setActiveLayerId(id)
  }

  const removeLayer = (id) => {
    const target = layers.find(l => l.id === id)
    if (!target || target.locked) return
    if (layers.filter(l => !l.locked).length <= 1) return
    setLayers(prev => {
      const remaining = prev.filter(l => l.id !== id)
      if (activeLayerId === id) {
        const unlocked = remaining.filter(l => !l.locked)
        setActiveLayerId(unlocked.at(-1).id)
      }
      return remaining
    })
  }

  const updateLayer = (id, changes) =>
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...changes } : l))

  const enterPlayMode = () => {
    setShowLayers(false)
    setShowColors(false)
    setMode('play')
  }

  const handleCardClick = useCallback((item) => {
    canvasActionsRef.current?.drawImageToBirdArea(item.image)
    setSelectedBirdCard(item)
    if (propagate) {
      setPropagating(true)
      generateWorldAssets(item.image, aiModel)
        .then((assets) => {
          setPropagatedAssets(assets)
          setPropagating(false)
        })
        .catch((err) => {
          console.error('[Propagate] World asset generation failed:', err)
          setPropagating(false)
        })
    }
  }, [propagate, aiModel])

  const handleSetPropagate = useCallback((val) => {
    setPropagate((prev) => {
      const next = typeof val === 'function' ? val(prev) : val
      if (!next) {
        setPropagatedAssets(null)
      }
      return next
    })
  }, [])

  const handlePropagate = useCallback(() => {
    if (propagating) return
    const card = selectedBirdCard
    const imageToUse = card?.image || canvasActionsRef.current?.exportBirdRegion?.()
    if (!imageToUse) return
    setPropagating(true)
    generateWorldAssets(imageToUse, aiModel)
      .then((assets) => {
        setPropagatedAssets(assets)
        setPropagating(false)
      })
      .catch((err) => {
        console.error('[Propagate] World asset generation failed:', err)
        setPropagating(false)
      })
  }, [propagating, selectedBirdCard, aiModel])

  // Build default + AI cards for results panel
  const getResultsCards = useCallback(() => {
    const cards = []
    // Default bird
    cards.push({ image: '/assets/yellowbird-downflap.png', label: 'Default' })
    // AI results
    cards.push(...aiResults)
    return cards
  }, [aiResults])

  // Cmd+Enter to toggle play mode, ESC to exit play mode
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (mode === 'edit') {
          enterPlayMode()
        } else {
          setMode('edit')
        }
        return
      }
      if (e.key === 'Escape' && mode === 'play') {
        setMode('edit')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode])

  const isPlaying = mode === 'play'

  const STAT_COLORS = {
    speed: '#4fc3f7',
    mass: '#ff8a65',
    stability: '#81c784',
    jumpPower: '#ba68c8',
  }

  const totalCards = aiResults.length + 1 // +1 for default, drawing is dynamic

  return (
    <div className={`app${isPlaying ? ' is-playing' : ''}`}>
      {/* Floating play / esc-to-edit banner */}
      <button
        className={`mode-banner${isPlaying ? ' is-playing' : ''}`}
        onClick={() => isPlaying ? setMode('edit') : enterPlayMode()}
      >
        {isPlaying ? (
          <>Press <strong>ESC</strong> to edit</>
        ) : (
          <>
            <Play size={12} strokeWidth={2.5} fill="rgba(255,255,255,0.8)" />
            <span>Play</span>
            <kbd>&#8984;&#9166;</kbd>
          </>
        )}
      </button>

      {/* TopBar — slides up and hides in play mode */}
      <div className={`topbar-area${isPlaying ? ' is-playing' : ''}`}>
        <TopBar
          tool={tool}
          setTool={setTool}
          showLayers={showLayers}
          setShowLayers={setShowLayers}
          showColors={showColors}
          setShowColors={setShowColors}
          color={color}
          aiModel={aiModel}
          setAiModel={setAiModel}
          aiLoading={aiLoading}
        />
      </div>

      {/* Sidebar — slides left and hides in play mode */}
      <div className={`sidebar-area${isPlaying ? ' is-playing' : ''}`}>
        <LeftSidebar
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          opacity={opacity}
          setOpacity={setOpacity}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClearBirdArea={() => canvasActionsRef.current?.clearBirdArea()}
        />
      </div>

      {/* Canvas area — stays the same size */}
      <div className="canvas-area">
        <Canvas
          actionsRef={canvasActionsRef}
          tool={tool}
          color={color}
          brushSize={brushSize}
          opacity={opacity}
          layers={layers}
          activeLayerId={activeLayerId}
          onHistoryChange={(u, r) => { setCanUndo(u); setCanRedo(r) }}
          mode={mode}
          propagatedAssets={propagatedAssets}
          propagating={propagating}
          uploadImage={uploadImage}
          onUploadConfirm={handleUploadConfirm}
          onUploadCancel={handleUploadCancel}
        />

        {showColors && !isPlaying && (
          <ColorPicker
            color={color}
            onChange={setColor}
            onClose={() => setShowColors(false)}
          />
        )}

        {showLayers && !isPlaying && (
          <LayersPanel
            layers={layers}
            activeLayerId={activeLayerId}
            setActiveLayerId={setActiveLayerId}
            onAddLayer={addLayer}
            onRemoveLayer={removeLayer}
            onUpdateLayer={updateLayer}
            onClose={() => setShowLayers(false)}
            propagate={propagate}
            setPropagate={handleSetPropagate}
            onPropagate={handlePropagate}
            propagating={propagating}
          />
        )}
      </div>

      {/* Results panel — always visible, collapsible */}
      {!isPlaying && (
        <>
          {!resultsExpanded ? (
            /* Collapsed tab handle */
            <div
              className="results-tab-collapsed"
              onClick={() => setResultsExpanded(true)}
            >
              <ChevronUp size={14} strokeWidth={2} />
              {aiResults.length > 0 && (
                <span className="results-tab-badge">{totalCards}</span>
              )}
            </div>
          ) : (
            /* Expanded results bar */
            <div className="ai-results-bar">
              <button
                className="ai-results-dismiss"
                onClick={() => setResultsExpanded(false)}
                title="Collapse"
              >
                <ChevronDown size={14} />
              </button>

              {getResultsCards().map((item, i) => (
                <div key={i} className="ai-results-card-wrapper">
                  <div
                    className="ai-results-card"
                    onClick={() => handleCardClick(item)}
                  >
                    <img src={item.image} alt={item.label} />
                    {item.info && (
                      <button
                        className="info-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedBirdInfo(selectedBirdInfo?.label === item.label ? null : item)
                        }}
                      >
                        <Info size={10} />
                      </button>
                    )}
                  </div>
                  <span className="card-label">{item.label}</span>
                </div>
              ))}

              <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

              {/* Upload image button */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <button
                title="Upload image to bird area"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.1)',
                  color: '#f2f2f7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                  flexShrink: 0,
                  padding: 0,
                }}
              >
                <ImageUp size={15} strokeWidth={1.8} />
              </button>

              {/* AI Generate button */}
              <button
                title="Generate bird with AI"
                onClick={handleAiClick}
                disabled={aiLoading}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: aiLoading ? 'rgba(10,132,255,0.25)' : 'rgba(255,255,255,0.1)',
                  color: aiLoading ? '#0a84ff' : '#f2f2f7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: aiLoading ? 'wait' : 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                  flexShrink: 0,
                  padding: 0,
                }}
              >
                {aiLoading ? (
                  <span className="ai-spinner" />
                ) : (
                  <Sparkles size={15} strokeWidth={1.8} />
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Bird info panel */}
      {selectedBirdInfo && !isPlaying && (
        <div className="ai-info-panel">
          <button className="ai-info-panel-close" onClick={() => setSelectedBirdInfo(null)}>
            <X size={12} />
          </button>
          <div className="ai-info-panel-preview">
            <img src={selectedBirdInfo.image} alt={selectedBirdInfo.info.name} />
          </div>
          <div className="ai-info-panel-name">{selectedBirdInfo.info.name}</div>
          <div className="ai-info-panel-chars">{selectedBirdInfo.info.characteristics}</div>
          <div className="ai-info-panel-stats">
            {['speed', 'mass', 'stability', 'jumpPower'].map((stat) => (
              <div key={stat} className="stat-row">
                <span className="stat-label">{stat === 'jumpPower' ? 'Jump' : stat}</span>
                <div className="stat-bar-bg">
                  <div
                    className="stat-bar-fill"
                    style={{
                      width: `${selectedBirdInfo.info[stat]}%`,
                      backgroundColor: STAT_COLORS[stat],
                    }}
                  />
                </div>
                <span className="stat-value">{selectedBirdInfo.info[stat]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
