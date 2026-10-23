import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Stars, rand} from '../../fx/sky';
import {PhotoGlobe} from '../../fx/PhotoGlobe';
import {useSetCtx, Vignette} from './stage';

/**
 * Space: the Sun, the shell that closes around it, the last light racing to Earth, the beam and the signal.
 * The shell is a Goldberg-style sphere of dark plates (a Fibonacci lattice projected orthographically), with
 * seams that glow faintly with waste heat — the one thing the family can later detect.
 */
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

type Plate = {x: number; y: number; z: number; r: number; rot: number; seed: number};
const usePlates = (n: number) =>
  useMemo(() => {
    const out: Plate[] = [];
    const g = Math.PI * (3 - Math.sqrt(5));
    const r = rand(17);
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const th = g * i;
      out.push({x: Math.cos(th) * rad, y, z: Math.sin(th) * rad, r: r(), rot: r() * 60, seed: i});
    }
    return out;
  }, [n]);

/** The Sun: limb-darkened disc, turbulent granulation, corona. */
const Sun: React.FC<{cx: number; cy: number; r: number; frame: number; bright?: number}> = ({cx, cy, r, frame, bright = 1}) => (
  <g opacity={bright}>
    <defs>
      <radialGradient id="sunDisc">
        <stop offset="0" stopColor="#FFF9E6" />
        <stop offset="0.55" stopColor="#FFE08A" />
        <stop offset="0.85" stopColor="#FFB13B" />
        <stop offset="1" stopColor="#F2741F" />
      </radialGradient>
      <radialGradient id="corona">
        <stop offset="0.45" stopColor="#FFD27A" stopOpacity={0.9} />
        <stop offset="0.6" stopColor="#FF9E3A" stopOpacity={0.35} />
        <stop offset="1" stopColor="#FF7A1A" stopOpacity={0} />
      </radialGradient>
      <filter id="gran" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency={0.035} numOctaves={3} seed={Math.floor(frame / 3) % 50} />
        <feColorMatrix values="0 0 0 0 1  0 0 0 0 0.55  0 0 0 0 0.1  0 0 0 0.55 -0.1" />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
    </defs>
    <circle cx={cx} cy={cy} r={r * 2.3} fill="url(#corona)" style={{mixBlendMode: 'screen'}} />
    <circle cx={cx} cy={cy} r={r} fill="url(#sunDisc)" />
    <circle cx={cx} cy={cy} r={r} fill="#FFFFFF" filter="url(#gran)" opacity={0.7} />
    {/* prominences */}
    {[30, 160, 250].map((a, i) => {
      const ar = (a * Math.PI) / 180;
      const px = cx + Math.cos(ar) * r;
      const py = cy + Math.sin(ar) * r;
      const h = r * (0.18 + 0.05 * Math.sin(frame * 0.04 + i));
      return <path key={a} d={`M${px},${py} q${Math.cos(ar) * h},${Math.sin(ar) * h} ${Math.cos(ar + 0.4) * h * 0.4},${Math.sin(ar + 0.4) * h * 0.4}`} stroke="#FF8A2A" strokeWidth={r * 0.03} fill="none" opacity={0.8} />;
    })}
  </g>
);

/**
 * The shell. close ∈ [0,1]: plates fly in from far out and lock on. spin rotates the sphere.
 * seam = waste-heat glow at the seams; open = a plate sliding aside (the one-second door).
 */
