import React from 'react';
import {interpolate} from 'remotion';
import {Figure} from '../../characters/Figure';
import {Camera} from '../../fx/camera';
import {rand} from '../../fx/sky';
import {C} from '../../theme';
import {Skyline, Stage} from '../common';
import {PaintedClouds, Shadow, Sky} from '../kit';
import {BD, Bread, ease01, Phone, Tablet, useBeatCam, type BeatTable} from './shared';

const BEATS: BeatTable = {
  takeoff: {cam: [[1.0, 960, 560], [1.08, 1100, 520]]},
  cabin: {cam: [[1.15, 960, 580], [1.25, 900, 600]]},
  island: {cam: [[1.3, 960, 520], [1.5, 960, 480]]},
  paris: {cam: [[1.15, 900, 600], [1.3, 860, 620]]},
  parisLeave: {cam: [[1.3, 960, 620], [1.4, 980, 620]]},
  phoneRings: {cam: [[1.25, 1000, 640], [1.45, 980, 680]]},
  phoneCall: {cam: [[1.5, 760, 560], [1.6, 760, 540]]},
  phoneHang: {cam: [[1.25, 960, 600], [1.3, 1000, 600]]},
};

/** The jet: white, gold stripe, no livery words. Origin at the main wheels. */
export const Jet: React.FC<{x: number; y: number; s?: number; rot?: number; gear?: boolean}> = ({x, y, s = 1, rot = 0, gear = true}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    {gear && (
      <g>
        <line x1={-40} y1={-40} x2={-40} y2={-8} stroke="#555" strokeWidth={8} />
        <circle cx={-40} cy={-6} r={14} fill="#1C1C22" />
        <line x1={250} y1={-40} x2={250} y2={-10} stroke="#555" strokeWidth={6} />
        <circle cx={250} cy={-8} r={10} fill="#1C1C22" />
      </g>
    )}
    <path d="M-330,-110 L-390,-250 L-330,-250 L-250,-120 Z" fill="#F4F4F6" stroke={C.ink} strokeWidth={5} />
    <path d="M-385,-245 L-338,-245" stroke={BD.gold} strokeWidth={10} />
    <path d="M-360,-90 Q-360,-130 -300,-132 L240,-132 Q330,-130 360,-90 Q330,-50 240,-48 L-300,-48 Q-360,-50 -360,-90 Z" fill="#FAFAFB" stroke={C.ink} strokeWidth={6} />
    <path d="M-350,-78 L350,-78" stroke={BD.gold} strokeWidth={9} />
    {Array.from({length: 9}, (_, i) => (
      <ellipse key={i} cx={-220 + i * 52} cy={-102} rx={11} ry={13} fill="#2E3F5E" stroke={C.ink} strokeWidth={2.5} />
    ))}
    <path d="M300,-118 Q336,-112 350,-98 L318,-98 Z" fill="#2E3F5E" stroke={C.ink} strokeWidth={2.5} />
    <path d="M-60,-70 L40,-70 L-120,10 L-170,10 Z" fill="#E6E6EA" stroke={C.ink} strokeWidth={5} />
    <rect x={-300} y={-160} width={110} height={40} rx={20} fill="#E6E6EA" stroke={C.ink} strokeWidth={5} />
    <circle cx={-190} cy={-140} r={14} fill="#2A2A30" />
  </g>
);

