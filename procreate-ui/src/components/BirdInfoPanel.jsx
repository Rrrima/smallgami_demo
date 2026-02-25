import { X } from "lucide-react";

const STAT_COLORS = {
  speed: "#4fc3f7",
  mass: "#ff8a65",
  stability: "#81c784",
  jumpPower: "#ba68c8",
};

const STAT_KEYS = ["speed", "mass", "stability", "jumpPower"];

export default function BirdInfoPanel({ bird, onClose }) {
  if (!bird) return null;

  return (
    <div className="ai-info-panel">
      <button className="ai-info-panel-close" onClick={onClose}>
        <X size={12} />
      </button>

      <div className="ai-info-panel-preview">
        <img src={bird.image} alt={bird.label || "Bird"} />
      </div>

      <div className="ai-info-panel-chars">{bird.info.characteristics}</div>

      <div className="ai-info-panel-stats">
        {STAT_KEYS.map((stat) => (
          <div key={stat} className="stat-row">
            <span className="stat-label">
              {stat === "jumpPower" ? "Jump" : stat}
            </span>
            <div className="stat-bar-bg">
              <div
                className="stat-bar-fill"
                style={{
                  width: `${bird.info[stat]}%`,
                  backgroundColor: STAT_COLORS[stat],
                }}
              />
            </div>
            <span className="stat-value">{bird.info[stat]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