const Shell: React.FC<{cx: number; cy: number; r: number; close: number; spin: number; seam?: number; frame: number; open?: number; n?: number}> = ({cx, cy, r, close, spin, seam = 0.35, frame, open = 0, n = 320}) => {
  const plates = usePlates(n);
  const pr = r * Math.sqrt(4 / n) * 1.08; // plate radius so the sphere is covered
  const cs = Math.cos(spin);
  const sn = Math.sin(spin);
  const items = plates
    .map((p, i) => {
      const x = p.x * cs + p.z * sn;
      const z = -p.x * sn + p.z * cs;
      return {...p, x, z, i};
    })
    .filter((p) => p.z > -0.05)
    .sort((a, b) => a.z - b.z);
  return (
    <g>
      {/* the hot interior glimpsed through the seams */}
      {close > 0.6 && (
        <g>
          <defs>
            <radialGradient id="shellHeat">
              <stop offset="0" stopColor="#9A3A10" />
              <stop offset="0.8" stopColor="#5A1A08" />
              <stop offset="1" stopColor="#2A0A04" />
            </radialGradient>
          </defs>
          <circle cx={cx} cy={cy} r={r * 0.99} fill="url(#shellHeat)" opacity={clamp((close - 0.6) * 2.5) * (0.5 + seam * 0.6)} />
        </g>
      )}
      {items.map((p) => {
        // each plate arrives at its own moment
        const arrive = clamp((close - p.r * 0.55) / 0.45);
        const k = ease(arrive);
        const fly = (1 - k) * 2.8; // how far out it still is
        const isDoor = open > 0 && p.i === 7;
        const dx = isDoor ? open * pr * 2.4 : 0;
        const px = cx + p.x * r * (1 + fly) + dx;
        const py = cy - p.y * r * (1 + fly);
        if (arrive <= 0) return null;
        const foreshorten = Math.max(0.15, p.z);
        // light: lit from the camera-left, darker at the limb
        const shade = 0.25 + 0.45 * p.z;
        const ang = Math.atan2(-p.y, p.x) * (180 / Math.PI);
        const sides = 6;
        const pts = Array.from({length: sides}, (_, s) => {
          const a = ((s / sides) * 360 + p.rot) * (Math.PI / 180);
          return [Math.cos(a) * pr, Math.sin(a) * pr * 1];
        });
        return (
          <g key={p.i} transform={`translate(${px},${py}) rotate(${ang}) scale(${foreshorten},1) rotate(${-ang})`} opacity={clamp(arrive * 3)}>
            <polygon points={pts.map((q) => q.join(',')).join(' ')} fill={`rgb(${10 + shade * 26},${11 + shade * 26},${16 + shade * 32})`} stroke={`rgba(255,${120 + 60 * seam},${60},${0.18 + seam * 0.5})`} strokeWidth={Math.max(1.2, pr * 0.07)} />
            <polygon points={pts.map((q) => [q[0] * 0.55, q[1] * 0.55].join(',')).join(' ')} fill="none" stroke="#2E3242" strokeWidth={Math.max(1, pr * 0.03)} opacity={0.8} />
          </g>
        );
      })}
    </g>
  );
};

