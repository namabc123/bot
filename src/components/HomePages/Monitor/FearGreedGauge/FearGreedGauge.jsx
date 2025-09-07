"use client";
import { GaugeComponent } from 'react-gauge-component';
import './FearGreedGauge.css'

export default function Gauge({ value = 50 }) {
  return (
    <div
      className="flex flex-col"
      style={{
        width: "180px",
        height: "140px",
        border: "1px solid #151B2D",
        borderRadius: "20px",
        backgroundColor: "#0A0E19",
        padding: "20px",
      }}
    >
      <div
        style={{
          fontWeight: 400,
          fontStyle: "normal",
          fontSize: "12px",
          lineHeight: "20px",
          letterSpacing: "0",
          color: "#9499AA",
        }}
      >
        Fear &amp; Greed
      </div>
      <div style={{ marginLeft: "-6px" }}>
      <GaugeComponent
        type="semicircle"
        arc={{
          subArcs: [
            { limit: 20, color: "#DB2C2E" },
            { limit: 40, color: "#EA8C00" },
            { limit: 60, color: "#F3D42F" },
            { limit: 80, color: "#93D900" },
            { limit: 100, color: "#008000" },
          ],
        }}
        pointer={{
          type: "blob",
          color: "#E4EEFE",
          animation: true,
          elastic: true,
          width: 20,
          length: 0.9
        }}
        value={value}
        style={{ width: "150px", height: "95px" }}
        labels={{
          valueLabel: {
            formatTextValue: (val) => `${val}`,
          },
        }}
      />
      <div className="relative top-[-40px] left-[49px] text-[#E4EEFE] text-sm font-bold">
        Custom
      </div>
    </div>
    </div>
  );
}