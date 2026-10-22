import React from 'react';
import {Easing} from 'remotion';
import {characters, type CharacterDesign} from '../../characters/registry';
import {useShot} from '../../engine/shot-context';
import {lerpCam, type Cam} from '../../fx/camera';
import {rand} from '../../fx/sky';
import {C} from '../../theme';

/** Borrowed Day palette: the rich world is cream, gold and glass; "your" world is warm Lagos colour. */
export const BD = {
  gold: '#F6C453',
  goldDeep: '#C9952E',
  cream: '#EDE3CC',
  marble: '#F1EDE6',
  marbleVein: '#D9D2C6',
  glass: '#BFD9EA',
  night: '#070A1C',
};

export type BeatTable = Record<string, {cam: [Cam, Cam]}>;

/** The Richest out of his suit: pyjamas in bed, a robe in the bathroom. */
export const RICHEST_PJS: CharacterDesign = {...characters.richest, top: 'tee', topColor: '#2F3E66', topAccent: '#24304F', innerColor: '#2F3E66', pants: '#2F3E66', shoes: '#C9A27A'};
export const RICHEST_ROBE: CharacterDesign = {...characters.richest, top: 'cardigan', topColor: '#FFFFFF', topAccent: '#E2DCD2', innerColor: '#8A5536', pants: '#FFFFFF', shoes: '#FFFFFF'};

/** Reads props.beat and returns the eased camera for it (sets keep one BEATS table each). */
export const useBeatCam = (beats: BeatTable, fallback: string) => {
  const shot = useShot();
  const beat = (shot.props.beat as string) ?? fallback;
  const cfg = beats[beat] ?? beats[fallback];
  const cam = lerpCam(cfg.cam[0], cfg.cam[1], Easing.inOut(Easing.cubic)(shot.progress));
  return {...shot, beat, cam};
};

/** Smooth 0→1 from `from` over `len` seconds. */
export const ease01 = (t: number, from: number, len = 0.6) => Easing.inOut(Easing.cubic)(Math.max(0, Math.min(1, (t - from) / len)));

/** "Yesterday" treatment for the Return's flashbacks: warm gold wash, soft edges, gentle flicker. */
export const MemoryWash: React.FC<{frame: number}> = ({frame}) => (
  <g pointerEvents="none">
    <defs>
      <radialGradient id="memVig" cx="50%" cy="50%" r="70%">
        <stop offset="0.55" stopColor="#3A2410" stopOpacity={0} />
        <stop offset="1" stopColor="#3A2410" stopOpacity={0.55} />
      </radialGradient>
    </defs>
    <rect x={-400} y={-400} width={2800} height={2000} fill="#FFB347" opacity={0.16 + 0.01 * Math.sin(frame * 0.7)} style={{mixBlendMode: 'soft-light'}} />
    <rect x={-400} y={-400} width={2800} height={2000} fill="#F2C14E" opacity={0.08} style={{mixBlendMode: 'multiply'}} />
    <rect x={0} y={0} width={1920} height={1080} fill="url(#memVig)" />
  </g>
);

/** Procedural firework burst. `t` is seconds since launch; draws nothing before or after. */
export const Firework: React.FC<{x: number; y: number; t: number; color: string; seed: number; r?: number}> = ({x, y, t, color, seed, r = 220}) => {
  if (t < 0 || t > 3.2) return null;
  const rise = Math.min(1, t / 0.7);
  if (t < 0.7) {
    return <circle cx={x} cy={y + 500 * (1 - rise)} r={4} fill="#FFF3D6" opacity={0.9} />;
  }
  const k = t - 0.7;
  const spread = (1 - Math.exp(-k * 3.2)) * r;
  const fade = Math.max(0, 1 - k / 2.5);
  const R = rand(seed);
  const n = 34;
  return (
    <g opacity={fade}>
      <circle cx={x} cy={y} r={spread * 0.45} fill={color} opacity={0.12 * fade} />
      {Array.from({length: n}, (_, i) => {
        const a = (i / n) * Math.PI * 2 + R() * 0.2;
        const d = spread * (0.75 + R() * 0.35);
        const px = x + Math.cos(a) * d;
        const py = y + Math.sin(a) * d + k * k * 26;
        const tail = 18 * fade;
        return (
          <g key={i}>
            <line x1={px} y1={py} x2={px - Math.cos(a) * tail} y2={py - Math.sin(a) * tail - 6} stroke={color} strokeWidth={3} strokeLinecap="round" />
            <circle cx={px} cy={py} r={3.4} fill="#FFF6E0" />
          </g>
        );
      })}
    </g>
  );
};

