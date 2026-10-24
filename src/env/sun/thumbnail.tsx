import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Toon} from '../../characters/toon/Toon';
import {CAST} from '../../characters/toon/design';
import {FACES} from '../../characters/toon/face';
import {POSES} from '../../characters/toon/poses';
import {Snow} from '../../fx/cinema/atmos';
import {Stars} from '../../fx/sky';
import {fonts} from '../../theme';
import {Shell, Sun} from './space';
import {FrozenSkyline} from './sets/outdoor';

/**
 * File 001 thumbnail: one impossible image + three words, readable at phone size.
 * The Sun caged in dark plates (one plate cracked open, light spilling), a frozen city,
 * you and Mira looking up in fear. Text: WHO BUILT THIS?
 */
const state = (x: number, y: number, scale: number, face: keyof typeof FACES, extra: Partial<React.ComponentProps<typeof Toon>['s']> = {}) => ({
  x,
  y,
  scale,
  facing: 'front' as const,
  pose: POSES.stand,
  bob: 0,
  face: FACES[face],
  turn: 0.25,
  look: [0.5, -1] as [number, number],
  talk: 0,
  blink: 0,
  outfit: 'cold' as const,
  hoodUp: false,
  breath: 0,
  frame: 10,
  rim: true,
  opacity: 1,
  watchGlow: 0,
  ...extra,
});

export const SunThumbnail: React.FC<{text: string}> = ({text}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <defs>
        <linearGradient id="thsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#02030A" />
          <stop offset="0.7" stopColor="#0E1838" />
          <stop offset="1" stopColor="#3A2A40" />
        </linearGradient>
      </defs>
      <rect width={1920} height={1080} fill="url(#thsky)" />
      <Stars frame={0} count={320} w={1920} h={1080} seed={5} maxR={2.4} />
      {/* the caged Sun: light leaking through one open plate */}
      <g>
        <circle cx={1330} cy={400} r={470} fill="#FF7A2A" opacity={0.18} filter="blur(30px)" />
        <Sun cx={1330} cy={400} r={330} frame={10} />
        <Shell cx={1330} cy={400} r={345} close={1} spin={0.6} seam={0.95} frame={10} open={0.9} />
        <g style={{mixBlendMode: 'screen'}}>
          {Array.from({length: 7}, (_, i) => (
            <path key={i} d={`M1395,260 L${1395 - 1400 + i * 120},${260 + 900}`} stroke="#FFF1C2" strokeWidth={10 + (i % 3) * 8} opacity={0.22} />
          ))}
        </g>
      </g>
      <FrozenSkyline base={920} seed={47} col="#141B36" />
      <rect x={0} y={900} width={1920} height={200} fill="#C9D6E8" />
      <rect x={0} y={900} width={1920} height={200} fill="#2A3A6A" opacity={0.3} />
      <Snow frame={40} density={0.4} w={1920} h={1080} x0={0} y0={0} />
      {/* you and Mira, looking up */}
      <Toon d={CAST.you} s={state(600, 1300, 2.4, 'scared', {pose: POSES.handsOnHead})} />
      <Toon d={CAST.mira} s={state(960, 1200, 2.4, 'awe', {turn: 0.35, pose: POSES.coverMouth})} />
      {/* the words */}
      <g transform="rotate(-3,560,180)">
        {text.split(' ').map((w, i) => (
          <g key={i}>
            <text x={70} y={190 + i * 190} fontFamily={fonts.display} fontWeight={900} fontSize={180} fill="#000" opacity={0.65} transform="translate(10,12)">
              {w}
            </text>
            <text x={70} y={190 + i * 190} fontFamily={fonts.display} fontWeight={900} fontSize={180} fill={i === text.split(' ').length - 1 ? '#FF8A2A' : '#FFFFFF'} stroke="#0B1026" strokeWidth={12} paintOrder="stroke">
              {w}
            </text>
          </g>
        ))}
      </g>
    </svg>
  </AbsoluteFill>
);
