import { useState, useEffect } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";

// ── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg: "#0a0a0a",
  surface: "#111318",
  card: "#161b22",
  cardHi: "#1a2030",
  border: "#1e2530",
  lime: "#b8ff00",
  limeDim: "#7acc00",
  limeAlpha: "rgba(184,255,0,0.12)",
  limeGlow: "0 0 24px rgba(184,255,0,0.25)",
  white: "#ffffff",
  text: "#e5e7eb",
  muted: "#6b7280",
  mutedLt: "#9ca3af",
  teal: "#22d3ee",
  orange: "#fb923c",
  font: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
};

// ── Mock player data ──────────────────────────────────────────────────────────
const MAKES_DATA = [
  { day: "W1 M", makes: 0, target: 60 },
  { day: "W1 W", makes: 55, target: 60 },
  { day: "W1 F", makes: 72, target: 60 },
  { day: "W2 M", makes: 48, target: 60 },
  { day: "W2 W", makes: 61, target: 60 },
  { day: "W2 F", makes: 80, target: 60 },
  { day: "W3 M", makes: 0, target: 60 },
  { day: "W3 W", makes: 67, target: 60 },
  { day: "W3 F", makes: 74, target: 60 },
  { day: "W4 M", makes: 58, target: 60 },
  { day: "W4 W", makes: 83, target: 60 },
  { day: "W4 F", makes: 91, target: 60 },
  { day: "W5 M", makes: 44, target: 60 },
  { day: "W5 W", makes: 78, target: 60 },
];

const DRILL_DATA = [
  { drill: "Form Shot", pct: 74, sessions: 18 },
  { drill: "Free Throw", pct: 68, sessions: 22 },
  { drill: "Catch & Shoot", pct: 61, sessions: 14 },
  { drill: "Mid Range", pct: 53, sessions: 10 },
  { drill: "3PT Corner", pct: 42, sessions: 8 },
  { drill: "3PT Wing", pct: 38, sessions: 7 },
  { drill: "Ball Handling", pct: 0, sessions: 5 },
];

const RADAR_DATA = [
  { skill: "Form Shot", you: 74, avg: 58 },
  { skill: "Free Throw", you: 68, avg: 62 },
  { skill: "C&S", you: 61, avg: 55 },
  { skill: "Mid Range", you: 53, avg: 50 },
  { skill: "3PT", you: 40, avg: 44 },
  { skill: "Ball Handle", you: 55, avg: 52 },
];

const HEATMAP_DATA = (() => {
  const d = [];
  const vals = [
    0, 55, 72, 0, 48, 61, 80, 0, 67, 74, 58, 83, 91, 44,
    78, 0, 65, 70, 0, 55, 66, 80, 0, 71, 85, 60, 0, 92,
    50, 58, 0, 64, 73, 0, 81, 88, 0, 62, 77, 0, 56, 69,
    74, 0, 60, 83, 70, 0, 91,
  ];
  for (let i = 0; i < 49; i++) {
    d.push({ day: i, makes: vals[i] ?? 0 });
  }
  return d;
})();

const STREAK_DAYS = (() => {
  const today = 29;
  const trained = [2, 4, 5, 7, 8, 9, 11, 12, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29];
  return Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    status: i > today ? "future" : trained.includes(i) ? "trained" : "rest",
  }));
})();

// ── Shared components ─────────────────────────────────────────────────────────
function CardLabel({ children, color = T.muted }) {
  return (
    <div style={{
      fontSize: 10, letterSpacing: 3, fontWeight: 700,
      color, fontFamily: T.font, marginBottom: 4,
    }}>{children}</div>
  );
}

function BigStat({ value, label, color = T.lime }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 36, fontWeight: 900, color, fontFamily: T.font, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, letterSpacing: 2, color: T.muted, marginTop: 4, fontFamily: T.font }}>
        {label}
      </div>
    </div>
  );
}

function Card({ children, style = {}, glow = false }) {
  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 16,
      padding: "18px 16px",
      boxShadow: glow ? T.limeGlow : "none",
      ...style,
    }}>
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label, unit = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0d1117",
      border: `1px solid ${T.lime}`,
      borderRadius: 8, padding: "8px 12px",
      fontSize: 12, fontFamily: T.font,
    }}>
      <div style={{ color: T.muted, letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.lime, fontWeight: 700 }}>
          {p.name}: {p.value}{unit}
        </div>
      ))}
    </div>
  );
}

