import React, {useId} from 'react';
import {fonts} from '../../theme';
import {characters} from '../../characters/registry';
import {Frost} from './atmos';

export type WatchLight = 'sun' | 'candle' | 'cold' | 'amber' | 'starlight';

const LIGHTS: Record<WatchLight, {bg: [string, string]; key: string; bokeh: string[]; lcd: string; glow: string}> = {
  sun: {bg: ['#F7C77E', '#B86A3A'], key: '#FFF2D0', bokeh: ['#FFE6A8', '#FFF6DA', '#FFC98A'], lcd: '#2A3A2C', glow: '#FFF7DA'},
  candle: {bg: ['#2A1A14', '#0D0A10'], key: '#FFB867', bokeh: ['#FF9E4A', '#FFCC80'], lcd: '#9FE8FF', glow: '#9FE8FF'},
  cold: {bg: ['#1A2B4A', '#070C1C'], key: '#BFE4FF', bokeh: ['#6FA8DC', '#9FD8FF', '#3E5C8A'], lcd: '#9FE8FF', glow: '#9FE8FF'},
  amber: {bg: ['#3A2414', '#120B0A'], key: '#FFC27A', bokeh: ['#FFB25A', '#FFD49A', '#FF8E4A'], lcd: '#9FE8FF', glow: '#9FE8FF'},
  starlight: {bg: ['#0B1230', '#02030A'], key: '#C9D6FF', bokeh: ['#E8EEFF', '#9FB7FF'], lcd: '#9FE8FF', glow: '#9FE8FF'},
};

/** "08:20", "71:59:59" */
export const fmtCountdown = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${p(h)}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
};

/**
 * The hero prop, full-frame: a battered silver watch on the orange parka sleeve.
 * It is the only text the series puts on screen: the countdown, the Day, the temperature.
 */
