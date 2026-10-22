import React from 'react';
import {interpolate} from 'remotion';
import {Camera} from '../../fx/camera';
import {rand, Stars} from '../../fx/sky';
import {Stage} from '../common';
import {Jet} from './jet';
import {BD, useBeatCam, type BeatTable} from './shared';

const BEATS: BeatTable = {
  clock: {cam: [[1.0, 960, 540], [1.18, 960, 540]]},
  wind: {cam: [[1.0, 960, 540], [1.05, 960, 540]]},
};

const STRIKE = 2.0; // matches the 'clock' sfx: ticks, then the bell at +2s

const Clock: React.FC<{frame: number; t: number}> = ({frame, t}) => {
  const minute = interpolate(t, [0, STRIKE], [-34, 0], {extrapolateRight: 'clamp'});
  const hour = interpolate(t, [0, STRIKE], [-3, 0], {extrapolateRight: 'clamp'});
  const pulse = t > STRIKE ? Math.max(0, 1 - (t - STRIKE) / 1.6) : 0;
  return (
    <g>
      <rect x={-400} y={-400} width={2800} height={2000} fill="#070A1C" />
      <Stars frame={frame} count={220} w={2000} h={1100} seed={77} opacity={0.7} maxR={1.8} />
      <circle cx={960} cy={540} r={430 + pulse * 260} fill={BD.gold} opacity={0.12 * pulse} />
      <circle cx={960} cy={540} r={400} fill="#0E1430" stroke={BD.gold} strokeWidth={14} />
      <circle cx={960} cy={540} r={372} fill="none" stroke={BD.goldDeep} strokeWidth={3} />
      {Array.from({length: 60}, (_, i) => {
        const a = (i / 60) * Math.PI * 2;
        const big = i % 5 === 0;
        return <line key={i} x1={960 + Math.sin(a) * (big ? 320 : 345)} y1={540 - Math.cos(a) * (big ? 320 : 345)} x2={960 + Math.sin(a) * 365} y2={540 - Math.cos(a) * 365} stroke={BD.gold} strokeWidth={big ? 9 : 3} strokeLinecap="round" />;
      })}
      <line x1={960} y1={540} x2={960} y2={330} stroke="#FFF6E0" strokeWidth={18} strokeLinecap="round" transform={`rotate(${hour},960,540)`} />
      <line x1={960} y1={560} x2={960} y2={230} stroke="#FFF6E0" strokeWidth={10} strokeLinecap="round" transform={`rotate(${minute},960,540)`} />
      <circle cx={960} cy={540} r={20} fill={BD.gold} />
      <rect x={-400} y={-400} width={2800} height={2000} fill="#FFFFFF" opacity={0.35 * pulse * pulse} />
    </g>
  );
};

/** The day peels away like paper and leaves only light. */
const Wind: React.FC<{frame: number; t: number; dur: number}> = ({frame, t, dur}) => {
  const p = Math.min(1, t / (dur * 0.7));
  const R = rand(19);
  const shards = Array.from({length: 70}, () => ({x: R() * 2000 - 40, y: R() * 1100 - 20, w: 60 + R() * 180, h: 30 + R() * 120, d: R() * 0.5, c: ['#0E1430', '#1B2A4E', '#B9302F', BD.cream, '#2F7D4A', BD.gold][Math.floor(R() * 6)], spin: R() * 2 - 1}));
  return (
    <g>
      <rect x={-400} y={-400} width={2800} height={2000} fill="#FFFFFF" />
      <circle cx={960} cy={540} r={900} fill="#FFF6E0" />
      {/* the day, as a torn collage */}
      <g opacity={1 - p * 0.2}>
        {shards.map((s, i) => {
          const k = Math.max(0, Math.min(1, (p - s.d) / 0.5));
          const fx = s.x + k * k * 2600;
          const fy = s.y - k * 300 * (0.5 + s.spin);
          return <rect key={i} x={fx} y={fy} width={s.w} height={s.h} fill={s.c} opacity={1 - k} transform={`rotate(${s.spin * 140 * k},${fx + s.w / 2},${fy + s.h / 2})`} />;
        })}
      </g>
      <g opacity={Math.max(0, 1 - p * 1.6)}>
        <Jet x={980 + p * 900} y={420} s={0.6} rot={-6} gear={false} />
      </g>
      <rect x={-400} y={-400} width={2800} height={2000} fill="#FFFFFF" opacity={Math.max(0, (t - dur * 0.75) / (dur * 0.25))} />
      {void frame}
    </g>
  );
};

export const MidnightSet: React.FC = () => {
  const {frame, beat, cam, t, dur} = useBeatCam(BEATS, 'clock');
  return (
    <Stage bg="#070A1C">
      <Camera progress={1} from={cam} to={cam}>
        {beat === 'clock' ? <Clock frame={frame} t={t} /> : <Wind frame={frame} t={t} dur={dur} />}
      </Camera>
    </Stage>
  );
};
