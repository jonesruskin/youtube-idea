import React from 'react';
import {Easing, interpolate} from 'remotion';
import {Figure} from '../../characters/Figure';
import {useShot} from '../../engine/shot-context';
import {Camera} from '../../fx/camera';
import {Globe} from '../../fx/globe';
import {Glow, Orion} from '../../fx/sky';
import {Executor} from '../../fx/vey';
import {C} from '../../theme';
import {Stage} from '../common';
import {Facades, FarCity, Grade, HOLO, Motes, PaintedClouds, Shadow, Sky, type TimeOfDay} from '../kit';
import {FlipFlop, lerpCam, Par} from './street';

type Cam = [number, number, number];
const ROOF = 820;
const ORION: [number, number] = [1060, -300];
const OSCALE = 45;
const BET: [number, number] = [ORION[0] - (88.79 - 83.8) * OSCALE, ORION[1] - 7.41 * OSCALE];

const BEATS: Record<string, {time: TimeOfDay; cam: [Cam, Cam]}> = {
  dream: {time: 'night', cam: [[1.0, 960, 1250], [1.05, 960, 560]]},
  sky: {time: 'night', cam: [[0.95, 980, -230], [1.3, BET[0] + 160, BET[1] + 180]]},
  blink: {time: 'night', cam: [[1.4, BET[0] + 160, BET[1] + 200], [1.0, 980, 120]]},
  thread: {time: 'night', cam: [[1.0, 960, 300], [1.6, 860, 720]]},
  wake: {time: 'dawn', cam: [[1.25, 900, 420], [1.35, 900, 440]]},
  fall: {time: 'dawn', cam: [[1.15, 1100, 560], [1.15, 1100, 560]]},
  test: {time: 'morning', cam: [[1.9, 960, 720], [2.0, 960, 720]]},
  hug: {time: 'morning', cam: [[1.6, 900, 640], [1.7, 900, 640]]},
  executor: {time: 'morning', cam: [[1.1, 1100, 520], [1.25, 1000, 580]]},
  explain: {time: 'morning', cam: [[1.4, 1080, 560], [1.5, 1080, 540]]},
  map: {time: 'sunset', cam: [[1.3, 1000, 560], [1.4, 1020, 520]]},
  palm: {time: 'night', cam: [[1.0, 960, 540], [1.08, 960, 540]]},
};

const LaundryLine: React.FC<{frame: number; floating?: number; fall?: number}> = ({frame, floating = 0, fall = 0}) => {
  const items = [
    {x: 340, c: '#C2464F', w: 70, h: 90},
    {x: 450, c: '#3E7CB1', w: 90, h: 70},
    {x: 580, c: '#F2C14E', w: 60, h: 100},
    {x: 690, c: '#F4F4F4', w: 70, h: 50},
    {x: 800, c: '#3C8D6E', w: 80, h: 90},
  ];
  return (
    <g>
      <line x1={260} y1={ROOF} x2={260} y2={ROOF - 330} stroke="#6B5A4A" strokeWidth={8} />
      <line x1={900} y1={ROOF} x2={900} y2={ROOF - 330} stroke="#6B5A4A" strokeWidth={8} />
      <path d={`M260,${ROOF - 320} Q580,${ROOF - 280} 900,${ROOF - 320}`} stroke={C.ink} strokeWidth={3} fill="none" />
      {items.map((it, i) => {
        const fx = floating ? Math.sin(frame * 0.03 + i * 1.7) * 140 * floating : 0;
        const fy = floating ? -260 * floating + Math.cos(frame * 0.025 + i) * 60 * floating : 0;
        const fallY = fall * (900 + i * 60);
        return (
          <rect
            key={i}
            x={it.x + fx}
            y={ROOF - 300 + fy + fallY}
            width={it.w}
            height={it.h}
            rx={8}
            fill={it.c}
            stroke={C.ink}
            strokeWidth={4}
            transform={`rotate(${Math.sin(frame / 25 + i) * (3 + floating * 30)},${it.x + it.w / 2},${ROOF - 300})`}
          />
        );
      })}
    </g>
  );
};

