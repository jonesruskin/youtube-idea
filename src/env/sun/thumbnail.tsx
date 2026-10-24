import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Toon} from '../../characters/toon/Toon';
import {CAST} from '../../characters/toon/design';
import {FACES} from '../../characters/toon/face';
import {POSES} from '../../characters/toon/poses';
import {Snow} from '../../fx/cinema/atmos';
import {Stars} from '../../fx/sky';
import {fonts} from '../../theme';
import {PhotoGlobe} from '../../fx/PhotoGlobe';
import {doorScreen, Shell, Sun} from './space';
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
        <Shell cx={1330} cy={400} r={345} turn={1} spin={0.6} seam={0.95} frame={10} door={0.9} inner={<Sun cx={1330} cy={400} r={172} frame={10} />} />
        {(() => {
          const [dx, dy] = doorScreen(1330, 400, 345, 0.6, 0.22);
          return (
            <g style={{mixBlendMode: 'screen'}}>
              {Array.from({length: 7}, (_, i) => (
                <path key={i} d={`M${dx},${dy} L${dx - 1400 + i * 120},${dy + 900}`} stroke="#FFF1C2" strokeWidth={10 + (i % 3) * 8} opacity={0.22} />
              ))}
            </g>
          );
        })()}
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

const BigWords: React.FC<{words: {t: string; size: number; col: string}[]; x: number; y: number; anchor?: 'start' | 'end'; tilt?: number}> = ({words, x, y, anchor = 'start', tilt = -3}) => (
  <g transform={`rotate(${tilt},${x},${y})`}>
    {words.reduce<{el: React.ReactNode[]; yy: number}>(
      (acc, w, i) => {
        const yy = acc.yy + w.size * 0.92;
        acc.el.push(
          <g key={i}>
            <text x={x} y={yy} textAnchor={anchor} fontFamily={fonts.display} fontWeight={900} fontSize={w.size} fill="#000" opacity={0.6} transform="translate(10,12)">
              {w.t}
            </text>
            <text x={x} y={yy} textAnchor={anchor} fontFamily={fonts.display} fontWeight={900} fontSize={w.size} fill={w.col} stroke="#0B1026" strokeWidth={w.size * 0.07} paintOrder="stroke">
              {w.t}
            </text>
          </g>,
        );
        return {el: acc.el, yy};
      },
      {el: [], yy: y},
    ).el}
  </g>
);

/** Thumbnail B: Mira's face in the gold of the one-second Sun. "1 SECOND". */
export const SunThumbnailB: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <defs>
        <linearGradient id="goldsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE3A0" />
          <stop offset="0.45" stopColor="#FFB13B" />
          <stop offset="1" stopColor="#5A2A10" />
        </linearGradient>
        <radialGradient id="facelight" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFE9B0" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FFB13B" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1920} height={1080} fill="url(#goldsky)" />
      <circle cx={1660} cy={150} r={260} fill="#FFFBE8" opacity={0.45} filter="blur(30px)" />
      <circle cx={1660} cy={150} r={95} fill="#FFFDF4" />
      {Array.from({length: 12}, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <path key={i} d={`M${1660 + Math.cos(a) * 120},${150 + Math.sin(a) * 120} L${1660 + Math.cos(a) * 1600},${150 + Math.sin(a) * 1600}`} stroke="#FFF6D0" strokeWidth={30} opacity={0.12} />;
      })}
      <FrozenSkyline base={1000} seed={31} col="#7A4A22" />
      <Toon d={CAST.mira} s={state(700, 1370, 6.4, 'awe', {turn: 0.3, look: [0.8, -1], outfit: 'cold', pose: POSES.stand})} />
      <ellipse cx={720} cy={520} rx={420} ry={360} fill="url(#facelight)" style={{mixBlendMode: 'screen'}} />
      <BigWords words={[{t: '1', size: 360, col: '#FFFFFF'}, {t: 'SECOND', size: 170, col: '#FFFFFF'}]} x={1860} y={300} anchor="end" tilt={-4} />
    </svg>
  </AbsoluteFill>
);

/** Thumbnail C: the night side of Earth, the caged Sun beyond it, the last light on its way. "8:20". */
export const SunThumbnailC: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{position: 'absolute'}}>
      <Stars frame={0} count={420} w={1920} h={1080} seed={9} maxR={2.4} />
      <circle cx={1500} cy={300} r={260} fill="#FF7A2A" opacity={0.16} filter="blur(28px)" />
      <Shell cx={1500} cy={300} r={170} turn={1} spin={0.5} seam={0.9} frame={10} />
      {/* the last light: a bright wavefront between them, darkness behind it */}
      <path d="M1320,1080 Q1060,560 1400,-20" stroke="#FFF1C2" strokeWidth={14} fill="none" opacity={0.85} />
      <path d="M1320,1080 Q1060,560 1400,-20" stroke="#FFB13B" strokeWidth={70} fill="none" opacity={0.18} />
    </svg>
    <div style={{position: 'absolute', left: -180, top: 330, filter: 'drop-shadow(0 0 40px rgba(111,184,255,0.5))'}}>
      <PhotoGlobe size={1000} center={[10, 42]} sun={null} lights={1} ice={80} nightLift={0.6} />
    </div>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{position: 'absolute'}}>
      <BigWords words={[{t: '8:20', size: 330, col: '#FFD27A'}]} x={1880} y={560} anchor="end" tilt={-3} />
    </svg>
  </AbsoluteFill>
);
