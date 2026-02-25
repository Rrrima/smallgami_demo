import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Save } from "lucide-react";
import Canvas from "./components/Canvas";
import TopBar from "./components/TopBar";
import LeftSidebar from "./components/LeftSidebar";
import LayersPanel from "./components/LayersPanel";
import ColorPicker from "./components/ColorPicker";
import ResultsBar from "./components/ResultsBar";
import BirdInfoPanel from "./components/BirdInfoPanel";
import {
  generateBirdVariations,
  generateBirdInfo,
  generateWorldAssets,
  MODELS,
} from "./services/generationService";
import "./App.css";

let nextLayerId = 4;

export default function App() {
  // ── Drawing state ──────────────────────────────────────────
  const [tool, setTool] = useState("brush");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(24);
  const [opacity, setOpacity] = useState(80);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // ── Layer state ────────────────────────────────────────────
  const [layers, setLayers] = useState([
    {
      id: 1,
      name: "World",
      visible: true,
      opacity: 100,
      locked: true,
      type: "world",
    },
    {
      id: 2,
      name: "Obstacles",
      visible: true,
      opacity: 100,
      locked: true,
      type: "obstacles",
    },
    { id: 3, name: "Bird Sketch", visible: true, opacity: 100 },
  ]);
  const [activeLayerId, setActiveLayerId] = useState(3);

  // ── UI panel visibility ────────────────────────────────────
  const [mode, setMode] = useState("edit");
  const [showLayers, setShowLayers] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [resultsExpanded, setResultsExpanded] = useState(false);

  // ── AI generation state ────────────────────────────────────
  const [aiResults, setAiResults] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModel, setAiModel] = useState(MODELS[0].id);
  const [selectedBirdInfo, setSelectedBirdInfo] = useState(null);
  const [selectedBirdCard, setSelectedBirdCard] = useState(null);

  // ── Commit state (bird info from AI) ────────────────────────
  const [committedBird, setCommittedBird] = useState(null);
  const [committing, setCommitting] = useState(false);

  // ── Propagation state (world asset generation) ─────────────
  const [propagate, setPropagate] = useState(false);
  const [propagatedAssets, setPropagatedAssets] = useState(null);
  const [propagating, setPropagating] = useState(false);

  // ── Image upload state ─────────────────────────────────────
  const [uploadImage, setUploadImage] = useState(null);

  // ── Refs ────────────────────────────────────────────────────
  const canvasActionsRef = useRef(null);

  const isPlaying = mode === "play";

  // ── Undo / Redo ────────────────────────────────────────────

  const handleUndo = () => canvasActionsRef.current?.undo();
  const handleRedo = () => canvasActionsRef.current?.redo();

  // ── Image upload handlers ──────────────────────────────────

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUploadImage(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const handleUploadConfirm = useCallback((croppedDataUrl) => {
    canvasActionsRef.current?.drawImageToBirdArea(croppedDataUrl);
    setUploadImage(null);
  }, []);

  const handleUploadCancel = useCallback(() => {
    setUploadImage(null);
  }, []);

  // ── Commit bird drawing (AI generates characteristics & stats) ──

  const handleCommit = useCallback(async () => {
    if (committing) return;
    const sketchDataUrl = canvasActionsRef.current?.exportBirdRegion?.();
    if (!sketchDataUrl) return;

    setCommitting(true);
    setResultsExpanded(true);
    try {
      const info = await generateBirdInfo(sketchDataUrl, aiModel);
      const bird = { image: sketchDataUrl, info, label: "Original" };
      setCommittedBird(bird);
      setSelectedBirdInfo(bird);
    } catch (err) {
      console.error("[Commit] Bird info generation failed:", err);
    } finally {
      setCommitting(false);
    }
  }, [committing, aiModel]);

  // ── AI bird generation (style variations) ──────────────────

  const handleAiClick = useCallback(async () => {
    if (aiLoading) return;
    setAiLoading(true);
    setSelectedBirdInfo(null);
    setResultsExpanded(true);
    try {
      const sketchDataUrl = canvasActionsRef.current?.exportBirdRegion?.();
      const results = await generateBirdVariations(
        sketchDataUrl || null,
        aiModel,
      );
      setAiResults(results);
    } catch (err) {
      console.error("[AI] Generation failed:", err);
    } finally {
      setAiLoading(false);
    }
  }, [aiLoading, aiModel]);

  // ── Card selection & propagation ───────────────────────────

  const handleCardClick = useCallback(
    (item) => {
      canvasActionsRef.current?.drawImageToBirdArea(item.image);
      setSelectedBirdCard(item);
      if (propagate) {
        setPropagating(true);
        generateWorldAssets(item.image, aiModel)
          .then((assets) => {
            setPropagatedAssets(assets);
            setPropagating(false);
          })
          .catch((err) => {
            console.error("[Propagate] failed:", err);
            setPropagating(false);
          });
      }
    },
    [propagate, aiModel],
  );

  const handleSetPropagate = useCallback((val) => {
    setPropagate((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      if (!next) setPropagatedAssets(null);
      return next;
    });
  }, []);

  const handlePropagate = useCallback(() => {
    if (propagating) return;
    const imageToUse =
      selectedBirdCard?.image || canvasActionsRef.current?.exportBirdRegion?.();
    if (!imageToUse) return;
    setPropagating(true);
    generateWorldAssets(imageToUse, aiModel)
      .then((assets) => {
        setPropagatedAssets(assets);
        setPropagating(false);
      })
      .catch((err) => {
        console.error("[Propagate] failed:", err);
        setPropagating(false);
      });
  }, [propagating, selectedBirdCard, aiModel]);

  // ── Save assets to public/assets ─────────────────────────────

  const [saving, setSaving] = useState(false);

  const handleSaveAssets = useCallback(async () => {
    if (saving) return;
    const birdDataUrl = canvasActionsRef.current?.exportBirdRegion?.();
    if (!birdDataUrl) return;

    setSaving(true);
    try {
      const folder = `scene_${Date.now()}`;
      const assets = [{ name: "bird", dataUrl: birdDataUrl }];

      if (propagatedAssets?.pipe) {
        assets.push({ name: "pipe", dataUrl: propagatedAssets.pipe });
      }
      if (propagatedAssets?.skybox) {
        assets.push({ name: "skybox", dataUrl: propagatedAssets.skybox });
      }

      const res = await fetch("/api/save-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder, assets }),
      });
      const data = await res.json();
      if (data.ok) {
        console.log(`[Save] Assets saved to public/assets/${folder}/: ${data.saved.join(", ")}`);
      } else {
        console.error("[Save] Failed:", data.error);
      }
    } catch (err) {
      console.error("[Save] Failed:", err);
    } finally {
      setSaving(false);
    }
  }, [saving, propagatedAssets]);

  // ── Layer management ───────────────────────────────────────

  const addLayer = () => {
    const id = nextLayerId++;
    setLayers((prev) => [
      ...prev,
      { id, name: `Layer ${id}`, visible: true, opacity: 100 },
    ]);
    setActiveLayerId(id);
  };

  const removeLayer = (id) => {
    const target = layers.find((l) => l.id === id);
    if (!target || target.locked) return;
    if (layers.filter((l) => !l.locked).length <= 1) return;
    setLayers((prev) => {
      const remaining = prev.filter((l) => l.id !== id);
      if (activeLayerId === id) {
        const unlocked = remaining.filter((l) => !l.locked);
        setActiveLayerId(unlocked.at(-1).id);
      }
      return remaining;
    });
  };

  const updateLayer = (id, changes) =>
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...changes } : l)),
    );

  // ── Play mode ──────────────────────────────────────────────

  const enterPlayMode = () => {
    setShowLayers(false);
    setShowColors(false);
    setMode("play");
  };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        setMode((prev) => (prev === "edit" ? "play" : "edit"));
        if (mode === "edit") enterPlayMode();
        return;
      }
      if (e.key === "Escape" && mode === "play") setMode("edit");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className={`app${isPlaying ? " is-playing" : ""}`}>
      {/* Play / Edit mode toggle banner */}
      <button
        className={`mode-banner${isPlaying ? " is-playing" : ""}`}
        onClick={() => (isPlaying ? setMode("edit") : enterPlayMode())}
      >
        {isPlaying ? (
          <>
            Press <strong>ESC</strong> to edit
          </>
        ) : (
          <>
            <Play size={12} strokeWidth={2.5} fill="rgba(255,255,255,0.8)" />
            <span>Play</span>
            <kbd>&#8984;&#9166;</kbd>
          </>
        )}
      </button>

      {/* Top toolbar */}
      <div className={`topbar-area${isPlaying ? " is-playing" : ""}`}>
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

      {/* Left sidebar (brush, undo/redo) */}
      <div className={`sidebar-area${isPlaying ? " is-playing" : ""}`}>
        <LeftSidebar
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          opacity={opacity}
          setOpacity={setOpacity}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      </div>

      {/* Main canvas */}
      <div className="canvas-area">
        <Canvas
          actionsRef={canvasActionsRef}
          tool={tool}
          color={color}
          brushSize={brushSize}
          opacity={opacity}
          layers={layers}
          activeLayerId={activeLayerId}
          onHistoryChange={(u, r) => {
            setCanUndo(u);
            setCanRedo(r);
          }}
          mode={mode}
          propagatedAssets={propagatedAssets}
          propagating={propagating}
          uploadImage={uploadImage}
          onUploadConfirm={handleUploadConfirm}
          onUploadCancel={handleUploadCancel}
          onCommit={handleCommit}
          committing={committing}
          committedBird={committedBird}
          onBirdDrawingChanged={() => setCommittedBird(null)}
          onShowBirdInfo={() => setSelectedBirdInfo(committedBird)}
          onFileChange={handleFileChange}
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

      {/* Bottom results bar (AI-generated birds, upload, generate) */}
      {!isPlaying && (
        <ResultsBar
          expanded={resultsExpanded}
          setExpanded={setResultsExpanded}
          aiResults={aiResults}
          aiLoading={aiLoading}
          committedBird={committedBird}
          onCardClick={handleCardClick}
          onAiClick={handleAiClick}
          onFileChange={handleFileChange}
          onSave={handleSaveAssets}
          saving={saving}
        />
      )}

      {/* Bird info stats popup */}
      {!isPlaying && (
        <BirdInfoPanel
          bird={selectedBirdInfo}
          onClose={() => setSelectedBirdInfo(null)}
        />
      )}
    </div>
  );
}
