import React, {useMemo} from 'react';
import {Easing, interpolate} from 'remotion';
import {Figure} from '../../characters/Figure';
import {extra} from '../../characters/registry';
import {useShot} from '../../engine/shot-context';
import {Camera} from '../../fx/camera';
import {Glow, rand, Stars} from '../../fx/sky';
import {Executor} from '../../fx/vey';
import {C, fonts} from '../../theme';
import {Goat, Palm, Radio, Rain, Stage} from '../common';
import {Facades, FarCity, Grade, HOLO, Motes, Okada, PaintedClouds, PowerLines, Road, Shadow, Sky, Umbrella, type TimeOfDay} from '../kit';
import {Fridge, GrandmaHouse, lerpCam, Par, Toffee} from './street';

type Cam = [number, number, number];
const GROUND = 900;

/* ─────────────────────────────── HOUSE ─────────────────────────────── */

/** Grandma's outdoor stair (fridge gag) and her kitchen (the ending). */
export const House: React.FC = () => {
  const {frame, props, progress, t, dur, lineAt, ramp, speaking} = useShot();
  const beat = props.beat as string;
  if (beat === 'end') return <Kitchen />;
  const time: TimeOfDay = 'morning';
  const cam: Cam = beat === 'fridge' ? lerpCam([1.25, 520, 640], [1.35, 480, 560], progress) : lerpCam([1.2, 380, 470], [1.3, 360, 460], progress);
  // fridge path: pavement → up the stairs → straight through the door
  const p = beat === 'fridge' ? interpolate(t, [0.6, dur], [0, 0.55], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : interpolate(t, [0, 1.4], [0.55, 1], {extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  const fx = interpolate(p, [0, 0.6, 1], [760, 240, 130]);
  const fy = interpolate(p, [0, 0.15, 0.6, 1], [GROUND, GROUND - 60, GROUND - 330, GROUND - 330]);
  const crashed = beat === 'crash' && t > 1.4;
  return (
    <Stage bg="#000">
      <Camera progress={1} from={cam} to={cam} shake={beat === 'crash' && t > 1.35 && t < 1.8 ? 1.2 : 0} frame={frame}>
        <Par depth={0.15} fx={cam[1]} fy={cam[2]}>
          <Sky time={time} frame={frame} id={`house-${beat}`} />
          <PaintedClouds time={time} frame={frame} id={`housec-${beat}`} y={120} />
        </Par>
        <Par depth={0.4} fx={cam[1]} fy={cam[2]}>
          <FarCity time={time} base={520} frame={frame} />
        </Par>
        <Par depth={0.8} fx={cam[1]} fy={cam[2]}>
          <Facades time={time} base={GROUND - 10} seed={9} x0={700} x1={2700} frame={frame} />
        </Par>
        <PowerLines y={170} frame={frame} />
        <GrandmaHouse x={160} y={GROUND} doorOpen={crashed} />
        <Road time={time} y={GROUND} />
        {crashed &&
          Array.from({length: 10}, (_, i) => {
            const q = Math.min(1, (t - 1.4) * 1.6);
            return <rect key={i} x={200 + Math.cos(i) * 140 * q} y={GROUND - 420 + Math.sin(i * 1.3) * 90 * q + q * q * 200} width={16} height={8} fill="#8A3A2E" stroke={C.ink} strokeWidth={2} transform={`rotate(${i * 40 + q * 300},208,${GROUND - 420})`} opacity={1 - q * 0.6} />;
          })}
        {!crashed && <Fridge x={fx} y={fy} glow={1} tilt={beat === 'fridge' ? Math.sin(frame * 0.05) * 3 : -6} />}
        <Figure
          char="jonah"
          x={beat === 'fridge' ? fx + 170 : 500}
          y={beat === 'fridge' ? Math.min(GROUND, fy + 60) : GROUND}
          scale={1}
          pose={beat === 'fridge' ? 'point' : 'handsOnHead'}
          palmGlow={beat === 'fridge' ? 1 : 0}
          expression={beat === 'fridge' ? 'ecstatic' : 'alarmed'}
          look={[-1, -0.3]}
          flip
        />
        {beat === 'crash' && (
          <g opacity={ramp(lineAt(0) + 0.4, 0.5)}>
            {[
              ['WEIGHT', '0 kg', -60],
              ['MASS', '80 kg', 40],
            ].map(([k, v, dy], i) => (
              <g key={i} transform={`translate(${430},${GROUND - 520 + (dy as number)})`}>
                <rect x={0} y={-36} width={300} height={56} rx={12} fill="#0B1026CC" stroke={HOLO.line} strokeWidth={3} />
                <text x={20} y={2} fill={HOLO.line} fontFamily={HOLO.text} fontSize={28} fontWeight={600}>
                  {k}: {v}
                </text>
              </g>
            ))}
          </g>
        )}
        {beat === 'crash' && t > lineAt(1) - 0.2 && (
          <text x={140} y={GROUND - 600} fill={C.stamp} fontFamily={fonts.display} fontWeight={900} fontSize={70} opacity={0.9} transform={`rotate(-8,140,${GROUND - 600})`}>
            {speaking('GRANDMA') ? '!!' : ''}
          </text>
        )}
        <Motes frame={frame} count={20} />
        <Grade time={time} />
      </Camera>
    </Stage>
  );
};

const Kitchen: React.FC = () => {
  const {frame, progress, t, lineAt, dur} = useShot();
  const cam = lerpCam([1.15, 960, 560], [1.25, 960, 580], progress);
  const fp = interpolate(t, [lineAt(1) + 0.4, dur - 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const fy = 900 - Math.sin(fp * Math.PI) * 120;
  const fx = interpolate(fp, [0, 1], [1220, 1440]);
  return (
    <Stage bg="#2B2140">
      <Camera progress={1} from={cam} to={cam}>
        <rect x={-400} y={-400} width={2800} height={2000} fill="#4A3654" />
        <rect x={-400} y={900} width={2800} height={500} fill="#6B4E5E" />
        {Array.from({length: 14}, (_, i) => (
          <rect key={i} x={-300 + i * 200} y={900} width={200} height={500} fill={i % 2 ? '#735464' : '#634858'} />
        ))}
        <rect x={300} y={300} width={360} height={260} fill="#1B2350" stroke={C.ink} strokeWidth={8} />
        <Stars frame={frame} count={30} w={660} h={560} />
        <circle cx={480} cy={430} r={160} fill="#FFC873" opacity={0.0} />
        <rect x={700} y={560} width={420} height={40} fill="#8A5A3C" stroke={C.ink} strokeWidth={6} />
        <rect x={720} y={600} width={380} height={300} fill="#7A5038" stroke={C.ink} strokeWidth={6} />
        <line x1={960} y1={140} x2={960} y2={280} stroke={C.ink} strokeWidth={4} />
        <circle cx={960} cy={290} r={16} fill="#FFF3C8" stroke={C.ink} strokeWidth={3} />
        <Glow id="kitchenBulb" cx={960} cy={300} r={420} color="#FFC873" opacity={0.25} />
        <rect x={1360} y={590} width={180} height={312} fill="#3A2A3A" opacity={0.6} />
        <Fridge x={fx} y={fy} glow={fp > 0 && fp < 1 ? 1 : 0} />
        <Figure char="grandma" x={700} y={900} scale={1.1} pose={t < lineAt(1) ? 'crossArms' : 'hipHand'} expression={t > lineAt(2) ? 'happy' : 'serious'} look={[1, 0]} />
        <Figure char="jonah" x={1060} y={900} scale={1.05} pose={fp > 0 && fp < 1 ? 'point' : 'stand'} palmGlow={fp > 0 && fp < 1 ? 1 : 0} expression="warm" look={[-1, 0]} flip />
        <Grade time="night" />
      </Camera>
    </Stage>
  );
};

/* ─────────────────────────────── MARKET ─────────────────────────────── */

const ROOF_Y = 520;
const STALL_COLORS = ['#C2464F', '#3E7CB1', '#F2C14E', '#3C8D6E', '#E07A5F', '#8E6BBF'];

/** The market shed: long corrugated roof on poles, stalls underneath. `roof` offsets for collapse/lift. */
const MarketSet: React.FC<{time: TimeOfDay; frame: number; roofDrop?: number; roofLift?: number; slab?: [number, number, number]}> = ({time, frame, roofDrop = 0, roofLift = 0, slab}) => {
  const segs = 6;
  return (
    <g>
      {/* stalls */}
      {Array.from({length: 7}, (_, i) => (
        <g key={i} transform={`translate(${260 + i * 220},${GROUND})`}>
          <rect x={0} y={-150} width={190} height={150} fill="#7A5038" stroke={C.ink} strokeWidth={5} />
          <rect x={-6} y={-160} width={202} height={20} fill={STALL_COLORS[i % 6]} stroke={C.ink} strokeWidth={4} />
          {Array.from({length: 5}, (_, k) => (
            <circle key={k} cx={30 + k * 32} cy={-170} r={16} fill={['#F2873A', '#E2483D', '#F2C14E', '#3C8D6E', '#E07A5F'][(i + k) % 5]} stroke={C.ink} strokeWidth={3} />
          ))}
        </g>
      ))}
      {/* poles */}
      {Array.from({length: segs + 1}, (_, i) => (
        <rect key={i} x={240 + i * 260} y={ROOF_Y} width={16} height={GROUND - ROOF_Y} fill="#5A4A3E" stroke={C.ink} strokeWidth={3} opacity={roofDrop > 0.5 ? 0.3 : 1} />
      ))}
      {/* roof segments */}
      {Array.from({length: segs}, (_, i) => {
        const isSlab = slab && i === 3;
        const drop = roofDrop * (i % 2 ? 260 : 300);
        const tilt = roofDrop * (i % 2 ? 14 : -10);
        const lift = roofLift * (isSlab ? 0 : 1);
        const tx = isSlab ? slab![0] : 0;
        const ty = isSlab ? slab![1] : drop - lift * 320;
        const rot = isSlab ? slab![2] : tilt * (1 - roofLift);
        return (
          <g key={i} transform={`translate(${tx},${ty}) rotate(${rot},${248 + i * 260 + 130},${ROOF_Y})`}>
            <rect x={240 + i * 260} y={ROOF_Y - 30} width={262} height={36} fill="#9AA4B4" stroke={C.ink} strokeWidth={5} />
            {Array.from({length: 9}, (_, k) => (
              <line key={k} x1={250 + i * 260 + k * 28} y1={ROOF_Y - 28} x2={250 + i * 260 + k * 28} y2={ROOF_Y + 4} stroke="#7A8494" strokeWidth={3} />
            ))}
            {(roofLift > 0 || isSlab) && <rect x={240 + i * 260} y={ROOF_Y - 40} width={262} height={56} fill="#FF9A3C" opacity={0.12} />}
          </g>
        );
      })}
      {time !== 'storm' && <Umbrella x={1900} y={GROUND - 260} color="#C2464F" />}
    </g>
  );
};

export const Market: React.FC = () => {
  const {frame, props, progress, t, dur, lineAt, ramp, speaking} = useShot();
  const beat = props.beat as string;
  if (beat === 'oranges') return <OrangeFlight />;
  const time: TimeOfDay = 'storm';
  const flash = frame % 83 < 3 || frame % 137 < 2 ? 1 : 0;
  const cams: Record<string, [Cam, Cam]> = {
    collapse: [[1.0, 960, 560], [1.08, 960, 600]],
    lift: [[1.0, 960, 520], [0.95, 960, 440]],
    rising: [[1.0, 1100, 300], [1.2, 1100, -60]],
    fly: [[1.15, 900, 320], [1.2, 900, 220]],
    throw: [[1.1, 900, 300], [1.0, 1000, -80]],
    grab: [[1.5, 1100, -160], [1.6, 1100, -170]],
    land: [[0.85, 1000, 200], [1.0, 960, 620]],
    toffee: [[1.7, 860, 720], [1.8, 860, 720]],
  };
  const cam = lerpCam(cams[beat][0], cams[beat][1], Easing.inOut(Easing.cubic)(progress));

  let roofDrop = 0;
  let roofLift = 0;
  let slab: [number, number, number] | undefined;
  if (beat === 'collapse') roofDrop = interpolate(t, [0.2, 0.9], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  if (beat === 'lift') {
    roofDrop = 1 - ramp(0.6, 2.2);
    roofLift = ramp(0.6, 2.2);
  }
  const slabY = beat === 'rising' ? -320 - t * 60 : beat === 'fly' ? -560 - t * 30 : beat === 'throw' ? -650 : beat === 'grab' ? -660 : -660;
  if (['rising', 'fly', 'throw', 'grab'].includes(beat)) {
    roofLift = 1;
    slab = [140, slabY, Math.sin(frame * 0.05) * 8];
  }
  let landP = 0;
  if (beat === 'land') {
    landP = interpolate(t, [0.3, dur - 1.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});
    roofLift = 1 - landP;
    slab = [140 + landP * 500, -660 + landP * 560, (1 - landP) * 8];
  }
  if (beat === 'toffee') roofLift = 0;
  const slabCenter: [number, number] = [240 + 3 * 260 + 130 + (slab ? slab[0] : 0), ROOF_Y - 30 + (slab ? slab[1] : 0)];

  // Jonah position by beat
  const jonahFly = beat === 'fly' ? [700, 360 - t * 26] : beat === 'throw' ? [700 + Math.min(1, t / 1.6) * 300, 220 - Math.min(1, t / 1.6) * 640] : beat === 'grab' ? [slabCenter[0] - 40, slabCenter[1] + 10] : beat === 'land' ? [slabCenter[0] - 40, slabCenter[1] + 10] : null;

  return (
    <Stage bg="#000">
      <Camera progress={1} from={cam} to={cam} shake={beat === 'collapse' && t > 0.6 && t < 1.4 ? 1.4 : 0} frame={frame}>
        <Par depth={0.15} fx={cam[1]} fy={cam[2]}>
          <Sky time={time} frame={frame} id={`mk-${beat}`} y0={-1400} h={3400} />
          <PaintedClouds time={time} frame={frame} id={`mkc-${beat}`} y={-500} count={9} seed={7} />
        </Par>
        {flash > 0 && <path d={`M${1400 + (frame % 5) * 40},-900 L1340,-600 L1390,-590 L1300,-300`} stroke="#E8F0FF" strokeWidth={8} fill="none" />}
        <Par depth={0.4} fx={cam[1]} fy={cam[2]}>
          <FarCity time={time} base={560} frame={frame} />
        </Par>
        <Par depth={0.8} fx={cam[1]} fy={cam[2]}>
          <Facades time={time} base={GROUND - 20} seed={31} x0={-700} x1={2700} frame={frame} />
        </Par>
        <Road time={time} y={GROUND} puddles={[300, 1400]} />
        <MarketSet time={time} frame={frame} roofDrop={roofDrop} roofLift={roofLift} slab={slab} />

        {/* people under / crawling out / cheering */}
        {(beat === 'lift' || beat === 'land') &&
          Array.from({length: 10}, (_, i) => {
            const out = beat === 'lift' ? ramp(1.4 + i * 0.15, 1.2) : 1;
            return <Figure key={i} char={extra(600 + i)} x={300 + i * 150 + out * (i % 2 ? 120 : -120)} y={GROUND + 40} scale={0.8} pose={out < 1 ? 'reach' : beat === 'land' ? 'armsUp' : 'pointUp'} rotate={out < 0.6 ? -60 : 0} expression={beat === 'land' ? 'ecstatic' : 'alarmed'} seed={i} rim={false} />;
          })}
        {beat === 'land' && <Figure char="tunde" x={1650} y={GROUND + 40} scale={0.95} pose="reach" expression="determined" look={[-1, 0]} flip />}

        {(beat === 'collapse' || beat === 'lift') && (
          <>
            <Figure char="mrsBello" x={1700} y={GROUND + 40} scale={1} pose="handsOnHead" expression="alarmed" look={[-1, -0.3]} flip />
            {beat === 'collapse' && (
              <g>
                <Okada x={interpolate(t, [0, 1.2], [2300, 1500], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)})} y={GROUND + 200} frame={t < 1.2 ? frame : 0} flip />
                <Figure char="jonah" x={interpolate(t, [0, 1.2], [2260, 1460], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)})} y={GROUND + 130} scale={0.85} pose="pilot" expression={t > lineAt(1) ? 'determined' : 'alarmed'} look={[-1, -0.4]} />
              </g>
            )}
            {beat === 'lift' && <Figure char="jonah" x={1250} y={GROUND + 40} scale={1} pose="pointUp" palmGlow={1} expression="determined" look={[-0.4, -1]} />}
          </>
        )}

        {/* Kemi on the slab */}
        {slab && beat !== 'land' && (
          <g transform={`translate(${slabCenter[0]},${slabCenter[1] - 4})`}>
            <Figure char="kemi" x={beat === 'grab' ? 30 : 0} y={0} scale={0.9} pose={beat === 'grab' ? 'reach' : 'handsOnHead'} expression={beat === 'grab' ? 'surprised' : 'alarmed'} look={[-0.5, 0.6]} />
          </g>
        )}
        {jonahFly && (
          <g>
            {beat === 'throw' && t < 1.6 && Array.from({length: 8}, (_, i) => <line key={i} x1={jonahFly[0] - 40 + i * 12} y1={jonahFly[1] + 40} x2={jonahFly[0] - 40 + i * 12} y2={jonahFly[1] + 220} stroke="#BFD8FF" strokeOpacity={0.5} strokeWidth={3} />)}
            {beat === 'land' ? (
              <g transform={`translate(${jonahFly[0]},${jonahFly[1]})`}>
                <Figure char="jonah" x={0} y={0} scale={0.95} pose="reach" fist={landP < 1 ? 0.5 : 1} palmGlow={landP < 1 ? 0.7 : 0} expression="determined" look={[1, 0.4]} />
                <Figure char="kemi" x={70} y={-30} scale={0.85} pose="sitHug" expression="happy" look={[-1, 0]} flip />
              </g>
            ) : (
              <Figure char="jonah" x={jonahFly[0]} y={jonahFly[1]} scale={0.95} pose={beat === 'throw' ? (t < 0.4 ? 'throw' : 'armsUp') : beat === 'grab' ? 'reach' : 'hold'} palmGlow={0.8} expression={beat === 'grab' ? 'warm' : 'determined'} look={beat === 'fly' ? [0.6, 0.3] : [1, -0.6]} holding={beat === 'fly' ? <PhoneMsg /> : undefined} />
            )}
            {beat === 'throw' && (
              <g transform={`translate(${700 - 40},${220 + Math.min(1, t / 0.9) * 900})`}>
                <rect x={-14} y={-24} width={28} height={48} rx={5} fill="#14161E" stroke={C.ink} strokeWidth={3} />
                <rect x={-10} y={-18} width={20} height={34} fill="#9FD3F2" />
              </g>
            )}
          </g>
        )}
        {beat === 'land' && t > dur - 1.6 && <Figure char="mrsBello" x={slabCenter[0] + 220} y={GROUND + 40} scale={1} pose="reach" expression="ecstatic" look={[-1, 0]} flip />}

        {beat === 'toffee' && (
          <g>
            <Figure char="mrsBello" x={1100} y={GROUND} scale={1} pose="hold" expression="warm" look={[-1, 0.2]} flip />
            <Figure char="kemi" x={940} y={GROUND} scale={1} pose={t > lineAt(0) ? 'reach' : 'stand'} expression="ecstatic" look={[-1, -0.3]} flip holding={t > lineAt(0) - 0.4 ? <Toffee /> : undefined} />
            <g transform={`translate(780,${GROUND})`}>
              <Figure char="jonah" x={0} y={0} scale={0.9} pose="reach" expression="warm" look={[1, 0.3]} />
            </g>
            <Figure char="tunde" x={1300} y={GROUND} scale={0.95} pose={speaking('TUNDE') ? 'shrug' : 'crossArms'} expression={speaking('TUNDE') ? 'nervous' : 'serious'} look={[-1, 0]} flip />
          </g>
        )}

        <Rain frame={frame} count={beat === 'toffee' ? 80 : 200} opacity={beat === 'toffee' ? 0.25 : 0.45} />
        <Grade time={time} />
      </Camera>
      <rect width={1920} height={1080} fill="#E8F0FF" opacity={flash * 0.18} />
    </Stage>
  );
};

const PhoneMsg: React.FC = () => (
  <g transform="translate(-20,-90)">
    <rect x={0} y={0} width={44} height={76} rx={7} fill="#14161E" stroke={C.ink} strokeWidth={3} />
    <rect x={4} y={8} width={36} height={58} fill="#2C3A5E" />
    <rect x={8} y={20} width={28} height={16} rx={3} fill="#9FD3F2" />
    <circle cx={22} cy={-20} r={40} fill="#9FD3F2" opacity={0.15} />
  </g>
);

/** Jonah flies over the market by throwing oranges — Newton's third law, drawn as arrows. */
const OrangeFlight: React.FC = () => {
  const {frame, t, dur, lineAt, ramp, progress} = useShot();
  const time: TimeOfDay = 'noon';
  const jx = interpolate(t, [0, dur], [400, 1700]);
  const jy = 360 + Math.sin(t * 2) * 30;
  const cam = lerpCam([1.15, 600, 520], [1.15, 1550, 520], progress);
  const throws = useMemo(() => Array.from({length: 10}, (_, i) => 0.6 + i * 1.6), []);
  return (
    <Stage bg="#000">
      <Camera progress={1} from={cam} to={cam}>
        <Par depth={0.15} fx={cam[1]} fy={cam[2]}>
          <Sky time={time} frame={frame} id="oranges" x0={-600} w={3600} />
          <PaintedClouds time={time} frame={frame} id="orangesc" y={100} />
        </Par>
        <Par depth={0.4} fx={cam[1]} fy={cam[2]}>
          <FarCity time={time} base={540} frame={frame} />
        </Par>
        <Par depth={0.8} fx={cam[1]} fy={cam[2]}>
          <Facades time={time} base={GROUND - 20} seed={31} x0={-700} x1={3200} frame={frame} />
        </Par>
        <PowerLines y={190} frame={frame} x0={-400} x1={3200} />
        <Road time={time} y={GROUND} />
        <MarketSet time={time} frame={frame} />
        {[2200, 2420].map((x, i) => (
          <Umbrella key={i} x={x} y={GROUND - 260} color={['#3E7CB1', '#F2C14E'][i]} />
        ))}
        <Palm x={2600} y={GROUND} s={1.4} />
        <Figure char="iya" x={520} y={GROUND} scale={1} pose={t > lineAt(2) ? 'point' : 'hold'} expression={t > lineAt(2) ? 'alarmed' : 'surprised'} look={[1, -1]} />
        <g transform="translate(560,820)">
          <ellipse rx={70} ry={26} fill="#C9A15A" stroke={C.ink} strokeWidth={4} />
          {Array.from({length: 6}, (_, i) => (
            <circle key={i} cx={-40 + i * 16} cy={-18} r={14} fill="#F2873A" stroke={C.ink} strokeWidth={2} />
          ))}
        </g>
        {Array.from({length: 8}, (_, i) => (
          <Figure key={i} char={extra(700 + i)} x={900 + i * 230} y={GROUND + 30} scale={0.8} pose={i % 2 ? 'pointUp' : 'wave'} expression="ecstatic" look={[0, -1]} seed={i} rim={false} />
        ))}
        {/* thrown oranges fly backwards */}
        {throws.map((s, i) => {
          const p = (t - s) / 1.4;
          if (p < 0 || p > 1) return null;
          const ox = interpolate(s, [0, dur], [400, 1700]) - p * 700;
          const oy = jy + p * p * 500;
          return <circle key={i} cx={ox} cy={oy} r={16} fill="#F2873A" stroke={C.ink} strokeWidth={3} />;
        })}
        {/* push / push-back arrows */}
        <g opacity={ramp(lineAt(0), 0.5) * (1 - ramp(lineAt(2), 0.5))}>
          <path d={`M${jx - 60},${jy - 150} l-180,0 m30,-20 l-30,20 l30,20`} stroke="#FFB36B" strokeWidth={8} fill="none" strokeLinecap="round" />
          <path d={`M${jx + 60},${jy - 150} l180,0 m-30,-20 l30,20 l-30,20`} stroke={HOLO.line} strokeWidth={8} fill="none" strokeLinecap="round" />
          <text x={jx - 150} y={jy - 180} textAnchor="middle" fill="#FFB36B" fontFamily={HOLO.text} fontSize={26} fontWeight={600}>
            PUSH
          </text>
          <text x={jx + 150} y={jy - 180} textAnchor="middle" fill={HOLO.line} fontFamily={HOLO.text} fontSize={26} fontWeight={600}>
            PUSH BACK
          </text>
        </g>
        {/* rocket echo when the Executor makes the comparison */}
        <g opacity={ramp(lineAt(4), 0.5)}>
          <g transform={`translate(${jx + 260},${jy - 60}) rotate(90)`}>
            <path d="M-24,40 L-24,-40 Q0,-80 24,-40 L24,40 Z" fill="none" stroke={HOLO.line} strokeWidth={4} />
            {[0, 1, 2].map((k) => (
              <path key={k} d={`M${-12 + k * 12},44 q-4,30 0,${50 + k * 10}`} stroke="#FFB36B" strokeWidth={5} fill="none" />
            ))}
          </g>
        </g>
        <Figure char="jonah" x={jx} y={jy + 160} scale={0.95} pose={(t % 1.6) < 0.35 ? 'throw' : 'armsUp'} flip expression="ecstatic" palmGlow={0.6} look={[-1, 0.3]} />
        <Shadow x={jx} y={GROUND} opacity={0.12} />
        <Motes frame={frame} count={24} />
        <Grade time={time} />
      </Camera>
    </Stage>
  );
};

/* ─────────────────────────────── OKADA, CALL, TEASER, RADIO ─────────────────────────────── */

/** Racing to the airport through the rain. */
export const OkadaRide: React.FC = () => {
  const {frame, t} = useShot();
  const scroll = frame * 18;
  return (
    <Stage bg="#000">
      <Sky time="storm" frame={frame} id="okada" />
      <PaintedClouds time="storm" frame={frame} id="okadac" y={60} count={8} />
      <g transform={`translate(${-(scroll * 0.3) % 1200},0)`}>
        <FarCity time="storm" base={560} frame={frame} />
      </g>
      <g transform={`translate(${-(scroll % 2400)},0)`}>
        <Facades time="storm" base={GROUND - 30} seed={41} x0={0} x1={5200} frame={frame} />
      </g>
      <Road time="storm" y={GROUND} />
      {Array.from({length: 8}, (_, i) => (
        <rect key={i} x={((i * 300 - scroll) % 2400) + 2400 - 400} y={GROUND + 150} width={120} height={10} fill="#E8E0C8" opacity={0.3} />
      ))}
      <g transform="translate(900,0)">
        <Okada x={0} y={GROUND + 120} s={1.3} frame={frame} />
        <Figure char="jonah" x={-40} y={GROUND + 40} scale={1.05} pose="hold" expression="serious" look={[1, 0]} holding={<PhoneMsg />} />
        <circle cx={180} cy={GROUND + 40} r={160} fill="#FFF3C8" opacity={0.12} />
      </g>
      <g transform="translate(1420,330)" opacity={Math.min(1, t)}>
        <rect x={0} y={0} width={360} height={140} rx={22} fill="#14161EEE" stroke={C.pearl} strokeWidth={3} />
        <text x={24} y={50} fill="#9AA0B4" fontFamily={fonts.ui} fontSize={24}>
          D. KADE
        </text>
        <text x={24} y={100} fill={C.pearl} fontFamily={fonts.ui} fontWeight={700} fontSize={34}>
          Car waiting · 8:00
        </text>
      </g>
      <Rain frame={frame} count={220} opacity={0.5} angle={22} />
      <Grade time="storm" />
    </Stage>
  );
};

/** Split screen: Jonah on the roof with Grandma's ancient phone / Kade in his jet. */
export const KadeCall: React.FC = () => {
  const {frame, t, lineAt} = useShot();
  return (
    <Stage bg="#000">
      <svg x={0} y={0} width={960} height={1080} viewBox="0 0 960 1080">
        <rect width={960} height={1080} fill="#0A0E26" />
        <Stars frame={frame} count={120} w={960} h={700} />
        <FarCity time="night" base={760} frame={frame} />
        <rect x={0} y={820} width={960} height={260} fill="#B9AFA2" stroke={C.ink} strokeWidth={6} />
        <Figure char="jonah" x={480} y={1000} scale={1.25} pose="hold" expression={t > lineAt(1) ? 'smug' : 'serious'} look={[0.6, 0]} holding={<OldPhone />} />
        <Grade time="night" />
      </svg>
      <svg x={960} y={0} width={960} height={1080} viewBox="0 0 960 1080">
        <rect width={960} height={1080} fill="#D9D2C4" />
        <rect y={760} width={960} height={320} fill="#8C7A66" />
        {[160, 480, 800].map((x) => (
          <g key={x}>
            <rect x={x - 70} y={180} width={140} height={200} rx={70} fill="#1B2350" stroke={C.ink} strokeWidth={6} />
            <ellipse cx={x} cy={300 + Math.sin(frame * 0.02 + x) * 10} rx={60} ry={14} fill="#E8EEF8" opacity={0.6} />
          </g>
        ))}
        <rect x={60} y={560} width={260} height={300} rx={40} fill="#5E4B3A" stroke={C.ink} strokeWidth={6} />
        <text x={190} y={720} textAnchor="middle" fill="#3E3024" fontFamily={fonts.mono} fontSize={22}>
          (empty)
        </text>
        <rect x={360} y={660} width={240} height={30} fill="#C9B79A" stroke={C.ink} strokeWidth={4} />
        <Figure char="kade" x={720} y={1060} scale={1.3} pose="hold" expression="smug" look={[-1, 0]} flip holding={<rect x={-14} y={-50} width={28} height={50} rx={6} fill="#14161E" stroke={C.ink} strokeWidth={3} />} />
      </svg>
      <line x1={960} y1={0} x2={960} y2={1080} stroke={C.ink} strokeWidth={10} />
    </Stage>
  );
};

const OldPhone: React.FC = () => (
  <g transform="translate(-18,-74)">
    <rect x={0} y={0} width={36} height={74} rx={8} fill="#5A5A66" stroke={C.ink} strokeWidth={3} />
    <rect x={5} y={8} width={26} height={22} fill="#A8C49A" />
    {Array.from({length: 9}, (_, i) => (
      <rect key={i} x={6 + (i % 3) * 9} y={36 + Math.floor(i / 3) * 10} width={6} height={6} fill="#2A2A30" />
    ))}
    <line x1={30} y1={0} x2={34} y2={-26} stroke={C.ink} strokeWidth={4} />
  </g>
);

/** Yorkshire, rain: Mags clears a double-decker. */
export const Teaser: React.FC = () => {
  const {frame, t, dur} = useShot();
  const p = interpolate(t, [0.6, 3.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});
  const mx = 360 + p * 1100;
  const my = 900 - Math.sin(p * Math.PI) * 640;
  return (
    <Stage bg="#000">
      <rect width={1920} height={1080} fill="#8C96A6" />
      <PaintedClouds time="storm" frame={frame} id="yorks" y={60} count={8} />
      <rect width={1920} height={1080} fill="#B8C0CC" opacity={0.4} />
      {Array.from({length: 7}, (_, i) => (
        <g key={i} transform={`translate(${i * 300 - 60},0)`}>
          <rect x={0} y={420} width={290} height={480} fill="#8E4A3A" stroke={C.ink} strokeWidth={5} />
          <path d="M-10,430 L145,300 L300,430 Z" fill="#4A4A55" stroke={C.ink} strokeWidth={5} />
          {[40, 170].map((wx) => (
            <rect key={wx} x={wx} y={500} width={80} height={110} fill="#F2E3C2" stroke={C.ink} strokeWidth={4} />
          ))}
          <rect x={110} y={740} width={70} height={160} fill="#2C4A7A" stroke={C.ink} strokeWidth={4} />
          <rect x={120} y={360} width={30} height={60} fill="#6E3A2E" stroke={C.ink} strokeWidth={4} />
        </g>
      ))}
      <rect y={900} width={1920} height={180} fill="#55575E" />
      <g transform="translate(900,940)">
        <rect x={-380} y={-440} width={760} height={420} rx={30} fill="#D4302B" stroke={C.ink} strokeWidth={7} />
        <rect x={-380} y={-230} width={760} height={16} fill="#F2E3C2" />
        {Array.from({length: 6}, (_, i) => (
          <g key={i}>
            <rect x={-350 + i * 120} y={-410} width={100} height={110} rx={8} fill="#9FD3F2" stroke={C.ink} strokeWidth={4} />
            <rect x={-350 + i * 120} y={-200} width={100} height={110} rx={8} fill="#9FD3F2" stroke={C.ink} strokeWidth={4} />
          </g>
        ))}
        {[-250, 250].map((x) => (
          <circle key={x} cx={x} cy={-20} r={56} fill="#1C1C22" stroke={C.ink} strokeWidth={5} />
        ))}
      </g>
      <path d={`M1560,900 q60,-140 160,0 Z`} fill="#3C6E4A" stroke={C.ink} strokeWidth={5} />
      {p > 0 && p < 1 && Array.from({length: 6}, (_, i) => <circle key={i} cx={mx - i * 30} cy={my + i * 20 + 40} r={10 - i} fill="#C77DFF" opacity={0.5 - i * 0.07} />)}
      <Figure char="mags" x={mx} y={my} scale={1.05} pose={p > 0 && p < 1 ? 'armsUp' : 'hold'} expression={p >= 1 ? 'smug' : p > 0 ? 'surprised' : 'neutral'} look={[1, 0]} holding={<rect x={-26} y={-10} width={52} height={40} rx={10} fill="#3B2A20" stroke={C.ink} strokeWidth={3} />} />
      <Rain frame={frame} count={160} opacity={0.35} />
      <text x={80} y={110} fill={C.pearl} fontFamily={fonts.mono} fontWeight={600} fontSize={36} letterSpacing={6} opacity={interpolate(t, [0, 0.4, dur - 0.4, dur], [0, 1, 1, 0])}>
        NEXT · YORKSHIRE
      </text>
    </Stage>
  );
};

/** Mrs. Bello's window: the radio plays, Kemi asleep with the toffee wrapper. */
export const RadioNight: React.FC = () => {
  const {frame, progress} = useShot();
  const cam = lerpCam([1, 960, 540], [1.15, 960, 520], progress);
  return (
    <Stage>
      <Camera progress={1} from={cam} to={cam}>
        <Sky time="night" frame={frame} id="rn" />
        <FarCity time="night" base={700} frame={frame} />
        <Glow id="rnWatch" cx={1560} cy={150} r={50} color="#FFF4D6" opacity={0.7} />
        <rect x={560} y={300} width={800} height={900} fill="#7A5A8E" stroke={C.ink} strokeWidth={8} />
        <path d="M520,310 L960,140 L1400,310 Z" fill="#8E9AAE" stroke={C.ink} strokeWidth={8} />
        <rect x={720} y={440} width={480} height={330} fill="#FFC873" stroke={C.ink} strokeWidth={8} />
        <circle cx={960} cy={610} r={300} fill="#FFC873" opacity={0.15} />
        <Figure char="mrsBello" x={860} y={920} scale={0.9} pose="hold" expression="warm" rim={false} />
        <g transform="translate(1050,760) rotate(-70)">
          <Figure char="kemi" x={0} y={0} scale={0.8} pose="lie" expression="sleep" rim={false} />
        </g>
        <Radio x={1110} y={740} s={0.9} glow={1} frame={frame} />
        <rect x={720} y={770} width={480} height={30} fill="#5E4470" stroke={C.ink} strokeWidth={6} />
        <Palm x={1500} y={1080} s={1.4} sway={Math.sin(frame / 50) * 3} />
        <Grade time="night" />
      </Camera>
    </Stage>
  );
};

void Goat;
void Executor;
void rand;
