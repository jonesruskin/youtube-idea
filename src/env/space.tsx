import React, {useMemo} from 'react';
import {interpolate} from 'remotion';
import {Figure} from '../characters/Figure';
import {extra} from '../characters/registry';
import {useShot} from '../engine/shot-context';
import {Camera} from '../fx/camera';
import {Globe, type GlobeArc, type GlobeMarker} from '../fx/globe';
import {Cloud, Glow, NightGradient, Orion, rand, Stars} from '../fx/sky';
import {Executor, Ship} from '../fx/vey';
import {C, fonts} from '../theme';
import {Skyline, Stage, Stamp} from './common';

/** Orion over Lagos rooftops; mode 'blink' switches Betelgeuse off. */
export const Sky: React.FC = () => {
  const {frame, props, progress, t, ramp, lineAt} = useShot();
  const blink = props.mode === 'blink';
  const bet = blink ? interpolate(t, [0.6, 0.75], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  const lines = blink ? 0.35 : ramp(0.5, 2) * 0.45;
  return (
    <Stage>
      <defs>
        <NightGradient id="skyG" top="#03050F" bottom="#1C1A4A" />
      </defs>
      <Camera progress={progress} from={blink ? [1.35, 760, 330] : [1, 960, 480]} to={blink ? [1.5, 760, 320] : [1.18, 900, 430]}>
        <rect x={-200} y={-200} width={2400} height={1500} fill="url(#skyG)" />
        <Stars frame={frame} count={360} maxR={2} />
        <Orion cx={960} cy={430} scale={52} frame={frame} betelgeuse={bet} lines={lines} />
        {!blink && (
          <g opacity={ramp(lineAt(1), 0.5)}>
            <circle cx={960 - (88.79 - 83.8) * 52} cy={430 - 7.41 * 52} r={46} fill="none" stroke={C.betelgeuse} strokeWidth={3} strokeDasharray="8 8" />
            <text x={960 - (88.79 - 83.8) * 52 - 60} y={430 - 7.41 * 52 - 60} textAnchor="end" fill={C.betelgeuse} fontFamily={fonts.ui} fontWeight={700} fontSize={38}>
              BETELGEUSE
            </text>
          </g>
        )}
        {blink && t > 1.4 && (
          <g opacity={ramp(1.4, 1)}>
            <circle cx={960 - (88.79 - 83.8) * 52} cy={430 - 7.41 * 52} r={40} fill="none" stroke={C.pearl} strokeOpacity={0.6} strokeWidth={2.5} strokeDasharray="4 10" />
          </g>
        )}
        <Skyline seed={51} base={1020} color="#080B1E" window="#FFB45E" style="lagos" minH={60} maxH={200} litChance={0.12} frame={frame} />
      </Camera>
    </Stage>
  );
};

/** Four cities, one sky: everyone noticed. */
export const WorldMontage: React.FC = () => {
  const {frame, t} = useShot();
  const cities = [
    {name: 'MUMBAI', style: 'tower' as const, seed: 61, hue: '#2A1E52'},
    {name: 'SÃO PAULO', style: 'tower' as const, seed: 62, hue: '#1E2A5E'},
    {name: 'LONDON', style: 'nyc' as const, seed: 63, hue: '#16224E'},
    {name: 'LAGOS', style: 'lagos' as const, seed: 64, hue: '#241C4E'},
  ];
  return (
    <Stage bg={C.ink}>
      {cities.map((c, i) => {
        const x = (i % 2) * 960;
        const y = Math.floor(i / 2) * 540;
        const appear = interpolate(t, [i * 0.5, i * 0.5 + 0.4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (
          <g key={c.name} opacity={appear}>
            <svg x={x} y={y} width={960} height={540} viewBox="0 0 1920 1080">
              <rect width={1920} height={1080} fill={c.hue} />
              <Stars frame={frame} seed={c.seed} count={160} />
              <g transform="translate(-180,-120)">
                <Orion cx={1100} cy={420} scale={34} frame={frame} betelgeuse={0} lines={0.25} />
                <circle cx={1100 - (88.79 - 83.8) * 34} cy={420 - 7.41 * 34} r={26} fill="none" stroke={C.pearl} strokeOpacity={0.5} strokeWidth={2.5} strokeDasharray="4 8" />
              </g>
              <Skyline seed={c.seed} base={900} color="#0A0E26" window="#FFC873" style={c.style} minH={140} maxH={420} litChance={0.3} frame={frame} />
              <rect y={900} width={1920} height={200} fill="#0A0E26" />
              {[0, 1, 2].map((k) => (
                <Figure key={k} char={extra(c.seed + k)} x={760 + k * 220} y={1000} scale={0.95} pose={k === 1 ? 'pointUp' : 'stand'} expression="surprised" look={[0.4, -1]} seed={k + i} rim={false} />
              ))}
              <text x={60} y={110} fill={C.gold} fontFamily={fonts.mono} fontWeight={600} fontSize={60} letterSpacing={6}>
                {c.name}
              </text>
            </svg>
            <rect x={x} y={y} width={960} height={540} fill="none" stroke={C.ink} strokeWidth={10} />
          </g>
        );
      })}
    </Stage>
  );
};

/** Every radio on Earth, same broadcast. */
export const Broadcast: React.FC = () => {
  const {frame, progress, t} = useShot();
  const wave = (w: number, amp: number, phase = 0) =>
    Array.from({length: 60}, (_, i) => {
      const x = (i / 59) * w;
      const y = Math.sin(i * 0.6 + frame * 0.35 + phase) * amp * (0.4 + 0.6 * Math.abs(Math.sin(i * 0.17 + frame * 0.05)));
      return `${i ? 'L' : 'M'}${x},${y}`;
    }).join(' ');
  const devices = [
    {x: 230, y: 560, w: 260, label: 'RADIO', body: '#8C5A3C'},
    {x: 600, y: 560, w: 260, label: 'CAR', body: '#3E7CB1'},
    {x: 970, y: 560, w: 260, label: 'PHONE', body: '#1B1F2E'},
    {x: 1340, y: 560, w: 260, label: 'TV', body: '#2B2E3A'},
  ];
  return (
    <Stage bg={C.ink}>
      <Camera progress={progress} from={[1, 960, 540]} to={[1.08, 960, 560]}>
        <Stars frame={frame} count={200} opacity={0.6} />
        {[0, 1, 2, 3].map((k) => {
          const p = ((t * 0.5 + k / 4) % 1);
          return <circle key={k} cx={1780} cy={120} r={80 + p * 1500} fill="none" stroke={C.gold} strokeOpacity={(1 - p) * 0.5} strokeWidth={4} />;
        })}
        <Glow id="bcSrc" cx={1780} cy={120} r={120} color="#FFF4D6" />
        {devices.map((d, i) => {
          const on = interpolate(t, [0.3 + i * 0.25, 0.5 + i * 0.25], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <g key={d.label} transform={`translate(${d.x},${d.y})`}>
              <rect x={0} y={0} width={d.w + 70} height={220} rx={24} fill={d.body} stroke={C.ink} strokeWidth={6} />
              <rect x={20} y={30} width={d.w + 30} height={130} rx={12} fill="#0B1026" stroke={C.ink} strokeWidth={4} />
              <g transform={`translate(35,95)`} opacity={on}>
                <path d={wave(d.w, 46, i)} stroke={C.gold} strokeWidth={5} fill="none" />
              </g>
              <text x={(d.w + 70) / 2} y={200} textAnchor="middle" fill={C.pearl} fontFamily={fonts.mono} fontSize={24} letterSpacing={4}>
                {d.label}
              </text>
            </g>
          );
        })}
        <text x={960} y={940} textAnchor="middle" fill={C.pearl} fontFamily={fonts.mono} fontSize={38} letterSpacing={8} opacity={interpolate(t, [1.5, 2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
          SOURCE: OUTER SOLAR SYSTEM
        </text>
      </Camera>
    </Stage>
  );
};

/** Comic vignettes of the global frenzy. */
export const Frenzy: React.FC = () => {
  const {frame, t, lineAt} = useShot();
  const panelIn = (k: number) => interpolate(t, [lineAt(1) - 0.2 + k * 1.6, lineAt(1) + k * 1.6 + 0.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const count = Math.min(8_000_000_000, Math.floor(interpolate(t, [0, 2.5], [12, 8_000_000_000], {extrapolateRight: 'clamp'})));
  return (
    <Stage bg={C.ink}>
      <g opacity={1 - panelIn(0)}>
        <text x={960} y={420} textAnchor="middle" fill={C.gold} fontFamily={fonts.mono} fontSize={44} letterSpacing={8}>
          HEIRS: 12
        </text>
        <text x={960} y={560} textAnchor="middle" fill={C.pearl} fontFamily={fonts.display} fontWeight={900} fontSize={120}>
          {count.toLocaleString('en-US')}
        </text>
        <text x={960} y={650} textAnchor="middle" fill={C.pearl} opacity={0.7} fontFamily={fonts.mono} fontSize={40} letterSpacing={8}>
          CANDIDATES
        </text>
      </g>
      {/* Panel 1: under the bed */}
      <g opacity={panelIn(0)}>
        <svg x={30} y={150} width={600} height={780} viewBox="0 0 600 780">
          <rect width={600} height={780} fill="#3B3357" />
          <rect y={560} width={600} height={220} fill="#4A3B4F" />
          <rect x={60} y={430} width={480} height={130} rx={12} fill="#6C7FB0" stroke={C.ink} strokeWidth={6} />
          <rect x={80} y={560} width={20} height={60} fill="#5B3A2A" />
          <rect x={500} y={560} width={20} height={60} fill="#5B3A2A" />
          <Figure char={extra(71)} x={300} y={680} scale={0.75} pose="reach" expression="curious" rotate={-78} seed={1} rim={false} />
          <path d="M260,610 L120,560 L120,660 Z" fill="#FFF3C8" opacity={0.35} />
          <text x={30} y={60} fill={C.gold} fontFamily={fonts.mono} fontWeight={600} fontSize={34}>
            MUMBAI
          </text>
        </svg>
      </g>
      {/* Panel 2: queue at a post office */}
      <g opacity={panelIn(0.5)}>
        <svg x={660} y={150} width={600} height={780} viewBox="0 0 600 780">
          <rect width={600} height={780} fill="#7FB6E0" />
          <rect y={520} width={600} height={260} fill="#C8A27A" />
          <rect x={380} y={240} width={200} height={290} fill="#E9E4F0" stroke={C.ink} strokeWidth={6} />
          <text x={480} y={290} textAnchor="middle" fill={C.ink} fontFamily={fonts.display} fontWeight={900} fontSize={26}>
            CORREIOS
          </text>
          {Array.from({length: 6}, (_, i) => (
            <Figure key={i} char={extra(80 + i)} x={330 - i * 62} y={640 + (i % 2) * 6} scale={0.55} pose={i === 0 ? 'point' : 'stand'} expression="nervous" seed={i} rim={false} />
          ))}
          <text x={30} y={60} fill={C.ink} fontFamily={fonts.mono} fontWeight={600} fontSize={34}>
            SÃO PAULO
          </text>
        </svg>
      </g>
      {/* Panel 3: Ohio garden */}
      <g opacity={panelIn(1.2)}>
        <svg x={1290} y={150} width={600} height={780} viewBox="0 0 600 780">
          <rect width={600} height={780} fill="#1E2A5E" />
          <Stars frame={frame} count={40} w={600} h={400} />
          <rect y={480} width={600} height={300} fill="#3C6E4A" />
          {Array.from({length: 9}, (_, i) => (
            <ellipse key={i} cx={60 + (i % 3) * 200 + (Math.floor(i / 3) % 2) * 60} cy={540 + Math.floor(i / 3) * 80} rx={60} ry={22} fill="#6B4A2E" stroke={C.ink} strokeWidth={4} />
          ))}
          <Figure char={extra(90, {topColor: '#C2464F'})} x={300} y={700} scale={0.8} pose="hold" expression="determined" seed={3} rim={false} />
          <line x1={340} y1={520} x2={380} y2={700} stroke="#8A5A3C" strokeWidth={10} />
          <text x={30} y={60} fill={C.gold} fontFamily={fonts.mono} fontWeight={600} fontSize={34}>
            OHIO
          </text>
        </svg>
      </g>
    </Stage>
  );
};

/** Climbing through the Kármán line. */
export const Atmosphere: React.FC = () => {
  const {frame, t, ramp} = useShot();
  const alt = Math.min(100, Math.floor(interpolate(t, [0, 3.2], [12, 100], {extrapolateRight: 'clamp'})));
  const sky = interpolate(alt, [12, 100], [0, 1]);
  const mix = (a: number[], b: number[]) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * sky)).join(',')})`;
  return (
    <Stage bg="#000">
      <rect width={1920} height={1080} fill={mix([30, 60, 140], [2, 3, 10])} />
      <Stars frame={frame} count={300} opacity={sky} />
      {/* Earth curve */}
      <ellipse cx={960} cy={2400 - sky * 300} rx={2600} ry={1500} fill="#0E1A3A" />
      <ellipse cx={960} cy={2400 - sky * 300} rx={2600} ry={1500} fill="none" stroke="#7FD6FF" strokeWidth={30} strokeOpacity={0.35} />
      <ellipse cx={960} cy={2400 - sky * 300} rx={2600} ry={1500} fill="none" stroke="#BFF2FF" strokeWidth={6} strokeOpacity={0.8} />
      {Array.from({length: 6}, (_, i) => (
        <Cloud key={i} x={((i * 400 - frame * 3) % 2400) + 100} y={1000 - sky * 120 + (i % 2) * 40} s={0.8} color="#E6EEF8" opacity={0.25 * (1 - sky * 0.5)} />
      ))}
      <line x1={0} x2={1920} y1={720} y2={720} stroke={C.gold} strokeWidth={3} strokeDasharray="14 12" opacity={ramp(2.8, 0.4)} />
      <text x={1880} y={705} textAnchor="end" fill={C.gold} fontFamily={fonts.mono} fontSize={30} opacity={ramp(2.8, 0.4)}>
        KÁRMÁN LINE · 100 KM
      </text>
      <Ship x={960} y={interpolate(t, [0, 3.2], [900, 520], {extrapolateRight: 'clamp'})} scale={0.8} frame={frame} tilt={-8} />
      <Stamp text={`ALTITUDE  ${String(alt).padStart(3, ' ')} KM`} />
    </Stage>
  );
};

const LAGOS: [number, number] = [3.38, 6.52];
const ACCRA: [number, number] = [-0.19, 5.6];

/** Orthographic Earth. Modes: africa | clock | west | west2 | mayday | sunrise. */
export const GlobeScene: React.FC = () => {
  const {frame, props, t, dur, ramp, progress} = useShot();
  const mode = props.mode as string;
  let rotate: [number, number] = [-10, -5];
  let sun: [number, number] = [152, -11];
  let r = 430;
  let markers: GlobeMarker[] = [];
  let arcs: GlobeArc[] = [];
  let clock: string | null = null;
  let sub: string | null = null;
  if (mode === 'africa') {
    rotate = [interpolate(t, [0, dur], [-30, -12]), -8];
    r = interpolate(t, [0, dur], [380, 470]);
    markers = [{lonlat: LAGOS, label: 'Lagos', pulse: true, color: C.coral}];
  } else if (mode === 'clock') {
    rotate = [-8, -6];
    const hh = interpolate(t, [0, dur], [2 + 51 / 60, 3 + 1 / 60]);
    sun = [-(hh - 1 - 12) * 15, -11];
    clock = `${Math.floor(hh)}:${String(Math.floor((hh % 1) * 60)).padStart(2, '0')} AM`;
    sub = 'SUNRISE IN LAGOS · 6:42 AM';
    markers = [{lonlat: LAGOS, label: 'Lagos', pulse: true, color: C.coral}];
  } else if (mode === 'west' || mode === 'west2') {
    const k = mode === 'west' ? progress * 0.6 : 0.6 + progress * 0.4;
    rotate = [interpolate(k, [0, 1], [-5, 85]), -25];
    sun = [100, -11];
    arcs = [
      {from: LAGOS, to: [5, 23], progress: Math.min(1, k * 4)},
      {from: [5, 23], to: [-74, 40.7], progress: Math.max(0, Math.min(1, (k - 0.2) * 2))},
      {from: [-74, 40.7], to: [-95, 58], progress: Math.max(0, Math.min(1, (k - 0.7) * 3.4))},
    ];
    markers = [
      {lonlat: LAGOS, label: 'Lagos', color: C.coral},
      {lonlat: [5, 23], label: k > 0.15 ? 'Sahara' : undefined, color: C.gold},
      ...(k > 0.6 ? [{lonlat: [-74, 40.7] as [number, number], label: 'New York', color: C.gold}] : []),
    ];
  } else if (mode === 'mayday') {
    rotate = [-1.6, -5];
    r = 3200;
    sun = [-(5 + 40 / 60 - 1 - 12) * 15, -11];
    markers = [
      {lonlat: LAGOS, label: 'Home', color: C.coral},
      {lonlat: [ACCRA[0], ACCRA[1] - 0.6], label: 'MAYDAY', color: C.stamp, pulse: true},
    ];
    clock = '5:40 AM';
    sub = 'SUNRISE IN LAGOS · 6:42 AM';
  } else if (mode === 'sunrise') {
    rotate = [-1.6, -5];
    r = 3200;
    const hh = interpolate(t, [0, dur], [6 + 31 / 60, 6 + 33 / 60]);
    sun = [-(hh - 1 - 12) * 15 - 4, -11];
    markers = [
      {lonlat: LAGOS, label: 'Home', color: C.coral, pulse: true},
      {lonlat: ACCRA, label: 'Jonah', color: C.gold},
    ];
    arcs = [{from: ACCRA, to: LAGOS, progress: 1, dashed: true, color: C.pearl}];
    clock = `6:${String(31 + Math.floor((hh % 1) * 60) - 31).padStart(2, '0')} AM`;
    sub = 'SUNRISE IN LAGOS · 11 MINUTES';
  }
  return (
    <Stage bg="#02030A">
      <Stars frame={frame} count={420} maxR={1.8} />
      <Globe cx={960} cy={mode === 'mayday' || mode === 'sunrise' ? 560 : 560} r={r} rotate={rotate} frame={frame} sun={sun} markers={markers} arcs={arcs} />
      {(mode === 'west' || mode === 'west2' || mode === 'africa') && (
        <Ship x={mode === 'africa' ? 1500 : 1560} y={mode === 'africa' ? 220 : 200} scale={0.45} frame={frame} tilt={mode === 'africa' ? 10 : -4} flip={mode !== 'africa'} />
      )}
      {clock && (
        <g opacity={ramp(0.2, 0.4)}>
          <rect x={60} y={60} width={520} height={170} rx={18} fill="#0B1026DD" stroke={C.gold} strokeWidth={3} />
          <text x={100} y={160} fill={C.pearl} fontFamily={fonts.display} fontWeight={900} fontSize={76}>
            {clock}
          </text>
          <text x={100} y={208} fill={C.gold} fontFamily={fonts.mono} fontSize={24} letterSpacing={2}>
            {sub}
          </text>
        </g>
      )}
    </Stage>
  );
};

/** Sahara: dunes under a dusty sky. Beat 'close' shows the dark gap in Orion. */
export const Desert: React.FC = () => {
  const {frame, props, progress, speaking, ramp, lineAt, t} = useShot();
  const close = props.beat === 'close';
  const mw = useMemo(() => {
    const r = rand(5);
    return Array.from({length: 900}, () => {
      const u = r();
      const spread = (r() - 0.5) * 220 * (0.5 + r());
      return {x: -100 + u * 2200, y: 820 - u * 900 + spread, r: 0.4 + r() * 1.3, o: 0.3 + r() * 0.7};
    });
  }, []);
  return (
    <Stage>
      <defs>
        <NightGradient id="dSky" top="#02030C" bottom="#2C2457" />
        <linearGradient id="mwBand" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#B9A6FF" stopOpacity={0} />
          <stop offset="0.5" stopColor="#B9A6FF" stopOpacity={0.22} />
          <stop offset="1" stopColor="#B9A6FF" stopOpacity={0} />
        </linearGradient>
      </defs>
      <Camera progress={progress} from={close ? [1.2, 1100, 600] : [1, 960, 540]} to={close ? [1.3, 1100, 580] : [1.08, 960, 520]}>
        <rect x={-200} y={-200} width={2400} height={1500} fill="url(#dSky)" />
        <path d="M-200,1000 L2100,-150 L2300,150 L0,1300 Z" fill="url(#mwBand)" />
        {mw.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFF6E0" opacity={s.o * (0.7 + 0.3 * Math.sin(frame * 0.07 + i))} />
        ))}
        <Stars frame={frame} count={420} maxR={2.2} seed={13} />
        <Orion cx={1380} cy={300} scale={30} frame={frame} betelgeuse={0} lines={close ? ramp(lineAt(1), 1) * 0.4 : 0} />
        {close && (
          <g opacity={ramp(lineAt(1), 0.8)}>
            <circle cx={1380 - (88.79 - 83.8) * 30} cy={300 - 7.41 * 30} r={26} fill="none" stroke={C.betelgeuse} strokeWidth={3} strokeDasharray="5 7" />
          </g>
        )}
        <path d="M-200,820 C200,740 520,760 860,820 C1200,880 1500,760 2100,800 L2100,1300 L-200,1300 Z" fill="#3A2A3E" />
        <path d="M-200,900 C300,860 700,900 1100,960 C1500,1010 1800,920 2100,940 L2100,1300 L-200,1300 Z" fill="#4A3346" />
        <Ship x={520} y={800} scale={0.8} frame={frame} glow={0.6} />
        <g transform="translate(1180,905) rotate(-90)">
          <Figure char="jonah" x={0} y={0} scale={0.85} pose={close && t > lineAt(0) ? 'pointUp' : 'lie'} expression={close ? (t > lineAt(1) ? 'serious' : 'curious') : 'warm'} talking={speaking('JONAH')} look={[0.6, -1]} />
        </g>
        {close && <Executor x={900} y={720} scale={0.45} frame={frame} speaking={speaking('EXECUTOR')} />}
      </Camera>
    </Stage>
  );
};

/** New York, "still yesterday": the ship slides past the skyline. */
export const CityNight: React.FC = () => {
  const {frame, progress, t, dur} = useShot();
  return (
    <Stage>
      <defs>
        <NightGradient id="nySky" top="#0A0D2A" bottom="#5B3A7A" />
      </defs>
      <Camera progress={progress} from={[1, 960, 540]} to={[1.06, 960, 540]}>
        <rect x={-200} y={-200} width={2400} height={1500} fill="url(#nySky)" />
        <Stars frame={frame} count={90} opacity={0.6} />
        <circle cx={1500} cy={220} r={46} fill="#F4EFE6" opacity={0.95} />
        <Skyline seed={71} base={880} color="#1A1640" window="#FFD58A" style="nyc" minH={220} maxH={640} litChance={0.45} frame={frame} />
        <Skyline seed={72} base={960} color="#100E2C" window="#FFC873" style="nyc" minH={140} maxH={380} litChance={0.35} frame={frame} />
        <rect x={-200} y={960} width={2400} height={300} fill="#0C1A3A" />
        {Array.from({length: 30}, (_, i) => (
          <rect key={i} x={i * 70 + ((frame * 2) % 70)} y={990 + (i % 3) * 18} width={30} height={4} fill="#FFD58A" opacity={0.4} />
        ))}
        <Ship x={interpolate(t, [0, dur], [2200, -300])} y={360} scale={0.9} frame={frame} flip tilt={-3} />
      </Camera>
      <Stamp text="NEW YORK · 9:58 PM" sub="(YESTERDAY)" />
    </Stage>
  );
};

/** The aurora from above — a river, not a curtain. */
export const Aurora: React.FC = () => {
  const {frame, progress, speaking} = useShot();
  const ribbon = (k: number) =>
    Array.from({length: 40}, (_, i) => {
      const x = -200 + i * 62;
      const y = 760 + k * 50 + Math.sin(i * 0.35 + frame * 0.04 + k) * 50;
      return `${i ? 'L' : 'M'}${x},${y}`;
    }).join(' ');
  return (
    <Stage bg="#02030A">
      <Camera progress={progress} from={[1, 960, 540]} to={[1.1, 960, 560]}>
        <Stars frame={frame} count={360} />
        <ellipse cx={960} cy={1900} rx={2200} ry={1150} fill="#07122A" />
        <ellipse cx={960} cy={1900} rx={2200} ry={1150} fill="none" stroke="#5CC8FF" strokeOpacity={0.4} strokeWidth={14} />
        {[0, 1, 2].map((k) => (
          <g key={k}>
            <path d={ribbon(k)} stroke="#4CFFB0" strokeWidth={70 - k * 16} strokeOpacity={0.18} fill="none" strokeLinecap="round" />
            <path d={ribbon(k)} stroke="#7DFFC4" strokeWidth={14} strokeOpacity={0.5} fill="none" strokeLinecap="round" />
            <path d={ribbon(k)} stroke="#C79BFF" strokeWidth={6} strokeOpacity={0.4} fill="none" transform="translate(0,-26)" />
          </g>
        ))}
        <Ship
          x={960}
          y={420}
          scale={1.4}
          frame={frame}
          tilt={4}
          pilot={<Figure char="jonah" x={30} y={46} scale={0.32} pose={speaking('JONAH') ? 'pilotJoy' : 'pilot'} expression={speaking('JONAH') ? 'ecstatic' : 'happy'} talking={speaking('JONAH')} rim={false} look={[0, 1]} />}
        />
      </Camera>
    </Stage>
  );
};

const MoonGround: React.FC<{frame: number; horizon?: number}> = ({horizon = 760}) => {
  const craters = useMemo(() => {
    const r = rand(17);
    return Array.from({length: 26}, () => ({x: r() * 2200 - 100, y: horizon + 30 + r() * 300, rx: 30 + r() * 120}));
  }, [horizon]);
  return (
    <g>
      <path d={`M-200,${horizon} C300,${horizon - 30} 700,${horizon + 10} 1100,${horizon - 20} C1500,${horizon - 40} 1800,${horizon} 2200,${horizon - 10} L2200,1400 L-200,1400 Z`} fill="#9A9A9E" />
      <path d={`M-200,${horizon + 60} C500,${horizon + 40} 1300,${horizon + 90} 2200,${horizon + 50} L2200,1400 L-200,1400 Z`} fill="#86868B" />
      {craters.map((c, i) => (
        <g key={i}>
          <ellipse cx={c.x} cy={c.y} rx={c.rx} ry={c.rx * 0.25} fill="#6E6E74" />
          <ellipse cx={c.x + 4} cy={c.y - 3} rx={c.rx * 0.9} ry={c.rx * 0.2} fill="#7A7A80" />
        </g>
      ))}
    </g>
  );
};

const EarthDisc: React.FC<{x: number; y: number; r: number; frame: number}> = ({x, y, r, frame}) => (
  <g>
    <Globe cx={x} cy={y} r={r} rotate={[-10 + frame * 0.05, -10]} frame={frame} sun={[60, -11]} />
  </g>
);

export const MoonApproach: React.FC = () => {
  const {frame, t, dur} = useShot();
  const s = interpolate(t, [0, dur], [0.25, 2.6], {easing: (x) => x * x});
  return (
    <Stage bg="#000">
      <Stars frame={frame} count={420} maxR={1.6} />
      <EarthDisc x={300} y={820} r={120} frame={frame} />
      <g transform={`translate(1150,470) scale(${s})`}>
        <circle r={300} fill="#BDBDC2" stroke={C.ink} strokeWidth={6 / s} />
        {[
          [-90, -60, 60],
          [70, 40, 80],
          [-30, 120, 40],
          [120, -110, 36],
          [-160, 60, 30],
        ].map(([cx, cy, cr], i) => (
          <circle key={i} cx={cx} cy={cy} r={cr} fill="#9E9EA4" />
        ))}
        <path d="M60,-290 A300,300 0 0,1 60,290 A220,300 0 0,0 60,-290" fill="#000" opacity={0.35} />
      </g>
      <Ship x={interpolate(t, [0, dur], [420, 1050])} y={interpolate(t, [0, dur], [720, 520])} scale={interpolate(t, [0, dur], [0.5, 0.2])} frame={frame} tilt={-14} />
    </Stage>
  );
};

/** On the Moon. Beats: bubble | earth | footprints. */
export const MoonScene: React.FC = () => {
  const {frame, props, progress, t} = useShot();
  const beat = props.beat as string;
  const hop = beat === 'bubble' ? Math.abs(Math.sin(t * 1.4)) * 140 : 0;
  return (
    <Stage bg="#000">
      <Camera progress={progress} from={beat === 'footprints' ? [1.25, 1100, 700] : [1, 960, 540]} to={beat === 'footprints' ? [1.35, 1100, 720] : [1.08, 960, 520]}>
        <Stars frame={frame} count={420} maxR={1.6} />
        <EarthDisc x={beat === 'earth' ? 1290 : 1500} y={beat === 'earth' ? 330 : 220} r={beat === 'earth' ? 150 : 100} frame={frame} />
        <MoonGround frame={frame} />
        <Ship x={360} y={700} scale={0.9} frame={frame} glow={0.5} />
        {beat === 'bubble' && (
          <g>
            <circle cx={980} cy={720 - hop} r={210} fill="#BFF2FF" fillOpacity={0.08} stroke="#BFF2FF" strokeOpacity={0.5} strokeWidth={4} />
            <Figure char="jonah" x={980} y={880 - hop} scale={0.95} pose={hop > 60 ? 'armsUp' : 'stand'} expression="ecstatic" />
            <ellipse cx={980} cy={884} rx={70 - hop * 0.3} ry={12} fill="#000" opacity={0.3} />
          </g>
        )}
        {beat === 'earth' && (
          <g>
            <circle cx={820} cy={740} r={200} fill="#BFF2FF" fillOpacity={0.06} stroke="#BFF2FF" strokeOpacity={0.35} strokeWidth={3} />
            <Figure char="jonah" x={820} y={880} scale={0.95} pose="pointUp" expression="warm" look={[1, -1]} />
            {/* the thumb covering Earth, foreground */}
            <g opacity={interpolate(t, [3.5, 4.3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
              {/* a clear thumbs-up held at arm's length: fist sideways, curled fingers facing camera */}
              <g transform="translate(1250,560)">
                <rect x={-20} y={300} width={170} height={300} fill="#F2873A" stroke={C.ink} strokeWidth={8} />
                <rect x={-60} y={60} width={250} height={260} rx={70} fill="#7A4A2E" stroke={C.ink} strokeWidth={8} />
                {[0, 1, 2, 3].map((i) => (
                  <rect key={i} x={120} y={78 + i * 58} width={100} height={54} rx={26} fill="#7A4A2E" stroke={C.ink} strokeWidth={6} />
                ))}
                <path d="M-40,110 C-60,40 -50,-110 -10,-150 C20,-178 70,-160 72,-110 C76,-40 60,40 70,110 Z" fill="#7A4A2E" stroke={C.ink} strokeWidth={8} />
                <path d="M-14,-132 C2,-156 48,-152 54,-120 L50,-92 C30,-84 4,-86 -10,-96 Z" fill="#D9B7A0" stroke={C.ink} strokeWidth={4} />
              </g>
            </g>
          </g>
        )}
        {beat === 'footprints' && (
          <g>
            <g transform="translate(1340,640)">
              <rect x={-90} y={-60} width={180} height={90} fill="#D9A441" stroke={C.ink} strokeWidth={5} />
              {[-1, 1].map((s) => (
                <path key={s} d={`M${s * 80},20 L${s * 150},120`} stroke="#CFCFD4" strokeWidth={8} />
              ))}
              <path d="M-90,30 L-150,120 M90,30 L150,120" stroke="#CFCFD4" strokeWidth={8} />
              <line x1={200} y1={110} x2={200} y2={-130} stroke="#CFCFD4" strokeWidth={6} />
              <rect x={200} y={-130} width={110} height={70} fill="#F4F4F4" stroke={C.ink} strokeWidth={4} />
              {[0, 1, 2].map((i) => (
                <rect key={i} x={200} y={-118 + i * 20} width={110} height={8} fill="#C2464F" />
              ))}
              <rect x={200} y={-130} width={44} height={36} fill="#2C4A7A" />
            </g>
            {Array.from({length: 9}, (_, i) => (
              <ellipse key={i} cx={1000 + i * 48} cy={860 + Math.sin(i) * 16} rx={14} ry={6} fill="#5E5E64" transform={`rotate(-10,${1000 + i * 48},${860 + Math.sin(i) * 16})`} />
            ))}
            <Figure char="jonah" x={interpolate(t, [0, 6], [760, 900], {extrapolateRight: 'clamp'})} y={900} scale={0.95} pose="hold" walk={t * 3} expression="nervous" look={[1, 1]} />
          </g>
        )}
      </Camera>
    </Stage>
  );
};
