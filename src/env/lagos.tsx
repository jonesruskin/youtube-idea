import React from 'react';
import {interpolate} from 'remotion';
import {Figure} from '../characters/Figure';
import {extra} from '../characters/registry';
import {useShot} from '../engine/shot-context';
import {Camera} from '../fx/camera';
import {Glow, NightGradient, Stars} from '../fx/sky';
import {Executor, Ship} from '../fx/vey';
import {C, fonts} from '../theme';
import {Bulb, Goat, Palm, Radio, Skyline, Stage, Stamp} from './common';

/** Jonah's phone-repair stall, 2 AM. Beats: wide | radio | fixed. */
export const LagosStall: React.FC = () => {
  const {frame, props, progress, speaking, lineAt, t, ramp} = useShot();
  const beat = props.beat as string;
  const cam: Record<string, [[number, number, number], [number, number, number]]> = {
    wide: [[1, 960, 540], [1.08, 900, 560]],
    radio: [[1.35, 860, 600], [1.45, 860, 610]],
    fixed: [[1.3, 900, 590], [1.0, 960, 520]],
  };
  const asleep = beat === 'wide' && t > lineAt(1) + 1.2;
  const carX = ((frame * 38) % 3200) - 600;
  const fixedGlow = beat === 'fixed' ? 1 : 0;
  const dim = beat === 'fixed' ? ramp(lineAt(1), 1.2) : 0;
  return (
    <Stage bg={C.night}>
      <defs>
        <NightGradient id="stallSky" top="#070A1C" bottom="#2A2160" />
      </defs>
      <Camera progress={progress} from={cam[beat][0]} to={cam[beat][1]}>
        <rect x={-200} y={-200} width={2400} height={1500} fill="url(#stallSky)" />
        <Stars frame={frame} count={110} opacity={0.6} />
        {beat === 'fixed' && (
          <g opacity={ramp(lineAt(2), 1)}>
            <Glow id="watcher" cx={1500} cy={140} r={60} color="#FFF4D6" />
            <circle cx={1500} cy={140} r={5} fill="#FFF4D6" />
          </g>
        )}
        <Skyline seed={11} base={700} color="#141A3E" window="#FFC873" style="lagos" minH={120} maxH={340} litChance={0.3} frame={frame} />
        <Palm x={1650} y={720} s={1.1} sway={Math.sin(frame / 40) * 4} />
        <Skyline seed={4} base={760} color="#0D1230" window="#FFB45E" style="lagos" minH={60} maxH={160} litChance={0.2} frame={frame} />
        <rect x={-200} y={760} width={2400} height={500} fill="#151225" />
        <rect x={-200} y={890} width={2400} height={10} fill="#262038" />
        {/* stall */}
        <g>
          <rect x={600} y={430} width={620} height={350} fill="#5B3A2A" stroke={C.ink} strokeWidth={6} />
          <rect x={630} y={460} width={560} height={150} fill="#3A2519" />
          {[0, 1, 2].map((r) => (
            <g key={r}>
              <rect x={640} y={500 + r * 48} width={540} height={8} fill="#7A5038" />
              {Array.from({length: 9}, (_, i) => (
                <rect key={i} x={650 + i * 58} y={468 + r * 48} width={22 + ((i * 7 + r * 3) % 14)} height={30} rx={4} fill={['#2E3B66', '#7FD6FF', '#C2464F', '#3C8D6E', '#E8C27A'][(i + r) % 5]} stroke={C.ink} strokeWidth={2} opacity={0.9} />
              ))}
            </g>
          ))}
          <path d="M570,440 L1250,440 L1220,380 L600,380 Z" fill="#8E9AAE" stroke={C.ink} strokeWidth={5} />
          {Array.from({length: 12}, (_, i) => (
            <line key={i} x1={610 + i * 52} y1={384} x2={590 + i * 54} y2={438} stroke="#6E7A8E" strokeWidth={4} />
          ))}
          <rect x={700} y={320} width={420} height={62} rx={6} fill="#F2873A" stroke={C.ink} strokeWidth={5} />
          <text x={910} y={362} textAnchor="middle" fill={C.ink} fontFamily={fonts.display} fontWeight={900} fontSize={30}>
            JONAH FIX-IT
          </text>
          <rect x={580} y={690} width={660} height={100} fill="#6E4630" stroke={C.ink} strokeWidth={6} />
        </g>
        <Bulb x={910} y={470} on={1 - dim * 0.4} cord={30} />
        <Figure char="jonah" x={860} y={850} scale={1.05} pose={beat === 'radio' ? 'reach' : 'hold'} toPose={beat === 'fixed' && t > lineAt(0) + 1.4 ? 'wave' : undefined} blend={beat === 'fixed' ? Math.min(1, Math.max(0, (t - lineAt(0) - 1.4) * 2)) : 0} expression={asleep ? 'sleep' : beat === 'fixed' ? 'warm' : beat === 'radio' ? 'curious' : 'serious'} talking={speaking('JONAH')} look={[0.6, 0.2]} />
        {beat === 'wide' && !asleep && <path d={`M960,690 l20,-20`} stroke="#FFE6A8" strokeWidth={4} opacity={0.5 + 0.5 * Math.sin(frame)} />}
        {asleep && (
          <text x={930} y={560 - ((frame % 60) / 60) * 40} fill={C.pearl} fontFamily={fonts.display} fontSize={40} opacity={1 - (frame % 60) / 60}>
            z
          </text>
        )}
        {beat !== 'wide' && (
          <Figure char="mrsBello" x={1330} y={920} scale={1.05} pose={beat === 'fixed' ? 'reach' : 'hold'} expression={beat === 'fixed' ? 'happy' : 'sad'} talking={speaking('MRS_BELLO')} look={[-0.7, 0]} flip />
        )}
        {beat === 'radio' && <Radio x={1180} y={760} s={1} />}
        {beat === 'fixed' && <Radio x={1010} y={690} s={1} glow={fixedGlow} frame={frame} />}
        {/* traffic streaks */}
        {beat === 'wide' &&
          [0, 1].map((k) => (
            <g key={k} transform={`translate(${(carX + k * 1500) % 3000 - 400},960)`}>
              <rect x={0} y={-50} width={260} height={60} rx={20} fill="#F2C14E" stroke={C.ink} strokeWidth={5} />
              <rect x={40} y={-90} width={160} height={50} rx={14} fill="#F2C14E" stroke={C.ink} strokeWidth={5} />
              <circle cx={50} cy={14} r={22} fill={C.ink} />
              <circle cx={210} cy={14} r={22} fill={C.ink} />
              <circle cx={262} cy={-24} r={60} fill="#FFF3C8" opacity={0.25} />
            </g>
          ))}
        {beat === 'fixed' && (
          <rect x={-200} y={-200} width={2400} height={1500} fill="#000" opacity={dim * 0.45} />
        )}
      </Camera>
      {beat === 'wide' && <Stamp text="LAGOS · 2:07 AM" opacity={ramp(0.2, 0.5)} />}
    </Stage>
  );
};

