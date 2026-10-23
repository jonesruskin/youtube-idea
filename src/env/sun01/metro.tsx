import React, {useId} from 'react';
import {interpolate} from 'remotion';
import {Dog} from '../../characters/Dog';
import {Figure} from '../../characters/Figure';
import {extra} from '../../characters/registry';
import {useShot} from '../../engine/shot-context';
import {Bloom} from '../../fx/cinema/atmos';
import {Cine, Plane, type CamKey} from '../../fx/cinema/camera';
import {fmtCountdown, WatchCloseUp} from '../../fx/cinema/Watch';
import {Stars} from '../../fx/sky';
import {C, fonts} from '../../theme';
import {Stage} from '../common';
import {Carriage, ChalkSun, Flame, NightGrade, P, StringLights, Tent} from './parts';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** The vault: a long arched tunnel with tiled walls, the platform and the track. */
const Vault: React.FC<{light: number; frame: number; id: string}> = ({light, id}) => (
  <g>
    <defs>
      <linearGradient id={`${id}v`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1A1418" />
        <stop offset="1" stopColor={light > 0.5 ? '#6A4A36' : '#3A2A26'} />
      </linearGradient>
    </defs>
    <rect x={-600} y={-500} width={3200} height={2200} fill={`url(#${id}v)`} />
    {Array.from({length: 9}, (_, i) => (
      <path key={i} d={`M${-500 + i * 360},1100 L${-500 + i * 360},300 Q${-320 + i * 360},-120 ${-140 + i * 360},300`} stroke="#00000044" strokeWidth={30} fill="none" />
    ))}
    {/* tiles */}
    {Array.from({length: 12}, (_, r) => (
      <path key={r} d={`M-600,${380 + r * 36} L2600,${380 + r * 36}`} stroke="#00000022" strokeWidth={3} />
    ))}
    <rect x={-600} y={820} width={3200} height={700} fill={light > 0.5 ? '#7A5A44' : '#3A2C28'} />
    <rect x={-600} y={812} width={3200} height={16} fill="#E8B04B" opacity={0.75} />
  </g>
);

export const Metro: React.FC = () => {
  const {props, frame, t, dur, progress, speaking} = useShot();
  const id = useId().replace(/:/g, '');
  const beat = props.beat as string;
  const keys: Record<string, CamKey[]> = {
    city: [[0, 1.0, 960, 200], [1, 1.12, 1000, 560]],
    biscuitFans: [[0, 1.4, 960, 700], [1, 1.25, 960, 660]],
    sunrise: [[0, 1.08, 960, 560], [1, 1.16, 900, 540]],
    air: [[0, 1.7, 980, 620], [1, 1.9, 1000, 600]],
    food: [[0, 1.05, 760, 540], [1, 1.12, 1180, 520]],
    blackout: [[0, 1.12, 960, 560, 0], [1, 1.22, 960, 600, -2]],
    restored: [[0, 1.2, 960, 600], [1, 1.05, 960, 540]],
    wall: [[0, 1.3, 300, 520], [1, 1.3, 1640, 520]],
  };
  // Light: blackout kills it at ~1s; restored brings it back at ~0.6s; sunrise ramps it up.
  const light =
    beat === 'blackout'
      ? interpolate(t, [0.8, 1.1], [1, 0], clamp) * (t < 1.1 ? (Math.sin(frame * 2.1) > -0.3 ? 1 : 0.2) : 1)
      : beat === 'restored'
        ? interpolate(t, [0.4, 0.7], [0, 1], clamp) * (t < 0.9 ? (Math.sin(frame * 1.7) > 0 ? 1 : 0.3) : 1)
        : beat === 'sunrise'
          ? interpolate(t, [0.6, 2.2], [0.25, 1], clamp)
          : 1;
  const lamps = light;
  const cheer = beat === 'restored' && t > 0.9;

  if (beat === 'wall') {
    return (
      <Stage bg="#000">
        <Cine keys={keys.wall} progress={progress} frame={frame} handheld={0.25}>
          <Plane depth={1}>
            <rect x={-600} y={-400} width={3600} height={1900} fill="#5A4636" />
            {Array.from({length: 14}, (_, r) => (
              <path key={r} d={`M-600,${-200 + r * 80} L3000,${-200 + r * 80}`} stroke="#00000022" strokeWidth={3} />
            ))}
            {/* a year of suns, drawn by a growing hand */}
            {Array.from({length: 6 * 21}, (_, i) => {
              const col = i % 21;
              const row = Math.floor(i / 21);
              return <ChalkSun key={i} x={-120 + col * 110 + (row % 2) * 30} y={140 + row * 120} r={24 + (i % 5)} seed={i + 30} color={['#FFE7A6', '#FFD08A', '#F4EFE6', '#FFC37A'][i % 4]} width={3.5} />;
            })}
            <ChalkSun x={2040} y={380} r={40} seed={365} draw={interpolate(t, [dur * 0.45, dur - 0.6], [0, 1], clamp)} color="#FFE7A6" width={6} />
            <rect x={-600} y={860} width={3600} height={700} fill="#3A2C28" />
            <Figure char="mira" x={1890} y={900} scale={1.25} pose={{lArm: [-12, 10], rArm: [148, 6], lLeg: [-3, 1], rLeg: [3, -1], headTilt: -6}} expression="happy" look={[1, -0.6]} rim seed={2} />
            <Bloom x={1700} y={300} r={900} color="#FFB25A" opacity={0.35} />
            <NightGrade amount={0.25} color="#3A1E14" />
          </Plane>
        </Cine>
      </Stage>
    );
  }

  if (beat === 'air') {
    return (
      <Stage bg="#000">
        <Cine keys={keys.air} progress={progress} frame={frame} handheld={0.35}>
          <Plane depth={0.5} blur={7}>
            <Vault light={1} frame={frame} id={id} />
            <StringLights x1={-300} y1={260} x2={2200} y2={240} sag={70} frame={frame} />
            <Tent x={500} y={830} color="#3C8D6E" />
            <Tent x={1500} y={830} s={1.2} color="#C2464F" />
          </Plane>
          <Plane depth={1}>
            <Figure char="you" x={1160} y={980} scale={1.15} pose="sitHug" expression="warm" look={[-1, 0.4]} rim />
            <Figure char="mira" x={840} y={940} scale={1.05} pose="stand" expression={speaking('MIRA') ? 'nervous' : 'curious'} look={[1, -0.5]} rim seed={2} />
            <Bloom x={1000} y={600} r={600} color="#FFB25A" opacity={0.3} />
          </Plane>
        </Cine>
      </Stage>
    );
  }

  const people = Array.from({length: 8}, (_, i) => ({x: 100 + i * 250 + ((i * 37) % 60), s: 0.85 + ((i * 13) % 5) * 0.08, i})).filter((p) => Math.abs(p.x - 960) > 230);
  return (
    <Stage bg="#000">
      <Cine keys={keys[beat] ?? keys.city} progress={progress} frame={frame} handheld={beat === 'blackout' ? 0.7 : 0.3}>
        <Plane depth={0.6}>
          <Vault light={lamps} frame={frame} id={id} />
          <Carriage x={1100} y={790} w={1200} lit={lamps} />
          <Carriage x={-500} y={790} w={1000} lit={lamps} color="#7A889E" />
          {/* grow-light hall through an archway */}
          {beat === 'food' && (
            <g>
              <path d="M1300,800 L1300,420 Q1500,250 1700,420 L1700,800 Z" fill="#2A1430" stroke={C.ink} strokeWidth={6} />
              {Array.from({length: 4}, (_, r) => (
                <g key={r}>
                  <rect x={1330} y={450 + r * 90} width={340} height={10} fill={P.grow} />
                  {Array.from({length: 10}, (_, k) => (
                    <path key={k} d={`M${1345 + k * 33},${530 + r * 90} q-8,-22 0,-34 m0,34 q8,-20 0,-34`} stroke="#5AD06A" strokeWidth={5} fill="none" />
                  ))}
                </g>
              ))}
              <Bloom x={1500} y={560} r={420} color={P.grow} opacity={0.55} />
            </g>
          )}
        </Plane>
        <Plane depth={0.8}>
          <StringLights x1={-400} y1={180} x2={900} y2={160} sag={80} on={lamps} frame={frame} />
          <StringLights x1={900} y1={160} x2={2300} y2={200} sag={90} on={lamps} frame={frame} />
          <StringLights x1={-200} y1={360} x2={2200} y2={340} sag={60} on={lamps} frame={frame} color="#FFC27A" n={22} />
          {/* back row, farther away */}
          {beat !== 'biscuitFans' &&
            Array.from({length: 9}, (_, i) => (
              <Figure key={`b${i}`} char={extra(i + 90)} x={60 + i * 230} y={830} scale={0.55} pose={cheer ? 'armsUp' : i % 2 ? 'talk' : 'stand'} expression={cheer ? 'ecstatic' : 'neutral'} seed={i + 9} rim={false} opacity={0.85} />
            ))}
          {[[260, '#3C8D6E'], [700, '#E8B04B'], [1180, '#5E8FC9'], [1660, '#C2464F']].map(([x, c], i) => (
            <Tent key={i} x={x as number} y={860} s={1.1} color={c as string} lit={lamps} />
          ))}
          {beat !== 'biscuitFans' &&
            people.map((p) => (
              <Figure
                key={p.i}
                char={extra(p.i + 40)}
                x={p.x}
                y={910}
                scale={p.s * 0.9}
                pose={cheer ? 'armsUp' : beat === 'sunrise' && t > 1.4 ? (p.i % 2 ? 'armsUp' : 'stand') : beat === 'food' ? 'hold' : p.i % 3 ? 'stand' : 'talk'}
                expression={cheer ? 'ecstatic' : beat === 'blackout' ? 'alarmed' : 'neutral'}
                look={beat === 'blackout' ? [0, -1] : [0, 0]}
                breath={beat === 'blackout' && t > 1.2}
                seed={p.i}
                rim={false}
              />
            ))}
          {beat === 'biscuitFans' && (
            <g>
              {[640, 790, 1130, 1280, 940].map((x, k) => (
                <Figure key={k} char={extra(k + 70, {height: 0.7, head: 1.18})} x={x} y={930} scale={1.0} pose="reach" flip={x > 960} expression="ecstatic" look={[x > 960 ? -1 : 1, 0.5]} seed={k} rim={false} />
              ))}
              <Dog x={960} y={940} s={1.05} pose="beg" wag={1} lookUp={0.5} />
              <Figure char="you" x={300} y={940} scale={1.2} pose="crossArms" expression="happy" look={[1, 0]} rim />
              <Figure char="mira" x={1650} y={940} scale={1.1} pose="hold" expression="ecstatic" look={[-1, 0]} rim seed={2} />
            </g>
          )}
          {(beat === 'city' || beat === 'sunrise' || beat === 'food' || beat === 'blackout' || beat === 'restored') && (
            <g>
              <Figure char="you" x={980} y={960} scale={1.2} pose={cheer ? 'armsUp' : 'stand'} expression={cheer ? 'ecstatic' : beat === 'blackout' ? 'alarmed' : 'warm'} look={[0, beat === 'blackout' ? -1 : 0]} breath={beat === 'blackout' && t > 1.2} hoodUp={beat === 'blackout'} rim />
              <Figure char="mira" x={1110} y={960} scale={1.05} pose={cheer ? 'armsUp' : 'hold'} expression={cheer ? 'ecstatic' : beat === 'blackout' ? 'sad' : 'happy'} look={[-0.6, 0]} seed={2} rim />
              <Dog x={820} y={960} s={0.75} pose={beat === 'blackout' ? 'lie' : 'sit'} wag={cheer ? 1 : 0.4} rim="#FFB25A" />
            </g>
          )}
          {/* lanterns: the only light left when the power dies */}
          {[180, 620, 1400, 1780].map((x, i) => (
            <Flame key={x} x={x} y={880} s={0.9} frame={frame} kind="lantern" seed={i} glow={beat === 'blackout' ? 1.2 : 0.6} />
          ))}
        </Plane>
        <Plane depth={1}>
          <NightGrade amount={(1 - lamps) * 0.75 + 0.1} color="#1A1030" />
          {lamps > 0.3 && <Bloom x={960} y={300} r={1100} color="#FFB25A" opacity={0.28 * lamps} />}
          {beat === 'sunrise' && <Bloom x={960} y={200} r={1300} color="#FFD49A" opacity={0.45 * lamps} />}
        </Plane>
      </Cine>
    </Stage>
  );
};

/** End screen: the watch still counting, space for two video cards and the subscribe button. */
export const EndSun: React.FC = () => {
  const {frame, t} = useShot();
  const s = 259196 - Math.floor(t);
  const fade = interpolate(t, [0, 0.8], [0, 1], clamp);
  return (
    <Stage bg="#000">
      <g opacity={fade}>
        <Stars frame={frame} count={300} seed={9} maxR={1.6} opacity={0.6} />
        <g transform="translate(960,270) scale(0.32) translate(-960,-540)">
          <WatchCloseUp main={fmtCountdown(s)} light="starlight" frame={frame} alarm bare />
        </g>
        {[[250, 470], [1110, 470]].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width={560} height={315} rx={18} fill="#FFFFFF08" stroke="#FFFFFF22" strokeWidth={3} />
        ))}
        <text x={960} y={920} textAnchor="middle" fontFamily={fonts.display} fontWeight={300} fontSize={36} letterSpacing={14} fill="#F4EFE6" opacity={0.75}>
          THE BLINK FILES
        </text>
      </g>
    </Stage>
  );
};
