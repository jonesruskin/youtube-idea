import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Toon} from '../../characters/toon/Toon';
import {CAST} from '../../characters/toon/design';
import {FACES} from '../../characters/toon/face';
import {POSES} from '../../characters/toon/poses';
import {Stars} from '../../fx/sky';
import {fonts} from '../../theme';
import {RadioSet, Clock} from './parts';

/**
 * File 002 thumbnails: spoiler-free (nothing about how she is found, no meteors, no Morse), readable at 320×180.
 *  A "MUM?"          a boy at a Manila bus stop under a black afternoon sky full of stars, his phone: CONNECTION LOST
 *  B "LOST AT SEA"   one cargo ship, one lit window, on a black ocean under a sky of stars
 *  C "6:00 AM"       an old woman at an old radio in the dark, the clock at 5:59
 */
const st = (x: number, y: number, scale: number, face: keyof typeof FACES, extra: Record<string, unknown> = {}) =>
  ({x, y, scale, facing: 'front', pose: POSES.stand, bob: 0, face: FACES[face], turn: 0.2, look: [0.4, -0.6], talk: 0, blink: 0, outfit: 'home', hoodUp: false, breath: 0, frame: 10, rim: true, opacity: 1, watchGlow: 0, ...extra}) as any;

const Words: React.FC<{lines: {t: string; size: number; col: string}[]; x: number; y: number; anchor?: 'start' | 'end' | 'middle'}> = ({lines, x, y, anchor = 'start'}) => (
  <g transform={`rotate(-3,${x},${y})`}>
    {lines.map((w, i) => {
      const yy = y + lines.slice(0, i + 1).reduce((a, l) => a + l.size * 0.95, 0);
      return (
        <g key={i}>
          <text x={x + 10} y={yy + 12} textAnchor={anchor} fontFamily={fonts.display} fontWeight={900} fontSize={w.size} fill="#000" opacity={0.6}>
            {w.t}
          </text>
          <text x={x} y={yy} textAnchor={anchor} fontFamily={fonts.display} fontWeight={900} fontSize={w.size} fill={w.col} stroke="#0B1026" strokeWidth={w.size * 0.07} paintOrder="stroke">
            {w.t}
          </text>
        </g>
      );
    })}
  </g>
);

export const SeaThumbnail: React.FC<{text?: string}> = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <rect width={1920} height={1080} fill="#02040E" />
      <Stars frame={10} count={700} w={1920} h={760} seed={4} maxR={2.6} />
      {/* a palm and the street: it is afternoon, but the sky is night */}
      <path d="M1660,1080 Q1640,700 1700,420" stroke="#1A1410" strokeWidth={28} fill="none" />
      {[0, 1, 2, 3, 4].map((k) => (
        <path key={k} d={`M1700,420 q${-180 + k * 90},${-60 + Math.abs(k - 2) * 50} ${-260 + k * 130},${40 + Math.abs(k - 2) * 60}`} stroke="#0E1A12" strokeWidth={26} fill="none" strokeLinecap="round" />
      ))}
      <rect x={0} y={820} width={1920} height={260} fill="#1A1C24" />
      <rect x={0} y={800} width={1920} height={30} fill="#3A3E48" />
      {/* the bus stop sign */}
      <path d="M380,820 L380,420" stroke="#5A5E68" strokeWidth={14} />
      <rect x={300} y={360} width={160} height={90} rx={10} fill="#3E7CB1" stroke="#0B1026" strokeWidth={6} />
      <text x={380} y={420} textAnchor="middle" fontFamily={fonts.display} fontWeight={900} fontSize={44} fill="#FFFFFF">
        BUS
      </text>
      <circle cx={380} cy={420} r={260} fill="#FFC45A" opacity={0.12} />
      <Toon d={CAST.tomas} s={st(820, 1010, 2.6, 'scared', {pose: POSES.hold, hold: 'phoneLit', look: [0.3, -0.9], turn: 0.1})} />
      {/* his phone, big: the call has dropped */}
      <g transform="translate(1120,330) rotate(6)">
        <rect x={0} y={0} width={330} height={560} rx={40} fill="#1A1A1E" stroke="#0B1026" strokeWidth={8} />
        <rect x={20} y={50} width={290} height={470} rx={18} fill="#0E1E30" />
        <rect x={40} y={240} width={250} height={80} rx={14} fill="#000" opacity={0.6} />
        <text x={165} y={292} textAnchor="middle" fontFamily={fonts.display} fontWeight={900} fontSize={30} fill="#FF8A7A">
          CALL LOST
        </text>
      </g>
      <Words lines={[{t: 'MUM?', size: 230, col: '#FFFFFF'}]} x={60} y={40} />
      <text x={70} y={350} fontFamily={fonts.display} fontWeight={900} fontSize={60} fill="#FFD27A" stroke="#0B1026" strokeWidth={6} paintOrder="stroke">
        1:52 PM
      </text>
    </svg>
  </AbsoluteFill>
);

