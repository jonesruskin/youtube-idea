import React from 'react';
import {interpolate} from 'remotion';
import {Figure} from '../../characters/Figure';
import {extra} from '../../characters/registry';
import {Camera} from '../../fx/camera';
import {rand} from '../../fx/sky';
import {C} from '../../theme';
import {Bulb, Stage} from '../common';
import {Danfo, Facades, PaintedClouds, PowerLines, Road, Shadow, Sky, SunShafts, Umbrella, type TimeOfDay} from '../kit';
import {Cards, ease01, MemoryWash, Orange, Spoon, useBeatCam, type BeatTable} from './shared';

const BEATS: BeatTable = {
  roomDawn: {cam: [[1.5, 760, 760], [1.7, 720, 780]]},
  wakeHome: {cam: [[1.1, 900, 600], [1.2, 860, 640]]},
  mamaDoor: {cam: [[1.15, 1060, 600], [1.25, 1100, 600]]},
  mamaNow: {cam: [[1.2, 1100, 600], [1.35, 1140, 580]]},
  question: {cam: [[1.05, 960, 560], [1.3, 860, 640]]},
  market: {cam: [[1.15, 960, 620], [1.3, 980, 620]]},
  iyaThanks: {cam: [[1.3, 980, 640], [1.45, 960, 640]]},
  danfo: {cam: [[1.0, 960, 560], [2.3, 926, 760]]},
  dinner: {cam: [[1.1, 960, 640], [1.25, 960, 660]]},
  quiet: {cam: [[2.2, 960, 560], [2.5, 960, 560]]},
  plates: {cam: [[1.15, 900, 640], [1.25, 940, 640]]},
  cards: {cam: [[1.3, 1080, 660], [1.4, 1080, 660]]},
  window: {cam: [[1.0, 960, 560], [1.3, 880, 520]]},
};

const FLOOR = 900;

