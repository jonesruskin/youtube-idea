import React, {useMemo} from 'react';
import {geoCircle, geoGraticule10, geoInterpolate, geoOrthographic, geoPath} from 'd3-geo';
import {feature} from 'topojson-client';
import land110 from 'world-atlas/land-110m.json';
import {C} from '../theme';

// Natural Earth land polygons (public domain) via world-atlas.
const LAND = feature(land110 as any, (land110 as any).objects.land) as any;

// Major night-light clusters [lon, lat, weight].
const CITIES: [number, number, number][] = [
  [3.38, 6.52, 3], [7.49, 9.06, 1.5], [-0.19, 5.6, 2], [2.35, 6.37, 1.2], [-4.02, 5.35, 1.5], [-17.45, 14.69, 1.2],
  [31.24, 30.04, 3], [3.06, 36.75, 1.5], [-7.59, 33.57, 1.5], [36.82, -1.29, 1.5], [28.04, -26.2, 2.5], [18.42, -33.92, 1.5],
  [-0.13, 51.5, 3], [2.35, 48.86, 3], [13.4, 52.52, 2], [12.5, 41.9, 2], [-3.7, 40.42, 2], [37.62, 55.75, 3], [28.97, 41.0, 2.5],
  [77.21, 28.61, 3], [72.88, 19.08, 3], [88.36, 22.57, 2.5], [80.27, 13.08, 2], [90.41, 23.81, 2.5], [67.0, 24.86, 2.5],
  [116.4, 39.9, 3], [121.47, 31.23, 3], [113.26, 23.13, 3], [139.69, 35.68, 3], [126.98, 37.57, 2.5], [100.5, 13.75, 2], [106.85, -6.21, 2.5],
  [151.21, -33.87, 2], [144.96, -37.81, 1.5], [-74.0, 40.71, 3], [-87.63, 41.88, 2.5], [-118.24, 34.05, 3], [-122.42, 37.77, 2], [-95.37, 29.76, 2],
  [-79.38, 43.65, 2], [-73.57, 45.5, 1.5], [-99.13, 19.43, 3], [-46.63, -23.55, 3], [-43.2, -22.9, 2.5], [-58.38, -34.6, 2.5], [-77.04, -12.05, 2],
  [-74.07, 4.71, 2], [-80.19, 25.76, 2], [-84.39, 33.75, 1.8], [-77.04, 38.9, 2], [55.27, 25.2, 2], [46.68, 24.71, 1.8], [51.39, 35.69, 2.5],
];

export type GlobeMarker = {lonlat: [number, number]; label?: string; color?: string; pulse?: boolean};
export type GlobeArc = {from: [number, number]; to: [number, number]; progress: number; color?: string; dashed?: boolean};

