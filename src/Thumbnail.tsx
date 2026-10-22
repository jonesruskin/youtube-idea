import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Figure} from './characters/Figure';
import {extra} from './characters/registry';
import {Danfo, FarCity, Facades, PaintedClouds, Sky} from './env/kit';
import {Goat} from './env/common';
import {C, fonts} from './theme';

/**
 * Thumbnail: one impossible image + 2 words. Jonah, grinning, holds a full danfo bus up with ONE finger.
 * Distinct from the genre's black-stickman look: full colour, real Lagos, a glowing fingertip.
 */
export const Thumbnail: React.FC<{text: string; heir: string}> = ({text}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <svg viewBox="0 0 1280 720" width="100%" height="100%">
      <g transform="scale(0.6667)">
        <Sky time="afternoon" frame={0} id="th" />
        <PaintedClouds time="afternoon" frame={0} id="thc" y={60} seed={5} />
        <FarCity time="afternoon" base={620} frame={0} />
        <Facades time="afternoon" base={1000} seed={21} x0={-300} x1={2400} frame={0} signs={false} />
        <rect x={0} y={1000} width={1920} height={80} fill="#5D5A60" />
        <g transform="translate(1180,420) rotate(-8) scale(1.25)">
          <Danfo x={0} y={0} frame={0} scared />
        </g>
        <path d="M1254,610 L1240,420" stroke="#FF9A3C" strokeWidth={46} opacity={0.25} strokeLinecap="round" />
        <path d="M1254,610 L1240,420" stroke="#FFE2B0" strokeWidth={10} opacity={0.85} strokeLinecap="round" strokeDasharray="18 12" />
        <Figure char="jonah" x={1170} y={1080} scale={1.55} pose={{lArm: [-20, 40], rArm: [168, 0], lLeg: [-6, 2], rLeg: [6, -2]}} expression="ecstatic" look={[0.2, -1]} palmGlow={1} />
        <g transform="translate(560,230) rotate(-20)">
          <Goat x={0} y={0} s={0.8} frame={0} unimpressed />
        </g>
        {[0, 1].map((i) => (
          <Figure key={i} char={extra(510 + i)} x={1640 + i * 160} y={1060} scale={1.1} pose="handsOnHead" expression="surprised" look={[-0.6, -1]} seed={i} rim={false} />
        ))}
      </g>
      <rect x={0} y={0} width={1280} height={720} fill="url(#thVig)" />
      <defs>
        <radialGradient id="thVig" cx="0.6" cy="0.5" r="0.8">
          <stop offset="0.55" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.5} />
        </radialGradient>
      </defs>
      {text.split(' ').map((w, i) => (
        <text key={w} x={40} y={210 + i * 140} fill={i === 0 ? '#FFFFFF' : '#FFB347'} stroke={C.ink} strokeWidth={14} paintOrder="stroke" fontFamily={fonts.display} fontWeight={900} fontSize={128} letterSpacing={-3}>
          {w}
        </text>
      ))}
    </svg>
  </AbsoluteFill>
);
