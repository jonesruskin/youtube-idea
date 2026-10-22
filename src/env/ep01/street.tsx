import React from 'react';
import {Easing, interpolate} from 'remotion';
import {Figure} from '../../characters/Figure';
import {extra} from '../../characters/registry';
import {useShot} from '../../engine/shot-context';
import {Camera, lerpCam, Par} from '../../fx/camera';
import {Glow} from '../../fx/sky';
import {Executor} from '../../fx/vey';
import {C, fonts} from '../../theme';
import {Goat, Palm, Radio, Stage} from '../common';
import {Car, Facades, FarCity, Grade, HOLO, Motes, Okada, PaintedClouds, PowerLines, Road, Shadow, Sky, SunShafts, Umbrella, type TimeOfDay} from '../kit';

export {Par, lerpCam};
type Cam = [number, number, number];

/** Jonah's stall: wooden box, tin roof, shelves of phones, the ONE DAY poster. */
export const JonahStall: React.FC<{x: number; y: number; frame: number; night?: boolean; radio?: number}> = ({x, y, frame, night, radio = 0}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={0} y={-380} width={420} height={380} fill="#6B4430" stroke={C.ink} strokeWidth={6} />
    {Array.from({length: 7}, (_, i) => (
      <line key={i} x1={i * 60} y1={-380} x2={i * 60} y2={0} stroke="#5A3826" strokeWidth={3} />
    ))}
    <rect x={24} y={-330} width={372} height={180} fill="#3A2519" stroke={C.ink} strokeWidth={4} />
    {[0, 1].map((r) => (
      <g key={r}>
        <rect x={30} y={-268 + r * 70} width={360} height={8} fill="#8A5A3C" />
        {Array.from({length: 7}, (_, i) => (
          <rect key={i} x={40 + i * 50} y={-306 + r * 70} width={24 + ((i * 7 + r * 3) % 10)} height={36} rx={5} fill={['#2E3B66', '#7FD6FF', '#C2464F', '#3C8D6E', '#E8C27A'][(i + r) % 5]} stroke={C.ink} strokeWidth={2} />
        ))}
      </g>
    ))}
    {/* the poster */}
    <g transform="translate(300,-322)">
      <rect x={0} y={0} width={84} height={112} fill="#1B2350" stroke={C.ink} strokeWidth={3} />
      <path d="M42,18 l10,30 l0,40 l-20,0 l0,-40 Z" fill="#F4EFE6" stroke={C.ink} strokeWidth={2} />
      <path d="M32,88 l-10,14 l20,-4 Z M52,88 l10,14 l-20,-4 Z" fill="#C2464F" />
      <text x={42} y={106} textAnchor="middle" fill={C.gold} fontFamily={fonts.display} fontWeight={900} fontSize={11}>
        ONE DAY
      </text>
    </g>
    <path d="M-30,-372 L450,-372 L420,-440 L0,-440 Z" fill="#9AA4B4" stroke={C.ink} strokeWidth={5} />
    {Array.from({length: 10}, (_, i) => (
      <line key={i} x1={10 + i * 46} y1={-436} x2={-14 + i * 48} y2={-376} stroke="#7A8494" strokeWidth={4} />
    ))}
    <rect x={40} y={-500} width={340} height={58} rx={6} fill="#F2873A" stroke={C.ink} strokeWidth={5} />
    <text x={210} y={-461} textAnchor="middle" fill={C.ink} fontFamily={fonts.display} fontWeight={900} fontSize={26}>
      JONAH FIX-IT
    </text>
    <text x={210} y={-446} textAnchor="middle" fill={C.ink} fontFamily={fonts.mono} fontSize={0.1}>
      .
    </text>
    <rect x={-20} y={-120} width={460} height={120} fill="#7A5038" stroke={C.ink} strokeWidth={6} />
    <rect x={-20} y={-126} width={460} height={14} fill="#8E6044" stroke={C.ink} strokeWidth={4} />
    {night && <Glow id={`stallbulb${x}`} cx={210} cy={-340} r={260} color="#FFC873" opacity={0.35} />}
    <line x1={210} y1={-372} x2={210} y2={-342} stroke={C.ink} strokeWidth={3} />
    <circle cx={210} cy={-334} r={11} fill="#FFF3C8" stroke={C.ink} strokeWidth={3} />
    {radio > 0 && <Radio x={340} y={-126} s={0.9} glow={radio} frame={frame} />}
  </g>
);

