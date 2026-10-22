import React from 'react';
import {interpolate} from 'remotion';
import {Figure} from '../../characters/Figure';
import {extra, type CharacterDesign} from '../../characters/registry';
import {Camera} from '../../fx/camera';
import {C} from '../../theme';
import {Skyline, Stage} from '../common';
import {Car, PaintedClouds, Shadow, Sky} from '../kit';
import {ease01, useBeatCam, type BeatTable} from './shared';

const BEATS: BeatTable = {
  motorcade: {cam: [[1.0, 960, 560], [1.05, 1060, 560]]},
  cart: {cam: [[1.0, 960, 540], [1.06, 1000, 540]]},
  walk: {cam: [[1.1, 820, 640], [1.2, 1000, 640]]},
  block: {cam: [[1.45, 1060, 660], [1.6, 1060, 640]]},
  bubble: {cam: [[0.95, 1000, 560], [0.8, 1100, 520]]},
  back: {cam: [[1.0, 960, 540], [1.08, 960, 540]]},
};

const GROUND = 900;
const CART_X = 1720;

const guard = (seed: number): CharacterDesign =>
  extra(seed, {top: 'suit', topColor: '#1E2230', topAccent: '#141722', innerColor: '#F4F4F4', pants: '#1E2230', shoes: '#111111', tie: '#1E2230', earpiece: true, hair: seed % 2 ? 'bald' : 'shortCrop', skin: ['#E8C4A8', '#7A4A2E', '#A86E48', '#5C3521'][seed % 4], signature: '#9FB4FF', beard: false});

const OFFICE: CharacterDesign[] = [0, 1, 2, 3, 4].map((i) =>
  extra(700 + i, {skin: ['#F0CDB4', '#7A4A2E', '#D6A07A', '#5C3521', '#E8C4A8'][i], skinShade: '#00000022', top: i % 2 ? 'blouse' : 'jacket', topColor: ['#5B6C8F', '#E07A5F', '#3C8D6E', '#D9A441', '#8E6BBF'][i], topAccent: '#00000033', innerColor: '#FFFFFF', hair: (['bun', 'shortCrop', 'braids', 'slick', 'bob'] as const)[i]}),
);

