import { useRef, useEffect, useCallback, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Game, useGameStore } from '@smallgami/engine'
import flappyBirdConfig from '../config/flappyBirdConfig'

const CANVAS_W = 1200
const CANVAS_H = 900

// Bird drawing region — centered on the canvas
const BIRD_W = 150
const BIRD_H = 120
const BIRD_X = (CANVAS_W - BIRD_W) / 2
const BIRD_Y = (CANVAS_H - BIRD_H) / 2

export default function Canvas({
  actionsRef,
  tool,
  color,
  brushSize,
  opacity,
  layers,
  activeLayerId,
  onHistoryChange,
  mode, // 'edit' | 'play'
  propagatedAssets,
  propagating,
  uploadImage,
  onUploadConfirm,
  onUploadCancel,
}) {
  const viewportRef = useRef(null)
  const gameRef = useRef(null)
  const canvasRefs = useRef({})
  const isDrawing = useRef(false)
  const lastPoint = useRef(null)
  const historyMap = useRef({})
  const historyIdxMap = useRef({})
  const initialized = useRef(new Set())

  // Transform state stored as refs for use in pointer handlers
  const scaleRef = useRef(1)
  const offsetXRef = useRef(0)
  const offsetYRef = useRef(0)

  // State versions for rendering
  const [transform, setTransform] = useState({ scale: 1, offsetX: 0, offsetY: 0 })

  // Pan state
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })
  const spaceDown = useRef(false)

  // State versions for rendering
  const [isPanningState, setIsPanningState] = useState(false)
  const [spaceDownState, setSpaceDownState] = useState(false)

  // Game store — read gameConfig to gate rendering (like the demo does)
  const setGameConfig = useGameStore(state => state.setGameConfig)
  const gameConfig = useGameStore(state => state.gameConfig)
  const [configLoaded, setConfigLoaded] = useState(false)

  // Use refs for drawing props to avoid stale closures in pointer handlers
  const toolRef = useRef(tool)
  const colorRef = useRef(color)
  const brushSizeRef = useRef(brushSize)
  const opacityRef = useRef(opacity)
  const activeLayerIdRef = useRef(activeLayerId)
  const layersRef = useRef(layers)

  useEffect(() => { toolRef.current = tool }, [tool])
  useEffect(() => { colorRef.current = color }, [color])
  useEffect(() => { brushSizeRef.current = brushSize }, [brushSize])
  useEffect(() => { opacityRef.current = opacity }, [opacity])
  useEffect(() => { activeLayerIdRef.current = activeLayerId }, [activeLayerId])
  useEffect(() => { layersRef.current = layers }, [layers])

  // Upload overlay state
  const [uploadPos, setUploadPos] = useState({ x: 0, y: 0, scale: 1 })
  const uploadImgRef = useRef(null)
  const uploadNaturalSize = useRef({ w: 0, h: 0 })
  const uploadPosRef = useRef(uploadPos)
  useEffect(() => { uploadPosRef.current = uploadPos }, [uploadPos])

  // When uploadImage changes, load it and center on bird region
  useEffect(() => {
    if (!uploadImage) return
    const img = new Image()
    img.onload = () => {
      uploadImgRef.current = img
      uploadNaturalSize.current = { w: img.naturalWidth, h: img.naturalHeight }
      const fitScale = Math.min(BIRD_W / img.naturalWidth, BIRD_H / img.naturalHeight)
      setUploadPos({
        x: BIRD_X + (BIRD_W - img.naturalWidth * fitScale) / 2,
        y: BIRD_Y + (BIRD_H - img.naturalHeight * fitScale) / 2,
        scale: fitScale,
      })
    }
    img.src = uploadImage
  }, [uploadImage])

  // Upload drag via window-level listeners (avoids CSS transform issues)
  const startUploadDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const origX = uploadPosRef.current.x
    const origY = uploadPosRef.current.y

    const onMove = (ev) => {
      const s = scaleRef.current
      setUploadPos(prev => ({
        ...prev,
        x: origX + (ev.clientX - startX) / s,
        y: origY + (ev.clientY - startY) / s,
      }))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [])

  // Track active resizing for visual feedback
  const [isResizing, setIsResizing] = useState(false)
  const resizeTimer = useRef(null)

  // Upload resize via wheel — attached natively to avoid conflicts with viewport wheel
  const uploadOverlayRef = useRef(null)
  useEffect(() => {
    const el = uploadOverlayRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      e.stopPropagation()
      const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08
      setUploadPos(prev => ({
        ...prev,
        scale: Math.min(5, Math.max(0.2, prev.scale * factor)),
      }))
      setIsResizing(true)
      clearTimeout(resizeTimer.current)
      resizeTimer.current = setTimeout(() => setIsResizing(false), 300)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => { el.removeEventListener('wheel', onWheel); clearTimeout(resizeTimer.current) }
  }, [uploadImage])

  const handleUploadCrop = useCallback(() => {
    if (!uploadImgRef.current) return
    const { w, h } = uploadNaturalSize.current
    const full = document.createElement('canvas')
    full.width = CANVAS_W
    full.height = CANVAS_H
    const fCtx = full.getContext('2d')
    fCtx.drawImage(uploadImgRef.current, uploadPosRef.current.x, uploadPosRef.current.y, w * uploadPosRef.current.scale, h * uploadPosRef.current.scale)
    const crop = document.createElement('canvas')
    crop.width = BIRD_W
    crop.height = BIRD_H
    const cCtx = crop.getContext('2d')
    cCtx.drawImage(full, BIRD_X, BIRD_Y, BIRD_W, BIRD_H, 0, 0, BIRD_W, BIRD_H)
    onUploadConfirm?.(crop.toDataURL('image/png'))
  }, [onUploadConfirm])

  const updateTransform = useCallback(() => {
    setTransform({
      scale: scaleRef.current,
      offsetX: offsetXRef.current,
      offsetY: offsetYRef.current,
    })
  }, [])

  // Initialize canvas sizes (fixed logical size)
  useEffect(() => {
    layers.forEach(({ id }) => {
      const canvas = canvasRefs.current[id]
      if (canvas && !initialized.current.has(id)) {
        canvas.width = CANVAS_W
        canvas.height = CANVAS_H
        initialized.current.add(id)
        const ctx = canvas.getContext('2d')
        historyMap.current[id] = [ctx.getImageData(0, 0, CANVAS_W, CANVAS_H)]
        historyIdxMap.current[id] = 0
      }
    })
  }, [layers])

  // Center canvas on mount via ResizeObserver
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const fitCanvas = () => {
      const vw = viewport.clientWidth
      const vh = viewport.clientHeight
      if (!vw || !vh) return

      const padding = 40
      const fitScale = Math.min(
        (vw - padding * 2) / CANVAS_W,
        (vh - padding * 2) / CANVAS_H
      )
      scaleRef.current = fitScale
      offsetXRef.current = (vw - CANVAS_W * fitScale) / 2
      offsetYRef.current = (vh - CANVAS_H * fitScale) / 2
      updateTransform()
    }

    const ro = new ResizeObserver(() => fitCanvas())
    ro.observe(viewport)
    fitCanvas()
    return () => ro.disconnect()
  }, [updateTransform])

  // Compute a fixed fit-to-viewport transform for play mode
  const [playTransform, setPlayTransform] = useState(null)

  // Export bird region as PNG and load game config when entering play mode
  useEffect(() => {
    if (mode === 'play') {
      // Compute fixed centered transform regardless of user zoom/pan
      const viewport = viewportRef.current
      if (viewport) {
        const vw = viewport.clientWidth
        const vh = viewport.clientHeight
        const padding = 40
        const fitScale = Math.min(
          (vw - padding * 2) / CANVAS_W,
          (vh - padding * 2) / CANVAS_H
        )
        setPlayTransform({
          scale: fitScale,
          offsetX: (vw - CANVAS_W * fitScale) / 2,
          offsetY: (vh - CANVAS_H * fitScale) / 2,
        })
      }
      // Export bird region from visible layers
      const offscreen = document.createElement('canvas')
      offscreen.width = BIRD_W
      offscreen.height = BIRD_H
      const offCtx = offscreen.getContext('2d')

      layersRef.current.forEach((layer) => {
        if (!layer.visible) return
        const srcCanvas = canvasRefs.current[layer.id]
        if (!srcCanvas) return
        offCtx.globalAlpha = layer.opacity / 100
        offCtx.drawImage(
          srcCanvas,
          BIRD_X, BIRD_Y, BIRD_W, BIRD_H,
          0, 0, BIRD_W, BIRD_H
        )
      })

      // Check if the bird area has any drawn pixels
      const checkData = offCtx.getImageData(0, 0, BIRD_W, BIRD_H).data
      let hasPixels = false
      for (let i = 3; i < checkData.length; i += 4) {
        if (checkData[i] > 0) { hasPixels = true; break }
      }

      // If nothing drawn, draw the default bird onto the canvas so it persists
      if (!hasPixels) {
        const defaultImg = new Image()
        defaultImg.onload = () => {
          const activeId = activeLayerIdRef.current
          const activeCanvas = canvasRefs.current[activeId]
          if (activeCanvas) {
            const actx = activeCanvas.getContext('2d')
            actx.clearRect(BIRD_X, BIRD_Y, BIRD_W, BIRD_H)
            actx.drawImage(defaultImg, BIRD_X, BIRD_Y, BIRD_W, BIRD_H)
          }
        }
        defaultImg.src = '/assets/yellowbird-downflap.png'
      }

      const playerDataUrl = hasPixels
        ? offscreen.toDataURL('image/png')
        : null

      // Clone config and inject the user's drawing as player sprite + propagated assets
      const modifiedConfig = {
        ...flappyBirdConfig,
        assets: {
          ...flappyBirdConfig.assets,
          models: {
            ...flappyBirdConfig.assets.models,
            ...(playerDataUrl ? { player: playerDataUrl, player_jump: playerDataUrl } : {}),
            box1: propagatedAssets?.pipe || flappyBirdConfig.assets.models.box1,
            box2: propagatedAssets?.pipe || flappyBirdConfig.assets.models.box2,
          },
          skybox: propagatedAssets?.skybox || flappyBirdConfig.assets.skybox,
        },
      }

      setConfigLoaded(false)
      setGameConfig(modifiedConfig)
      requestAnimationFrame(() => setConfigLoaded(true))
    } else {
      // Delay clearing so fade-out can play
      const timer = setTimeout(() => {
        setConfigLoaded(false)
        setPlayTransform(null)
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [mode, setGameConfig, propagatedAssets])

  // Auto-play the game when entering play mode (game starts paused by default)
  useEffect(() => {
    if (mode === 'play' && configLoaded && gameRef.current) {
      // Small delay to ensure the Game component's imperative handle is ready
      const timer = setTimeout(() => gameRef.current?.play(), 100)
      return () => clearTimeout(timer)
    }
  }, [mode, configLoaded])

  const notifyHistory = useCallback((id) => {
    const idx = historyIdxMap.current[id] ?? 0
    const hist = historyMap.current[id] || []
    onHistoryChange(idx > 0, idx < hist.length - 1)
  }, [onHistoryChange])

  const saveSnapshot = useCallback((id) => {
    const canvas = canvasRefs.current[id]
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const hist = historyMap.current[id] || []
    const idx = historyIdxMap.current[id] ?? 0
    const newHist = hist.slice(0, idx + 1)
    newHist.push(snap)
    if (newHist.length > 50) newHist.shift()
    historyMap.current[id] = newHist
    historyIdxMap.current[id] = newHist.length - 1
  }, [])

  // Expose undo/redo to parent
  useEffect(() => {
    if (!actionsRef) return
    actionsRef.current = {
      exportBirdRegion() {
        // Check if bird area has any drawn pixels
        let hasPixels = false
        for (const layer of layersRef.current) {
          if (layer.locked || !layer.visible) continue
          const canvas = canvasRefs.current[layer.id]
          if (!canvas) continue
          const ctx = canvas.getContext('2d')
          const imageData = ctx.getImageData(BIRD_X, BIRD_Y, BIRD_W, BIRD_H)
          const data = imageData.data
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 0) { hasPixels = true; break }
          }
          if (hasPixels) break
        }
        if (!hasPixels) return null
        // Export bird region
        const offscreen = document.createElement('canvas')
        offscreen.width = BIRD_W
        offscreen.height = BIRD_H
        const offCtx = offscreen.getContext('2d')
        layersRef.current.forEach((layer) => {
          if (!layer.visible || layer.locked) return
          const srcCanvas = canvasRefs.current[layer.id]
          if (!srcCanvas) return
          offCtx.globalAlpha = layer.opacity / 100
          offCtx.drawImage(srcCanvas, BIRD_X, BIRD_Y, BIRD_W, BIRD_H, 0, 0, BIRD_W, BIRD_H)
        })
        return offscreen.toDataURL('image/png')
      },
      clearBirdArea() {
        const id = activeLayerIdRef.current
        const canvas = canvasRefs.current[id]
        if (!canvas) return
        saveSnapshot(id)
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        saveSnapshot(id)
        notifyHistory(id)
      },
      drawImageToBirdArea(dataUrl) {
        const id = activeLayerIdRef.current
        const canvas = canvasRefs.current[id]
        if (!canvas) return
        saveSnapshot(id)
        const ctx = canvas.getContext('2d')
        const img = new Image()
        img.onload = () => {
          ctx.clearRect(BIRD_X, BIRD_Y, BIRD_W, BIRD_H)
          ctx.drawImage(img, BIRD_X, BIRD_Y, BIRD_W, BIRD_H)
          saveSnapshot(id)
          notifyHistory(id)
        }
        img.src = dataUrl
      },
      undo() {
        const id = activeLayerIdRef.current
        const idx = historyIdxMap.current[id] ?? 0
        if (idx <= 0) return
        historyIdxMap.current[id] = idx - 1
        const canvas = canvasRefs.current[id]
        if (canvas) {
          const ctx = canvas.getContext('2d')
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.putImageData(historyMap.current[id][idx - 1], 0, 0)
        }
        notifyHistory(id)
      },
      redo() {
        const id = activeLayerIdRef.current
        const idx = historyIdxMap.current[id] ?? 0
        const hist = historyMap.current[id] || []
        if (idx >= hist.length - 1) return
        historyIdxMap.current[id] = idx + 1
        const canvas = canvasRefs.current[id]
        if (canvas) {
          const ctx = canvas.getContext('2d')
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.putImageData(hist[idx + 1], 0, 0)
        }
        notifyHistory(id)
      },
    }
  })

  // Map pointer position to canvas coordinates
  const getPoint = (e) => {
    const viewport = viewportRef.current
    const rect = viewport.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    return {
      x: (px - offsetXRef.current) / scaleRef.current,
      y: (py - offsetYRef.current) / scaleRef.current,
      pressure: e.pressure > 0 ? e.pressure : 0.5,
    }
  }

  // Restrict drawing to the bird rectangle only
  const isInBounds = (pt) => {
    return pt.x >= BIRD_X && pt.x <= BIRD_X + BIRD_W && pt.y >= BIRD_Y && pt.y <= BIRD_Y + BIRD_H
  }

  const clampToBounds = (pt) => ({
    ...pt,
    x: Math.max(BIRD_X, Math.min(BIRD_X + BIRD_W, pt.x)),
    y: Math.max(BIRD_Y, Math.min(BIRD_Y + BIRD_H, pt.y)),
  })

  const isPlaying = mode === 'play'

  const onPointerDown = useCallback((e) => {
    if (isPlaying || uploadImage) return
    e.preventDefault()

    if (e.button === 1 || spaceDown.current) {
      isPanning.current = true
      setIsPanningState(true)
      panStart.current = {
        x: e.clientX - offsetXRef.current,
        y: e.clientY - offsetYRef.current,
      }
      e.currentTarget.setPointerCapture(e.pointerId)
      return
    }

    e.currentTarget.setPointerCapture(e.pointerId)
    const id = activeLayerIdRef.current
    const canvas = canvasRefs.current[id]
    if (!canvas) return

    const pt = getPoint(e)
    if (!isInBounds(pt)) return

    saveSnapshot(id)
    isDrawing.current = true
    lastPoint.current = pt

    const ctx = canvas.getContext('2d')
    const t = toolRef.current
    ctx.globalCompositeOperation = t === 'eraser' ? 'destination-out' : 'source-over'
    ctx.globalAlpha = opacityRef.current / 100
    ctx.fillStyle = colorRef.current
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, Math.max((brushSizeRef.current / 2) * pt.pressure, 1), 0, Math.PI * 2)
    ctx.fill()
  }, [saveSnapshot, isPlaying, uploadImage])

  const onPointerMove = useCallback((e) => {
    if (isPlaying || uploadImage) return

    if (isPanning.current) {
      e.preventDefault()
      offsetXRef.current = e.clientX - panStart.current.x
      offsetYRef.current = e.clientY - panStart.current.y
      updateTransform()
      return
    }

    if (!isDrawing.current) return
    e.preventDefault()
    const id = activeLayerIdRef.current
    const canvas = canvasRefs.current[id]
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const pt = clampToBounds(getPoint(e))
    const last = lastPoint.current
    const pressure = e.pressure > 0 ? e.pressure : 0.5

    ctx.globalCompositeOperation = toolRef.current === 'eraser' ? 'destination-out' : 'source-over'
    ctx.globalAlpha = opacityRef.current / 100
    ctx.strokeStyle = colorRef.current
    ctx.lineWidth = Math.max(brushSizeRef.current * pressure, 1)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    const mx = (last.x + pt.x) / 2
    const my = (last.y + pt.y) / 2
    ctx.quadraticCurveTo(last.x, last.y, mx, my)
    ctx.stroke()

    lastPoint.current = pt
  }, [updateTransform, isPlaying, uploadImage])

  const onPointerUp = useCallback(() => {
    if (isPlaying || uploadImage) return
    if (isPanning.current) {
      isPanning.current = false
      setIsPanningState(false)
      return
    }
    if (!isDrawing.current) return
    isDrawing.current = false
    lastPoint.current = null
    notifyHistory(activeLayerIdRef.current)
  }, [notifyHistory, isPlaying, uploadImage])

  const onWheel = useCallback((e) => {
    if (isPlaying || uploadImage) return
    e.preventDefault()
    const viewport = viewportRef.current
    const rect = viewport.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    const oldScale = scaleRef.current
    const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1
    const newScale = Math.min(10, Math.max(0.1, oldScale * zoomFactor))

    offsetXRef.current = mx - (mx - offsetXRef.current) * (newScale / oldScale)
    offsetYRef.current = my - (my - offsetYRef.current) * (newScale / oldScale)
    scaleRef.current = newScale
    updateTransform()
  }, [updateTransform, isPlaying, uploadImage])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (isPlaying) return
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        spaceDown.current = true
        setSpaceDownState(true)
      }
    }
    const onKeyUp = (e) => {
      if (e.code === 'Space') {
        spaceDown.current = false
        setSpaceDownState(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [isPlaying])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    viewport.addEventListener('wheel', onWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', onWheel)
  }, [onWheel])

  const cursor = isPlaying
    ? 'default'
    : isPanningState || spaceDownState
      ? 'grab'
      : tool === 'eraser' ? 'cell' : 'crosshair'

  return (
    <div
      ref={viewportRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: 'transparent',
        cursor,
        touchAction: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Canvas frame — the "paper" */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: CANVAS_W,
          height: CANVAS_H,
          transform: isPlaying && playTransform
            ? `translate(${playTransform.offsetX}px, ${playTransform.offsetY}px) scale(${playTransform.scale})`
            : `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          borderRadius: 4,
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Solid black base layer */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 4,
          background: '#000',
        }} />

        {/* Render layers — locked layers are image divs, drawing layers are canvases */}
        {layers.map((layer, i) => {
          if (layer.type === 'world') {
            // World layer — game bg image, dimmed in edit mode
            return (
              <div
                key={layer.id}
                className={propagating ? 'layer-propagating' : ''}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 4,
                  backgroundImage: propagatedAssets?.skybox
                    ? `url(${propagatedAssets.skybox})`
                    : 'url(/assets/flappybird_bg.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: layer.visible ? 'block' : 'none',
                  opacity: isPlaying ? 0 : (layer.opacity / 100) * 0.8,
                  zIndex: i + 1,
                  pointerEvents: 'none',
                  transition: 'opacity 0.35s ease',
                }}
              />
            )
          }

          if (layer.type === 'obstacles') {
            // Obstacles layer — two pipes above and below the bird area
            const pipeW = 130
            const pipeH = 500
            const gap = 20
            const pipeCenterX = BIRD_X + BIRD_W / 2 - pipeW / 2
            const pipeSrc = propagatedAssets?.pipe || '/assets/pipe-green.png'
            return (
              <div
                key={layer.id}
                className={propagating ? 'layer-propagating' : ''}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: layer.visible ? 'block' : 'none',
                  opacity: isPlaying ? 0 : layer.opacity / 100,
                  zIndex: i + 1,
                  pointerEvents: 'none',
                  transition: 'opacity 0.35s ease',
                }}
              >
                {/* Top pipe — flipped */}
                <img
                  src={pipeSrc}
                  alt=""
                  style={{
                    position: 'absolute',
                    left: pipeCenterX,
                    bottom: CANVAS_H - BIRD_Y + gap,
                    width: pipeW,
                    height: pipeH,
                    objectFit: 'fill',
                    transform: 'rotate(180deg)',
                  }}
                />
                {/* Bottom pipe */}
                <img
                  src={pipeSrc}
                  alt=""
                  style={{
                    position: 'absolute',
                    left: pipeCenterX,
                    top: BIRD_Y + BIRD_H + gap,
                    width: pipeW,
                    height: pipeH,
                    objectFit: 'fill',
                  }}
                />
              </div>
            )
          }

          // Regular drawing layer
          return (
            <canvas
              key={layer.id}
              ref={(el) => { if (el) canvasRefs.current[layer.id] = el }}
              style={{
                position: 'absolute',
                inset: 0,
                width: CANVAS_W,
                height: CANVAS_H,
                display: layer.visible ? 'block' : 'none',
                opacity: isPlaying ? 0 : layer.opacity / 100,
                zIndex: i + 1,
                pointerEvents: 'none',
                transition: 'opacity 0.35s ease',
              }}
            />
          )
        })}

        {/* Bird drawing area — white background + dotted outline, visible only in edit mode */}
        {!isPlaying && (
          <div
            style={{
              position: 'absolute',
              left: BIRD_X,
              top: BIRD_Y,
              width: BIRD_W,
              height: BIRD_H,
              background: 'rgba(255,255,255,0.5)',
              border: '2px dashed rgba(255,255,255,0.6)',
              borderRadius: 8,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}

        {/* Upload image overlay */}
        {uploadImage && !isPlaying && (
          <div
            ref={uploadOverlayRef}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 50,
              cursor: 'grab',
            }}
            onPointerDown={(e) => {
              if (e.target.closest('.upload-overlay-controls')) return
              startUploadDrag(e)
            }}
          >
            {/* Dark mask with bird region cut-out via clip-path */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              clipPath: `polygon(
                0% 0%, 100% 0%, 100% 100%, 0% 100%,
                0% ${BIRD_Y}px,
                ${BIRD_X}px ${BIRD_Y}px,
                ${BIRD_X}px ${BIRD_Y + BIRD_H}px,
                ${BIRD_X + BIRD_W}px ${BIRD_Y + BIRD_H}px,
                ${BIRD_X + BIRD_W}px ${BIRD_Y}px,
                0% ${BIRD_Y}px
              )`,
              pointerEvents: 'none',
            }} />

            {/* Uploaded image */}
            <img
              src={uploadImage}
              alt="upload"
              draggable={false}
              style={{
                position: 'absolute',
                left: uploadPos.x,
                top: uploadPos.y,
                width: uploadNaturalSize.current.w * uploadPos.scale,
                height: uploadNaturalSize.current.h * uploadPos.scale,
                pointerEvents: 'none',
                zIndex: 1,
                opacity: isResizing ? 0.45 : 0.85,
                filter: isResizing ? 'brightness(0.6)' : 'none',
                transition: 'opacity 0.2s, filter 0.2s',
              }}
            />

            {/* Bird region border — on top of image */}
            <div style={{
              position: 'absolute',
              left: BIRD_X - 2,
              top: BIRD_Y - 2,
              width: BIRD_W + 4,
              height: BIRD_H + 4,
              border: '2.5px solid #0a84ff',
              borderRadius: 9,
              pointerEvents: 'none',
              zIndex: 2,
              boxShadow: '0 0 8px rgba(10,132,255,0.4)',
            }} />

            {/* Confirm / Cancel pill */}
            <div
              className="upload-overlay-controls"
              style={{
                position: 'absolute',
                left: BIRD_X + BIRD_W / 2,
                top: BIRD_Y + BIRD_H + 14,
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                padding: 3,
                background: 'rgba(28,28,30,0.85)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                zIndex: 3,
              }}
            >
              <button
                className="upload-ctrl-btn upload-ctrl-confirm"
                onClick={(e) => { e.stopPropagation(); handleUploadCrop() }}
                title="Apply"
              >
                <Check size={13} strokeWidth={2.2} />
              </button>
              <button
                className="upload-ctrl-btn upload-ctrl-cancel"
                onClick={(e) => { e.stopPropagation(); onUploadCancel?.() }}
                title="Cancel"
              >
                <X size={13} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        )}

        {/* Game renders inside the same canvas frame */}
        {configLoaded && gameConfig && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            opacity: isPlaying ? 1 : 0,
            transition: 'opacity 0.35s ease',
            pointerEvents: isPlaying ? 'auto' : 'none',
          }}>
            <Game
              ref={gameRef}
              key={`${gameConfig.id}-${JSON.stringify(gameConfig.assets?.models || {})}`}
            />
          </div>
        )}
      </div>

    </div>
  )
}
