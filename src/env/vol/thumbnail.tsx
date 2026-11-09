import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Toon} from '../../characters/toon/Toon';
import {CAST} from '../../characters/toon/design';
import {FACES} from '../../characters/toon/face';
import {POSES} from '../../characters/toon/poses';
import {Stars} from '../../fx/sky';
import {fonts} from '../../theme';

/** File 002 (vol02) thumbnails: spoiler-free (no street, no house, no clue names), readable at 320×180. */
const st = (x: number, y: number, scale: number, face: keyof typeof FACES, extra: Record<string, unknown> = {}) =>
  ({x, y, scale, facing: 'front', pose: POSES.stand, bob: 0, face: FACES[face], turn: 0.2, look: [0.3, 0.4], talk: 0, blink: 0, outfit: 'cold', hoodUp: false, breath: 0, frame: 10, rim: true, opacity: 1, watchGlow: 0, ...extra}) as any;
const Words: React.FC<{lines: {t: string; size: number; col: string}[]; x: number; y: number}> = ({lines, x, y}) => (
  <g transform={`rotate(-3,${x},${y})`}>
    {lines.map((w, i) => {
      const yy = y + lines.slice(0, i + 1).reduce((a, l) => a + l.size * 0.95, 0);
      return (
        <g key={i}>
          <text x={x + 10} y={yy + 12} fontFamily={fonts.display} fontWeight={900} fontSize={w.size} fill="#000" opacity={0.6}>
            {w.t}
          </text>
          <text x={x} y={yy} fontFamily={fonts.display} fontWeight={900} fontSize={w.size} fill={w.col} stroke="#0B1026" strokeWidth={w.size * 0.07} paintOrder="stroke">
            {w.t}
          </text>
        </g>
      );
    })}
  </g>
);
const Houses: React.FC<{y: number; lit?: boolean}> = ({y, lit}) => (
  <g>
    {Array.from({length: 14}, (_, i) => (
      <g key={i} transform={`translate(${i * 150 - 40},${y})`}>
        <rect x={0} y={-110} width={130} height={110} fill={['#E9C46A', '#9FC8A8', '#E07A5F', '#BFD8E8'][i % 4]} stroke="#0B1026" strokeWidth={4} />
        <path d="M-10,-110 L65,-170 L140,-110 Z" fill="#8A3A3A" stroke="#0B1026" strokeWidth={4} />
        <rect x={20} y={-80} width={34} height={34} fill={lit ? '#FFD27A' : '#2A3550'} />
      </g>
    ))}
  </g>
);

/** A: "IT'S UNDER US": a cut-away: houses on top, a glowing finger of magma rising under them. */
export const VolThumbnail: React.FC<{text?: string}> = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <rect width={1920} height={420} fill="#9FD0F0" />
      <rect y={420} width={1920} height={660} fill="#5A4636" />
      <Houses y={430} />
      <path d="M1240,1080 Q1300,760 1330,560 Q1360,760 1420,1080 Z" fill="#FF6A2A" />
      <path d="M1300,1080 Q1320,820 1330,600 Q1340,820 1360,1080 Z" fill="#FFD27A" />
      {Array.from({length: 14}, (_, i) => (
        <circle key={i} cx={1330 + Math.cos(i * 1.7) * (40 + (i % 4) * 30)} cy={600 + Math.sin(i * 2.3) * 60} r={7} fill="#FFFFFF" />
      ))}
      <Words lines={[{t: "IT'S", size: 170, col: '#FFFFFF'}, {t: 'UNDER US', size: 170, col: '#FFD27A'}]} x={60} y={440} />
    </svg>
  </AbsoluteFill>
);
/** B: "4 DAYS": a girl with a notebook, worried, a red countdown. */
export const VolThumbnailB: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <rect width={1920} height={1080} fill="#2E6B3A" />
      <circle cx={1300} cy={500} r={700} fill="#CFE6E0" opacity={0.35} />
      <Toon d={CAST.ana} s={st(1320, 1200, 3.0, 'worried', {pose: POSES.hold, hold: 'list', look: [-0.4, 0.3]})} />
      <Words lines={[{t: '4 DAYS', size: 240, col: '#FFFFFF'}, {t: 'TO FIND IT', size: 110, col: '#FFD27A'}]} x={60} y={60} />
    </svg>
  </AbsoluteFill>
);
/** C: "NO ONE KNEW WHERE": a night city, a white column rising somewhere behind the houses. */
export const VolThumbnailC: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <rect width={1920} height={1080} fill="#060A1C" />
      <Stars frame={10} count={400} w={1920} h={700} seed={8} maxR={2.4} />
      {Array.from({length: 16}, (_, n) => {
        const q = n / 15;
        return <circle key={n} cx={1350 + Math.sin(n) * 20} cy={860 - q * 760} r={50 + q * 160} fill={q < 0.3 ? '#F0E4D4' : '#D4CCC4'} stroke="#0B1026" strokeWidth={3} />;
      })}
      <ellipse cx={1350} cy={880} rx={220} ry={60} fill="#FF7A2A" opacity={0.7} />
      <Houses y={1000} lit />
      <Words lines={[{t: 'NO ONE', size: 170, col: '#FFFFFF'}, {t: 'KNEW WHERE', size: 140, col: '#FF8A5A'}]} x={60} y={40} />
    </svg>
  </AbsoluteFill>
);
