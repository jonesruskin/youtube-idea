import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Toon} from '../../characters/toon/Toon';
import {CAST} from '../../characters/toon/design';
import {FACES} from '../../characters/toon/face';
import {POSES} from '../../characters/toon/poses';
import {Stars} from '../../fx/sky';
import {PhotoGlobe} from '../../fx/PhotoGlobe';
import {Shell} from './space';
import {INK, useSetCtx, Vignette} from './stage';

/**
 * Explainer diagrams. No labels: every idea is shown with objects and motion (the genre's "show the noun" rule).
 * Each diagram has steps; `step` picks which beat this shot plays.
 */
const W = 1920;
const H = 1080;
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const BG = '#0B1230';

const Board: React.FC<{frame: number; children: React.ReactNode; z?: number; cx?: number; cy?: number; stars?: boolean; overlay?: React.ReactNode}> = ({frame, children, z = 1, cx = 960, cy = 540, stars = true, overlay}) => (
  <AbsoluteFill style={{background: BG}}>
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
      {stars ? <Stars frame={frame} count={300} w={W} h={H} seed={31} maxR={1.6} /> : null}
      {Array.from({length: 25}, (_, i) => (
        <path key={i} d={`M${i * 80},0 L${i * 80},${H}`} stroke="#FFFFFF" strokeOpacity={0.03} />
      ))}
      <g transform={`translate(${960 + Math.sin(frame * 0.021) * 14},${540 + Math.cos(frame * 0.017) * 10}) scale(${z * (1 + frame * 0.0006)}) rotate(${Math.sin(frame * 0.013) * 0.6}) translate(${-cx},${-cy})`}>{children}</g>
      <Vignette amount={0.55} />
    </svg>
    {overlay}
  </AbsoluteFill>
);
/** The real Earth (NASA texture) placed over a diagram at board coordinates. */
const RealEarth: React.FC<{x: number; y: number; d: number; center: [number, number]}> = ({x, y, d, center}) => (
  <div style={{position: 'absolute', left: x - d / 2, top: y - d / 2, filter: 'drop-shadow(0 0 24px rgba(111,184,255,0.45))'}}>
    <PhotoGlobe size={d} center={center} sun={null} nightLift={1} lights={0.6} />
  </div>
);

const SealedSun: React.FC<{x: number; y: number; r: number; frame: number}> = ({x, y, r, frame}) => <Shell cx={x} cy={y} r={r} close={1} spin={frame * 0.004} seam={0.5} frame={frame} n={90} />;
const Planet: React.FC<{x: number; y: number; r: number; col: string; lit?: number; ring?: boolean}> = ({x, y, r, col, lit = 1, ring}) => (
  <g>
    {lit > 0 && <circle cx={x} cy={y} r={r * 2.2} fill={col} opacity={0.12 * lit} />}
    <circle cx={x} cy={y} r={r} fill={lit > 0.1 ? col : '#1A1E2E'} stroke={INK} strokeWidth={4} />
    <path d={`M${x},${y - r} A${r},${r} 0 0 1 ${x},${y + r} A${r * 0.6},${r} 0 0 0 ${x},${y - r}`} fill="#000" opacity={0.3} />
    {ring && <ellipse cx={x} cy={y} rx={r * 1.8} ry={r * 0.4} fill="none" stroke={col} strokeWidth={4} />}
  </g>
);
const Earth: React.FC<{x: number; y: number; r: number; lit?: boolean}> = ({x, y, r, lit = false}) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={lit ? '#2E7BD6' : '#1E3E78'} stroke={INK} strokeWidth={4} />
    <path d={`M${x - r * 0.5},${y - r * 0.6} q${r * 0.4},${r * 0.2} ${r * 0.3},${r * 0.6} q${-r * 0.3},${r * 0.3} ${-r * 0.1},${r * 0.7}`} fill={lit ? '#3EA06A' : '#2A5A4A'} />
    <path d={`M${x + r * 0.2},${y - r * 0.2} q${r * 0.4},0 ${r * 0.5},${r * 0.4} q-${r * 0.2},${r * 0.3} -${r * 0.5},${r * 0.1} z`} fill={lit ? '#3EA06A' : '#2A5A4A'} />
    <circle cx={x} cy={y} r={r * 1.12} fill="none" stroke="#6FB8FF" strokeWidth={3} opacity={0.5} />
  </g>
);
/** Light travelling along a polyline: a bright dash at progress u. */
const Photon: React.FC<{pts: [number, number][]; u: number; col?: string}> = ({pts, u, col = '#FFE9A8'}) => {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  let d = u * total;
  let i = 0;
  while (i < segs.length - 1 && d > segs[i]) {
    d -= segs[i];
    i++;
  }
  const k = Math.min(1, d / segs[i]);
  const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k;
  const y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k;
  return (
    <g>
      <circle cx={x} cy={y} r={22} fill={col} opacity={0.25} />
      <circle cx={x} cy={y} r={9} fill={col} />
    </g>
  );
};
const Clock: React.FC<{x: number; y: number; r: number; turns: number}> = ({x, y, r, turns}) => (
  <g transform={`translate(${x},${y})`}>
    <circle r={r} fill="#F4EFE6" stroke={INK} strokeWidth={6} />
    <path d={`M0,0 L0,${-r * 0.7}`} stroke={INK} strokeWidth={6} strokeLinecap="round" transform={`rotate(${turns * 360})`} />
    <path d={`M0,0 L0,${-r * 0.45}`} stroke="#C2464F" strokeWidth={8} strokeLinecap="round" transform={`rotate(${turns * 30})`} />
    <circle r={6} fill={INK} />
  </g>
);

