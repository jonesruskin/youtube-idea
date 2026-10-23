import React, {useId} from 'react';
import {interpolate} from 'remotion';
import {Dog} from '../../characters/Dog';
import {Figure} from '../../characters/Figure';
import {extra} from '../../characters/registry';
import {useShot} from '../../engine/shot-context';
import {Aurora, Beam, Bloom, Frost, Snow} from '../../fx/cinema/atmos';
import {Cine, Plane, type CamKey} from '../../fx/cinema/camera';
import {C} from '../../theme';
import {Stage} from '../common';
import {ChalkSun, CityBlocks, Flame, NightGrade, NightSky, P} from './parts';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Day 0, low and tilted: the street staring up at a noon full of stars. */
export const Crowd: React.FC = () => {
  const {frame, progress} = useShot();
  const people = [
    {x: 280, s: 1.15, i: 3, pose: 'pointUp'},
    {x: 560, s: 1.3, i: 8, pose: 'handsOnHead'},
    {x: 860, s: 1.0, i: 11, pose: 'stand'},
    {x: 1120, s: 1.4, i: 5, pose: 'pointUp'},
    {x: 1420, s: 1.05, i: 14, pose: 'stand'},
    {x: 1700, s: 1.25, i: 2, pose: 'handsOnHead'},
  ] as const;
  return (
    <Stage bg="#000">
      <Cine keys={[[0, 1.1, 960, 640, -7], [1, 1.2, 960, 560, -3]]} progress={progress} frame={frame} handheld={0.9}>
        <Plane depth={0.1}>
          <NightSky frame={frame} stars={1.3} seed={7} />
        </Plane>
        <Plane depth={0.45}>
          {/* buildings seen from the street, leaning in */}
          {[-200, 330, 1380, 1820].map((x, i) => (
            <g key={x}>
              <path d={`M${x},1100 L${x + (i < 2 ? 60 : -60)},${-300} L${x + (i < 2 ? 420 : 300)},${-300} L${x + 460},1100 Z`} fill={['#151B3E', '#1B2250', '#18204A', '#131938'][i]} stroke={C.ink} strokeWidth={4} />
              {Array.from({length: 24}, (_, k) => (
                <rect key={k} x={x + 60 + (k % 4) * 90 + (i < 2 ? 20 : -20) * (1 - (Math.floor(k / 4) * 170) / 1100)} y={980 - Math.floor(k / 4) * 170} width={44} height={70} fill={(k * 7 + i) % 3 ? '#FFD58A' : '#232B5C'} opacity={0.75} />
              ))}
            </g>
          ))}
          {[700, 1300].map((x) => (
            <g key={x}>
              <rect x={x} y={420} width={10} height={700} fill="#0B1026" />
              <path d={`M${x},430 q40,-20 80,0`} stroke="#0B1026" strokeWidth={10} fill="none" />
              <Bloom x={x + 80} y={440} r={160} color="#FFC873" opacity={0.7} />
              <circle cx={x + 80} cy={440} r={12} fill="#FFF0C8" />
            </g>
          ))}
        </Plane>
        <Plane depth={0.85}>
          {people.map((p, k) => (
            <g key={k}>
              <Figure char={extra(p.i)} x={p.x} y={1150} scale={p.s} pose={p.pose} expression="surprised" look={[0, -1]} seed={k} rim />
              {p.pose === 'pointUp' && <Bloom x={p.x + 60 * p.s} y={1150 - 380 * p.s} r={70} color="#EAF4FF" opacity={0.9} />}
            </g>
          ))}
          <NightGrade amount={0.45} />
        </Plane>
        <Plane depth={1.3} blur={6}>
          <Figure char={extra(21)} x={1500} y={1500} scale={2.4} pose="stand" back rim={false} />
          <NightGrade amount={0.6} />
        </Plane>
      </Cine>
    </Stage>
  );
};

