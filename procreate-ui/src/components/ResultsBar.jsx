import { useCallback, useRef } from "react";
import { ChevronUp, ChevronDown, Sparkles, ImageUp, Save } from "lucide-react";

export default function ResultsBar({
  expanded,
  setExpanded,
  aiResults,
  aiLoading,
  committedBird,
  onCardClick,
  onAiClick,
  onFileChange,
  onSave,
  saving,
}) {
  const fileInputRef = useRef(null);

  const cards = useCallback(() => {
    const result = [
      { image: "/assets/yellowbird-downflap.png", label: "Default" },
    ];
    if (committedBird) result.push(committedBird);
    result.push(...aiResults);
    return result;
  }, [aiResults, committedBird]);

  const totalCards = cards().length;

  if (!expanded) {
    return (
      <div className="results-tab-collapsed" onClick={() => setExpanded(true)}>
        <ChevronUp size={14} strokeWidth={2} />
        {totalCards > 1 && (
          <span className="results-tab-badge">{totalCards}</span>
        )}
      </div>
    );
  }

  return (
    <div className="ai-results-bar">
      <button
        className="ai-results-dismiss"
        onClick={() => setExpanded(false)}
        title="Collapse"
      >
        <ChevronDown size={14} />
      </button>

      {cards().map((item, i) => {
        const isCommitted = committedBird && item === committedBird;
        return (
          <div key={i} className="ai-results-card-wrapper">
            <div
              className={`ai-results-card${isCommitted ? " is-committed" : ""}`}
              onClick={() => onCardClick(item)}
            >
              <img src={item.image} alt={item.label} />
            </div>
            <span className="card-label">{item.label}</span>
          </div>
        );
      })}

      <div className="results-bar-divider" />

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={onFileChange}
      />

      <button
        className="results-bar-action-btn"
        title="Upload image to bird area"
        onClick={() => fileInputRef.current?.click()}
      >
        <ImageUp size={15} strokeWidth={1.8} />
      </button>

      <button
        className={`results-bar-action-btn ${aiLoading ? "is-loading" : ""}`}
        title="Generate style variations"
        onClick={onAiClick}
        disabled={aiLoading}
      >
        {aiLoading ? (
          <span className="ai-spinner" />
        ) : (
          <Sparkles size={15} strokeWidth={1.8} />
        )}
      </button>

      <button
        className={`results-bar-action-btn ${saving ? "is-loading" : ""}`}
        title="Save bird, pipe & skybox to public/assets"
        onClick={onSave}
        disabled={saving}
      >
        {saving ? (
          <span className="ai-spinner" />
        ) : (
          <Save size={15} strokeWidth={1.8} />
        )}
      </button>
    </div>
  );
}