export const WatchCloseUp: React.FC<{
  main: string;
  sub?: string;
  light: WatchLight;
  frame: number;
  /** 0..1 frost on the glass. */
  frost?: number;
  /** Beep flash 0..1. */
  flash?: number;
  /** Small "segment" flicker when the digits change. */
  tick?: number;
  /** The countdown that should not exist: red digits, lit even in daylight. */
  alarm?: boolean;
  /** Just the watch (no world behind it, no sleeve) — for the end screen. */
  bare?: boolean;
}> = ({main, sub, light, frame, frost = 0, flash = 0, tick = 0, alarm = false, bare = false}) => {
  const id = useId().replace(/:/g, '');
  const L0 = LIGHTS[light];
  const L = alarm ? {...L0, lcd: '#FF5A4A', glow: '#FF5A4A'} : L0;
  const you = characters.you;
  const lcdOn = light !== 'sun' || alarm;
  return (
    <g>
      <defs>
        <radialGradient id={`wbg${id}`} cx="0.35" cy="0.3" r="1">
          <stop offset="0" stopColor={L.bg[0]} />
          <stop offset="1" stopColor={L.bg[1]} />
        </radialGradient>
        <filter id={`wbk${id}`}>
          <feGaussianBlur stdDeviation={22} />
        </filter>
        <linearGradient id={`steel${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F2F4F7" />
          <stop offset="0.45" stopColor="#A9B0BA" />
          <stop offset="0.55" stopColor="#7C8490" />
          <stop offset="1" stopColor="#D5DAE1" />
        </linearGradient>
        <linearGradient id={`lcd${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lcdOn ? '#0B2633' : '#B8C4A8'} />
          <stop offset="1" stopColor={lcdOn ? '#071620' : '#98A68C'} />
        </linearGradient>
        <filter id={`glow${id}`} x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation={6} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`glass${id}`}>
          <rect x={590} y={330} width={740} height={420} rx={40} />
        </clipPath>
      </defs>
      {/* out-of-focus world behind the wrist */}
      {!bare && <rect x={-200} y={-200} width={2320} height={1480} fill={`url(#wbg${id})`} />}
      <g filter={`url(#wbk${id})`} opacity={bare ? 0 : 1}>
        {L.bokeh.map((c, i) =>
          Array.from({length: 5}, (_, k) => (
            <circle key={`${i}-${k}`} cx={((i * 613 + k * 389 + frame * (0.3 + k * 0.1)) % 2200) - 140} cy={140 + ((i * 271 + k * 197) % 820)} r={50 + ((i + k) % 3) * 30} fill={c} opacity={0.35} />
          )),
        )}
      </g>
      {/* forearm in the parka sleeve */}
      {!bare && <path d="M-220,1180 L-220,760 Q300,560 980,600 Q1500,630 2140,560 L2140,1180 Z" fill={you.topColor} stroke="#0B1026" strokeWidth={8} />}
      {!bare && [0.25, 0.5, 0.75].map((t, i) => (
        <path key={i} d={`M${-200 + t * 2300},${700 - t * 60} q-40,200 0,480`} stroke={you.topAccent} strokeWidth={8} fill="none" opacity={0.7} />
      ))}
      {/* wrist skin between cuff and band */}
      <path d="M380,520 Q960,470 1540,520 L1540,560 Q960,520 380,560 Z" fill={you.skin} opacity={0} />
      {/* strap */}
      <rect x={760} y={120} width={400} height={860} rx={60} fill="#2C3240" stroke="#0B1026" strokeWidth={8} />
      {[220, 300, 820, 900].map((y) => (
        <rect key={y} x={790} y={y} width={340} height={10} rx={5} fill="#000" opacity={0.3} />
      ))}
      {/* case */}
      <rect x={540} y={280} width={840} height={520} rx={86} fill={`url(#steel${id})`} stroke="#0B1026" strokeWidth={10} />
      {/* scratches: it's battered */}
      {[
        [600, 320, 680, 300],
        [1260, 760, 1330, 720],
        [1300, 330, 1350, 360],
      ].map(([a, b, c, d], i) => (
        <path key={i} d={`M${a},${b} L${c},${d}`} stroke="#FFFFFF" strokeWidth={3} opacity={0.6} />
      ))}
      {/* buttons */}
      {[380, 640].map((y) => (
        <rect key={y} x={1376} y={y} width={36} height={70} rx={12} fill={`url(#steel${id})`} stroke="#0B1026" strokeWidth={6} />
      ))}
      {/* LCD */}
      <rect x={590} y={330} width={740} height={420} rx={40} fill={`url(#lcd${id})`} stroke="#0B1026" strokeWidth={6} />
      <g clipPath={`url(#glass${id})`}>
        <text
          x={960}
          y={sub ? 575 : 615}
          textAnchor="middle"
          fontFamily={fonts.mono}
          fontWeight={600}
          fontSize={main.length > 6 ? 150 : 196}
          letterSpacing={main.length > 6 ? 2 : 6}
          fill={L.lcd}
          opacity={1 - tick * 0.35}
          filter={lcdOn ? `url(#glow${id})` : undefined}
        >
          {main}
        </text>
        {sub && (
          <text x={960} y={690} textAnchor="middle" fontFamily={fonts.mono} fontWeight={400} fontSize={64} letterSpacing={6} fill={L.lcd} opacity={0.85} filter={lcdOn ? `url(#glow${id})` : undefined}>
            {sub}
          </text>
        )}
        {/* glass reflection */}
        <path d="M590,330 L900,330 L700,750 L590,750 Z" fill="#FFFFFF" opacity={0.07} />
        <Frost amount={frost} w={1920} h={1080} seed={14} />
      </g>
      {flash > 0 && <rect x={590} y={330} width={740} height={420} rx={40} fill={L.glow} opacity={flash * 0.5} style={{mixBlendMode: 'screen'}} />}
      {/* key light rim along the case */}
      <path d="M560,420 Q560,300 680,290" stroke={L.key} strokeWidth={8} fill="none" opacity={0.8} />
    </g>
  );
};
