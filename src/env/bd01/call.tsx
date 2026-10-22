import React from 'react';
import {interpolate} from 'remotion';
import {Figure} from '../../characters/Figure';
import {characters, extra, type CharacterDesign} from '../../characters/registry';
import {Camera} from '../../fx/camera';
import {C} from '../../theme';
import {Skyline, Stage} from '../common';
import {Sky} from '../kit';
import {BD, Document, Mic, Phone, useBeatCam, type BeatTable} from './shared';

const BEATS: BeatTable = {
  ring: {cam: [[1.0, 960, 540], [1.06, 980, 540]]},
  laugh: {cam: [[1.06, 980, 540], [1.1, 960, 540]]},
  ask: {cam: [[1.1, 960, 540], [1.35, 760, 500]]},
  montage: {cam: [[1.0, 960, 540], [1.1, 960, 540]]},
};

/** Old friend's video call, framed in a giant phone screen. */
const VideoCall: React.FC<{frame: number; t: number; beat: string; lineAt: (i: number) => number}> = ({frame, t, beat, lineAt}) => {
  const laughing = beat === 'laugh';
  const bob = laughing ? Math.abs(Math.sin(frame * 0.5)) * 10 : 0;
  const friendExpr = beat === 'ask' ? 'nervous' : laughing ? 'ecstatic' : t > lineAt(1) - 0.2 ? 'ecstatic' : 'happy';
  const youExpr = beat === 'ask' ? (t > lineAt(0) + 2.2 ? 'bittersweet' : 'happy') : laughing || t > lineAt(2) - 0.3 ? 'ecstatic' : 'happy';
  return (
    <g>
      {/* your office at sunset */}
      <Sky time="sunset" frame={frame} id="callsky" />
      <Skyline seed={21} base={900} color="#5A3E6E" style="tower" minH={200} maxH={560} x0={-200} x1={2200} litChance={0.3} frame={frame} />
      <rect x={-200} y={-200} width={2400} height={1500} fill="#2A1E3A" opacity={0.35} />
      <rect x={-200} y={880} width={2400} height={400} fill="#2A2F3A" />
      <Figure char="richest" x={560} y={1220 + bob * 0.6} scale={1.75} pose="hold" expression={youExpr} look={[1, 0]} holding={<Phone glow />} />
      {/* the phone screen */}
      <g transform="translate(1060,90)">
        <rect x={0} y={0} width={620} height={900} rx={60} fill="#15192A" stroke={C.ink} strokeWidth={8} />
        <defs>
          <clipPath id="vc">
            <rect x={22} y={22} width={576} height={856} rx={44} />
          </clipPath>
        </defs>
        <g clipPath="url(#vc)">
          <rect x={0} y={0} width={620} height={900} fill="#5FA88E" />
          <rect x={0} y={540} width={620} height={400} fill="#4E8C76" />
          {[90, 210, 330].map((y) => (
            <rect key={y} x={40} y={y} width={200} height={14} fill="#3E6E5C" />
          ))}
          {[60, 110, 160].map((x, i) => (
            <rect key={x} x={x} y={60} width={32} height={30} fill={['#F2C14E', '#E35D5D', '#7FD6FF'][i]} />
          ))}
          <Figure char="friend" x={320} y={1240 + bob} scale={2.3} pose={beat === 'ask' ? 'handsOnHead' : laughing ? 'shrug' : 'wave'} expression={friendExpr} look={[0, 0]} />
        </g>
        <rect x={250} y={34} width={120} height={20} rx={10} fill="#15192A" />
      </g>
    </g>
  );
};

const FACES: {char: CharacterDesign | keyof typeof characters; prop: React.ReactNode}[] = [
  {char: 'ada', prop: <Document />},
  {char: extra(611, {top: 'suit', topColor: '#1A1D28', topAccent: '#111111', innerColor: '#FFFFFF', tie: '#8E2B4E', skin: '#E8C4A8', skinShade: '#CFA987', hair: 'slick', hairColor: '#B8B8C0'}), prop: undefined},
  {char: extra(612, {top: 'blouse', topColor: '#C2464F', topAccent: '#9E3540', skin: '#A86E48', hair: 'bob', hairColor: '#17110F', earrings: true}), prop: <Mic />},
  {char: 'friend', prop: undefined},
];

/** Every smile comes with a hand: four faces reaching for you, a gold glint in each palm. */
const Montage: React.FC<{frame: number; t: number; dur: number}> = ({frame, t, dur}) => {
  const seg = dur / FACES.length;
  return (
    <g>
      <defs>
        <radialGradient id="mont" cx="50%" cy="45%" r="70%">
          <stop offset="0" stopColor="#3A2A40" />
          <stop offset="1" stopColor="#0A0E22" />
        </radialGradient>
      </defs>
      <rect x={-200} y={-200} width={2400} height={1500} fill="url(#mont)" />
      {FACES.map((f, i) => {
        const local = t - i * seg;
        const a = interpolate(local, [0, 0.35, seg - 0.35, seg], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        if (a <= 0) return null;
        const base: CharacterDesign = typeof f.char === 'string' ? characters[f.char] : f.char;
        const gold: CharacterDesign = {...base, signature: BD.gold, speaker: undefined};
        const push = 1 + Math.max(0, local) * 0.03;
        const side = i % 2 ? 1 : -1;
        return (
          <g key={i} opacity={a} transform={`translate(${960 + side * 220},${560}) scale(${push}) translate(${-(960 + side * 220)},${-560})`}>
            <Figure char={gold} x={960 + side * 160} y={1260} scale={2.3} pose={{lArm: [-12, 6], rArm: [70, -40], lLeg: [-3, 1], rLeg: [3, -1], headTilt: side * 3}} expression="happy" look={[0, 0.1]} palmGlow={0.6 + 0.2 * Math.sin(frame * 0.3)} glowHand="r" holding={f.prop} flip={side > 0} rim />
          </g>
        );
      })}
    </g>
  );
};

export const CallSet: React.FC = () => {
  const {frame, beat, cam, t, lineAt, dur} = useBeatCam(BEATS, 'ring');
  return (
    <Stage bg="#0A0E22">
      <Camera progress={1} from={cam} to={cam}>
        {beat === 'montage' ? <Montage frame={frame} t={t} dur={dur} /> : <VideoCall frame={frame} t={t} beat={beat} lineAt={lineAt} />}
      </Camera>
    </Stage>
  );
};
