import React, {useMemo} from 'react';
import {interpolate} from 'remotion';
import {Figure, type Expression} from '../characters/Figure';
import {extra} from '../characters/registry';
import {useShot} from '../engine/shot-context';
import {Camera} from '../fx/camera';
import {Globe} from '../fx/globe';
import {Cloud, Glow, NightGradient, rand, Stars} from '../fx/sky';
import {Executor, Ship} from '../fx/vey';
import {C, fonts} from '../theme';
import {Rain, Skyline, Stage, Stamp} from './common';

/** Inside the ship. Views: clouds | alley | space | earthBehind | nightSea | lagosBelow. */
export const Cockpit: React.FC = () => {
  const {frame, props, progress, speaking, t, ramp} = useShot();
  const view = props.view as string;
  const seat = Boolean(props.seat);
  const seatOpen = seat ? (props.closeSeat ? 1 : ramp(3.5, 1.2)) : 0;
  const alert = Boolean(props.alert);
  const grandma = Boolean(props.grandma);
  const shake = (props.shake as number) ?? 0;
  const cloudsRush = useMemo(() => Array.from({length: 10}, (_, i) => i), []);
  const outside = (() => {
    switch (view) {
      case 'clouds':
        return (
          <g>
            <rect width={1920} height={1080} fill="#0A0F2E" />
            <Stars frame={frame} count={200} />
            <circle cx={1500} cy={260} r={70} fill="#F4EFE6" />
            {cloudsRush.map((i) => (
              <Cloud key={i} x={((i * 330 - frame * 26) % 2600) + 2000 - 400} y={620 + (i % 3) * 90} s={1.4 + (i % 2) * 0.6} color="#3A4785" opacity={0.9} />
            ))}
          </g>
        );
      case 'alley':
        return (
          <g>
            <rect width={1920} height={1080} fill="#1A1736" />
            <Stars frame={frame} count={80} />
            <rect x={0} y={200} width={500} height={900} fill="#2C2648" />
            <rect x={1420} y={160} width={500} height={900} fill="#251F40" />
          </g>
        );
      case 'space':
      case 'earthBehind':
        return (
          <g>
            <rect width={1920} height={1080} fill="#010208" />
            <Stars frame={frame} count={420} maxR={1.8} drift={[-0.03, 0]} />
            {view === 'space' && <circle cx={1350} cy={300} r={60} fill="#D8D8DC" />}
            {view === 'earthBehind' && <Globe cx={1500} cy={360} r={170} rotate={[-10, -8]} frame={frame} sun={[90, -11]} />}
          </g>
        );
      case 'nightSea':
        return (
          <g>
            <rect width={1920} height={1080} fill="#0B1230" />
            <Stars frame={frame} count={80} opacity={0.4} />
            <rect y={640} width={1920} height={440} fill="#0E1E3E" />
            {Array.from({length: 8}, (_, i) => (
              <path key={i} d={`M0,${680 + i * 50} ${Array.from({length: 20}, (_, k) => `Q${k * 100 + 50},${680 + i * 50 + Math.sin(frame * 0.1 + k + i) * 12} ${(k + 1) * 100},${680 + i * 50}`).join(' ')}`} stroke="#2E4A7A" strokeWidth={3} fill="none" />
            ))}
          </g>
        );
      case 'lagosBelow':
        return (
          <g>
            <rect width={1920} height={1080} fill="#060A1E" />
            <Stars frame={frame} count={140} />
            {Array.from({length: 160}, (_, i) => (
              <circle key={i} cx={(i * 131 + frame * 2) % 1920} cy={700 + ((i * 47) % 380)} r={2 + (i % 3)} fill="#FFD58A" opacity={0.6} />
            ))}
          </g>
        );
      default:
        return <rect width={1920} height={1080} fill="#000" />;
    }
  })();
  const expression = (props.expression as Expression) ?? 'happy';
  const jonahPose = view === 'clouds' ? (t > 1 ? 'pilotJoy' : 'pilot') : speaking('JONAH') && view !== 'nightSea' ? 'pilotPoint' : 'pilot';
  return (
    <Stage bg="#000">
      <Camera progress={progress} from={props.closeSeat ? [1.35, 1180, 640] : [1, 960, 540]} to={props.closeSeat ? [1.5, 1180, 660] : [1.06, 960, 560]} shake={shake} frame={frame}>
        {/* interior behind the canopy */}
        <rect x={-200} y={-200} width={2400} height={1500} fill="#1A1F38" />
        {Array.from({length: 9}, (_, i) => (
          <path key={i} d={`M${-200 + i * 300},-200 l120,1500`} stroke="#232946" strokeWidth={40} />
        ))}
        {/* canopy view */}
        <clipPath id="canopy">
          <path d="M160,980 C140,500 460,140 960,120 C1460,140 1780,500 1760,980 Z" />
        </clipPath>
        <g clipPath="url(#canopy)">{outside}</g>
        <path d="M160,980 C140,500 460,140 960,120 C1460,140 1780,500 1760,980" fill="none" stroke={C.pearl} strokeWidth={34} />
        <path d="M160,980 C140,500 460,140 960,120 C1460,140 1780,500 1760,980" fill="none" stroke={C.gold} strokeWidth={6} />
        <path d="M960,120 L960,190" stroke={C.gold} strokeWidth={6} />
        {/* interior shell */}
        <path d="M-200,1300 L-200,600 C60,640 120,800 160,980 L1760,980 C1800,800 1860,640 2120,600 L2120,1300 Z" fill={C.pearlShade} stroke={C.ink} strokeWidth={6} />
        {alert && <rect x={-200} y={-200} width={2400} height={1500} fill={C.stamp} opacity={0.12 + 0.1 * Math.sin(frame * 0.4)} />}
        {/* pilot */}
        <Figure char="jonah" x={grandma ? 760 : 900} y={1180} scale={1.5} pose={jonahPose} expression={expression} talking={speaking('JONAH')} look={view === 'nightSea' ? [0, -0.5] : seat ? [1, 0.6] : [0, -0.6]} />
        {grandma && <Figure char="grandma" x={1420} y={1180} scale={1.35} pose="sitHug" expression="warm" look={[-1, 0]} />}
        {/* the small seat */}
        {seat && (
          <g transform={`translate(${grandma ? 1100 : 1240},${1040 - seatOpen * 120}) scale(${0.3 + seatOpen * 0.7})`} opacity={Math.min(1, seatOpen * 2)}>
            <Glow id="seatGlow" cx={0} cy={-40} r={150} color="#FFF4D6" opacity={0.35 * seatOpen} />
            {/* backrest */}
            <path d="M-62,10 L-62,-120 Q-62,-170 0,-172 Q62,-170 62,-120 L62,10 Z" fill={C.pearl} stroke={C.ink} strokeWidth={6} />
            <path d="M-40,0 L-40,-112 Q-40,-146 0,-148 Q40,-146 40,-112 L40,0 Z" fill="#5FB3A6" stroke={C.ink} strokeWidth={4} />
            {/* armrests + cushion */}
            <rect x={-92} y={-30} width={34} height={70} rx={14} fill={C.pearl} stroke={C.ink} strokeWidth={5} />
            <rect x={58} y={-30} width={34} height={70} rx={14} fill={C.pearl} stroke={C.ink} strokeWidth={5} />
            <rect x={-70} y={10} width={140} height={34} rx={14} fill="#5FB3A6" stroke={C.ink} strokeWidth={5} />
            <path d="M-26,-150 q26,-22 52,0" stroke={C.gold} strokeWidth={5} fill="none" />
            <path d="M0,-92 l7,14 l15,2 l-11,10 l3,15 l-14,-7 l-14,7 l3,-15 l-11,-10 l15,-2 Z" fill={C.gold} stroke={C.ink} strokeWidth={2.5} />
          </g>
        )}
        {/* dashboard */}
        <path d="M200,1090 C300,960 700,920 960,920 C1220,920 1620,960 1720,1090 Z" fill={C.pearl} stroke={C.ink} strokeWidth={6} />
        {Array.from({length: 7}, (_, i) => (
          <g key={i} transform={`translate(${520 + i * 150},${1000 + Math.abs(i - 3) * 12})`}>
            <circle r={22} fill={alert && i === 3 ? C.stamp : '#9FE8FF'} opacity={0.5 + 0.5 * Math.sin(frame * 0.15 + i)} stroke={C.ink} strokeWidth={3} />
          </g>
        ))}
        <Executor x={1700} y={360} scale={0.55} frame={frame} speaking={speaking('EXECUTOR')} />
        {alert && (
          <g>
            <rect x={760} y={300} width={400} height={110} rx={14} fill="#2A0A0A" stroke={C.stamp} strokeWidth={4} opacity={0.9} />
            <text x={960} y={372} textAnchor="middle" fill="#FFB3A8" fontFamily={fonts.mono} fontWeight={600} fontSize={44} letterSpacing={8} opacity={0.6 + 0.4 * Math.sin(frame * 0.4)}>
              MAYDAY
            </text>
          </g>
        )}
      </Camera>
    </Stage>
  );
};