/** "Your" room: a fan, a thin mattress, a barred window onto Lagos. */
const Room: React.FC<{frame: number; t: number; beat: string; lineAt: (i: number) => number; dur: number}> = ({frame, t, beat, lineAt, dur}) => {
  const dawn = beat === 'roomDawn';
  const time: TimeOfDay = dawn ? 'dawn' : 'morning';
  const slap = dawn ? ease01(t, lineAt(0) - 0.4, 0.35) : 0;
  const buzzing = dawn && slap < 0.9;
  const mama = beat === 'mamaDoor' || beat === 'mamaNow';
  const look: [number, number] = beat === 'question' ? [Math.sin(t * 0.9) * 0.9, -0.2] : mama ? [1, 0] : [0.3, -0.2];
  const youExpr = beat === 'wakeHome' ? (t < 0.6 ? 'sleep' : t < lineAt(1) ? 'surprised' : 'confused') : beat === 'mamaDoor' ? 'confused' : beat === 'mamaNow' ? (t > lineAt(1) ? 'happy' : 'nervous') : 'warm';
  const mamaExpr = beat === 'mamaDoor' ? (t > lineAt(2) ? 'happy' : 'confused') : t > lineAt(1) - 0.2 ? 'happy' : 'confused';
  return (
    <g>
      {/* window onto the street */}
      <defs>
        <clipPath id="roomWin">
          <rect x={240} y={200} width={420} height={360} />
        </clipPath>
      </defs>
      <g clipPath="url(#roomWin)">
        <Sky time={time} frame={frame} id="roomsky" />
        <PaintedClouds time={time} frame={frame} id="roomc" y={240} seed={6} />
        <Facades time={time} base={640} seed={3} x0={100} x1={900} frame={frame} />
        <PowerLines y={260} frame={frame} x0={100} x1={900} />
      </g>
      <path fillRule="evenodd" d="M-600,-300 L2600,-300 L2600,1000 L-600,1000 Z M240,200 L660,200 L660,560 L240,560 Z" fill={dawn ? '#6E8A8C' : '#9FC9C0'} />
      <ellipse cx={1300} cy={180} rx={160} ry={60} fill="#8BB3AA" opacity={0.6} />
      <rect x={230} y={190} width={440} height={380} fill="none" stroke="#E9E1D2" strokeWidth={16} />
      {[310, 380, 450, 520, 590].map((x) => (
        <line key={x} x1={x} y1={200} x2={x} y2={560} stroke="#3A3A42" strokeWidth={6} />
      ))}
      <line x1={240} y1={380} x2={660} y2={380} stroke="#3A3A42" strokeWidth={6} />
      {!dawn && <SunShafts x={450} y={380} opacity={0.12} />}
      {/* sister's drawing: a sun, a house, three people */}
      <g transform="translate(1420,330) rotate(4)">
        <rect x={-90} y={-70} width={180} height={140} fill="#FFFDF4" stroke="#D8D0C0" strokeWidth={3} />
        <circle cx={-50} cy={-35} r={18} fill="#F6C453" />
        <path d="M10,10 L50,-25 L90,10 Z" fill="#E35D5D" transform="translate(-20,0)" />
        <rect x={0} y={10} width={50} height={40} fill="#7FD6FF" transform="translate(-10,0)" />
        {[-60, -40, -20].map((x, i) => (
          <g key={x} stroke="#2B3A67" strokeWidth={3}>
            <circle cx={x} cy={22} r={6} fill="none" />
            <line x1={x} y1={28} x2={x} y2={48 - i * 3} />
          </g>
        ))}
        <rect x={-20} y={-80} width={40} height={14} fill="#F2E6B0" opacity={0.8} />
      </g>
      {/* doorway */}
      <rect x={1560} y={160} width={300} height={740} fill="#5A3A2A" stroke="#E9E1D2" strokeWidth={14} />
      <rect x={1574} y={174} width={272} height={726} fill="#3A2A20" />
      {/* ceiling fan (seen from the side, spinning) */}
      <g transform="translate(960,170)">
        <line x1={0} y1={-400} x2={0} y2={30} stroke="#3A3A42" strokeWidth={8} />
        <ellipse cx={0} cy={40} rx={34} ry={16} fill="#E9E9EE" stroke={C.ink} strokeWidth={4} />
        {[0, 1, 2].map((k) => {
          const a = frame * 0.35 + (k * Math.PI * 2) / 3;
          return <ellipse key={k} cx={Math.cos(a) * 140} cy={40} rx={Math.abs(Math.cos(a)) * 110 + 10} ry={8} fill="#D9D2C6" stroke={C.ink} strokeWidth={3} />;
        })}
      </g>
      <rect x={-600} y={FLOOR - 40} width={3200} height={600} fill="#B98B5E" />
      {Array.from({length: 12}, (_, i) => (
        <line key={i} x1={-600 + i * 300} y1={FLOOR - 40} x2={-700 + i * 320} y2={1400} stroke="#A67A50" strokeWidth={3} />
      ))}
      <rect x={1160} y={560} width={150} height={300} fill="#6B4430" stroke={C.ink} strokeWidth={4} />
      <rect x={1180} y={600} width={110} height={70} fill="#E07A5F" />
      {/* mattress */}
      <rect x={300} y={830} width={980} height={60} rx={14} fill="#F2E6CC" stroke={C.ink} strokeWidth={5} />
      {Array.from({length: 12}, (_, i) => (
        <rect key={i} x={318 + i * 80} y={838} width={40} height={44} fill="#E8B4B8" opacity={0.7} />
      ))}
      {/* the sleeper (roomDawn) or you sitting up */}
      {dawn ? (
        <g>
          <path d="M360,830 Q520,730 760,760 Q980,720 1180,830 Z" fill="#7A9CC6" stroke={C.ink} strokeWidth={5} />
          <ellipse cx={420} cy={790} rx={52} ry={40} fill="#17110F" />
          {/* arm reaching out to slap the phone */}
          <path d={`M${600},${800} Q${700 + slap * 120},${700 + slap * 40} ${760 + slap * 160},${790 + slap * 40}`} stroke="#8E96A3" strokeWidth={30} fill="none" strokeLinecap="round" />
          <circle cx={760 + slap * 160} cy={790 + slap * 40} r={20} fill="#6B3F27" stroke={C.ink} strokeWidth={4} />
        </g>
      ) : (
        <g>
          <Figure char="you" x={760} y={960} scale={1.0} pose={beat === 'wakeHome' && t < lineAt(1) ? 'pilotJoy' : 'pilot'} expression={youExpr} look={look} />
          <path d="M560,860 Q760,800 980,860 L1000,900 L540,900 Z" fill="#7A9CC6" stroke={C.ink} strokeWidth={5} />
        </g>
      )}
      <g transform={`translate(${dawn ? 960 + (buzzing ? Math.sin(frame * 3) * 3 : 0) : 1080},${dawn ? 826 : 826})`}>
        {buzzing && <circle r={50} fill="#7FD6FF" opacity={0.25 + 0.2 * Math.sin(frame * 0.8)} />}
        <rect x={-30} y={-10} width={60} height={20} rx={5} fill="#15192A" stroke={C.ink} strokeWidth={3} />
        <rect x={-24} y={-6} width={48} height={12} rx={2} fill={buzzing ? '#7FD6FF' : '#2E3F5E'} />
      </g>
      {mama && (
        <g>
          <Shadow x={1700} y={FLOOR} w={70} />
          <Figure char="mama" x={1700} y={FLOOR} scale={1.0} pose="hipHand" expression={mamaExpr} look={[-1, 0.2]} flip holding={<Spoon />} />
        </g>
      )}
      {dawn && <rect x={-600} y={-300} width={3200} height={1700} fill="#1E2A5E" opacity={0.25} />}
      {void dur}
    </g>
  );
};