const Room: React.FC<{lit: number; frame: number; pearl: number}> = ({lit, frame, pearl}) => (
  <g>
    <rect x={-200} y={-200} width={2400} height={1500} fill={lit > 0.5 ? '#3B3357' : '#141836'} />
    <rect x={-200} y={820} width={2400} height={500} fill={lit > 0.5 ? '#4A3B4F' : '#191A33'} />
    {/* window */}
    <rect x={1240} y={180} width={420} height={360} fill="#0A0F2A" stroke={C.ink} strokeWidth={8} />
    <g>
      <clipPath id="roomWin">
        <rect x={1240} y={180} width={420} height={360} />
      </clipPath>
      <g clipPath="url(#roomWin)">
        <Stars frame={frame} count={40} w={1700} h={560} />
        <Skyline seed={21} base={560} color="#151B42" window="#FFC873" x0={1200} x1={1700} minH={60} maxH={200} />
      </g>
    </g>
    <line x1={1450} y1={180} x2={1450} y2={540} stroke={C.ink} strokeWidth={6} />
    <line x1={1240} y1={360} x2={1660} y2={360} stroke={C.ink} strokeWidth={6} />
    {/* poster: the Moon */}
    <rect x={300} y={200} width={230} height={300} fill="#1B2350" stroke={C.ink} strokeWidth={6} />
    <circle cx={415} cy={320} r={70} fill="#D9D4C8" stroke={C.ink} strokeWidth={4} />
    <circle cx={390} cy={300} r={14} fill="#B9B3A6" />
    <circle cx={440} cy={345} r={10} fill="#B9B3A6" />
    <text x={415} y={460} textAnchor="middle" fill={C.pearl} fontFamily={fonts.display} fontWeight={900} fontSize={28}>
      ONE DAY
    </text>
    {/* mattress, desk, fan */}
    <rect x={160} y={800} width={520} height={70} rx={14} fill="#6C7FB0" stroke={C.ink} strokeWidth={6} />
    <rect x={700} y={640} width={520} height={30} fill="#8A5A3C" stroke={C.ink} strokeWidth={6} />
    <rect x={720} y={670} width={24} height={190} fill="#6E4630" stroke={C.ink} strokeWidth={4} />
    <rect x={1180} y={670} width={24} height={190} fill="#6E4630" stroke={C.ink} strokeWidth={4} />
    <g transform="translate(1080,560)">
      <circle r={70} fill="#2B3A67" stroke={C.ink} strokeWidth={5} />
      <g transform={`rotate(${lit > 0.5 ? frame * 25 : frame * 2})`}>
        {[0, 120, 240].map((a) => (
          <ellipse key={a} cx={0} cy={-36} rx={16} ry={34} fill="#9FB3D9" stroke={C.ink} strokeWidth={3} transform={`rotate(${a})`} />
        ))}
      </g>
      <circle r={10} fill={C.gold} stroke={C.ink} strokeWidth={3} />
    </g>
    {Array.from({length: 6}, (_, i) => (
      <rect key={i} x={760 + i * 34} y={616} width={24} height={24} rx={3} fill={['#7FD6FF', '#C2464F', '#E8C27A'][i % 3]} stroke={C.ink} strokeWidth={2} />
    ))}
    {pearl > 0 && <rect x={-200} y={-200} width={2400} height={1500} fill="#FFF4D6" opacity={0.08 * pearl} />}
  </g>
);

