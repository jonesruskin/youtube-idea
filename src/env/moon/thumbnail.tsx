import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Toon} from '../../characters/toon/Toon';
import {CAST} from '../../characters/toon/design';
import {FACES} from '../../characters/toon/face';
import {POSES} from '../../characters/toon/poses';
import {fonts} from '../../theme';
import {rnd} from '../sea/parts';
import {Boat, Flood, House, Lamp, MoonDisc, SkyBox} from './parts';

/**
 * File 002 (moon02) thumbnails. Spoiler rule (docs/00 P-packaging): nothing about the tide log, Nana's secret, the dark
 * body, the Roche limit or the rings. Each sells the impossible image only, and reads at 320×180.
 */
const st = (x: number, y: number, scale: number, face: keyof typeof FACES, extra: Record<string, unknown> = {}) =>
  ({x, y, scale, facing: 'front', pose: POSES.stand, bob: 0, face: FACES[face], turn: 0.2, look: [0.3, -0.5], talk: 0, blink: 0, outfit: 'home', hoodUp: false, breath: 0, frame: 10, rim: true, opacity: 1, watchGlow: 0, ...extra}) as any;

const Words: React.FC<{lines: {t: string; size: number; col: string}[]; x: number; y: number; anchor?: 'start' | 'end'}> = ({lines, x, y, anchor = 'start'}) => (
  <g transform={`rotate(-3,${x},${y})`}>
    {lines.map((w, i) => {
      const yy = y + lines.slice(0, i + 1).reduce((a, l) => a + l.size * 0.95, 0);
      return (
        <g key={i}>
          <text x={x + 10} y={yy + 12} textAnchor={anchor} fontFamily={fonts.display} fontWeight={900} fontSize={w.size} fill="#000" opacity={0.6}>
            {w.t}
          </text>
          <text x={x} y={yy} textAnchor={anchor} fontFamily={fonts.display} fontWeight={900} fontSize={w.size} fill={w.col} stroke="#0B1026" strokeWidth={w.size * 0.07} paintOrder="stroke">
            {w.t}
          </text>
        </g>
      );
    })}
  </g>
);

const Stars: React.FC<{n?: number; seed?: number; h?: number}> = ({n = 260, seed = 4, h = 1080}) => {
  const r = rnd(seed);
  return (
    <g>
      {Array.from({length: n}, (_, i) => (
        <circle key={i} cx={r() * 1920} cy={r() * h} r={0.8 + r() * 1.8} fill="#FFFFFF" opacity={0.4 + r() * 0.5} />
      ))}
    </g>
  );
};

/** A: "DAY 1": a Moon four times too big over the harbour street, the sea in the street, Wren wading and looking up at it. */
export const MoonThumbnail: React.FC<{text?: string}> = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <SkyBox tod="night" frame={10} moonlit={0.6} />
      <MoonDisc x={1000} y={330} k={3.9} base={70} tod="night" />
      <g transform="translate(0,790) scale(0.27)">
        {Array.from({length: 13}, (_, i) => i).map((i) => (
          <House key={i} x={-200 + i * 560} y={0} w={540} i={i + 1} lit={i % 4 === 1} />
        ))}
        <Lamp x={4100} y={0} on />
      </g>
      <Flood y={745} tod="night" frame={10} opacity={0.85} />
      <Boat x={480} y={752} s={0.55} bob={0} />
      <Toon d={CAST.wren} s={st(1500, 1050, 2.1, 'awe', {facing: 'left', look: [-0.6, -0.9], turn: 0.6})} />
      {/* the water she is standing in, over her boots */}
      <Flood y={1015} tod="night" frame={30} opacity={0.8} />
      <Words lines={[{t: 'DAY 1', size: 250, col: '#FFFFFF'}]} x={70} y={40} />
    </svg>
  </AbsoluteFill>
);
/** B: "TOO CLOSE": the Earth from space, its oceans pulled into a bulge, and a Moon far too big beside it. */
export const MoonThumbnailB: React.FC = () => {
  const r = 330;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%">
        <rect width={1920} height={1080} fill="#03050F" />
        <Stars seed={9} />
        <g transform="translate(560,600)">
          <ellipse rx={r * 1.16} ry={r * 0.97} fill="#8FD0F4" opacity={0.55} stroke="#DDF2FF" strokeWidth={4} strokeDasharray="18 12" transform="rotate(-20)" />
          <circle r={r} fill="#2E6FA8" stroke="#0B1026" strokeWidth={6} />
          <path d={`M${-r * 0.5},${-r * 0.5} q${r * 0.3},${-r * 0.2} ${r * 0.5},${r * 0.05} q${r * 0.1},${r * 0.3} ${-r * 0.2},${r * 0.45} q${-r * 0.3},${r * 0.05} ${-r * 0.3},${-r * 0.5} Z`} fill="#5FA868" />
          <path d={`M${r * 0.15},${r * 0.2} q${r * 0.3},${-r * 0.1} ${r * 0.4},${r * 0.2} q${-r * 0.1},${r * 0.3} ${-r * 0.35},${r * 0.2} Z`} fill="#5FA868" />
          <ellipse cx={-r * 0.2} cy={-r * 0.75} rx={r * 0.5} ry={r * 0.14} fill="#FFFFFF" opacity={0.6} />
        </g>
        <MoonDisc x={1440} y={420} k={4.2} base={70} tod="night" />
        <Words lines={[{t: 'TOO', size: 200, col: '#FFFFFF'}, {t: 'CLOSE', size: 200, col: '#FFD27A'}]} x={1850} y={600} anchor="end" />
      </svg>
    </AbsoluteFill>
  );
};

/** C: "IT'S STILL COMING": a girl on the harbour wall, the Moon filling half the sky, its road of light on the sea. */
export const MoonThumbnailC: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <rect width={1920} height={1080} fill="#050A1E" />
      <Stars seed={17} h={600} n={160} />
      <MoonDisc x={1180} y={420} k={6.2} base={70} tod="night" />
      <rect y={760} width={1920} height={320} fill="#0E1F4C" />
      {Array.from({length: 16}, (_, i) => (
        <rect key={i} x={1180 - 30 - i * 12} y={770 + i * 18} width={60 + i * 24} height={6} rx={3} fill="#FFF6C8" opacity={0.85 - i * 0.04} />
      ))}
      <rect x={0} y={900} width={900} height={180} fill="#5A5F6E" stroke="#0B1026" strokeWidth={5} />
      {Array.from({length: 9}, (_, i) => (
        <line key={i} x1={i * 100} y1={900} x2={i * 100} y2={1080} stroke="#0B1026" strokeWidth={3} opacity={0.5} />
      ))}
      <Toon d={CAST.wren} s={st(520, 905, 1.7, 'worried', {facing: 'right', look: [0.7, -0.7], turn: 0.7})} />
      <Words lines={[{t: "IT'S STILL", size: 150, col: '#FFFFFF'}, {t: 'COMING', size: 190, col: '#FFD27A'}]} x={60} y={30} />
    </svg>
  </AbsoluteFill>
);