/** The apartment after the light: blankets, the huddle, the bathtub, the balcony, the match. */
export const Apartment: React.FC = () => {
  const {props, frame, t, dur, progress} = useShot();
  const id = useId().replace(/:/g, '');
  const beat = props.beat as string;
  const keys: Record<string, CamKey[]> = {
    blankets: [[0, 1.15, 1000, 520], [1, 1.05, 940, 540]],
    huddle: [[0, 1.35, 960, 520, 6], [1, 1.12, 960, 540, 0]],
    bathtub: [[0, 1.0, 900, 560], [1, 1.16, 1080, 600]],
    balconyFood: [[0, 1.1, 900, 560], [1, 1.22, 1020, 600]],
    match: [[0, 2.2, 980, 470], [1, 2.45, 990, 470]],
  };

  if (beat === 'huddle') {
    const glow = 0.55 + 0.1 * Math.sin(frame * 0.05);
    return (
      <Stage bg="#000">
        <Cine keys={keys.huddle} progress={progress} frame={frame} handheld={0.2}>
          <Plane depth={1}>
            <rect x={-300} y={-300} width={2600} height={1700} fill="#3A2E3A" />
            {Array.from({length: 14}, (_, i) => (
              <rect key={i} x={-300 + i * 200} y={-300} width={6} height={1700} fill="#2E2430" />
            ))}
            {/* mattress */}
            <rect x={360} y={170} width={1200} height={760} rx={40} fill="#E8E2F0" stroke={C.ink} strokeWidth={6} />
            {/* three of you, lying side by side (heads left), seen from above */}
            <Figure char="you" x={1330} y={340} scale={1.3} rotate={-90} pose="stand" expression="warm" look={[0.3, -0.4]} rim={false} seed={1} />
            <Figure char="mira" x={1150} y={720} scale={1.3} rotate={-90} pose="stand" expression={t > dur * 0.5 ? 'happy' : 'warm'} look={[0.3, 0.4]} rim={false} seed={2} />
            <g transform="translate(560,540) rotate(-90)">
              <Dog x={0} y={0} s={0.85} pose="lie" wag={0.3} />
            </g>
            {/* patchwork blanket over everything but the heads */}
            <path d="M1000,180 Q1060,140 1150,170 Q1350,150 1560,190 L1560,920 Q1350,960 1150,930 Q1060,950 1000,920 Q1040,700 990,560 Q1040,380 1000,180 Z" fill="#C2464F" stroke={C.ink} strokeWidth={6} />
            {[
              [1050, 220, '#E8B04B'],
              [1300, 260, '#4FA3A5'],
              [1080, 520, '#3C8D6E'],
              [1320, 560, '#E07A5F'],
              [1100, 780, '#6FA8DC'],
              [1340, 800, '#F2D16B'],
            ].map(([x, y, c], i) => (
              <rect key={i} x={x as number} y={y as number} width={200} height={170} rx={20} fill={c as string} opacity={0.9} stroke={C.ink} strokeWidth={3} strokeDasharray="10 8" />
            ))}
            <NightGrade amount={0.55} color="#1B1640" />
            <Bloom x={1050} y={560} r={700} color="#FF8A3D" opacity={glow * 0.55} />
            <Flame x={300} y={760} s={1.1} frame={frame} kind="lantern" />
          </Plane>
        </Cine>
      </Stage>
    );
  }

  if (beat === 'match') {
    const lit = t > 0.35 && t < dur * 0.72;
    const strike = interpolate(t, [0.35, 0.5], [0, 1], clamp);
    const fl = lit ? 0.85 + 0.15 * Math.sin(frame * 0.7) : 0;
    const smoke = interpolate(t, [dur * 0.72, dur], [0, 1], clamp);
    return (
      <Stage bg="#000">
        <Cine keys={keys.match} progress={progress} frame={frame} handheld={0.5}>
          <Plane depth={1}>
            <rect x={-200} y={-200} width={2400} height={1500} fill="#05060C" />
            <g opacity={lit ? strike : 0.12}>
              <Figure char="you" x={980} y={980} scale={1.6} pose="hold" expression={smoke > 0 ? 'serious' : 'determined'} look={[0.6, 0.6]} hoodUp rim={false} />
            </g>
            {/* camping stove */}
            <g transform="translate(1180,800)">
              <rect x={-90} y={-30} width={180} height={60} rx={10} fill="#3A3F52" stroke={C.ink} strokeWidth={5} opacity={lit ? 1 : 0.3} />
              <circle cx={0} cy={-36} r={46} fill="none" stroke="#5A6278" strokeWidth={8} opacity={lit ? 1 : 0.3} />
            </g>
            {lit && (
              <g>
                <Bloom x={1070} y={560} r={520 * fl} color="#FFB867" opacity={0.75} />
                <path d={`M1070,${580} Q${1062 - 6 * fl},${550} 1070,${520 - 20 * fl} Q${1078 + 6 * fl},550 1070,580 Z`} fill="#FFD27A" />
              </g>
            )}
            <path d="M1070,580 L1110,690" stroke="#E8D3A0" strokeWidth={6} strokeLinecap="round" opacity={0.8} />
            {smoke > 0 &&
              [0, 1, 2].map((k) => (
                <path key={k} d={`M1070,${575 - k * 10} q${-20 + k * 12},-60 ${10 - k * 6},-${120 + smoke * 160} q20,-60 -10,-120`} stroke="#9AA4B8" strokeWidth={6 - k * 1.5} fill="none" opacity={(1 - smoke) * 0.6} strokeLinecap="round" />
              ))}
          </Plane>
        </Cine>
      </Stage>
    );
  }

  if (beat === 'bathtub') {
    const fill = interpolate(t, [0.5, dur - 1], [0.15, 0.85], clamp);
    return (
      <Stage bg="#000">
        <Cine keys={keys.bathtub} progress={progress} frame={frame} handheld={0.35}>
          <Plane depth={1}>
            <rect x={-300} y={-200} width={2600} height={1100} fill="#B9D2DE" />
            {Array.from({length: 26}, (_, i) => (
              <path key={`v${i}`} d={`M${-300 + i * 110},-200 L${-300 + i * 110},900`} stroke="#9DB8C6" strokeWidth={4} />
            ))}
            {Array.from({length: 11}, (_, i) => (
              <path key={`h${i}`} d={`M-300,${-200 + i * 110} L2300,${-200 + i * 110}`} stroke="#9DB8C6" strokeWidth={4} />
            ))}
            <rect x={-300} y={880} width={2600} height={500} fill="#6E8796" />
            {/* mirror, frosting over */}
            <defs>
              <clipPath id={`${id}mir`}>
                <rect x={300} y={140} width={420} height={360} rx={20} />
              </clipPath>
            </defs>
            <rect x={300} y={140} width={420} height={360} rx={20} fill="#DCE9F2" stroke={C.ink} strokeWidth={6} />
            <g clipPath={`url(#${id}mir)`} transform="translate(300,140) scale(0.22,0.33)">
              <Frost amount={0.3 + progress * 0.7} seed={4} />
            </g>
            {/* tub */}
            <rect x={760} y={560} width={980} height={330} rx={90} fill="#F4F7FA" stroke={C.ink} strokeWidth={7} />
            <defs>
              <clipPath id={`${id}tub`}>
                <rect x={790} y={590} width={920} height={270} rx={70} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${id}tub)`}>
              <rect x={760} y={860 - 270 * fill} width={980} height={400} fill="#7FC2E8" opacity={0.85} />
              <path d={`M760,${860 - 270 * fill} q120,${Math.sin(frame * 0.2) * 8} 240,0 t240,0 t240,0 t240,0`} stroke="#E8F6FF" strokeWidth={5} fill="none" />
            </g>
            {/* tap and stream */}
            <path d="M1640,470 L1640,520 Q1640,540 1610,540 L1560,540" stroke="#A9B0BA" strokeWidth={22} fill="none" strokeLinecap="round" />
            <rect x={1548} y={540} width={16} height={860 - 270 * fill - 540} fill="#9FD8FF" opacity={0.85} />
            {/* bottles */}
            {Array.from({length: 9}, (_, i) => (
              <g key={i} transform={`translate(${180 + i * 62},${900})`}>
                <rect x={-20} y={-90} width={40} height={90} rx={10} fill="#7FC2E8" opacity={0.75} stroke={C.ink} strokeWidth={3} />
                <rect x={-9} y={-108} width={18} height={20} rx={4} fill="#3E7CB1" stroke={C.ink} strokeWidth={3} />
              </g>
            ))}
            <Figure char="you" x={1500} y={1000} scale={1.35} pose="hold" expression="determined" look={[-1, 0.3]} breath rim />
            <NightGrade amount={0.62} color="#101A40" />
            <Flame x={140} y={760} s={1} frame={frame} kind="lantern" />
          </Plane>
        </Cine>
      </Stage>
    );
  }

  if (beat === 'balconyFood') {
    return (
      <Stage bg="#000">
        <Cine keys={keys.balconyFood} progress={progress} frame={frame} handheld={0.4}>
          <Plane depth={0.2}>
            <NightSky frame={frame} stars={1} colors={P.coldSky} />
          </Plane>
          <Plane depth={0.5}>
            <CityBlocks seed={44} base={760} color="#101A36" minH={200} maxH={480} lights={0.06} snow={1} frame={frame} />
          </Plane>
          <Plane depth={1}>
            <rect x={-300} y={760} width={2600} height={600} fill="#1A2140" />
            <rect x={-300} y={748} width={2600} height={30} rx={10} fill={P.snow} />
            {/* the little "freezer" table */}
            <rect x={760} y={640} width={420} height={20} fill="#B98454" stroke={C.ink} strokeWidth={4} />
            <rect x={760} y={628} width={420} height={14} rx={6} fill={P.snow} />
            <rect x={790} y={660} width={14} height={110} fill="#8E5E3A" />
            <rect x={1136} y={660} width={14} height={110} fill="#8E5E3A" />
            {[
              [820, 600, 70, 40, '#F2D16B'],
              [910, 590, 80, 50, '#E07A5F'],
              [1010, 606, 60, 34, '#F4EFE6'],
            ].map(([x, y, w, h, c], i) => (
              <rect key={i} x={x as number} y={y as number} width={w as number} height={h as number} rx={6} fill={c as string} stroke={C.ink} strokeWidth={3} />
            ))}
            <ellipse cx={1110} cy={622} rx={46} ry={10} fill="#F4EFE6" stroke={C.ink} strokeWidth={3} />
            {[0, 1, 2].map((k) => (
              <rect key={k} x={1078 + k * 10} y={598 - k * 6} width={44} height={14} rx={7} fill="#C2464F" stroke={C.ink} strokeWidth={2.5} transform={`rotate(${-10 + k * 8},1100,605)`} />
            ))}
            <Dog x={1330} y={800} s={1} pose="sit" flip wag={0.95} lookUp={0.7} breath rim="#9FD8FF" />
            <Figure char="you" x={600} y={820} scale={1.3} pose="point" expression="smug" look={[1, 0]} breath hoodUp rim />
            <NightGrade amount={0.4} color="#101A40" />
          </Plane>
          <Plane depth={1.1}>
            <Snow frame={frame} density={0.4} />
          </Plane>
        </Cine>
      </Stage>
    );
  }

  // blankets
  const cover = interpolate(t, [0.6, dur - 1.5], [0.05, 1], clamp);
  return (
    <Stage bg="#000">
      <Cine keys={keys.blankets} progress={progress} frame={frame} handheld={0.45}>
        <Plane depth={1}>
          <rect x={-300} y={-200} width={2600} height={1120} fill="#5A6A8A" />
          <rect x={-300} y={880} width={2600} height={500} fill="#3A3048" />
          {/* window with stars, being covered */}
          <defs>
            <clipPath id={`${id}win`}>
              <rect x={760} y={160} width={520} height={500} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id}win)`}>
            <NightSky frame={frame} stars={1} x0={700} y0={100} w={700} h={700} />
          </g>
          <rect x={750} y={150} width={540} height={520} fill="none" stroke="#E8E2F0" strokeWidth={22} />
          <rect x={740} y={150} width={560} height={540 * cover} fill="#4FA3A5" stroke={C.ink} strokeWidth={5} />
          {cover > 0.2 && Array.from({length: 6}, (_, i) => <path key={i} d={`M${740 + i * 96},150 q20,${540 * cover * 0.5} 0,${540 * cover}`} stroke="#3C8D8E" strokeWidth={6} fill="none" />)}
          {/* mattress on the floor */}
          <rect x={200} y={820} width={560} height={110} rx={20} fill="#E8E2F0" stroke={C.ink} strokeWidth={5} />
          <Figure char="you" x={1020} y={960} scale={1.35} pose="reach" expression="determined" look={[0, -0.6]} back={false} rim />
          <Figure char="mira" x={500} y={960} scale={1.3} pose="hold" expression="serious" look={[1, -0.2]} rim seed={2} />
          <Dog x={1500} y={960} s={0.9} pose="sit" flip wag={0.3} lookUp={0.3} rim="#9FD8FF" />
          <NightGrade amount={0.6} color="#101A40" />
          <Beam x={260} y={820} angle={-48} len={1000} spread={14} frame={frame} opacity={0.6} />
        </Plane>
      </Cine>
    </Stage>
  );
};