const Boat: React.FC<{x: number; y: number; tilt: number; s?: number; frame: number; crew?: boolean}> = ({x, y, tilt, s = 1, frame, crew = true}) => (
  <g transform={`translate(${x},${y}) rotate(${tilt}) scale(${s})`}>
    <path d="M-260,-20 L260,-40 C240,40 160,70 0,72 C-160,70 -240,40 -260,-20 Z" fill="#B5462E" stroke={C.ink} strokeWidth={6} />
    <path d="M-250,-8 L252,-28" stroke="#F2C14E" strokeWidth={8} />
    <path d="M-250,14 L248,-6" stroke="#2E7D6E" strokeWidth={8} />
    <rect x={20} y={-120} width={120} height={84} fill="#E9E1D2" stroke={C.ink} strokeWidth={5} />
    <rect x={40} y={-104} width={36} height={30} fill="#7FD6FF" stroke={C.ink} strokeWidth={3} />
    <line x1={-100} y1={-30} x2={-100} y2={-220} stroke={C.ink} strokeWidth={8} />
    <text x={-160} y={46} fill="#F4EFE6" fontFamily={fonts.display} fontWeight={900} fontSize={28}>
      AYOOLA
    </text>
    {crew &&
      [-200, -150, -40].map((cx, i) => (
        <Figure key={i} char={extra(100 + i)} x={cx} y={-30} scale={0.42} pose={i === 1 ? 'armsUp' : 'wave'} expression="alarmed" seed={i + frame * 0} rim={false} />
      ))}
  </g>
);

