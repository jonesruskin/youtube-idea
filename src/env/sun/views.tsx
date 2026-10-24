import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Aurora, MilkyWay} from '../../fx/cinema/atmos';
import {rand, Stars} from '../../fx/sky';
import {fonts} from '../../theme';
import {CityBlocks} from '../sun01/parts';
import {Shell} from './space';
import {Grade, INK, useSetCtx, Vignette} from './stage';
import {Sky} from './sets/outdoor';

const W = 1920;
const H = 1080;
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = Easing.bezier(0.45, 0, 0.2, 1);

/** Rooftop silhouette along the bottom of sky shots (your city, unlit or lit). */
const Rooftops: React.FC<{frame: number; lit: number; seed?: number; snow?: number}> = ({frame, lit, seed = 70, snow = 0}) => (
  <g>
    <CityBlocks seed={seed} base={1100} color="#070A16" frame={frame} lights={lit} minH={120} maxH={330} snow={snow} />
  </g>
);

/** Sky POV shots from the roof. */
export const SkyScene: React.FC = () => {
  const c = useSetCtx();
  const v = c.v;
  const p = c.t / c.dur;
  const drift = interpolate(p, [0, 1], [0, -40]);
  if (v === 'jupiterOut') {
    // the telescope eyepiece: Jupiter and its moons, then nothing
    const out = c.t > c.at('l0+1.4', 1.6);
    const fl = out ? 0 : 1;
    return (
      <AbsoluteFill style={{background: '#000'}}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
          <defs>
            <clipPath id="eye">
              <circle cx={960} cy={540} r={430} />
            </clipPath>
            <radialGradient id="eyeV">
              <stop offset="0.75" stopColor="#000" stopOpacity={0} />
              <stop offset="1" stopColor="#000" stopOpacity={0.95} />
            </radialGradient>
          </defs>
          <g clipPath="url(#eye)">
            <rect x={0} y={0} width={W} height={H} fill="#03040C" />
            {/* after Jupiter is gone, the view sweeps as Ito hunts for it */}
            <g transform={`translate(${c.frame * 0.6 + (out ? Math.sin((c.t - c.at('l0+1.4', 1.6)) * 1.6) * 260 : 0)},${c.frame * 0.15 + (out ? Math.cos((c.t - c.at('l0+1.4', 1.6)) * 1.1) * 120 : 0)})`}>
              <Stars frame={c.frame} count={260} w={W} h={H} seed={9} maxR={2.6} />
              <Stars frame={c.frame} count={200} w={W} h={H} seed={19} maxR={2.2} y0={-600} />
              {[
                [300, 300, 160, '#6F7FC8'],
                [1500, 700, 220, '#9A6FC8'],
                [900, 900, 140, '#6FA8C8'],
                [1200, 200, 180, '#7F6FC8'],
              ].map(([x, y, r, col], i) => (
                <ellipse key={i} cx={x as number} cy={y as number} rx={r as number} ry={(r as number) * 0.55} fill={col as string} opacity={0.22} filter="blur(18px)" transform={`rotate(${i * 40},${x},${y})`} />
              ))}
            </g>
            <g transform={`translate(${960 + Math.sin(c.frame * 0.05) * 6 + c.frame * 0.4},${540 + Math.cos(c.frame * 0.04) * 4}) scale(${1 + c.frame * 0.0025})`} opacity={fl}>
              <ellipse rx={150} ry={140} fill="#D9B48A" />
              {[-90, -50, -10, 30, 70, 105].map((y, i) => (
                <ellipse key={y} cx={0} cy={y} rx={150 * Math.sqrt(1 - (y / 145) ** 2)} ry={10 + (i % 2) * 6} fill={i % 2 ? '#B07A52' : '#E8CDA8'} opacity={0.8} />
              ))}
              <ellipse cx={50} cy={40} rx={24} ry={14} fill="#C2664A" />
              {[-330, -230, 260, 380].map((x, i) => (
                <circle key={x} cx={x + Math.sin(c.frame * (0.03 + i * 0.01)) * 30} cy={x * 0.02} r={9} fill="#F4EFE6" />
              ))}
            </g>
            <path d="M960,110 L960,970 M530,540 L1390,540" stroke="#7FA0C8" strokeWidth={2} opacity={0.35} />
            <rect x={0} y={0} width={W} height={H} fill="url(#eyeV)" />
          </g>
          <circle cx={960} cy={540} r={430} fill="none" stroke="#111" strokeWidth={30} />
        </svg>
      </AbsoluteFill>
    );
  }
  const venusOn = v === 'venus' || (v === 'venusOut' && c.t < c.at('l0+1.2', 1.4) + (Math.sin(c.frame * 1.3) > 0 ? 0 : -0.1));
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
        <g transform={`translate(0,${drift})`}>
          <Sky frame={c.frame} top="#01020A" mid="#081032" bottom={v === 'moon' || v === 'moonClose' ? '#2A3A70' : '#1A2658'} stars={1.8} seed={12} />
          {(v === 'milky' || v === 'auroraWide') && <MilkyWay frame={c.frame} opacity={v === 'milky' ? 1 : 0.5} angle={-28} cx={960} cy={360} />}
          {v === 'milky' && <MilkyWay frame={c.frame} opacity={0.6} angle={-28} cx={960} cy={360} seed={81} />}
          {(v === 'aurora' || v === 'auroraWide') && (
            <g>
              <Aurora frame={c.frame} y={v === 'aurora' ? 760 : 620} intensity={1.3} seed={5} />
              <Aurora frame={c.frame + 40} y={v === 'aurora' ? 640 : 520} intensity={0.8} seed={9} x0={-400} x1={2300} />
            </g>
          )}
          {(v === 'moon' || v === 'moonClose') && (
            <g transform={`translate(${v === 'moon' ? 1350 : 960},${v === 'moon' ? 420 : 470}) scale(${v === 'moon' ? 1 : 3.2})`}>
              {/* a dead crescent: a black disc hiding the stars, with the faintest rim */}
              <circle r={70} fill="#05060D" />
              <path d="M30,-62 A70,70 0 0 1 30,62 A54,70 0 0 0 30,-62" fill="#3A3F52" opacity={0.55} />
              <circle r={70} fill="none" stroke="#5A6488" strokeWidth={2} opacity={0.5} />
            </g>
          )}
          {(v === 'venus' || v === 'venusOut') && (
            <g transform="translate(1320,640)">
              {venusOn && (
                <g>
                  <circle r={46} fill="#FFF6DA" opacity={0.18} />
                  <circle r={16} fill="#FFF6DA" opacity={0.5} />
                  <circle r={7} fill="#FFFFFF" />
                  <path d="M-40,0 L40,0 M0,-40 L0,40" stroke="#FFFFFF" strokeWidth={2} opacity={0.5} />
                </g>
              )}
            </g>
          )}
          <Rooftops frame={c.frame} lit={v === 'milky' || v === 'auroraWide' ? 0 : 0.5} snow={v === 'milky' || v.startsWith('aurora') ? 1 : 0} />
          {v === 'auroraWide' && (
            <g transform="translate(960,900)">
              {/* three tiny silhouettes and a dog on the roof edge */}
              {[-40, 0, 40, 76].map((x, i) => (
                <g key={x} transform={`translate(${x},0)`}>
                  {i < 3 ? <path d={`M-8,0 L-6,-${[46, 30, 44][i]} Q0,-${[60, 40, 58][i]} 6,-${[46, 30, 44][i]} L8,0 Z`} fill="#03040A" /> : <ellipse cx={0} cy={-8} rx={12} ry={8} fill="#03040A" />}
                </g>
              ))}
              <rect x={-400} y={0} width={800} height={200} fill="#03040A" />
            </g>
          )}
        </g>
        {(v === 'aurora' || v === 'auroraWide') && <rect x={0} y={0} width={W} height={H} fill="#3AF0A0" opacity={0.06} style={{mixBlendMode: 'screen'}} />}
        <Vignette amount={0.6} />
      </svg>
    </AbsoluteFill>
  );
};