const Cabin: React.FC<{frame: number; t: number; beat: string; lineAt: (i: number) => number; dur: number}> = ({frame, t, beat, lineAt, dur}) => {
  const ringing = beat === 'phoneRings' && t < lineAt(0) + 0.4;
  const R = rand(4);
  const clouds = Array.from({length: 8}, () => ({x: R() * 2400, y: 60 + R() * 380, s: 0.6 + R() * 0.8}));
  return (
    <g>
      <rect x={-600} y={-300} width={3200} height={1600} fill="#E9DDC7" />
      <path d="M-600,-40 Q960,-160 2600,-40 L2600,80 Q960,-40 -600,80 Z" fill="#DCCDB2" />
      {[260, 660, 1060, 1460].map((wx, i) => (
        <g key={i}>
          <defs>
            <clipPath id={`cw${i}`}>
              <rect x={wx - 90} y={230} width={180} height={230} rx={80} />
            </clipPath>
          </defs>
          <g clipPath={`url(#cw${i})`}>
            <rect x={wx - 100} y={220} width={200} height={250} fill="#8FC8F0" />
            {clouds.map((c, k) => {
              const cx = ((c.x - frame * 6 * c.s) % 2400 + 2400) % 2400 - 300;
              return <ellipse key={k} cx={cx} cy={c.y + 160} rx={90 * c.s} ry={28 * c.s} fill="#FFFFFF" opacity={0.9} />;
            })}
          </g>
          <rect x={wx - 90} y={230} width={180} height={230} rx={80} fill="none" stroke="#CDBE9C" strokeWidth={16} />
        </g>
      ))}
      <rect x={-600} y={820} width={3200} height={600} fill="#BFA98A" />
      {/* armchairs */}
      {[700, 1240].map((x, i) => (
        <g key={x}>
          <rect x={x - 120} y={560} width={240} height={290} rx={40} fill="#C9935C" stroke={C.ink} strokeWidth={6} />
          <rect x={x - 150} y={720} width={300} height={110} rx={30} fill="#B88250" stroke={C.ink} strokeWidth={6} />
          {i === 0 && beat === 'cabin' && <g />}
        </g>
      ))}
      <Figure char="richest" x={720} y={880} scale={0.95} pose={beat === 'phoneCall' ? 'sitPhone' : beat === 'cabin' ? 'sitJoy' : 'sitTalk'} expression={beat === 'phoneRings' ? (t > lineAt(1) - 0.2 ? 'curious' : 'neutral') : beat === 'phoneCall' ? (t > lineAt(1) ? 'curious' : 'neutral') : beat === 'phoneHang' ? 'nervous' : 'ecstatic'} look={beat === 'phoneCall' ? [-1, -0.2] : [1, 0]} holding={beat === 'phoneCall' ? <Phone glow /> : undefined} />
      <Figure char="ada" x={1230} y={880} scale={0.92} pose={beat === 'phoneHang' ? 'sitReach' : 'sitTalk'} expression={beat === 'phoneRings' && t > lineAt(1) ? 'warm' : 'neutral'} look={beat === 'phoneRings' && t < lineAt(0) ? [-0.6, 0.6] : [-1, 0]} flip holding={beat === 'phoneHang' ? <Phone glow /> : undefined} />
      {/* table + phone */}
      <rect x={880} y={740} width={200} height={20} rx={6} fill="#8B5A3C" stroke={C.ink} strokeWidth={4} />
      <rect x={968} y={760} width={24} height={110} fill="#6B4430" stroke={C.ink} strokeWidth={3} />
      {beat === 'phoneRings' && (
        <g transform={`translate(${980 + (ringing ? Math.sin(frame * 2.2) * 3 : 0)},728) rotate(-80)`}>
          <circle r={50} fill={BD.gold} opacity={ringing ? 0.25 + 0.15 * Math.sin(frame * 0.6) : 0.12} />
          <rect x={-14} y={-26} width={28} height={52} rx={5} fill="#15192A" stroke={C.ink} strokeWidth={2.5} />
          <rect x={-10} y={-21} width={20} height={40} rx={2} fill={BD.gold} />
        </g>
      )}
      {beat === 'cabin' && (
        <g>
          {[0, 1].map((k) => (
            <ellipse key={k} cx={890 + k * 46} cy={930 + Math.sin(frame * 0.5 + k) * 4} rx={20} ry={11} fill="#3B2A20" stroke={C.ink} strokeWidth={3} transform={`rotate(${20 + k * 30},${890 + k * 46},930)`} />
          ))}
        </g>
      )}
      {void dur}
    </g>
  );
};