/** The window, close: Mira's finger drawing a sun in the frost (Day 3) — and the frost sun in summer (the reset). */
export const WindowScene: React.FC = () => {
  const {props, frame, t, dur, progress} = useShot();
  const id = useId().replace(/:/g, '');
  const summer = props.beat === 'frostSun';
  const draw = summer ? 1 : interpolate(t, [0.8, Math.min(dur - 0.5, 5)], [0, 1], clamp);
  const melt = summer ? interpolate(t, [0, dur], [0, 0.55], clamp) : 0;
  const fingerT = Math.min(1, draw * 1.2);
  const fa = fingerT * Math.PI * 2;
  return (
    <Stage bg="#000">
      <Cine keys={summer ? [[0, 1.0, 960, 540], [1, 1.25, 1180, 470]] : [[0, 1.1, 1000, 520], [1, 1.2, 1000, 500]]} progress={progress} frame={frame} handheld={0.3}>
        <Plane depth={0.4} blur={summer ? 3 : 8}>
          {summer ? (
            <g>
              <rect x={-300} y={-300} width={2600} height={1700} fill="#7FC2F0" />
              <Bloom x={1500} y={160} r={700} color="#FFF4D0" opacity={0.95} />
              <CityBlocks seed={31} base={1000} color="#A9BFD6" minH={200} maxH={600} lights={0} frame={frame} sunlit="#FFF0D0" />
            </g>
          ) : (
            <g>
              <NightSky frame={frame} stars={1} colors={P.coldSky} />
              <Aurora frame={frame} y={760} intensity={0.9} />
              <CityBlocks seed={12} base={1100} color="#0E1834" minH={200} maxH={520} lights={0.3} snow={1} frame={frame} />
            </g>
          )}
        </Plane>
        <Plane depth={1}>
          <defs>
            <mask id={`${id}m`}>
              <rect x={-300} y={-300} width={2600} height={1700} fill="#FFFFFF" />
              {!summer && <ChalkSun x={1000} y={500} r={130} seed={11} draw={draw} color="#000000" width={34} />}
            </mask>
          </defs>
          {!summer && (
            <g mask={`url(#${id}m)`}>
              <rect x={-300} y={-300} width={2600} height={1700} fill="#DCEBFA" opacity={0.55} />
              <Frost amount={1} seed={6} />
              <Frost amount={1} seed={19} />
            </g>
          )}
          {summer && (
            <g opacity={1 - melt}>
              <ChalkSun x={1180} y={470} r={110} seed={11} color="#F4FAFF" width={28} />
              <g opacity={0.5}>
                <ChalkSun x={1180} y={470} r={110} seed={11} color="#FFFFFF" width={46} />
              </g>
              {[0, 1, 2].map((k) => (
                <path key={k} d={`M${1120 + k * 60},${620} l0,${40 + melt * 200 * (1 + k * 0.4)}`} stroke="#F4FAFF" strokeWidth={6} strokeLinecap="round" opacity={0.7} />
              ))}
            </g>
          )}
          {/* window frame edge */}
          <rect x={-300} y={-300} width={360} height={1700} fill="#E8E2F0" stroke={C.ink} strokeWidth={6} />
          <rect x={-300} y={960} width={2600} height={400} fill="#E8E2F0" stroke={C.ink} strokeWidth={6} />
          {!summer && draw < 1 && (
            <g transform={`translate(${1000 + Math.cos(fa - Math.PI / 2) * 130},${500 + Math.sin(fa - Math.PI / 2) * 130}) rotate(-28)`}>
              {/* sleeve */}
              <path d="M40,190 L150,560" stroke={C.ink} strokeWidth={150} strokeLinecap="round" />
              <path d="M40,190 L150,560" stroke="#5E8FC9" strokeWidth={140} strokeLinecap="round" />
              <path d="M10,170 Q50,140 95,180" stroke="#F4EFE6" strokeWidth={26} fill="none" strokeLinecap="round" />
              {/* hand: fist with the index finger out */}
              <ellipse cx={40} cy={110} rx={62} ry={70} fill="#A26B45" stroke={C.ink} strokeWidth={6} />
              {[0, 1, 2].map((k) => (
                <path key={k} d={`M${-2 + k * 24},${70} q10,-14 20,0`} stroke="#82502F" strokeWidth={5} fill="none" />
              ))}
              <path d="M10,60 L0,0" stroke={C.ink} strokeWidth={36} strokeLinecap="round" />
              <path d="M10,60 L0,0" stroke="#A26B45" strokeWidth={26} strokeLinecap="round" />
              <ellipse cx={1} cy={2} rx={7} ry={5} fill="#E8B9A0" />
            </g>
          )}
          {!summer && <rect x={-300} y={-300} width={2600} height={1700} fill="#3EE8A0" opacity={0.05} style={{mixBlendMode: 'screen'}} />}
        </Plane>
      </Cine>
    </Stage>
  );
};