/** The grid failing: your city from above, districts going dark in a wave toward you. */
export const CityScene: React.FC = () => {
  const c = useSetCtx();
  const wave = clamp((c.t - 0.3) / Math.max(1.5, c.dur - 0.8));
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
        <Sky frame={c.frame} top="#000208" mid="#050A1E" bottom="#0E1636" stars={1.2} seed={64} />
        {[
          [380, 0.45, 90],
          [520, 0.6, 91],
          [680, 0.78, 92],
          [860, 1, 93],
          [1080, 1.25, 94],
        ].map(([base, s, seed], i) => (
          <g key={i} transform={`translate(960,${base}) scale(${s}) translate(-960,${-base})`}>
            <CityBlocks seed={seed} base={base} color={['#0E1430', '#121A38', '#161F42', '#1A244C', '#1E2A56'][i]} frame={c.frame} lights={0.9} minH={80} maxH={300} snow={0} darkWave={clamp(wave * 1.3 - i * 0.12)} x0={-600} x1={2500} />
          </g>
        ))}
        <Vignette amount={0.6} />
      </svg>
    </AbsoluteFill>
  );
};

/** Ito's rebuilt thermal camera: a handheld screen with an ironbow palette. */
export const ThermalScene: React.FC = () => {
  const c = useSetCtx();
  const p = c.t / c.dur;
  const appear = clamp((c.t - 0.4) / 1.2);
  const z = interpolate(p, [0, 1], [1, 1.1], {easing: ease});
  const r = rand(Math.floor(c.frame / 2));
  return (
    <AbsoluteFill style={{background: '#06070C'}}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
        <g transform={`translate(${Math.sin(c.frame * 0.09) * 9 + Math.sin(c.frame * 0.23) * 4},${Math.cos(c.frame * 0.07) * 7}) rotate(${Math.sin(c.frame * 0.05) * 0.8},960,540)`}>
        {/* the device */}
        <rect x={250} y={80} width={1420} height={920} rx={70} fill="#E9C46A" stroke={INK} strokeWidth={10} />
        <rect x={290} y={120} width={1340} height={840} rx={40} fill="#1A1A1A" />
        <defs>
          <clipPath id="screen">
            <rect x={330} y={160} width={1260} height={760} rx={20} />
          </clipPath>
          <radialGradient id="warm">
            <stop offset="0" stopColor="#FFF3B0" />
            <stop offset="0.3" stopColor="#FFB13B" />
            <stop offset="0.6" stopColor="#E0442A" />
            <stop offset="0.85" stopColor="#7A1A6A" stopOpacity={0.9} />
            <stop offset="1" stopColor="#2A0A4A" stopOpacity={0} />
          </radialGradient>
        </defs>
        <g clipPath="url(#screen)">
          <rect x={330} y={160} width={1260} height={760} fill="#0A0418" />
          {/* sensor noise */}
          {Array.from({length: 260}, (_, i) => (
            <rect key={i} x={330 + r() * 1260} y={160 + r() * 760} width={4} height={4} fill="#3A1A5A" opacity={0.6} />
          ))}
          <g transform={`translate(960,540) scale(${z}) translate(-960,-540)`}>
            <circle cx={960} cy={540} r={150} fill="url(#warm)" opacity={0.75 * appear} />
            <circle cx={960} cy={540} r={90} fill="#FFB13B" opacity={0.25 * appear} />
            {/* a faint ring where the real Sun would be, to show it's bigger */}
            <circle cx={960} cy={540} r={34} fill="none" stroke="#9FE8FF" strokeWidth={2} strokeDasharray="6 6" opacity={0.7 * appear} />
            {c.v === 'beam' && <path d="M1060,470 L1700,40" stroke="#FFB13B" strokeWidth={5} opacity={0.75 * clamp((c.t - 0.8) / 1)} />}
            {c.v === 'beam' && <path d="M1060,470 L1700,40" stroke="#E0442A" strokeWidth={18} opacity={0.3 * clamp((c.t - 0.8) / 1)} />}
          </g>
          {/* UI: crosshair, scale bar, readout */}
          <path d="M960,480 L960,510 M960,570 L960,600 M900,540 L930,540 M990,540 L1020,540" stroke="#FFFFFF" strokeWidth={3} />
          <defs>
            <linearGradient id="ironbow" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#0A0418" />
              <stop offset="0.3" stopColor="#7A1A6A" />
              <stop offset="0.6" stopColor="#E0442A" />
              <stop offset="0.85" stopColor="#FFB13B" />
              <stop offset="1" stopColor="#FFF3B0" />
            </linearGradient>
          </defs>
          <rect x={1520} y={260} width={24} height={500} fill="url(#ironbow)" stroke="#FFFFFF" strokeWidth={2} />
          <rect x={330} y={160 + ((c.frame * 9) % 760)} width={1260} height={6} fill="#FFFFFF" opacity={0.12} />
          {c.v === 'beam' &&
            Array.from({length: 8}, (_, i) => {
              const u = ((c.frame * 0.012 + i / 8) % 1);
              return <circle key={i} cx={(1060 + u * 640 - 960) * z + 960} cy={(470 - u * 430 - 540) * z + 540} r={10} fill="#FFF3B0" opacity={0.8 * clamp((c.t - 0.8) / 1)} />;
            })}
          <text x={380} y={220} fill="#FFFFFF" fontFamily={fonts.mono} fontSize={30}>
            ◉ REC
          </text>
          <text x={1380} y={220} fill="#FFFFFF" fontFamily={fonts.mono} fontSize={30}>
            {c.v === 'beam' ? '×12' : '×4'}
          </text>
        </g>
        <circle cx={1560} cy={1000} r={0} />
        </g>
        <Vignette amount={0.5} />
      </svg>
    </AbsoluteFill>
  );
};