// ── 1. MAKES OVER TIME ────────────────────────────────────────────────────────
function MakesOverTime({ data = MAKES_DATA }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);
  const total = data.reduce((s, d) => s + d.makes, 0);
  const best = Math.max(...data.map((d) => d.makes));
  const hitTarget = data.filter((d) => d.makes >= d.target).length;

  return (
    <Card glow>
      <CardLabel color={T.lime}>MAKES OVER TIME</CardLabel>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 16, fontFamily: T.font }}>
        Shot volume across your offseason
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <div style={{
          flex: 1, background: T.limeAlpha, border: `1px solid ${T.lime}33`,
          borderRadius: 10, padding: "10px 12px", textAlign: "center",
        }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: T.lime, fontFamily: T.font }}>{total.toLocaleString()}</div>
          <div style={{ fontSize: 9, letterSpacing: 2, color: T.muted, fontFamily: T.font }}>TOTAL MAKES</div>
        </div>
        <div style={{
          flex: 1, background: "#111318", border: `1px solid ${T.border}`,
          borderRadius: 10, padding: "10px 12px", textAlign: "center",
        }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: T.white, fontFamily: T.font }}>{best}</div>
          <div style={{ fontSize: 9, letterSpacing: 2, color: T.muted, fontFamily: T.font }}>BEST DAY</div>
        </div>
        <div style={{
          flex: 1, background: "#111318", border: `1px solid ${T.border}`,
          borderRadius: 10, padding: "10px 12px", textAlign: "center",
        }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: T.teal, fontFamily: T.font }}>{hitTarget}</div>
          <div style={{ fontSize: 9, letterSpacing: 2, color: T.muted, fontFamily: T.font }}>HIT TARGET</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="limeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={T.lime} stopOpacity={0.25} />
              <stop offset="95%" stopColor={T.lime} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: T.muted, fontSize: 9, fontFamily: T.font }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: T.muted, fontSize: 9, fontFamily: T.font }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={60} stroke={T.white} strokeOpacity={0.2} strokeDasharray="4 4" />
          <Area
            type="monotone" dataKey="makes" name="Makes"
            stroke={T.lime} strokeWidth={2.5}
            fill="url(#limeGrad)"
            dot={false}
            activeDot={{ r: 5, fill: T.lime, stroke: T.white, strokeWidth: 2 }}
            isAnimationActive={visible}
            animationDuration={1200}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 16, height: 2, background: T.lime }} />
          <span style={{ fontSize: 10, color: T.muted, fontFamily: T.font }}>YOUR MAKES</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 16, height: 2, background: T.white, opacity: 0.3, borderTop: "1px dashed" }} />
          <span style={{ fontSize: 10, color: T.muted, fontFamily: T.font }}>DAILY TARGET</span>
        </div>
      </div>
    </Card>
  );
}