/** The radio: the one station that isn't static. */
export const RadioScene: React.FC = () => {
  const {props, frame, t, progress, speaking} = useShot();
  const tunnel = props.beat === 'lookUp';
  const talk = speaking('RADIO');
  const needle = interpolate(t, [0.2, 2.6], [0.08, 0.63], clamp) + (t < 2.6 ? Math.sin(frame * 0.6) * 0.01 : 0);
  const eye = talk ? 0.6 + 0.4 * Math.abs(Math.sin(frame * 0.9)) : 0.15;
  return (
    <Stage bg="#000">
      <Cine keys={[[0, 1.05, 960, 560], [1, 1.22, 960, 520]]} progress={progress} frame={frame} handheld={0.3}>
        <Plane depth={0.3} blur={10}>
          <rect x={-300} y={-300} width={2600} height={1700} fill={tunnel ? '#2A1A14' : '#0D0C16'} />
          {(tunnel ? ['#FFB25A', '#FFD49A', '#FF8E4A', '#FFE08A'] : ['#FFB867']).map((c, i) =>
            Array.from({length: tunnel ? 6 : 2}, (_, k) => <circle key={`${i}${k}`} cx={200 + ((i * 431 + k * 307) % 1600)} cy={160 + ((i * 197 + k * 251) % 500)} r={40 + ((i + k) % 3) * 25} fill={c} opacity={0.4} />),
          )}
        </Plane>
        <Plane depth={1}>
          <rect x={-300} y={820} width={2600} height={500} fill={tunnel ? '#4A3426' : '#2A1E1A'} />
          <g transform="translate(960,640)">
            <rect x={-520} y={-300} width={1040} height={480} rx={60} fill="#8E5E3A" stroke={C.ink} strokeWidth={8} />
            <rect x={-490} y={-272} width={980} height={424} rx={44} fill="#A26B45" />
            {/* speaker grille */}
            <rect x={-450} y={-230} width={420} height={340} rx={30} fill="#3A2A22" stroke={C.ink} strokeWidth={5} />
            {Array.from({length: 11}, (_, i) => (
              <path key={i} d={`M-440,${-210 + i * 30} L-40,${-210 + i * 30}`} stroke="#5A4033" strokeWidth={8} />
            ))}
            {/* dial window */}
            <rect x={20} y={-220} width={430} height={150} rx={20} fill="#FFD08A" stroke={C.ink} strokeWidth={5} opacity={0.95} />
            {Array.from({length: 21}, (_, i) => (
              <path key={i} d={`M${45 + i * 19},-200 L${45 + i * 19},${i % 5 ? -180 : -165}`} stroke="#7A4A2E" strokeWidth={3} />
            ))}
            <path d={`M${40 + needle * 400},-215 L${40 + needle * 400},-78`} stroke="#C2464F" strokeWidth={6} />
            {/* magic-eye tuning light */}
            <circle cx={235} cy={20} r={52} fill="#0E1F16" stroke={C.ink} strokeWidth={5} />
            <circle cx={235} cy={20} r={40 * eye} fill="#7DFFB2" opacity={0.9} />
            {[100, 370].map((x) => (
              <g key={x}>
                <circle cx={x} cy={90} r={46} fill="#5A4033" stroke={C.ink} strokeWidth={5} />
                <path d={`M${x},90 L${x + 30},70`} stroke="#F4EFE6" strokeWidth={5} />
              </g>
            ))}
          </g>
          <Bloom x={1195} y={500} r={340} color="#FFC27A" opacity={0.45} />
          {talk && <Bloom x={1195} y={660} r={220} color="#7DFFB2" opacity={0.4 * eye} />}
          <NightGrade amount={tunnel ? 0.25 : 0.4} color="#2A1A2E" />
          {!tunnel && <Flame x={260} y={830} s={1.2} frame={frame} />}
        </Plane>
      </Cine>
    </Stage>
  );
};