export const Cat: React.FC<{x: number; y: number; s?: number; frame: number; paddle?: boolean; rot?: number}> = ({x, y, s = 1, frame, paddle, rot = 0}) => {
  const p = paddle ? Math.sin(frame * 0.6) * 20 : 0;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
      <path d={`M60,-20 Q110,${-40 + p * 0.5} 100,-90`} stroke="#E8963C" strokeWidth={14} fill="none" strokeLinecap="round" />
      {[-40, -14, 14, 40].map((lx, i) => (
        <line key={i} x1={lx} y1={0} x2={lx + (i % 2 ? p : -p) * 0.6} y2={34} stroke="#E8963C" strokeWidth={12} strokeLinecap="round" />
      ))}
      <ellipse cx={0} cy={-10} rx={70} ry={38} fill="#F2A65A" stroke={C.ink} strokeWidth={5} />
      {[-30, 0, 30].map((sx) => (
        <path key={sx} d={`M${sx},-44 l6,18`} stroke="#C9762E" strokeWidth={6} />
      ))}
      <g transform="translate(-72,-36)">
        <path d="M-30,-20 L-24,-56 L-4,-30 Z M10,-30 L28,-56 L32,-18 Z" fill="#F2A65A" stroke={C.ink} strokeWidth={4} />
        <circle r={36} fill="#F2A65A" stroke={C.ink} strokeWidth={5} />
        <ellipse cx={-12} cy={-4} rx={7} ry={paddle ? 9 : 4} fill="#FFFFFF" stroke={C.ink} strokeWidth={2.5} />
        <ellipse cx={12} cy={-4} rx={7} ry={paddle ? 9 : 4} fill="#FFFFFF" stroke={C.ink} strokeWidth={2.5} />
        <circle cx={-12} cy={-3} r={3} fill={C.ink} />
        <circle cx={12} cy={-3} r={3} fill={C.ink} />
        <path d="M-6,12 q6,6 12,0" stroke={C.ink} strokeWidth={3} fill="none" />
      </g>
    </g>
  );
};

const RoofSet: React.FC<{time: TimeOfDay; frame: number; laundry?: number; laundryFall?: number}> = ({time, frame, laundry = 0, laundryFall = 0}) => (
  <g>
    {/* the house below the roof, and the yard */}
    <rect x={180} y={ROOF} width={1560} height={700} fill="#4FA3A5" stroke={C.ink} strokeWidth={6} />
    <rect x={1500} y={ROOF} width={240} height={700} fill="#000" opacity={0.12} />
    {[320, 760, 1200].map((wx) => (
      <rect key={wx} x={wx} y={ROOF + 120} width={140} height={150} fill={time === 'night' ? '#FFC873' : '#2E3F5E'} stroke={C.ink} strokeWidth={5} />
    ))}
    <rect x={-400} y={1480} width={2800} height={400} fill="#A88B6A" />
    <rect x={-400} y={1480} width={2800} height={20} fill="#000" opacity={0.15} />
    {/* roof slab + parapet */}
    <rect x={160} y={ROOF - 10} width={1600} height={50} fill="#B9AFA2" stroke={C.ink} strokeWidth={6} />
    <rect x={160} y={ROOF - 60} width={40} height={60} fill="#B9AFA2" stroke={C.ink} strokeWidth={5} />
    <rect x={1720} y={ROOF - 60} width={40} height={60} fill="#B9AFA2" stroke={C.ink} strokeWidth={5} />
    {/* water drum (blue) and tank (black) */}
    <rect x={1420} y={ROOF - 200} width={150} height={200} rx={20} fill="#2F7FC1" stroke={C.ink} strokeWidth={6} />
    <ellipse cx={1495} cy={ROOF - 200} rx={75} ry={18} fill="#5FA8E0" stroke={C.ink} strokeWidth={5} />
    <rect x={1600} y={ROOF - 280} width={120} height={280} rx={18} fill="#1C1F2A" stroke={C.ink} strokeWidth={6} />
    {/* satellite dish */}
    <path d={`M1240,${ROOF - 10} L1250,${ROOF - 90}`} stroke="#777" strokeWidth={6} />
    <path d={`M1200,${ROOF - 120} a60,40 -30 0,1 100,-60 z`} fill="#E9E9EE" stroke={C.ink} strokeWidth={4} />
    {/* mat */}
    <rect x={620} y={ROOF - 26} width={440} height={22} rx={6} fill="#C9A15A" stroke={C.ink} strokeWidth={4} />
    <LaundryLine frame={frame} floating={laundry} fall={laundryFall} />
  </g>
);