// ── 2. SHOOTING % BY DRILL ────────────────────────────────────────────────────
function ShootingPctByDrill({ data = DRILL_DATA }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 200); }, []);

  const getColor = (pct) => {
    if (pct >= 65) return T.lime;
    if (pct >= 50) return T.limeDim;
    if (pct >= 35) return T.orange;
    return T.muted;
  };

  return (
    <Card>
      <CardLabel color={T.lime}>SHOOTING % BY DRILL</CardLabel>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 16, fontFamily: T.font }}>
        Your accuracy across every drill type
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.filter((d) => d.sessions > 0).map((d, i) => {
          const color = getColor(d.pct);
          return (
            <div key={d.drill}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.text, fontFamily: T.font, letterSpacing: 1 }}>
                  {d.drill.toUpperCase()}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, color: T.muted, fontFamily: T.font }}>{d.sessions} sessions</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color, fontFamily: T.font, minWidth: 36, textAlign: "right" }}>
                    {d.pct}%
                  </span>
                </div>
              </div>
              <div style={{ height: 6, background: T.border, borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: visible ? `${d.pct}%` : "0%",
                  background: `linear-gradient(90deg, ${color}cc, ${color})`,
                  borderRadius: 99,
                  transition: `width ${0.6 + i * 0.08}s cubic-bezier(0.4, 0, 0.2, 1)`,
                  boxShadow: d.pct >= 65 ? `0 0 8px ${T.lime}66` : "none",
                }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        display: "flex", gap: 8, marginTop: 16, paddingTop: 14,
        borderTop: `1px solid ${T.border}`,
      }}>
        {[
          { label: "ELITE", range: "65%+", color: T.lime },
          { label: "GOOD", range: "50–64%", color: T.limeDim },
          { label: "BUILD", range: "35–49%", color: T.orange },
        ].map(({ label, range, color }) => (
          <div key={label} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 900, color, fontFamily: T.font }}>{label}</div>
            <div style={{ fontSize: 9, color: T.muted, fontFamily: T.font }}>{range}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── 3. SKILL RADAR ────────────────────────────────────────────────────────────
function SkillRadar({ data = RADAR_DATA }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 300); }, []);

  const CustomAngleLabel = ({ x, y, payload }) => (
    <text x={x} y={y} fill={T.mutedLt} fontSize={10} fontFamily={T.font}
      textAnchor="middle" dominantBaseline="central" fontWeight={700} letterSpacing={1}>
      {payload.value.toUpperCase()}
    </text>
  );

  return (
    <Card>
      <CardLabel color={T.lime}>SKILL BALANCE</CardLabel>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 8, fontFamily: T.font }}>
        Your skills vs. team average
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke={T.border} />
          <PolarAngleAxis dataKey="skill" tick={<CustomAngleLabel />} />
          <Radar name="Team Avg" dataKey="avg"
            stroke="rgba(255,255,255,0.25)" fill="rgba(255,255,255,0.05)"
            strokeWidth={1} strokeDasharray="4 3"
            isAnimationActive={visible} animationDuration={800}
          />
          <Radar name="You" dataKey="you"
            stroke={T.lime} fill={T.lime} fillOpacity={0.18}
            strokeWidth={2.5}
            dot={{ r: 3, fill: T.lime, strokeWidth: 0 }}
            isAnimationActive={visible} animationDuration={1000}
          />
          <Tooltip content={<CustomTooltip unit="%" />} />
        </RadarChart>
      </ResponsiveContainer>

      <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 4 }}>
        {[
          { color: T.lime, label: "YOU" },
          { color: "rgba(255,255,255,0.3)", label: "TEAM AVG", dashed: true },
        ].map(({ color, label, dashed }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 20, height: 2,
              background: dashed ? "transparent" : color,
              borderTop: dashed ? `2px dashed ${color}` : "none",
            }} />
            <span style={{ fontSize: 10, color: T.muted, fontFamily: T.font, letterSpacing: 1 }}>{label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── 4. TRAINING HEATMAP ───────────────────────────────────────────────────────
function TrainingHeatmap({ data = HEATMAP_DATA }) {
  const [hoveredDay, setHoveredDay] = useState(null);
  const days = ["M", "T", "W", "T", "F", "S", "S"];

  const getColor = (makes) => {
    if (makes === 0) return "#1a1f2e";
    if (makes < 30) return "#1f3a14";
    if (makes < 50) return "#2d5a1e";
    if (makes < 70) return "#4d8c2a";
    if (makes < 85) return "#7abf00";
    return T.lime;
  };

  const totalSessions = data.filter((d) => d.makes > 0).length;
  const totalMakes = data.reduce((s, d) => s + d.makes, 0);

  return (
    <Card>
      <CardLabel color={T.lime}>WEEKLY CONSISTENCY</CardLabel>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 14, fontFamily: T.font }}>
        7 weeks of training intensity
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{
          flex: 1, background: T.limeAlpha, border: `1px solid ${T.lime}33`,
          borderRadius: 8, padding: "8px 0", textAlign: "center",
        }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: T.lime, fontFamily: T.font }}>{totalSessions}</div>
          <div style={{ fontSize: 9, letterSpacing: 2, color: T.muted, fontFamily: T.font }}>SESSIONS</div>
        </div>
        <div style={{
          flex: 1, background: "#111318", border: `1px solid ${T.border}`,
          borderRadius: 8, padding: "8px 0", textAlign: "center",
        }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: T.white, fontFamily: T.font }}>{totalMakes.toLocaleString()}</div>
          <div style={{ fontSize: 9, letterSpacing: 2, color: T.muted, fontFamily: T.font }}>TOTAL MAKES</div>
        </div>
        <div style={{
          flex: 1, background: "#111318", border: `1px solid ${T.border}`,
          borderRadius: 8, padding: "8px 0", textAlign: "center",
        }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: T.teal, fontFamily: T.font }}>
            {Math.round((totalSessions / 49) * 100)}%
          </div>
          <div style={{ fontSize: 9, letterSpacing: 2, color: T.muted, fontFamily: T.font }}>RATE</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 4 }}>
        {days.map((d, i) => (
          <div key={i} style={{
            textAlign: "center", fontSize: 9, color: T.muted,
            fontFamily: T.font, fontWeight: 700, letterSpacing: 1,
          }}>{d}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {data.map((cell, i) => (
          <div
            key={i}
            onMouseEnter={() => setHoveredDay(i)}
            onMouseLeave={() => setHoveredDay(null)}
            style={{
              aspectRatio: "1",
              borderRadius: 4,
              background: getColor(cell.makes),
              border: hoveredDay === i ? `1px solid ${T.lime}` : "1px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s",
              boxShadow: cell.makes >= 85 ? `0 0 6px ${T.lime}66` : "none",
              position: "relative",
            }}
            title={`Day ${i + 1}: ${cell.makes} makes`}
          />
        ))}
      </div>

      <div style={{
        height: 22, marginTop: 10, textAlign: "center",
        fontSize: 11, color: hoveredDay !== null ? T.lime : "transparent",
        fontFamily: T.font, fontWeight: 700, transition: "color 0.15s",
      }}>
        {hoveredDay !== null
          ? `DAY ${hoveredDay + 1}  ·  ${data[hoveredDay].makes} MAKES`
          : "·"}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center", marginTop: 4 }}>
        <span style={{ fontSize: 9, color: T.muted, fontFamily: T.font }}>NONE</span>
        {["#1a1f2e", "#1f3a14", "#2d5a1e", "#4d8c2a", "#7abf00", T.lime].map((c, i) => (
          <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: c }} />
        ))}
        <span style={{ fontSize: 9, color: T.muted, fontFamily: T.font }}>91+</span>
      </div>
    </Card>
  );
}