/** Grandma's house: teal, two storeys, outdoor staircase, balcony with laundry. */
export const GrandmaHouse: React.FC<{x: number; y: number; night?: boolean; doorOpen?: boolean}> = ({x, y, night, doorOpen}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={0} y={-560} width={520} height={560} fill="#4FA3A5" stroke={C.ink} strokeWidth={6} />
    <rect x={430} y={-560} width={90} height={560} fill="#000" opacity={0.12} />
    <rect x={-8} y={-576} width={536} height={18} fill="#E9E1D2" stroke={C.ink} strokeWidth={4} />
    {[60, 300].map((wx) => (
      <g key={wx}>
        <rect x={wx} y={-500} width={110} height={120} fill={night ? '#FFC873' : '#2E3F5E'} stroke={C.ink} strokeWidth={5} />
        <line x1={wx + 55} y1={-500} x2={wx + 55} y2={-380} stroke={C.ink} strokeWidth={4} />
      </g>
    ))}
    <rect x={60} y={-250} width={110} height={110} fill={night ? '#FFC873' : '#2E3F5E'} stroke={C.ink} strokeWidth={5} />
    {/* front door */}
    <rect x={300} y={-230} width={120} height={230} fill={doorOpen ? '#2A1E18' : '#8A3A2E'} stroke={C.ink} strokeWidth={6} />
    {!doorOpen && <circle cx={398} cy={-110} r={8} fill={C.gold} stroke={C.ink} strokeWidth={2} />}
    {/* outdoor stair to the upper door */}
    <path d="M0,0 L-160,0 L-160,-30 L-130,-30 L-130,-60 L-100,-60 L-100,-90 L-70,-90 L-70,-120 L-40,-120 L-40,-150 L-10,-150 L-10,-300 L0,-300 Z" fill="#B9A792" stroke={C.ink} strokeWidth={5} />
    <path d="M-170,-40 L-10,-310" stroke={C.ink} strokeWidth={5} />
    <rect x={-10} y={-330} width={90} height={14} fill="#B9A792" stroke={C.ink} strokeWidth={4} />
    <rect x={10} y={-480} width={70} height={150} fill="#6B3A2E" stroke={C.ink} strokeWidth={5} />
  </g>
);

const BEATS: Record<string, {cam: [Cam, Cam]; time?: TimeOfDay}> = {
  intro: {cam: [[1, 1900, 560], [1.12, 1060, 600]]},
  customer: {cam: [[1.7, 1060, 640], [1.8, 1050, 650]]},
  poster: {cam: [[1.8, 1080, 600], [3.2, 1180, 400]]},
  tunde: {cam: [[1.25, 1150, 640], [1.3, 1050, 640]]},
  radio: {cam: [[1.55, 1120, 650], [1.6, 1120, 650]]},
  toffee: {cam: [[1.75, 1140, 690], [1.1, 1060, 560]]},
  grandma: {cam: [[1.2, 420, 600], [1.3, 380, 620]]},
  bike: {cam: [[1.05, 1500, 520], [1.15, 1560, 440]]},
  stuck: {cam: [[1.15, 1380, 480], [1.25, 1420, 440]]},
  goat: {cam: [[1.1, 1350, 480], [1.2, 1350, 420]]},
  viral: {cam: [[1.15, 1100, 600], [1.25, 1100, 560]]},
  kade: {cam: [[1.0, 1300, 560], [1.2, 1200, 600]]},
  offer: {cam: [[1.45, 900, 640], [1.6, 860, 640]]},
};

