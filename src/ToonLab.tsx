import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Actors, type Act, type CastEntry} from './characters/toon/acting';
import {ShotProvider} from './engine/shot-context';
import {PhotoGlobe} from './fx/PhotoGlobe';
import type {TimedShot} from './engine/timeline';
import {M} from './env/sun/stage';
import {BusShelter, Car, Lamp} from './env/sun/sets/outdoor';
import {TrainCar} from './env/sun/sets/metro';
import {Shelf} from './env/sun/sets/market';
import {SchoolBus} from './env/sun/inserts';
import {Tent} from './env/sun01/parts';

/** Rig test bench: model sheet, walk/run cycles, gesture and expression ranges. Not part of any episode. */
const SCENES: Record<string, {cast: CastEntry[]; acts: Act[]; bg: string}> = {
  lineup: {
    bg: '#2A3348',
    cast: [
      {who: 'you', x: 260, y: 900, depth: 1.6},
      {who: 'mira', x: 520, y: 900, depth: 1.6, expr: 'smile'},
      {who: 'ito', x: 760, y: 900, depth: 1.6, hold: 'cane'},
      {who: 'biscuit', x: 1000, y: 900, depth: 1.6},
      ...Array.from({length: 8}, (_, i) => ({who: `extra:${i + 1}` as const, x: 1180 + i * 92, y: 900, depth: 1.0})),
      {who: 'you', x: 260, y: 400, depth: 1.6, outfit: 'cold'},
      {who: 'mira', x: 520, y: 400, depth: 1.6, outfit: 'cold'},
      {who: 'ito', x: 760, y: 400, depth: 1.6, outfit: 'cold'},
      {who: 'you', x: 1000, y: 400, depth: 1.6, outfit: 'cold', hoodUp: true, breath: true, expr: 'cold'},
      ...Array.from({length: 8}, (_, i) => ({who: `extra:${i + 9}` as const, x: 1180 + i * 92, y: 400, depth: 1.0, outfit: 'cold' as const})),
    ],
    acts: [],
  },
  faces: {
    bg: '#2A3348',
    cast: (['neutral', 'smile', 'laugh', 'worried', 'scared', 'surprised', 'sad', 'awe', 'relieved', 'focused', 'determined', 'cold'] as const).map((expr, i) => ({
      who: 'you' as const,
      x: 200 + (i % 6) * 300,
      y: i < 6 ? 560 : 1080,
      depth: 1.55,
      expr,
    })),
    acts: [],
  },
  walk: {
    bg: '#3A4A5E',
    cast: [
      {who: 'you', x: 150, y: 420, depth: 1.2},
      {who: 'mira', x: 150, y: 680, depth: 1.2},
      {who: 'ito', x: 150, y: 960, depth: 1.2, hold: 'cane'},
      {who: 'biscuit', x: 1700, y: 960, depth: 1.2},
    ],
    acts: [
      {at: 0.2, who: 'you', to: 1750, dur: 4},
      {at: 0.2, who: 'mira', to: 1750, gait: 'run', dur: 2.6},
      {at: 0.2, who: 'ito', to: 1200, dur: 5},
      {at: 0.2, who: 'biscuit', to: 300, gait: 'run', dur: 2.4},
    ],
  },
  walkbig: {
    bg: '#3A4A5E',
    cast: [
      {who: 'you', x: 200, y: 1000, depth: 2.6},
      {who: 'mira', x: 100, y: 1000, depth: 2.6},
    ],
    acts: [
      {at: 0, who: 'you', to: 1900, dur: 6},
      {at: 0, who: 'mira', to: 1900, gait: 'run', dur: 3.6},
    ],
  },
  beards: {
    bg: '#2A3348',
    cast: (['extra:51', 'extra:54', 'extra:16', 'extra:5', 'extra:63', 'extra:19'] as const).flatMap((who, i) =>
      (['neutral', 'laugh', 'scared'] as const).map((expr, j) => ({who, x: 170 + i * 315, y: 330 + j * 360, depth: 1.05, expr, outfit: 'home' as const})),
    ),
    acts: [],
  },
  hood: {
    bg: '#2A3348',
    cast: [
      {who: 'you', x: 260, y: 560, depth: 1.5, outfit: 'cold', hoodUp: true},
      {who: 'you', x: 700, y: 560, depth: 1.5, outfit: 'cold', hoodUp: true, facing: 'right'},
      {who: 'you', x: 1120, y: 560, depth: 1.5, outfit: 'cold', hoodUp: true, facing: 'back'},
      {who: 'you', x: 1560, y: 560, depth: 1.5, outfit: 'cold', hoodUp: false},
      {who: 'you', x: 520, y: 1500, depth: 3.4, outfit: 'cold', hoodUp: true, expr: 'scared', breath: true},
      {who: 'you', x: 1420, y: 1500, depth: 3.4, outfit: 'cold', hoodUp: true, expr: 'smile', facing: 'right'},
    ],
    acts: [],
  },
  gestures: {
    bg: '#33405A',
    cast: [
      {who: 'you', x: 500, y: 950, depth: 2.2, facing: 'right'},
      {who: 'mira', x: 1300, y: 950, depth: 2.2, facing: 'left'},
    ],
    acts: [
      {at: 0.0, who: 'you', pose: 'point', expr: 'surprised'},
      {at: 1.0, who: 'you', pose: 'wave', loop: 'wave', expr: 'smile'},
      {at: 2.0, who: 'you', pose: 'handsOnHead', expr: 'scared', facing: 'front'},
      {at: 3.0, who: 'you', pose: 'shrug', expr: 'worried'},
      {at: 4.0, who: 'you', pose: 'hold', hold: 'torch', expr: 'focused'},
      {at: 5.0, who: 'you', pose: 'kneel', hold: null, expr: 'sad'},
      {at: 0.0, who: 'mira', pose: 'cheer', expr: 'laugh'},
      {at: 1.0, who: 'mira', pose: 'cheer', expr: 'laugh', facing: 'front'},
      {at: 2.0, who: 'mira', pose: 'coverMouth', expr: 'surprised'},
      {at: 3.0, who: 'mira', pose: 'lookUp', expr: 'awe'},
      {at: 4.0, who: 'mira', pose: 'shiver', loop: 'shiver', expr: 'cold'},
      {at: 5.0, who: 'mira', pose: 'sitHug', expr: 'sad'},
    ],
  },
};

