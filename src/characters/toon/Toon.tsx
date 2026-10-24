import React, {useId} from 'react';
import {C} from '../../theme';
import {type ToonDesign, HERO_PX, type Outfit} from './design';
import type {Face} from './face';
import type {Limb, Pose} from './poses';
import {HeldProp, type PropKind} from './props';

/** Everything needed to draw one character on one frame (resolved by acting.ts). */
export type ToonState = {
  x: number;
  y: number; // ground line
  /** Depth scale: 1 = hero is 300 px tall. Characters never get their own scale. */
  scale: number;
  facing: 'right' | 'left' | 'front' | 'back';
  pose: Pose;
  bob: number;
  face: Face;
  /** Head turn −1..1 (features slide toward where they look). */
  turn: number;
  look: [number, number];
  talk: number; // 0..1 mouth open from lip-sync
  blink: number; // 0..1
  outfit: Outfit;
  hoodUp: boolean;
  hold?: PropKind;
  holdL?: PropKind;
  breath: number; // 0..1 cold-breath puff phase visibility
  frame: number;
  rim: boolean;
  opacity: number;
  watchGlow: number;
};

const rad = (d: number) => (d * Math.PI) / 180;
const seg = (x: number, y: number, len: number, deg: number): [number, number] => [x + Math.sin(rad(deg)) * len, y + Math.cos(rad(deg)) * len];

