import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Figure} from '../characters/Figure';
import {Stars} from '../fx/sky';
import {BD, Coin} from '../env/bd01/shared';
import {rand} from '../fx/sky';
import {C, fonts} from '../theme';

/**
 * Borrowed Day · Ep1 thumbnail: one impossible image (gold raining on one man in an empty, floodlit
 * stadium) plus one number. The number is the hook: "$76K" a minute, while you brush your teeth.
 */
export const Bd01Thumb: React.FC<{text: string}> = ({text}) => {
  const R = rand(12);
  const [big, ...rest] = text.split(' ');
  return (
    <AbsoluteFill style={{background: '#070A1C'}}>
      <svg viewBox="0 0 1280 720" width="100%" height="100%">
        <defs>
          <radialGradient id="thLight" cx="0.32" cy="0.15" r="0.9">
            <stop offset="0" stopColor="#FFF3D0" stopOpacity={0.55} />
            <stop offset="0.5" stopColor="#2D4A86" stopOpacity={0.25} />
            <stop offset="1" stopColor="#070A1C" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="thVig2" cx="0.4" cy="0.5" r="0.85">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.55} />
          </radialGradient>
        </defs>
        <Stars frame={0} count={120} w={1280} h={400} seed={4} opacity={0.6} maxR={1.6} />
        {/* empty stands */}
        <path d="M-200,470 A840,300 0 0,1 1480,470 L1480,720 L-200,720 Z" fill="#1B2A4E" />
        {Array.from({length: 9}, (_, i) => (
          <path key={i} d={`M-200,${470 + i * 14} A840,${300 - i * 22} 0 0,1 1480,${470 + i * 14}`} fill="none" stroke="#0B1026" strokeWidth={4} opacity={0.7} />
        ))}
        <path d="M-200,560 A840,160 0 0,1 1480,560 L1480,720 L-200,720 Z" fill="#2F7D4A" />
        <rect x={0} y={0} width={1280} height={720} fill="url(#thLight)" />
        {[110, 560].map((x) => (
          <g key={x}>
            <rect x={x} y={40} width={120} height={40} rx={4} fill="#1A2140" />
            {Array.from({length: 8}, (_, k) => (
              <rect key={k} x={x + 6 + (k % 4) * 28} y={46 + Math.floor(k / 4) * 17} width={22} height={13} rx={2} fill="#FFF8E4" />
            ))}
          </g>
        ))}
        {/* coins raining */}
        {Array.from({length: 70}, (_, i) => (
          <Coin key={i} x={R() * 760} y={R() * 700} r={10 + R() * 12} spin={R() * 6} />
        ))}
        <ellipse cx={380} cy={690} rx={330} ry={40} fill={BD.gold} stroke={BD.goldDeep} strokeWidth={4} />
        {Array.from({length: 40}, (_, i) => (
          <Coin key={`p${i}`} x={90 + R() * 580} y={665 + R() * 40} r={13} spin={R() * 6} />
        ))}
        <Figure char="richest" x={390} y={760} scale={1.55} pose="armsUp" expression="ecstatic" look={[0.2, -1]} />
        <rect x={0} y={0} width={1280} height={720} fill="url(#thVig2)" />
        <text x={1240} y={330} textAnchor="end" fill={BD.gold} stroke={C.ink} strokeWidth={16} paintOrder="stroke" fontFamily={fonts.display} fontWeight={900} fontSize={190} letterSpacing={-6}>
          {big}
        </text>
        <text x={1240} y={460} textAnchor="end" fill="#FFFFFF" stroke={C.ink} strokeWidth={14} paintOrder="stroke" fontFamily={fonts.display} fontWeight={900} fontSize={96} letterSpacing={-3}>
          {rest.join(' ')}
        </text>
      </svg>
    </AbsoluteFill>
  );
};
