import {Body} from '../../fx/bodies';
import React from 'react';
import {INK} from '../sun/stage';
import {rnd} from '../sea/parts';

/**
 * File 002 (moon02) shared parts: the Moon, the sea and Saltmouth's houses. One town, drawn the same from every
 * street, so the geography never jumps: the quay at 1.6 m above mean sea level, Market Street at 7.5 m, the
 * churchyard wall at 27 m, the chapel steps from 33 to 40 m with Nana's white line at 35 m.
 * Scale: 206 px per metre on the cast's plane (a 2 m door is 412 px).
 */
export const PX = 206;
export const F = "'Space Grotesk', sans-serif";
export const HAND = "'Caveat', 'Comic Neue', cursive";

export type Tod = 'day' | 'dusk' | 'night';
export const todOf = (v: string): Tod => (v.includes('night') ? 'night' : v.includes('dusk') ? 'dusk' : 'day');

/** Sky for a time of day; covers the camera's whole travel. */
export const SkyBox: React.FC<{tod: Tod; frame: number; moonlit?: number}> = ({tod, frame, moonlit = 0}) => {
  const [top, bot] = tod === 'night' ? ['#050A1E', '#1B2A5C'] : tod === 'dusk' ? ['#2B2F6B', '#F2A77A'] : ['#6FB7E8', '#D9EEF8'];
  const r = rnd(5);
  return (
    <g>
      <defs>
        <linearGradient id={`msky${tod}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bot} />
        </linearGradient>
      </defs>
      <rect x={-1400} y={-900} width={4800} height={2400} fill={`url(#msky${tod})`} />
      {tod !== 'day' &&
        Array.from({length: 160}, (_, i) => {
          const x = -1300 + r() * 4600;
          const y = -850 + r() * 1300;
          const tw = 0.5 + 0.5 * Math.sin(frame * 0.05 + i);
          return <circle key={i} cx={x} cy={y} r={1.2 + r() * 1.6} fill="#FFFFFF" opacity={(tod === 'night' ? 0.8 : 0.35) * (0.5 + 0.5 * tw) * (1 - 0.6 * Math.min(1, moonlit))} />;
        })}
      {tod === 'day' &&
        [[-300, -80, 1.2], [700, -220, 0.9], [1700, -40, 1.1], [2500, -180, 0.8]].map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x + Math.sin(frame * 0.004 + i) * 30},${y}) scale(${s})`} opacity={0.9}>
            <ellipse cx={0} cy={0} rx={150} ry={34} fill="#FFFFFF" />
            <ellipse cx={-60} cy={-22} rx={70} ry={30} fill="#FFFFFF" />
            <ellipse cx={50} cy={-28} rx={84} ry={36} fill="#FFFFFF" />
          </g>
        ))}
    </g>
  );
};

/** The Moon, drawn to the size the story's distance gives it: r is the radius in px for a normal Moon × `k`.
 *  The disc is the real near side (NASA LRO, src/fx/bodies.tsx): the same face the town has always seen, only bigger. */
export const MoonDisc: React.FC<{x: number; y: number; k: number; base?: number; tod: Tod}> = ({x, y, k, base = 70, tod}) => {
  const R = base * k;
  const day = tod === 'day';
  return (
    <g>
      <Body name="moon" x={x} y={y} r={R} glow={day ? 0.4 : 1} glowColor={day ? '#FFFFFF' : '#FFF6C8'} tint={day ? undefined : '#FFF1CC'} tintAmount={0.18} opacity={day ? 0.9 : 1} />
      {/* a day Moon sits behind blue sky: wash it a little so it reads as daylight, like the real one */}
      {day && <circle cx={x} cy={y} r={R} fill="#BFDDF2" opacity={0.28} />}
    </g>
  );
};

/** Open water from a horizon line down, with slow swell lines and (at night) the Moon's road on the sea. */
export const SeaBand: React.FC<{y: number; tod: Tod; frame: number; moonX?: number; x0?: number; x1?: number; h?: number}> = ({y, tod, frame, moonX, x0 = -1400, x1 = 3400, h = 1600}) => {
  const [a, b] = tod === 'night' ? ['#14285A', '#0A1638'] : tod === 'dusk' ? ['#5B5E9A', '#2A2F66'] : ['#3F8FBF', '#1F5F8F'];
  return (
    <g>
      <defs>
        <linearGradient id={`msea${tod}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect x={x0} y={y} width={x1 - x0} height={h} fill={`url(#msea${tod})`} />
      {Array.from({length: 9}, (_, i) => {
        const yy = y + 14 + i * i * 7;
        const ph = frame * 0.03 + i * 1.7;
        return <path key={i} d={`M${x0},${yy} ${Array.from({length: 24}, (_, k) => `q${(x1 - x0) / 96},${Math.sin(ph + k) * 3 - 3} ${(x1 - x0) / 48},0 t${(x1 - x0) / 48},0`).join(' ')}`} stroke="#FFFFFF" strokeOpacity={tod === 'day' ? 0.25 : 0.14} strokeWidth={2 + i * 0.5} fill="none" />;
      })}
      {moonX !== undefined && tod !== 'day' && (
        <g opacity={0.5}>
          {Array.from({length: 14}, (_, i) => (
            <rect key={i} x={moonX - 20 - i * 9 + Math.sin(frame * 0.08 + i) * 8} y={y + 8 + i * 16} width={40 + i * 18} height={5} rx={2.5} fill="#FFF6C8" opacity={0.9 - i * 0.05} />
          ))}
        </g>
      )}
    </g>
  );
};

/** A sheet of flood water in front of (or behind) the street: top edge at `y`, lapping. */
export const Flood: React.FC<{y: number; tod: Tod; frame: number; opacity?: number; x0?: number; x1?: number}> = ({y, tod, frame, opacity = 0.7, x0 = -1400, x1 = 3400}) => {
  const col = tod === 'night' ? '#2A4A9A' : tod === 'dusk' ? '#4A4F8E' : '#3A86B4';
  const w = (x1 - x0) / 40;
  return (
    <g opacity={opacity}>
      <path d={`M${x0},${y} ${Array.from({length: 40}, (_, k) => `q${w / 2},${-8 + Math.sin(frame * 0.07 + k * 1.3) * 5} ${w},0`).join(' ')} L${x1},2400 L${x0},2400 Z`} fill={col} />
      <path d={`M${x0},${y} ${Array.from({length: 40}, (_, k) => `q${w / 2},${-8 + Math.sin(frame * 0.07 + k * 1.3) * 5} ${w},0`).join(' ')}`} stroke="#DDF2FF" strokeOpacity={0.7} strokeWidth={5} fill="none" />
    </g>
  );
};

const WALLS = ['#E9E2D0', '#D8E6EC', '#F1D9C4', '#DCE8D0', '#EADFE8', '#F3E7B8'];
const DOORS = ['#2F6F9F', '#B2473E', '#3E7A52', '#6A4A8C', '#C98A2B', '#30475E'];

/** A harbour-town house front: rendered wall, slate roof, sash windows, a 2 m door. Base (doorstep) at y. */
export const House: React.FC<{x: number; y: number; w?: number; i?: number; lit?: boolean; number?: number; shop?: string; s?: number; floors?: number}> = ({x, y, w = 520, i = 0, lit, number, shop, s = 1, floors = 2}) => {
  const wall = WALLS[i % WALLS.length];
  const door = DOORS[i % DOORS.length];
  const H = floors * 560 + 40;
  const win = (wx: number, wy: number, ww = 130, wh = 190) => (
    <g>
      <rect x={wx - 10} y={wy - 10} width={ww + 20} height={wh + 20} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
      <rect x={wx} y={wy} width={ww} height={wh} fill={lit ? '#FFD98A' : '#5C7FA0'} />
      <line x1={wx + ww / 2} y1={wy} x2={wx + ww / 2} y2={wy + wh} stroke="#FFFFFF" strokeWidth={8} />
      <line x1={wx} y1={wy + wh / 2} x2={wx + ww} y2={wy + wh / 2} stroke="#FFFFFF" strokeWidth={8} />
      <rect x={wx - 18} y={wy + wh + 10} width={ww + 36} height={14} fill="#CFC8B8" stroke={INK} strokeWidth={3} />
    </g>
  );
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={0} y={-H} width={w} height={H} fill={wall} stroke={INK} strokeWidth={5} />
      {/* slate roof with a chimney */}
      <path d={`M-24,${-H} L${w / 2},${-H - 210} L${w + 24},${-H} Z`} fill="#4E5868" stroke={INK} strokeWidth={5} />
      <rect x={w * 0.68} y={-H - 190} width={56} height={120} fill="#9A5B45" stroke={INK} strokeWidth={4} />
      {/* plinth */}
      <rect x={0} y={-46} width={w} height={46} fill="#8E97A6" stroke={INK} strokeWidth={4} />
      {/* door: 2 m */}
      <rect x={w * 0.14 - 14} y={-432} width={198} height={432} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
      <rect x={w * 0.14} y={-418} width={170} height={418} fill={door} stroke={INK} strokeWidth={4} />
      <rect x={w * 0.14 + 20} y={-390} width={130} height={110} rx={6} fill="#000" opacity={0.14} />
      <rect x={w * 0.14 + 20} y={-250} width={130} height={200} rx={6} fill="#000" opacity={0.1} />
      <circle cx={w * 0.14 + 146} cy={-200} r={9} fill="#E8C55A" stroke={INK} strokeWidth={3} />
      {number !== undefined && (
        <text data-text="set" x={w * 0.14 + 85} y={-446} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={34} fill={INK}>
          {number}
        </text>
      )}
      {shop ? (
        <g>
          <rect x={w * 0.52} y={-400} width={w * 0.42} height={300} fill={lit ? '#FFE6A8' : '#7FA6C4'} stroke={INK} strokeWidth={5} />
          <rect x={w * 0.5} y={-470} width={w * 0.46} height={62} fill={door} stroke={INK} strokeWidth={4} />
          <text data-text="set" x={w * 0.73} y={-426} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={Math.min(34, (w * 0.42) / (shop.length * 0.62))} fill="#FFFFFF">
            {shop}
          </text>
        </g>
      ) : (
        win(w * 0.6, -390)
      )}
      {floors > 1 && win(w * 0.16, -H + 150)}
      {floors > 1 && win(w * 0.6, -H + 150)}
    </g>
  );
};

