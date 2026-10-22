import React from 'react';
import {Easing, interpolate} from 'remotion';
import {useShot} from '../../engine/shot-context';
import {Globe} from '../../fx/globe';
import {Glow, Stars} from '../../fx/sky';
import {Executor} from '../../fx/vey';
import {C} from '../../theme';
import {Stage} from '../common';
import {HOLO} from '../kit';
import {HEIRS} from './roof';

/** Hologram backdrop: deep navy, faint grid, the Executor projecting in a corner. */
const HoloStage: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {frame, speaking} = useShot();
  return (
    <Stage bg="#050816">
      <Stars frame={frame} count={260} opacity={0.6} />
      {Array.from({length: 13}, (_, i) => (
        <line key={`v${i}`} x1={i * 160} y1={0} x2={i * 160} y2={1080} stroke={HOLO.line} strokeOpacity={0.05} />
      ))}
      {Array.from({length: 8}, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 160} x2={1920} y2={i * 160} stroke={HOLO.line} strokeOpacity={0.05} />
      ))}
      {children}
      <Executor x={1760} y={900} scale={0.45} frame={frame} speaking={speaking('EXECUTOR')} />
      <path d="M1730,880 L1500,700 M1730,880 L1600,500" stroke={HOLO.line} strokeOpacity={0.12} strokeWidth={3} />
    </Stage>
  );
};

const Label: React.FC<{x: number; y: number; text: string; opacity?: number; size?: number; anchor?: 'start' | 'middle' | 'end'; color?: string}> = ({x, y, text, opacity = 1, size = 30, anchor = 'middle', color = HOLO.line}) => (
  <text x={x} y={y} textAnchor={anchor} fill={color} opacity={opacity} fontFamily={HOLO.text} fontWeight={600} fontSize={size} letterSpacing={3}>
    {text}
  </text>
);

