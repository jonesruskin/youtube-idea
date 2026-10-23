import React, {useId} from 'react';
import {interpolate} from 'remotion';
import {useShot} from '../../engine/shot-context';
import {Bloom, MilkyWay} from '../../fx/cinema/atmos';
import {Cine, Plane, type CamKey} from '../../fx/cinema/camera';
import {Stars} from '../../fx/sky';
import {Stage} from '../common';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** A planet disc lit from one side; `lit` 0..1 fades the day side to black. */
const Planet: React.FC<{x: number; y: number; r: number; color: string; shade: string; lit: number; lightFrom?: number; id: string; bands?: boolean; lights?: number; atmosphere?: string}> = ({
  x,
  y,
  r,
  color,
  shade,
  lit,
  lightFrom = 180,
  id,
  bands,
  lights = 0,
  atmosphere,
}) => {
  const dx = Math.cos((lightFrom * Math.PI) / 180);
  const dy = Math.sin((lightFrom * Math.PI) / 180);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}l`} cx={0.5 + dx * 0.35} cy={0.5 + dy * 0.35} r="0.9">
          <stop offset="0" stopColor={color} />
          <stop offset="0.55" stopColor={color} />
          <stop offset="0.75" stopColor={shade} />
          <stop offset="1" stopColor="#05060E" />
        </radialGradient>
        <clipPath id={`${id}c`}>
          <circle cx={x} cy={y} r={r} />
        </clipPath>
      </defs>
      {atmosphere && <Bloom x={x} y={y} r={r * 1.6} color={atmosphere} opacity={0.35 * lit + 0.1} />}
      <circle cx={x} cy={y} r={r} fill="#06080F" />
      <g clipPath={`url(#${id}c)`}>
        <circle cx={x} cy={y} r={r} fill={`url(#${id}l)`} opacity={lit} />
        {bands && [-0.5, -0.2, 0.15, 0.45].map((b, i) => <rect key={i} x={x - r} y={y + b * r} width={r * 2} height={r * 0.14} fill="#8A5A3A" opacity={0.45 * lit} />)}
        {lights > 0 &&
          // City lights in clusters (coasts and river valleys), not a grid.
          [
            [-0.35, -0.42, 14], [-0.1, -0.3, 10], [0.2, -0.45, 8], [0.45, -0.15, 12], [-0.5, 0.05, 9],
            [-0.2, 0.15, 16], [0.15, 0.1, 11], [0.35, 0.35, 7], [-0.3, 0.45, 6], [0.05, 0.55, 5],
          ].map(([cx0, cy0, n], c) =>
            Array.from({length: n}, (_, k) => {
              const a = k * 2.39996 + c;
              const rr = Math.sqrt(k / n) * r * 0.09;
              return <circle key={`${c}-${k}`} cx={x + cx0 * r + Math.cos(a) * rr} cy={y + cy0 * r + Math.sin(a) * rr * 0.7} r={r * (k ? 0.012 : 0.022)} fill="#FFD58A" opacity={lights * (1 - lit) * 0.95} />;
            }),
          )}
      </g>
      <circle cx={x} cy={y} r={r} fill="none" stroke="#0B1026" strokeWidth={Math.max(2, r * 0.04)} />
    </g>
  );
};

/** The dead Sun: a black disc whose corona is still fading. */
const DeadSun: React.FC<{x: number; y: number; r: number; glow: number}> = ({x, y, r, glow}) => (
  <g>
    <Bloom x={x} y={y} r={r * 4} color="#FF9A4A" opacity={0.4 * glow} />
    <circle cx={x} cy={y} r={r * 1.08} fill="none" stroke="#FFD08A" strokeWidth={r * 0.06} opacity={0.6 * glow} />
    <circle cx={x} cy={y} r={r} fill="#000" />
  </g>
);