/** A falling gold coin (edge-on wobble). */
export const Coin: React.FC<{x: number; y: number; r?: number; spin?: number}> = ({x, y, r = 11, spin = 0}) => {
  const w = Math.max(0.18, Math.abs(Math.cos(spin)));
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse rx={r * w} ry={r} fill={BD.gold} stroke={BD.goldDeep} strokeWidth={2.5} />
      {w > 0.5 && <ellipse rx={r * w * 0.55} ry={r * 0.55} fill="none" stroke={BD.goldDeep} strokeWidth={1.5} opacity={0.7} />}
    </g>
  );
};

// ── Hand props (drawn at the right hand via Figure `holding`) ───────────────
export const Toothbrush: React.FC = () => (
  <g transform="rotate(-150)">
    <rect x={-4} y={-6} width={8} height={70} rx={4} fill="#7FD6FF" stroke={C.ink} strokeWidth={2.5} />
    <rect x={-6} y={58} width={12} height={16} rx={3} fill="#FFFFFF" stroke={C.ink} strokeWidth={2} />
  </g>
);
export const Phone: React.FC<{glow?: boolean}> = ({glow}) => (
  <g transform="rotate(-160) translate(-14,-8)">
    <rect width={28} height={50} rx={5} fill="#15192A" stroke={C.ink} strokeWidth={2.5} />
    <rect x={3} y={5} width={22} height={38} rx={2} fill={glow ? BD.gold : '#2E3F5E'} />
  </g>
);
export const Tablet: React.FC = () => (
  <g transform="translate(-34,-30) rotate(-8)">
    <rect width={68} height={50} rx={6} fill="#20242F" stroke={C.ink} strokeWidth={3} />
    <rect x={5} y={5} width={58} height={40} rx={3} fill="#8FD3FF" />
    <rect x={10} y={30} width={10} height={10} fill="#2F5D8A" />
    <rect x={24} y={22} width={10} height={18} fill="#2F5D8A" />
    <rect x={38} y={14} width={10} height={26} fill="#2F5D8A" />
  </g>
);
export const Glass: React.FC = () => (
  <g transform="translate(-10,-50)">
    <path d="M0,0 L20,0 L16,30 L4,30 Z" fill="#FFE9A8" stroke={C.ink} strokeWidth={2.5} opacity={0.95} />
    <rect x={8.5} y={30} width={3} height={18} fill="#E8E8F0" />
    <rect x={2} y={46} width={16} height={4} rx={2} fill="#E8E8F0" stroke={C.ink} strokeWidth={1.5} />
  </g>
);
export const Bread: React.FC = () => (
  <g transform="translate(-6,-26) rotate(-20)">
    <rect width={46} height={18} rx={9} fill="#E2A65A" stroke={C.ink} strokeWidth={2.5} />
    <path d="M10,4 l6,10 M22,4 l6,10 M34,4 l6,10" stroke="#B9783A" strokeWidth={2} />
  </g>
);
export const CerealBox: React.FC = () => (
  <g transform="translate(-24,-70) rotate(-8)">
    <rect width={48} height={70} rx={3} fill="#E35D5D" stroke={C.ink} strokeWidth={3} />
    <circle cx={24} cy={30} r={12} fill="#F6C453" stroke={C.ink} strokeWidth={2} />
    <rect x={6} y={52} width={36} height={8} rx={3} fill="#FFFFFF" opacity={0.8} />
  </g>
);
export const Spoon: React.FC = () => (
  <g transform="translate(-4,-60) rotate(-12)">
    <rect x={2} y={10} width={6} height={60} rx={3} fill="#A0703C" stroke={C.ink} strokeWidth={2} />
    <ellipse cx={5} cy={8} rx={10} ry={14} fill="#B98348" stroke={C.ink} strokeWidth={2.5} />
  </g>
);
export const Orange: React.FC<{x?: number; y?: number; r?: number}> = ({x = 0, y = 0, r = 13}) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="#F7962A" stroke={C.ink} strokeWidth={2.5} />
    <path d={`M${x - 2},${y - r} q3,-5 7,-4`} stroke="#3C8D6E" strokeWidth={3} fill="none" />
  </g>
);
export const Cards: React.FC = () => (
  <g transform="translate(-20,-20)">
    {[-14, 0, 14].map((a, i) => (
      <rect key={i} x={10} y={0} width={24} height={34} rx={3} fill="#FFFFFF" stroke={C.ink} strokeWidth={2} transform={`rotate(${a},22,34)`} />
    ))}
    <circle cx={22} cy={14} r={4} fill="#C2464F" />
  </g>
);
export const Mic: React.FC = () => (
  <g transform="translate(-4,-40) rotate(-20)">
    <rect x={2} y={10} width={8} height={40} rx={3} fill="#2A2A2A" stroke={C.ink} strokeWidth={2} />
    <circle cx={6} cy={8} r={10} fill="#8A8A96" stroke={C.ink} strokeWidth={2.5} />
  </g>
);
export const Document: React.FC = () => (
  <g transform="translate(-20,-40) rotate(10)">
    <rect width={40} height={52} rx={2} fill="#FFFFFF" stroke={C.ink} strokeWidth={2.5} />
    {[12, 20, 28, 36].map((y) => (
      <line key={y} x1={7} y1={y} x2={33} y2={y} stroke="#B9C2D0" strokeWidth={2.5} />
    ))}
  </g>
);