/** Jonah's room. Beats: fixing | powercut | executor | flipflop. */
export const JonahRoom: React.FC = () => {
  const {frame, props, progress, speaking, t, ramp, lineAt} = useShot();
  const beat = props.beat as string;
  const lit = beat === 'fixing' ? 1 : beat === 'powercut' ? (t < 0.5 ? 1 : 0) : 0;
  const pearl = beat === 'executor' ? ramp(0, 1) : beat === 'flipflop' ? 1 : 0;
  const throwT = beat === 'flipflop' ? Math.min(1, Math.max(0, (t - 0.3) / 1.1)) : 0;
  return (
    <Stage>
      <Camera progress={progress} from={beat === 'powercut' ? [1.25, 900, 600] : [1.05, 960, 560]} to={beat === 'powercut' ? [1.35, 900, 620] : [1.12, 980, 560]} shake={beat === 'powercut' && t < 0.7 ? 0.6 : 0} frame={frame}>
        <Room lit={lit} frame={frame} pearl={pearl} />
        <Bulb x={960} y={240} on={lit} cord={140} />
        <Figure
          char="jonah"
          x={beat === 'fixing' ? 900 : 760}
          y={900}
          scale={1.15}
          pose={beat === 'fixing' ? 'hold' : beat === 'flipflop' ? 'stand' : 'stand'}
          toPose={beat === 'flipflop' ? 'throw' : beat === 'executor' ? 'handsOnHead' : undefined}
          blend={beat === 'flipflop' ? Math.min(1, throwT * 3) : beat === 'executor' ? ramp(lineAt(1), 0.4) : 0}
          expression={beat === 'fixing' ? 'serious' : beat === 'powercut' ? 'alarmed' : beat === 'executor' ? 'surprised' : 'determined'}
          talking={speaking('JONAH')}
          look={beat === 'fixing' ? [0.4, 0.6] : [1, -0.3]}
        />
        {(beat === 'executor' || beat === 'flipflop' || (beat === 'powercut' && t > lineAt(0) - 0.4)) && (
          <Executor x={1300} y={560} scale={0.9} frame={frame} speaking={speaking('EXECUTOR')} opacity={beat === 'powercut' ? 0.35 + 0.25 * Math.sin(frame * 0.3) : 1} />
        )}
        {beat === 'flipflop' && throwT > 0.1 && (
          <g transform={`translate(${interpolate(throwT, [0, 1], [820, 1560])},${interpolate(throwT, [0, 0.5, 1], [600, 470, 640])}) rotate(${throwT * 900})`} opacity={throwT < 0.98 ? 1 : 0}>
            <ellipse rx={38} ry={16} fill="#3FA7D6" stroke={C.ink} strokeWidth={4} />
            <path d="M-10,-10 L8,6 L20,-8" stroke="#F2C14E" strokeWidth={4} fill="none" />
          </g>
        )}
      </Camera>
    </Stage>
  );
};

