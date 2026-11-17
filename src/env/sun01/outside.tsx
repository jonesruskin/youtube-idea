import React, {useId} from 'react';
import {interpolate} from 'remotion';
import {Dog} from '../../characters/Dog';
import {Figure} from '../../characters/Figure';
import {useShot} from '../../engine/shot-context';
import {Beam, Bloom, MilkyWay, Snow} from '../../fx/cinema/atmos';
import {Cine, Plane, type CamKey} from '../../fx/cinema/camera';
import {Stars} from '../../fx/sky';
import {C} from '../../theme';
import {Stage} from '../common';
import {CityBlocks, NightGrade, NightSky, P} from './parts';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** A car buried in snow: only the roof line and a wing mirror show. */
const BuriedCar: React.FC<{x: number; y: number; s?: number; color: string}> = ({x, y, s = 1, color}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-150,0 Q-140,-70 -60,-84 L60,-84 Q130,-70 150,0 Z" fill={color} stroke={C.ink} strokeWidth={5} />
    <path d="M-50,-78 L-30,-120 L50,-120 L70,-78 Z" fill="#2A3150" stroke={C.ink} strokeWidth={4} />
    <path d="M-190,10 Q-120,-110 0,-118 Q120,-110 190,10 Z" fill={P.snow} opacity={0.94} />
    <path d="M-170,4 Q-100,-40 0,-44 Q100,-40 170,4" stroke={P.snowShade} strokeWidth={6} fill="none" />
  </g>
);