export const ToonLab: React.FC<{scene: string}> = ({scene}) => {
  const sc = SCENES[scene] ?? SCENES.lineup;
  const shot = {id: 'lab', scene: 'lab', index: 0, start: 0, end: 10, duration: 10, timedLines: [], lines: []} as unknown as TimedShot;
  return (
    <ShotProvider shot={shot} fps={30}>
      <AbsoluteFill style={{background: sc.bg}}>
        <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
          {[420, 680, 900, 950, 960, 400, 560, 1080].map((y) => (
            <line key={y} x1={0} x2={1920} y1={y} y2={y} stroke="#ffffff14" strokeWidth={2} />
          ))}
          <Actors cast={sc.cast} acts={sc.acts} />
        </svg>
      </AbsoluteFill>
    </ShotProvider>
  );
};

export const EarthLab: React.FC<{v: number}> = ({v}) => {
  const variants = [
    {center: [10, 40] as [number, number], sun: [-20, 20] as [number, number] | null, lights: 1, ice: 90},
    {center: [10, 40] as [number, number], sun: null, lights: 1, ice: 75},
    {center: [80, 25] as [number, number], sun: null, lights: 0.3, ice: 55},
    {center: [-40, 30] as [number, number], sun: null, lights: 0.05, ice: 35},
  ];
  return (
    <AbsoluteFill style={{background: '#02030A', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around'}}>
      {variants.map((p, i) => (
        <PhotoGlobe key={i} size={440} {...p} />
      ))}
    </AbsoluteFill>
  );
};

/**
 * Scale check: the cast beside every prop they share a frame with, all on one plane (depth 0.6 → 1 m = M(1, 0.6)),
 * over a 1 m grid. Every prop should sit within ±10% of its real height relative to the 1.75 m hero.
 */
export const ScaleLab: React.FC = () => {
  const D = 0.6;
  const m = M(1, D);
  const shot = {id: 'lab', scene: 'lab', index: 0, start: 0, end: 10, duration: 10, timedLines: [], lines: []} as unknown as TimedShot;
  const rows = [500, 1040];
  const cast = (x: number, y: number): CastEntry[] => [
    {who: 'you', x, y, depth: D},
    {who: 'mira', x: x + 70, y, depth: D},
    {who: 'ito', x: x + 140, y, depth: D, hold: 'cane'},
    {who: 'biscuit', x: x + 210, y, depth: D},
  ];
  const label = (x: number, y: number, t: string) => (
    <text x={x} y={y + 30} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontSize={18} fill="#C9D3E6">
      {t}
    </text>
  );
  return (
    <ShotProvider shot={shot} fps={30}>
      <AbsoluteFill style={{background: '#2A3348'}}>
        <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
          {rows.map((y) =>
            Array.from({length: 5}, (_, k) => <line key={`${y}-${k}`} x1={0} x2={1920} y1={y - k * m} y2={y - k * m} stroke={k ? '#ffffff22' : '#ffffff66'} strokeWidth={2} />),
          )}
          {/* row 1: car 1.5 m, lamp 4.5 m, shelter 2.4 m, tent 1.3 m, shelf 1.9 m */}
          <Car x={520} base={rows[0]} sc={m} col="#C2464F" snow={0} />
          {label(520, rows[0], 'car 4.4 × 1.5 m')}
          <Lamp x={860} base={rows[0]} sc={m} on frame={0} />
          {label(890, rows[0], 'lamp 4.5 m')}
          <BusShelter x={1130} base={rows[0]} sc={m} />
          {label(1130, rows[0], 'shelter 2.4 m')}
          <Tent x={1420} y={rows[0]} s={(1.3 * m) / 120} color="#3C8D6E" lit={1} />
          {label(1420, rows[0], 'tent 1.3 m')}
          <Shelf x={1580} w={m * 2.4} base={rows[0]} sc={m} seed={3} stripped={0.3} label="RICE" col="#3C8D6E" />
          {label(1580 + m * 1.2, rows[0], 'shelf 1.9 m')}
          {/* row 2: school bus 3.2 m, metro carriage 3.0 m */}
          <SchoolBus x={1240} base={rows[1]} sc={m} />
          {label(680, rows[1], 'school bus 11 × 3.2 m')}
          <TrainCar x={1300} base={rows[1]} sc={m} len={5.6} lit={1} color="#8C9AAE" />
          {label(1590, rows[1], 'carriage 3.0 m')}
          <Actors cast={[...cast(40, rows[0]), ...cast(40, rows[1]), {who: 'you', x: 1870, y: rows[1], depth: D}]} acts={[]} />
        </svg>
      </AbsoluteFill>
    </ShotProvider>
  );
};