const Street: React.FC<{frame: number; time: TimeOfDay; children?: React.ReactNode}> = ({frame, time, children}) => (
  <g>
    <Sky time={time} frame={frame} id={`lst-${time}`} />
    <PaintedClouds time={time} frame={frame} id={`lstc-${time}`} y={140} seed={8} />
    <Facades time={time} base={FLOOR - 10} seed={12} x0={-700} x1={2700} frame={frame} />
    <PowerLines y={170} frame={frame} x0={-400} x1={2800} />
    <Road time={time} y={FLOOR} potholes={[200]} puddles={[1500]} />
    {children}
  </g>
);

const Market: React.FC<{frame: number; t: number; beat: string; lineAt: (i: number) => number}> = ({frame, t, beat, lineAt}) => {
  const extraOranges = beat === 'iyaThanks' ? Math.min(3, Math.floor(ease01(t, 0.3, 2.2) * 3.99)) : 0;
  return (
    <Street frame={frame} time="gold">
      <Umbrella x={1180} y={FLOOR - 300} color="#F2873A" s={1.3} />
      <Umbrella x={300} y={FLOOR - 280} color="#3E7CB1" />
      <Figure char={extra(731)} x={260} y={FLOOR + 10} scale={0.8} pose="hold" expression="happy" seed={2} rim={false} />
      <Figure char="iya" x={1260} y={FLOOR} scale={1.0} pose={beat === 'iyaThanks' ? 'reach' : t > lineAt(3) - 0.1 ? 'shrug' : 'talk'} expression={beat === 'iyaThanks' ? 'happy' : t > lineAt(3) - 0.1 ? 'surprised' : 'happy'} look={[-1, 0]} flip />
      {/* stall table with an orange pyramid */}
      <rect x={1000} y={FLOOR - 170} width={420} height={24} fill="#8B5A3C" stroke={C.ink} strokeWidth={4} />
      <rect x={1020} y={FLOOR - 146} width={380} height={150} fill="#6B4430" stroke={C.ink} strokeWidth={4} />
      {[0, 1, 2, 3].map((row) =>
        Array.from({length: 6 - row}, (_, i) => <Orange key={`${row}-${i}`} x={1060 + i * 30 + row * 15} y={FLOOR - 184 - row * 24} r={14} />),
      )}
      {Array.from({length: 4}, (_, i) => (
        <Orange key={`b${i}`} x={1300 + (i % 2) * 28} y={FLOOR - 184 - Math.floor(i / 2) * 22} r={14} />
      ))}
      <Shadow x={820} y={FLOOR + 10} w={50} />
      <Figure char="you" x={820} y={FLOOR + 10} scale={1.0} pose={beat === 'iyaThanks' ? (t > lineAt(0) - 0.2 ? 'bow' : 'handOnHeart') : t > lineAt(2) - 0.2 ? 'handOnHeart' : 'stand'} expression={beat === 'iyaThanks' ? 'warm' : 'ecstatic'} look={[1, 0]} />
      {/* the bag */}
      <g transform={`translate(${900},${FLOOR - 60})`}>
        <path d="M-40,-40 L40,-40 L50,40 L-50,40 Z" fill="#E9E1D2" stroke={C.ink} strokeWidth={3} opacity={0.9} />
        {Array.from({length: 5 + extraOranges}, (_, i) => (
          <Orange key={i} x={-26 + (i % 4) * 17} y={-40 - Math.floor(i / 4) * 16} r={11} />
        ))}
      </g>
    </Street>
  );
};

