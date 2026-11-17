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
import {FrozenSkyline} from './sets/outdoor';

/**
 * File 001 thumbnails: spoiler-free, one impossible image and two or three words, readable at phone size.
 * Nothing about what is around the Sun, who is behind it, or how it ends: only the premise.
 *  A "IT'S 7 AM.": a kitchen at breakfast, the window full of stars, the clock at seven, a girl holding up her sun drawing
 *  B "NO SUN. DAY 1": Earth from orbit, the whole planet on its night side, only city lights left
 *  C "365 DAYS IN THE DARK": a family on a frozen street at night, one torch beam, breath in the air
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

/** A: "IT'S 7 AM." Breakfast, and a night sky in the window. */
export const SunThumbnail: React.FC<{text?: string}> = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      {/* the kitchen wall, lamp-lit */}
      <rect width={1920} height={1080} fill="#E9D6B4" />
      {Array.from({length: 24}, (_, i) => <rect key={i} x={i * 84} y={0} width={42} height={1080} fill="#E2CBA4" opacity={0.6} />)}
      <defs>
        <clipPath id="thWin">
          <rect x={120} y={90} width={900} height={640} />
        </clipPath>
        <radialGradient id="thLamp" cx="0.5" cy="0" r="0.8">
          <stop offset="0" stopColor="#FFE9B8" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FFE9B8" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1920} height={1080} fill="url(#thLamp)" />
      {/* the window: night over the city, full of stars, at breakfast time */}
      <g clipPath="url(#thWin)">
        <rect x={120} y={90} width={900} height={640} fill="#03061A" />
        <g transform="translate(120,90)">
          <Stars frame={0} count={240} w={900} h={460} seed={9} maxR={3.2} />
        </g>
        <g transform="translate(120,330) scale(0.47)">
          <FrozenSkyline base={860} seed={23} col="#141C3E" />
        </g>
      </g>
      <rect x={120} y={90} width={900} height={640} fill="none" stroke="#F4EFE6" strokeWidth={30} />
      <path d="M570,90 L570,730 M120,410 L1020,410" stroke="#F4EFE6" strokeWidth={20} />
      <rect x={90} y={730} width={960} height={34} fill="#C98E5E" stroke="#0B1026" strokeWidth={5} />
      {/* the wall clock: seven o'clock */}
      <g transform="translate(1640,820)">
        <circle r={140} fill="#FFFBF2" stroke="#0B1026" strokeWidth={12} />
        {Array.from({length: 12}, (_, i) => <path key={i} d="M0,-114 L0,-95" stroke="#0B1026" strokeWidth={8} transform={`rotate(${i * 30})`} />)}
        <path d="M0,0 L0,-98" stroke="#0B1026" strokeWidth={10} strokeLinecap="round" />
        <path d="M0,0 L-48,28" stroke="#0B1026" strokeWidth={16} strokeLinecap="round" />
        <circle r={12} fill="#D9443A" />
      </g>
      {/* Kai with his mug, and Mira holding up her drawing of the Sun against the night */}
      <Toon d={CAST.you} s={state(930, 1370, 2.9, 'uneasy', {outfit: 'home', turn: -0.25, look: [-0.7, -0.4], holdL: 'mug', pose: POSES.hold, rim: false})} />
      <Toon d={CAST.mira} s={state(470, 1180, 3.1, 'awe', {outfit: 'home', turn: -0.3, look: [-0.5, -0.6], hold: 'sunDrawing', pose: POSES.cheer, rim: false})} />
      <BigWords words={[{t: "IT'S", size: 180, col: '#FFFFFF'}, {t: '7 AM.', size: 250, col: '#FFC93C'}]} x={1890} y={120} anchor="end" tilt={-3} />
    </svg>
  </AbsoluteFill>
);

/** B: "NO SUN. DAY 1": the whole Earth on its night side. */
export const SunThumbnailB: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{position: 'absolute'}}>
      <Stars frame={0} count={700} w={1920} h={1080} seed={17} maxR={2.4} />
    </svg>
    <div style={{position: 'absolute', left: '50%', top: '9%', width: '45%', filter: 'drop-shadow(0 0 30px rgba(80,120,220,0.5))'}}>
      <PhotoGlobe size={580} center={[10, 35]} sun={null} lights={1} ice={78} />
    </div>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{position: 'absolute'}}>
      <BigWords words={[{t: 'NO SUN.', size: 200, col: '#FFFFFF'}, {t: 'DAY 1', size: 260, col: '#FFC93C'}]} x={70} y={260} anchor="start" tilt={-3} />
    </svg>
  </AbsoluteFill>
);

/** C: "365 DAYS IN THE DARK": a family on a frozen street at night. */
export const SunThumbnailC: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <defs>
        <linearGradient id="thC" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#02030A" />
          <stop offset="0.75" stopColor="#101A3E" />
          <stop offset="1" stopColor="#24305A" />
        </linearGradient>
      </defs>
      <rect width={1920} height={1080} fill="url(#thC)" />
      <Stars frame={0} count={420} w={1920} h={700} seed={29} maxR={2.6} />
      <FrozenSkyline base={860} seed={47} col="#141B36" />
      <rect x={0} y={840} width={1920} height={240} fill="#D6E2F0" />
      <rect x={0} y={840} width={1920} height={240} fill="#2A3A6A" opacity={0.28} />
      <Snow frame={40} density={0.45} w={1920} h={1080} x0={0} y0={0} />
      {/* the torch beam cutting across the snow */}
      <path d="M1180,760 L1920,560 L1920,980 Z" fill="#FFF4D6" opacity={0.16} />
      <Toon d={CAST.ito} s={state(560, 1180, 1.9, 'focused', {turn: 0.2, look: [0.6, -0.5], hold: 'torchOff', breath: 0.8})} />
      <Toon d={CAST.mira} s={state(800, 1160, 1.9, 'uneasy', {turn: 0.2, look: [0.5, -0.8], breath: 0.8})} />
      <Toon d={CAST.you} s={state(1020, 1180, 1.9, 'worried', {turn: 0.3, look: [0.8, -0.2], hold: 'torch', pose: POSES.torch, hoodUp: true, breath: 0.8})} />
      <BigWords words={[{t: '365 DAYS', size: 210, col: '#FFFFFF'}, {t: 'IN THE DARK', size: 150, col: '#FFC93C'}]} x={60} y={60} anchor="start" tilt={-2} />
    </svg>
  </AbsoluteFill>
);
