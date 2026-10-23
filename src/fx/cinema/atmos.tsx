import React, {useId, useMemo} from 'react';
import {rand} from '../sky';

/** Falling snow in three depths. `wind` pushes it sideways; `density` 0..1. */
export const Snow: React.FC<{frame: number; density?: number; wind?: number; w?: number; h?: number; x0?: number; y0?: number; seed?: number; opacity?: number}> = ({
  frame,
  density = 0.6,
  wind = 0.6,
  w = 2400,
  h = 1400,
  x0 = -240,
  y0 = -160,
  seed = 5,
  opacity = 1,
}) => {
  const flakes = useMemo(() => {
    const r = rand(seed);
    return Array.from({length: Math.round(260 * density)}, () => {
      const d = r();
      return {x: r() * w, y: r() * h, d, sp: 0.6 + d * 2.6, sz: 1.2 + d * d * 5.5, ph: r() * 6.28};
    });
  }, [density, w, h, seed]);
  return (
    <g opacity={opacity}>
      {flakes.map((f, i) => {
        const y = y0 + ((f.y + frame * f.sp) % h);
        const x = x0 + ((((f.x + frame * wind * f.sp * 0.8 + Math.sin(frame * 0.03 + f.ph) * 14) % w) + w) % w);
        return <circle key={i} cx={x} cy={y} r={f.sz} fill="#F4F8FF" opacity={0.35 + f.d * 0.6} />;
      })}
    </g>
  );
};

/** Aurora curtains: rays whose heights ripple along the arc, green at the foot, violet at the tips. */
export const Aurora: React.FC<{frame: number; y?: number; intensity?: number; x0?: number; x1?: number; seed?: number}> = ({frame, y = 640, intensity = 1, x0 = -200, x1 = 2120, seed = 3}) => {
  const id = useId().replace(/:/g, '');
  const rays = useMemo(() => {
    const r = rand(seed);
    return Array.from({length: 150}, (_, i) => ({u: i / 149, ph: r() * 6.28, w: 10 + r() * 22, k: r()}));
  }, [seed]);
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={intensity}>
      <defs>
        <linearGradient id={`au${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#7DFFB2" stopOpacity={0} />
          <stop offset="0.08" stopColor="#7DFFB2" stopOpacity={0.95} />
          <stop offset="0.45" stopColor="#3EE8A0" stopOpacity={0.55} />
          <stop offset="0.8" stopColor="#B07CFF" stopOpacity={0.35} />
          <stop offset="1" stopColor="#B07CFF" stopOpacity={0} />
        </linearGradient>
        <filter id={`af${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={7} />
        </filter>
      </defs>
      <g filter={`url(#af${id})`}>
        {rays.map((r, i) => {
          const x = x0 + (x1 - x0) * r.u + Math.sin(frame * 0.012 + r.u * 9) * 60;
          const fold = Math.sin(r.u * 7 + frame * 0.02) * 120 + Math.sin(r.u * 17 - frame * 0.031) * 40;
          const base = y + fold * 0.4 - Math.sin(r.u * Math.PI) * 140;
          const hgt = 260 + 220 * (0.5 + 0.5 * Math.sin(r.u * 13 + frame * 0.05 + r.ph)) * (0.6 + 0.4 * Math.sin(r.u * Math.PI));
          const op = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(frame * 0.09 + r.ph + r.u * 20));
          return <rect key={i} x={x} y={base - hgt} width={r.w} height={hgt} fill={`url(#au${id})`} opacity={op} />;
        })}
      </g>
    </g>
  );
};

