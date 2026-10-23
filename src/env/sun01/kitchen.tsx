import React, {useId} from 'react';
import {interpolate} from 'remotion';
import {Dog} from '../../characters/Dog';
import {Figure} from '../../characters/Figure';
import {useShot} from '../../engine/shot-context';
import {Bloom, Streak} from '../../fx/cinema/atmos';
import {Cine, Plane, type CamKey} from '../../fx/cinema/camera';
import {Stars} from '../../fx/sky';
import {C} from '../../theme';
import {Motes, Shadow} from '../kit';
import {Stage} from '../common';
import {ChalkSun, CityBlocks, Flame, NightGrade, P} from './parts';

const WIN = {x: 1040, y: 130, w: 700, h: 560};

/** What you see through the kitchen window. light: 1 = morning sun, 0 = sunless. */
const WindowView: React.FC<{light: number; stars: number; cityLights: number; frame: number; id: string}> = ({light, stars, cityLights, frame, id}) => (
  <g>
    <defs>
      <linearGradient id={`${id}d`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5FA8E8" />
        <stop offset="0.6" stopColor="#A9D6F2" />
        <stop offset="1" stopColor="#FFE8C2" />
      </linearGradient>
      <linearGradient id={`${id}n`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#02040C" />
        <stop offset="1" stopColor="#141C42" />
      </linearGradient>
      <clipPath id={`${id}c`}>
        <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} />
      </clipPath>
    </defs>
    <g clipPath={`url(#${id}c)`}>
      <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} fill={`url(#${id}n)`} />
      <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} fill={`url(#${id}d)`} opacity={light} />
      <g opacity={stars}>
        <Stars frame={frame} count={150} w={WIN.w} h={WIN.h} seed={88} maxR={2.2} y0={WIN.y} />
      </g>
      {light > 0.01 && (
        <g opacity={light}>
          <Bloom x={1590} y={250} r={260} color="#FFF4D0" opacity={0.9} />
          <circle cx={1590} cy={250} r={46} fill="#FFFBEA" />
        </g>
      )}
      <CityBlocks seed={31} base={640} color={light > 0.5 ? '#9DB6CF' : '#121735'} x0={WIN.x - 40} x1={WIN.x + WIN.w + 40} minH={120} maxH={330} lights={cityLights} frame={frame} sunlit={light > 0.5 ? '#FFF2D8' : undefined} />
      <CityBlocks seed={57} base={720} color={light > 0.5 ? '#7E95B4' : '#0B0F28'} x0={WIN.x - 40} x1={WIN.x + WIN.w + 40} minH={90} maxH={240} lights={cityLights * 0.9} frame={frame} />
    </g>
  </g>
);