const Sea: React.FC<{frame: number; y: number; amp: number; color: string; speed?: number}> = ({frame, y, amp, color, speed = 0.08}) => {
  const d = `M-200,${y} ${Array.from({length: 26}, (_, k) => {
    const x = -200 + (k + 1) * 100;
    const yy = y + Math.sin(frame * speed + k * 0.8) * amp;
    return `Q${x - 50},${yy - amp * 0.6} ${x},${yy}`;
  }).join(' ')} L2400,1400 L-200,1400 Z`;
  return <path d={d} fill={color} stroke={C.ink} strokeWidth={4} />;
};

/** The storm rescue. Beats: arrive | lift. */
export const Storm: React.FC = () => {
  const {frame, props, progress, t, ramp} = useShot();
  const lift = props.beat === 'lift' ? ramp(0.3, 3.5) : 0;
  const flash = (frame % 97 < 3 || frame % 151 < 2) ? 1 : 0;
  const boatTilt = Math.sin(frame * 0.09) * (12 - lift * 10);
  return (
    <Stage bg="#0A0F24">
      <defs>
        <NightGradient id="stSky" top="#05070F" bottom="#1E2648" />
      </defs>
      <Camera progress={progress} from={[1.05, 960, 560]} to={[1.12, 960, 520]} shake={0.5} frame={frame}>
        <rect x={-200} y={-200} width={2400} height={1500} fill="url(#stSky)" />
        {Array.from({length: 7}, (_, i) => (
          <Cloud key={i} x={i * 330 - 100 + Math.sin(frame / 50 + i) * 20} y={120 + (i % 2) * 70} s={1.6} color="#141A36" />
        ))}
        {flash > 0 && <path d="M1400,0 L1340,200 L1390,210 L1300,420" stroke="#E8F0FF" strokeWidth={6} fill="none" />}
        <Sea frame={frame} y={700} amp={40} color="#13254A" speed={0.07} />
        <Boat x={960} y={760 - lift * 290} tilt={boatTilt} frame={frame} />
        {lift > 0 &&
          Array.from({length: 14}, (_, i) => {
            const p = (frame * 0.05 + i / 14) % 1;
            return <line key={i} x1={760 + i * 30} y1={800 - lift * 290 + p * 300} x2={760 + i * 30} y2={830 - lift * 290 + p * 300} stroke="#9FD3FF" strokeWidth={4} opacity={1 - p} />;
          })}
        <Sea frame={frame} y={790} amp={55} color="#0E1C3C" speed={0.09} />
        <Ship x={960} y={interpolate(t, [0, 1.5], [-200, 220], {extrapolateRight: 'clamp'}) - lift * 90} scale={1.1} frame={frame} beam={props.beat === 'lift' ? Math.min(1, t) : interpolate(t, [2.2, 3], [0, 0.6], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
        <Rain frame={frame} count={180} opacity={0.45} />
      </Camera>
      <rect width={1920} height={1080} fill="#E8F0FF" opacity={flash * 0.25} />
    </Stage>
  );
};

/** Pre-dawn beach in Ghana. Beats: landed | think | sleep | sunrise. */
export const Beach: React.FC = () => {
  const {frame, props, progress, speaking, t, dur, ramp, lineAt} = useShot();
  const beat = props.beat as string;
  const dawn = beat === 'sunrise' ? interpolate(t, [0, dur], [0.55, 1]) : beat === 'sleep' ? 0.5 : beat === 'think' ? 0.4 : 0.3;
  const sunUp = beat === 'sunrise' ? ramp(dur - 3, 2.5) : 0;
  const crew = useMemo(() => {
    const r = rand(3);
    return Array.from({length: 8}, (_, i) => ({x: 1180 + i * 75 + r() * 20, s: 0.62 + r() * 0.1}));
  }, []);
  const asleep = beat === 'sleep' ? t > lineAt(1) + 1 : beat === 'sunrise';
  return (
    <Stage>
      <defs>
        <linearGradient id="beachSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`rgb(${10 + dawn * 30},${14 + dawn * 40},${40 + dawn * 70})`} />
          <stop offset="0.7" stopColor={`rgb(${60 + dawn * 160},${50 + dawn * 90},${90 + dawn * 40})`} />
          <stop offset="1" stopColor={`rgb(${120 + dawn * 135},${80 + dawn * 100},${70 + dawn * 20})`} />
        </linearGradient>
      </defs>
      <Camera progress={progress} from={beat === 'think' ? [1.3, 640, 640] : beat === 'sleep' ? [1.2, 760, 700] : [1, 960, 540]} to={beat === 'think' ? [1.38, 640, 640] : beat === 'sleep' ? [1.32, 760, 720] : [1.06, 960, 540]}>
        <rect x={-200} y={-200} width={2400} height={1500} fill="url(#beachSky)" />
        <Stars frame={frame} count={120} opacity={Math.max(0, 0.8 - dawn)} />
        <g opacity={sunUp}>
          <Glow id="sunGlow" cx={1700} cy={640} r={400} color="#FFB36B" opacity={0.6} />
          <path d={`M1610,640 A90,90 0 0,1 1790,640 Z`} fill="#FFD58A" transform={`translate(0,${(1 - sunUp) * 60})`} />
        </g>
        <rect x={-200} y={640} width={2400} height={130} fill={`rgb(${30 + dawn * 60},${50 + dawn * 70},${90 + dawn * 60})`} />
        {Array.from({length: 5}, (_, i) => (
          <path key={i} d={`M-200,${670 + i * 22} ${Array.from({length: 24}, (_, k) => `q50,${Math.sin(frame * 0.05 + k + i) * 6} 100,0`).join(' ')}`} stroke="#FFFFFF" strokeOpacity={0.15} strokeWidth={3} fill="none" />
        ))}
        <path d="M-200,770 C400,740 1200,790 2200,760 L2200,1400 L-200,1400 Z" fill={`rgb(${120 + dawn * 80},${100 + dawn * 60},${80 + dawn * 40})`} />
        <Boat x={1450} y={800} tilt={-6} s={0.9} frame={frame} crew={false} />
        <Ship x={440} y={780} scale={0.8} frame={frame} glow={0.3} />
        {crew.map((c, i) => (
          <Figure key={i} char={extra(100 + i)} x={beat === 'sleep' || beat === 'sunrise' ? 760 + (i - 3.5) * 70 : c.x - 200} y={beat === 'sleep' || beat === 'sunrise' ? 980 + (i % 2) * 30 : 960} scale={c.s} pose={beat === 'sleep' || beat === 'sunrise' ? (i === 2 ? 'shrug' : 'stand') : i % 3 ? 'stand' : 'wave'} expression={beat === 'sleep' || beat === 'sunrise' ? 'confused' : 'happy'} talking={i === 2 && speaking('FISHERMAN')} look={beat === 'sleep' || beat === 'sunrise' ? [-0.3, 1] : [-1, 0]} seed={i} rim={false} />
        ))}
        {asleep ? (
          <g transform="translate(560,1000) rotate(-88)">
            <Figure char="jonah" x={0} y={0} scale={0.95} pose="lie" expression="sleep" />
          </g>
        ) : (
          <Figure char="jonah" x={beat === 'think' ? 640 + Math.sin(t * 1.3) * 60 : 620} y={980} scale={0.95} pose={beat === 'think' ? 'crossArms' : 'stand'} expression={beat === 'think' ? (t > lineAt(3) ? 'surprised' : 'determined') : beat === 'sleep' ? 'determined' : 'alarmed'} talking={speaking('JONAH')} look={[1, 0]} />
        )}
        {asleep && (
          <text x={600} y={880 - ((frame % 60) / 60) * 40} fill={C.pearl} fontFamily={fonts.display} fontSize={44} opacity={1 - (frame % 60) / 60}>
            z
          </text>
        )}
        {(beat === 'think' || beat === 'landed') && <Executor x={300} y={560} scale={0.5} frame={frame} speaking={speaking('EXECUTOR')} />}
      </Camera>
      {beat === 'landed' && <Stamp text="GHANA COAST · 6:31 AM" opacity={ramp(0.2, 0.4)} />}
      {beat === 'sunrise' && <Stamp text={t > dur - 4 ? 'LAGOS · 6:42 AM · SUNRISE' : '6:41 AM'} opacity={ramp(0.2, 0.4)} />}
    </Stage>
  );
};

/** Kade introduced in his glass tower. */
export const KadeIntro: React.FC = () => {
  const {frame, progress, ramp, lineAt} = useShot();
  return (
    <Stage bg="#05070F">
      <Camera progress={progress} from={[1.06, 1000, 540]} to={[1.0, 960, 540]}>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#0A0E22" />
        <Stars frame={frame} count={120} opacity={0.6} />
        <Skyline seed={81} base={1000} color="#141A3E" window="#9FC8FF" style="tower" minH={200} maxH={620} litChance={0.5} frame={frame} />
        {Array.from({length: 7}, (_, i) => (
          <line key={i} x1={i * 320} y1={-200} x2={i * 320} y2={1300} stroke="#9FC8FF" strokeOpacity={0.18} strokeWidth={6} />
        ))}
        <rect x={-200} y={960} width={2400} height={400} fill="#121522" />
        <Figure char="kade" x={1100} y={1000} scale={1.6} pose="crossArms" expression="smug" look={[-0.4, 0]} />
        <text x={640} y={420} textAnchor="middle" fill={C.pearl} fontFamily={fonts.display} fontWeight={900} fontSize={72} opacity={ramp(0.3, 0.6)}>
          DESMOND KADE
        </text>
        <text x={640} y={480} textAnchor="middle" fill={C.gold} fontFamily={fonts.mono} fontSize={30} letterSpacing={4} opacity={ramp(0.8, 0.6)}>
          NET WORTH: $1.1 TRILLION
        </text>
        <text x={640} y={530} textAnchor="middle" fill={C.stamp} fontFamily={fonts.mono} fontSize={30} letterSpacing={4} opacity={ramp(lineAt(1), 0.6)}>
          INHERITANCES RECEIVED: 0
        </text>
      </Camera>
    </Stage>
  );
};

/** Kade's war room, watching the satellite feed. Beats: watch | legal. */
export const KadeOffice: React.FC = () => {
  const {frame, props, progress, speaking, t} = useShot();
  const legal = props.beat === 'legal';
  return (
    <Stage bg="#05070F">
      <Camera progress={progress} from={[1, 960, 540]} to={[1.08, 960, 520]}>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#0B0F22" />
        <rect x={300} y={110} width={1320} height={620} rx={16} fill="#03060F" stroke="#3A4A7A" strokeWidth={8} />
        <svg x={320} y={130} width={1280} height={580} viewBox="0 0 1920 870">
          <rect width={1920} height={870} fill="#0A1A2A" />
          {legal ? (
            <g>
              <rect width={1920} height={870} fill="#1A0F2A" />
              <ellipse cx={960} cy={520} rx={360} ry={90} fill="#FF7A3D" opacity={0.75} />
              <ellipse cx={960} cy={520} rx={220} ry={60} fill="#FFD58A" opacity={0.85} />
              <text x={60} y={80} fill="#FFB36B" fontFamily={fonts.mono} fontSize={40}>
                THERMAL · HEIR #1 · STATUS: ASLEEP
              </text>
            </g>
          ) : (
            <g>
              <Globe cx={960} cy={900} r={1600} rotate={[-1.6, -6]} frame={frame} sun={[-(6.52 - 1 - 12) * 15 - 4, -11]} markers={[{lonlat: [3.38, 6.52], label: 'LAGOS', color: C.coral}, {lonlat: [-0.19, 5.6], label: 'HEIR #1', color: C.gold, pulse: true}]} />
              <text x={60} y={80} fill="#9FC8FF" fontFamily={fonts.mono} fontSize={40}>
                SAT-7 · LIVE · SUNRISE LAGOS T-{String(10 - Math.floor(t / 6)).padStart(2, '0')}:{String(59 - Math.floor((t * 10) % 60)).padStart(2, '0')}
              </text>
            </g>
          )}
        </svg>
        <rect x={-200} y={820} width={2400} height={500} fill="#0E1222" />
        <rect x={360} y={800} width={1200} height={40} fill="#1C2234" stroke={C.ink} strokeWidth={5} />
        <Figure char="kade" x={1150} y={1120} scale={1.35} pose={legal && t > 2 ? 'hipHand' : 'crossArms'} expression={legal ? (t > 2.4 ? 'smug' : 'serious') : 'smug'} talking={speaking('KADE')} look={[-0.3, -0.6]} />
        <Figure char="assistant" x={700} y={1120} scale={1.2} pose={legal ? 'shrug' : 'hold'} expression={legal ? 'confused' : 'nervous'} talking={speaking('ASSISTANT')} look={[1, -0.2]} />
      </Camera>
    </Stage>
  );
};
