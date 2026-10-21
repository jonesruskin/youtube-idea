import React from 'react';
import {C} from '../theme';

/**
 * Vey design language: pearl hulls, gold filigree, a cool inner glow.
 * Every inheritance in the season shares it, so viewers learn to recognise "Vey-made".
 */
export const Ship: React.FC<{
  x: number;
  y: number;
  scale?: number;
  frame: number;
  /** 0 = invisible, 1 = solid (decloak shimmer in between). */
  reveal?: number;
  tilt?: number;
  glow?: number;
  flip?: boolean;
  pilot?: React.ReactNode;
  beam?: number;
}> = ({x, y, scale = 1, frame, reveal = 1, tilt = 0, glow = 1, flip = false, pilot, beam = 0}) => {
  const hover = Math.sin(frame / 18) * 6;
  const shimmer = reveal < 1 ? 0.5 + 0.5 * Math.sin(frame * 0.9) : 1;
  const id = `ship${Math.round(x)}${Math.round(y)}`;
  return (
    <g transform={`translate(${x},${y + hover}) rotate(${tilt}) scale(${flip ? -scale : scale},${scale})`} opacity={reveal * shimmer + (reveal > 0 && reveal < 1 ? 0.15 : 0)}>
      <defs>
        <linearGradient id={`${id}hull`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.55" stopColor={C.pearl} />
          <stop offset="1" stopColor={C.pearlShade} />
        </linearGradient>
        <radialGradient id={`${id}glow`}>
          <stop offset="0" stopColor="#9FE8FF" stopOpacity={0.85 * glow} />
          <stop offset="1" stopColor="#9FE8FF" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}beam`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#BFF2FF" stopOpacity={0.75} />
          <stop offset="1" stopColor="#BFF2FF" stopOpacity={0} />
        </linearGradient>
      </defs>
      {beam > 0 && <path d={`M-70,30 L70,30 L${150 + 120 * beam},${60 + 520 * beam} L${-150 - 120 * beam},${60 + 520 * beam} Z`} fill={`url(#${id}beam)`} opacity={beam} />}
      <ellipse cx={0} cy={48} rx={210} ry={40} fill={`url(#${id}glow)`} />
      {/* hull: a manta/teardrop silhouette */}
      <path
        d="M-230,18 C-200,-18 -120,-42 -10,-44 C110,-46 200,-26 238,6 C246,14 240,24 226,28 C150,48 60,56 -40,54 C-140,52 -210,42 -232,32 C-240,28 -238,22 -230,18 Z"
        fill={`url(#${id}hull)`}
        stroke={C.ink}
        strokeWidth={5}
      />
      {/* canopy */}
      <path d="M-40,-38 C-20,-92 70,-96 110,-40 Z" fill="#7FD6FF" fillOpacity={0.45} stroke={C.ink} strokeWidth={4.5} />
      <path d="M-40,-38 C-20,-92 70,-96 110,-40" fill="none" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={3} transform="translate(6,6) scale(0.92)" />
      {pilot && <g>{pilot}</g>}
      {/* gold filigree */}
      <path d="M-200,22 C-120,4 -40,0 60,6 C140,10 190,16 222,20" fill="none" stroke={C.gold} strokeWidth={3.5} />
      <path d="M-150,36 q20,-14 40,0 t40,0 t40,0" fill="none" stroke={C.goldDeep} strokeWidth={2.5} />
      <circle cx={170} cy={12} r={7} fill={C.gold} stroke={C.ink} strokeWidth={2.5} />
      {/* underside light strip */}
      <path d="M-160,46 C-60,58 60,58 170,40" fill="none" stroke="#BFF2FF" strokeWidth={4} opacity={0.6 + 0.4 * Math.sin(frame / 7)} />
    </g>
  );
};

/** The Executor: a floating pearl prism with orbiting gold rings. Speaks with its glow. */
export const Executor: React.FC<{x: number; y: number; scale?: number; frame: number; speaking?: boolean; opacity?: number}> = ({x, y, scale = 1, frame, speaking = false, opacity = 1}) => {
  const bob = Math.sin(frame / 20) * 8;
  const spin = frame * 1.4;
  const pulse = speaking ? 0.7 + 0.3 * Math.abs(Math.sin(frame * 0.5)) : 0.55;
  const w = 46;
  const squash = Math.cos((spin * Math.PI) / 180);
  return (
    <g transform={`translate(${x},${y + bob}) scale(${scale})`} opacity={opacity}>
      <defs>
        <radialGradient id="exec-glow">
          <stop offset="0" stopColor="#FFF4D6" stopOpacity={0.9} />
          <stop offset="1" stopColor="#FFF4D6" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="exec-face" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor={C.pearlShade} />
        </linearGradient>
      </defs>
      <circle r={150} fill="url(#exec-glow)" opacity={pulse} />
      <ellipse rx={110} ry={26} fill="none" stroke={C.gold} strokeWidth={3} transform={`rotate(${-18 + Math.sin(frame / 30) * 6})`} strokeDasharray="40 10 4 10" strokeDashoffset={-frame * 2} />
      {/* bipyramid prism */}
      <path d={`M0,-92 L${w * squash},0 L0,92 L${-w},0 Z`} fill="url(#exec-face)" stroke={C.ink} strokeWidth={4.5} strokeLinejoin="round" />
      <path d={`M0,-92 L${w},0 L0,92 Z`} fill="#FFFFFF" opacity={0.25 + 0.25 * squash} />
      <path d={`M${-w},0 L${w},0`} stroke={C.gold} strokeWidth={3} />
      <circle r={9 + (speaking ? 3 * Math.sin(frame * 0.8) : 0)} fill={C.gold} stroke={C.ink} strokeWidth={3} />
      <ellipse rx={88} ry={18} fill="none" stroke={C.goldDeep} strokeWidth={2.5} transform={`rotate(${24 + Math.cos(frame / 26) * 8})`} strokeDasharray="2 12" strokeDashoffset={frame * 3} />
    </g>
  );
};
