import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Actors, type Act, type CastEntry} from './characters/toon/acting';
import {ShotProvider} from './engine/shot-context';
import {PhotoGlobe} from './fx/PhotoGlobe';
import type {TimedShot} from './engine/timeline';

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