const Space: React.FC = () => {
  const c = useSetCtx();
  const {frame, t, dur, progress} = {frame: c.frame, t: c.t, dur: c.dur, progress: c.t / c.dur};
  const v = c.v;
  const W = 1920;
  const H = 1080;
  const starfield = <Stars frame={frame} count={700} w={W} h={H} seed={51} maxR={2.2} />;

  if (v === 'close') {
    // 0.0–0.6 s: the Sun alone; then the plates converge; the light gutters out through the last gaps.
    const close = clamp((t - 0.5) / Math.max(1.2, dur - 1.4));
    const leak = 1 - Math.pow(close, 1.6);
    const z = interpolate(progress, [0, 1], [1.12, 1], {easing: ease});
    return (
      <AbsoluteFill style={{background: '#000'}}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
          <g transform={`translate(960,540) scale(${z}) translate(-960,-540)`}>
            {starfield}
            <Sun cx={960} cy={540} r={330} frame={frame} bright={0.25 + 0.75 * leak} />
            <Shell cx={960} cy={540} r={348} close={close} spin={frame * 0.002} seam={0.25 + 0.6 * (1 - leak)} frame={frame} />
            {/* light bleeding through the gaps */}
            <circle cx={960} cy={540} r={420} fill="#FFB13B" opacity={0.35 * leak * leak} style={{mixBlendMode: 'screen'}} />
          </g>
          <Vignette amount={0.6} />
        </svg>
      </AbsoluteFill>
    );
  }

  if (v === 'race' || v === 'raceEarth' || v === 'raceNear') {
    // The last light: a bright shell of light expanding from the sealed Sun with darkness behind it.
    if (v === 'race') {
      const front = interpolate(progress, [0, 1], [300, 1500], {easing: ease});
      const thick = 260;
      return (
        <AbsoluteFill style={{background: '#000'}}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
            {starfield}
            <defs>
              <radialGradient id="front" cx={200} cy={540} r={front} gradientUnits="userSpaceOnUse">
                <stop offset={clamp((front - thick) / front)} stopColor="#FFD27A" stopOpacity={0} />
                <stop offset={clamp((front - 30) / front)} stopColor="#FFE9B0" stopOpacity={0.35} />
                <stop offset="1" stopColor="#FFFBE8" stopOpacity={0.85} />
              </radialGradient>
            </defs>
            <circle cx={200} cy={540} r={front} fill="url(#front)" style={{mixBlendMode: 'screen'}} />
            <Shell cx={200} cy={540} r={120} close={1} spin={frame * 0.004} seam={0.5} frame={frame} n={120} />
            {/* Earth, tiny, lit from the left */}
            <g transform="translate(1700,540)">
              <circle r={26} fill="#1D5FA8" />
              <path d="M-26,0 A26,26 0 0 1 26,0 A26,26 0 0 1 -26,0" fill="#3E8E6A" opacity={0.35} />
              <path d="M0,-26 A26,26 0 0 0 0,26 A26,26 0 0 1 0,-26" fill="#000" opacity={0.75} />
              <circle r={34} fill="none" stroke="#6FB8FF" strokeWidth={3} opacity={0.5} />
            </g>
          </svg>
        </AbsoluteFill>
      );
    }
    if (v === 'raceEarth') {
      // ride the light: Earth grows from a dot to a planet
      const size = interpolate(progress, [0, 1], [90, 620], {easing: Easing.in(Easing.cubic)});
      return (
        <AbsoluteFill style={{background: '#000'}}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{position: 'absolute'}}>
            <Stars frame={frame} count={500} w={W} h={H} seed={52} maxR={2} drift={[-0.4, 0]} />
            {Array.from({length: 40}, (_, i) => {
              const y = (i * 137) % H;
              const x = ((i * 311 + frame * 40) % (W + 600)) - 300;
              return <path key={i} d={`M${x},${y} l${-300},0`} stroke="#FFE9B0" strokeWidth={2} opacity={0.25} />;
            })}
          </svg>
          <div style={{position: 'absolute', left: 1300 - size / 2, top: 540 - size / 2, filter: 'drop-shadow(0 0 30px rgba(111,184,255,0.55))'}}>
            <PhotoGlobe size={size} center={[10 - frame * 0.05, 30]} sun={[-50, 18]} />
          </div>
        </AbsoluteFill>
      );
    }
    // raceNear: the trailing edge sweeps past the Moon, then Earth's day side goes dark at once
    const edge = interpolate(progress, [0, 0.85], [-200, 1500], {extrapolateRight: 'clamp'});
    const moonDark = edge > 380 ? 1 : 0;
    const earthDim = clamp((edge - 760) / 60);
    return (
      <AbsoluteFill style={{background: '#000'}}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{position: 'absolute'}}>
          {starfield}
          {/* the lit region ahead of the edge */}
          <rect x={edge} y={0} width={W} height={H} fill="#FFF3D0" opacity={0.06} />
          <path d={`M${edge},0 L${edge},${H}`} stroke="#FFF3D0" strokeWidth={6} opacity={0.5} />
          <rect x={edge - 40} y={0} width={40} height={H} fill="#FFF3D0" opacity={0.12} />
          {/* the Moon */}
          <g transform="translate(380,300)">
            <circle r={60} fill={moonDark ? '#16181E' : '#D8D4CC'} />
            {!moonDark && <circle cx={-14} cy={-10} r={12} fill="#B8B4AC" />}
            {!moonDark && <circle cx={18} cy={20} r={9} fill="#B8B4AC" />}
            {!moonDark && <path d="M0,-60 A60,60 0 0 0 0,60 A40,60 0 0 1 0,-60" fill="#000" opacity={0.65} />}
          </g>
        </svg>
        <div style={{position: 'absolute', left: 1180 - 330, top: 560 - 330, filter: earthDim < 1 ? 'drop-shadow(0 0 40px rgba(111,184,255,0.5))' : 'drop-shadow(0 0 20px rgba(60,90,160,0.4))'}}>
          <PhotoGlobe size={660} center={[0, 35]} sun={[-35, 20]} dim={earthDim} />
        </div>
      </AbsoluteFill>
    );
  }

  if (v === 'shellGlimpse') {
    const z = interpolate(progress, [0, 1], [3.6, 3.2]);
    return (
      <AbsoluteFill style={{background: '#000'}}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
          {starfield}
          <g transform={`translate(960,540) scale(${z}) translate(-1400,-260)`}>
            <Shell cx={960} cy={540} r={480} close={1} spin={frame * 0.0015 + 1} seam={0.6} frame={frame} />
          </g>
          <rect x={0} y={0} width={W} height={H} fill="#FF4A1A" opacity={0.05} style={{mixBlendMode: 'screen'}} />
          <Vignette amount={0.8} />
        </svg>
      </AbsoluteFill>
    );
  }

  if (v === 'shellReveal' || v === 'shellOrbit' || v === 'beam' || v === 'flicker' || v === 'signal') {
    const reveal = v === 'shellReveal';
    const z = reveal ? interpolate(progress, [0, 1], [5, 1.05], {easing: ease}) : v === 'beam' ? 0.55 : v === 'flicker' ? interpolate(progress, [0, 1], [1.5, 1.7]) : 1.1;
    const cx = v === 'beam' ? 560 : 960;
    const open = v === 'flicker' ? clamp((t - 0.6) / 0.5) : 0;
    const spin = frame * (v === 'shellOrbit' ? 0.01 : 0.003);
    return (
      <AbsoluteFill style={{background: '#000'}}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
          {starfield}
          <g transform={`translate(960,540) scale(${z}) translate(${-cx},-540)`}>
            {/* faint corona leaking round the rim */}
            <circle cx={cx} cy={540} r={430} fill="none" stroke="#FF7A2A" strokeWidth={30} opacity={0.12} filter="blur(10px)" />
            <Shell cx={cx} cy={540} r={380} close={1} spin={spin} seam={0.5 + 0.15 * Math.sin(frame * 0.05)} frame={frame} open={open} />
            {v === 'flicker' && open > 0 && (
              <g style={{mixBlendMode: 'screen'}}>
                {Array.from({length: 9}, (_, i) => {
                  const a = -0.5 + i * 0.12;
                  return <path key={i} d={`M${cx + 60},${400} L${cx + 60 + Math.cos(a) * 2200},${400 + Math.sin(a) * 2200}`} stroke="#FFF3C2" strokeWidth={6 + (i % 3) * 6} opacity={0.45 * open} />;
                })}
                <circle cx={cx + 60} cy={400} r={60 * open} fill="#FFFBE8" />
              </g>
            )}
            {v === 'beam' && (
              <g style={{mixBlendMode: 'screen'}}>
                <path d={`M${cx + 380},${520} L${cx + 380 + 3600},${-1400}`} stroke="#FFD27A" strokeWidth={10} opacity={0.9} />
                <path d={`M${cx + 380},${520} L${cx + 380 + 3600},${-1400}`} stroke="#FFB13B" strokeWidth={60} opacity={0.18} />
                {Array.from({length: 40}, (_, i) => {
                  const u = ((i * 0.071 + frame * 0.004) % 1) * 3400;
                  return <circle key={i} cx={cx + 380 + u * 0.88} cy={520 - u * 0.47 + Math.sin(i * 7) * 14} r={3} fill="#FFE9B0" opacity={0.7} />;
                })}
              </g>
            )}
            {v === 'signal' &&
              Array.from({length: 5}, (_, i) => {
                const rr = 400 + (((frame * 6 + i * 260) % 1300) as number);
                return <circle key={i} cx={cx} cy={540} r={rr} fill="none" stroke="#7FE8FF" strokeWidth={6} opacity={0.5 * (1 - (rr - 400) / 1300)} />;
              })}
          </g>
          {v === 'beam' && <circle cx={1840} cy={90} r={5} fill="#E8F0FF" />}
          {v === 'shellOrbit' && (
            <g transform="translate(1600,860)">
              {/* Earth to scale against one plate */}
              <circle r={6} fill="#4A8BD8" />
              <circle r={10} fill="none" stroke="#6FB8FF" strokeWidth={2} opacity={0.6} />
            </g>
          )}
          <Vignette amount={0.65} />
        </svg>
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill style={{background: '#000'}} />;
};

/** Earth from orbit after the event: night everywhere, lights, spreading ice, heat bleeding into space. */
const GlobeScene: React.FC = () => {
  const c = useSetCtx();
  const v = c.v;
  const day = (c.p.day as number) ?? 0;
  const ice = day >= 7 ? 62 : 78;
  const lights = v === 'lights' ? 1 : 0.9;
  const z = interpolate(c.t / c.dur, [0, 1], [1, 1.08]);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{position: 'absolute'}}>
        <Stars frame={c.frame} count={600} w={1920} h={1080} seed={58} maxR={2} />
        {v === 'radiate' &&
          Array.from({length: 4}, (_, i) => {
            const rr = 400 + ((c.frame * 2 + i * 90) % 360);
            return <circle key={i} cx={960} cy={560} r={rr} fill="none" stroke="#FF5A3A" strokeWidth={22} opacity={0.12 * (1 - (rr - 400) / 360)} filter="blur(8px)" />;
          })}
      </svg>
      <div style={{position: 'absolute', left: 960 - 400 * z, top: 560 - 400 * z, filter: 'drop-shadow(0 0 30px rgba(80,120,220,0.45))'}}>
        <PhotoGlobe size={800 * z} center={[10 + c.frame * 0.06, 42]} sun={null} lights={lights} ice={ice} />
      </div>
    </AbsoluteFill>
  );
};

export {Space, GlobeScene, Shell, Sun};