/** Title card: the lattice Sun and the episode title. */
export const TitleScene: React.FC = () => {
  const c = useSetCtx();
  const a = clamp(c.t / 0.8);
  const s = interpolate(c.t, [0, c.dur], [1.06, 1], {easing: ease});
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
        <Stars frame={c.frame} count={500} w={W} h={H} seed={88} maxR={2} />
        <g transform={`translate(960,470) scale(${s}) translate(-960,-470)`}>
          <circle cx={960} cy={420} r={330} fill="none" stroke="#FF7A2A" strokeWidth={26} opacity={0.12} filter="blur(14px)" />
          <Shell cx={960} cy={420} r={300} close={1} spin={c.frame * 0.004} seam={0.55} frame={c.frame} />
          <text x={960} y={860} textAnchor="middle" fontFamily={fonts.display} fontWeight={900} fontSize={120} fill="#F4EFE6" letterSpacing={8} opacity={a}>
            THE SUN WENT OUT
          </text>
        </g>
        <Vignette amount={0.6} />
      </svg>
    </AbsoluteFill>
  );
};

/** End card: the shell turning; "PART 2 · THE REPLY". */
export const EndScene: React.FC = () => {
  const c = useSetCtx();
  const a = clamp((c.t - c.at('l1', 3)) / 0.6);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
        <Stars frame={c.frame} count={500} w={W} h={H} seed={89} maxR={2} />
        <Shell cx={960} cy={480} r={260} close={1} spin={c.frame * 0.006} seam={0.4 + 0.3 * Math.abs(Math.sin(c.frame * 0.15))} frame={c.frame} />
        {/* the pulses, one, two, three */}
        {Array.from({length: 3}, (_, i) => {
          const rr = 280 + ((c.frame * 4 + i * 160) % 480);
          return <circle key={i} cx={960} cy={480} r={rr} fill="none" stroke="#7FE8FF" strokeWidth={4} opacity={0.35 * (1 - (rr - 280) / 480)} />;
        })}
        <text x={960} y={900} textAnchor="middle" fontFamily={fonts.display} fontWeight={900} fontSize={84} fill="#F4EFE6" letterSpacing={6} opacity={a}>
          PART 2 · THE REPLY
        </text>
        <Vignette amount={0.6} />
      </svg>
    </AbsoluteFill>
  );
};

export {Grade};
