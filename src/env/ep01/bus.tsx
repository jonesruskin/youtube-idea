import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Figure} from '../../characters/Figure';
import {extra} from '../../characters/registry';
import {useShot} from '../../engine/shot-context';
import {Camera} from '../../fx/camera';
import {Executor} from '../../fx/vey';
import {C, fonts} from '../../theme';
import {Goat, Stage} from '../common';
import {Ambulance, Car, Danfo, Facades, FarCity, Grade, HOLO, Motes, PaintedClouds, PowerLines, Road, Shadow, Sky} from '../kit';
import {lerpCam, Par} from './street';

const GROUND = 900;
const BUS_X = 980;

type Cam = [number, number, number];
const CAMS: Record<string, [Cam, Cam]> = {
  hook: [[1.35, 1060, 420], [1.45, 1080, 400]],
  hookWide: [[1.0, 980, 460], [0.92, 980, 420]],
  sneeze: [[2.3, 1250, 470], [2.6, 1260, 470]],
  sneezeWide: [[1.6, 1150, 520], [1.0, 980, 500]],
  freeze: [[1.0, 980, 460], [1.0, 980, 460]],
  jam: [[0.95, 1100, 560], [1.05, 1050, 560]],
  rise: [[1.0, 980, 600], [1.1, 1020, 420]],
  squeeze: [[1.05, 1000, 480], [1.0, 1000, 560]],
  landed: [[1.0, 1000, 600], [1.1, 1000, 600]],
};