/** Top-down solar system: orbits as faint rings, planets flying off along their tangents. AU in px. */
const System: React.FC<{au: number; day: number; cx: number; cy: number; highlight?: 'mars' | 'jupiter'; pulse: number}> = ({au, day, cx, cy, highlight, pulse}) => {
  // Each planet: orbit radius (AU), speed (km/s), phase angle, colour, size px.
  const planets = [
    {a: 0.39, v: 47.4, ph: 200, c: '#B5A89A', s: 5},
    {a: 0.72, v: 35.0, ph: 120, c: '#E8D3A0', s: 8},
    {a: 1.0, v: 29.8, ph: 0, c: '#5FA8E8', s: 10, earth: true},
    {a: 1.52, v: 24.1, ph: 300, c: '#D9643A', s: 7, key: 'mars'},
    {a: 5.2, v: 13.1, ph: 230, c: '#D9B27A', s: 22, key: 'jupiter'},
  ];
  const AU_KM = 1.496e8;
  return (
    <g>
      {planets.map((p, i) => {
        const hl = highlight === p.key ? pulse : 0;
        return <circle key={i} cx={cx} cy={cy} r={p.a * au} fill="none" stroke={hl ? '#FFE3A6' : '#5A6A9A'} strokeWidth={hl ? 3 + hl * 2 : 1.6} strokeDasharray={p.earth ? '6 8' : undefined} opacity={0.35 + hl * 0.5} />;
      })}
      <DeadSun x={cx} y={cy} r={Math.max(6, au * 0.09)} glow={0.15} />
      {planets.map((p, i) => {
        const ang = (p.ph * Math.PI) / 180;
        const px = cx + Math.cos(ang) * p.a * au;
        const py = cy + Math.sin(ang) * p.a * au;
        // tangent direction (counter-clockwise orbit)
        const tx = Math.sin(ang);
        const ty = -Math.cos(ang);
        const dist = ((p.v * day * 86400) / AU_KM) * au;
        const ex = px + tx * dist;
        const ey = py + ty * dist;
        return (
          <g key={i}>
            <path d={`M${px},${py} L${ex},${ey}`} stroke={p.c} strokeWidth={p.earth ? 3 : 1.5} strokeDasharray="2 10" opacity={p.earth ? 0.9 : 0.4} strokeLinecap="round" />
            {p.earth && <Bloom x={ex} y={ey} r={60} color="#7FD6FF" opacity={0.5} />}
            <circle cx={ex} cy={ey} r={p.s} fill={p.c} stroke="#0B1026" strokeWidth={2} />
            {p.earth && <circle cx={ex + 16} cy={ey - 6} r={3} fill="#CFC6B8" />}
            {p.key === 'jupiter' && <rect x={ex - p.s} y={ey - 3} width={p.s * 2} height={6} fill="#8A5A3A" opacity={0.6} />}
          </g>
        );
      })}
    </g>
  );
};