export const DiagramScene: React.FC = () => {
  const c = useSetCtx();
  const v = c.v;
  const step = (c.p.step as number) ?? 0;
  const t = c.t;
  const p = t / c.dur;
  const f = c.frame;

  if (v === 'lightDelay') {
    // Sun (sealed) left, Venus mid-top, Earth right. Old light: Sun → Venus → Earth.
    const S: [number, number] = [260, 600];
    const V: [number, number] = [900, 300];
    const E: [number, number] = [1640, 640];
    const u = clamp(p * 1.2);
    return (
      <Board frame={f} z={interpolate(p, [0, 1], [1, 1.05])}>
        <SealedSun x={S[0]} y={S[1]} r={120} frame={f} />
        <path d={`M${S[0]},${S[1]} L${V[0]},${V[1]} L${E[0]},${E[1]}`} stroke="#FFE9A8" strokeWidth={4} strokeDasharray="14 14" opacity={0.6} fill="none" />
        <Planet x={V[0]} y={V[1]} r={44} col="#F2D49A" lit={1} />
        <Earth x={E[0]} y={E[1]} r={70} />
        {step === 0 ? (
          <g>
            {/* a mirror glint on Venus */}
            <path d={`M${V[0] - 26},${V[1] - 26} L${V[0] + 26},${V[1] + 26}`} stroke="#FFFFFF" strokeWidth={6} opacity={0.5 + 0.5 * Math.sin(f * 0.3)} />
            <Photon pts={[S, V, E]} u={u * 0.5} />
          </g>
        ) : (
          <g>
            {[0, 0.15, 0.3, 0.45].map((o) => (
              <Photon key={o} pts={[V, E]} u={clamp(u - o)} />
            ))}
            <Clock x={V[0]} y={V[1] - 150} r={50} turns={p * 4} />
          </g>
        )}
      </Board>
    );
  }

  if (v === 'jupiter') {
    const S: [number, number] = [200, 540];
    const J: [number, number] = [1500, 220];
    const E: [number, number] = [560, 760];
    const u = clamp(p);
    return (
      <Board frame={f} z={interpolate(p, [0, 1], [1.05, 1])}>
        <SealedSun x={S[0]} y={S[1]} r={90} frame={f} />
        <path d={`M${S[0]},${S[1]} L${J[0]},${J[1]} L${E[0]},${E[1]}`} stroke="#FFE9A8" strokeWidth={4} strokeDasharray="14 14" opacity={0.5} fill="none" />
        <Planet x={J[0]} y={J[1]} r={90} col="#D9B48A" />
        {[-40, 0, 30].map((y) => (
          <path key={y} d={`M${J[0] - 80},${J[1] + y} L${J[0] + 80},${J[1] + y}`} stroke="#B07A52" strokeWidth={10} opacity={0.6} />
        ))}
        <Earth x={E[0]} y={E[1]} r={50} />
        <Photon pts={[J, E]} u={u} />
        <Clock x={1500} y={700} r={110} turns={p * 6} />
      </Board>
    );
  }

  if (v === 'heat') {
    // the four of you as warm silhouettes; each lights a bulb
    const ppl: [keyof typeof CAST | 'dog', number][] = [
      ['you', 520],
      ['mira', 820],
      ['ito', 1120],
      ['dog', 1400],
    ];
    return (
      <Board frame={f} stars={false}>
        <defs>
          <radialGradient id="thermBody">
            <stop offset="0" stopColor="#FFF3B0" />
            <stop offset="0.4" stopColor="#FFB13B" />
            <stop offset="0.75" stopColor="#E0442A" />
            <stop offset="1" stopColor="#7A1A6A" />
          </radialGradient>
        </defs>
        {ppl.map(([who, x], i) => {
          const on = clamp((t - 0.3 - i * 0.35) / 0.3);
          const top = who === 'dog' ? 780 : 900 - 300 * 1.5 * CAST[who as keyof typeof CAST].height;
          return (
            <g key={who}>
              {who === 'dog' ? (
                <ellipse cx={x} cy={840} rx={110} ry={60} fill="url(#thermBody)" opacity={0.85} />
              ) : (
                <g opacity={0.9}>
                  <Toon
                    d={CAST[who as keyof typeof CAST]}
                    s={{x, y: 900, scale: 1.5, facing: 'front', pose: POSES.stand, bob: 0, face: FACES.smile, turn: 0, look: [0, 0], talk: 0, blink: 0, outfit: 'cold', hoodUp: false, breath: 0, frame: f, rim: false, opacity: 1, watchGlow: 0}}
                  />
                  <ellipse cx={x} cy={(top + 900) / 2} rx={120} ry={(900 - top) / 2 + 30} fill="url(#thermBody)" opacity={0.55} style={{mixBlendMode: 'screen'}} />
                </g>
              )}
              {/* bulb */}
              <g transform={`translate(${x},${top - 120})`}>
                {on > 0 && <circle r={70} fill="#FFE08A" opacity={0.35 * on} />}
                <circle r={34} fill={on > 0.5 ? '#FFE08A' : '#3A3F52'} stroke={INK} strokeWidth={5} />
                <rect x={-16} y={30} width={32} height={22} rx={4} fill="#8A8F9C" stroke={INK} strokeWidth={4} />
              </g>
            </g>
          );
        })}
      </Board>
    );
  }

  if (v === 'tide') {
    // Earth from above, ocean bulge toward the Moon; step 1: the Sun's part of the bulge is taken away.
    const sunPart = step === 0 ? 1 : 1 - ease(clamp((t - 0.4) / 1.2));
    const bulge = (1 + 0.46 * sunPart) * (1 + 0.05 * Math.sin(f * 0.12));
    return (
      <Board frame={f} overlay={<RealEarth x={960} y={540} d={460} center={[0, 90]} />}>
        <SealedSun x={160} y={540} r={90} frame={f} />
        <g transform="translate(960,540)">
          <ellipse rx={230 + 110 * bulge} ry={250} fill="#4A9BEA" opacity={0.75} stroke="#9FD8FF" strokeWidth={4} />
          <ellipse rx={230 + 50} ry={240} fill="#4A9BEA" opacity={0.5} />
        </g>
        <g transform={`translate(${1720 + Math.sin(f * 0.03) * 40},${470 + Math.cos(f * 0.03) * 60})`}>
          <circle r={60} fill="#C9C4B8" stroke={INK} strokeWidth={5} />
          <circle cx={-14} cy={-10} r={12} fill="#A8A296" />
        </g>
        {/* tide gauge bar */}
        <g transform="translate(1500,900)">
          <rect x={-30} y={-300} width={60} height={300} fill="#1A2448" stroke={INK} strokeWidth={4} />
          <rect x={-30} y={-205 * bulge} width={60} height={205 * bulge} fill="#4A9BEA" />
        </g>
      </Board>
    );
  }

  if (v === 'orbit') {
    if (step === 0) {
      // a key on a string; the string snaps and the key flies off along the tangent
      const cut = 1.4;
      const a = Math.min(t, cut) * 5;
      const kx0 = 960 + Math.cos(a) * 320;
      const ky0 = 540 + Math.sin(a) * 320;
      const vx = -Math.sin(a) * 1600;
      const vy = Math.cos(a) * 1600;
      const dt = Math.max(0, t - cut);
      const kx = t < cut ? kx0 : kx0 + vx * dt;
      const ky = t < cut ? ky0 : ky0 + vy * dt;
      return (
        <Board frame={f} stars={false}>
          <circle cx={960} cy={540} r={320} fill="none" stroke="#FFFFFF" strokeOpacity={0.15} strokeWidth={4} strokeDasharray="12 12" />
          {t < cut && <path d={`M960,540 L${kx},${ky}`} stroke="#E8E2D6" strokeWidth={6} />}
          {t >= cut && <path d={`M960,540 L${960 + Math.cos(a + (t - cut) * 3) * 120},${540 + Math.sin(a + (t - cut) * 3) * 120}`} stroke="#E8E2D6" strokeWidth={6} />}
          {t >= cut && <path d={`M${kx0},${ky0} L${kx},${ky}`} stroke="#E8B04B" strokeWidth={6} strokeDasharray="16 14" opacity={0.7} />}
          <circle cx={960} cy={540} r={34} fill="#E8C4A2" stroke={INK} strokeWidth={5} />
          <g transform={`translate(${kx},${ky}) rotate(${a * 57})`}>
            <circle r={30} fill="#E8B04B" stroke={INK} strokeWidth={5} />
            <circle r={10} fill={BG} />
            <rect x={26} y={-10} width={80} height={20} fill="#E8B04B" stroke={INK} strokeWidth={4} />
          </g>
          {t >= cut && t < cut + 0.3 && <path d={`M${960 + Math.cos(a) * 200 - 30},${540 + Math.sin(a) * 200} l60,0`} stroke="#FFFFFF" strokeWidth={6} />}
        </Board>
      );
    }
    const a = t * 0.9;
    return (
      <Board frame={f} z={interpolate(p, [0, 1], [1, 1.08])}>
        <SealedSun x={960} y={540} r={110} frame={f} />
        <circle cx={960} cy={540} r={380} fill="none" stroke="#6FB8FF" strokeOpacity={0.35} strokeWidth={4} strokeDasharray="12 12" />
        <path d={`M960,540 L${960 + Math.cos(a) * 380},${540 + Math.sin(a) * 380}`} stroke="#6FB8FF" strokeWidth={3} strokeDasharray="4 10" opacity={0.6} />
        <Earth x={960 + Math.cos(a) * 380} y={540 + Math.sin(a) * 380} r={44} />
      </Board>
    );
  }

  if (v === 'ocean') {
    const down = step === 1 ? ease(clamp(t / 2.5)) : 0;
    const ice = step === 0 ? ease(clamp((t - 0.2) / 1.4)) : 1;
    return (
      <AbsoluteFill style={{background: '#000'}}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
          <g transform={`translate(0,${-down * 700})`}>
            <rect x={0} y={-400} width={W} height={820} fill="#070B20" />
            <Stars frame={f} count={200} w={W} h={400} seed={3} />
            <defs>
              <linearGradient id="deep" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1E5A9A" />
                <stop offset="1" stopColor="#020818" />
              </linearGradient>
            </defs>
            <rect x={0} y={420} width={W} height={1800} fill="url(#deep)" />
            <rect x={0} y={420 - 4} width={W * ice} height={70} fill="#DCEBFA" stroke={INK} strokeWidth={4} />
            {Array.from({length: 30}, (_, i) => (
              <path key={i} d={`M${i * 70},${430} l20,40 l30,-10`} stroke="#9DB6D6" strokeWidth={3} fill="none" opacity={i * 70 < W * ice ? 0.8 : 0} />
            ))}
            {/* life under the lid */}
            {Array.from({length: 7}, (_, i) => (
              <g key={i} transform={`translate(${((i * 290 + f * (1 + (i % 3))) % 2200) - 140},${620 + i * 150})`} opacity={0.75}>
                <path d="M0,0 Q40,-24 80,0 Q40,24 0,0 Z M80,0 L108,-16 L102,0 L108,16 Z" fill={['#5A8AC0', '#7FA7C9', '#4A7AB0'][i % 3]} />
              </g>
            ))}
            {/* depth marks */}
            {[1, 2, 3].map((k) => (
              <path key={k} d={`M80,${420 + k * 360} L160,${420 + k * 360}`} stroke="#9FD8FF" strokeWidth={4} opacity={0.5} />
            ))}
          </g>
          <Vignette amount={0.5} />
        </svg>
      </AbsoluteFill>
    );
  }

  if (v === 'ground') {
    const warm = step === 1 ? 0.6 + 0.4 * Math.sin(f * 0.1) : 0.35;
    return (
      <AbsoluteFill style={{background: '#000'}}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
          <g transform={`translate(960,540) scale(${interpolate(p, [0, 1], [1, 1.06])}) translate(-960,-540)`}>
            <rect x={0} y={0} width={W} height={260} fill="#060A1C" />
            <Stars frame={f} count={120} w={W} h={240} seed={6} />
            {/* frozen street with a tiny you and Biscuit */}
            <rect x={0} y={240} width={W} height={60} fill="#E6EEF8" stroke={INK} strokeWidth={4} />
            <rect x={0} y={300} width={W} height={180} fill="#4A4F68" />
            <rect x={0} y={480} width={W} height={260} fill="#7A5E50" />
            <rect x={0} y={740} width={W} height={340} fill="#9A4E32" />
            {Array.from({length: 40}, (_, i) => (
              <circle key={i} cx={(i * 211) % W} cy={500 + ((i * 97) % 560)} r={6 + (i % 4) * 4} fill="#000" opacity={0.12} />
            ))}
            <rect x={0} y={740} width={W} height={340} fill="#FF7A3A" opacity={0.35 * warm} />
            {/* the metro tunnel */}
            <path d="M300,700 L300,560 Q960,380 1620,560 L1620,700 Z" fill="#2A2630" stroke={INK} strokeWidth={5} />
            <rect x={300} y={660} width={1320} height={40} fill="#4A4552" />
            <rect x={300} y={540} width={1320} height={160} fill="#FFB867" opacity={0.25} />
            {/* people sheltering in the tunnel */}
            {[520, 600, 690, 900, 980, 1200, 1290, 1420].map((x, i) => (
              <g key={x} transform={`translate(${x},660)`}>
                <circle cx={0} cy={-58} r={14} fill={['#A06A44', '#E8C4A2', '#7A4A2E', '#C68A5E'][i % 4]} stroke={INK} strokeWidth={3} />
                <rect x={-12} y={-44} width={24} height={44} rx={8} fill={['#F08A2C', '#4F86C6', '#3E5C4A', '#C2464F'][i % 4]} stroke={INK} strokeWidth={3} />
              </g>
            ))}
            {/* two thermometers: the frozen street vs the tunnel */}
            {[
              [180, 150, 0.12, '#4A9BEA'],
              [1740, 520, 0.62, '#D9443A'],
            ].map(([x, y, lv, col], i) => (
              <g key={i} transform={`translate(${x},${y})`}>
                <rect x={-22} y={-120} width={44} height={180} rx={22} fill="#F4EFE6" stroke={INK} strokeWidth={5} />
                <rect x={-8} y={-100 + 140 * (1 - (lv as number))} width={16} height={140 * (lv as number)} rx={8} fill={col as string} />
                <circle cx={0} cy={60} r={30} fill={col as string} stroke={INK} strokeWidth={5} />
              </g>
            ))}
            {/* steam rising out of a grate */}
            {Array.from({length: 6}, (_, i) => {
              const ph = ((f + i * 20) % 120) / 120;
              return <circle key={i} cx={1300 + Math.sin(f * 0.04 + i) * 20} cy={300 - ph * 220} r={20 + ph * 50} fill="#C8D2E0" opacity={(1 - ph) * 0.5} />;
            })}
            <rect x={1250} y={236} width={100} height={10} fill="#2A2E3A" />
            {/* heat arrows upward from the rock */}
            {[400, 760, 1120, 1480].map((x, i) => {
              const ph = ((f * 2 + i * 40) % 160) / 160;
              return <path key={x} d={`M${x},${1000 - ph * 220} l-24,30 m24,-30 l24,30`} stroke="#FFB13B" strokeWidth={8} opacity={(1 - ph) * warm} />;
            })}
          </g>
          <Vignette amount={0.5} />
        </svg>
      </AbsoluteFill>
    );
  }

  if (v === 'oxygen') {
    const needle = -60 + 120 * 0.999 + Math.sin(f * 0.2) * 0.4;
    return (
      <Board frame={f} overlay={<RealEarth x={760} y={540} d={520} center={[20 + f * 0.05, 25]} />}>
        <circle cx={760} cy={540} r={330} fill="#4A9BEA" opacity={0.15} />
        <circle cx={760} cy={540} r={300} fill="#4A9BEA" opacity={0.2} />
        {/* O₂ molecules drifting in the atmosphere */}
        {Array.from({length: 18}, (_, i) => {
          const a = (i / 18) * Math.PI * 2 + f * 0.004;
          const rr = 285 + (i % 3) * 12;
          return (
            <g key={i} transform={`translate(${760 + Math.cos(a) * rr},${540 + Math.sin(a) * rr})`}>
              <circle cx={-6} r={8} fill="#BFE3FF" />
              <circle cx={6} r={8} fill="#BFE3FF" />
            </g>
          );
        })}
        {/* the gauge: full, barely moving */}
        <g transform="translate(1440,560)">
          <path d="M-180,0 A180,180 0 0 1 180,0" fill="none" stroke="#2A3352" strokeWidth={40} />
          <path d="M-180,0 A180,180 0 0 1 180,0" fill="none" stroke="#4AD08A" strokeWidth={40} strokeDasharray={`${Math.PI * 180} 999`} />
          <path d="M0,0 L0,-150" stroke="#F4EFE6" strokeWidth={10} strokeLinecap="round" transform={`rotate(${needle})`} />
          <circle r={18} fill="#F4EFE6" stroke={INK} strokeWidth={4} />
        </g>
      </Board>
    );
  }

  if (v === 'vents') {
    const z = step === 1 ? interpolate(p, [0, 1], [2.0, 2.3]) : interpolate(p, [0, 1], [1, 1.1]);
    return (
      <AbsoluteFill style={{background: '#020610'}}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
          <g transform={`translate(960,540) scale(${z}) translate(${step === 1 ? -1150 : -960},${step === 1 ? -930 : -540})`}>
            <rect x={-500} y={-500} width={3000} height={2200} fill="#03091A" />
            {/* black smoker chimney + shimmering plume */}
            <path d="M860,1000 L900,560 L960,520 L1010,580 L1060,1000 Z" fill="#2A2228" stroke={INK} strokeWidth={6} />
            {Array.from({length: 10}, (_, i) => {
              const ph = ((f * 1.5 + i * 24) % 240) / 240;
              return <circle key={i} cx={960 + Math.sin(f * 0.03 + i) * 30 * ph} cy={520 - ph * 520} r={30 + ph * 120} fill="#1A1416" opacity={(1 - ph) * 0.8} />;
            })}
            <ellipse cx={960} cy={540} rx={60} ry={20} fill="#FF7A3A" opacity={0.4 + 0.2 * Math.sin(f * 0.3)} />
            {/* sea floor */}
            <path d="M-500,1000 Q400,940 960,1000 T2500,980 L2500,1700 L-500,1700 Z" fill="#1E1A2A" />
            {/* tube worms */}
            {Array.from({length: 14}, (_, i) => {
              const x = 600 + i * 50 + (i > 6 ? 300 : 0);
              const h = 120 + ((i * 37) % 90);
              const sw = Math.sin(f * 0.06 + i) * 10;
              return (
                <g key={i}>
                  <path d={`M${x},1000 Q${x + sw},${1000 - h / 2} ${x + sw * 1.5},${1000 - h}`} stroke="#E8E2D6" strokeWidth={14} fill="none" />
                  <ellipse cx={x + sw * 1.5} cy={1000 - h - 10} rx={16} ry={22} fill="#E2464F" />
                </g>
              );
            })}
            {/* a white crab waving a claw */}
            <g transform="translate(1180,980)">
              <ellipse rx={60} ry={34} fill="#EDE6DA" stroke={INK} strokeWidth={5} />
              {[-1, 1].map((k) => (
                <path key={k} d={`M${k * 50},10 l${k * 40},30 M${k * 40},16 l${k * 30},34 M${k * 30},20 l${k * 20},34`} stroke="#EDE6DA" strokeWidth={8} />
              ))}
              <g transform={`rotate(${-20 + Math.sin(f * 0.25) * 25},-50,-10)`}>
                <path d="M-50,-10 L-100,-60" stroke="#EDE6DA" strokeWidth={12} />
                <path d="M-100,-60 q-30,-10 -26,-40 q20,6 30,20 q10,-24 26,-20 q0,30 -30,40" fill="#EDE6DA" stroke={INK} strokeWidth={4} />
              </g>
              <circle cx={-14} cy={-30} r={7} fill={INK} />
              <circle cx={14} cy={-30} r={7} fill={INK} />
            </g>
            {/* ghost shrimp */}
            {Array.from({length: 6}, (_, i) => (
              <g key={i} transform={`translate(${700 + ((i * 200 + f * 2) % 800)},${760 + i * 30})`} opacity={0.7}>
                <path d="M0,0 q20,-14 40,0 q-20,10 -40,0 m40,0 l14,-8" stroke="#BFE3FF" strokeWidth={4} fill="#BFE3FF" fillOpacity={0.3} />
              </g>
            ))}
          </g>
          <Vignette amount={0.65} />
        </svg>
      </AbsoluteFill>
    );
  }

  if (v === 'beam') {
    const draw = ease(clamp((t - 0.3) / 1.5));
    return (
      <Board frame={f}>
        <SealedSun x={960} y={540} r={60} frame={f} />
        {[150, 240, 330, 480, 700].map((r, i) => (
          <g key={r}>
            <circle cx={960} cy={540} r={r} fill="none" stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={3} />
            <circle cx={960 + Math.cos(i * 1.7 + f * 0.003 * (6 - i)) * r} cy={540 + Math.sin(i * 1.7 + f * 0.003 * (6 - i)) * r} r={[10, 16, 18, 12, 30][i]} fill={['#B8B0A4', '#F2D49A', '#2E7BD6', '#D9443A', '#D9B48A'][i]} />
          </g>
        ))}
        <path d={`M1010,520 L${1010 + draw * 1100},${520 - draw * 560}`} stroke="#FFB13B" strokeWidth={8} />
        <path d={`M1010,520 L${1010 + draw * 1100},${520 - draw * 560}`} stroke="#FFB13B" strokeWidth={30} opacity={0.2} />
      </Board>
    );
  }

  if (v === 'count') {
    // pulses light the planets one by one: Mercury, Venus, Earth — and stop.
    const xs = [520, 860, 1220, 1560];
    const cols = ['#B8B0A4', '#F2D49A', '#2E7BD6', '#D9443A'];
    const lit = step === 1 ? 3 : Math.min(3, Math.floor(t / 0.9) + 1);
    return (
      <Board frame={f} z={step === 1 ? interpolate(p, [0, 1], [1.4, 1.9]) : 1} cx={step === 1 ? 1220 : 960} cy={540}>
        <SealedSun x={160} y={540} r={80} frame={f} />
        {xs.map((x, i) => (
          <g key={x}>
            {i < lit && <circle cx={x} cy={540} r={110} fill={cols[i]} opacity={0.18 + (i === lit - 1 ? 0.15 * Math.sin(f * 0.4) : 0)} />}
            {i === 2 ? <Earth x={x} y={540} r={70} lit={i < lit} /> : <Planet x={x} y={540} r={[40, 62, 70, 52][i]} col={cols[i]} lit={i < lit ? 1 : 0} />}
            {i < lit &&
              Array.from({length: i + 1}, (_, k) => <circle key={k} cx={x - i * 14 + k * 28} cy={720} r={10} fill="#7FE8FF" />)}
          </g>
        ))}
        {step === 1 && <circle cx={1220} cy={540} r={100 + 10 * Math.sin(f * 0.2)} fill="none" stroke="#7FE8FF" strokeWidth={6} />}
      </Board>
    );
  }
  return <Board frame={f}>{null}</Board>;
};
