import "./IndicatorGrowth.css";

export default function IndicatorGrowth({ value, design }) {
  return (
    <div className={`indicator-growth ${design} ${value >= 0 ? 'up' : 'down'}`}>
      <img 
        src={value >= 0 ? "/up_icon.svg" : "/down_icon.svg"} 
        alt={value >= 0 ? "Up" : "Down"} 
      />
      <span>{Math.abs(value)}%</span>
    </div>
  );
}