/** Betelgeuse placed where the Sun is: it swallows the inner planets' orbits one by one. */
const BetelgeuseSize: React.FC = () => {
  const {t, lineAt, frame} = useShot();
  const cx = 860;
  const cy = 560;
  // orbit radii (px) proportional to AU: Mercury .39, Venus .72, Earth 1, Mars 1.52 → 1 AU = 170px
  const AU = 170;
  const orbits = [
    {n: 'MERCURY', r: 0.39 * AU, c: '#C9B79A'},
    {n: 'VENUS', r: 0.72 * AU, c: '#E8C27A'},
    {n: 'EARTH', r: 1.0 * AU, c: '#5FB0FF'},
    {n: 'MARS', r: 1.52 * AU, c: '#E0603A'},
  ];
  const start = lineAt(1) - 0.2;
  // grows to ~3.5 AU across line 2 (Mercury → Venus → Earth → Mars)
  const R = interpolate(t, [0.4, start, start + 4.2], [6, 10, 3.5 * AU], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  return (
    <HoloStage>
      <defs>
        <radialGradient id="betG">
          <stop offset="0" stopColor="#FFB070" />
          <stop offset="0.6" stopColor="#FF6A2A" />
          <stop offset="1" stopColor="#B8361A" />
        </radialGradient>
      </defs>
      {orbits.map((o, i) => {
        const swallowed = R > o.r;
        const a = frame * (0.03 / (i + 1)) + i * 1.6;
        return (
          <g key={o.n}>
            <circle cx={cx} cy={cy} r={o.r} fill="none" stroke={HOLO.line} strokeOpacity={swallowed ? 0.15 : 0.55} strokeWidth={2} strokeDasharray="6 8" />
            {!swallowed && (
              <>
                <circle cx={cx + Math.cos(a) * o.r} cy={cy + Math.sin(a) * o.r} r={i === 2 ? 11 : 8} fill={o.c} stroke={C.ink} strokeWidth={2} />
                {i === 2 && <Label x={cx + Math.cos(a) * o.r} y={cy + Math.sin(a) * o.r + 34} text="EARTH" size={16} color="#5FB0FF" />}
              </>
            )}
            <Label x={cx} y={cy - o.r - 10} text={o.n} size={18} opacity={swallowed ? 0.25 : 0.8} />
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={R * 1.15} fill="#FF6A2A" opacity={0.15} />
      <circle cx={cx} cy={cy} r={R} fill="url(#betG)" opacity={0.92} />
      <circle cx={cx} cy={cy} r={6} fill="#FFF4D0" opacity={R < 20 ? 1 : 0} />
      <Label x={cx} y={cy + 40} text={R < 20 ? 'OUR SUN' : ''} size={22} />
      <Label x={cx} y={130} text={R > 30 ? 'BETELGEUSE' : ''} size={44} color="#FFB070" />
      {/* our sun, to scale, beside it */}
      <g opacity={interpolate(t, [start + 4.4, start + 5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
        <circle cx={1480} cy={540} r={2} fill="#FFF4D0" />
        <path d="M1480,560 l0,60" stroke={HOLO.line} strokeWidth={2} />
        <Label x={1480} y={650} text="OUR SUN, TO SCALE" size={20} />
      </g>
    </HoloStage>
  );
};

/** The ISS orbiting Earth with gravity still at 90%. */
const ISS: React.FC = () => {
  const {t, frame, lineAt, ramp} = useShot();
  const cx = 860;
  const cy = 560;
  const r = 300;
  const orbitR = r * 1.18;
  const a = -Math.PI / 2 + t * 0.35;
  const sx = cx + Math.cos(a) * orbitR;
  const sy = cy + Math.sin(a) * orbitR * 0.95;
  return (
    <HoloStage>
      <Globe cx={cx} cy={cy} r={r} rotate={[-20 + t * 4, -10]} frame={frame} sun={[40, 0]} />
      <ellipse cx={cx} cy={cy} rx={orbitR} ry={orbitR * 0.95} fill="none" stroke={HOLO.line} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="8 8" />
      <g transform={`translate(${sx},${sy}) rotate(${(a * 180) / Math.PI + 90})`}>
        <rect x={-40} y={-6} width={80} height={12} fill="#E9E9EE" stroke={C.ink} strokeWidth={2} />
        <rect x={-70} y={-24} width={26} height={48} fill="#3E6FB0" stroke={C.ink} strokeWidth={2} />
        <rect x={44} y={-24} width={26} height={48} fill="#3E6FB0" stroke={C.ink} strokeWidth={2} />
        <rect x={-10} y={-14} width={20} height={28} fill="#E9E9EE" stroke={C.ink} strokeWidth={2} />
      </g>
      <g opacity={ramp(lineAt(0) + 2, 0.6)}>
        <path d={`M${sx},${sy} L${sx + (cx - sx) * 0.25},${sy + (cy - sy) * 0.25}`} stroke="#FF7A3D" strokeWidth={10} strokeLinecap="round" />
        <circle cx={sx + (cx - sx) * 0.25} cy={sy + (cy - sy) * 0.25} r={10} fill="#FF7A3D" />
        <Label x={sx + 40} y={sy - 30} text="GRAVITY: 90%" size={30} anchor="start" color="#FFB070" />
      </g>
      <g opacity={ramp(lineAt(0) + 3.4, 0.6)}>
        <g transform="translate(1400,620)">
          <circle r={70} fill="none" stroke={HOLO.line} strokeWidth={2} />
          <path d="M0,-40 l0,80 M-12,28 l12,14 l12,-14" stroke="#FF7A3D" strokeWidth={6} fill="none" />
          <Label x={0} y={110} text="GROUND: 100%" size={22} />
        </g>
      </g>
      <Label x={sx} y={sy + 60} text="ISS · 400 KM" size={20} />
    </HoloStage>
  );
};

/** Newton's cannon: three shots, the third falls around the world. */
const Cannon: React.FC = () => {
  const {t, frame, lineAt} = useShot();
  const cx = 860;
  const cy = 600;
  const r = 280;
  const top: [number, number] = [cx, cy - r - 70];
  const shots = [
    {start: 0.8, len: 1.4, d: `M${top[0]},${top[1]} Q${cx + 120},${top[1] - 30} ${cx + 160},${cy - r + 30}`},
    {start: 2.6, len: 1.8, d: `M${top[0]},${top[1]} Q${cx + 330},${top[1] + 10} ${cx + r - 10},${cy - 60}`},
  ];
  const orbitStart = lineAt(1) - 0.4;
  const orbitP = Math.max(0, t - orbitStart) / 3.2;
  const orbitR = r + 70;
  const ball = orbitP > 0 ? [cx + Math.sin(orbitP * Math.PI * 2) * orbitR, cy - Math.cos(orbitP * Math.PI * 2) * orbitR] : null;
  return (
    <HoloStage>
      <Globe cx={cx} cy={cy} r={r} rotate={[-10, -10]} frame={frame} sun={[30, 10]} />
      {/* mountain + cannon */}
      <path d={`M${cx - 70},${cy - r + 8} L${cx},${cy - r - 64} L${cx + 70},${cy - r + 8} Z`} fill="#7A6A58" stroke={C.ink} strokeWidth={4} />
      <rect x={cx - 6} y={top[1] - 16} width={46} height={20} rx={8} fill="#2A2A30" stroke={HOLO.line} strokeWidth={2} />
      {shots.map((s, i) => {
        const p = Math.min(1, Math.max(0, (t - s.start) / s.len));
        return p > 0 ? <path key={i} d={s.d} stroke={HOLO.line} strokeWidth={4} fill="none" strokeDasharray="1200" strokeDashoffset={1200 * (1 - p)} opacity={0.7} /> : null;
      })}
      {orbitP > 0 && (
        <>
          <circle cx={cx} cy={cy} r={orbitR} fill="none" stroke="#FF9A3C" strokeWidth={4} strokeDasharray={`${Math.min(1, orbitP) * 2 * Math.PI * orbitR} 9999`} transform={`rotate(-90,${cx},${cy})`} />
          {ball && <circle cx={ball[0]} cy={ball[1]} r={12} fill="#FFE2B0" stroke={C.ink} strokeWidth={3} />}
          {ball && <Glow id="ballGlow" cx={ball[0]} cy={ball[1]} r={40} color="#FF9A3C" opacity={0.6} />}
        </>
      )}
      <Label x={cx + 120} y={cy - r + 70} text={t > 0.8 ? 'SLOW' : ''} size={22} />
      <Label x={cx + r + 40} y={cy - 40} text={t > 2.6 ? 'FASTER' : ''} size={22} anchor="start" />
      <Label x={cx} y={cy + orbitR + 60} text={orbitP > 0.2 ? 'FAST ENOUGH: IT FALLS... AND MISSES' : ''} size={26} />
    </HoloStage>
  );
};

/** Rocket cut-away: ~90% fuel. Then "a rocket that weighs nothing" floats. */
const Rocket: React.FC = () => {
  const {t, lineAt} = useShot();
  const fill = interpolate(t, [0.4, 2.2], [0, 0.9], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const weightless = Math.max(0, Math.min(1, (t - lineAt(1) - 0.3) / 2));
  const lift = weightless * 140;
  const H = 600;
  return (
    <HoloStage>
      <g transform={`translate(860,${880 - lift})`}>
        {weightless > 0 && <circle cx={0} cy={-H / 2} r={260} fill="#FF9A3C" opacity={0.12 * weightless} />}
        <path d={`M-70,0 L-70,${-H + 120} Q0,${-H - 40} 70,${-H + 120} L70,0 Z`} fill="none" stroke={HOLO.line} strokeWidth={5} />
        <clipPath id="rocketClip">
          <path d={`M-66,-4 L-66,${-H + 124} Q0,${-H - 36} 66,${-H + 124} L66,-4 Z`} />
        </clipPath>
        <g clipPath="url(#rocketClip)">
          <rect x={-70} y={-H * fill * (1 - weightless)} width={140} height={H * fill} fill="#F6D58C" opacity={0.75} />
        </g>
        <path d={`M-70,-60 L-120,20 L-70,0 Z M70,-60 L120,20 L70,0 Z`} fill="none" stroke={HOLO.line} strokeWidth={4} />
        <rect x={-34} y={-H + 40} width={68} height={70} rx={10} fill="#0B1026" stroke={HOLO.line} strokeWidth={3} />
        <circle cx={0} cy={-H + 75} r={14} fill="#7FD6FF" opacity={0.7} />
        {weightless === 0 && t > 0.4 && (
          <g>
            {Array.from({length: 6}, (_, i) => (
              <path key={i} d={`M${-40 + i * 16},12 q-6,${30 + (i % 3) * 14} 0,${50 + (i % 2) * 20}`} stroke="#FF7A3D" strokeWidth={6} fill="none" opacity={0.7} />
            ))}
          </g>
        )}
      </g>
      <g transform="translate(1100,400)" opacity={fill > 0.2 ? 1 : 0}>
        <text x={0} y={0} fill="#F6D58C" fontFamily={HOLO.text} fontWeight={700} fontSize={110}>
          {Math.round(fill * 100 * (1 - weightless))}%
        </text>
        <Label x={6} y={50} text="FUEL" size={30} anchor="start" />
      </g>
    </HoloStage>
  );
};

export const Holo: React.FC = () => {
  const {props} = useShot();
  switch (props.kind) {
    case 'betelgeuse':
      return <BetelgeuseSize />;
    case 'iss':
      return <ISS />;
    case 'cannon':
      return <Cannon />;
    case 'rocket':
      return <Rocket />;
    default:
      return null;
  }
};

/** Twelve silver threads leave the dead star and fall onto twelve places on Earth. */
export const GlobeThreads: React.FC = () => {
  const {frame, t, dur} = useShot();
  const cx = 1100;
  const cy = 600;
  const r = 380;
  const src: [number, number] = [260, 140];
  const rot: [number, number] = [-20 + t * 3, -20];
  // project lon/lat with the same orthographic maths the Globe uses (approximate, front side only)
  const proj = (ll: [number, number]) => {
    const toR = Math.PI / 180;
    const lam = (ll[0] + rot[0]) * toR;
    const phi = ll[1] * toR;
    const phi0 = -rot[1] * toR;
    const x = Math.cos(phi) * Math.sin(lam);
    const y = Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(lam);
    const vis = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(lam) > 0;
    return {x: cx + x * r, y: cy - y * r, vis};
  };
  return (
    <Stage bg="#02030A">
      <Stars frame={frame} count={420} maxR={1.8} />
      <circle cx={src[0]} cy={src[1]} r={40} fill="none" stroke={C.pearl} strokeOpacity={0.4} strokeWidth={3} strokeDasharray="5 9" />
      <Globe cx={cx} cy={cy} r={r} rotate={rot} frame={frame} sun={[60, -10]} />
      {HEIRS.map((ll, i) => {
        const p = interpolate(t, [0.6 + i * 0.18, 2.4 + i * 0.18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
        const end = proj(ll);
        const tx = end.vis ? end.x : cx + (end.x - cx) * 1.0;
        const ty = end.vis ? end.y : cy + (end.y - cy) * 1.0;
        const d = `M${src[0]},${src[1]} C${src[0] + 300},${src[1] - 60} ${tx - 200},${ty - 300} ${tx},${ty}`;
        const lagos = i === 0;
        return (
          <g key={i} opacity={end.vis ? 1 : 0.35}>
            <path d={d} stroke={lagos ? '#FFB36B' : '#E8F0FF'} strokeWidth={lagos ? 4 : 2.5} fill="none" strokeDasharray="2400" strokeDashoffset={2400 * (1 - p)} opacity={0.85} />
            {p >= 1 && end.vis && <Glow id={`thr${i}`} cx={tx} cy={ty} r={lagos ? 36 + Math.sin(frame * 0.3) * 6 : 18} color={lagos ? '#FF9A3C' : '#E8F0FF'} />}
          </g>
        );
      })}
      <g opacity={interpolate(t, [dur - 2, dur - 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
        {(() => {
          const l = proj(HEIRS[0]);
          return <text x={l.x + 30} y={l.y + 8} fill="#FFB36B" fontFamily={HOLO.text} fontWeight={600} fontSize={30}>LAGOS</text>;
        })()}
      </g>
    </Stage>
  );
};