/** The alley behind Jonah's house. Beats: before | decloak | mine | goat | talk | kade | kadeClose. */
export const Alley: React.FC = () => {
  const {frame, props, progress, speaking, t, ramp, lineAt} = useShot();
  const beat = props.beat as string;
  const day = beat === 'kade' || beat === 'kadeClose';
  const reveal = beat === 'before' ? 0 : beat === 'decloak' ? ramp(0.2, 2.2) : 1;
  const cams: Record<string, [[number, number, number], [number, number, number]]> = {
    before: [[1.1, 760, 600], [1.15, 800, 600]],
    decloak: [[1, 960, 520], [1.05, 960, 500]],
    mine: [[1.25, 820, 600], [1.32, 820, 590]],
    goat: [[1.7, 1470, 760], [1.78, 1470, 760]],
    talk: [[1.15, 900, 600], [1.2, 920, 600]],
    kade: [[1.05, 960, 560], [1.1, 960, 560]],
    kadeClose: [[1.6, 1240, 520], [1.7, 1240, 520]],
  };
  return (
    <Stage bg={day ? '#9CC9E8' : C.night}>
      <defs>
        <NightGradient id="alleySky" top={day ? '#7FB6E0' : '#070A1C'} bottom={day ? '#F6D8A8' : '#26205A'} />
      </defs>
      <Camera progress={progress} from={cams[beat][0]} to={cams[beat][1]}>
        <rect x={-200} y={-200} width={2400} height={1500} fill="url(#alleySky)" />
        {!day && <Stars frame={frame} count={140} />}
        {/* walls */}
        <rect x={-200} y={140} width={560} height={1100} fill={day ? '#C8A27A' : '#2C2648'} stroke={C.ink} strokeWidth={6} />
        <rect x={1560} y={100} width={560} height={1100} fill={day ? '#B98E68' : '#251F40'} stroke={C.ink} strokeWidth={6} />
        {[260, 420].map((y) => (
          <rect key={y} x={120} y={y} width={120} height={110} fill={day ? '#6B8FB0' : '#FFC873'} opacity={day ? 1 : 0.8} stroke={C.ink} strokeWidth={5} />
        ))}
        <rect x={1680} y={300} width={130} height={120} fill={day ? '#6B8FB0' : '#FFC873'} opacity={day ? 1 : 0.6} stroke={C.ink} strokeWidth={5} />
        {/* washing line */}
        <path d="M360,300 Q960,380 1560,280" stroke={C.ink} strokeWidth={3} fill="none" />
        {[
          [520, '#C2464F'],
          [700, '#3E7CB1'],
          [1180, '#F2C14E'],
          [1340, '#3C8D6E'],
        ].map(([x, c], i) => (
          <rect key={i} x={x as number} y={326 + Math.sin(i) * 6} width={70} height={90} rx={6} fill={c as string} stroke={C.ink} strokeWidth={4} transform={`rotate(${Math.sin(frame / 25 + i) * 3},${(x as number) + 35},330)`} />
        ))}
        <rect x={-200} y={880} width={2400} height={400} fill={day ? '#A88B6A' : '#1A1830'} />
        {/* generator */}
        <rect x={380} y={790} width={160} height={100} rx={8} fill="#C9612A" stroke={C.ink} strokeWidth={5} />
        <rect x={400} y={760} width={50} height={30} fill="#5A4232" stroke={C.ink} strokeWidth={4} />
        {day && (
          <g>
            {Array.from({length: 9}, (_, i) => (
              <Figure key={i} char={extra(i + 3)} x={420 + i * 140} y={700} scale={0.55} pose={i % 3 ? 'pointUp' : 'stand'} expression="surprised" seed={i} rim={false} />
            ))}
            <rect x={360} y={690} width={1200} height={22} fill="#F2C14E" stroke={C.ink} strokeWidth={4} />
            <text x={960} y={708} textAnchor="middle" fontFamily={fonts.mono} fontWeight={600} fontSize={16} fill={C.ink}>
              DO NOT CROSS · DO NOT CROSS · DO NOT CROSS · DO NOT CROSS
            </text>
          </g>
        )}
        <Ship x={1000} y={720} scale={1.15} frame={frame} reveal={reveal} glow={day ? 0.4 : 1} />
        {beat === 'decloak' && reveal < 1 &&
          [0, 1, 2].map((k) => {
            const p = ((t * 0.9 + k / 3) % 1);
            return <ellipse key={k} cx={1000} cy={720} rx={60 + p * 420} ry={20 + p * 140} fill="none" stroke="#BFF2FF" strokeWidth={4} opacity={(1 - p) * (1 - reveal)} />;
          })}
        {beat !== 'goat' && (
          <Figure
            char="jonah"
            x={beat === 'before' ? interpolate(t, [0, 2], [420, 640], {extrapolateRight: 'clamp'}) : beat === 'kade' || beat === 'kadeClose' ? 640 : 600}
            y={940}
            scale={1.05}
            pose={beat === 'mine' ? 'pointUp' : beat === 'kade' || beat === 'kadeClose' ? 'crossArms' : 'stand'}
            walk={beat === 'before' && t < 2 ? t * 7 : undefined}
            expression={beat === 'mine' ? (t > lineAt(1) ? 'ecstatic' : 'surprised') : beat === 'decloak' ? 'surprised' : beat === 'kade' ? 'confused' : beat === 'kadeClose' ? 'serious' : 'curious'}
            talking={speaking('JONAH')}
            look={[1, -0.4]}
          />
        )}
        {(beat === 'mine' || beat === 'talk' || beat === 'before') && <Executor x={330} y={560} scale={0.6} frame={frame} speaking={speaking('EXECUTOR')} />}
        <Goat x={1480} y={930} s={beat === 'goat' ? 1 : 0.8} frame={frame} unimpressed />
        {(beat === 'kade' || beat === 'kadeClose') && (
          <>
            <Figure char="kade" x={1240} y={950} scale={1.08} pose={beat === 'kadeClose' ? 'hipHand' : 'talk'} expression="smug" talking={speaking('KADE')} look={[-1, 0]} flip />
            <Figure char="assistant" x={1440} y={950} scale={0.98} pose="hold" expression="neutral" look={[-1, 0]} flip />
          </>
        )}
      </Camera>
      {beat === 'kade' && <Stamp text="DAY THREE" opacity={ramp(0.1, 0.4) * (1 - ramp(3, 0.5))} />}
    </Stage>
  );
};