const PASSENGERS = [221, 222, 223, 224, 225];
const Bus: React.FC<{frame: number; t: number; dur: number}> = ({frame, t, dur}) => {
  const x = 960;
  const scroll = t * 90;
  const bob = Math.sin(frame * 0.6) * 4;
  const s = 1.25;
  const wins = [-270, -170, -70, 30, 130];
  return (
    <g>
      <g transform={`translate(${-scroll},0)`}>
        <Street frame={frame} time="afternoon" />
      </g>
      <g transform={`translate(0,${bob})`}>
        <Danfo x={x} y={FLOOR + 120} s={s} frame={frame} passengers={false} />
        <g transform={`translate(${x},${FLOOR + 120}) scale(${s})`}>
          <defs>
            {wins.map((wx, i) => (
              <clipPath key={i} id={`dw${i}`}>
                <rect x={wx} y={-262} width={86} height={96} rx={8} />
              </clipPath>
            ))}
          </defs>
          {wins.map((wx, i) => (
            <g key={i} clipPath={`url(#dw${i})`}>
              {i === 2 ? (
                <>
                  <Figure char={extra(PASSENGERS[0])} x={wx + 18} y={-150} scale={0.4} pose="stand" expression="neutral" rim={false} />
                  <Figure char="you" x={wx + 46} y={-150} scale={0.42} pose="armsUp" expression="ecstatic" rim={false} />
                  <Figure char={extra(PASSENGERS[1])} x={wx + 76} y={-150} scale={0.4} pose="stand" expression="neutral" rim={false} />
                </>
              ) : i === 3 ? (
                <>
                  <Figure char={extra(PASSENGERS[2], {top: 'wrapper', hair: 'headwrap', hairColor: '#3C8D6E', topColor: '#3C8D6E', topAccent: '#F2C14E'})} x={wx + 40} y={-150} scale={0.42} pose="hold" expression="neutral" rim={false} />
                  {/* the chicken */}
                  <g transform={`translate(${wx + 42},${-196 + Math.sin(frame * 0.3) * 2})`}>
                    <ellipse rx={16} ry={12} fill="#FFFFFF" stroke={C.ink} strokeWidth={2} />
                    <circle cx={12} cy={-10} r={7} fill="#FFFFFF" stroke={C.ink} strokeWidth={2} />
                    <path d="M10,-17 q3,-6 6,0" fill="#E04A3A" />
                    <path d="M19,-10 l6,2 l-6,2 Z" fill="#F2C14E" />
                  </g>
                </>
              ) : (
                <>
                  <Figure char={extra(PASSENGERS[(i + 3) % 5])} x={wx + 28} y={-150} scale={0.4} pose="stand" expression="neutral" seed={i} rim={false} />
                  <Figure char={extra(PASSENGERS[(i + 4) % 5] + 10)} x={wx + 64} y={-150} scale={0.4} pose="stand" expression="neutral" seed={i + 3} rim={false} />
                </>
              )}
            </g>
          ))}
        </g>
      </g>
    </g>
  );
};

