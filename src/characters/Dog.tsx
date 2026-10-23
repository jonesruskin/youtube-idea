import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C} from '../theme';

/**
 * Biscuit — the Files' golden dog. Same flat night-ink style as the human rig.
 * Origin is the point between the paws on the ground; at scale 1 he stands ~130px at the shoulder.
 */
export type DogPose = 'stand' | 'sit' | 'run' | 'lie' | 'beg';

const FUR = '#D9A24E';
const SHADE = '#B07A35';
const LIGHT = '#F1C77E';

export const Dog: React.FC<{
  x: number;
  y: number;
  s?: number;
  pose?: DogPose;
  flip?: boolean;
  /** Tail wag speed 0..1. */
  wag?: number;
  /** Look up toward the camera / a snack. */
  lookUp?: number;
  breath?: boolean;
  seed?: number;
  rim?: string;
  /** Something in his mouth. */
  carry?: 'toast';
}> = ({x, y, s = 1, pose = 'stand', flip = false, wag = 0.5, lookUp = 0, breath = false, seed = 0, rim, carry}) => {
  const f = useCurrentFrame() + seed * 13;
  const ink = C.ink;
  const sw = 4.5;
  const run = pose === 'run';
  const gait = run ? Math.sin(f * 0.55) : 0;
  const bob = run ? Math.abs(Math.cos(f * 0.55)) * -10 : Math.sin(f / 20) * 1.2;
  const tailA = -30 + Math.sin(f * (0.25 + wag * 0.55)) * (8 + wag * 26);
  const sit = pose === 'sit' || pose === 'beg';
  const lie = pose === 'lie';
  const bodyY = lie ? -34 : sit ? -70 : -92;
  const blink = (f + seed * 29 + 40) % 97 < 4;

  const leg = (lx: number, swing: number, len: number, key: string) => (
    <g key={key} transform={`rotate(${swing},${lx},${bodyY + 10})`}>
      <path d={`M${lx},${bodyY + 6} L${lx},${bodyY + 6 + len}`} stroke={ink} strokeWidth={22 + sw * 2} strokeLinecap="round" />
      <path d={`M${lx},${bodyY + 6} L${lx},${bodyY + 6 + len}`} stroke={FUR} strokeWidth={22} strokeLinecap="round" />
      <ellipse cx={lx + 6} cy={bodyY + 8 + len} rx={14} ry={8} fill={LIGHT} stroke={ink} strokeWidth={3.5} />
    </g>
  );

  return (
    <g transform={`translate(${x},${y + bob * s}) scale(${flip ? -s : s},${s})`}>
      {rim && (
        <defs>
          <filter id={`dogrim${seed}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx={-3} dy={-2} stdDeviation={1.2} floodColor={rim} floodOpacity={0.9} />
          </filter>
        </defs>
      )}
      <g filter={rim ? `url(#dogrim${seed})` : undefined}>
        {/* tail */}
        <g transform={`rotate(${sit ? tailA + 40 : tailA},-70,${bodyY - 8})`}>
          <path d={`M-70,${bodyY - 8} q-46,-14 -70,-52`} stroke={ink} strokeWidth={20 + sw * 2} fill="none" strokeLinecap="round" />
          <path d={`M-70,${bodyY - 8} q-46,-14 -70,-52`} stroke={FUR} strokeWidth={20} fill="none" strokeLinecap="round" />
          <path d={`M-118,${bodyY - 36} q-12,-10 -20,-22`} stroke={LIGHT} strokeWidth={8} fill="none" strokeLinecap="round" />
        </g>
        {/* back legs */}
        {!lie && !sit && leg(-48, run ? gait * 30 : 0, 80, 'bl1')}
        {!lie && !sit && leg(-30, run ? -gait * 30 : 0, 80, 'bl2')}
        {sit && <ellipse cx={-40} cy={-30} rx={44} ry={32} fill={FUR} stroke={ink} strokeWidth={sw} />}
        {sit && <ellipse cx={-20} cy={-4} rx={26} ry={10} fill={LIGHT} stroke={ink} strokeWidth={3.5} />}
        {/* body */}
        <g transform={sit ? `rotate(-28,-30,${bodyY})` : undefined}>
          <ellipse cx={0} cy={bodyY} rx={lie ? 92 : 84} ry={lie ? 30 : 40} fill={FUR} stroke={ink} strokeWidth={sw} />
          <ellipse cx={-6} cy={bodyY + 14} rx={56} ry={16} fill={SHADE} opacity={0.35} />
        </g>
        {/* front legs */}
        {!lie && leg(44, run ? -gait * 34 : 0, sit ? 66 : 80, 'fl1')}
        {!lie && leg(62, run ? gait * 34 : pose === 'beg' ? -60 : 0, sit ? 66 : 80, 'fl2')}
        {lie && <ellipse cx={92} cy={-10} rx={42} ry={11} fill={LIGHT} stroke={ink} strokeWidth={3.5} />}
        {/* chest + collar */}
        <ellipse cx={58} cy={bodyY - 8} rx={30} ry={34} fill={LIGHT} stroke={ink} strokeWidth={sw} />
        <path d={`M44,${bodyY - 36} Q64,${bodyY - 24} 84,${bodyY - 40}`} stroke="#C8382F" strokeWidth={9} fill="none" strokeLinecap="round" />
        <circle cx={66} cy={bodyY - 24} r={6} fill={C.gold} stroke={ink} strokeWidth={2.5} />
        {/* head */}
        <g transform={`translate(${lie ? 112 : 78},${bodyY - (lie ? 30 : 64)}) rotate(${-lookUp * 22})`}>
          <ellipse cx={0} cy={0} rx={40} ry={36} fill={FUR} stroke={ink} strokeWidth={sw} />
          <ellipse cx={34} cy={14} rx={26} ry={18} fill={LIGHT} stroke={ink} strokeWidth={sw} />
          <ellipse cx={56} cy={6} rx={9} ry={7} fill={ink} />
          <path d={`M40,${26} q8,6 16,0`} stroke={ink} strokeWidth={3} fill="none" strokeLinecap="round" />
          {(run || pose === 'beg' || wag > 0.7) && <path d="M42,30 q6,18 14,4 z" fill="#E66B7A" stroke={ink} strokeWidth={2.5} />}
          {blink ? (
            <path d="M8,-8 q7,5 14,0" stroke={ink} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          ) : (
            <g>
              <ellipse cx={15} cy={-8} rx={7} ry={8.5} fill={ink} />
              <circle cx={17.5} cy={-11} r={2.6} fill={C.white} />
            </g>
          )}
          <path d="M6,-20 q10,-6 20,0" stroke={SHADE} strokeWidth={4} fill="none" strokeLinecap="round" />
          {/* floppy ear */}
          <g transform={`rotate(${run ? 18 + gait * 14 : 8 + Math.sin(f / 18) * 3},-14,-22)`}>
            <path d="M-14,-22 q-30,4 -28,46 q14,10 24,-6 z" fill={SHADE} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
          </g>
          {carry === 'toast' && (
            <g transform="translate(46,30) rotate(-12)">
              <path d="M-4,-14 L-4,16 L40,16 L40,-14 Q18,-30 -4,-14 Z" fill="#E3A15A" stroke={ink} strokeWidth={3.5} />
              <path d="M2,-8 L2,10 L34,10 L34,-8 Q18,-20 2,-8 Z" fill="#F6D29A" />
            </g>
          )}
          {breath && (
            <g opacity={0.6}>
              {[0, 1].map((k) => {
                const ph = ((f + k * 30) % 60) / 60;
                return <circle key={k} cx={64 + ph * 50} cy={18 - ph * 18} r={6 + ph * 16} fill="#EAF4FF" opacity={1 - ph} />;
              })}
            </g>
          )}
        </g>
      </g>
    </g>
  );
};