export const Globe: React.FC<{
  cx: number;
  cy: number;
  r: number;
  rotate: [number, number, number?];
  frame: number;
  /** Sub-solar longitude/latitude — sets where day/night falls. */
  sun: [number, number];
  markers?: GlobeMarker[];
  arcs?: GlobeArc[];
  atmosphere?: string;
  dayLand?: string;
  dayOcean?: string;
}> = ({cx, cy, r, rotate, frame, sun, markers = [], arcs = [], atmosphere = '#6FB8FF', dayLand = '#3E8E6A', dayOcean = '#1D5FA8'}) => {
  const proj = useMemo(() => geoOrthographic().scale(r).translate([cx, cy]).rotate(rotate as [number, number, number]).clipAngle(90), [cx, cy, r, rotate[0], rotate[1], rotate[2]]);
  const path = geoPath(proj);
  const night = geoCircle().center([sun[0] + 180, -sun[1]]).radius(90)();
  const twilight = geoCircle().center([sun[0] + 180, -sun[1]]).radius(96)();
  const grat = geoGraticule10();
  const visible = (ll: [number, number]) => {
    const p = proj(ll);
    if (!p) return null;
    // hidden-side test: distance from view centre
    const rr = proj.rotate();
    const lambda = ((ll[0] + rr[0]) * Math.PI) / 180;
    const phi = (ll[1] * Math.PI) / 180;
    const phi0 = (-rr[1] * Math.PI) / 180;
    const cosc = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda);
    return cosc > 0 ? p : null;
  };
  const inNight = (ll: [number, number]) => {
    const toRad = Math.PI / 180;
    const cosAng = Math.sin(sun[1] * toRad) * Math.sin(ll[1] * toRad) + Math.cos(sun[1] * toRad) * Math.cos(ll[1] * toRad) * Math.cos((ll[0] - sun[0]) * toRad);
    return cosAng < 0.05;
  };
  return (
    <g>
      <defs>
        <radialGradient id="atmo">
          <stop offset="0.86" stopColor={atmosphere} stopOpacity={0} />
          <stop offset="0.93" stopColor={atmosphere} stopOpacity={0.55} />
          <stop offset="1" stopColor={atmosphere} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="shade" cx="0.35" cy="0.3">
          <stop offset="0.6" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.35} />
        </radialGradient>
        <clipPath id="globeClip">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r * 1.1} fill="url(#atmo)" />
      <circle cx={cx} cy={cy} r={r} fill={dayOcean} stroke={C.ink} strokeWidth={5} />
      <g clipPath="url(#globeClip)">
        <path d={path(grat) ?? ''} fill="none" stroke="#FFFFFF" strokeOpacity={0.06} strokeWidth={1} />
        <path d={path(LAND) ?? ''} fill={dayLand} stroke={C.ink} strokeOpacity={0.35} strokeWidth={1.5} />
        <path d={path(twilight) ?? ''} fill="#0A1030" opacity={0.35} />
        <path d={path(night) ?? ''} fill="#060A22" opacity={0.78} />
        {CITIES.map(([lon, lat, w], i) => {
          const p = visible([lon, lat]);
          if (!p || !inNight([lon, lat])) return null;
          const tw = 0.75 + 0.25 * Math.sin(frame * 0.2 + i);
          return (
            <g key={i}>
              <circle cx={p[0]} cy={p[1]} r={w * 4.5 * Math.min(1.6, r / 400)} fill="#FFC86B" opacity={0.18 * tw} />
              <circle cx={p[0]} cy={p[1]} r={w * 1.5 * Math.min(1.6, r / 400)} fill="#FFE2A8" opacity={0.95 * tw} />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={r} fill="url(#shade)" />
      </g>
      {arcs.map((a, i) => {
        const interp = geoInterpolate(a.from, a.to);
        const n = 60;
        const pts: [number, number][] = [];
        for (let k = 0; k <= Math.floor(n * a.progress); k++) {
          const p = visible(interp(k / n) as [number, number]);
          if (p) pts.push(p as [number, number]);
        }
        if (pts.length < 2) return null;
        const head = pts[pts.length - 1];
        return (
          <g key={i}>
            <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={a.color ?? C.gold} strokeWidth={5} strokeDasharray={a.dashed ? '10 10' : undefined} strokeLinecap="round" />
            <circle cx={head[0]} cy={head[1]} r={9} fill={C.pearl} stroke={C.ink} strokeWidth={3} />
          </g>
        );
      })}
      {markers.map((m, i) => {
        const p = visible(m.lonlat);
        if (!p) return null;
        const pr = m.pulse ? 14 + ((frame * 0.8) % 30) : 0;
        return (
          <g key={i}>
            {m.pulse && <circle cx={p[0]} cy={p[1]} r={pr} fill="none" stroke={m.color ?? C.coral} strokeWidth={3} opacity={1 - (pr - 14) / 30} />}
            <circle cx={p[0]} cy={p[1]} r={9} fill={m.color ?? C.coral} stroke={C.ink} strokeWidth={3} />
            {m.label && (
              <text x={p[0] + 18} y={p[1] - 14} fill={C.pearl} fontSize={30} fontWeight={700} fontFamily="'Space Grotesk', sans-serif" stroke={C.ink} strokeWidth={6} paintOrder="stroke">
                {m.label}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};
