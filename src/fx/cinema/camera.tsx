import React, {createContext, useContext, useId} from 'react';
import {Easing, interpolate} from 'remotion';

/**
 * Multi-plane camera: the film language layer on top of the flat house style.
 * Keyframes are [progress 0..1, zoom, focusX, focusY, roll°]. Planes at depth 1 move fully with the camera;
 * depth 0.2 (far sky) barely moves — that difference is the parallax that makes a flat drawing feel shot.
 */
export type CamKey = [at: number, z: number, x: number, y: number, r?: number];
type Cam = {z: number; x: number; y: number; r: number; hx: number; hy: number};
const Ctx = createContext<Cam>({z: 1, x: 960, y: 540, r: 0, hx: 0, hy: 0});

const ease = Easing.bezier(0.45, 0, 0.2, 1);

export const camAt = (keys: CamKey[], p: number): Omit<Cam, 'hx' | 'hy'> => {
  if (keys.length === 1) return {z: keys[0][1], x: keys[0][2], y: keys[0][3], r: keys[0][4] ?? 0};
  let i = 0;
  while (i < keys.length - 2 && p > keys[i + 1][0]) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const t = ease(interpolate(p, [a[0], b[0]], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const L = (u: number, v: number) => u + (v - u) * t;
  return {z: L(a[1], b[1]), x: L(a[2], b[2]), y: L(a[3], b[3]), r: L(a[4] ?? 0, b[4] ?? 0)};
};

/** Wrap a scene. `handheld` adds a slow organic drift (0 = locked off tripod). */
export const Cine: React.FC<{keys: CamKey[]; progress: number; frame: number; handheld?: number; children: React.ReactNode}> = ({keys, progress, frame, handheld = 0.4, children}) => {
  const c = camAt(keys, progress);
  const hx = handheld * (Math.sin(frame * 0.031) * 7 + Math.sin(frame * 0.077 + 1.3) * 3);
  const hy = handheld * (Math.cos(frame * 0.027 + 0.4) * 5 + Math.sin(frame * 0.063) * 2);
  return <Ctx.Provider value={{...c, hx, hy}}>{children}</Ctx.Provider>;
};

/** One depth layer. blur > 0 = out of focus (rack focus by animating it). */
export const Plane: React.FC<{depth?: number; blur?: number; children: React.ReactNode; opacity?: number}> = ({depth = 1, blur = 0, children, opacity = 1}) => {
  const c = useContext(Ctx);
  const id = useId().replace(/:/g, '');
  const z = 1 + (c.z - 1) * depth;
  const x = 960 + (c.x - 960) * depth + c.hx * depth;
  const y = 540 + (c.y - 540) * depth + c.hy * depth;
  return (
    <g opacity={opacity}>
      {blur > 0.2 && (
        <defs>
          <filter id={`pb${id}`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={blur} />
          </filter>
        </defs>
      )}
      <g transform={`translate(960,540) rotate(${c.r}) scale(${z}) translate(${-x},${-y})`} filter={blur > 0.2 ? `url(#pb${id})` : undefined}>
        {children}
      </g>
    </g>
  );
};

/** Screen-space layer (grade, light leaks): follows only the roll, never the zoom. */
export const ScreenPlane: React.FC<{children: React.ReactNode}> = ({children}) => {
  const c = useContext(Ctx);
  return <g transform={`rotate(${c.r},960,540)`}>{children}</g>;
};