// ── 5. STREAK CALENDAR ────────────────────────────────────────────────────────
function StreakCalendar({ days = STREAK_DAYS }) {
  const currentStreak = 9;
  const bestStreak = 12;
  const totalTrained = days.filter((d) => d.status === "trained").length;

  const getStyle = (status) => {
    const base = {
      width: 36, height: 36, borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700, fontFamily: T.font,
      cursor: "default", transition: "all 0.2s", flexShrink: 0,
    };
    if (status === "trained") return { ...base, background: T.lime, color: "#000" };
    if (status === "rest") return { ...base, background: T.card, border: `1px solid ${T.border}`, color: T.muted };
    if (status === "today") return { ...base, background: T.lime, color: "#000", boxShadow: T.limeGlow };
    return { ...base, color: "#2a3040", background: "transparent" };
  };

  return (
    <Card glow>
      <CardLabel color={T.lime}>30-DAY STREAK</CardLabel>

      <div style={{ textAlign: "center", padding: "16px 0 20px" }}>
        <div style={{
          fontSize: 72, fontWeight: 900, lineHeight: 1,
          color: T.lime, fontFamily: T.font,
          textShadow: "0 0 40px rgba(184,255,0,0.5)",
        }}>{currentStreak}</div>
        <div style={{ fontSize: 11, letterSpacing: 4, color: T.muted, fontFamily: T.font, marginTop: 4 }}>
          DAY STREAK
        </div>
        {currentStreak >= bestStreak && (
          <div style={{
            display: "inline-block", marginTop: 8,
            background: T.limeAlpha, border: `1px solid ${T.lime}44`,
            borderRadius: 99, padding: "3px 10px",
            fontSize: 9, fontWeight: 900, color: T.lime, letterSpacing: 2, fontFamily: T.font,
          }}>🔥 PERSONAL BEST</div>
        )}
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(6, 1fr)",
        gap: 6, justifyItems: "center",
      }}>
        {days.map(({ day, status }) => (
          <div key={day} style={getStyle(status)}>{day}</div>
        ))}
      </div>

      <div style={{
        display: "flex", gap: 8, marginTop: 20,
        paddingTop: 16, borderTop: `1px solid ${T.border}`,
      }}>
        {[
          { val: bestStreak, label: "BEST STREAK" },
          { val: totalTrained, label: "SESSIONS" },
          { val: days.length - totalTrained, label: "REST DAYS" },
        ].map(({ val, label }) => (
          <div key={label} style={{
            flex: 1, textAlign: "center",
            padding: "10px 0",
            background: T.surface, borderRadius: 10,
          }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: T.white, fontFamily: T.font }}>{val}</div>
            <div style={{ fontSize: 8, letterSpacing: 2, color: T.muted, fontFamily: T.font, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── 6. SEASON GOAL PROGRESS ───────────────────────────────────────────────────
function SeasonGoal({ current = 2847, goal = 5000 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 200); }, []);
  const pct = Math.round((current / goal) * 100);
  const remaining = goal - current;

  const radialData = [
    { name: "Progress", value: pct, fill: T.lime },
    { name: "Remaining", value: 100 - pct, fill: T.border },
  ];

  return (
    <Card glow>
      <CardLabel color={T.lime}>SEASON GOAL</CardLabel>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 4, fontFamily: T.font }}>
        Coach target: {goal.toLocaleString()} total makes
      </div>

      <div style={{ position: "relative", height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="62%" outerRadius="85%"
            startAngle={225} endAngle={-45}
            data={[{ value: 100, fill: T.border }]}
            barSize={14}
          >
            <RadialBar dataKey="value" cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>

        <div style={{ position: "absolute", inset: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%" cy="50%"
              innerRadius="62%" outerRadius="85%"
              startAngle={225} endAngle={225 - (270 * (visible ? pct / 100 : 0))}
              data={[{ value: 100, fill: T.lime }]}
              barSize={14}
            >
              <RadialBar dataKey="value" cornerRadius={8}
                isAnimationActive={visible} animationDuration={1400}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: T.white, fontFamily: T.font, lineHeight: 1 }}>
            {current.toLocaleString()}
          </div>
          <div style={{ fontSize: 10, color: T.muted, fontFamily: T.font, marginTop: 4 }}>
            of {goal.toLocaleString()} makes
          </div>
          <div style={{
            fontSize: 20, fontWeight: 900, color: T.lime, fontFamily: T.font, marginTop: 6,
          }}>{pct}%</div>
        </div>
      </div>

      <div style={{ height: 6, background: T.border, borderRadius: 99, overflow: "hidden", marginTop: 4 }}>
        <div style={{
          height: "100%",
          width: visible ? `${pct}%` : "0%",
          background: `linear-gradient(90deg, ${T.limeDim}, ${T.lime})`,
          borderRadius: 99,
          transition: "width 1.4s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: `0 0 10px ${T.lime}66`,
        }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, marginBottom: 16 }}>
        {[25, 50, 75, 100].map((m) => (
          <div key={m} style={{ textAlign: "center" }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%", margin: "0 auto 3px",
              background: pct >= m ? T.lime : T.border,
            }} />
            <div style={{ fontSize: 8, color: pct >= m ? T.lime : T.muted, fontFamily: T.font }}>{m}%</div>
          </div>
        ))}
      </div>

      <div style={{
        background: T.limeAlpha, border: `1px solid ${T.lime}33`,
        borderRadius: 10, padding: "10px 14px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 11, color: T.muted, fontFamily: T.font }}>TO REACH YOUR GOAL</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: T.lime, fontFamily: T.font }}>
            {remaining.toLocaleString()} more makes
          </div>
        </div>
        <div style={{ fontSize: 28 }}>🎯</div>
      </div>
    </Card>
  );
}

// ── 7. WEEKLY VOLUME BAR ──────────────────────────────────────────────────────
const WEEKLY_DATA = [
  { week: "WK 1", makes: 127, target: 300 },
  { week: "WK 2", makes: 189, target: 300 },
  { week: "WK 3", makes: 141, target: 300 },
  { week: "WK 4", makes: 254, target: 300 },
  { week: "WK 5", makes: 78, target: 300 },
];

function WeeklyVolume({ data = WEEKLY_DATA }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 150); }, []);

  const CustomBar = (props) => {
    const { x, y, width, height, value, target } = props;
    const hit = value >= target;
    return (
      <g>
        <rect x={x} y={y} width={width} height={height}
          fill={hit ? T.lime : T.limeDim} rx={4} ry={4}
          style={{ filter: hit ? `drop-shadow(0 0 6px ${T.lime}88)` : "none" }}
        />
        {hit && (
          <text x={x + width / 2} y={y - 6} textAnchor="middle"
            fill={T.lime} fontSize={10} fontFamily={T.font} fontWeight={900}>✓</text>
        )}
      </g>
    );
  };

  return (
    <Card>
      <CardLabel color={T.lime}>WEEKLY VOLUME</CardLabel>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 16, fontFamily: T.font }}>
        Makes per week vs. 300-make target
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 16, right: 4, bottom: 0, left: -20 }} barSize={32}>
          <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="week" tick={{ fill: T.muted, fontSize: 10, fontFamily: T.font }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: T.muted, fontSize: 9, fontFamily: T.font }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={300} stroke={T.white} strokeOpacity={0.3} strokeDasharray="5 5" />
          <Bar dataKey="makes" name="Makes" shape={<CustomBar />}
            isAnimationActive={visible} animationDuration={1000} />
        </BarChart>
      </ResponsiveContainer>

      <div style={{
        display: "flex", alignItems: "center", gap: 6, marginTop: 10,
        fontSize: 10, color: T.muted, fontFamily: T.font,
      }}>
        <div style={{ width: 16, height: 2, background: "rgba(255,255,255,0.3)", borderTop: "1px dashed" }} />
        <span>300 WEEKLY TARGET</span>
        <span style={{ marginLeft: "auto", color: T.lime }}>✓ = TARGET HIT</span>
      </div>
    </Card>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "progress", label: "PROGRESS", icon: "📈" },
  { id: "skills", label: "SKILLS", icon: "🕸️" },
  { id: "streaks", label: "STREAKS", icon: "🔥" },
  { id: "goals", label: "GOALS", icon: "🎯" },
];

