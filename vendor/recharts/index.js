import React from "react";

const chartStyle = { width: "100%", height: "100%", minHeight: 120, position: "relative" };
const svgStyle = { width: "100%", height: "100%", display: "block" };

function getSize(value, fallback) {
  if (typeof value === "number") return `${value}px`;
  return value || fallback;
}

function BaseChart({ width = "100%", height = 160, children }) {
  return (
    React.createElement("div", { style: { ...chartStyle, width: getSize(width, "100%"), height: getSize(height, "160px") } },
      React.createElement("svg", { viewBox: "0 0 400 220", preserveAspectRatio: "none", style: svgStyle },
        children,
      ),
    )
  );
}

export function ResponsiveContainer({ width = "100%", height = 160, children }) {
  return React.createElement("div", { style: { width: getSize(width, "100%"), height: getSize(height, "160px") } }, children);
}

export function AreaChart(props) { return React.createElement(BaseChart, props); }
export function BarChart(props) { return React.createElement(BaseChart, props); }
export function RadarChart(props) { return React.createElement(BaseChart, props); }
export function RadialBarChart(props) { return React.createElement(BaseChart, props); }
export function LineChart(props) { return React.createElement(BaseChart, props); }

export function CartesianGrid() { return React.createElement("rect", { x: 10, y: 10, width: 380, height: 180, fill: "none", stroke: "rgba(255,255,255,0.08)", strokeDasharray: "4 4" }); }
export function XAxis() { return null; }
export function YAxis() { return null; }
export function Tooltip() { return null; }
export function ReferenceLine() { return React.createElement("line", { x1: 20, y1: 80, x2: 380, y2: 80, stroke: "rgba(255,255,255,0.25)", strokeDasharray: "4 4" }); }
export function PolarGrid() { return React.createElement("circle", { cx: 200, cy: 110, r: 70, fill: "none", stroke: "rgba(255,255,255,0.08)" }); }
export function PolarAngleAxis() { return null; }
export function Cell() { return null; }

export function Area({ stroke = "#b8ff00", fill = "rgba(184,255,0,0.18)" }) {
  return React.createElement(React.Fragment, null,
    React.createElement("path", { d: "M20 170 C80 130, 140 120, 200 110 S320 80, 380 40 L380 190 L20 190 Z", fill }),
    React.createElement("path", { d: "M20 170 C80 130, 140 120, 200 110 S320 80, 380 40", fill: "none", stroke, strokeWidth: 3 }),
  );
}
export function Line({ stroke = "#b8ff00" }) { return React.createElement("path", { d: "M20 170 C80 130, 140 120, 200 110 S320 80, 380 40", fill: "none", stroke, strokeWidth: 3 }); }
export function Bar({ fill = "#7acc00" }) { return React.createElement(React.Fragment, null,
  React.createElement("rect", { x: 40, y: 120, width: 36, height: 70, rx: 4, fill }),
  React.createElement("rect", { x: 112, y: 90, width: 36, height: 100, rx: 4, fill }),
  React.createElement("rect", { x: 184, y: 110, width: 36, height: 80, rx: 4, fill }),
  React.createElement("rect", { x: 256, y: 55, width: 36, height: 135, rx: 4, fill }),
  React.createElement("rect", { x: 328, y: 145, width: 36, height: 45, rx: 4, fill }),
); }
export function Radar({ stroke = "#b8ff00", fill = "rgba(184,255,0,0.18)" }) { return React.createElement("polygon", { points: "200,40 290,85 270,165 200,190 130,160 110,90", fill, stroke, strokeWidth: 2 }); }
export function RadialBar({ fill = "#b8ff00" }) { return React.createElement("path", { d: "M80 170 A100 100 0 1 1 320 170", fill: "none", stroke: fill, strokeWidth: 24, strokeLinecap: "round" }); }