const Island: React.FC<{frame: number; t: number; lineAt: (i: number) => number}> = ({frame, t, lineAt}) => {
  const both = t > lineAt(2);
  return (
    <g>
      <rect x={-600} y={-300} width={3200} height={1600} fill="#E9DDC7" />
      <defs>
        <clipPath id="isle">
          <rect x={760} y={230} width={400} height={480} rx={180} />
        </clipPath>
      </defs>
      <g clipPath="url(#isle)">
        <rect x={700} y={200} width={520} height={560} fill="#2BB5C2" />
        {Array.from({length: 12}, (_, i) => (
          <path key={i} d={`M${700 + ((i * 97 + frame * 2) % 520)},${240 + i * 40} q20,-6 40,0`} stroke="#8FE3EA" strokeWidth={3} fill="none" opacity={0.6} />
        ))}
        {[
          {x: 870, y: 430, s: 1, glow: !both ? 1 : 1},
          {x: 1060, y: 560, s: 0.85, glow: both ? 1 : 0},
        ].map((is, i) => (
          <g key={i} transform={`translate(${is.x},${is.y + Math.sin(frame * 0.02) * 2}) scale(${is.s})`}>
            <ellipse rx={92} ry={56} fill="#F2DFA6" />
            <path d="M-74,6 Q-70,-50 -10,-46 Q40,-60 70,-14 Q66,30 10,36 Q-50,40 -74,6 Z" fill="#3C9A54" />
            <circle cx={-20} cy={-16} r={18} fill="#2E7D44" />
            <circle cx={24} cy={0} r={14} fill="#2E7D44" />
            {is.glow > 0 && i === (t > lineAt(1) ? (both ? 1 : 0) : -1) && <ellipse rx={110} ry={72} fill="none" stroke="#FFF6D0" strokeWidth={4} opacity={0.7 + 0.3 * Math.sin(frame * 0.3)} />}
          </g>
        ))}
        {Array.from({length: 4}, (_, i) => (
          <ellipse key={i} cx={((i * 260 - frame * 4) % 700 + 700) % 700 + 600} cy={300 + i * 110} rx={70} ry={20} fill="#FFFFFF" opacity={0.75} />
        ))}
      </g>
      <rect x={760} y={230} width={400} height={480} rx={180} fill="none" stroke="#CDBE9C" strokeWidth={22} />
      <Figure char="richest" x={600} y={930} scale={0.95} pose="stand" expression={t > lineAt(2) ? 'ecstatic' : 'curious'} look={[1, -0.3]} />
      <Figure char="ada" x={1340} y={930} scale={0.9} pose={t > lineAt(0) - 0.2 ? 'point' : 'hold'} expression="happy" look={[-1, -0.2]} flip />
    </g>
  );
};

