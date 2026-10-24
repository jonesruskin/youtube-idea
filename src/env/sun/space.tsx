import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Stars, rand} from '../../fx/sky';
import {PhotoGlobe} from '../../fx/PhotoGlobe';
import {useSetCtx, Vignette} from './stage';

/**
 * Space: the Sun, the shell that closes around it, the last light racing to Earth, the beam and the signal.
 * The shell is a sphere of slats at ~2 solar radii that turn from edge-on (open) to face-on (closed), with
 * seams that glow faintly with waste heat — the one thing the family can later detect.
 */
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

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
 * The shell, as the physics allows it: a swarm of thin slats (micrometre-thin sheets, each still wider than
 * Earth) orbiting at ~2 solar radii in latitude bands. For a century they have sat edge-on to the Sun, like the
 * slats of an open Venetian blind: light streams between them and from outside they read as faint radial lines
 * in the corona. `turn` rotates every slat about its long axis: 0 = edge-on (open), 1 = face-on (closed, a dark
 * sphere). `wave` staggers the turn from the top band down; `door` (0–1) turns one front slat back open — the
 * one-second Sun. `inner` is drawn between the back and front halves (the Sun inside).
 */
type Slat = {lat: number; lon: number; dl: number; band: number; i: number; h: number};
const BANDS = 22;
const useSlats = () =>
  useMemo(() => {
    const out: Slat[] = [];
    const r = rand(23);
    for (let b = 0; b < BANDS; b++) {
      const lat = -Math.PI / 2 + ((b + 0.5) * Math.PI) / BANDS;
      const n = Math.max(6, Math.round((2 * Math.PI * Math.cos(lat)) / (Math.PI / BANDS) / 2.2));
      for (let k = 0; k < n; k++) out.push({lat, lon: ((k + (b % 2) * 0.5) * 2 * Math.PI) / n, dl: (2 * Math.PI) / n, band: b, i: out.length, h: r()});
    }
    return out;
  }, []);