export default function ShotLabCharts() {
  const [tab, setTab] = useState("progress");

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      fontFamily: T.font,
      color: T.text,
      paddingBottom: 80,
    }}>
      <div style={{
        padding: "20px 16px 16px",
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: T.muted }}>DEMO PLAYER · TITANS</div>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 2, color: T.white, lineHeight: 1.1 }}>
              MY <span style={{ color: T.lime }}>PROGRESS</span>
            </div>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "#2a3a1a", border: `2px solid ${T.lime}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 900, color: T.lime,
          }}>D</div>
        </div>

        <div style={{
          display: "flex", gap: 0, marginTop: 14,
          borderRadius: 10, overflow: "hidden",
          border: `1px solid ${T.border}`, background: T.card,
        }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "9px 4px",
              background: tab === t.id ? T.lime : "transparent",
              color: tab === t.id ? "#000" : T.muted,
              border: "none", cursor: "pointer",
              fontSize: 9, fontWeight: 900, letterSpacing: 1.5,
              fontFamily: T.font, transition: "all 0.15s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            }}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 16 }}>
        {tab === "progress" && (
          <>
            <MakesOverTime />
            <WeeklyVolume />
          </>
        )}

        {tab === "skills" && (
          <>
            <SkillRadar />
            <ShootingPctByDrill />
          </>
        )}

        {tab === "streaks" && (
          <>
            <StreakCalendar />
            <TrainingHeatmap />
          </>
        )}

        {tab === "goals" && (
          <>
            <SeasonGoal />
          </>
        )}
      </div>
    </div>
  );
}