/** Evening at home: one big plate on a mat under a single bulb. */
const Living: React.FC<{frame: number; t: number; beat: string; lineAt: (i: number) => number}> = ({frame, t, beat, lineAt}) => {
  const MAT = 860;
  const sitY = (h: number, s: number) => MAT + 120 * h * s * 0.92;
  const meat = beat === 'dinner' ? ease01(t, lineAt(0) + 0.2, 0.8) : beat === 'quiet' ? 1 : 0;
  const win = beat === 'cards' && t > lineAt(0) - 0.3;
  return (
    <g>
      <rect x={-600} y={-300} width={3200} height={1500} fill="#C77A4A" />
      <rect x={-600} y={-300} width={3200} height={1500} fill="#3A1E10" opacity={0.35} />
      <rect x={320} y={180} width={240} height={200} fill="#1E2448" stroke="#E9E1D2" strokeWidth={12} />
      <rect x={1420} y={240} width={120} height={160} fill="#2B5E60" stroke={C.ink} strokeWidth={4} />
      <Bulb x={960} y={170} cord={170} />
      <rect x={-600} y={MAT - 40} width={3200} height={600} fill="#7A4A2E" />
      <ellipse cx={960} cy={MAT + 40} rx={620} ry={110} fill="#D9B46A" stroke={C.ink} strokeWidth={5} />
      {Array.from({length: 14}, (_, i) => (
        <line key={i} x1={400 + i * 80} y1={MAT - 50} x2={380 + i * 82} y2={MAT + 130} stroke="#B8924E" strokeWidth={4} />
      ))}
      <Figure char="mama" x={560} y={sitY(0.9, 1)} scale={1.0} pose={beat === 'dinner' && t > lineAt(0) - 0.3 && t < lineAt(1) ? 'reach' : 'pilot'} expression={beat === 'cards' ? 'happy' : 'warm'} look={[1, 0]} />
      <Figure char="you" x={960} y={sitY(0.96, 1)} scale={1.0} pose={beat === 'cards' ? (win ? 'handOnHeart' : 'pilot') : beat === 'quiet' ? 'pilot' : 'pilot'} expression={beat === 'quiet' ? 'bittersweet' : beat === 'dinner' ? (meat > 0.5 ? 'bittersweet' : 'surprised') : win ? 'surprised' : 'happy'} look={beat === 'quiet' ? [0, 0.8] : beat === 'cards' ? [1, 0.2] : [-1, 0.2]} holding={beat === 'cards' && !win ? <Cards /> : undefined} />
      <Figure char="sister" x={1360} y={sitY(0.66, 1.1)} scale={1.1} pose={win ? 'armsUp' : 'pilot'} expression={win ? 'ecstatic' : 'happy'} look={[-1, 0]} flip holding={beat === 'cards' && !win ? <Cards /> : undefined} />
      {/* the one big plate */}
      <ellipse cx={960} cy={MAT + 30} rx={200} ry={46} fill="#C9CED6" stroke={C.ink} strokeWidth={5} />
      <ellipse cx={960} cy={MAT + 22} rx={150} ry={30} fill="#FFFFFF" />
      <ellipse cx={1010} cy={MAT + 18} rx={70} ry={20} fill="#C2401E" />
      {[0, 1, 2].map((k) => (
        <ellipse key={k} cx={1000 + k * 22} cy={MAT + 12} rx={14} ry={9} fill="#6B3A22" stroke={C.ink} strokeWidth={2} />
      ))}
      <ellipse cx={interpolate(meat, [0, 1], [1050, 930])} cy={MAT + 10 - Math.sin(meat * Math.PI) * 60} rx={24} ry={14} fill="#7A4022" stroke={C.ink} strokeWidth={3} />
      {beat === 'quiet' && (
        <g>
          {[-1, 1].map((s) => (
            <circle key={s} cx={960 + s * 17} cy={sitY(0.96, 1) - 120 * 0.96 - 104 * 0.96 - 44 * 1.08 * 0.92 - 4} r={3.5} fill="#FFFFFF" opacity={0.9} />
          ))}
        </g>
      )}
      {win && (
        <g transform="translate(1180,880)">
          {[-20, 0, 20, 40].map((a, i) => (
            <rect key={i} x={i * 22} y={-10} width={30} height={42} rx={4} fill="#FFFFFF" stroke={C.ink} strokeWidth={2.5} transform={`rotate(${a})`} />
          ))}
        </g>
      )}
      <rect x={-600} y={-300} width={3200} height={1500} fill="#FFB347" opacity={0.06} />
    </g>
  );
};