export const Street: React.FC = () => {
  const {frame, props, progress, t, lineAt, ramp, dur, speaking} = useShot();
  const beat = props.beat as string;
  const time = (props.time as TimeOfDay) ?? 'gold';
  const cfg = BEATS[beat] ?? BEATS.intro;
  const ease = Easing.inOut(Easing.cubic)(progress);
  const cam = lerpCam(cfg.cam[0], cfg.cam[1], ease);
  const night = time === 'night';
  const STALL_X = 860;
  const GROUND = 900;

  // Who is where (consistent across the whole episode).
  const jonahX = beat === 'grandma' ? 560 : beat === 'kade' || beat === 'offer' ? 820 : 1030;
  const radioGlow = beat === 'toffee' ? 1 : beat === 'radio' ? 0 : 0;

  // Tunde's ride + splash
  const tundeX = beat === 'tunde' ? interpolate(t, [0, 1.6], [1900, 1300], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}) : 1500;
  const splash = beat === 'tunde' ? interpolate(t, [1.0, 1.8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;

  // Bike float to palm top
  const bikeLift = beat === 'bike' ? ramp(lineAt(1) - 0.6, 2.4) : 0;

  // Viral counter
  const views = Math.floor(interpolate(t, [0.5, dur - 1], [12_000, 11_000_000], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)}));

  // Kade's car squeezing in
  const carX = beat === 'kade' ? interpolate(t, [0, 3], [2400, 1500], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}) : 1500;

  return (
    <Stage bg="#000">
      <Camera progress={1} from={cam} to={cam}>
        <Par depth={0.15} fx={cam[1]} fy={cam[2]}>
          <Sky time={time} frame={frame} id={`st-${beat}`} />
          <PaintedClouds time={time} frame={frame} id={`stc-${beat}`} y={120} seed={5} />
        </Par>
        <Par depth={0.35} fx={cam[1]} fy={cam[2]}>
          <FarCity time={time} base={520} frame={frame} />
        </Par>
        {(time === 'gold' || time === 'morning') && <SunShafts x={1900} y={-200} />}
        <Par depth={0.8} fx={cam[1]} fy={cam[2]}>
          <Facades time={time} base={GROUND - 10} seed={9} x0={1300} x1={2700} frame={frame} />
          <Facades time={time} base={GROUND - 10} seed={4} x0={-700} x1={-60} frame={frame} />
        </Par>
        <PowerLines y={170} frame={frame} x0={-400} x1={2800} />
        <GrandmaHouse x={60} y={GROUND} night={night} doorOpen={beat === 'grandma'} />
        <Palm x={1640} y={GROUND} s={1.5} sway={Math.sin(frame / 40) * 3} />
        <Road time={time} y={GROUND} puddles={[1420]} potholes={[300]} />
        <JonahStall x={STALL_X} y={GROUND} frame={frame} night={night} radio={beat === 'radio' || beat === 'toffee' ? (radioGlow || 0.001) : 0} />
        <Umbrella x={1900} y={GROUND - 260} color="#C2464F" />
        <Umbrella x={2180} y={GROUND - 250} color="#3E7CB1" />

        {/* background life */}
        {beat === 'intro' && <Okada x={((frame * 9) % 2800) - 200} y={GROUND + 120} frame={frame} />}
        {beat === 'intro' && <Goat x={interpolate(t, [0, dur], [1700, 1450])} y={GROUND + 40} s={0.55} frame={frame} />}
        {(beat === 'intro' || beat === 'customer' || beat === 'tunde') && (
          <>
            <Figure char={extra(401)} x={1960} y={GROUND + 10} scale={0.85} pose="hold" expression="neutral" seed={2} rim={false} />
            <Figure char="iya" x={2170} y={GROUND + 10} scale={0.85} pose="hold" expression="happy" rim={false} />
          </>
        )}

        {/* Jonah — always at his stall unless the beat moves him */}
        {beat !== 'stuck' && beat !== 'goat' && beat !== 'bike' && (
          <>
            <Shadow x={jonahX} y={GROUND} />
            <Figure
              char="jonah"
              x={jonahX}
              y={GROUND}
              scale={1}
              pose={beat === 'customer' ? 'hold' : beat === 'tunde' ? (splash > 0.3 ? 'shrug' : 'hold') : beat === 'toffee' ? 'reach' : beat === 'offer' ? 'hold' : 'stand'}
              expression={
                beat === 'customer'
                  ? t > lineAt(2) ? 'smug' : 'confused'
                  : beat === 'tunde'
                    ? splash > 0.3 ? 'serious' : 'neutral'
                    : beat === 'toffee'
                      ? 'warm'
                      : beat === 'grandma'
                        ? 'nervous'
                        : beat === 'offer'
                          ? t > lineAt(3) ? 'determined' : 'ecstatic'
                          : beat === 'viral'
                            ? 'ecstatic'
                            : beat === 'kade'
                              ? 'surprised'
                              : 'happy'
              }
              look={beat === 'grandma' ? [-1, -0.3] : beat === 'kade' || beat === 'offer' ? [1, 0] : [0.8, 0]}
              holding={beat === 'customer' ? <ShatteredPhone /> : undefined}
            />
          </>
        )}

        {beat === 'customer' && <Figure char="customer" x={1280} y={GROUND} scale={1} pose="crossArms" expression="serious" look={[-1, 0]} flip />}

        {beat === 'tunde' && (
          <g>
            <Bike x={tundeX} y={GROUND + 4} frame={frame} />
            <Figure char="tunde" x={tundeX + 10} y={GROUND - 40} scale={0.95} pose="pilot" expression="smug" look={[-1, 0]} flip />
            {splash > 0 && splash < 1 &&
              Array.from({length: 14}, (_, i) => (
                <circle key={i} cx={1360 - splash * (120 + i * 22)} cy={GROUND + 40 - Math.sin(splash * Math.PI) * (80 + (i % 4) * 40)} r={6 + (i % 3) * 3} fill="#8FC7E8" stroke={C.ink} strokeWidth={2} />
              ))}
          </g>
        )}

        {(beat === 'radio' || beat === 'toffee') && (
          <>
            <Shadow x={1300} y={GROUND} />
            <Figure char="mrsBello" x={1300} y={GROUND} scale={1} pose={beat === 'toffee' && t < lineAt(1) ? 'reach' : 'hold'} expression={beat === 'toffee' ? 'happy' : 'sad'} look={[-1, 0]} flip />
            <Figure char="kemi" x={1190} y={GROUND} scale={1} pose={beat === 'toffee' && t > lineAt(1) - 0.3 && t < lineAt(3) ? 'reach' : 'stand'} expression={beat === 'toffee' ? 'happy' : 'curious'} look={[-1, -0.6]} flip holding={beat === 'toffee' && t > lineAt(1) - 0.3 && t < lineAt(3) ? <Toffee /> : undefined} />
            {beat === 'radio' && <Radio x={1240} y={GROUND - 190} s={0.9} />}
          </>
        )}
        {beat === 'toffee' && (
          <g opacity={ramp(lineAt(3), 1)}>
            <Glow id="watcherGlint" cx={1500} cy={60} r={70} color="#FFF4D6" />
            <circle cx={1500} cy={60} r={5} fill="#FFFFFF" />
          </g>
        )}

        {beat === 'grandma' && (
          <>
            <Figure char="grandma" x={420} y={GROUND} scale={1.02} pose={speaking('GRANDMA') ? 'point' : 'hipHand'} expression={t > lineAt(2) ? 'smug' : 'serious'} look={[1, 0]} />
            <Fridge x={720} y={GROUND} />
          </>
        )}

        {beat === 'bike' && (
          <g>
            <Figure char="jonah" x={1250} y={GROUND} scale={1} pose={t < lineAt(1) ? 'reach' : 'crossArms'} palmGlow={t < lineAt(1) ? 1 : 0} expression={t > lineAt(2) ? 'smug' : 'determined'} look={[1, -0.4]} />
            <Bike x={1500 + bikeLift * 150} y={GROUND + 4 - bikeLift * 380} frame={frame} tilt={bikeLift * 18} glow={bikeLift > 0 && bikeLift < 1 ? 1 : 0} />
            <Figure char="tunde" x={1450} y={GROUND} scale={0.95} pose={bikeLift > 0.1 ? 'handsOnHead' : 'pilot'} rotate={bikeLift > 0.1 ? 0 : 0} expression={bikeLift > 0.1 ? 'alarmed' : 'smug'} look={[0.2, -1]} flip />
          </g>
        )}

        {beat === 'stuck' && (
          <g>
            <Figure char="jonah" x={1480 + Math.sin(t * 2) * 10} y={460} scale={1} pose="armsUp" walk={t * 9} expression={t > lineAt(1) ? 'confused' : 'nervous'} palmGlow={0.6} look={[0.6, 0.6]} />
            <Executor x={1700} y={300} scale={0.5} frame={frame} speaking={speaking('EXECUTOR')} />
            <Shadow x={1480} y={GROUND} opacity={0.12} />
            {Array.from({length: 6}, (_, i) => (
              <Figure key={i} char={extra(420 + i)} x={700 + i * 170} y={GROUND + 20} scale={0.75} pose={i % 2 ? 'pointUp' : 'stand'} expression="surprised" look={[0.3, -1]} seed={i} rim={false} />
            ))}
          </g>
        )}

        {beat === 'goat' && (
          <g>
            {[
              {x: 980, base: 640, el: <PlasticChair />},
              {x: 1620, base: 520, el: <FlipFlop />},
            ].map((o, i) => (
              <g key={i} transform={`translate(${o.x},${o.base - t * (22 + i * 10)})`}>
                {o.el}
              </g>
            ))}
            <g transform={`translate(1350,${GROUND - 40 - Math.min(260, t * 26)})`}>
              <Goat x={0} y={0} s={0.85} frame={frame} unimpressed />
            </g>
            <Figure char="jonah" x={1260} y={GROUND} scale={1} pose={t > lineAt(1) ? 'reach' : 'pointUp'} expression={t > lineAt(2) ? 'determined' : 'surprised'} look={[0.5, -1]} />
            {/* buoyancy hologram: arrows pushing up */}
            <g opacity={ramp(lineAt(1), 0.6) * (1 - ramp(lineAt(2), 0.6))}>
              {[-120, -40, 40, 120].map((dx) => (
                <g key={dx} transform={`translate(${1350 + dx},${GROUND + 60 - Math.min(260, t * 26)})`}>
                  <path d="M0,40 L0,-10 M-14,4 L0,-14 L14,4" stroke={HOLO.line} strokeWidth={6} fill="none" strokeLinecap="round" />
                </g>
              ))}
              <g transform="translate(1860,420)">
                <path d="M0,0 C-50,-10 -60,-90 0,-100 C60,-90 50,-10 0,0 Z" fill={HOLO.fill} stroke={HOLO.line} strokeWidth={4} />
                <path d="M0,0 l0,60" stroke={HOLO.line} strokeWidth={3} />
                {[-26, 0, 26].map((dx) => (
                  <path key={dx} d={`M${dx},40 l0,-26 m-8,8 l8,-8 l8,8`} stroke={HOLO.line} strokeWidth={4} fill="none" />
                ))}
                <text x={0} y={100} textAnchor="middle" fill={HOLO.line} fontFamily={HOLO.text} fontSize={26}>
                  AIR PUSHES UP
                </text>
              </g>
            </g>
          </g>
        )}

        {beat === 'viral' && (
          <g>
            {Array.from({length: 9}, (_, i) => (
              <g key={i}>
                <Figure char={extra(440 + i)} x={600 + i * 150} y={GROUND + 60} scale={0.85} pose="pointUp" expression="ecstatic" seed={i} rim={false} />
                <rect x={600 + i * 150 + 30} y={GROUND - 300} width={28} height={46} rx={5} fill="#1C1F2A" stroke={C.ink} strokeWidth={3} />
                <rect x={600 + i * 150 + 33} y={GROUND - 296} width={22} height={34} fill="#9FD3F2" opacity={0.8} />
              </g>
            ))}
            <Figure char="tunde" x={1450} y={GROUND} scale={0.95} pose="crossArms" expression="serious" look={[-1, 0]} flip />
          </g>
        )}

        {(beat === 'kade' || beat === 'offer') && (
          <g>
            <Figure char="grandma" x={430} y={GROUND} scale={1.02} pose={beat === 'offer' && t > lineAt(2) ? 'crossArms' : 'hold'} expression={beat === 'offer' ? (t > lineAt(4) ? 'sad' : 'serious') : 'surprised'} look={[1, 0]} />
            <SilverCar x={carX} y={GROUND + 60} />
            <Figure char="kade" x={beat === 'offer' ? 1080 : Math.min(1180, carX - 280)} y={GROUND} scale={1.05} pose={beat === 'offer' && t < lineAt(1) ? 'reach' : 'talk'} expression="smug" look={[-1, 0]} flip opacity={beat === 'kade' ? ramp(2.6, 0.6) : 1} />
            {beat === 'kade' && Array.from({length: 6}, (_, i) => <Figure key={i} char={extra(460 + i)} x={1100 + (i % 2 ? 1 : -1) * (300 + i * 60)} y={GROUND + 40} scale={0.8} pose="stand" expression="surprised" seed={i} rim={false} />)}
          </g>
        )}

        {time !== 'noon' && <Motes frame={frame} count={30} />}
        <Grade time={time} />
      </Camera>

      {beat === 'viral' && (
        <g>
          <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{position: 'absolute'}}>
            <g transform={`translate(1380,${interpolate(t, [0, 0.6], [1100, 160], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.2))})}) rotate(4)`}>
              <rect x={0} y={0} width={420} height={760} rx={46} fill="#14161E" stroke={C.ink} strokeWidth={8} />
              <rect x={22} y={70} width={376} height={300} rx={10} fill="#F7C82E" />
              <g transform="translate(210,330) scale(0.55)">
                <rect x={-300} y={-286} width={600} height={260} rx={30} fill="#F7C82E" stroke={C.ink} strokeWidth={6} />
              </g>
              <circle cx={210} cy={220} r={40} fill="#00000066" />
              <path d="M196,198 L232,220 L196,242 Z" fill="#FFFFFF" />
              <text x={30} y={420} fill="#FFFFFF" fontFamily={fonts.ui} fontWeight={700} fontSize={26}>
                BOY LIFTS BUS WITH ONE HAND
              </text>
              <text x={30} y={470} fill="#9AA0B4" fontFamily={fonts.ui} fontSize={30}>
                {views.toLocaleString('en-US')} views
              </text>
              <rect x={30} y={500} width={360} height={8} rx={4} fill="#333846" />
              <rect x={30} y={500} width={360 * Math.min(1, t / dur)} height={8} rx={4} fill={C.stamp} />
            </g>
          </svg>
        </g>
      )}
    </Stage>
  );
};

