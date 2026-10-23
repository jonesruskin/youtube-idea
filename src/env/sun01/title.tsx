import React from 'react';
import {interpolate} from 'remotion';
import {useShot} from '../../engine/shot-context';
import {Bloom} from '../../fx/cinema/atmos';
import {Stars} from '../../fx/sky';
import {fonts} from '../../theme';
import {Stage} from '../common';

/** Title: the black disc of a dead Sun, its last corona fading, then the words. */
export const Title: React.FC = () => {
  const {frame, t, dur} = useShot();
  const corona = interpolate(t, [0, dur], [1, 0.25]);
  const text = interpolate(t, [0.35, 1.1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const track = interpolate(t, [0, dur], [34, 22]);
  const out = interpolate(t, [dur - 0.5, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Stage bg="#000">
      <g opacity={out}>
        <Stars frame={frame} count={260} seed={77} maxR={1.6} opacity={0.6} />
        <g transform={`translate(960,430) scale(${1 + t * 0.012})`}>
          <Bloom x={0} y={0} r={420} color="#FF9A4A" opacity={0.35 * corona} />
          <circle r={170} fill="none" stroke="#FFD08A" strokeWidth={6} opacity={0.6 * corona} />
          {Array.from({length: 48}, (_, i) => {
            const a = (i / 48) * Math.PI * 2;
            const l = 30 + ((i * 37) % 70) * corona;
            return <path key={i} d={`M${Math.cos(a) * 172},${Math.sin(a) * 172} L${Math.cos(a) * (172 + l)},${Math.sin(a) * (172 + l)}`} stroke="#FFC37A" strokeWidth={2.5} opacity={0.5 * corona} />;
          })}
          <circle r={168} fill="#000" />
        </g>
        <text x={960} y={760} textAnchor="middle" fontFamily={fonts.display} fontWeight={300} fontSize={92} letterSpacing={track} fill="#F4EFE6" opacity={text}>
          THE SUN WENT OUT
        </text>
      </g>
    </Stage>
  );
};