export const Kitchen: React.FC = () => {
  const {props, frame, t, progress, speaking} = useShot();
  const id = useId().replace(/:/g, '');
  const beat = props.beat as string;
  const state = props.state as string;
  // Light level: the blackout happens 0.4s into its shot — a switch, not a fade.
  const light = state === 'sun' ? 1 : state === 'blackout' ? interpolate(t, [0.42, 0.52], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  const stars = state === 'blackout' ? interpolate(t, [1.0, 3.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : state === 'dark' ? 1 : 0;
  const cityLights = state === 'blackout' ? interpolate(t, [2.2, 3.4], [0, 0.55], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : state === 'dark' ? 0.45 : 0;
  const night = 1 - light;
  const sunny = light > 0.5;

  const keys: Record<string, CamKey[]> = {
    breakfast: [[0, 1.55, 560, 600], [1, 1.04, 960, 540]],
    blackout: [[0, 1.18, 1280, 470], [1, 1.26, 1290, 450]],
    window: [[0, 1.12, 1060, 500, -1], [1, 1.2, 1120, 480, 0]],
    reset: [[0, 1.02, 960, 540], [1, 1.16, 1240, 520]],
    question: [[0, 1.12, 1250, 520], [1, 1.34, 1300, 470]],
  };
  const overShoulder = beat === 'window';
  const youX = overShoulder ? 1390 : beat === 'breakfast' || beat === 'reset' ? 1430 : 1360;
  const youExpr = beat === 'blackout' ? (t > 0.6 ? 'alarmed' : 'happy') : beat === 'reset' ? (t > 2 ? 'nervous' : 'surprised') : beat === 'question' ? 'determined' : beat === 'window' ? 'serious' : 'happy';
  const lookAtWindow = beat === 'blackout' && t > 0.7;

  return (
    <Stage bg="#000">
      <Cine keys={keys[beat] ?? keys.breakfast} progress={progress} frame={frame} handheld={beat === 'blackout' ? 0.9 : 0.4}>
        <Plane depth={0.9}>
          {/* wall + floor */}
          <rect x={-300} y={-200} width={2600} height={1120} fill={P.sunWall} />
          <rect x={-300} y={880} width={2600} height={500} fill={P.sunFloor} />
          <rect x={-300} y={872} width={2600} height={12} fill={P.sunWallShade} />
          {/* window */}
          <WindowView light={light} stars={stars} cityLights={cityLights} frame={frame} id={`${id}w`} />
          <rect x={WIN.x - 18} y={WIN.y - 18} width={WIN.w + 36} height={WIN.h + 36} rx={6} fill="none" stroke="#F4EFE6" strokeWidth={30} />
          <rect x={WIN.x - 18} y={WIN.y - 18} width={WIN.w + 36} height={WIN.h + 36} rx={6} fill="none" stroke={C.ink} strokeWidth={5} />
          <path d={`M${WIN.x + WIN.w / 2},${WIN.y} L${WIN.x + WIN.w / 2},${WIN.y + WIN.h}`} stroke="#F4EFE6" strokeWidth={16} />
          <rect x={WIN.x - 40} y={WIN.y + WIN.h + 16} width={WIN.w + 80} height={22} rx={4} fill="#EADFCB" stroke={C.ink} strokeWidth={4} />
          {/* Mira's sun drawing taped by the window (the reset shows it again) */}
          <rect x={WIN.x - 190} y={260} width={120} height={150} fill="#FFFDF6" stroke={C.ink} strokeWidth={3} transform={`rotate(-4,${WIN.x - 130},335)`} />
          <ChalkSun x={WIN.x - 130} y={330} r={26} seed={2} color="#F2A33A" width={5} />
          {/* fridge covered in Mira's drawings */}
          <rect x={620} y={300} width={300} height={580} rx={18} fill="#E8EEF4" stroke={C.ink} strokeWidth={5} />
          <path d="M620,500 L920,500" stroke={C.ink} strokeWidth={4} />
          <rect x={880} y={360} width={12} height={90} rx={5} fill="#B9C2CC" stroke={C.ink} strokeWidth={3} />
          {[
            [660, 330, -5, '#FFE7A6'],
            [760, 540, 4, '#FFD4D4'],
            [670, 640, -3, '#D4ECFF'],
          ].map(([x, y, r, c], i) => (
            <g key={i} transform={`rotate(${r},${(x as number) + 45},${(y as number) + 50})`}>
              <rect x={x as number} y={y as number} width={90} height={100} fill={c as string} stroke={C.ink} strokeWidth={2.5} />
              <ChalkSun x={(x as number) + 45} y={(y as number) + 50} r={18} seed={i + 5} color="#E0822A" width={3} />
            </g>
          ))}
          {/* wall clock: 6:52 */}
          <g transform="translate(440,170)">
            <circle r={62} fill="#F4EFE6" stroke={C.ink} strokeWidth={6} />
            {Array.from({length: 12}, (_, i) => (
              <path key={i} d={`M${Math.sin((i / 12) * Math.PI * 2) * 48},${-Math.cos((i / 12) * Math.PI * 2) * 48} L${Math.sin((i / 12) * Math.PI * 2) * 54},${-Math.cos((i / 12) * Math.PI * 2) * 54}`} stroke={C.ink} strokeWidth={3} />
            ))}
            <path d={`M0,0 L${Math.sin(((6 + 52 / 60) / 12) * Math.PI * 2) * 28},${-Math.cos(((6 + 52 / 60) / 12) * Math.PI * 2) * 28}`} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
            <path d={`M0,0 L${Math.sin((52 / 60) * Math.PI * 2) * 42},${-Math.cos((52 / 60) * Math.PI * 2) * 42}`} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
            <path d={`M0,0 L${Math.sin(((frame % 1800) / 1800) * Math.PI * 2) * 46},${-Math.cos(((frame % 1800) / 1800) * Math.PI * 2) * 46}`} stroke="#D9443A" strokeWidth={2} />
          </g>
          {/* pendant lamp */}
          <path d="M520,-200 L520,120" stroke={C.ink} strokeWidth={4} />
          <path d="M450,180 Q520,90 590,180 Z" fill="#4FA3A5" stroke={C.ink} strokeWidth={5} />
          {/* shelf + plants */}
          <rect x={160} y={300} width={420} height={16} rx={4} fill="#B98454" stroke={C.ink} strokeWidth={4} />
          {[210, 300, 400, 500].map((x, i) => (
            <g key={x}>
              <rect x={x - 22} y={250} width={44} height={50} rx={6} fill={['#E07A5F', '#4FA3A5', '#F2D16B', '#A98BD1'][i]} stroke={C.ink} strokeWidth={3.5} />
              <path d={`M${x},250 q-20,-40 -6,-60 M${x},250 q18,-36 10,-58`} stroke="#3C8D6E" strokeWidth={7} fill="none" strokeLinecap="round" />
            </g>
          ))}
          {/* counter + kettle */}
          <rect x={1000} y={760} width={1100} height={140} fill="#E5D3B8" stroke={C.ink} strokeWidth={5} />
          <rect x={1000} y={748} width={1100} height={20} fill="#F4EFE6" stroke={C.ink} strokeWidth={4} />
          <g transform="translate(1820,748)">
            <path d="M-50,0 Q-56,-90 0,-96 Q56,-90 50,0 Z" fill="#D9443A" stroke={C.ink} strokeWidth={5} />
            <path d="M50,-60 q34,0 30,-34" stroke={C.ink} strokeWidth={8} fill="none" />
            {light > 0.5 &&
              [0, 1, 2].map((k) => {
                const ph = ((frame + k * 20) % 60) / 60;
                return <circle key={k} cx={80 + ph * 30} cy={-100 - ph * 120} r={8 + ph * 26} fill="#FFFFFF" opacity={(1 - ph) * 0.5} />;
              })}
          </g>
          {/* sunlight on the floor */}
          {light > 0 && (
            <g opacity={light * 0.55} style={{mixBlendMode: 'screen'}}>
              <path d={`M${WIN.x},${WIN.y} L${WIN.x + WIN.w},${WIN.y} L${WIN.x + WIN.w - 420},1100 L${WIN.x - 640},1100 Z`} fill="#FFE9B8" opacity={0.35} />
            </g>
          )}
        </Plane>

        <Plane depth={1}>
          {/* Biscuit stares at the toast */}
          <Shadow x={880} y={900} w={90} opacity={0.2} />
          <Dog x={900} y={900} s={0.95} pose={beat === 'window' ? 'lie' : 'sit'} flip wag={beat === 'reset' ? 0.9 : 0.4} lookUp={beat === 'breakfast' || beat === 'reset' ? 0.6 : 0.2} rim={night > 0.5 ? '#9FD8FF' : undefined} />
          {/* table + Mira */}
          {beat !== 'window' && (
            <g>
              <Figure char="mira" x={470} y={800} scale={1.18} pose="hold" expression={speaking('MIRA') ? 'serious' : beat === 'blackout' && t > 0.8 ? 'surprised' : 'happy'} look={beat === 'blackout' && t > 0.8 ? [0.8, -0.6] : [0.3, 0.6]} seed={3} rim={night > 0.5} />
              <rect x={170} y={700} width={660} height={26} rx={6} fill="#B98454" stroke={C.ink} strokeWidth={5} />
              <rect x={200} y={726} width={600} height={180} fill="#9E6D43" stroke={C.ink} strokeWidth={5} />
              <rect x={360} y={668} width={150} height={40} fill="#FFFDF6" stroke={C.ink} strokeWidth={3} transform="rotate(-6,435,688)" />
              <ChalkSun x={430} y={686} r={9} seed={2} color="#F2A33A" width={3} draw={beat === 'breakfast' ? Math.min(1, t / 4) : 1} />
              <ellipse cx={680} cy={698} rx={60} ry={12} fill="#F4EFE6" stroke={C.ink} strokeWidth={3.5} />
              <path d="M640,692 Q680,664 720,692 Z" fill="#E3A15A" stroke={C.ink} strokeWidth={3} />
            </g>
          )}
          {beat === 'window' && (
            <g>
              <rect x={170} y={700} width={660} height={26} rx={6} fill="#B98454" stroke={C.ink} strokeWidth={5} />
              <rect x={200} y={726} width={600} height={180} fill="#9E6D43" stroke={C.ink} strokeWidth={5} />
              <Figure char="mira" x={700} y={980} scale={1.25} pose="sitHug" expression="sad" look={[1, -0.5]} seed={3} rim />
              <Dog x={880} y={980} s={0.8} pose="lie" flip wag={0.1} rim="#FFB867" />
              <Figure char="you" x={youX} y={960} scale={1.45} pose="stand" back rim />
            </g>
          )}
          {/* you */}
          {!overShoulder && (
            <Figure
              char="you"
              x={youX}
              y={960}
              scale={1.32}
              pose="hold"
              expression={youExpr}
              look={lookAtWindow ? [-0.2, -0.8] : beat === 'question' ? [0, 0] : [-0.7, 0.2]}
              holding={beat === 'breakfast' || beat === 'reset' ? <rect x={-14} y={-26} width={28} height={30} rx={5} fill="#F4EFE6" stroke={C.ink} strokeWidth={3.5} /> : undefined}
              watchGlow={state === 'blackout' && t < 0.5 ? 1 : 0}
              rim
            />
          )}
        </Plane>

        {/* night grade + practical light */}
        <Plane depth={1}>
          <NightGrade amount={night * (state === 'dark' ? 0.68 : 0.82)} color="#0E1640" />
          {state === 'dark' && <Bloom x={600} y={700} r={900} color="#FFB867" opacity={0.5} />}
          {state === 'dark' && <Flame x={430} y={650} s={1.1} frame={frame} glow={1.4} />}
          {state === 'blackout' && t < 0.5 && <Streak x={1590} y={250} w={1600} color="#FFE6B0" opacity={0.5} />}
          {sunny && <Motes frame={frame} count={50} color="#FFF4D6" />}
        </Plane>

        {/* foreground: the back of a chair, out of focus — depth */}
        <Plane depth={1.35} blur={7}>
          <g opacity={beat === 'blackout' || beat === 'window' ? 0.9 : 0.95}>
            <rect x={-160} y={600} width={60} height={700} rx={20} fill="#6E4A2E" />
            <rect x={120} y={600} width={60} height={700} rx={20} fill="#6E4A2E" />
            <rect x={-170} y={600} width={360} height={70} rx={24} fill="#7E5634" />
          </g>
          <NightGrade amount={night * 0.82} color="#0E1640" />
        </Plane>
      </Cine>
    </Stage>
  );
};
