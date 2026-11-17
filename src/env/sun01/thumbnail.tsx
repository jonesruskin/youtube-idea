import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Figure} from '../../characters/Figure';
import {Bloom, Snow} from '../../fx/cinema/atmos';
import {Stars} from '../../fx/sky';
import {WatchCloseUp} from '../../fx/cinema/Watch';
import {fonts} from '../../theme';
import {CityBlocks, P} from './parts';

/**
 * File 001 thumbnail — one impossible image + two words, readable at phone size:
 * a black Sun with its corona dying over a frozen city; you, in the orange parka, looking up;
 * the watch glowing red at 08:20 (the series' hook). Text: NO SUN.
 */
export const SunThumbnail: React.FC<{text: string}> = ({text}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <defs>
        <linearGradient id="thsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#02040C" />
          <stop offset="0.7" stopColor="#0E1A3A" />
          <stop offset="1" stopColor="#2A4A7A" />
        </linearGradient>
      </defs>
      <rect width={1920} height={1080} fill="url(#thsky)" />
      <Stars frame={0} count={260} seed={5} maxR={2.4} />
      {/* the dead Sun */}
      <g transform="translate(1340,330)">
        <Bloom x={0} y={0} r={620} color="#FF7A2A" opacity={0.75} />
        <circle r={262} fill="none" stroke="#FFD08A" strokeWidth={22} opacity={0.95} />
        {Array.from({length: 60}, (_, i) => {
          const a = (i / 60) * Math.PI * 2;
          const l = 40 + ((i * 37) % 90);
          return <path key={i} d={`M${Math.cos(a) * 270},${Math.sin(a) * 270} L${Math.cos(a) * (270 + l)},${Math.sin(a) * (270 + l)}`} stroke="#FFB867" strokeWidth={6} opacity={0.75} />;
        })}
        <circle r={250} fill="#000" />
      </g>
      <CityBlocks seed={12} base={860} color="#0E1834" minH={220} maxH={520} lights={0.12} snow={1} frame={0} />
      <rect x={0} y={840} width={1920} height={260} fill={P.snow} />
      <rect x={0} y={840} width={1920} height={260} fill="#2A3A6A" opacity={0.35} />
      <Snow frame={40} density={0.5} w={1920} h={1080} x0={0} y0={0} />
      {/* you, looking up */}
      <Figure char="you" x={560} y={1150} scale={2.05} pose="stand" expression="alarmed" look={[0.6, -1]} hoodUp breath rim />
      {/* the watch, glowing red */}
      <g transform="translate(910,690) scale(0.36) rotate(-8) translate(-960,-540)">
        <Bloom x={960} y={540} r={900} color="#FF3A2A" opacity={0.55} />
        <WatchCloseUp main="08:20" light="starlight" frame={0} alarm bare />
      </g>
      {/* two words */}
      <g transform="rotate(-3,560,180)">
        <text x={90} y={250} fontFamily={fonts.display} fontWeight={900} fontSize={230} fill="#000" opacity={0.6} transform="translate(10,12)">
          {text.split(' ')[0]}
        </text>
        <text x={90} y={250} fontFamily={fonts.display} fontWeight={900} fontSize={230} fill="#FFFFFF">
          {text.split(' ')[0]}
        </text>
        <text x={90} y={480} fontFamily={fonts.display} fontWeight={900} fontSize={230} fill="#000" opacity={0.6} transform="translate(10,12)">
          {text.split(' ').slice(1).join(' ')}
        </text>
        <text x={90} y={480} fontFamily={fonts.display} fontWeight={900} fontSize={230} fill="#FF8A2A">
          {text.split(' ').slice(1).join(' ')}
        </text>
      </g>
    </svg>
  </AbsoluteFill>
);