/** Emblem: a gold sun circled by one clock hand. `turn` 0..1 sweeps the hand; the sun wanes to a crescent. */
export const Emblem: React.FC<{x: number; y: number; s?: number; turn: number; glow?: number}> = ({x, y, s = 1, turn, glow = 1}) => {
  const a = turn * Math.PI * 2 - Math.PI / 2;
  const wane = Math.max(0, Math.min(1, (turn - 0.35) / 0.65));
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <circle r={260} fill={BD.gold} opacity={0.08 * glow} />
      <circle r={190} fill={BD.gold} opacity={0.1 * glow} />
      <circle r={150} fill="none" stroke={BD.gold} strokeWidth={4} opacity={0.6} />
      {Array.from({length: 12}, (_, i) => {
        const b = (i / 12) * Math.PI * 2;
        return <line key={i} x1={Math.cos(b) * 136} y1={Math.sin(b) * 136} x2={Math.cos(b) * 150} y2={Math.sin(b) * 150} stroke={BD.gold} strokeWidth={i % 3 === 0 ? 6 : 3} opacity={0.75} />;
      })}
      <defs>
        <clipPath id={`sunClip${Math.round(x)}${Math.round(y)}`}>
          <circle r={92} />
        </clipPath>
      </defs>
      <circle r={92} fill={BD.gold} />
      <g clipPath={`url(#sunClip${Math.round(x)}${Math.round(y)})`}>
        <circle r={92} fill={BD.night} transform={`translate(${200 - wane * 160},${-wane * 30})`} />
      </g>
      <circle r={92} fill="none" stroke={BD.gold} strokeWidth={3} opacity={0.5} />
      <line x1={0} y1={0} x2={Math.cos(a) * 128} y2={Math.sin(a) * 128} stroke="#FFF6E0" strokeWidth={8} strokeLinecap="round" />
      <circle r={10} fill="#FFF6E0" />
    </g>
  );
};