export const Toon: React.FC<{d: ToonDesign; s: ToonState}> = ({d, s}) => {
  const id = useId().replace(/:/g, '');
  const ink = C.ink;
  const H = HERO_PX * d.height;
  const R = H * d.head; // head radius
  const bodyH = H - 1.9 * R;
  const legLen = bodyH * (d.elder ? 0.5 : 0.52);
  const torsoH = bodyH - legLen;
  const thigh = legLen * 0.5;
  const shin = legLen * 0.5;
  // big-headed kids get proportionally longer arms so a raised hand clears the head
  const upper = Math.max(torsoH * 0.62, R * 0.66);
  const fore = Math.max(torsoH * 0.58, R * 0.6);
  const [top, topAcc, legs, shoes] = d.outfits[s.outfit] ?? d.outfits.home ?? d.outfits.cold!;
  const cold = s.outfit !== 'home';
  const bw = R * (cold ? 1.22 : 1.05) * d.build; // torso width
  const side = s.facing === 'right' || s.facing === 'left';
  const back = s.facing === 'back';
  const sw = Math.max(3, R * 0.07); // outline weight

  // crouch bends the knees and lowers the hips
  const p = s.pose;
  const nearRaised = Math.abs(p.rArm[0]) > 100;
  const legC = (l: Limb): Limb => [l[0] + p.crouch * 55, l[1] - p.crouch * 115];
  const lL = legC(p.lLeg);
  const rL = legC(p.rLeg);
  const vert = (l: Limb) => thigh * Math.cos(rad(l[0])) + shin * Math.cos(rad(l[0] + l[1]));
  const hipY = -Math.max(vert(lL), vert(rL), legLen * 0.18) + (d.elder ? 2 : 0) + s.bob * (R / 60);
  const shY = hipY - torsoH * (cold ? 0.98 : 1);
  const headY = shY - R * 0.78;
  const hipX = side ? bw * 0.08 : bw * 0.24;
  const shX = side ? bw * 0.12 : bw * 0.42;

  const limbPath = (x0: number, y0: number, l: Limb, a: number, b: number) => {
    const [ex, ey] = seg(x0, y0, a, l[0]);
    const [hx, hy] = seg(ex, ey, b, l[0] + l[1]);
    // quadratic through the elbow/knee: smooth "rubber-hose" bend, never a hinge
    const cx = 2 * ex - (x0 + hx) / 2;
    const cy = 2 * ey - (y0 + hy) / 2;
    return {d: `M${x0},${y0} Q${cx},${cy} ${hx},${hy}`, hx, hy, ex, ey};
  };
  const legW = R * 0.22 * Math.max(0.85, d.build);
  const armW = R * 0.19 * Math.max(0.85, d.build);
  const LL = limbPath(-hipX, hipY, lL, thigh, shin);
  const RL = limbPath(hipX, hipY, rL, thigh, shin);
  const LA = limbPath(side ? -shX * 0.3 : -shX, shY + R * 0.12, p.lArm, upper, fore);
  const RA = limbPath(shX, shY + R * 0.12, p.rArm, upper, fore);

  const Stroke: React.FC<{dd: string; w: number; color: string}> = ({dd, w, color}) => (
    <>
      <path d={dd} stroke={ink} strokeWidth={w + sw * 2} fill="none" strokeLinecap="round" />
      <path d={dd} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" />
    </>
  );
  const shoe = (fx: number, fy: number, k: number) => (
    <ellipse key={k} cx={fx + (side ? R * 0.1 : 0)} cy={fy + R * 0.02} rx={R * (side ? 0.26 : 0.2)} ry={R * 0.12} fill={shoes} stroke={ink} strokeWidth={sw * 0.8} />
  );
  const hand = (hx: number, hy: number, k: string) => (
    <g key={k}>
      <circle cx={hx} cy={hy} r={R * 0.15} fill={cold && d.id !== 'ito' ? topAcc : d.skin} stroke={ink} strokeWidth={sw * 0.8} />
      <circle cx={hx + R * 0.1} cy={hy - R * 0.05} r={R * 0.06} fill={cold && d.id !== 'ito' ? topAcc : d.skin} stroke={ink} strokeWidth={sw * 0.6} />
    </g>
  );

  // ── torso ───────────────────────────────────────────────────────────────
  const tw = bw / 2;
  const torso = `M${-tw},${shY + R * 0.25} Q${-tw},${shY} ${-tw + R * 0.3},${shY} L${tw - R * 0.3},${shY} Q${tw},${shY} ${tw},${shY + R * 0.25} L${tw * 0.92},${hipY + R * 0.1} Q${tw * 0.92},${hipY + R * 0.28} ${tw * 0.7},${hipY + R * 0.28} L${-tw * 0.7},${hipY + R * 0.28} Q${-tw * 0.92},${hipY + R * 0.28} ${-tw * 0.92},${hipY + R * 0.1} Z`;

  // ── face ────────────────────────────────────────────────────────────────
  const f = s.face;
  const turn = back ? 0 : side ? (s.facing === 'right' ? 0.55 : 0.55) + s.turn * 0.3 : s.turn;
  const fx = turn * R * 0.34;
  const eyeY = headY + R * 0.04;
  const eyeSep = R * 0.36;
  const eye = (k: -1 | 1) => {
    const far = (k === -1 && turn > 0.2) || (k === 1 && turn < -0.2);
    const ex = fx + k * eyeSep * (1 - Math.abs(turn) * 0.25);
    const rx = R * 0.21 * f.eye * (far ? 0.82 : 1);
    const ry = R * 0.27 * f.eye;
    const lid = Math.min(1, f.lid + s.blink);
    if (f.happyEyes > 0.5 || lid > 0.9) {
      const up = f.happyEyes > 0.5 ? -1 : 1;
      return <path key={k} d={`M${ex - rx},${eyeY} Q${ex},${eyeY + up * ry * 0.9} ${ex + rx},${eyeY}`} stroke={ink} strokeWidth={sw} fill="none" strokeLinecap="round" />;
    }
    const px = ex + s.look[0] * rx * 0.42 + turn * rx * 0.2;
    const py = eyeY + s.look[1] * ry * 0.35;
    const pr = rx * 0.52 * f.pupil;
    return (
      <g key={k}>
        <ellipse cx={ex} cy={eyeY} rx={rx} ry={ry} fill="#FFFFFF" stroke={ink} strokeWidth={sw * 0.85} />
        <circle cx={px} cy={py} r={pr} fill="#1A1424" />
        <circle cx={px + pr * 0.35} cy={py - pr * 0.4} r={pr * 0.32} fill="#FFFFFF" />
        <circle cx={px - pr * 0.3} cy={py + pr * 0.35} r={pr * 0.14} fill="#FFFFFF" opacity={0.8} />
        {lid > 0.02 && (
          <g>
            <clipPath id={`e${id}${k}`}>
              <ellipse cx={ex} cy={eyeY} rx={rx * 1.04} ry={ry * 1.04} />
            </clipPath>
            <g clipPath={`url(#e${id}${k})`}>
              <rect x={ex - rx * 1.2} y={eyeY - ry * 1.2} width={rx * 2.4} height={ry * 0.2 + 2 * ry * lid} fill={d.skin} />
              <path d={`M${ex - rx * 1.2},${eyeY - ry + 2 * ry * lid} Q${ex},${eyeY - ry + 2 * ry * lid + ry * 0.18} ${ex + rx * 1.2},${eyeY - ry + 2 * ry * lid}`} stroke={ink} strokeWidth={sw * 0.8} fill="none" />
            </g>
            <ellipse cx={ex} cy={eyeY} rx={rx} ry={ry} fill="none" stroke={ink} strokeWidth={sw * 0.85} />
          </g>
        )}
      </g>
    );
  };
  const brow = (k: -1 | 1) => {
    const bx = fx + k * eyeSep * (1 - Math.abs(turn) * 0.25);
    const by = eyeY - R * 0.5 - f.browY * (R / 60);
    const inner = bx - k * R * 0.14;
    const outer = bx + k * R * 0.16;
    const lift = Math.tan(rad(f.browAng)) * R * 0.75;
    return <path key={`b${k}`} d={`M${inner},${by - lift} Q${bx},${by - R * 0.09 - lift * 0.4} ${outer},${by + R * 0.03}`} stroke={d.hair === 'bald' || d.hairColor === '#E8E8EE' ? '#B8B8C0' : ink} strokeWidth={sw * 1.15} fill="none" strokeLinecap="round" />;
  };
  const mouthY = headY + R * 0.5;
  const mouth = (() => {
    const w = R * 0.52 * f.mouthW * (1 - Math.abs(turn) * 0.2);
    const open = Math.max(f.open, s.talk);
    const mx = fx * 1.05;
    if (open > 0.08) {
      const h = R * 0.4 * open;
      const rw = w * (1 - f.round * 0.55) * (0.75 + s.talk * 0.25);
      const lift = f.smile * R * 0.06;
      if (f.smile < -0.1) {
        // fear / dismay: corners down, the top lip arches up — never reads as a grin
        const dn = -f.smile * R * 0.1;
        return (
          <g>
            <path d={`M${mx - rw},${mouthY + dn} Q${mx},${mouthY - h * 0.95} ${mx + rw},${mouthY + dn} Q${mx},${mouthY + h * 0.8} ${mx - rw},${mouthY + dn} Z`} fill="#4A1C22" stroke={ink} strokeWidth={sw * 0.8} strokeLinejoin="round" />
            {open > 0.35 && <ellipse cx={mx} cy={mouthY + h * 0.25} rx={rw * 0.4} ry={h * 0.18} fill="#D95F6A" />}
          </g>
        );
      }
      return (
        <g>
          <path d={`M${mx - rw},${mouthY - lift} Q${mx},${mouthY - h * 0.2 + lift * 0.5} ${mx + rw},${mouthY - lift} Q${mx + rw * 0.8},${mouthY + h} ${mx},${mouthY + h * 1.05} Q${mx - rw * 0.8},${mouthY + h} ${mx - rw},${mouthY - lift} Z`} fill="#4A1C22" stroke={ink} strokeWidth={sw * 0.8} strokeLinejoin="round" />
          {open > 0.35 && <ellipse cx={mx} cy={mouthY + h * 0.7} rx={rw * 0.5} ry={h * 0.28} fill="#D95F6A" />}
        </g>
      );
    }
    if (f.wobble > 0.5) return <path d={`M${mx - w},${mouthY + 2} q${w * 0.5},-6 ${w},0 t${w},0`} stroke={ink} strokeWidth={sw} fill="none" strokeLinecap="round" />;
    const c = f.smile * R * 0.16;
    return <path d={`M${mx - w},${mouthY - c * 0.3} Q${mx},${mouthY + c} ${mx + w},${mouthY - c * 0.3}`} stroke={ink} strokeWidth={sw} fill="none" strokeLinecap="round" />;
  })();

  // ── hair / hats ─────────────────────────────────────────────────────────
  const hc = d.hairColor;
  const hatOn = cold && (d.hair === 'pigtails' || d.hair === 'beanie');
  // ── the parka hood: an orange dome over the head that falls to the shoulders, a dark lining, a tufted fur
  // trim around the face and two drawstrings — so it reads as a hood at a glance, never as a halo
  const hoodUp = cold && s.hoodUp;
  const hoodOuter = `M${-R * 1.22},${headY + R * 0.95} Q${-R * 1.42},${headY - R * 0.2} ${-R * 0.9},${headY - R * 1.05} Q0,${headY - R * 1.6} ${R * 0.9},${headY - R * 1.05} Q${R * 1.42},${headY - R * 0.2} ${R * 1.22},${headY + R * 0.95} Q0,${headY + R * 1.25} ${-R * 1.22},${headY + R * 0.95} Z`;
  const ox = fx * 0.6; // the face opening follows the head turn
  const oy = headY + R * 0.12;
  const orx = R * 0.86;
  const ory = R * 0.92;
  const opening = `M${ox - orx},${oy} A${orx},${ory} 0 1 0 ${ox + orx},${oy} A${orx},${ory} 0 1 0 ${ox - orx},${oy} Z`;
  const hairBack = (() => {
    if (hoodUp) return <path d={hoodOuter} fill={top} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />;
    switch (d.hair) {
      case 'pigtails':
        return (
          <g>
            {[-1, 1].map((k) => (
              <g key={k}>
                <ellipse cx={k * R * 1.08} cy={headY + R * 0.25} rx={R * 0.28} ry={R * 0.42} fill={hc} stroke={ink} strokeWidth={sw * 0.8} transform={`rotate(${k * 18},${k * R * 1.08},${headY + R * 0.25})`} />
                <circle cx={k * R * 0.95} cy={headY - R * 0.12} r={R * 0.1} fill="#D9443A" />
              </g>
            ))}
          </g>
        );
      case 'afro':
        return <circle cx={0} cy={headY - R * 0.25} r={R * 1.3} fill={hc} stroke={ink} strokeWidth={sw} />;
      case 'long':
        return <path d={`M${-R * 1.05},${headY} Q${-R * 1.2},${headY + R * 1.4} ${-R * 0.6},${headY + R * 1.5} L${R * 0.6},${headY + R * 1.5} Q${R * 1.2},${headY + R * 1.4} ${R * 1.05},${headY} Z`} fill={hc} stroke={ink} strokeWidth={sw} />;
      case 'bun':
        return <circle cx={0} cy={headY - R * 1.12} r={R * 0.36} fill={hc} stroke={ink} strokeWidth={sw} />;
      case 'ponytail':
        return <ellipse cx={R * 0.9} cy={headY + R * 0.2} rx={R * 0.25} ry={R * 0.6} fill={hc} stroke={ink} strokeWidth={sw} transform={`rotate(-20,${R * 0.9},${headY + R * 0.2})`} />;
      default:
        return null;
    }
  })();
  const hoodFront = hoodUp && (
    <g>
      {/* the hood frame around the face (outer dome minus the face opening) */}
      <path d={`${hoodOuter} ${opening}`} fill={top} fillRule="evenodd" stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
      {/* dark lining just inside the opening */}
      <ellipse cx={ox} cy={oy} rx={orx} ry={ory} fill="none" stroke={topAcc} strokeWidth={R * 0.1} opacity={0.9} />
      {/* centre seam over the crown + a quilt line */}
      <path d={`M${ox * 0.4},${oy - ory - R * 0.02} Q${ox * 0.2},${headY - R * 1.2} 0,${headY - R * 1.3}`} stroke={topAcc} strokeWidth={sw} fill="none" />
      <path d={`M${-R * 1.25},${headY + R * 0.2} Q${-R * 1.1},${headY - R * 0.5} ${-R * 0.75},${headY - R * 0.98}`} stroke={topAcc} strokeWidth={sw * 0.8} fill="none" />
      <path d={`M${R * 1.25},${headY + R * 0.2} Q${R * 1.1},${headY - R * 0.5} ${R * 0.75},${headY - R * 0.98}`} stroke={topAcc} strokeWidth={sw * 0.8} fill="none" />
      {/* fur trim: one soft cream band with a fluffy, uneven edge (reads as fur, not beads) */}
      <ellipse cx={ox} cy={oy} rx={orx} ry={ory} fill="none" stroke={ink} strokeWidth={R * 0.24 + sw * 2} />
      {Array.from({length: 30}, (_, i) => {
        const a = (i / 30) * Math.PI * 2;
        const r = R * (0.12 + 0.03 * Math.sin(i * 3.1));
        return <circle key={`fo${i}`} cx={ox + Math.cos(a) * (orx + R * 0.06)} cy={oy + Math.sin(a) * (ory + R * 0.06)} r={r + sw * 0.8} fill={ink} />;
      })}
      <ellipse cx={ox} cy={oy} rx={orx} ry={ory} fill="none" stroke="#EFE3CC" strokeWidth={R * 0.24} />
      {Array.from({length: 30}, (_, i) => {
        const a = (i / 30) * Math.PI * 2;
        const r = R * (0.12 + 0.03 * Math.sin(i * 3.1));
        return <circle key={`fi${i}`} cx={ox + Math.cos(a) * (orx + R * 0.06)} cy={oy + Math.sin(a) * (ory + R * 0.06)} r={r} fill="#EFE3CC" />;
      })}
      {Array.from({length: 22}, (_, i) => {
        const a = (i / 22) * Math.PI * 2 + 0.1;
        return <path key={`fs${i}`} d={`M${ox + Math.cos(a) * (orx - R * 0.06)},${oy + Math.sin(a) * (ory - R * 0.06)} l${Math.cos(a) * R * 0.12},${Math.sin(a) * R * 0.12}`} stroke="#C9B795" strokeWidth={sw * 0.7} strokeLinecap="round" />;
      })}
      {/* drawstrings with toggles */}
      {[-1, 1].map((k) => (
        <g key={`ds${k}`}>
          <path d={`M${ox + k * R * 0.3},${oy + ory * 0.95} Q${ox + k * R * 0.36},${oy + ory + R * 0.35} ${ox + k * R * 0.28},${oy + ory + R * 0.62}`} stroke="#F3E8D4" strokeWidth={sw * 0.9} fill="none" strokeLinecap="round" />
          <rect x={ox + k * R * 0.28 - R * 0.06} y={oy + ory + R * 0.58} width={R * 0.12} height={R * 0.16} rx={R * 0.04} fill="#3A3442" stroke={ink} strokeWidth={sw * 0.5} />
        </g>
      ))}
    </g>
  );
  const hairFront = (() => {
    if (hoodUp) return null;
    if (hatOn || d.hair === 'beanie') {
      const hat = d.hat ?? '#C2464F';
      return (
        <g>
          <path d={`M${-R * 1.0},${headY - R * 0.5} Q${-R * 1.05},${headY - R * 1.32} 0,${headY - R * 1.3} Q${R * 1.05},${headY - R * 1.32} ${R * 1.0},${headY - R * 0.5} Z`} fill={hat} stroke={ink} strokeWidth={sw} />
          <path d={`M${-R * 1.04},${headY - R * 0.74} Q0,${headY - R * 0.9} ${R * 1.04},${headY - R * 0.74} L${R * 1.02},${headY - R * 0.52} Q0,${headY - R * 0.68} ${-R * 1.02},${headY - R * 0.52} Z`} fill={hat} stroke={ink} strokeWidth={sw * 0.9} />
          <circle cx={0} cy={headY - R * 1.32} r={R * 0.2} fill="#F4EFE6" stroke={ink} strokeWidth={sw * 0.8} />
        </g>
      );
    }
    switch (d.hair) {
      case 'tuft':
        return <path d={`M${-R * 0.95},${headY - R * 0.25} Q${-R * 0.9},${headY - R * 1.05} 0,${headY - R * 1.04} Q${R * 0.7},${headY - R * 1.1} ${R * 0.98},${headY - R * 0.3} Q${R * 0.55},${headY - R * 0.62} ${R * 0.15},${headY - R * 0.55} Q${-R * 0.2},${headY - R * 0.75} ${-R * 0.95},${headY - R * 0.25} Z M${-R * 0.1},${headY - R * 1.02} q${R * 0.15},${-R * 0.3} ${R * 0.35},${-R * 0.2} q-${R * 0.05},${R * 0.15} -${R * 0.1},${R * 0.25}`} fill={hc} stroke={ink} strokeWidth={sw * 0.9} strokeLinejoin="round" />;
      case 'pigtails':
        return <path d={`M${-R * 0.98},${headY - R * 0.1} Q${-R * 0.95},${headY - R * 1.08} 0,${headY - R * 1.05} Q${R * 0.95},${headY - R * 1.08} ${R * 0.98},${headY - R * 0.1} Q${R * 0.7},${headY - R * 0.6} ${R * 0.2},${headY - R * 0.5} L0,${headY - R * 0.62} L${-R * 0.25},${headY - R * 0.48} Q${-R * 0.7},${headY - R * 0.6} ${-R * 0.98},${headY - R * 0.1} Z`} fill={hc} stroke={ink} strokeWidth={sw * 0.9} />;
      case 'bald':
        return (
          <g>
            {[-1, 1].map((k) => (
              <path key={k} d={`M${k * R * 0.98},${headY + R * 0.1} q${k * R * 0.12},${-R * 0.35} ${-k * R * 0.05},${-R * 0.6}`} stroke={hc} strokeWidth={R * 0.2} fill="none" strokeLinecap="round" />
            ))}
          </g>
        );
      case 'cap':
        return (
          <g>
            <path d={`M${-R * 1.02},${headY - R * 0.3} Q${-R},${headY - R * 1.15} 0,${headY - R * 1.12} Q${R},${headY - R * 1.15} ${R * 1.02},${headY - R * 0.3} Z`} fill={d.hat} stroke={ink} strokeWidth={sw} />
            <path d={`M${R * 0.2},${headY - R * 0.32} L${R * 1.5},${headY - R * 0.24} L${R},${headY - R * 0.44} Z`} fill={d.hat} stroke={ink} strokeWidth={sw * 0.8} />
          </g>
        );
      case 'scarf':
        return <path d={`M${-R * 1.1},${headY + R * 0.4} Q${-R * 1.25},${headY - R * 1.3} 0,${headY - R * 1.25} Q${R * 1.25},${headY - R * 1.3} ${R * 1.1},${headY + R * 0.4} Q${R * 0.8},${headY - R * 0.6} 0,${headY - R * 0.62} Q${-R * 0.8},${headY - R * 0.6} ${-R * 1.1},${headY + R * 0.4} Z`} fill={d.hat} stroke={ink} strokeWidth={sw} />;
      case 'curly':
        return (
          <g>
            {Array.from({length: 7}, (_, i) => (
              <circle key={i} cx={-R * 0.85 + i * R * 0.28} cy={headY - R * 0.82 - Math.sin((i / 6) * Math.PI) * R * 0.22} r={R * 0.28} fill={hc} stroke={ink} strokeWidth={sw * 0.7} />
            ))}
          </g>
        );
      case 'buzz':
        return <path d={`M${-R * 0.97},${headY - R * 0.2} Q${-R * 0.95},${headY - R * 1.02} 0,${headY - R * 1.0} Q${R * 0.95},${headY - R * 1.02} ${R * 0.97},${headY - R * 0.2} Q0,${headY - R * 0.7} ${-R * 0.97},${headY - R * 0.2} Z`} fill={hc} opacity={0.85} />;
      case 'afro':
        return null;
      default:
        return <path d={`M${-R},${headY - R * 0.1} Q${-R},${headY - R * 1.1} 0,${headY - R * 1.08} Q${R},${headY - R * 1.1} ${R},${headY - R * 0.1} Q${R * 0.6},${headY - R * 0.7} 0,${headY - R * 0.66} Q${-R * 0.6},${headY - R * 0.7} ${-R},${headY - R * 0.1} Z`} fill={hc} stroke={ink} strokeWidth={sw * 0.9} />;
    }
  })();

  const flip = s.facing === 'left' ? -1 : 1;
  const rimF = s.rim ? `url(#rim${id})` : undefined;
  // back view: draw the back of the head instead of a face
  const backHead = back && (
    <g>
      {hoodUp ? (
        <g>
          <path d={hoodOuter} fill={top} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
          <path d={`M0,${headY - R * 1.3} Q${R * 0.08},${headY} 0,${headY + R * 1.1}`} stroke={topAcc} strokeWidth={sw} fill="none" />
        </g>
      ) : (
        <path d={`M${-R * 0.99},${headY + R * 0.2} Q${-R * 1.02},${headY - R * 1.08} 0,${headY - R * 1.06} Q${R * 1.02},${headY - R * 1.08} ${R * 0.99},${headY + R * 0.2} Q0,${headY + R * 0.55} ${-R * 0.99},${headY + R * 0.2} Z`} fill={d.hair === 'bald' ? d.skin : hc} stroke={ink} strokeWidth={sw * 0.9} />
      )}
      {hatOn && <path d={`M${-R * 1.04},${headY - R * 0.12} Q${-R * 1.05},${headY - R * 1.28} 0,${headY - R * 1.25} Q${R * 1.05},${headY - R * 1.28} ${R * 1.04},${headY - R * 0.12} Z`} fill={d.hat} stroke={ink} strokeWidth={sw} />}
    </g>
  );

  return (
    <g transform={`translate(${s.x},${s.y}) scale(${flip * s.scale},${s.scale})`} opacity={s.opacity}>
      {s.rim && (
        <defs>
          <filter id={`rim${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx={-2.5} dy={-2} stdDeviation={1} floodColor={d.rim} floodOpacity={0.9} />
          </filter>
        </defs>
      )}
      <ellipse cx={0} cy={2} rx={R * 0.9} ry={R * 0.16} fill="#000" opacity={0.22 * Math.min(1, 1 - p.crouch * 0.2)} />
      <g filter={rimF} transform={`rotate(${p.lean},0,${hipY})`}>
        {/* far arm (behind the body) */}
        <Stroke dd={LA.d} w={armW} color={top} />
        {hand(LA.hx, LA.hy, 'lh')}
        {s.holdL && <g transform={`translate(${LA.hx},${LA.hy})`}><HeldProp kind={s.holdL} R={R} frame={s.frame} /></g>}
        {/* legs */}
        <Stroke dd={LL.d} w={legW} color={legs} />
        <Stroke dd={RL.d} w={legW} color={legs} />
        {shoe(LL.hx, LL.hy, 0)}
        {shoe(RL.hx, RL.hy, 1)}
        {/* body */}
        <path d={torso} fill={top} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
        {cold && (
          <g>
            {[0.35, 0.68].map((t, i) => (
              <path key={i} d={`M${-tw * 0.92},${shY + (hipY - shY) * t} Q0,${shY + (hipY - shY) * t + R * 0.12} ${tw * 0.92},${shY + (hipY - shY) * t}`} stroke={topAcc} strokeWidth={sw} fill="none" />
            ))}
            {!back && <path d={`M${side ? tw * 0.35 : 0},${shY + R * 0.1} L${side ? tw * 0.35 : 0},${hipY + R * 0.25}`} stroke={topAcc} strokeWidth={sw} />}
            {!s.hoodUp && <path d={`M${-tw * 0.75},${shY + R * 0.05} Q0,${shY - R * 0.3} ${tw * 0.75},${shY + R * 0.05} Q0,${shY + R * 0.22} ${-tw * 0.75},${shY + R * 0.05} Z`} fill={d.id === 'ito' ? topAcc : '#F1E6D2'} stroke={ink} strokeWidth={sw * 0.8} />}
          </g>
        )}
        {!cold && d.id === 'ito' && !back && (
          <g>
            <path d={`M${-tw * 0.3},${shY} L0,${shY + torsoH * 0.5} L${tw * 0.3},${shY}`} fill="#F4EFE6" stroke={ink} strokeWidth={sw * 0.7} />
            {[0.55, 0.75].map((t) => <circle key={t} cx={0} cy={shY + torsoH * t} r={R * 0.05} fill={topAcc} />)}
          </g>
        )}
        {/* a raised near arm goes behind the head so it never crosses the face */}
        {nearRaised && <Stroke dd={RA.d} w={armW} color={top} />}
        {/* head */}
        <g transform={`rotate(${p.tilt + (side ? 0 : 0)},0,${shY})`}>
          {!back && hairBack}
          {!back && !hoodUp && <circle cx={-R * 0.98 + fx * 0.3} cy={headY + R * 0.1} r={R * 0.16} fill={d.skin} stroke={ink} strokeWidth={sw * 0.8} />}
          {!back && !hoodUp && <circle cx={R * 0.98 + fx * 0.3} cy={headY + R * 0.1} r={R * 0.16} fill={d.skin} stroke={ink} strokeWidth={sw * 0.8} />}
          <circle cx={0} cy={headY} r={R} fill={d.skin} stroke={ink} strokeWidth={sw} />
          {back ? (
            backHead
          ) : (
            <g>
              {hairFront}
              {f.blush > 0.05 && [-1, 1].map((k) => <ellipse key={k} cx={fx + k * R * 0.55} cy={headY + R * 0.35} rx={R * 0.16} ry={R * 0.09} fill="#E86A6A" opacity={f.blush * 0.45} />)}
              {eye(-1)}
              {eye(1)}
              {brow(-1)}
              {brow(1)}
              {d.glasses &&
                [-1, 1].map((k) => (
                  <circle key={`g${k}`} cx={fx + k * eyeSep * (1 - Math.abs(turn) * 0.25)} cy={eyeY} r={R * 0.3} fill="#FFFFFF18" stroke={ink} strokeWidth={sw * 0.8} />
                ))}
              {d.glasses && <path d={`M${fx - eyeSep * 0.45},${eyeY} L${fx + eyeSep * 0.45},${eyeY}`} stroke={ink} strokeWidth={sw * 0.7} />}
              <path d={`M${fx * 1.1 - R * 0.06},${headY + R * 0.28} q${R * 0.06},${R * 0.08} ${R * 0.12},0`} stroke={d.skinShade} strokeWidth={sw} fill="none" strokeLinecap="round" />
              {d.beard && <Beard style={d.beard} R={R} headY={headY} mouthY={mouthY} fx={fx} hair={hc} skin={d.skin} ink={ink} sw={sw} />}
              {(d.mustache || d.beard === 'full' || d.beard === 'goatee') && (
                <path d={`M${fx - R * 0.32},${mouthY - R * 0.06} Q${fx - R * 0.16},${mouthY - R * 0.24} ${fx},${mouthY - R * 0.14} Q${fx + R * 0.16},${mouthY - R * 0.24} ${fx + R * 0.32},${mouthY - R * 0.06} Q${fx + R * 0.16},${mouthY - R * 0.1} ${fx},${mouthY - R * 0.06} Q${fx - R * 0.16},${mouthY - R * 0.1} ${fx - R * 0.32},${mouthY - R * 0.06} Z`} fill={d.mustache ?? hc} stroke={ink} strokeWidth={sw * 0.5} strokeLinejoin="round" />
              )}
              {mouth}
              {hoodFront}
              {s.breath > 0 &&
                [0, 1, 2].map((k) => {
                  const ph = ((s.frame + k * 22) % 66) / 66;
                  return <circle key={k} cx={fx + R * 0.3 + ph * R * 1.1} cy={mouthY - ph * R * 0.5} r={R * (0.1 + ph * 0.32)} fill="#EAF4FF" opacity={(1 - ph) * 0.7 * s.breath} />;
                })}
            </g>
          )}
        </g>
        {/* near arm */}
        {!nearRaised && <Stroke dd={RA.d} w={armW} color={top} />}
        {d.watch && !s.hold && (
          <g transform={`translate(${RA.ex + (RA.hx - RA.ex) * 0.72},${RA.ey + (RA.hy - RA.ey) * 0.72})`}>
            {s.watchGlow > 0 && <circle r={R * 0.4} fill="#9FE8FF" opacity={0.3 * s.watchGlow} />}
            <rect x={-R * 0.13} y={-R * 0.1} width={R * 0.26} height={R * 0.2} rx={R * 0.04} fill="#C9CED6" stroke={ink} strokeWidth={sw * 0.6} />
          </g>
        )}
        {hand(RA.hx, RA.hy, 'rh')}
        {s.hold && <g transform={`translate(${RA.hx},${RA.hy})`}><HeldProp kind={s.hold} R={R} frame={s.frame} /></g>}
      </g>
    </g>
  );
};

/**
 * Facial hair that can't be mistaken for a mouth: it follows the jaw, has a tufted edge and hair texture,
 * and leaves a skin-tone patch around the lips so the real mouth always draws on top.
 */
const Beard: React.FC<{style: 'full' | 'goatee' | 'chinstrap'; R: number; headY: number; mouthY: number; fx: number; hair: string; skin: string; ink: string; sw: number}> = ({style, R, headY, mouthY, fx, hair, skin, ink, sw}) => {
  const tufts = (x0: number, x1: number, y: number, n: number, depth: number) =>
    Array.from({length: n}, (_, i) => {
      const xa = x0 + ((x1 - x0) * i) / n;
      const xb = x0 + ((x1 - x0) * (i + 0.5)) / n;
      const xc = x0 + ((x1 - x0) * (i + 1)) / n;
      const curve = Math.sin(((i + 0.5) / n) * Math.PI);
      return `L${xb},${y + curve * depth + depth * 0.35} L${xc},${y + Math.sin(((i + 1) / n) * Math.PI) * depth}`;
    }).join(' ');
  if (style === 'chinstrap') {
    return <path d={`M${-R * 0.97},${headY + R * 0.05} Q${-R * 0.9},${headY + R * 0.95} ${fx},${headY + R * 1.04} Q${R * 0.9},${headY + R * 0.95} ${R * 0.97},${headY + R * 0.05}`} stroke={hair} strokeWidth={R * 0.17} fill="none" strokeLinecap="round" />;
  }
  if (style === 'goatee') {
    const x0 = fx - R * 0.24;
    const x1 = fx + R * 0.24;
    return (
      <g>
        <path d={`M${x0},${mouthY + R * 0.08} Q${fx},${mouthY + R * 0.02} ${x1},${mouthY + R * 0.08} L${x1 - R * 0.04},${mouthY + R * 0.36} ${tufts(x1 - R * 0.04, x0 + R * 0.04, mouthY + R * 0.36, 4, R * 0.1)} Z`} fill={hair} stroke={ink} strokeWidth={sw * 0.6} strokeLinejoin="round" />
        <path d={`M${fx - R * 0.08},${mouthY + R * 0.16} l${R * 0.02},${R * 0.14} M${fx + R * 0.08},${mouthY + R * 0.16} l-${R * 0.02},${R * 0.14}`} stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={sw * 0.6} />
      </g>
    );
  }
  // full beard: ear to ear along the jaw, tufted bottom, lip patch
  const left = -R * 0.98;
  const right = R * 0.98;
  return (
    <g>
      <path
        d={`M${left},${headY + R * 0.02} Q${left + R * 0.05},${headY + R * 0.5} ${left + R * 0.3},${headY + R * 0.82} ${tufts(left + R * 0.3, right - R * 0.3, headY + R * 0.95, 7, R * 0.22)} Q${right - R * 0.05},${headY + R * 0.5} ${right},${headY + R * 0.02} Q${right - R * 0.15},${headY + R * 0.6} ${fx + R * 0.4},${mouthY - R * 0.1} Q${fx},${mouthY - R * 0.2} ${fx - R * 0.4},${mouthY - R * 0.1} Q${left + R * 0.15},${headY + R * 0.6} ${left},${headY + R * 0.02} Z`}
        fill={hair}
        stroke={ink}
        strokeWidth={sw * 0.7}
        strokeLinejoin="round"
      />
      {/* hair strands */}
      {[-0.55, -0.3, 0.3, 0.55].map((k) => (
        <path key={k} d={`M${fx + k * R},${mouthY + R * 0.08} q${k * R * 0.08},${R * 0.2} 0,${R * 0.36}`} stroke="#FFFFFF" strokeOpacity={0.22} strokeWidth={sw * 0.7} fill="none" strokeLinecap="round" />
      ))}
      {/* skin around the lips so the mouth reads as the mouth */}
      <ellipse cx={fx} cy={mouthY + R * 0.06} rx={R * 0.3} ry={R * 0.17} fill={skin} />
    </g>
  );
};

/** Height of a character in px at a depth scale (for framing). */
export const toonHeight = (d: ToonDesign, scale: number) => HERO_PX * d.height * scale;