export const Space: React.FC = () => {
  const {props, frame, t, dur, progress} = useShot();
  const id = useId().replace(/:/g, '');
  const beat = props.beat as string;

  if (beat === 'lightTravel' || beat === 'moonDark') {
    const travel = beat === 'lightTravel';
    // The last shell of sunlight crossing space.
    const shellX = travel ? interpolate(t, [0.5, dur * 0.82], [220, 1900], clamp) : interpolate(t, [0.8, 3.2], [-200, 2300], clamp);
    const earthX = travel ? 1640 : 620;
    const earthR = travel ? 34 : 230;
    const moonX = travel ? 1700 : 1450;
    const moonR = travel ? 9 : 62;
    const earthLit = shellX < earthX + earthR ? 1 : interpolate(shellX, [earthX + earthR, earthX + earthR + 30], [1, 0], clamp);
    const moonLit = shellX < moonX + moonR ? 1 : interpolate(shellX, [moonX + moonR, moonX + moonR + 30], [1, 0], clamp);
    const keys: CamKey[] = travel ? [[0, 1.05, 820, 540], [1, 1.12, 1100, 540]] : [[0, 1.1, 900, 560], [1, 1.2, 1050, 540]];
    return (
      <Stage bg="#000">
        <Cine keys={keys} progress={progress} frame={frame} handheld={0.15}>
          <Plane depth={0.1}>
            <MilkyWay frame={frame} opacity={0.45} angle={-18} cy={400} />
            <Stars frame={frame} count={300} seed={93} maxR={1.8} />
          </Plane>
          <Plane depth={1}>
            {travel && <DeadSun x={180} y={540} r={120} glow={interpolate(t, [0, dur], [0.9, 0.4])} />}
            {/* the shell: a thin bright arc of the last sunlight */}
            <g style={{mixBlendMode: 'screen'}}>
              <path d={`M${shellX - 30},-200 Q${shellX + 40},540 ${shellX - 30},1280`} stroke="#FFE7B0" strokeWidth={10} fill="none" opacity={0.9} />
              <path d={`M${shellX - 60},-200 Q${shellX + 10},540 ${shellX - 60},1280`} stroke="#FFB867" strokeWidth={60} fill="none" opacity={0.18} />
            </g>
            <Planet x={earthX} y={540} r={earthR} color="#4F9BE0" shade="#1E4F8A" lit={earthLit} id={`${id}e`} atmosphere="#7FD6FF" lights={travel ? 0 : 1} />
            {!travel && (
              <g>
                {/* continents hint on the big Earth */}
                <g opacity={earthLit * 0.8}>
                  <path d={`M${earthX - 120},${420} q60,-40 120,-10 q30,60 -20,110 q-80,20 -110,-40 z`} fill="#4FA36A" />
                  <path d={`M${earthX - 40},${560} q70,-20 100,30 q-10,80 -70,90 q-50,-40 -30,-120 z`} fill="#4FA36A" />
                </g>
              </g>
            )}
            <Planet x={moonX} y={travel ? 520 : 420} r={moonR} color="#E8E2D6" shade="#9A9488" lit={moonLit} id={`${id}m`} />
          </Plane>
        </Cine>
      </Stage>
    );
  }

  if (beat === 'tangent') {
    const cx = 960;
    const cy = 560;
    const R = 360;
    // Earth goes round for the first third, then the curve lets go.
    const release = 0.32;
    const a0 = -2.2;
    const relAng = a0 + release * 1.6;
    const p = progress;
    const ang = a0 + Math.min(p, release) * 1.6;
    let ex = cx + Math.cos(ang) * R;
    let ey = cy + Math.sin(ang) * R;
    if (p > release) {
      const d = (p - release) * 900;
      ex = cx + Math.cos(relAng) * R - Math.sin(relAng) * d;
      ey = cy + Math.sin(relAng) * R + Math.cos(relAng) * d;
    }
    const rx = cx + Math.cos(relAng) * R;
    const ry = cy + Math.sin(relAng) * R;
    return (
      <Stage bg="#000">
        <Cine keys={[[0, 1.25, 900, 500], [1, 1.0, 1000, 600]]} progress={progress} frame={frame} handheld={0.1}>
          <Plane depth={0.1}>
            <Stars frame={frame} count={320} seed={12} maxR={1.8} />
          </Plane>
          <Plane depth={1}>
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="#7FD6FF" strokeWidth={3} strokeDasharray="4 10" opacity={interpolate(p, [release, release + 0.2], [0.7, 0.2], clamp)} />
            <DeadSun x={cx} y={cy} r={40} glow={0.25} />
            {p > release && <path d={`M${rx},${ry} L${ex},${ey}`} stroke="#7FD6FF" strokeWidth={4} strokeDasharray="3 12" strokeLinecap="round" opacity={0.9} />}
            <Bloom x={ex} y={ey} r={90} color="#7FD6FF" opacity={0.6} />
            <circle cx={ex} cy={ey} r={20} fill="#4F9BE0" stroke="#0B1026" strokeWidth={3} />
            <circle cx={ex + Math.cos(frame * 0.05) * 42} cy={ey + Math.sin(frame * 0.05) * 42} r={6} fill="#5A5A60" stroke="#0B1026" strokeWidth={2} />
          </Plane>
        </Cine>
      </Stage>
    );
  }

  // pastMars / pastJupiter: the solar system from above, Earth's straight road out.
  const jupiter = beat === 'pastJupiter';
  const au = jupiter ? 72 : 210;
  const day = jupiter ? 365 : interpolate(progress, [0, 0.7], [70, 100], clamp);
  const pulse = interpolate(t, [jupiter ? 1.2 : 2.6, jupiter ? 2.2 : 3.6, jupiter ? 4 : 5.4], [0, 1, 0.4], clamp);
  const cx = jupiter ? 960 : 760;
  const cy = jupiter ? 620 : 700;
  // Earth position after `day` days along its tangent (phase 0 → heading straight up).
  const ex = cx + au;
  const ey = cy - ((29.8 * day * 86400) / 1.496e8) * au;
  const keys: CamKey[] = jupiter ? [[0, 1.3, ex, ey + 120], [1, 1.0, 960, 560]] : [[0, 5, ex, ey], [0.55, 1.15, 860, 520], [1, 1.05, 860, 520]];
  return (
    <Stage bg="#000">
      <Cine keys={keys} progress={progress} frame={frame} handheld={0.1}>
        <Plane depth={0.05}>
          <MilkyWay frame={frame} opacity={0.35} angle={24} />
          <Stars frame={frame} count={360} seed={64} maxR={1.6} />
        </Plane>
        <Plane depth={1}>
          <System au={au} day={day} cx={cx} cy={cy} highlight={jupiter ? 'jupiter' : 'mars'} pulse={pulse} />
        </Plane>
      </Cine>
    </Stage>
  );
};