export const Roof: React.FC = () => {
  const {frame, props, progress, t, dur, lineAt, ramp, speaking} = useShot();
  const beat = props.beat as string;
  const cfg = BEATS[beat];
  const cam = lerpCam(cfg.cam[0], cfg.cam[1], Easing.inOut(Easing.cubic)(progress));
  const time = cfg.time;

  const bet = beat === 'blink' ? interpolate(t, [0.4, 0.55, 0.65, 0.8, 1.0], [1, 0.3, 0.9, 0.15, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : ['dream', 'sky'].includes(beat) ? 1 : 0;
  const showOrion = ['dream', 'sky', 'blink', 'thread', 'palm'].includes(beat);

  const fallP = beat === 'fall' ? Math.min(1, Math.max(0, (t - 0.3) / 0.8)) : 0;
  const toYard = beat === 'fall' ? ramp(lineAt(1) - 0.6, 0.8) : 0;
  const camFall: Cam = beat === 'fall' ? lerpCam([1.15, 1100, 560], [1.4, 640, 1260], toYard) : cam;

  return (
    <Stage bg="#000">
      <Camera progress={1} from={camFall} to={camFall} frame={frame}>
        <Par depth={0.1} fx={camFall[1]} fy={camFall[2]}>
          <Sky time={time} frame={frame} id={`roof-${beat}`} y0={-1000} h={2800} />
          {time !== 'night' && <PaintedClouds time={time} frame={frame} id={`roofc-${beat}`} y={60} seed={4} />}
        </Par>
        {showOrion && <Orion cx={ORION[0]} cy={ORION[1]} scale={OSCALE} frame={frame} betelgeuse={bet} lines={beat === 'sky' ? ramp(0.3, 2) * 0.45 : beat === 'dream' ? 0 : 0.3} />}
        {beat === 'sky' && (
          <g opacity={ramp(lineAt(0) + 2.2, 0.6)}>
            <circle cx={BET[0]} cy={BET[1]} r={48 + Math.sin(frame * 0.2) * 6} fill="none" stroke={C.betelgeuse} strokeWidth={4} strokeDasharray="10 10" />
          </g>
        )}
        {(beat === 'blink' || beat === 'thread' || beat === 'palm') && t > 1 && <circle cx={BET[0]} cy={BET[1]} r={44} fill="none" stroke={C.pearl} strokeOpacity={0.35} strokeWidth={3} strokeDasharray="5 9" />}
        <Par depth={0.45} fx={camFall[1]} fy={camFall[2]}>
          <FarCity time={time} base={760} frame={frame} seed={33} />
        </Par>
        <Par depth={0.75} fx={camFall[1]} fy={camFall[2]}>
          <Facades time={time} base={1050} seed={14} x0={-700} x1={2700} frame={frame} signs={false} />
        </Par>
        <RoofSet time={time} frame={frame} laundry={beat === 'wake' ? 1 : beat === 'fall' ? 1 - fallP : 0} laundryFall={beat === 'fall' ? fallP : 0} />

        {/* ── characters per beat ── */}
        {['dream', 'sky', 'blink', 'thread'].includes(beat) && (
          <g transform={`translate(840,${ROOF - 30}) rotate(${beat === 'blink' && t > 1.4 ? -40 : -90})`}>
            <Figure char="jonah" x={0} y={0} scale={0.95} pose={beat === 'blink' && t > 1.4 ? 'stand' : 'lie'} expression={beat === 'thread' ? 'sleep' : beat === 'blink' ? 'surprised' : 'warm'} look={[0.5, -1]} />
          </g>
        )}
        {beat === 'thread' && (
          <g>
            {(() => {
              const p = interpolate(t, [0.4, 3.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
              const end: [number, number] = [920, ROOF - 70];
              const start: [number, number] = [BET[0], BET[1]];
              const path = `M${start[0]},${start[1]} C${start[0] + 300},${start[1] + 300} ${end[0] - 400},${end[1] - 600} ${end[0]},${end[1]}`;
              return (
                <g>
                  <path d={path} stroke="#E8F0FF" strokeWidth={4} fill="none" strokeDasharray="3000" strokeDashoffset={3000 * (1 - p)} opacity={0.9} />
                  <path d={path} stroke="#E8F0FF" strokeWidth={14} fill="none" strokeDasharray="3000" strokeDashoffset={3000 * (1 - p)} opacity={0.2} />
                  {p >= 1 && <Glow id="palmLand" cx={end[0]} cy={end[1]} r={90 + Math.sin(frame * 0.3) * 10} color="#FF9A3C" />}
                </g>
              );
            })()}
            {t > 3.6 && (
              <text x={760} y={ROOF - 160 - ((frame % 50) / 50) * 40} fill={C.pearl} fontFamily="'Unbounded', sans-serif" fontSize={40} opacity={1 - (frame % 50) / 50}>
                z
              </text>
            )}
          </g>
        )}

        {beat === 'wake' && (
          <g>
            <g transform={`translate(900,${240 + Math.sin(frame * 0.05) * 14}) rotate(${178 + Math.sin(frame * 0.03) * 8})`}>
              <Figure char="jonah" x={0} y={-160} scale={0.95} pose="armsUp" walk={t * 3} expression={t > lineAt(0) + 1.4 ? 'alarmed' : 'confused'} palmGlow={0.8} />
            </g>
            <rect x={660 + Math.sin(frame * 0.04) * 40} y={260 + Math.cos(frame * 0.03) * 30} width={220} height={120} rx={14} fill="#7B6FC1" stroke={C.ink} strokeWidth={5} transform={`rotate(${frame * 0.4},770,320)`} />
            <Cat x={1180} y={360 + Math.sin(frame * 0.07) * 20} s={0.7} frame={frame} paddle rot={Math.sin(frame * 0.05) * 20} />
          </g>
        )}

        {beat === 'fall' && (
          <g>
            {fallP < 1 && (
              <g transform={`translate(${900 + fallP * 560},${400 + fallP * 340}) rotate(${178 - fallP * 120})`}>
                <Figure char="jonah" x={0} y={-160} scale={0.95} pose="armsUp" expression="alarmed" fist={1} />
              </g>
            )}
            {fallP >= 1 && (
              <g>
                {Array.from({length: 12}, (_, i) => {
                  const p = Math.min(1, (t - 1.1) * 1.4);
                  return <circle key={i} cx={1495 + Math.cos(i) * 140 * p} cy={ROOF - 220 - Math.sin((i / 12) * Math.PI) * 140 * p + p * p * 120} r={10} fill="#8FC7E8" stroke={C.ink} strokeWidth={2} opacity={1 - p} />;
                })}
                <g transform={`translate(1495,${ROOF - 160})`}>
                  <path d="M-30,0 l-20,-60 M30,0 l20,-60" stroke="#7A4A2E" strokeWidth={22} strokeLinecap="round" />
                  <ellipse cx={-50} cy={-66} rx={22} ry={12} fill="#F4EFE6" stroke={C.ink} strokeWidth={4} />
                  <ellipse cx={50} cy={-66} rx={22} ry={12} fill="#F4EFE6" stroke={C.ink} strokeWidth={4} />
                </g>
              </g>
            )}
            <Cat x={1180 + fallP * 60} y={360 + fallP * 440} s={0.7} frame={frame} paddle={fallP < 1} rot={fallP * 180} />
            {/* Grandma in the yard below */}
            <Shadow x={640} y={1480} />
            <Figure char="grandma" x={640} y={1480} scale={1.05} pose={t > lineAt(1) ? 'hipHand' : 'hold'} expression={t > lineAt(1) ? 'serious' : 'surprised'} look={[0, -1]} />
            {t > lineAt(1) - 0.4 && (
              <g transform={`translate(640,${1480 - 300 + Math.min(0, (t - lineAt(1)) * 200 - 80)})`}>
                <path d="M-46,-40 L46,-40 L36,0 L10,0 L0,-14 L-10,0 L-36,0 Z" fill="#F2A3C0" stroke={C.ink} strokeWidth={4} />
                <circle cx={-20} cy={-24} r={5} fill="#FFFFFF" />
                <circle cx={18} cy={-26} r={5} fill="#FFFFFF" />
              </g>
            )}
          </g>
        )}

        {beat === 'test' && (
          <g>
            {(() => {
              const cycle = (t % 2.2) / 2.2;
              const open = cycle < 0.55;
              const fy = open ? -Math.sin(Math.min(1, cycle / 0.5) * Math.PI * 0.5) * 120 : -120 + Math.min(1, (cycle - 0.55) / 0.12) * 120;
              return (
                <>
                  <g transform={`translate(1040,${ROOF - 20 + fy}) rotate(${open ? cycle * 60 : 0})`}>
                    <FlipFlop />
                  </g>
                  {open && <Glow id="ffglow" cx={1040} cy={ROOF - 20 + fy} r={60} color="#FF9A3C" opacity={0.6} />}
                  <Figure char="jonah" x={900} y={ROOF + 30} scale={1} pose="reach" expression={open ? 'ecstatic' : 'surprised'} palmGlow={open ? 1 : 0} fist={open ? 0 : 1} look={[1, 0.6]} />
                  {Array.from({length: 4}, (_, i) => (
                    <circle key={i} cx={880 + i * 20} cy={ROOF - 260 + ((frame * 3 + i * 40) % 160)} r={4} fill="#8FC7E8" />
                  ))}
                </>
              );
            })()}
          </g>
        )}

        {beat === 'hug' && (
          <g>
            <Shadow x={880} y={ROOF} w={140} />
            <Figure char="grandma" x={960} y={ROOF} scale={1.05} pose={t > lineAt(1) ? 'shrug' : 'hold'} expression={t > lineAt(1) ? 'serious' : 'surprised'} look={[-1, 0]} flip />
            <Figure char="jonah" x={850} y={ROOF} scale={1} pose="reach" expression="warm" look={[1, 0]} palmGlow={0} />
            <g transform={`translate(960,${ROOF - 290})`}>
              <path d="M-46,-40 L46,-40 L36,0 L10,0 L0,-14 L-10,0 L-36,0 Z" fill="#F2A3C0" stroke={C.ink} strokeWidth={4} />
            </g>
          </g>
        )}

        {(beat === 'executor' || beat === 'explain' || beat === 'map' || beat === 'palm') && (
          <Executor
            x={beat === 'palm' ? 1460 : 1250}
            y={beat === 'executor' ? interpolate(t, [0, 2.2], [-200, 520], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}) : beat === 'palm' ? 360 : 520}
            scale={beat === 'palm' ? 0.7 : 0.75}
            frame={frame}
            speaking={speaking('EXECUTOR')}
          />
        )}
        {beat === 'executor' && (
          <g>
            <Figure char="jonah" x={850} y={ROOF} scale={1} pose={t > lineAt(1) - 0.4 && t < lineAt(1) + 0.6 ? 'throw' : 'stand'} expression={t > lineAt(1) ? 'nervous' : 'surprised'} look={[1, -0.4]} />
            {(() => {
              const p = interpolate(t, [lineAt(1) - 0.1, lineAt(1) + 1.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return p > 0 && p < 1 ? (
                <g transform={`translate(${880 + p * 700},${ROOF - 200 - Math.sin(p * Math.PI) * 220}) rotate(${p * 720})`}>
                  <FlipFlop />
                </g>
              ) : null;
            })()}
          </g>
        )}
        {beat === 'explain' && (
          <g>
            <Figure char="jonah" x={820} y={ROOF} scale={1} pose={speaking('JONAH') ? 'talk' : 'crossArms'} expression={speaking('JONAH') ? 'ecstatic' : 'curious'} look={[1, -0.3]} />
            <g transform="translate(1250,300)" opacity={ramp(0.6, 0.6)}>
              <circle r={190} fill={HOLO.fill} stroke={HOLO.line} strokeWidth={3} />
              <circle cx={-90} cy={-90} r={20} fill={t < 3 ? '#FF7A3D' : 'none'} stroke={HOLO.line} strokeWidth={3} />
              {Array.from({length: 12}, (_, i) => {
                const p = Math.min(1, Math.max(0, (t - 2.5 - i * 0.12) / 1.2));
                const ex = -140 + (i % 6) * 56;
                const ey = 110 + Math.floor(i / 6) * 40;
                return <path key={i} d={`M-90,-90 Q${ex},-20 ${-90 + (ex + 90) * p},${-90 + (ey + 90) * p}`} stroke={i === 11 ? '#FF9A3C' : HOLO.line} strokeWidth={i === 11 ? 4 : 2} fill="none" />;
              })}
              <g transform="translate(140,140) scale(0.22)">
                <Figure char="jonah" x={0} y={0} pose="armsUp" expression="ecstatic" rim={false} palmGlow={1} />
              </g>
            </g>
          </g>
        )}
        {beat === 'map' && (
          <g>
            <Figure char="jonah" x={780} y={ROOF} scale={1} pose="hold" expression={t > lineAt(1) ? 'serious' : 'curious'} look={[1, -0.3]} holding={<rect x={-30} y={-40} width={60} height={70} rx={10} fill="#C2464F" stroke={C.ink} strokeWidth={3} />} />
            <g opacity={ramp(0.5, 0.6)}>
              <circle cx={1250} cy={290} r={175} fill={HOLO.fill} stroke={HOLO.line} strokeWidth={3} />
              <Globe
                cx={1250}
                cy={290}
                r={150}
                rotate={[-20 + t * 6, -15]}
                frame={frame}
                sun={[20, 0]}
                markers={HEIRS.map((ll, i) => ({lonlat: ll, color: i === 0 ? '#FF9A3C' : C.gold, pulse: i === 0}))}
                dayLand="#3B4A6E"
                dayOcean="#1B2347"
                atmosphere="#F6D58C"
              />
            </g>
          </g>
        )}
        {beat === 'palm' && <PalmCloseUp frame={frame} t={t} lineAt={lineAt} dur={dur} />}

        {time !== 'night' && <Motes frame={frame} count={20} />}
        <Grade time={time} />
      </Camera>
    </Stage>
  );
};

/** The twelve heirs' cities — the threads and markers always land in the same places. */
export const HEIRS: [number, number][] = [
  [3.38, 6.52], // Lagos
  [-1.55, 53.8], // Yorkshire
  [75.79, 26.91], // Jaipur
  [139.69, 35.68], // Tokyo
  [28.97, 41.0], // Istanbul
  [-58.38, -34.6], // Buenos Aires
  [5.37, 43.3], // Marseille
  [-83.05, 42.33], // Detroit
  [20.22, 67.86], // Kiruna
  [104.07, 30.67], // Chengdu
  [-48.5, -1.45], // Pará
  [-71.21, 46.81], // Québec
];

const PalmCloseUp: React.FC<{frame: number; t: number; lineAt: (i: number) => number; dur: number}> = ({frame, t, lineAt}) => {
  const dots = [
    [0, -60],
    [-40, -20],
    [40, -30],
    [-70, 30],
    [10, 10],
    [70, 30],
    [-30, 70],
    [40, 80],
    [-90, -60],
    [90, -80],
    [-10, -110],
    [100, 120],
  ];
  const thirteen = interpolate(t, [lineAt(1) + 1.6, lineAt(1) + 2.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <g>
      <rect x={-400} y={-400} width={2800} height={2000} fill="#05081A" opacity={0.65} />
      <Figure char="jonah" x={560} y={1300} scale={2.6} pose="stand" expression={t > lineAt(1) ? 'surprised' : 'curious'} look={[1, -0.5]} rim />
      <g transform="translate(1000,520)">
        <path d="M-150,260 C-170,120 -180,0 -150,-60 L-140,-230 C-138,-260 -100,-262 -98,-230 L-90,-90 L-70,-280 C-66,-312 -26,-312 -24,-280 L-20,-100 L0,-300 C4,-330 44,-330 46,-298 L40,-90 L70,-250 C76,-280 112,-276 110,-246 L96,-40 C120,-90 160,-100 170,-70 C180,-40 130,40 110,120 C96,180 70,240 60,260 Z" fill="#7A4A2E" stroke={C.ink} strokeWidth={8} />
        <path d="M-110,40 q80,-40 160,10 M-100,110 q70,-20 150,10" stroke="#5E3620" strokeWidth={4} fill="none" />
        <circle r={150} fill="#FF9A3C" opacity={0.12} />
        {dots.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={14} fill="#FF9A3C" opacity={0.25 + 0.1 * Math.sin(frame * 0.2 + i)} />
            <circle cx={x} cy={y} r={5} fill="#FFE2B0" />
          </g>
        ))}
        <g opacity={thirteen * (0.6 + 0.4 * Math.sin(frame * 0.5))}>
          <circle cx={-110} cy={150} r={22} fill="#BFE6FF" opacity={0.35} />
          <circle cx={-110} cy={150} r={6} fill="#FFFFFF" />
        </g>
      </g>
    </g>
  );
};
