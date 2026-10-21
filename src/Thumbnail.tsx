import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Figure} from './characters/Figure';
import {Glow, Stars} from './fx/sky';
import {Ship} from './fx/vey';
import {C, fonts} from './theme';

/**
 * Case-file thumbnail system: stamped heir number, the glowing inheritance, one reaction, ≤3 words.
 * Deliberately different from the genre's black-stickman + "TWO WORDS." look.
 */
export const Thumbnail: React.FC<{text: string; heir: string}> = ({text, heir}) => {
  const [a, b] = text.includes(' BY ') ? text.split(' BY ') : [text, ''];
  return (
    <AbsoluteFill style={{background: '#02030A'}}>
      <svg viewBox="0 0 1280 720" width="100%" height="100%">
        <rect width={1280} height={720} fill="#060A20" />
        <Stars frame={0} count={260} w={1280} h={720} maxR={2} />
        <Glow id="tMoonGlow" cx={1060} cy={200} r={330} color="#E8E6FF" opacity={0.35} />
        <circle cx={1060} cy={200} r={210} fill="#D8D6DE" stroke={C.ink} strokeWidth={8} />
        <circle cx={990} cy={150} r={44} fill="#B8B6C0" />
        <circle cx={1120} cy={260} r={58} fill="#B8B6C0" />
        <circle cx={1150} cy={120} r={26} fill="#B8B6C0" />
        <Ship
          x={470}
          y={470}
          scale={2.7}
          frame={0}
          tilt={-8}
          pilot={<Figure char="jonah" x={34} y={40} scale={0.42} pose="pilotJoy" expression="ecstatic" rim={false} look={[0.6, -0.4]} />}
        />
        {/* torn case-file strip */}
        <path d="M0,540 L1280,520 L1280,720 L0,720 Z" fill="#EFE6D3" />
        <path d="M0,540 l40,-8 l30,10 l50,-6 l40,8 l60,-10 l50,6 l70,-8 l40,10 l60,-8 l50,6 l70,-10 l40,8 l60,-6 l50,8 l70,-10 l40,6 l60,-8 l50,8 l70,-8 l40,6 l60,-8 l50,6 L1280,520" fill="none" stroke={C.ink} strokeWidth={6} />
        <text x={50} y={665} fill={C.ink} fontFamily={fonts.display} fontWeight={900} fontSize={112} letterSpacing={-2}>
          {a}
          {b && (
            <tspan fill={C.stamp}>
              {' '}BY {b}
            </tspan>
          )}
        </text>
        <g transform="translate(190,100) rotate(-10)">
          <rect x={-160} y={-48} width={320} height={96} rx={10} fill="#00000066" stroke={C.stamp} strokeWidth={9} />
          <text x={0} y={18} textAnchor="middle" fill={C.stamp} fontFamily={fonts.display} fontWeight={900} fontSize={46}>
            {heir}
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