/** The hill behind the town, seen from below: terraces of small houses and the ruined chapel on top. */
export const HillTown: React.FC<{x: number; y: number; s?: number; tod: Tod; drowned?: number}> = ({x, y, s = 1, tod, drowned = 0}) => {
  const land = tod === 'night' ? '#1E3A3E' : tod === 'dusk' ? '#4E5A6A' : '#7DAA6E';
  const r = rnd(31);
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d="M-1500,0 Q-700,-120 -200,-420 Q150,-640 420,-700 Q760,-690 1100,-420 Q1500,-140 2300,0 Z" fill={land} stroke={INK} strokeWidth={4} />
      {/* terraces of houses on the slope */}
      {Array.from({length: 26}, (_, i) => {
        const hx = -900 + i * 86 + r() * 30;
        const t = (hx + 900) / 2300;
        const hy = -30 - Math.sin(Math.min(1, Math.max(0, (hx + 700) / 1900)) * Math.PI) * 430 + r() * 70;
        if (hy > -drowned) return null;
        return (
          <g key={i} transform={`translate(${hx},${hy})`}>
            <rect x={-26} y={-44} width={52} height={44} fill={WALLS[i % WALLS.length]} stroke={INK} strokeWidth={2.5} />
            <path d="M-32,-44 L0,-72 L32,-44 Z" fill="#4E5868" stroke={INK} strokeWidth={2.5} />
            <rect x={-8} y={-30} width={14} height={16} fill={tod === 'day' ? '#5C7FA0' : '#FFD98A'} />
            {t > 2 && null}
          </g>
        );
      })}
      {/* the ruined chapel on the top: a gable with an empty window and a bell-cote */}
      <g transform="translate(430,-700)">
        <path d="M-70,0 L-70,-90 L0,-150 L70,-90 L70,0 Z" fill={tod === 'night' ? '#55607A' : '#B9B4A6'} stroke={INK} strokeWidth={3} />
        <path d="M-16,0 L-16,-56 Q0,-80 16,-56 L16,0 Z" fill={tod === 'night' ? '#0B1230' : '#9EC6E0'} stroke={INK} strokeWidth={2.5} />
        <rect x={-10} y={-178} width={20} height={30} fill={tod === 'night' ? '#55607A' : '#B9B4A6'} stroke={INK} strokeWidth={2.5} />
      </g>
    </g>
  );
};

