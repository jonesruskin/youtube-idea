import React, {useLayoutEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';

/**
 * Real celestial bodies (docs/00 P13). Every Moon, Earth and planet on screen is one of these discs, baked from real maps
 * by scripts/bake_bodies.py (NASA LRO Moon, NASA Blue Marble Earth, Solar System Scope planets). Nothing is hand-drawn:
 * a hand-drawn Moon or Earth is what the CEO caught on the File 002 thumbnails ("craters look weird, continents misplaced").
 * The check-episode "real bodies" gate fails any scene file that defines its own Moon / Earth / Planet drawing.
 */
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
}> = ({name, x, y, r, light, phase = 0, tint, tintAmount = 0.25, glow = 0, glowColor = '#FFF6C8', dark = 0, opacity = 1, rotate = 0}) => {
  useBody(name);
  const id = `b-${name}-${Math.round(x)}-${Math.round(y)}-${Math.round(r)}`;
  const lit = light !== undefined && phase > 0;
  return (
    <g transform={`translate(${x},${y})`} opacity={opacity}>
      <defs>
        <clipPath id={`${id}c`}>
          <circle r={r} />
        </clipPath>
        {glow > 0 && (
          <radialGradient id={`${id}g`}>
            <stop offset="0.5" stopColor={glowColor} stopOpacity={0.5 * glow} />
            <stop offset="1" stopColor={glowColor} stopOpacity={0} />
          </radialGradient>
        )}
        {lit && (
          <linearGradient id={`${id}t`} gradientTransform={`rotate(${light! + 180},0.5,0.5)`}>
            <stop offset={Math.max(0, 1 - phase * 0.5 - 0.08)} stopColor="#000" stopOpacity={0} />
            <stop offset={Math.min(1, 1 - phase * 0.5 + 0.08)} stopColor="#000" stopOpacity={0.88} />
          </linearGradient>
        )}
      </defs>
      {glow > 0 && <circle r={r * 1.9} fill={`url(#${id}g)`} />}
      <g clipPath={`url(#${id}c)`}>
        <image href={staticFile(`bodies/${name}.png`)} x={-r} y={-r} width={2 * r} height={2 * r} transform={rotate ? `rotate(${rotate})` : undefined} />
        {tint && <circle r={r} fill={tint} opacity={tintAmount} style={{mixBlendMode: 'multiply'}} />}
        {lit && <rect x={-r} y={-r} width={2 * r} height={2 * r} fill={`url(#${id}t)`} />}
        {dark > 0 && <circle r={r} fill="#02040C" opacity={dark} />}
      </g>
    </g>
  );
};
