import React from 'react';
import {interpolate} from 'remotion';
import {useShot} from '../../engine/shot-context';
import {Stars} from '../../fx/sky';
import {Stage} from '../common';
import {BD, ease01, Emblem} from './shared';

/** Title sting: the emblem's clock hand sweeps once and the sun wanes into a moon. Wordless. */
export const BdTitle: React.FC = () => {
  const {frame, t, dur} = useShot();
  const turn = ease01(t, 0.2, Math.max(1, dur - 0.8));
  const s = interpolate(t, [0, dur], [0.95, 1.08]);
  return (
    <Stage bg={BD.night}>
      <Stars frame={frame} count={260} w={1920} h={1080} seed={3} opacity={0.7} maxR={1.8} />
      <Emblem x={960} y={540} s={s * 1.6} turn={turn} glow={0.6 + 0.4 * Math.sin(frame * 0.1)} />
    </Stage>
  );
};

/** End card: the emblem, and a lit window onto the next borrowed day (a ball on the penalty spot). */
export const BdEnd: React.FC = () => {
  const {frame, t} = useShot();
  const a = ease01(t, 0.3, 1);
  return (
    <Stage bg={BD.night}>
      <Stars frame={frame} count={220} w={1920} h={1080} seed={8} opacity={0.6} maxR={1.6} />
      <Emblem x={560} y={540} s={1.1} turn={1} glow={0.7} />
      <g opacity={a} transform={`translate(${1010 + (1 - a) * 60},300)`}>
        <rect x={0} y={0} width={720} height={420} rx={28} fill="#0E1430" stroke={BD.gold} strokeWidth={6} />
        <defs>
          <clipPath id="nextEp">
            <rect x={10} y={10} width={700} height={400} rx={22} />
          </clipPath>
        </defs>
        <g clipPath="url(#nextEp)">
          <rect x={0} y={0} width={720} height={420} fill="#0B1026" />
          <path d="M-60,250 A420,190 0 0,1 780,250 L780,420 L-60,420 Z" fill="#2F7D4A" />
          <path d="M-80,250 A440,200 0 0,1 800,250" fill="none" stroke="#E35D5D" strokeWidth={60} opacity={0.6} />
          {Array.from({length: 30}, (_, i) => (
            <circle key={i} cx={20 + i * 24} cy={170 + Math.sin(i * 1.7 + frame * 0.4) * 6} r={7} fill={['#F6C453', '#FFFFFF', '#7FD6FF'][i % 3]} opacity={0.8} />
          ))}
          <circle cx={120} cy={60} r={90} fill="#FFF8E4" opacity={0.25} />
          <circle cx={600} cy={60} r={90} fill="#FFF8E4" opacity={0.25} />
          <ellipse cx={360} cy={360} rx={34} ry={9} fill="#EAF5EC" />
          <circle cx={360} cy={336} r={28} fill="#FFFFFF" stroke="#0B1026" strokeWidth={4} />
          <path d="M360,322 L371,330 L367,343 L353,343 L349,330 Z" fill="#1A1A1A" />
        </g>
      </g>
    </Stage>
  );
};