/** A street lamp (3.2 m). */
export const Lamp: React.FC<{x: number; y: number; on?: boolean}> = ({x, y, on}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-7} y={-660} width={14} height={660} fill="#2B3445" stroke={INK} strokeWidth={3} />
    <path d="M-34,-660 L34,-660 L22,-720 L-22,-720 Z" fill={on ? '#FFE08A' : '#C9D2DC'} stroke={INK} strokeWidth={4} />
    <rect x={-40} y={-668} width={80} height={12} fill="#2B3445" />
    {on && <circle cx={0} cy={-690} r={150} fill="#FFE08A" opacity={0.16} />}
  </g>
);

/** A small fishing boat. Waterline at y. */
export const Boat: React.FC<{x: number; y: number; s?: number; col?: string; bob?: number; aground?: boolean}> = ({x, y, s = 1, col = '#C2464F', bob = 0, aground}) => (
  <g transform={`translate(${x},${y + bob}) scale(${s}) rotate(${aground ? 14 : bob * 0.4})`}>
    <path d="M-170,-40 L170,-40 L130,40 L-130,40 Z" fill={col} stroke={INK} strokeWidth={5} />
    <rect x={-170} y={-52} width={340} height={16} fill="#F4EFE6" stroke={INK} strokeWidth={4} />
    <rect x={-40} y={-140} width={96} height={90} fill="#F4EFE6" stroke={INK} strokeWidth={5} />
    <rect x={-26} y={-126} width={30} height={34} fill="#5C7FA0" stroke={INK} strokeWidth={3} />
    <rect x={14} y={-126} width={30} height={34} fill="#5C7FA0" stroke={INK} strokeWidth={3} />
    <line x1={-110} y1={-52} x2={-110} y2={-220} stroke={INK} strokeWidth={6} />
  </g>
);