/** Grandma at the window spotting Kade's convoy. */
export const GrandmaHome: React.FC = () => {
  const {frame, progress, speaking} = useShot();
  return (
    <Stage bg="#2B2140">
      <Camera progress={progress} from={[1.05, 960, 540]} to={[1.12, 1000, 520]}>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#4A3654" />
        <rect x={-200} y={850} width={2400} height={400} fill="#5C4458" />
        <rect x={880} y={170} width={700} height={520} fill="#9CC9E8" stroke={C.ink} strokeWidth={10} />
        <rect x={880} y={500} width={700} height={190} fill="#C8A27A" />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${960 + i * 200},560)`}>
            <rect x={0} y={0} width={170} height={60} rx={14} fill="#16181F" stroke={C.ink} strokeWidth={4} />
            <rect x={24} y={-34} width={120} height={40} rx={10} fill="#16181F" stroke={C.ink} strokeWidth={4} />
            <circle cx={30} cy={62} r={14} fill={C.ink} />
            <circle cx={140} cy={62} r={14} fill={C.ink} />
          </g>
        ))}
        <Figure char="kade" x={1390} y={690} scale={0.5} pose="stand" expression="smug" rim={false} />
        <path d={`M860,150 Q${900 + Math.sin(frame / 30) * 10},420 880,720 L760,720 L760,150 Z`} fill="#C2464F" stroke={C.ink} strokeWidth={5} />
        <path d={`M1600,150 Q1560,420 1600,720 L1720,720 L1720,150 Z`} fill="#C2464F" stroke={C.ink} strokeWidth={5} />
        <Figure char="grandma" x={760} y={1020} scale={1.25} pose="hold" expression="serious" talking={speaking('GRANDMA')} look={[1, -0.2]} />
      </Camera>
    </Stage>
  );
};

/** Mrs. Bello's window — the radio still playing. The unexplained seed for the finale. */
export const RadioWindow: React.FC = () => {
  const {frame, progress} = useShot();
  return (
    <Stage>
      <defs>
        <NightGradient id="rwSky" top="#070A1C" bottom="#2A2160" />
      </defs>
      <Camera progress={progress} from={[1, 960, 540]} to={[1.15, 960, 520]}>
        <rect x={-200} y={-200} width={2400} height={1500} fill="url(#rwSky)" />
        <Stars frame={frame} count={160} />
        <Glow id="rwWatch" cx={1560} cy={150} r={50} color="#FFF4D6" opacity={0.7} />
        <rect x={560} y={300} width={800} height={900} fill="#3A2E55" stroke={C.ink} strokeWidth={8} />
        <path d="M520,310 L960,140 L1400,310 Z" fill="#8E9AAE" stroke={C.ink} strokeWidth={8} />
        <rect x={760} y={460} width={400} height={300} fill="#FFC873" stroke={C.ink} strokeWidth={8} />
        <circle cx={960} cy={610} r={260} fill="#FFC873" opacity={0.15} />
        <g transform="translate(0,0)">
          <Figure char="mrsBello" x={900} y={920} scale={0.9} pose="hold" expression="warm" rim={false} />
        </g>
        <Radio x={1060} y={740} s={0.9} glow={1} frame={frame} />
        <rect x={760} y={760} width={400} height={30} fill="#3A2E55" stroke={C.ink} strokeWidth={6} />
        <Palm x={1500} y={1080} s={1.4} sway={Math.sin(frame / 50) * 3} />
      </Camera>
    </Stage>
  );
};

/** The ship lifting off from the alley — the city falls away. */
export const Launch: React.FC = () => {
  const {frame, progress, t} = useShot();
  const climb = interpolate(t, [0.3, 3.5], [0, 1600], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (x) => x * x});
  return (
    <Stage>
      <defs>
        <NightGradient id="lSky" top="#03050F" bottom="#2A2160" />
      </defs>
      <rect width={1920} height={1080} fill="url(#lSky)" />
      <Stars frame={frame} count={260} drift={[0, 0.1]} />
      <g transform={`translate(0,${climb})`}>
        <Skyline seed={31} base={1000} color="#141A3E" window="#FFC873" style="lagos" minH={100} maxH={340} litChance={0.4} frame={frame} />
        <Skyline seed={32} base={1080} color="#0C1030" window="#FFB45E" style="lagos" minH={60} maxH={180} litChance={0.25} frame={frame} />
      </g>
      {t > 0.3 &&
        Array.from({length: 14}, (_, i) => {
          const y = ((frame * 50 + i * 160) % 1300) - 100;
          return <line key={i} x1={300 + ((i * 137) % 1300)} y1={y} x2={300 + ((i * 137) % 1300)} y2={y + 160} stroke="#BFF2FF" strokeOpacity={0.25} strokeWidth={3} />;
        })}
      <Ship x={960} y={interpolate(t, [0, 0.8], [820, 560], {extrapolateRight: 'clamp'})} scale={1.2} frame={frame} tilt={-6} />
      <Glow id="lExhaust" cx={960} cy={640} r={240} color="#9FE8FF" opacity={0.5 * Math.min(1, t)} />
    </Stage>
  );
};

/** Grandma's first flight over Lagos at night. */
export const CityFlight: React.FC = () => {
  const {frame, progress, speaking, t} = useShot();
  const scroll = frame * 4;
  return (
    <Stage>
      <defs>
        <NightGradient id="cfSky" top="#050817" bottom="#1F2460" />
      </defs>
      <rect width={1920} height={1080} fill="url(#cfSky)" />
      <Stars frame={frame} count={180} />
      {/* city grid below, seen at an angle */}
      <g transform={`translate(${-(scroll % 400)},0)`}>
        <rect x={-200} y={720} width={2800} height={400} fill="#0E1330" />
        {Array.from({length: 120}, (_, i) => {
          const x = (i * 97) % 2600;
          const y = 740 + ((i * 53) % 320);
          return <circle key={i} cx={x} cy={y} r={2 + (i % 4)} fill="#FFD58A" opacity={0.5 + 0.5 * Math.sin(frame * 0.1 + i)} />;
        })}
        {/* the lagoon bridge */}
        <path d="M-200,900 C300,820 900,960 1500,860 C2000,780 2400,880 2800,840" stroke="#FFC873" strokeWidth={6} fill="none" />
        <path d="M-200,1000 C400,960 1200,1040 2800,980" stroke="#1B3A6B" strokeWidth={60} fill="none" opacity={0.6} />
      </g>
      <Skyline seed={41} base={760} color="#11163A" window="#FFC873" style="tower" minH={80} maxH={260} litChance={0.4} frame={frame} x0={-((scroll * 0.5) % 300) - 100} />
      <Camera progress={progress} from={[1.7, 960, 440]} to={[1.9, 960, 430]}>
        <Ship
          x={960}
          y={470}
          scale={1.6}
          frame={frame}
          tilt={Math.sin(frame / 40) * 3}
          pilot={
            <g>
              <Figure char="grandma" x={70} y={42} scale={0.32} pose={speaking('GRANDMA') && t > 6 ? 'handsOnHead' : 'hold'} expression={speaking('GRANDMA') ? 'ecstatic' : 'happy'} talking={speaking('GRANDMA')} rim={false} />
              <Figure char="jonah" x={-5} y={46} scale={0.32} pose="pilot" expression="happy" talking={speaking('JONAH')} rim={false} look={[1, 0]} />
            </g>
          }
        />
      </Camera>
    </Stage>
  );
};

/** TV news report with the traffic jam inset. */
export const News: React.FC = () => {
  const {frame, progress, speaking, t, lineAt, ramp} = useShot();
  const tv = ramp(lineAt(1) - 0.3, 0.5);
  return (
    <Stage bg="#10162E">
      {/* traffic jam aerial */}
      <g opacity={1 - tv}>
        <Camera progress={progress} from={[1, 960, 540]} to={[1.1, 960, 540]}>
          <rect x={-200} y={-200} width={2400} height={1500} fill="#2A2F45" />
          {Array.from({length: 7}, (_, lane) => (
            <g key={lane}>
              <rect x={-200} y={140 + lane * 120} width={2400} height={100} fill="#3A3F58" />
              {Array.from({length: 14}, (_, i) => (
                <g key={i} transform={`translate(${((i * 160 + lane * 70 + (lane % 2 ? frame * 0.4 : -frame * 0.3)) % 2300) - 150},${160 + lane * 120})`}>
                  <rect width={120} height={60} rx={14} fill={['#F2C14E', '#E8E3D8', '#3E7CB1', '#C2464F', '#F2C14E'][(i + lane) % 5]} stroke={C.ink} strokeWidth={4} />
                  <rect x={lane % 2 ? 6 : 100} y={10} width={12} height={40} rx={4} fill={lane % 2 ? '#FFF3C8' : '#FF5A4A'} />
                </g>
              ))}
            </g>
          ))}
        </Camera>
      </g>
      <g opacity={tv}>
        <rect x={0} y={0} width={1920} height={1080} fill="#1A2140" />
        <rect x={0} y={0} width={1920} height={1080} fill="#2C4A7A" opacity={0.25} />
        <rect x={1080} y={160} width={700} height={420} rx={10} fill="#0B1026" stroke={C.pearl} strokeWidth={4} />
        <g transform="translate(1080,160)">
          <svg x={0} y={0} width={700} height={420} viewBox="0 0 1920 1152">
            <rect width={1920} height={1152} fill="#9CC9E8" />
            <rect y={700} width={1920} height={452} fill="#A88B6A" />
            <Ship x={960} y={620} scale={1.6} frame={frame} glow={0.3} />
            {Array.from({length: 10}, (_, i) => (
              <Figure key={i} char={extra(i + 20)} x={200 + i * 170} y={900} scale={0.7} pose={i % 2 ? 'pointUp' : 'stand'} expression="surprised" seed={i} rim={false} />
            ))}
          </svg>
        </g>
        <rect x={180} y={640} width={760} height={30} fill="#0B1026" />
        <rect x={0} y={760} width={1920} height={140} fill={C.stamp} />
        <text x={60} y={850} fill={C.white} fontFamily={fonts.display} fontWeight={900} fontSize={58}>
          BREAKING: HEIR #1 IDENTIFIED — LAGOS
        </text>
        <rect x={0} y={900} width={1920} height={70} fill="#0B1026" />
        <text x={1920 - ((frame * 6) % 3600)} y={948} fill={C.pearl} fontFamily={fonts.mono} fontSize={32}>
          TWELVE HEIRS · EIGHT BILLION CANDIDATES · BETELGEUSE STILL DARK · LAGOS TRAFFIC "WORSE THAN EVER" · ELEVEN HEIRS STILL UNKNOWN ·
        </text>
        <rect x={120} y={140} width={0} height={0} />
        <rect x={100} y={260} width={880} height={400} fill="#203A63" opacity={0.5} rx={10} />
        <Figure char="anchor" x={540} y={760} scale={1.25} pose="hold" expression="serious" talking={speaking('ANCHOR')} look={[0.2, 0]} rim={false} />
        <rect x={180} y={640} width={720} height={120} fill="#3A2A20" stroke={C.ink} strokeWidth={5} />
      </g>
    </Stage>
  );
};
