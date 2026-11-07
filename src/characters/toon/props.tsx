import React from 'react';
import {C} from '../../theme';

export type PropKind =
  | 'torch'
  | 'tape'
  | 'bottle'
  | 'mug'
  | 'rice'
  | 'candles'
  | 'treats'
  | 'phone'
  | 'phoneLit'
  | 'keyString'
  | 'thermal'
  | 'lantern'
  | 'chalk'
  | 'blanket'
  | 'cane'
  | 'toast'
  | 'radio'
  | 'match'
  | 'drawing'
  | 'bag'
  | 'photo'
  | 'tideTable'
  | 'ear'
  | 'tubeCase'
  | 'receiver'
  | 'list'
  | 'dish'
  | 'mic'
  | 'sunDrawing';

/** Props drawn at the hand position (origin = hand centre). R = the holder's head radius. */
export const HeldProp: React.FC<{kind: PropKind; R: number; frame: number}> = ({kind, R, frame}) => {
  const ink = C.ink;
  const sw = Math.max(2.5, R * 0.06);
  switch (kind) {
    case 'torchOff' as PropKind:
      // the same torch, switched off (lit streets and stairwells: nobody shines a torch under a streetlight)
      return (
        <g>
          <rect x={-R * 0.12} y={-R * 0.12} width={R * 0.7} height={R * 0.24} rx={R * 0.06} fill="#3A3F52" stroke={ink} strokeWidth={sw} />
          <rect x={R * 0.52} y={-R * 0.17} width={R * 0.16} height={R * 0.34} rx={R * 0.05} fill="#C9CED6" stroke={ink} strokeWidth={sw} />
          <circle cx={R * 0.7} cy={0} r={R * 0.12} fill="#8A8F9C" />
        </g>
      );
    case 'torch':
      return (
        <g>
          <path d={`M${R * 0.7},0 L${R * 9},${-R * 2.6} L${R * 9},${R * 2.6} Z`} fill="url(#torchCone)" style={{mixBlendMode: 'screen'}} />
          <defs>
            <linearGradient id="torchCone" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#FFF4D6" stopOpacity={0.55} />
              <stop offset="1" stopColor="#FFF4D6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <circle cx={R * 0.7} cy={0} r={R * 0.5} fill="#FFF4D6" opacity={0.35} style={{mixBlendMode: 'screen'}} />
          <rect x={-R * 0.12} y={-R * 0.12} width={R * 0.7} height={R * 0.24} rx={R * 0.06} fill="#3A3F52" stroke={ink} strokeWidth={sw} />
          <rect x={R * 0.52} y={-R * 0.17} width={R * 0.16} height={R * 0.34} rx={R * 0.05} fill="#C9CED6" stroke={ink} strokeWidth={sw} />
          <circle cx={R * 0.7} cy={0} r={R * 0.14} fill="#FFF6D6" />
        </g>
      );
    case 'tape':
      return <circle cx={0} cy={-R * 0.2} r={R * 0.22} fill="#C9B88A" stroke={ink} strokeWidth={sw} />;
    case 'bottle':
      return (
        <g>
          <rect x={-R * 0.14} y={-R * 0.7} width={R * 0.28} height={R * 0.62} rx={R * 0.08} fill="#7FC2E8" opacity={0.9} stroke={ink} strokeWidth={sw} />
          <rect x={-R * 0.07} y={-R * 0.85} width={R * 0.14} height={R * 0.16} fill="#3E7CB1" stroke={ink} strokeWidth={sw * 0.8} />
        </g>
      );
    case 'mug':
      return (
        <g>
          <rect x={-R * 0.16} y={-R * 0.38} width={R * 0.32} height={R * 0.36} rx={R * 0.06} fill="#F4EFE6" stroke={ink} strokeWidth={sw} />
          <path d={`M${R * 0.16},${-R * 0.3} q${R * 0.14},0 ${R * 0.12},${R * 0.14} q-${R * 0.02},${R * 0.1} -${R * 0.12},${R * 0.08}`} stroke={ink} strokeWidth={sw} fill="none" />
        </g>
      );
    case 'rice':
      return (
        <g>
          <path d={`M${-R * 0.3},${-R * 0.75} L${R * 0.3},${-R * 0.75} L${R * 0.36},${R * 0.05} L${-R * 0.36},${R * 0.05} Z`} fill="#F4EFE6" stroke={ink} strokeWidth={sw} />
          <rect x={-R * 0.22} y={-R * 0.5} width={R * 0.44} height={R * 0.2} fill="#D9443A" />
        </g>
      );
    case 'candles':
      return (
        <g>
          {[-1, 0, 1].map((k) => (
            <rect key={k} x={k * R * 0.14 - R * 0.05} y={-R * 0.6} width={R * 0.1} height={R * 0.6} fill="#F4EFE6" stroke={ink} strokeWidth={sw * 0.7} />
          ))}
        </g>
      );
    case 'treats':
      return (
        <g>
          <rect x={-R * 0.26} y={-R * 0.6} width={R * 0.52} height={R * 0.62} rx={R * 0.08} fill="#E9C46A" stroke={ink} strokeWidth={sw} />
          <circle cx={0} cy={-R * 0.3} r={R * 0.13} fill="#B5651D" />
        </g>
      );
    case 'phone':
    case 'phoneLit':
      return (
        <g>
          {kind === 'phoneLit' && <circle cx={0} cy={-R * 0.3} r={R * 0.9} fill="#E8F2FF" opacity={0.18} />}
          <rect x={-R * 0.13} y={-R * 0.55} width={R * 0.26} height={R * 0.46} rx={R * 0.05} fill={kind === 'phoneLit' ? '#DCEBFF' : '#1A1E2A'} stroke={ink} strokeWidth={sw} />
        </g>
      );
    case 'keyString': {
      // a key on a string, swinging in a circle: the demo for "we are still going round"
      const a = frame * 0.18;
      const L = R * 1.6;
      const kx = Math.cos(a) * L;
      const ky = Math.sin(a) * L * 0.35 + L * 0.55;
      return (
        <g>
          <path d={`M0,0 L${kx},${ky}`} stroke="#E8E2D6" strokeWidth={sw * 0.6} />
          <circle cx={kx} cy={ky} r={R * 0.12} fill="#E8B04B" stroke={ink} strokeWidth={sw * 0.7} />
          <rect x={kx} y={ky - R * 0.03} width={R * 0.22} height={R * 0.06} fill="#E8B04B" />
        </g>
      );
    }
    case 'thermal':
      return (
        <g>
          <rect x={-R * 0.3} y={-R * 0.5} width={R * 0.8} height={R * 0.5} rx={R * 0.08} fill="#E9C46A" stroke={ink} strokeWidth={sw} />
          <circle cx={R * 0.38} cy={-R * 0.25} r={R * 0.13} fill="#1A1E2A" stroke={ink} strokeWidth={sw * 0.7} />
          <rect x={-R * 0.22} y={-R * 0.42} width={R * 0.36} height={R * 0.26} fill="#3A1A4A" />
          <circle cx={-R * 0.04} cy={-R * 0.29} r={R * 0.07} fill="#FFB25A" opacity={0.6 + 0.4 * Math.sin(frame * 0.3)} />
        </g>
      );
    case 'lantern':
      return (
        <g>
          <circle cx={0} cy={R * 0.5} r={R * 1.4} fill="#FFB867" opacity={0.16} />
          <rect x={-R * 0.18} y={R * 0.15} width={R * 0.36} height={R * 0.45} rx={R * 0.06} fill="#FFE3A6" stroke={ink} strokeWidth={sw} />
          <path d={`M0,${R * 0.05} L0,${R * 0.15}`} stroke={ink} strokeWidth={sw} />
        </g>
      );
    case 'chalk':
      return <rect x={-R * 0.04} y={-R * 0.22} width={R * 0.08} height={R * 0.22} fill="#F4EFE6" stroke={ink} strokeWidth={sw * 0.5} />;
    case 'blanket':
      return <path d={`M${-R * 0.6},${-R * 0.3} L${R * 0.6},${-R * 0.4} L${R * 0.7},${R * 0.6} L${-R * 0.5},${R * 0.7} Z`} fill="#4FA3A5" stroke={ink} strokeWidth={sw} />;
    case 'list':
      // a shopping list on a torn sheet
      return (
        <g transform="rotate(-8)">
          <rect x={-R * 0.22} y={-R * 0.62} width={R * 0.44} height={R * 0.6} fill="#FFFDF6" stroke={ink} strokeWidth={sw * 0.6} />
          {[0, 1, 2, 3].map((k) => <path key={k} d={`M${-R * 0.15},${-R * (0.5 - k * 0.12)} l${R * (0.24 - (k % 2) * 0.06)},0`} stroke="#3E7CB1" strokeWidth={sw * 0.45} />)}
        </g>
      );
    case 'dish':
      // Mr. Ito's transmitter dish, carried in both arms
      return (
        <g>
          <path d={`M${-R * 0.9},${-R * 0.1} Q0,${R * 0.75} ${R * 0.9},${-R * 0.1} Q0,${R * 0.25} ${-R * 0.9},${-R * 0.1} Z`} fill="#DCE2EA" stroke={ink} strokeWidth={sw} />
          <path d={`M0,${R * 0.3} L0,${-R * 0.55}`} stroke={ink} strokeWidth={sw * 0.8} />
          <circle cx={0} cy={-R * 0.58} r={R * 0.07} fill="#3A3442" />
        </g>
      );
    case 'mic':
      // the ham radio's hand microphone, cord curling away
      return (
        <g>
          <path d={`M0,${R * 0.1} q${R * 0.3},${R * 0.4} ${R * 0.05},${R * 0.9}`} stroke={ink} strokeWidth={sw * 0.7} fill="none" strokeDasharray={`${sw} ${sw * 0.7}`} />
          <rect x={-R * 0.12} y={-R * 0.34} width={R * 0.24} height={R * 0.42} rx={R * 0.1} fill="#2A2E3A" stroke={ink} strokeWidth={sw * 0.6} />
          <rect x={-R * 0.08} y={-R * 0.3} width={R * 0.16} height={R * 0.12} rx={R * 0.04} fill="#8A8F9C" />
        </g>
      );
    case 'receiver':
      // a 1980s handset held to the ear, its curly cord dropping away
      return (
        <g>
          <path d={`M${-R * 0.1},${R * 0.1} q${R * 0.3},${R * 0.5} ${R * 0.1},${R * 1.1}`} stroke={ink} strokeWidth={sw * 0.8} fill="none" strokeDasharray={`${sw} ${sw * 0.7}`} />
          <path d={`M${-R * 0.18},${-R * 0.42} Q${-R * 0.34},0 ${-R * 0.16},${R * 0.42}`} stroke="#A83A42" strokeWidth={sw * 2.6} fill="none" strokeLinecap="round" />
          <path d={`M${-R * 0.18},${-R * 0.42} Q${-R * 0.34},0 ${-R * 0.16},${R * 0.42}`} stroke={ink} strokeWidth={sw * 0.6} fill="none" opacity={0.6} />
        </g>
      );
    case 'cane':
      return <path d={`M0,${-R * 0.1} L${R * 0.1},${R * 1.6} M0,${-R * 0.1} q-${R * 0.25},-${R * 0.05} -${R * 0.25},${R * 0.15}`} stroke="#6E4A2E" strokeWidth={sw * 1.4} fill="none" strokeLinecap="round" />;
    case 'toast':
      return <path d={`M${-R * 0.22},0 L${-R * 0.22},${-R * 0.34} Q0,${-R * 0.5} ${R * 0.22},${-R * 0.34} L${R * 0.22},0 Z`} fill="#E3A15A" stroke={ink} strokeWidth={sw} />;
    case 'radio':
      return (
        <g>
          <rect x={-R * 0.4} y={-R * 0.45} width={R * 0.8} height={R * 0.5} rx={R * 0.08} fill="#8E5E3A" stroke={ink} strokeWidth={sw} />
          <circle cx={-R * 0.15} cy={-R * 0.2} r={R * 0.12} fill="#3A2A22" />
          <rect x={R * 0.05} y={-R * 0.35} width={R * 0.28} height={R * 0.1} fill="#FFD08A" />
        </g>
      );
    case 'match':
      return (
        <g>
          <path d={`M0,0 L${R * 0.3},${-R * 0.3}`} stroke="#E8D3A0" strokeWidth={sw} />
          <circle cx={R * 0.32} cy={-R * 0.42} r={R * 0.4} fill="#FFB867" opacity={0.25} />
          <path d={`M${R * 0.3},${-R * 0.3} q-${R * 0.08},-${R * 0.12} 0,-${R * 0.26} q${R * 0.08},${R * 0.14} 0,${R * 0.26}`} fill="#FFD27A" />
        </g>
      );
    case 'drawing':
      // a child's drawing of the Sun — in grey, because she has forgotten its colour
      return (
        <g transform={`translate(${-R * 0.2},${-R * 1.1})`}>
          <rect x={-R * 0.7} y={-R * 0.5} width={R * 1.4} height={R * 1.0} fill="#FFFDF6" stroke={ink} strokeWidth={sw} />
          <circle cx={0} cy={0} r={R * 0.22} fill="none" stroke="#8A8F9C" strokeWidth={sw} />
          {Array.from({length: 8}, (_, k) => (
            <path key={k} d={`M0,${-R * 0.3} L0,${-R * 0.4}`} stroke="#8A8F9C" strokeWidth={sw * 0.8} transform={`rotate(${k * 45})`} />
          ))}
        </g>
      );
    case 'sunDrawing':
      // Mira's drawing from the last morning: a yellow sun with rays, and a small girl standing under it.
      // Held by its top edge, so it hangs below the hand and never covers her face.
      return (
        <g transform={`translate(${-R * 0.1},${R * 0.48})`}>
          <rect x={-R * 0.7} y={-R * 0.5} width={R * 1.4} height={R * 1.0} fill="#FFFDF6" stroke={ink} strokeWidth={sw} />
          <circle cx={0} cy={-R * 0.12} r={R * 0.2} fill="#FFC93C" stroke="#E08A1E" strokeWidth={sw * 0.7} />
          {Array.from({length: 8}, (_, k) => (
            <path key={k} d={`M0,${-R * 0.27} L0,${-R * 0.37}`} stroke="#F2A12E" strokeWidth={sw * 0.9} strokeLinecap="round" transform={`translate(0,${-R * 0.12}) rotate(${k * 45})`} />
          ))}
          <circle cx={0} cy={R * 0.24} r={R * 0.05} fill="#7A4E30" />
          <path d={`M0,${R * 0.29} L0,${R * 0.4} M${-R * 0.06},${R * 0.48} L0,${R * 0.4} L${R * 0.06},${R * 0.48} M${-R * 0.07},${R * 0.33} L${R * 0.07},${R * 0.33}`} stroke="#C2464F" strokeWidth={sw * 0.8} strokeLinecap="round" />
        </g>
      );
    case 'bag':
      // Mr. Ito's canvas bag, packed and ready
      return (
        <g>
          <path d={`M${-R * 0.1},0 Q${R * 0.05},${R * 0.5} ${R * 0.2},${R * 0.55}`} stroke="#6E5236" strokeWidth={sw * 1.2} fill="none" />
          <rect x={-R * 0.45} y={R * 0.5} width={R * 1.0} height={R * 0.8} rx={R * 0.1} fill="#B8A07A" stroke={ink} strokeWidth={sw} />
          <rect x={-R * 0.45} y={R * 0.5} width={R * 1.0} height={R * 0.25} rx={R * 0.08} fill="#9A845E" stroke={ink} strokeWidth={sw * 0.7} />
        </g>
      );
    case 'photo':
      // the 1919 eclipse print: black Moon, pale corona, three straight lines right through it
      return (
        <g transform={`translate(${R * 0.2},${-R * 0.7})`}>
          <rect x={-R * 0.6} y={-R * 0.45} width={R * 1.2} height={R * 0.9} fill="#F4EFE6" stroke={ink} strokeWidth={sw} />
          <rect x={-R * 0.5} y={-R * 0.36} width={R * 1.0} height={R * 0.72} fill="#3A3836" />
          <circle r={R * 0.22} fill="#E8E2D4" opacity={0.4} />
          {[18, 74, 142].map((a) => (
            <path key={a} d={`M${Math.cos((a * Math.PI) / 180) * -R * 0.34},${Math.sin((a * Math.PI) / 180) * -R * 0.34} L${Math.cos((a * Math.PI) / 180) * R * 0.34},${Math.sin((a * Math.PI) / 180) * R * 0.34}`} stroke="#F4EFE6" strokeWidth={sw * 0.4} opacity={0.8} />
          ))}
          <circle r={R * 0.11} fill="#0A0A0C" />
        </g>
      );
    case 'tideTable':
      return (
        <g transform={`translate(${R * 0.1},${-R * 0.5})`}>
          <rect x={-R * 0.4} y={-R * 0.5} width={R * 0.8} height={R * 1.0} fill="#FFFDF6" stroke={ink} strokeWidth={sw} transform="rotate(-8)" />
          {Array.from({length: 5}, (_, k) => (
            <path key={k} d={`M${-R * 0.28},${-R * 0.3 + k * R * 0.17} L${R * 0.26},${-R * 0.34 + k * R * 0.17}`} stroke="#5B6C8F" strokeWidth={sw * 0.5} transform="rotate(-8)" />
          ))}
        </g>
      );
    case 'ear':
      // "an ear": a home-made receiver with a little dish and a dial
      return (
        <g>
          <rect x={-R * 0.45} y={-R * 0.4} width={R * 0.9} height={R * 0.55} rx={R * 0.08} fill="#5A5E6A" stroke={ink} strokeWidth={sw} />
          <circle cx={-R * 0.2} cy={-R * 0.13} r={R * 0.13} fill="#9FE8FF" opacity={0.8} />
          <rect x={R * 0.05} y={-R * 0.3} width={R * 0.28} height={R * 0.08} fill="#7FE8FF" />
          <path d={`M${R * 0.3},${-R * 0.4} L${R * 0.55},${-R * 1.0}`} stroke={ink} strokeWidth={sw} />
          <path d={`M${R * 0.25},${-R * 1.25} Q${R * 0.55},${-R * 0.75} ${R * 0.95},${-R * 1.05} Q${R * 0.65},${-R * 1.3} ${R * 0.25},${-R * 1.25} Z`} fill="#C9CED6" stroke={ink} strokeWidth={sw} />
        </g>
      );
    case 'tubeCase':
      // the telescope's long leather case, carried in both arms
      return (
        <g transform={`rotate(-12)`}>
          <rect x={-R * 2.2} y={-R * 0.32} width={R * 3.4} height={R * 0.64} rx={R * 0.3} fill="#7A4E30" stroke={ink} strokeWidth={sw} />
          <rect x={-R * 2.2} y={-R * 0.32} width={R * 0.5} height={R * 0.64} rx={R * 0.2} fill="#5A3822" stroke={ink} strokeWidth={sw * 0.8} />
          <path d={`M${-R * 1.4},${-R * 0.32} Q${-R * 0.4},${-R * 1.0} ${R * 0.6},${-R * 0.32}`} stroke="#5A3822" strokeWidth={sw} fill="none" />
        </g>
      );
    default:
      return null;
  }
};