/** Metro entrance: stairs down into amber light, warm air steaming out of the ground. */
const MetroMouth: React.FC<{x: number; y: number; frame: number; s?: number}> = ({x, y, frame, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <Bloom x={0} y={10} r={460} color="#FFB25A" opacity={0.7} />
    {/* the opening in the snow, seen from slightly above */}
    <path d="M-240,-20 L240,-20 L300,70 L-300,70 Z" fill="#2A1A14" stroke={C.ink} strokeWidth={6} />
    {/* steps descending into the light */}
    {Array.from({length: 6}, (_, i) => (
      <g key={i}>
        <path d={`M${-225 + i * 14},${-6 + i * 12} L${225 - i * 14},${-6 + i * 12}`} stroke="#FFB25A" strokeWidth={7} opacity={0.35 + i * 0.12} />
      </g>
    ))}
    <path d="M-120,58 L120,58 L100,70 L-100,70 Z" fill="#FFD49A" opacity={0.9} />
    {/* side walls and handrails */}
    {[-1, 1].map((sd) => (
      <g key={sd}>
        <path d={`M${sd * 240},-20 L${sd * 300},70`} stroke="#3A3F52" strokeWidth={16} strokeLinecap="round" />
        <path d={`M${sd * 250},-60 L${sd * 250},-20 M${sd * 300},20 L${sd * 300},70`} stroke="#3A3F52" strokeWidth={10} />
        <path d={`M${sd * 250},-60 L${sd * 300},20`} stroke="#5A6278" strokeWidth={9} strokeLinecap="round" />
      </g>
    ))}
    <path d="M-300,72 Q0,60 300,72" stroke={P.snow} strokeWidth={14} fill="none" />
    {/* the roundel — a pictogram, no words */}
    <path d="M-260,-120 L-260,-300" stroke="#3A3F52" strokeWidth={14} />
    <circle cx={-260} cy={-330} r={52} fill="#C2464F" stroke={C.ink} strokeWidth={6} />
    <rect x={-300} y={-344} width={80} height={28} fill="#F4EFE6" stroke={C.ink} strokeWidth={4} />
    <rect x={-480} y={-6} width={960} height={16} rx={8} fill={P.snow} />
    {Array.from({length: 7}, (_, k) => {
      const ph = ((frame * 0.6 + k * 37) % 220) / 220;
      return <circle key={k} cx={-120 + ((k * 53) % 240) + Math.sin(frame * 0.03 + k) * 30} cy={-ph * 520} r={30 + ph * 90} fill="#F4F0EA" opacity={(1 - ph) * 0.35} />;
    })}
  </g>
);

export const SnowScene: React.FC = () => {
  const {props, frame, t, dur, progress, speaking} = useShot();
  const beat = props.beat as string;
  const keys: Record<string, CamKey[]> = {
    bolt: [[0, 1.15, 760, 560], [0.45, 1.15, 1100, 600], [1, 1.05, 1300, 620]],
    search: [[0, 1.1, 700, 600], [1, 1.12, 1250, 620]],
    metro: [[0, 1.0, 900, 560], [1, 1.25, 1150, 600]],
    carry: [[0, 1.15, 760, 420], [1, 1.15, 1160, 720]],
    climb: [[0, 1.1, 960, 760, -3], [1, 1.25, 960, 440, 0]],
  };

  if (beat === 'carry' || beat === 'climb') {
    const down = beat === 'carry';
    const u = interpolate(t, [0, dur], [0, 1]);
    // Stairs run diagonally; down = top-left → bottom-right into warm light; climb = up toward the stars.
    const sx = down ? 500 + u * 700 : 1220 - u * 520;
    const sy = down ? 360 + u * 420 : 860 - u * 520;
    return (
      <Stage bg="#000">
        <Cine keys={keys[beat]} progress={progress} frame={frame} handheld={0.5}>
          <Plane depth={0.6}>
            {down ? (
              <g>
                <rect x={-300} y={-300} width={2600} height={1700} fill="#2A1E1A" />
                <Bloom x={1500} y={980} r={900} color="#FFB25A" opacity={0.8} />
              </g>
            ) : (
              <g>
                <rect x={-300} y={-300} width={2600} height={1700} fill="#0A0E1E" />
                <g transform="translate(560,-120)">
                  <NightSky frame={frame} stars={1.4} colors={P.coldSky} x0={-200} y0={0} w={900} h={500} />
                </g>
                <Bloom x={760} y={80} r={600} color="#9FC6FF" opacity={0.35} />
              </g>
            )}
          </Plane>
          <Plane depth={1}>
            {/* the staircase */}
            {Array.from({length: 22}, (_, i) => {
              const x = down ? 200 + i * 70 : 1500 - i * 52;
              const y = down ? 260 + i * 44 : 1080 - i * 44;
              return (
                <g key={i}>
                  <rect x={x} y={y} width={down ? 300 : 260} height={44} fill={down ? '#5A4033' : '#3A4466'} stroke={C.ink} strokeWidth={3} />
                  {!down && <rect x={x} y={y - 6} width={260} height={10} rx={4} fill={P.snow} opacity={0.85} />}
                </g>
              );
            })}
            {down ? (
              <g>
                <Dog x={sx + 320} y={sy + 110} s={0.7} pose="run" wag={0.8} />
                <Figure char="mira" x={sx - 18} y={sy - 36} scale={0.95} pose="hold" expression="sad" look={[1, 0.4]} seed={2} rim />
                <Figure char="you" x={sx + 40} y={sy + 70} scale={1.2} pose="hold" walk={frame * 0.2} expression="determined" look={[1, 0.5]} hoodUp breath rim />
              </g>
            ) : (
              <g>
                <Figure char="you" x={sx} y={sy} scale={1.25} pose="stand" walk={frame * 0.16} back hoodUp rim />
                <Beam x={sx + 30} y={sy - 230} angle={-110} len={700} spread={12} frame={frame} opacity={0.5} />
              </g>
            )}
            <NightGrade amount={down ? 0.25 : 0.5} color={down ? '#3A1E14' : '#101A40'} />
            {down && <Bloom x={1500} y={980} r={700} color="#FFB25A" opacity={0.5} />}
          </Plane>
          {!down && (
            <Plane depth={1.1}>
              <Snow frame={frame} density={0.25} wind={0.2} />
            </Plane>
          )}
        </Cine>
      </Stage>
    );
  }

  const beamAng = beat === 'search' ? interpolate(t, [0, dur], [-30, 10]) + Math.sin(frame * 0.05) * 6 : beat === 'bolt' ? interpolate(t, [0, dur], [-10, 5]) : -5;
  const dogX = beat === 'bolt' ? interpolate(t, [0.6, dur], [760, 2100], clamp) : 0;
  const youX = beat === 'bolt' ? interpolate(t, [dur * 0.55, dur], [700, 1050], clamp) : beat === 'search' ? interpolate(t, [0, dur], [520, 820]) : 760;
  return (
    <Stage bg="#000">
      <Cine keys={keys[beat] ?? keys.search} progress={progress} frame={frame} handheld={beat === 'bolt' ? 0.9 : 0.5}>
        <Plane depth={0.15}>
          <NightSky frame={frame} stars={1.2} colors={P.coldSky} />
        </Plane>
        <Plane depth={0.45}>
          <CityBlocks seed={66} base={700} color="#0E1834" minH={260} maxH={620} lights={0.04} snow={1} frame={frame} />
        </Plane>
        <Plane depth={1}>
          {/* snow ground */}
          <rect x={-400} y={760} width={2800} height={700} fill={P.snow} />
          <path d="M-400,770 Q300,730 900,768 T2400,760" stroke={P.snowShade} strokeWidth={8} fill="none" />
          {beat === 'bolt' && (
            <g>
              {/* the building door, light spilling out */}
              <rect x={420} y={240} width={560} height={540} fill="#1A2140" stroke={C.ink} strokeWidth={5} />
              <rect x={590} y={420} width={220} height={350} fill="#FFC27A" />
              <path d="M590,770 L810,770 L1000,1100 L380,1100 Z" fill="#FFC27A" opacity={0.35} />
              <Bloom x={700} y={600} r={420} color="#FFB867" opacity={0.5} />
              <Figure char="mira" x={650} y={780} scale={1.05} pose={speaking('MIRA') ? 'reach' : 'handsOnHead'} expression="alarmed" look={[1, 0]} rim seed={2} />
              <Figure char="you" x={youX} y={790} scale={1.25} pose="hold" walk={t > dur * 0.55 ? frame * 0.35 : undefined} expression="alarmed" look={[1, 0]} hoodUp breath rim />
              {t > dur * 0.55 && <Beam x={youX + 40} y={560} angle={beamAng} len={1100} frame={frame} />}
              <Dog x={dogX} y={850} s={0.9} pose="run" wag={0.9} breath />
            </g>
          )}
          {beat === 'search' && (
            <g>
              <BuriedCar x={1100} y={790} color="#C2464F" />
              <BuriedCar x={1560} y={800} s={1.1} color="#4FA3A5" />
              <BuriedCar x={300} y={800} s={0.9} color="#E8B04B" />
              {/* paw prints, lit only where the torch reaches */}
              {Array.from({length: 12}, (_, i) => {
                const x = 900 + i * 90;
                const lit = interpolate(beamAng, [-10 + i * 1.5, 0 + i * 1.5], [0.15, 1], clamp);
                return <ellipse key={i} cx={x} cy={900 + (i % 2) * 26} rx={13} ry={9} fill="#7E8FAD" opacity={lit} />;
              })}
              <Figure char="you" x={youX} y={880} scale={1.3} pose="hold" walk={frame * 0.15} expression="serious" look={[1, 0.3]} hoodUp breath rim />
              <Beam x={youX + 50} y={640} angle={beamAng + 18} len={1200} spread={13} frame={frame} />
            </g>
          )}
          {beat === 'metro' && (
            <g>
              <MetroMouth x={1250} y={790} frame={frame} />
              <Dog x={1080} y={800} s={0.8} pose="sit" wag={1} lookUp={0.4} breath rim="#FFB25A" />
              <Figure char="you" x={520} y={900} scale={1.35} pose="hold" expression="surprised" look={[1, 0]} hoodUp breath rim />
            </g>
          )}
          <NightGrade amount={0.5} color="#101A40" />
          {beat === 'metro' && <Bloom x={1250} y={760} r={600} color="#FFB25A" opacity={0.45} />}
        </Plane>
        <Plane depth={1.15}>
          <Snow frame={frame} density={beat === 'bolt' ? 0.6 : 0.35} wind={0.7} />
        </Plane>
      </Cine>
    </Stage>
  );
};

/** Cross-section dive: snow, soil, rock — colours warming as the camera descends. */
export const Ground: React.FC = () => {
  const {frame, progress} = useShot();
  const id = useId().replace(/:/g, '');
  return (
    <Stage bg="#000">
      <Cine keys={[[0, 1.25, 960, 260], [0.25, 1.1, 960, 560], [1, 1.0, 960, 2400]]} progress={progress} frame={frame} handheld={0.2}>
        <Plane depth={1}>
          <defs>
            <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3A4A6E" />
              <stop offset="0.12" stopColor="#5A4636" />
              <stop offset="0.4" stopColor="#4A3A3A" />
              <stop offset="0.7" stopColor="#7A3A22" />
              <stop offset="1" stopColor="#E0622A" />
            </linearGradient>
          </defs>
          <g transform="translate(0,-260)">
            <NightSky frame={frame} stars={1} colors={P.coldSky} x0={-400} y0={-400} w={2800} h={700} />
          </g>
          <CityBlocks seed={66} base={300} color="#0E1834" minH={160} maxH={420} lights={0} snow={1} frame={frame} />
          <rect x={-400} y={300} width={2800} height={2900} fill={`url(#${id}g)`} />
          <rect x={-400} y={290} width={2800} height={40} fill={P.snow} />
          {/* strata */}
          {Array.from({length: 14}, (_, i) => (
            <path key={i} d={`M-400,${520 + i * 190} Q300,${490 + i * 190 + (i % 2) * 40} 900,${520 + i * 190} T2400,${510 + i * 190}`} stroke="#00000033" strokeWidth={6 + (i % 3) * 4} fill="none" />
          ))}
          {Array.from({length: 60}, (_, i) => (
            <ellipse key={i} cx={(i * 337) % 2600 - 300} cy={600 + ((i * 211) % 2400)} rx={20 + (i % 4) * 14} ry={12 + (i % 3) * 8} fill="#00000022" />
          ))}
          {/* the metro tunnel, a warm pocket just under the frost */}
          <circle cx={960} cy={560} r={150} fill="#2A1E1A" stroke={C.ink} strokeWidth={6} />
          <Bloom x={960} y={560} r={320} color="#FFB25A" opacity={0.6} />
          <rect x={830} y={600} width={260} height={18} fill="#5A4033" />
          {Array.from({length: 5}, (_, i) => (
            <circle key={i} cx={870 + i * 45} cy={520} r={6} fill="#FFE08A" />
          ))}
          {/* heat rising from the deep */}
          {Array.from({length: 18}, (_, i) => {
            const ph = ((frame * 0.8 + i * 61) % 600) / 600;
            const x = 100 + ((i * 113) % 1720);
            return <path key={i} d={`M${x},${3000 - ph * 1700} q20,-40 0,-80 q-20,-40 0,-80`} stroke="#FFB25A" strokeWidth={4} fill="none" opacity={(1 - ph) * 0.4} />;
          })}
          <Bloom x={960} y={3100} r={1300} color="#FF7A3D" opacity={0.6} />
        </Plane>
      </Cine>
    </Stage>
  );
};

/** The harbour in cross-section: ice spreading over the top, the ocean still liquid underneath. */
export const Sea: React.FC = () => {
  const {frame, t, dur, progress} = useShot();
  const id = useId().replace(/:/g, '');
  const ice = interpolate(t, [0, dur], [30, 150]);
  return (
    <Stage bg="#000">
      <Cine keys={[[0, 1.2, 960, 420], [1, 1.05, 960, 560]]} progress={progress} frame={frame} handheld={0.2}>
        <Plane depth={0.3}>
          <NightSky frame={frame} stars={1} colors={P.coldSky} />
          <CityBlocks seed={66} base={380} color="#0E1834" minH={120} maxH={300} lights={0} snow={1} frame={frame} />
        </Plane>
        <Plane depth={1}>
          <defs>
            <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1E4A7A" />
              <stop offset="1" stopColor="#050C1E" />
            </linearGradient>
          </defs>
          <rect x={-400} y={380} width={2800} height={1200} fill={`url(#${id}w)`} />
          {/* fish still moving under the lid */}
          {Array.from({length: 9}, (_, i) => {
            const x = ((frame * (1.2 + (i % 3) * 0.5) + i * 300) % 2600) - 300;
            const y = 640 + ((i * 97) % 380);
            return <path key={i} d={`M${x},${y} q30,-16 60,0 q-30,16 -60,0 l-18,-12 l0,24 z`} fill="#3A6A9A" opacity={0.7} />;
          })}
          {Array.from({length: 40}, (_, i) => (
            <circle key={i} cx={(i * 211) % 2400 - 200} cy={500 + ((i * 131 + frame * 0.3) % 900)} r={2} fill="#9FD8FF" opacity={0.4} />
          ))}
          {/* the ice lid */}
          <rect x={-400} y={380} width={2800} height={ice} fill={P.ice} />
          <path d={`M-400,${380 + ice} ${Array.from({length: 30}, (_, i) => `L${-400 + i * 100},${380 + ice + (i % 2 ? 14 : -6)}`).join(' ')}`} stroke={P.iceShade} strokeWidth={8} fill="none" />
          {Array.from({length: 14}, (_, i) => (
            <path key={i} d={`M${-300 + i * 190},${390} l40,${ice * 0.5} l-20,${ice * 0.3}`} stroke="#FFFFFF" strokeWidth={3} opacity={0.6} fill="none" />
          ))}
          <rect x={-400} y={370} width={2800} height={20} fill={P.snow} />
          <NightGrade amount={0.25} color="#101A40" />
        </Plane>
      </Cine>
    </Stage>
  );
};

/** Hydrothermal vents: black smokers, tube worms, crabs — life that never needed the Sun. */
export const Vents: React.FC = () => {
  const {frame, progress} = useShot();
  const chimneys = [
    {x: 560, h: 420, w: 90},
    {x: 1020, h: 560, w: 120},
    {x: 1420, h: 380, w: 80},
  ];
  return (
    <Stage bg="#000">
      <Cine keys={[[0, 1.2, 760, 560], [1, 1.08, 1160, 540]]} progress={progress} frame={frame} handheld={0.3}>
        <Plane depth={0.3} blur={4}>
          <rect x={-300} y={-300} width={2600} height={1700} fill="#0A1B36" />
          <Bloom x={960} y={200} r={1100} color="#1E4A7A" opacity={0.6} />
          {Array.from({length: 80}, (_, i) => (
            <circle key={i} cx={(i * 263) % 2400 - 200} cy={((i * 157 + frame * 0.4) % 1300) - 100} r={1.5 + (i % 3)} fill={i % 7 ? '#5A7AA8' : '#7DFFE0'} opacity={i % 7 ? 0.35 : 0.8} />
          ))}
        </Plane>
        <Plane depth={1}>
          <path d="M-300,1000 Q200,880 600,960 T1400,920 T2300,980 L2300,1400 L-300,1400 Z" fill="#141A2A" stroke={C.ink} strokeWidth={6} />
          {chimneys.map((c, i) => (
            <g key={i}>
              {/* plume */}
              {Array.from({length: 9}, (_, k) => {
                const ph = ((frame * 0.7 + k * 30 + i * 50) % 270) / 270;
                return <circle key={k} cx={c.x + Math.sin(frame * 0.02 + k) * 30 * ph} cy={960 - c.h - ph * 500} r={c.w * (0.4 + ph * 1.4)} fill="#0A0C12" opacity={(1 - ph) * 0.85} />;
              })}
              <Bloom x={c.x} y={960 - c.h} r={c.w * 1.6} color="#FF7A3D" opacity={0.45} />
              <path d={`M${c.x - c.w},980 Q${c.x - c.w * 0.9},${980 - c.h * 0.5} ${c.x - c.w * 0.45},${960 - c.h} L${c.x + c.w * 0.45},${960 - c.h} Q${c.x + c.w * 0.8},${980 - c.h * 0.5} ${c.x + c.w},980 Z`} fill="#3A3330" stroke={C.ink} strokeWidth={6} />
              {Array.from({length: 5}, (_, k) => (
                <path key={k} d={`M${c.x - c.w * (0.85 - k * 0.08)},${980 - k * c.h * 0.18} q${c.w * 0.4},-10 ${c.w * (1.7 - k * 0.15)},0`} stroke="#5A4A40" strokeWidth={5} fill="none" />
              ))}
              <path d={`M${c.x - c.w * 0.2},${965 - c.h} L${c.x - c.w * 0.1},${980 - c.h * 0.6} L${c.x + c.w * 0.05},${975 - c.h * 0.3}`} stroke="#FF7A3D" strokeWidth={4} fill="none" opacity={0.7} />
              <ellipse cx={c.x} cy={960 - c.h} rx={c.w * 0.4} ry={10} fill="#FFB25A" />
              {/* tube worms */}
              {Array.from({length: 7}, (_, k) => {
                const wx = c.x - c.w * 1.6 + k * c.w * 0.5;
                const sw = Math.sin(frame * 0.05 + k + i) * 6;
                return (
                  <g key={k}>
                    <path d={`M${wx},990 q${sw},-60 ${sw * 1.5},-${110 + (k % 3) * 30}`} stroke="#F4EFE6" strokeWidth={12} fill="none" strokeLinecap="round" />
                    <circle cx={wx + sw * 1.5} cy={880 - (k % 3) * 30} r={12} fill="#E2483D" />
                  </g>
                );
              })}
            </g>
          ))}
          {/* white crabs */}
          {[760, 1240, 1700].map((x, i) => {
            const cx = x + Math.sin(frame * 0.03 + i) * 40;
            return (
              <g key={x} transform={`translate(${cx},${1000})`}>
                <ellipse rx={30} ry={18} fill="#E8E2D6" stroke={C.ink} strokeWidth={3} />
                {[-1, 1].map((sd) => (
                  <path key={sd} d={`M${sd * 24},-6 l${sd * 26},-18 l${sd * 10},12`} stroke="#E8E2D6" strokeWidth={6} fill="none" strokeLinecap="round" />
                ))}
              </g>
            );
          })}
          <NightGrade amount={0.2} color="#06102A" />
        </Plane>
      </Cine>
    </Stage>
  );
};

/** Day 365 on the surface: you, tiny, under the sky. The Moon is a black circle eating the stars. */
export const Surface: React.FC = () => {
  const {props, frame, t, dur, progress} = useShot();
  const moon = props.beat === 'moon';
  const mx = interpolate(t, [0, dur], [520, 1320]);
  return (
    <Stage bg="#000">
      <Cine keys={moon ? [[0, 1.15, 960, 400], [1, 1.2, 1000, 380]] : [[0, 1.05, 960, 640], [1, 1.12, 960, 470]]} progress={progress} frame={frame} handheld={0.15}>
        <Plane depth={0.1}>
          <rect x={-600} y={-500} width={3200} height={2200} fill="#02030A" />
          <Bloom x={1000} y={380} r={1100} color="#2A3466" opacity={0.5} />
          <MilkyWay frame={frame} opacity={1} angle={-24} cy={360} seed={21} />
          <MilkyWay frame={frame} opacity={0.6} angle={-24} cy={380} seed={57} />
          <Stars frame={frame} count={700} seed={71} maxR={2.4} y0={-300} />
          {moon && <circle cx={mx} cy={340} r={92} fill="#02030A" />}
        </Plane>
        <Plane depth={0.6}>
          <CityBlocks seed={66} base={840} color="#070B18" minH={60} maxH={260} lights={0} snow={1} frame={frame} />
        </Plane>
        <Plane depth={1}>
          <rect x={-400} y={830} width={2800} height={600} fill="#C9D6E8" />
          <rect x={-400} y={830} width={2800} height={600} fill="#101A40" opacity={0.5} style={{mixBlendMode: 'multiply'}} />
          <path d="M-400,840 Q400,820 960,846 T2400,836" stroke="#E8F0FA" strokeWidth={5} fill="none" opacity={0.6} />
          <Figure char="you" x={960} y={890} scale={0.72} pose="stand" toPose="pointUp" blend={moon ? 0.6 : 0} back hoodUp rim={false} />
          <ellipse cx={960} cy={895} rx={60} ry={8} fill="#000" opacity={0.25} />
          <Bloom x={960} y={600} r={520} color="#C9D6FF" opacity={0.1} />
        </Plane>
      </Cine>
    </Stage>
  );
};

/** You blink: eyelids close on the stars, then white. */
export const Blink: React.FC = () => {
  const {t} = useShot();
  const close = interpolate(t, [0, 0.35], [0, 1], clamp);
  const white = interpolate(t, [0.7, 1.2], [0, 1], clamp);
  return (
    <Stage bg="#000">
      <rect width={1920} height={1080} fill="#02030A" />
      <MilkyWay frame={0} opacity={0.8} angle={-24} cy={420} />
      <path d={`M-100,-100 L2020,-100 L2020,${-100 + 640 * close} Q960,${-100 + 760 * close} -100,${-100 + 640 * close} Z`} fill="#000" />
      <path d={`M-100,1180 L2020,1180 L2020,${1180 - 640 * close} Q960,${1180 - 760 * close} -100,${1180 - 640 * close} Z`} fill="#000" />
      <rect width={1920} height={1080} fill="#FFF8EC" opacity={white} />
    </Stage>
  );
};

