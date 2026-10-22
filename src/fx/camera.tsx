import React from 'react';
import {interpolate} from 'remotion';

/**
 * Slow push / pan across the whole SVG stage so no frame is ever static.
 * `from`/`to` are [zoom, focusX, focusY] keyframes across the shot's progress.
 */
export const Camera: React.FC<{
  progress: number;
  from?: [number, number, number];
  to?: [number, number, number];
  shake?: number;
  frame?: number;
  children: React.ReactNode;
}> = ({progress, from = [1, 960, 540], to = [1.06, 960, 540], shake = 0, frame = 0, children}) => {
  const e = interpolate(progress, [0, 1], [0, 1]);
  const z = from[0] + (to[0] - from[0]) * e;
  const fx = from[1] + (to[1] - from[1]) * e;
  const fy = from[2] + (to[2] - from[2]) * e;
  const sx = shake ? Math.sin(frame * 1.7) * shake * 6 + Math.sin(frame * 3.1) * shake * 3 : 0;
  const sy = shake ? Math.cos(frame * 2.3) * shake * 5 : 0;
  return <g transform={`translate(${960 + sx},${540 + sy}) scale(${z}) translate(${-fx},${-fy})`}>{children}</g>;
};

/** Parallax: far layers move less than the camera. */
export const Par: React.FC<{depth: number; fx: number; fy?: number; children: React.ReactNode}> = ({depth, fx, fy = 540, children}) => (
  <g transform={`translate(${(fx - 960) * (1 - depth)},${(fy - 540) * (1 - depth) * 0.5})`}>{children}</g>
);

export type Cam = [number, number, number];
export const lerpCam = (a: Cam, b: Cam, p: number): Cam => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p];