const Yard: React.FC<{frame: number; t: number; lineAt: (i: number) => number}> = ({frame, t, lineAt}) => {
  const R = rand(3);
  return (
    <Street frame={frame} time="sunset">
      <rect x={300} y={300} width={1400} height={FLOOR - 300} fill="#D9A07A" stroke={C.ink} strokeWidth={5} />
      <rect x={1240} y={480} width={180} height={FLOOR - 480} fill="#3A2A20" stroke="#E9E1D2" strokeWidth={10} />
      <rect x={1440} y={420} width={110} height={180} fill="#1E2448" stroke="#E9E1D2" strokeWidth={8} />
      {/* water drum */}
      <rect x={420} y={FLOOR - 230} width={150} height={230} rx={18} fill="#2E6FB8" stroke={C.ink} strokeWidth={5} />
      {[0.25, 0.5, 0.75].map((k) => (
        <line key={k} x1={420} y1={FLOOR - 230 * k} x2={570} y2={FLOOR - 230 * k} stroke="#245A96" strokeWidth={6} />
      ))}
      <Figure char="you" x={800} y={FLOOR + 10} scale={1.0} pose={{lArm: [-25, 60], rArm: [25, -60], lLeg: [-6, 2], rLeg: [6, -2], lean: 12, headTilt: 6}} expression="happy" look={[0.2, 0.8]} />
      {/* basin, plates, suds */}
      <ellipse cx={820} cy={FLOOR - 40} rx={170} ry={36} fill="#E35D5D" stroke={C.ink} strokeWidth={5} />
      <path d="M650,-40 L990,-40 L960,40 L680,40 Z" transform={`translate(0,${FLOOR})`} fill="#C94848" stroke={C.ink} strokeWidth={5} />
      {Array.from({length: 14}, (_, i) => (
        <circle key={i} cx={680 + R() * 280} cy={FLOOR - 50 - R() * 30 - Math.abs(Math.sin(frame * 0.1 + i)) * 6} r={8 + R() * 10} fill="#FFFFFF" opacity={0.85} />
      ))}
      {[0, 1, 2].map((k) => (
        <ellipse key={k} cx={1010 + k * 12} cy={FLOOR - 10 - k * 14} rx={60} ry={14} fill="#F4F4F4" stroke={C.ink} strokeWidth={3} />
      ))}
      {/* humming: drawn notes */}
      {Array.from({length: 3}, (_, i) => {
        const k = ((frame * 0.015 + i / 3) % 1);
        const nx = 860 + k * 160 + i * 20;
        const ny = 520 - k * 160;
        return (
          <g key={i} opacity={1 - k} transform={`translate(${nx},${ny})`}>
            <ellipse rx={9} ry={7} fill={C.ink} transform="rotate(-20)" />
            <line x1={8} y1={-2} x2={8} y2={-34} stroke={C.ink} strokeWidth={3} />
            <path d="M8,-34 q12,4 10,16" stroke={C.ink} strokeWidth={3} fill="none" />
          </g>
        );
      })}
      <Figure char="mama" x={1330} y={FLOOR} scale={1.0} pose="crossArms" expression={t > lineAt(1) - 0.2 ? 'surprised' : 'confused'} look={[-1, 0.1]} flip />
    </Street>
  );
};