const FoodCart: React.FC<{x: number; y: number; frame: number; s?: number}> = ({x, y, frame, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    {Array.from({length: 4}, (_, i) => {
      const k = ((frame * 0.02 + i / 4) % 1);
      return <ellipse key={i} cx={-20 + Math.sin(k * 6 + i) * 18} cy={-300 - k * 160} rx={26 + k * 30} ry={14 + k * 16} fill="#FFFFFF" opacity={0.5 * (1 - k)} />;
    })}
    <path d="M-170,-330 L170,-330 L120,-390 L-120,-390 Z" fill="#E35D5D" stroke={C.ink} strokeWidth={5} />
    {[-110, -40, 30, 100].map((sx) => (
      <path key={sx} d={`M${sx},-330 l20,0 l-6,-60 l-10,0 Z`} fill="#FFFFFF" opacity={0.9} />
    ))}
    <line x1={0} y1={-330} x2={0} y2={-180} stroke="#8A8A96" strokeWidth={6} />
    <rect x={-160} y={-180} width={320} height={130} rx={10} fill="#F2C14E" stroke={C.ink} strokeWidth={5} />
    <rect x={-150} y={-200} width={300} height={24} rx={4} fill="#C0C6D0" stroke={C.ink} strokeWidth={4} />
    <circle cx={-60} cy={-206} r={16} fill="#E0662E" stroke={C.ink} strokeWidth={3} />
    <circle cx={10} cy={-206} r={16} fill="#E3B26A" stroke={C.ink} strokeWidth={3} />
    <circle cx={-110} cy={-30} r={30} fill="#2A2A30" stroke={C.ink} strokeWidth={4} />
    <circle cx={110} cy={-30} r={30} fill="#2A2A30" stroke={C.ink} strokeWidth={4} />
  </g>
);

const Drone: React.FC<{x: number; y: number; frame: number}> = ({x, y, frame}) => (
  <g transform={`translate(${x},${y + Math.sin(frame * 0.12) * 6})`}>
    <rect x={-40} y={-10} width={80} height={22} rx={8} fill="#2A2E3A" stroke={C.ink} strokeWidth={4} />
    {[-1, 1].map((s) => (
      <g key={s}>
        <line x1={s * 40} y1={-4} x2={s * 70} y2={-16} stroke="#2A2E3A" strokeWidth={6} />
        <ellipse cx={s * 72} cy={-20} rx={34} ry={5} fill="#9AA2B2" opacity={0.6 + 0.3 * Math.sin(frame * 2 + s)} />
      </g>
    ))}
    <circle cx={0} cy={16} r={7} fill={frame % 20 < 10 ? '#FF4B4B' : '#5A1E1E'} />
  </g>
);

const City: React.FC<{frame: number}> = ({frame}) => (
  <g>
    <Sky time="noon" frame={frame} id="ave" />
    <PaintedClouds time="noon" frame={frame} id="avec" y={140} seed={2} />
    <Skyline seed={33} base={700} color="#8FB2D4" style="nyc" minH={260} maxH={620} x0={-1000} x1={3000} litChance={0} window="#D8ECF8" />
    <Skyline seed={12} base={760} color="#6F93B8" style="tower" minH={200} maxH={460} x0={-1000} x1={3000} litChance={0.08} window="#D8ECF8" />
    {/* street-level glass fronts, wordless */}
    {Array.from({length: 12}, (_, i) => (
      <g key={i}>
        <rect x={-900 + i * 340} y={560} width={330} height={250} fill={['#C7D6E2', '#B9C9D8', '#D2DEE8'][i % 3]} stroke="#6F8197" strokeWidth={4} />
        <rect x={-880 + i * 340} y={600} width={290} height={190} fill="#8FAAC4" opacity={0.7} />
        <path d={`M${-880 + i * 340},${600} l80,0 l-80,120 Z`} fill="#FFFFFF" opacity={0.25} />
      </g>
    ))}
    <rect x={-1000} y={810} width={4000} height={110} fill="#C9C4BA" />
    <rect x={-1000} y={920} width={4000} height={500} fill="#4A4E58" />
    {Array.from({length: 30}, (_, i) => (
      <rect key={i} x={-1000 + i * 150} y={1010} width={80} height={8} fill="#E8E8E8" opacity={0.8} />
    ))}
  </g>
);

const QUEUE_X = [CART_X - 200, CART_X - 300, CART_X - 400, CART_X - 490];

const Street: React.FC<{frame: number; t: number; beat: string; lineAt: (i: number) => number; dur: number}> = ({frame, t, beat, lineAt, dur}) => {
  const walkX = beat === 'walk' ? interpolate(t, [0, dur], [700, 980]) : beat === 'block' ? 1000 : 1000;
  const marcusX = beat === 'block' ? 1300 - ease01(t, 0.1, 0.7) * 120 : beat === 'bubble' ? 1180 : 760;
  const staring = beat === 'bubble' || (beat === 'block' && t > lineAt(1));
  return (
    <g>
      <City frame={frame} />
      <FoodCart x={CART_X} y={GROUND + 10} frame={frame} />
      <Figure char={extra(720, {skin: '#A86E48', top: 'tee', topColor: '#FFFFFF', hair: 'cap', apron: '#E35D5D'})} x={CART_X + 40} y={GROUND - 40} scale={0.85} pose="hold" expression="happy" look={[-1, 0]} flip seed={5} rim={false} />
      {OFFICE.slice(0, 4).map((c, i) => (
        <Figure key={i} char={c} x={QUEUE_X[i]} y={GROUND + 16} scale={0.82} pose={i === 1 && !staring ? 'talk' : 'stand'} expression={staring ? 'surprised' : 'happy'} look={staring ? [-1, 0] : [1, 0]} seed={i} rim={false} />
      ))}
      {/* parked motorcade */}
      <Car x={300} y={GROUND + 110} s={1.1} color="#14161C" />
      <Car x={-160} y={GROUND + 110} s={1.1} color="#14161C" />
      {(beat === 'walk' || beat === 'block' || beat === 'bubble') && (
        <g>
          <Shadow x={walkX} y={GROUND + 40} w={50} />
          <Figure char={guard(41)} x={walkX - 150} y={GROUND + 30} scale={0.95} walk={beat === 'walk' ? frame * 0.25 : undefined} pose="stand" expression="neutral" look={[1, 0]} />
          <Figure char="richest" x={walkX} y={GROUND + 40} scale={1.0} walk={beat === 'walk' ? frame * 0.25 + 1 : undefined} pose={beat === 'block' ? (t > lineAt(1) - 0.2 ? 'shrug' : 'stand') : 'stand'} expression={beat === 'walk' ? 'happy' : beat === 'block' ? (t > lineAt(2) ? 'sad' : 'confused') : 'sad'} look={beat === 'block' ? [1, -0.3] : [1, 0]} />
          <Figure char={guard(42)} x={walkX + (beat === 'walk' ? 140 : -260)} y={GROUND + 30} scale={0.95} walk={beat === 'walk' ? frame * 0.25 + 2 : undefined} pose="crossArms" expression="neutral" look={[1, 0]} />
          {(beat === 'block' || beat === 'bubble') && (
            <>
              <Figure char={guard(43)} x={walkX - 360} y={GROUND + 20} scale={0.9} pose="crossArms" expression="neutral" look={[-1, 0]} />
              <Figure char={guard(44)} x={walkX + 470} y={GROUND + 20} scale={0.9} pose="crossArms" expression="neutral" look={[-1, 0]} flip />
              <Drone x={walkX + 60} y={330} frame={frame} />
            </>
          )}
          {beat !== 'walk' && <Figure char="marcus" x={marcusX} y={GROUND + 44} scale={1.08} pose="crossArms" expression="neutral" look={[-1, 0]} flip />}
        </g>
      )}
      {beat === 'motorcade' &&
        [0, 1, 2].map((k) => <Car key={k} x={interpolate(t, [0, dur], [-700, 1700]) - k * 420} y={GROUND + 140} s={1.15} color="#14161C" />)}
    </g>
  );
};

/** Looking out from inside the car (cart) or back through the rear window (back). */
const InCar: React.FC<{frame: number; t: number; beat: string; dur: number; lineAt: (i: number) => number}> = ({frame, t, beat, dur, lineAt}) => {
  const recede = beat === 'back' ? ease01(t, 0.3, dur - 0.6) : 0;
  return (
    <g>
      <g transform={beat === 'back' ? `translate(${960 - 260},${460}) scale(${1 - recede * 0.55}) translate(${-(CART_X - 300)},${-700})` : `translate(${-CART_X + 1300},-170)`}>
        <City frame={frame} />
        <FoodCart x={CART_X} y={GROUND + 10} frame={frame} />
        {OFFICE.slice(0, 4).map((c, i) => (
          <Figure key={i} char={c} x={QUEUE_X[i]} y={GROUND + 16} scale={0.82} pose={i === 1 ? 'talk' : i === 3 ? 'shrug' : 'stand'} expression="ecstatic" look={[1, 0]} seed={i} rim={false} />
        ))}
      </g>
      {/* car interior frame with a window hole */}
      <path fillRule="evenodd" d={beat === 'back' ? 'M-100,-100 L2020,-100 L2020,1180 L-100,1180 Z M240,160 Q240,110 300,110 L1100,110 Q1160,110 1160,160 L1160,700 L240,700 Z' : 'M-100,-100 L2020,-100 L2020,1180 L-100,1180 Z M180,140 Q200,90 300,90 L1700,90 Q1800,90 1820,160 L1840,760 L160,760 Z'} fill="#14161C" />
      <rect x={160} y={760} width={1700} height={30} fill="#2A2E3A" />
      {beat === 'cart' && <path d="M300,90 L700,90 L300,600 Z" fill="#FFFFFF" opacity={0.07} />}
      {beat === 'back' && (
        <g>
          <rect x={1180} y={200} width={760} height={980} rx={40} fill="#3A2C24" />
          <Figure char="richest" x={1540} y={1060} scale={1.15} pose="sit" expression={t > lineAt(1) ? 'sad' : 'neutral'} look={[-1, -0.1]} flip />
        </g>
      )}
      {beat === 'cart' && t > lineAt(1) - 0.2 && <Figure char="richest" x={1600} y={1250} scale={1.35} pose="point" expression="ecstatic" look={[-1, -0.3]} flip />}
    </g>
  );
};

export const Avenue: React.FC = () => {
  const {frame, beat, cam, t, lineAt, dur} = useBeatCam(BEATS, 'walk');
  return (
    <Stage bg="#7CC2F0">
      <Camera progress={1} from={cam} to={cam}>
        {beat === 'cart' || beat === 'back' ? <InCar frame={frame} t={t} beat={beat} dur={dur} lineAt={lineAt} /> : <Street frame={frame} t={t} beat={beat} lineAt={lineAt} dur={dur} />}
      </Camera>
    </Stage>
  );
};