/** The Milky Way: a diagonal band of dense stars over a soft glow with dark dust lanes. */
export const MilkyWay: React.FC<{frame: number; opacity?: number; angle?: number; cx?: number; cy?: number; seed?: number}> = ({frame, opacity = 1, angle = -28, cx = 960, cy = 420, seed = 21}) => {
  const id = useId().replace(/:/g, '');
  const stars = useMemo(() => {
    const r = rand(seed);
    return Array.from({length: 900}, () => {
      const along = (r() - 0.5) * 2800;
      const g = (r() + r() + r() - 1.5) * 170; // gaussian-ish across the band
      return {a: along, g, s: 0.4 + Math.pow(r(), 6) * 2.4, p: r() * 6.28, warm: r() > 0.8};
    });
  }, [seed]);
  return (
    <g opacity={opacity} transform={`translate(${cx},${cy}) rotate(${angle})`}>
      <defs>
        <linearGradient id={`mw${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9FB7FF" stopOpacity={0} />
          <stop offset="0.38" stopColor="#C9C6F0" stopOpacity={0.22} />
          <stop offset="0.5" stopColor="#FFF0D8" stopOpacity={0.34} />
          <stop offset="0.62" stopColor="#C9C6F0" stopOpacity={0.22} />
          <stop offset="1" stopColor="#9FB7FF" stopOpacity={0} />
        </linearGradient>
        <filter id={`mb${id}`} x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation={26} />
        </filter>
      </defs>
      <rect x={-1500} y={-240} width={3000} height={480} fill={`url(#mw${id})`} filter={`url(#mb${id})`} />
      <g filter={`url(#mb${id})`} opacity={0.75}>
        <path d="M-1400,10 C-900,-40 -500,60 -100,0 C300,-50 700,50 1400,-10" stroke="#05060F" strokeWidth={46} fill="none" />
        <path d="M-1200,60 C-800,40 -300,90 200,40 C600,10 900,70 1300,40" stroke="#05060F" strokeWidth={22} fill="none" opacity={0.7} />
      </g>
      {stars.map((s, i) => (
        <circle key={i} cx={s.a} cy={s.g} r={s.s} fill={s.warm ? '#FFE3C0' : '#F2F4FF'} opacity={0.55 + 0.45 * Math.sin(frame * 0.05 + s.p)} />
      ))}
    </g>
  );
};

/** Torch / headlamp beam: a soft cone from (x,y) toward angle°, with a bright core and dust in the light. */
export const Beam: React.FC<{x: number; y: number; angle: number; len?: number; spread?: number; color?: string; opacity?: number; frame?: number}> = ({
  x,
  y,
  angle,
  len = 900,
  spread = 16,
  color = '#FFF2C6',
  opacity = 0.55,
  frame = 0,
}) => {
  const id = useId().replace(/:/g, '');
  const a = (angle * Math.PI) / 180;
  const s = (spread * Math.PI) / 180;
  const p1 = [x + Math.cos(a - s) * len, y + Math.sin(a - s) * len];
  const p2 = [x + Math.cos(a + s) * len, y + Math.sin(a + s) * len];
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={opacity}>
      <defs>
        <radialGradient id={`bm${id}`} cx={x} cy={y} r={len} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={color} stopOpacity={0.95} />
          <stop offset="0.6" stopColor={color} stopOpacity={0.25} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
        <filter id={`bf${id}`}>
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      <path d={`M${x},${y} L${p1[0]},${p1[1]} L${p2[0]},${p2[1]} Z`} fill={`url(#bm${id})`} filter={`url(#bf${id})`} />
      <circle cx={x} cy={y} r={18} fill={color} opacity={0.9} filter={`url(#bf${id})`} />
      {Array.from({length: 26}, (_, i) => {
        const u = ((i * 0.137 + frame * 0.0021 * (1 + (i % 3))) % 1) * len * 0.9 + 40;
        const v = Math.sin(i * 12.9898) * s * 0.8;
        return <circle key={i} cx={x + Math.cos(a + v) * u} cy={y + Math.sin(a + v) * u + Math.sin(frame * 0.05 + i) * 4} r={1.6} fill="#FFFFFF" opacity={0.6} />;
      })}
    </g>
  );
};

/** Frost crystals growing from the frame edges. amount 0..1. Used on windows and as the Day transition. */
export const Frost: React.FC<{amount: number; w?: number; h?: number; seed?: number; color?: string}> = ({amount, w = 1920, h = 1080, seed = 9, color = '#EAF6FF'}) => {
  const id = useId().replace(/:/g, '');
  const branches = useMemo(() => {
    const r = rand(seed);
    const out: {d: string; t: number; wd: number}[] = [];
    // Fern-like dendrites: a wavering spine with short paired barbs at ±60°, like frost on glass.
    const fern = (x: number, y: number, ang: number, len: number, depth: number, t0: number) => {
      const steps = Math.max(3, Math.floor(len / 14));
      let px = x;
      let py = y;
      let a = ang;
      for (let k = 0; k < steps; k++) {
        a += (r() - 0.5) * 0.25;
        const nx = px + Math.cos(a) * 14;
        const ny = py + Math.sin(a) * 14;
        const tk = t0 + (k / steps) * 0.45;
        out.push({d: `M${px.toFixed(1)},${py.toFixed(1)} L${nx.toFixed(1)},${ny.toFixed(1)}`, t: tk, wd: depth ? 1.4 : 2.4});
        const barb = (1 - k / steps) * (depth ? 10 : 22) + 4;
        for (const sd of [-1, 1]) {
          const ba = a + sd * 1.05;
          out.push({d: `M${nx.toFixed(1)},${ny.toFixed(1)} L${(nx + Math.cos(ba) * barb).toFixed(1)},${(ny + Math.sin(ba) * barb).toFixed(1)}`, t: tk + 0.05, wd: 1.2});
        }
        if (depth < 1 && k % 4 === 2 && r() > 0.3) fern(nx, ny, a + (r() > 0.5 ? 1 : -1) * 0.9, len * 0.45, depth + 1, tk);
        px = nx;
        py = ny;
      }
    };
    for (let i = 0; i < 46; i++) {
      const side = i % 4;
      const u = r();
      const [x, y, ang] = side === 0 ? [u * w, 0, Math.PI / 2] : side === 1 ? [w, u * h, Math.PI] : side === 2 ? [u * w, h, -Math.PI / 2] : [0, u * h, 0];
      fern(x, y, ang + (r() - 0.5) * 1.1, 90 + r() * 200, 0, r() * 0.3);
    }
    return out;
  }, [w, h, seed]);
  return (
    <g>
      <defs>
        <radialGradient id={`fr${id}`} cx="0.5" cy="0.5" r="0.75">
          <stop offset={Math.max(0, 0.95 - amount * 0.95)} stopColor={color} stopOpacity={0} />
          <stop offset="1" stopColor={color} stopOpacity={0.55 * amount} />
        </radialGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#fr${id})`} />
      {branches.map((b, i) => (b.t < amount ? <path key={i} d={b.d} stroke={color} strokeWidth={b.wd} opacity={Math.min(1, (amount - b.t) * 4) * 0.8} strokeLinecap="round" /> : null))}
    </g>
  );
};

/** Big soft light bloom (practical lights, sun flare). */
export const Bloom: React.FC<{x: number; y: number; r: number; color: string; opacity?: number}> = ({x, y, r, color, opacity = 0.6}) => {
  const id = useId().replace(/:/g, '');
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={`bl${id}`}>
          <stop offset="0" stopColor={color} stopOpacity={opacity} />
          <stop offset="0.35" stopColor={color} stopOpacity={opacity * 0.35} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#bl${id})`} />
    </g>
  );
};

/** Anamorphic lens streak through a bright point. */
export const Streak: React.FC<{x: number; y: number; w?: number; color?: string; opacity?: number}> = ({x, y, w = 1400, color = '#9FD8FF', opacity = 0.5}) => {
  const id = useId().replace(/:/g, '');
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={opacity}>
      <defs>
        <linearGradient id={`st${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={color} stopOpacity={0} />
          <stop offset="0.5" stopColor={color} stopOpacity={0.9} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={x - w / 2} y={y - 3} width={w} height={6} fill={`url(#st${id})`} />
      <rect x={x - w / 4} y={y - 1} width={w / 2} height={2} fill="#FFFFFF" opacity={0.7} />
    </g>
  );
};