const EiffelLike: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`} fill="none" stroke="#6E6258" strokeWidth={5}>
    <path d="M-150,0 Q-60,-150 -16,-520 L16,-520 Q60,-150 150,0 L95,0 Q0,-110 -95,0 Z" fill="#8C7E70" fillOpacity={0.55} />
    <path d="M-95,0 Q0,-110 95,0" strokeWidth={8} />
    <rect x={-92} y={-162} width={184} height={16} fill="#6E6258" />
    <rect x={-42} y={-338} width={84} height={12} fill="#6E6258" />
    <line x1={-78} y1={-150} x2={78} y2={-150} strokeWidth={8} />
    <line x1={-36} y1={-330} x2={36} y2={-330} strokeWidth={6} />
    {Array.from({length: 8}, (_, i) => (
      <path key={i} d={`M${-100 + i * 6},${-20 - i * 62} L${100 - i * 6},${-62 - i * 62} M${100 - i * 6},${-20 - i * 62} L${-100 + i * 6},${-62 - i * 62}`} strokeWidth={2} opacity={0.7} />
    ))}
    <line x1={0} y1={-520} x2={0} y2={-580} strokeWidth={4} />
  </g>
);

const Paris: React.FC<{frame: number; t: number; beat: string; lineAt: (i: number) => number}> = ({frame, t, beat, lineAt}) => {
  const R = rand(31);
  return (
    <g>
      <Sky time="morning" frame={frame} id="paris" />
      <PaintedClouds time="morning" frame={frame} id="parisc" y={140} seed={4} />
      <g opacity={0.85}>
        <EiffelLike x={1240} y={600} s={0.7} />
      </g>
      {Array.from({length: 16}, (_, i) => {
        const x = -400 + i * 190;
        const h = 120 + R() * 90;
        return (
          <g key={i}>
            <rect x={x} y={700 - h} width={180} height={h + 200} fill={['#E9DCC2', '#DED0B4', '#EFE3CB'][i % 3]} stroke="#BFAE90" strokeWidth={3} />
            <path d={`M${x - 6},${700 - h} L${x + 20},${700 - h - 50} L${x + 160},${700 - h - 50} L${x + 186},${700 - h} Z`} fill="#6F8197" stroke="#4E5E72" strokeWidth={3} />
            {[0, 1, 2].map((k) => (
              <rect key={k} x={x + 22 + k * 52} y={700 - h + 24} width={30} height={42} fill="#6F8197" opacity={0.8} />
            ))}
            <rect x={x + 120} y={700 - h - 80} width={18} height={34} fill="#B07050" />
          </g>
        );
      })}
      <rect x={-600} y={760} width={3200} height={600} fill="#C9B79A" />
      {/* railing */}
      {Array.from({length: 40}, (_, i) => (
        <line key={i} x1={-500 + i * 80} y1={680} x2={-500 + i * 80} y2={770} stroke="#2A2A30" strokeWidth={5} />
      ))}
      <rect x={-600} y={676} width={3200} height={10} fill="#2A2A30" />
      <Figure char="richest" x={760} y={920} scale={1.0} pose={beat === 'paris' ? 'sitEat' : 'sitTalk'} expression={beat === 'paris' ? (t > lineAt(2) - 0.2 && t < lineAt(3) ? 'surprised' : t > lineAt(3) ? 'ecstatic' : t > lineAt(0) ? 'warm' : 'sleep') : t > lineAt(1) ? 'sad' : 'confused'} look={[1, -0.1]} holding={<Bread />} />
      <ellipse cx={960} cy={790} rx={210} ry={30} fill="#FFFFFF" stroke={C.ink} strokeWidth={5} />
      <path d="M760,790 L780,900 L1140,900 L1160,790" fill="#F7F7F7" stroke={C.ink} strokeWidth={5} />
      <ellipse cx={940} cy={780} rx={60} ry={14} fill="#FFFFFF" stroke={C.ink} strokeWidth={3} />
      {beat === 'paris' && <rect x={1000} y={758} width={70} height={20} rx={10} fill="#E2A65A" stroke={C.ink} strokeWidth={2.5} />}
      <Shadow x={1300} y={940} w={60} />
      <Figure char="ada" x={1300} y={940} scale={0.98} pose={beat === 'parisLeave' ? 'point' : 'hold'} expression={beat === 'paris' && t > lineAt(3) ? 'happy' : 'neutral'} look={[-1, 0]} flip holding={beat === 'paris' ? <Tablet /> : undefined} />
    </g>
  );
};

const Takeoff: React.FC<{frame: number; t: number; dur: number}> = ({frame, t, dur}) => {
  const p = t / dur;
  const x = interpolate(p, [0, 1], [-200, 2100]);
  const lift = Math.max(0, x - 700);
  const y = 820 - lift * 0.32;
  const rot = -Math.min(12, lift * 0.03);
  return (
    <g>
      <Sky time="morning" frame={frame} id="tko" />
      <PaintedClouds time="morning" frame={frame} id="tkoc" y={180} seed={7} />
      <Skyline seed={14} base={760} color="#9DB6CF" style="tower" minH={60} maxH={200} x0={-200} x1={2200} litChance={0} />
      <rect x={-600} y={740} width={3200} height={700} fill="#7FAE6A" />
      <rect x={-600} y={790} width={3200} height={90} fill="#5A5E66" />
      {Array.from({length: 26}, (_, i) => (
        <rect key={i} x={-600 + i * 130 - ((frame * 0) % 130)} y={830} width={70} height={8} fill="#FFFFFF" opacity={0.85} />
      ))}
      {lift < 40 && Array.from({length: 6}, (_, i) => <ellipse key={i} cx={x - 300 - i * 50} cy={815} rx={40 - i * 4} ry={10} fill="#D8D2C2" opacity={0.4 - i * 0.05} />)}
      {Array.from({length: 5}, (_, i) => (
        <line key={i} x1={x - 420 - i * 40} y1={y - 120 + i * 18} x2={x - 700 - i * 60} y2={y - 120 + i * 18 + lift * 0.1} stroke="#FFFFFF" strokeWidth={3} opacity={0.5} />
      ))}
      <Jet x={x} y={y} s={0.9} rot={rot} gear={lift < 120} />
    </g>
  );
};

export const JetSet: React.FC = () => {
  const {frame, beat, cam, t, lineAt, dur} = useBeatCam(BEATS, 'cabin');
  return (
    <Stage bg="#8FC8F0">
      <Camera progress={1} from={cam} to={cam}>
        {beat === 'takeoff' && <Takeoff frame={frame} t={t} dur={dur} />}
        {(beat === 'cabin' || beat.startsWith('phone')) && <Cabin frame={frame} t={t} beat={beat} lineAt={lineAt} dur={dur} />}
        {beat === 'island' && <Island frame={frame} t={t} lineAt={lineAt} />}
        {beat.startsWith('paris') && <Paris frame={frame} t={t} beat={beat} lineAt={lineAt} />}
      </Camera>
      {void ease01}
    </Stage>
  );
};