/** The danfo set: Lagos gridlock under the power lines. */
export const Bus: React.FC = () => {
  const {frame, props, progress, t, dur, lineAt, ramp} = useShot();
  const beat = props.beat as string;
  const [a, b] = CAMS[beat === 'sneeze' && props.wide ? 'sneezeWide' : beat];
  const cam = lerpCam(a, b, Easing.inOut(Easing.cubic)(progress));
  const time = 'afternoon' as const;

  // Bus height above the road (px) and sway, per beat.
  let lift = 0;
  let sway = Math.sin(frame * 0.07) * 3;
  let glow = 1;
  let fist = 0;
  let jonahPose: 'reach' | 'armsUp' | 'handsOnHead' | 'stand' | 'pointUp' | 'hipHand' = 'reach';
  let jonahExpr: 'nervous' | 'alarmed' | 'ecstatic' | 'determined' | 'surprised' | 'happy' | 'confused' | 'serious' = 'nervous';
  let onBus = true;
  if (beat === 'hook') lift = 300 + t * 6;
  if (beat === 'hookWide') lift = 340 + t * 9;
  if (beat === 'sneeze') {
    lift = 380;
    const sneezeLine = (props.sneezeLine as number) ?? 1;
    const sneezeAt = lineAt(sneezeLine) + 0.9;
    fist = t > sneezeAt ? 1 : 0;
    glow = fist ? 0 : 1;
    // the drop, in slow motion: the moment hangs while the narrator speaks
    if (t > sneezeAt) lift -= Math.min(110, (t - sneezeAt) * 160);
    jonahExpr = t > lineAt(sneezeLine) ? 'alarmed' : 'nervous';
  }
  if (beat === 'freeze') {
    lift = 330;
    glow = 0;
    fist = 1;
    jonahExpr = 'alarmed';
  }
  if (beat === 'jam') {
    lift = 0;
    onBus = false;
    jonahPose = 'hipHand';
    jonahExpr = t > lineAt(3) ? 'happy' : 'determined';
    glow = 0;
  }
  if (beat === 'rise') {
    lift = interpolate(t, [0.8, dur], [0, 380], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
    onBus = t > 0.8;
    jonahPose = t < 0.8 ? 'reach' : 'reach';
    jonahExpr = t > lineAt(2) ? 'nervous' : 'ecstatic';
  }
  if (beat === 'squeeze') {
    lift = interpolate(t, [0.4, dur - 0.5], [330, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});
    fist = 0.5;
    glow = 0.6;
    jonahExpr = 'determined';
  }
  if (beat === 'landed') {
    lift = 0;
    onBus = false;
    glow = 0;
    jonahPose = 'armsUp';
    jonahExpr = 'ecstatic';
  }
  const busX = beat === 'landed' || beat === 'squeeze' ? BUS_X + 120 : BUS_X;
  const busY = GROUND + 30 - lift;
  const scared = lift > 40;
  const doorX = busX + 260;
  const doorY = busY - 100;

  // The ambulance waits behind the broken bus — and ends up right underneath it once it floats.
  const ambX = beat === 'landed' ? interpolate(t, [0.5, 3.5], [700, 2600], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)}) : ['rise', 'squeeze'].includes(beat) || (beat === 'sneeze' && props.wide) ? 900 : 420;

  const content = (
    <Stage bg="#000">
      <Camera progress={1} from={cam} to={cam} shake={beat === 'sneeze' && fist ? 0.8 : beat === 'hook' ? 0.25 : 0} frame={frame}>
        <Par depth={0.15} fx={cam[1]} fy={cam[2]}>
          <Sky time={time} frame={frame} id={`bus-${beat}`} />
          <PaintedClouds time={time} frame={frame} id={`busc-${beat}`} y={90} seed={8} />
        </Par>
        <Par depth={0.35} fx={cam[1]} fy={cam[2]}>
          <FarCity time={time} base={540} frame={frame} seed={12} />
        </Par>
        <Par depth={0.8} fx={cam[1]} fy={cam[2]}>
          <Facades time={time} base={GROUND - 20} seed={21} x0={-500} x1={2700} frame={frame} />
        </Par>
        <PowerLines y={250} frame={frame} x0={-300} x1={2700} />
        <Road time={time} y={GROUND} potholes={[1000]} />
        {/* gridlock */}
        <Car x={1700} y={GROUND + 60} color="#3E7CB1" />
        <Car x={2060} y={GROUND + 60} color="#E8E3D8" />
        <Car x={-120} y={GROUND + 200} color="#C2464F" flip />
        <Car x={1500} y={GROUND + 230} color="#F7C82E" flip />
        <Ambulance x={ambX} y={GROUND + 70} frame={frame} s={0.95} />

        {/* crowd on the kerb */}
        {beat !== 'sneeze' &&
          Array.from({length: 10}, (_, i) => (
            <Figure
              key={i}
              char={extra(500 + i)}
              x={-100 + i * 240 + (i > 4 ? 300 : 0)}
              y={GROUND - 4}
              scale={0.82}
              pose={beat === 'landed' ? (i % 2 ? 'armsUp' : 'wave') : lift > 50 ? (i % 3 ? 'pointUp' : 'handsOnHead') : 'stand'}
              expression={beat === 'landed' ? 'ecstatic' : lift > 50 ? 'surprised' : 'neutral'}
              look={[0.3, lift > 50 ? -1 : 0]}
              seed={i}
              rim={false}
            />
          ))}

        <Shadow x={busX} y={GROUND + 30} w={300 * Math.max(0.3, 1 - lift / 600)} opacity={0.3 * Math.max(0.2, 1 - lift / 500)} />
        <Danfo x={busX} y={busY} frame={frame} tilt={lift > 10 ? sway : 0} scared={scared} doorOpen={onBus} broken={beat === 'jam'} glow={lift > 10 ? glow : 0} />

        {/* smoke from the broken axle */}
        {beat === 'jam' &&
          [0, 1, 2, 3].map((k) => {
            const p = ((t * 0.4 + k / 4) % 1);
            return <circle key={k} cx={busX + 200 + p * 40} cy={GROUND - 20 - p * 200} r={20 + p * 40} fill="#8A8A90" opacity={(1 - p) * 0.5} />;
          })}

        {/* Jonah */}
        {onBus ? (
          <Figure char="jonah" x={doorX + 40} y={doorY + 230} scale={0.95} pose={jonahPose} walk={beat === 'hook' || beat === 'hookWide' ? t * 8 : undefined} expression={jonahExpr} palmGlow={glow} fist={fist} look={[-0.6, 0.6]} />
        ) : (
          <>
            <Shadow x={beat === 'landed' ? 1520 : 1450} y={GROUND} />
            <Figure char="jonah" x={beat === 'landed' ? 1520 : 1450} y={GROUND} scale={0.95} pose={beat === 'rise' && t < 0.8 ? 'reach' : jonahPose} expression={jonahExpr} palmGlow={beat === 'rise' ? 1 : 0} look={[-1, -0.2]} flip={false} />
          </>
        )}
        {beat === 'jam' && <Executor x={1600} y={640} scale={0.45} frame={frame} />}
        {beat === 'landed' && <Figure char={extra(530, {top: 'wrapper', topColor: '#C2464F', topAccent: '#F2C14E', hair: 'headwrap', hairColor: '#C2464F'})} x={1700} y={GROUND} scale={0.95} pose="talk" expression="happy" look={[-1, 0]} flip seed={4} rim={false} />}

        {/* the goat, floating past — set-up for the whole episode's running gag */}
        {(beat === 'hook' || beat === 'hookWide') && (
          <g transform={`translate(${interpolate(t, [0, dur], [beat === 'hook' ? 700 : 400, beat === 'hook' ? 1500 : 1300])},${300 - t * 10}) rotate(${t * 20})`}>
            <Goat x={0} y={0} s={0.55} frame={frame} unimpressed />
          </g>
        )}

        {/* sneeze: dust particles and the nose twitch */}
        {beat === 'sneeze' &&
          Array.from({length: 10}, (_, i) => (
            <circle key={i} cx={doorX - 20 + Math.sin(frame * 0.1 + i) * 30} cy={doorY + 40 + Math.cos(frame * 0.07 + i * 2) * 30} r={2.5} fill="#E8D9B8" opacity={0.7} />
          ))}

        <Motes frame={frame} count={24} />
        <Grade time={time} />
      </Camera>

      {/* "slow squeeze" hand diagram — the rule, shown, not written */}
      {beat === 'squeeze' && (
        <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
          <g transform="translate(1440,120)" opacity={ramp(0.6, 0.6)}>
            <rect x={-30} y={-30} width={460} height={230} rx={22} fill="#0B1026AA" stroke={HOLO.line} strokeWidth={3} />
            {[0, 1, 2].map((i) => {
              const active = i === 1;
              return (
                <g key={i} transform={`translate(${70 + i * 140},70)`} opacity={active ? 1 : 0.5}>
                  <circle r={active ? 50 : 42} fill={i === 0 ? '#FF9A3C55' : 'none'} stroke={HOLO.line} strokeWidth={active ? 5 : 3} />
                  {i === 0 && [0, 1, 2, 3].map((f) => <line key={f} x1={-18 + f * 12} y1={-8} x2={-22 + f * 14} y2={-34} stroke={HOLO.line} strokeWidth={5} strokeLinecap="round" />)}
                  {i === 1 && [0, 1, 2, 3].map((f) => <path key={f} d={`M${-18 + f * 12},-6 q0,-20 8,-22`} stroke={HOLO.line} strokeWidth={5} fill="none" strokeLinecap="round" />)}
                  {i === 2 && <rect x={-20} y={-24} width={40} height={30} rx={10} fill={HOLO.line} />}
                  <rect x={-16} y={-2} width={32} height={28} rx={8} fill={i === 2 ? HOLO.line : 'none'} stroke={HOLO.line} strokeWidth={4} />
                  <text x={0} y={100} textAnchor="middle" fill={HOLO.line} fontFamily={HOLO.text} fontSize={24}>
                    {['FLOAT', 'GENTLE', 'FALL'][i]}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      )}

    </Stage>
  );

  if (beat === 'freeze') {
    const g = interpolate(t, [0, 0.3], [0, 0.85], {extrapolateRight: 'clamp'});
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{filter: `grayscale(${g}) contrast(1.08)`}}>{content}</AbsoluteFill>
        <AbsoluteFill>
          <svg viewBox="0 0 1920 1080" width="100%" height="100%">

          <g opacity={ramp(0.5, 0.4)}>
            <rect x={0} y={420} width={1920} height={220} fill="#0B1026" opacity={0.7} />
            <text x={960} y={530} textAnchor="middle" fill={C.pearl} fontFamily={fonts.display} fontWeight={900} fontSize={110} letterSpacing={6}>
              THE BLINK FILES
            </text>
            <text x={960} y={598} textAnchor="middle" fill={C.gold} fontFamily={fonts.mono} fontSize={34} letterSpacing={10}>
              EPISODE 1 · ZERO-G
            </text>
          </g>
          </svg>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  return content;
};