export const ShatteredPhone: React.FC = () => (
  <g transform="translate(-18,-70)">
    <rect x={0} y={0} width={40} height={70} rx={6} fill="#1C1F2A" stroke={C.ink} strokeWidth={3} />
    <rect x={4} y={6} width={32} height={56} fill="#7FB6D6" />
    <path d="M8,10 L30,58 M30,14 L10,48 M20,6 L22,62 M4,30 L36,36" stroke="#FFFFFF" strokeWidth={2} />
  </g>
);

export const Toffee: React.FC = () => (
  <g transform="translate(0,-8)">
    <path d="M-22,-8 L-12,0 L-22,8 Z M22,-8 L12,0 L22,8 Z" fill="#E2483D" stroke={C.ink} strokeWidth={2} />
    <ellipse cx={0} cy={0} rx={14} ry={10} fill="#F2C14E" stroke={C.ink} strokeWidth={3} />
  </g>
);

export const Fridge: React.FC<{x: number; y: number; s?: number; glow?: number; tilt?: number}> = ({x, y, s = 1, glow = 0, tilt = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${tilt}) scale(${s})`}>
    {glow > 0 && <rect x={-90} y={-330} width={180} height={340} rx={30} fill="#FF9A3C" opacity={0.2 * glow} />}
    <rect x={-70} y={-310} width={140} height={310} rx={14} fill="#E9E6DF" stroke={C.ink} strokeWidth={6} />
    <line x1={-70} y1={-200} x2={70} y2={-200} stroke={C.ink} strokeWidth={5} />
    <rect x={44} y={-290} width={10} height={60} rx={4} fill="#9A9AA6" stroke={C.ink} strokeWidth={2} />
    <rect x={44} y={-180} width={10} height={80} rx={4} fill="#9A9AA6" stroke={C.ink} strokeWidth={2} />
    <rect x={-50} y={-120} width={50} height={40} fill="#F2C14E" opacity={0.8} stroke={C.ink} strokeWidth={2} transform="rotate(-6,-25,-100)" />
    <path d="M-60,-40 l30,-10 l-10,30" stroke="#B5A28C" strokeWidth={3} fill="none" />
  </g>
);

export const Bike: React.FC<{x: number; y: number; frame: number; tilt?: number; glow?: number}> = ({x, y, frame, tilt = 0, glow = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${tilt})`}>
    {glow > 0 && <circle cx={0} cy={-50} r={130} fill="#FF9A3C" opacity={0.18} />}
    {[-70, 70].map((wx) => (
      <g key={wx} transform={`translate(${wx},-40)`}>
        <circle r={40} fill="none" stroke="#1C1C22" strokeWidth={8} />
        <circle r={36} fill="none" stroke="#E8C27A" strokeWidth={2} />
        <line x1={-36} y1={0} x2={36} y2={0} stroke="#999" strokeWidth={2} transform={`rotate(${frame * 6})`} />
      </g>
    ))}
    <path d="M-70,-40 L-10,-40 L30,-100 L-30,-100 Z M30,-100 L70,-40 M-30,-100 L-40,-118 M30,-100 L36,-126 L56,-126" stroke="#D9A441" strokeWidth={9} fill="none" strokeLinejoin="round" />
  </g>
);