export const SeaThumbnailB: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <rect width={1920} height={1080} fill="#01020A" />
      <Stars frame={10} count={900} w={1920} h={1080} seed={9} maxR={2.8} />
      <rect x={0} y={640} width={1920} height={440} fill="#02040A" />
      {/* one cargo ship, dark, one window lit */}
      <g transform="translate(1000,700) scale(1.15)">
        <path d="M-420,0 L380,0 L440,-70 L-440,-70 Z" fill="#3A1A1A" stroke="#0B1026" strokeWidth={6} />
        <rect x={-440} y={-96} width={880} height={26} fill="#1A1C24" />
        <rect x={-420} y={-250} width={150} height={154} fill="#5A5E68" stroke="#0B1026" strokeWidth={5} />
        <rect x={-430} y={-280} width={170} height={30} fill="#5A5E68" stroke="#0B1026" strokeWidth={5} />
        <rect x={-371} y={-236} width={24} height={18} fill="#FFD27A" />
        <circle cx={-359} cy={-227} r={60} fill="#FFD27A" opacity={0.25} />
        {[-120, 150].map((cx) => (
          <path key={cx} d={`M${cx},-96 L${cx},-230 L${cx + 120},-170`} stroke="#6A5A2A" strokeWidth={8} fill="none" />
        ))}
      </g>
      <path d="M520,720 Q1000,740 1520,720" stroke="#1A2440" strokeWidth={4} fill="none" />
      <Words lines={[{t: 'LOST', size: 200, col: '#FFFFFF'}, {t: 'AT SEA', size: 150, col: '#FFD27A'}]} x={80} y={30} />
      <text x={1840} y={140} textAnchor="end" fontFamily={fonts.display} fontWeight={900} fontSize={64} fill="#FF8A7A" stroke="#0B1026" strokeWidth={6} paintOrder="stroke">
        NO SUN · NO GPS
      </text>
    </svg>
  </AbsoluteFill>
);

export const SeaThumbnailC: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <rect width={1920} height={1080} fill="#2A2220" />
      <circle cx={1300} cy={520} r={700} fill="#FFC77A" opacity={0.16} />
      <rect x={0} y={790} width={1920} height={30} fill="#5E4430" />
      <g transform="translate(980,800) scale(2.3)">
        <RadioSet x={0} y={0} on meter={0.3} frame={10} />
      </g>
      <Toon d={CAST.lola} s={st(640, 1150, 2.9, 'focused', {pose: POSES.hold, hold: 'mic', turn: 0.55, look: [1, 0.1], outfit: 'cold'})} />
      <Clock x={1690} y={200} r={120} time="5:59" />
      <Words lines={[{t: '6:00', size: 260, col: '#FFFFFF'}, {t: 'EVERY MORNING', size: 92, col: '#FFD27A'}]} x={60} y={20} />
    </svg>
  </AbsoluteFill>
);