type V3 = [number, number, number];
/** The slat the one-second door opens: front, upper right of the disc. */
const DOOR = {lat: 0.42, lon: 0.38};
/** Screen position of a point on the shell (unit-sphere coords) for a given view. */
const project = (p: V3, cx: number, cy: number, R: number, spin: number, tilt: number): [number, number, number] => {
  const [x0, y0, z0] = p;
  const x1 = x0 * Math.cos(spin) + z0 * Math.sin(spin);
  const z1 = -x0 * Math.sin(spin) + z0 * Math.cos(spin);
  const y2 = y0 * Math.cos(tilt) - z1 * Math.sin(tilt);
  const z2 = y0 * Math.sin(tilt) + z1 * Math.cos(tilt);
  return [cx + x1 * R, cy - y2 * R, z2];
};
const onSphere = (lat: number, lon: number): V3 => [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
const doorScreen = (cx: number, cy: number, R: number, spin: number, tilt: number) => project(onSphere(DOOR.lat, DOOR.lon - spin), cx, cy, R, spin, tilt);

const Shell: React.FC<{cx: number; cy: number; r: number; turn: number; spin: number; tilt?: number; wave?: number; seam?: number; frame: number; door?: number; inner?: React.ReactNode}> = ({cx, cy, r, turn, spin, tilt = 0.22, wave = 0, seam = 0.35, frame, door = 0, inner}) => {
  const slats = useSlats();
  const hw = (Math.PI / BANDS / 2) * 1.12; // half-width: closed slats overlap a little
  const doorTarget = onSphere(DOOR.lat, DOOR.lon - spin);
  let doorIdx = -1;
  if (door > 0) {
    let best = 9;
    for (const s of slats) {
      const p = onSphere(s.lat, s.lon);
      const d = Math.hypot(p[0] - doorTarget[0], p[1] - doorTarget[1], p[2] - doorTarget[2]);
      if (d < best) {
        best = d;
        doorIdx = s.i;
      }
    }
  }
  const quads = slats.map((s) => {
    const u = s.band / (BANDS - 1) * 0.85 + s.h * 0.15;
    const local = wave > 0 ? Math.max(0, Math.min(1, (turn - wave * (1 - u)) / (1 - wave))) : turn;
    const k = s.i === doorIdx ? local * (1 - door) : local;
    const th = (Math.min(1, Math.max(0, k)) * Math.PI) / 2;
    const P = onSphere(s.lat, s.lon);
    const e: V3 = [Math.cos(s.lon), 0, -Math.sin(s.lon)];
    const n: V3 = [-Math.sin(s.lat) * Math.sin(s.lon), Math.cos(s.lat), -Math.sin(s.lat) * Math.cos(s.lon)];
    const d: V3 = [P[0] * Math.cos(th) + n[0] * Math.sin(th), P[1] * Math.cos(th) + n[1] * Math.sin(th), P[2] * Math.cos(th) + n[2] * Math.sin(th)];
    const hl = Math.cos(s.lat) * (s.dl / 2) * 1.04;
    const w = hw * (0.4 + 0.6 * Math.sin(th)); // edge-on they read as fine lines; face-on they tile the sphere
    const corners = ([[1, 1], [1, -1], [-1, -1], [-1, 1]] as const).map(([a, b]) => project([P[0] + a * hl * e[0] + b * w * d[0], P[1] + a * hl * e[1] + b * w * d[1], P[2] + a * hl * e[2] + b * w * d[2]], cx, cy, r, spin, tilt));
    const z = corners.reduce((acc, q) => acc + q[2], 0) / 4;
    return {s, k: Math.min(1, Math.max(0, k)), corners, z};
  });
  const avg = quads.reduce((a, q) => a + q.k, 0) / quads.length;
  const draw = (q: (typeof quads)[number]) => {
    const pts = q.corners.map((c) => `${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ');
    const open = 1 - q.k;
    const shade = 0.25 + 0.45 * Math.max(0, q.z);
    // open: thin sheets catching sunlight on their edges; closed: dark outer faces with warm seams
    const fill = `rgb(${Math.round(10 + shade * 26 + open * 150)},${Math.round(11 + shade * 26 + open * 110)},${Math.round(16 + shade * 32 + open * 40)})`;
    const edge = open > 0.5 ? `rgba(255,236,190,${0.1 + 0.32 * open})` : `rgba(255,${Math.round(120 + 60 * seam)},60,${(0.18 + seam * 0.5) * (1 - open)})`;
    return <polygon key={q.s.i} points={pts} fill={fill} fillOpacity={0.05 + 0.95 * Math.pow(q.k, 0.8)} stroke={edge} strokeWidth={Math.max(1, r * (0.0018 + 0.0047 * q.k))} strokeLinejoin="round" />;
  };
  const back = quads.filter((q) => q.z < 0).sort((a, b) => a.z - b.z);
  const front = quads.filter((q) => q.z >= 0).sort((a, b) => a.z - b.z);
  return (
    <g>
      {back.map(draw)}
      {inner}
      {/* the hot interior glimpsed through the seams once it is shut */}
      {avg > 0.6 && (
        <g>
          <defs>
            <radialGradient id="shellHeat">
              <stop offset="0" stopColor="#9A3A10" />
              <stop offset="0.8" stopColor="#5A1A08" />
              <stop offset="1" stopColor="#2A0A04" />
            </radialGradient>
          </defs>
          <circle cx={cx} cy={cy} r={r * 0.99} fill="url(#shellHeat)" opacity={Math.min(1, (avg - 0.6) * 2.5) * (0.35 + seam * 0.5)} />
        </g>
      )}
      {front.map(draw)}
      {door > 0 && doorIdx >= 0 && (() => {
        const [dx, dy] = doorScreen(cx, cy, r, spin, tilt);
        return <circle cx={dx} cy={dy} r={r * 0.06 * door} fill="#FFFBE8" opacity={0.9 * door} style={{mixBlendMode: 'screen'}} />;
      })()}
    </g>
  );
};

/** The planets' orbits: one flat plane seen almost edge-on (tilted 6°), drawn in two halves around the shell. */
const Orbits: React.FC<{cx: number; frame: number; half: 'back' | 'front'}> = ({cx, frame, half}) => (
  <g transform={`rotate(-6,${cx},540)`} fill="none">
    {[700, 1000, 1380, 1800].map((rx, i) => {
      const ry = rx * 0.16;
      const a = frame * 0.004 * (4 - i) + i * 2;
      const py = 540 + Math.sin(a) * ry;
      const arc = half === 'back' ? `M${cx - rx},540 A${rx},${ry} 0 0 1 ${cx + rx},540` : `M${cx + rx},540 A${rx},${ry} 0 0 1 ${cx - rx},540`;
      return (
        <g key={rx}>
          <path d={arc} stroke={i === 2 ? '#6FB8FF' : '#8A93B8'} strokeWidth={i === 2 ? 5 : 3} opacity={i === 2 ? 0.7 : 0.4} />
          {(half === 'front') === py >= 540 && <circle cx={cx + Math.cos(a) * rx} cy={py} r={i === 2 ? 14 : 9} fill={['#B8A89A', '#E8C27A', '#4A8BD8', '#D2694A'][i]} />}
        </g>
      );
    })}
  </g>
);

const Space: React.FC = () => {
  const c = useSetCtx();
  const {frame, t, dur, progress} = {frame: c.frame, t: c.t, dur: c.dur, progress: c.t / c.dur};
  const v = c.v;
  const W = 1920;
  const H = 1080;
  const starfield = <Stars frame={frame} count={700} w={W} h={H} seed={51} maxR={2.2} />;

  if (v === 'close') {
    // The Sun inside its open blind: a fine lattice of edge-on slats at twice its radius, glinting like
    // dandelion seeds. Then every slat turns face-on, a wave rolling down from the north; the light strobes
    // through the closing gaps and goes out. Nothing travels: each slat only rotates in place.
    const turn = clamp((t - 0.9) / Math.max(1.4, dur - 1.7));
    const leak = 1 - Math.pow(turn, 1.4);
    const z = interpolate(progress, [0, 1], [1.1, 0.97], {easing: ease});
    const strobe = turn > 0.05 && turn < 0.95 ? 0.5 + 0.5 * Math.sin(frame * 1.7) * Math.sin(frame * 0.63) : 0;
    return (
      <AbsoluteFill style={{background: '#000'}}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
          <g transform={`translate(960,540) scale(${z}) translate(-960,-540)`}>
            {starfield}
            <defs>
              <radialGradient id="haloOut">
                <stop offset="0" stopColor="#FFB13B" stopOpacity={0.5} />
                <stop offset="0.6" stopColor="#FF9E3A" stopOpacity={0.18} />
                <stop offset="1" stopColor="#FF7A1A" stopOpacity={0} />
              </radialGradient>
            </defs>
            <circle cx={960} cy={540} r={760} fill="url(#haloOut)" opacity={leak} style={{mixBlendMode: 'screen'}} />
            <Shell
              cx={960}
              cy={540}
              r={490}
              turn={turn}
              wave={0.55}
              spin={0.35 + frame * 0.0012}
              seam={0.25 + 0.6 * (1 - leak)}
              frame={frame}
              inner={<Sun cx={960} cy={540} r={245} frame={frame} bright={0.3 + 0.7 * leak} />}
            />
            {/* light strobing through the closing gaps */}
            <circle cx={960} cy={540} r={520} fill="#FFB13B" opacity={(0.12 + 0.18 * strobe) * leak} style={{mixBlendMode: 'screen'}} />
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
            <Shell cx={200} cy={540} r={120} turn={1} spin={frame * 0.004} seam={0.5} frame={frame} />
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
            <Shell cx={960} cy={540} r={480} turn={1} spin={frame * 0.0015 + 1} seam={0.6} frame={frame} />
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
            {v === 'beam' && <Orbits cx={cx} frame={frame} half="back" />}
            <Shell cx={cx} cy={540} r={380} turn={1} spin={spin} seam={0.5 + 0.15 * Math.sin(frame * 0.05)} frame={frame} door={open} />
            {v === 'beam' && <Orbits cx={cx} frame={frame} half="front" />}
            {v === 'flicker' && open > 0 && (() => {
              const [dx, dy] = doorScreen(cx, 540, 380, spin, 0.22);
              return (
                <g style={{mixBlendMode: 'screen'}}>
                  {Array.from({length: 9}, (_, i) => {
                    const a = -0.85 + i * 0.12;
                    return <path key={i} d={`M${dx},${dy} L${dx + Math.cos(a) * 2200},${dy + Math.sin(a) * 2200}`} stroke="#FFF3C2" strokeWidth={6 + (i % 3) * 6} opacity={0.45 * open} />;
                  })}
                  <circle cx={dx} cy={dy} r={60 * open} fill="#FFFBE8" />
                </g>
              );
            })()}
            {v === 'beam' && (
              <g style={{mixBlendMode: 'screen'}} transform={`rotate(-6,${cx},540)`}>
                {/* the beam leaves from the pole, straight out of the planets' plane: it can never hit one */}
                <path d={`M${cx},${160} L${cx},${-2400}`} stroke="#FFD27A" strokeWidth={10} opacity={0.9} />
                <path d={`M${cx},${160} L${cx},${-2400}`} stroke="#FFB13B" strokeWidth={60} opacity={0.18} />
                {Array.from({length: 40}, (_, i) => {
                  const u = ((i * 0.071 + frame * 0.004) % 1) * 2500;
                  return <circle key={i} cx={cx + Math.sin(i * 7) * 12} cy={150 - u} r={3} fill="#FFE9B0" opacity={0.7} />;
                })}
              </g>
            )}
            {v === 'signal' &&
              Array.from({length: 5}, (_, i) => {
                const rr = 400 + (((frame * 6 + i * 260) % 1300) as number);
                return <circle key={i} cx={cx} cy={540} r={rr} fill="none" stroke="#7FE8FF" strokeWidth={6} opacity={0.5 * (1 - (rr - 400) / 1300)} />;
              })}
          </g>
          {v === 'beam' && <circle cx={908} cy={46} r={5} fill="#E8F0FF" />}
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

export {Space, GlobeScene, Shell, Sun, doorScreen};