export const SilverCar: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x},${y})`}>
    <path d="M-330,-30 L-330,-110 Q-310,-150 -240,-156 L-150,-230 L170,-230 L260,-156 Q330,-150 340,-100 L340,-30 Z" fill="#C9CED8" stroke={C.ink} strokeWidth={6} />
    <path d="M-130,-218 L0,-218 L0,-160 L-200,-160 Z" fill="#2A2F3A" stroke={C.ink} strokeWidth={3} />
    <path d="M20,-218 L160,-218 L230,-160 L20,-160 Z" fill="#2A2F3A" stroke={C.ink} strokeWidth={3} />
    <path d="M-320,-100 L330,-100" stroke="#FFFFFF" strokeWidth={4} opacity={0.6} />
    {[-210, 220].map((wx) => (
      <g key={wx}>
        <circle cx={wx} cy={-28} r={52} fill="#1C1C22" stroke={C.ink} strokeWidth={5} />
        <circle cx={wx} cy={-28} r={24} fill="#D9DDE6" />
      </g>
    ))}
  </g>
);

export const PlasticChair: React.FC = () => (
  <g>
    <rect x={-40} y={-60} width={80} height={14} rx={6} fill="#C2464F" stroke={C.ink} strokeWidth={4} />
    <rect x={-40} y={-140} width={80} height={80} rx={14} fill="#C2464F" stroke={C.ink} strokeWidth={4} />
    <path d="M-34,-46 L-44,10 M34,-46 L44,10" stroke="#C2464F" strokeWidth={10} />
  </g>
);

export const FlipFlop: React.FC = () => (
  <g>
    <ellipse rx={38} ry={16} fill="#3FA7D6" stroke={C.ink} strokeWidth={4} />
    <path d="M-10,-10 L8,6 L20,-8" stroke="#F2C14E" strokeWidth={4} fill="none" />
  </g>
);

void Car;
