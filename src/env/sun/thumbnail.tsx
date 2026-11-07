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

/** Thumbnail B: one face, two times. Left, old Mr. Ito in starlight; right, the same man at 30 in a 1982 sunrise. "HE KNEW". */
export const SunThumbnailB: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <defs>
        <clipPath id="leftHalf">
          <rect x={0} y={0} width={760} height={1080} />
        </clipPath>
        <clipPath id="rightHalf">
          <rect x={760} y={0} width={1160} height={1080} />
        </clipPath>
        <linearGradient id="dawnTh" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F2B07A" />
          <stop offset="1" stopColor="#FFE2A8" />
        </linearGradient>
      </defs>
      <g clipPath="url(#leftHalf)">
        <rect width={1920} height={1080} fill="#060A1E" />
        <Stars frame={0} count={300} w={1920} h={1080} seed={11} maxR={2.4} />
        <Toon d={CAST.ito} s={state(760, 1640, 5.59, 'sad', {turn: 0.1, look: [0.2, 0.2], outfit: 'cold'})} />
      </g>
      <g clipPath="url(#rightHalf)">
        <rect width={1920} height={1080} fill="url(#dawnTh)" />
        <circle cx={1700} cy={260} r={130} fill="#FFFBE8" />
        <Toon d={CAST.itoYoung} s={state(760, 1640, 5.2, 'smile', {turn: 0.1, look: [0.2, 0.2], outfit: 'home'})} />
      </g>
      <path d="M760,0 L760,1080" stroke="#FFF6E0" strokeWidth={8} />
      <BigWords words={[{t: 'HE', size: 230, col: '#FFFFFF'}, {t: 'KNEW', size: 230, col: '#FFB13B'}]} x={1880} y={480} anchor="end" tilt={-3} />
    </svg>
  </AbsoluteFill>
);

/** Thumbnail C: a small observatory on a mountain at night, one window lit, the dish aimed at one star. "1983". */
export const SunThumbnailC: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <rect width={1920} height={1080} fill="#050818" />
      <Stars frame={0} count={600} w={1920} h={1080} seed={41} maxR={2.6} />
      <circle cx={1500} cy={170} r={10} fill="#FFFFFF" />
      <circle cx={1500} cy={170} r={60} fill="#BFD8FF" opacity={0.25} />
      <path d="M1180,640 L1500,170" stroke="#FFD27A" strokeWidth={4} strokeDasharray="14 12" opacity={0.7} />
      <path d="M0,820 L400,640 L760,760 L1200,600 L1920,760 L1920,1080 L0,1080 Z" fill="#141A33" />
      <path d="M0,900 Q600,780 1100,830 Q1500,870 1920,820 L1920,1080 L0,1080 Z" fill="#0B0F22" />
      <g transform="translate(560,880) scale(1.6)">
        <rect x={-150} y={-160} width={300} height={160} fill="#C9CED6" stroke="#0B1026" strokeWidth={5} />
        <path d="M-160,-160 A160,160 0 0 1 160,-160 Z" fill="#DCE2EA" stroke="#0B1026" strokeWidth={5} />
        <path d="M-22,-316 L22,-316 L26,-160 L-26,-160 Z" fill="#141826" />
        <rect x={-30} y={-90} width={60} height={90} fill="#FFD58A" stroke="#0B1026" strokeWidth={4} />
      </g>
      <g transform="translate(1180,860) scale(1.6)">
        <path d="M-40,0 L0,-150 L40,0 Z" fill="#8A8F9C" stroke="#0B1026" strokeWidth={5} />
        <g transform="translate(0,-150) rotate(-55)">
          <path d="M-150,-20 Q0,90 150,-20 Q0,30 -150,-20 Z" fill="#DCE2EA" stroke="#0B1026" strokeWidth={5} />
          <path d="M0,40 L0,-110" stroke="#0B1026" strokeWidth={5} />
        </g>
      </g>
      <circle cx={560} cy={790} r={140} fill="#FFD58A" opacity={0.18} />
      <BigWords words={[{t: '1983', size: 260, col: '#FFD27A'}]} x={80} y={120} anchor="start" tilt={-3} />
    </svg>
  </AbsoluteFill>
);
