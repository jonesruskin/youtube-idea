import React, {useLayoutEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';

/**
 * Celestial bodies (docs/00 P13): real geography, drawn in the show's style. Every Moon, Earth and planet on screen is
 * one of these discs, baked by scripts/bake_bodies.py from real maps (NASA LRO Moon, NASA Blue Marble Earth, Solar
 * System Scope planets) and redrawn flat: a few solid colours, inked coasts and crater rims. On screen each gets the
 * same ink outline and flat cel shadow as the characters. Two CEO notes made this: "the craters look weird, continents
 * misplaced" (a hand-drawn Moon and Earth) and then "the real image looks odd with the animation" (raw NASA photos).
 * The check-episode real-bodies gate fails hand-drawn bodies and any texture not in public/bodies/manifest.json.
 */
const INK = '#0B1026';
export type BodyName = 'moon' | 'earth-atlantic' | 'earth-pacific' | 'earth-asia' | 'venus' | 'mars' | 'mercury' | 'jupiter' | 'saturn';

const ready: Record<string, boolean | Promise<void>> = {};
const preload = (name: BodyName) => {
  const hit = ready[name];
  if (hit === true) return null;
  if (hit) return hit;
  const img = new Image();
  img.src = staticFile(`bodies/${name}.png`);
  const p = img
    .decode()
    .catch(() => undefined)
    .then(() => {
      ready[name] = true;
    });
  ready[name] = p;
  return p;
};

/** Wait (once per body per tab) until the texture is decoded, so no frame renders an empty disc. */
const useBody = (name: BodyName) => {
  const [, set] = useState(0);
  useLayoutEffect(() => {
    const p = preload(name);
    if (!p) return;
    const h = delayRender(`body ${name}`);
    p.then(() => {
      set((n) => n + 1);
      continueRender(h);
    });
  }, [name]);
};

/**
 * A real body as an SVG group centred on (x, y) with radius r.
 * - `light`: the direction sunlight comes from, in degrees (0 = from the right, 90 = from below); omit for fully lit.
 * - `phase`: 0 = fully lit facing us, 1 = half lit, 2 = new (dark side to us). Drawn as a soft terminator.
 * - `tint`: colour multiplied over the disc (a night Moon is warmer, a day Moon paler); `tintAmount` 0..1.
 * - `glow`: halo strength (the Moon at night).
 * - `dark`: 0..1 dims the whole disc (a world without sunlight).
 */
export const Body: React.FC<{
  name: BodyName;
  x: number;
  y: number;
  r: number;
  light?: number;
  phase?: number;
  tint?: string;
  tintAmount?: number;
  glow?: number;
  glowColor?: string;
  dark?: number;
  opacity?: number;
  rotate?: number;
  /** where the flat cel shadow sits, degrees (0 = right side, the default: light from the upper left). */
  shadeAngle?: number;
}> = ({name, x, y, r, light, phase = 0, tint, tintAmount = 0.25, glow = 0, glowColor = '#FFF6C8', dark = 0, opacity = 1, rotate = 0, shadeAngle = 20}) => {
  useBody(name);
  const id = `b-${name}-${Math.round(x)}-${Math.round(y)}-${Math.round(r)}`;
  const lit = light !== undefined && phase > 0;
  return (
    <g transform={`translate(${x},${y})`} opacity={opacity}>
      <defs>
        <clipPath id={`${id}c`}>
          <circle r={r} />
        </clipPath>
        {/* cel shadow: the disc minus a copy shifted toward the light leaves a crescent on the far side */}
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x={-r * 1.1} y={-r * 1.1} width={r * 2.2} height={r * 2.2}>
          <circle r={r * 1.05} fill="#fff" />
          <circle cx={-Math.cos((shadeAngle * Math.PI) / 180) * r * 0.24} cy={-Math.sin((shadeAngle * Math.PI) / 180) * r * 0.24} r={r} fill="#000" />
        </mask>
        {glow > 0 && (
          <radialGradient id={`${id}g`}>
            <stop offset="0.5" stopColor={glowColor} stopOpacity={0.5 * glow} />
            <stop offset="1" stopColor={glowColor} stopOpacity={0} />
          </radialGradient>
        )}
        {lit && (
          <linearGradient id={`${id}t`} gradientTransform={`rotate(${light! + 180},0.5,0.5)`}>
            <stop offset={Math.max(0, 1 - phase * 0.5 - 0.015)} stopColor={INK} stopOpacity={0} />
            <stop offset={Math.min(1, 1 - phase * 0.5 + 0.015)} stopColor={INK} stopOpacity={0.8} />
          </linearGradient>
        )}
      </defs>
      {glow > 0 && <circle r={r * 1.9} fill={`url(#${id}g)`} />}
      <g clipPath={`url(#${id}c)`}>
        <image href={staticFile(`bodies/${name}.png`)} x={-r} y={-r} width={2 * r} height={2 * r} transform={rotate ? `rotate(${rotate})` : undefined} />
        {tint && <circle r={r} fill={tint} opacity={tintAmount} style={{mixBlendMode: 'multiply'}} />}
        {lit && <rect x={-r} y={-r} width={2 * r} height={2 * r} fill={`url(#${id}t)`} />}
        {dark > 0 && <circle r={r} fill="#02040C" opacity={dark} />}
        {/* flat cel shadow on the side away from the light, like the characters' shading */}
        {!lit && <circle r={r} fill={INK} opacity={0.16} mask={`url(#${id}m)`} />}
      </g>
      <circle r={r} fill="none" stroke={INK} strokeWidth={Math.max(2, r * 0.028)} />
    </g>
  );
};