const Window: React.FC<{frame: number; t: number; dur: number}> = ({frame, t, dur}) => {
  const genPuff = (k: number) => ((frame * 0.02 + k / 3) % 1);
  return (
    <g>
      <Sky time="night" frame={frame} id="winsky" />
      <rect x={-600} y={120} width={3200} height={900} fill="#2B3A55" />
      <rect x={-600} y={120} width={3200} height={900} fill="#0A0E24" opacity={0.35} />
      {/* your window, lit from inside */}
      <rect x={640} y={250} width={560} height={420} fill="#FFC873" />
      <circle cx={920} cy={420} r={420} fill="#FFC873" opacity={0.12} />
      <defs>
        <clipPath id="litWin">
          <rect x={640} y={250} width={560} height={420} />
        </clipPath>
      </defs>
      <g clipPath="url(#litWin)">
        <rect x={640} y={250} width={560} height={420} fill="#E8A35E" />
        <Figure char="you" x={920} y={830} scale={1.2} pose="hold" expression="bittersweet" look={[0.6, 0.3]} rim={false} />
      </g>
      {[720, 800, 880, 960, 1040, 1120].map((x) => (
        <line key={x} x1={x} y1={250} x2={x} y2={670} stroke="#2A2A30" strokeWidth={7} />
      ))}
      <line x1={640} y1={460} x2={1200} y2={460} stroke="#2A2A30" strokeWidth={7} />
      <rect x={630} y={240} width={580} height={440} fill="none" stroke="#E9E1D2" strokeWidth={14} />
      <rect x={-600} y={FLOOR - 120} width={3200} height={500} fill="#141A30" />
      {/* the street at night: generator, a neighbour laughing under a bulb */}
      <g transform={`translate(1500,${FLOOR - 60 + Math.sin(frame * 1.5) * 1})`}>
        <rect x={-70} y={-80} width={140} height={90} rx={6} fill="#C2464F" stroke={C.ink} strokeWidth={4} />
        <rect x={-50} y={-62} width={100} height={30} fill="#2A2A30" />
        {[0, 1, 2].map((k) => (
          <circle key={k} cx={80 + genPuff(k) * 40} cy={-90 - genPuff(k) * 90} r={10 + genPuff(k) * 18} fill="#9AA2B2" opacity={0.4 * (1 - genPuff(k))} />
        ))}
      </g>
      <Bulb x={260} y={560} cord={120} />
      <Figure char={extra(744)} x={260} y={FLOOR - 20} scale={0.85} pose={Math.sin(frame * 0.2) > 0 ? 'handsOnHead' : 'shrug'} expression="ecstatic" look={[1, 0]} rim={false} />
      <rect x={-600} y={-300} width={3200} height={1700} fill="#0A0E24" opacity={interpolate(t, [0, dur], [0, 0.12])} />
    </g>
  );
};

export const LagosSet: React.FC = () => {
  const {frame, beat, cam, t, lineAt, dur, props} = useBeatCam(BEATS, 'wakeHome');
  const memory = Boolean(props.memory);
  const room = ['roomDawn', 'wakeHome', 'mamaDoor', 'mamaNow', 'question'].includes(beat);
  return (
    <Stage bg="#0A0E22">
      <Camera progress={1} from={cam} to={cam}>
        {room && <Room frame={frame} t={t} beat={beat} lineAt={lineAt} dur={dur} />}
        {(beat === 'market' || beat === 'iyaThanks') && <Market frame={frame} t={t} beat={beat} lineAt={lineAt} />}
        {beat === 'danfo' && <Bus frame={frame} t={t} dur={dur} />}
        {(beat === 'dinner' || beat === 'quiet' || beat === 'cards') && <Living frame={frame} t={t} beat={beat} lineAt={lineAt} />}
        {beat === 'plates' && <Yard frame={frame} t={t} lineAt={lineAt} />}
        {beat === 'window' && <Window frame={frame} t={t} dur={dur} />}
      </Camera>
      {memory && <MemoryWash frame={frame} />}
    </Stage>
  );
};
