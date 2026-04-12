import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

const BRAND = "#f5cc00";
const BG = "#050505";
const W = 1920;
const H = 1080;

// --- Hex grid ---
const HEX_R = 52;
const HEX_W = HEX_R * Math.sqrt(3);
const HEX_H = HEX_R * 1.5;

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
}

const HEX_CELLS = (() => {
  const cells: { x: number; y: number; phase: number }[] = [];
  const cols = Math.ceil(W / HEX_W) + 3;
  const rows = Math.ceil(H / HEX_H) + 3;
  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const x = col * HEX_W + (row % 2 !== 0 ? HEX_W / 2 : 0);
      const y = row * HEX_H;
      // Deterministic pseudo-phase per cell
      const phase = ((col * 3 + row * 7) % 97) / 97;
      cells.push({ x, y, phase });
    }
  }
  return cells;
})();

// --- Particles ---
// Pre-computed — no Math.random(), fully deterministic
const PARTICLES = Array.from({ length: 65 }, (_, i) => ({
  // Spread x across width using golden-ratio stepping
  x: (i * (W / 65) + (i % 7) * 83) % W,
  // Stagger starting y so particles are already mid-flight at frame 0
  startY: (i * 97 + i * 31) % H,
  // Taller particles move a bit faster (visual parallax feel)
  speedFactor: 0.9 + (i % 6) * 0.08,
  r: 1 + (i % 3) * 0.8,
  baseOpacity: 0.07 + (i % 9) / 9 * 0.18,
  // Phase offset so they don't all cross the top at once
  phase: (i * 137.508) % 360 / 360,
}));

// --- Beam lines (subtle horizontal scan lines) ---
const BEAMS = Array.from({ length: 4 }, (_, i) => ({
  y: (H / 5) * (i + 1),
  phase: i * 0.25,
  width: 300 + i * 150,
  opacity: 0.03 + i * 0.005,
}));

export function HeroBg() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // Normalized progress 0..1 over the video (loops perfectly when video loops)
  const t = frame / durationInFrames;

  // Glow pulse — slow sine wave, one full cycle per video
  const glowPulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);

  return (
    <AbsoluteFill style={{ background: BG }}>
      <svg width={W} height={H} xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Top-right ambient glow — matches the CSS radial gradient on the page */}
          <radialGradient id="gr1" cx="82%" cy="-8%" r="60%">
            <stop
              offset="0%"
              stopColor={BRAND}
              stopOpacity={0.07 + glowPulse * 0.04}
            />
            <stop offset="100%" stopColor={BRAND} stopOpacity="0" />
          </radialGradient>

          {/* Bottom-left secondary glow */}
          <radialGradient id="gr2" cx="8%" cy="95%" r="42%">
            <stop
              offset="0%"
              stopColor={BRAND}
              stopOpacity={0.035 + (1 - glowPulse) * 0.025}
            />
            <stop offset="100%" stopColor={BRAND} stopOpacity="0" />
          </radialGradient>

          {/* Beam gradient (horizontal fade) */}
          <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={BRAND} stopOpacity="0" />
            <stop offset="40%" stopColor={BRAND} stopOpacity="1" />
            <stop offset="60%" stopColor={BRAND} stopOpacity="1" />
            <stop offset="100%" stopColor={BRAND} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ambient glows */}
        <rect width={W} height={H} fill="url(#gr1)" />
        <rect width={W} height={H} fill="url(#gr2)" />

        {/* Hex grid — stroked outlines, very faint, slow pulse */}
        {HEX_CELLS.map(({ x, y, phase }, i) => {
          // Each cell pulses on a slightly offset sine wave
          const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 4 + phase * Math.PI * 2);
          return (
            <polygon
              key={i}
              points={hexPoints(x, y, HEX_R * 0.9)}
              fill="none"
              stroke={BRAND}
              strokeWidth="0.7"
              opacity={0.022 + pulse * 0.022}
            />
          );
        })}

        {/* Scan beams — slow horizontal drifts */}
        {BEAMS.map((beam, i) => {
          const beamX =
            ((t + beam.phase) % 1) * (W + beam.width) - beam.width;
          return (
            <rect
              key={i}
              x={beamX}
              y={beam.y - 1}
              width={beam.width}
              height={2}
              fill="url(#beam)"
              opacity={beam.opacity}
            />
          );
        })}

        {/* Particles — drift straight upward, wrap at top */}
        {PARTICLES.map((pt, i) => {
          // Shift by phase so particles are staggered at loop start
          const tp = (t + pt.phase) % 1;
          // Move from startY upward by one full screen height per loop
          const y = ((pt.startY - tp * H * pt.speedFactor) % H + H) % H;
          // Fade mask: soft fade-out when near the wrap boundary (top/bottom 8%)
          const nearTop = y / H; // 0 at top, 1 at bottom
          const fade = Math.min(nearTop * 12, 1) * Math.min((1 - nearTop) * 12, 1);
          return (
            <circle
              key={i}
              cx={pt.x}
              cy={y}
              r={pt.r}
              fill={BRAND}
              opacity={pt.baseOpacity * fade}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
}
