import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {resolveAt} from '../characters/toon/acting';
import {useShot} from '../engine/shot-context';
import {fonts} from '../theme';

/**
 * The two kinds of on-screen text File 001 allows:
 *  - a CALLOUT: one bold word or number that punches the line being spoken (pops with overshoot, holds, fades);
 *  - the DAY TAG: when the story jumps in time — "DAY 7" and the outside temperature, ticking into place.
 */
const POS = {center: 540, top: 230, low: 880, left: 540, right: 540} as const;

export const Callout: React.FC = () => {
  const {shot, t} = useShot();
  const c = shot.callout;
  if (!c) return null;
  const t0 = resolveAt(c.at ?? 0.2, shot.timedLines as any);
  const k = t - t0;
  if (k < 0) return null;
  const hold = Math.min(2.2, Math.max(1.2, shot.duration - t0 - 0.3));
  const pop = interpolate(k, [0, 0.12, 0.24], [0.4, 1.12, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  const out = interpolate(k, [hold, hold + 0.25], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (out <= 0) return null;
  const y = POS[c.pos ?? 'low'];
  const x = c.pos === 'left' ? 520 : c.pos === 'right' ? 1400 : 960;
  const size = c.text.length > 12 ? 92 : c.text.length > 7 ? 120 : 150;
  const tilt = (c.text.length % 2 ? -1 : 1) * 2;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%">
        <g transform={`translate(${x},${y}) rotate(${tilt}) scale(${pop})`} opacity={Math.min(1, k * 8) * out}>
          <text textAnchor="middle" dominantBaseline="central" fontFamily={fonts.display} fontWeight={900} fontSize={size} letterSpacing={4} fill="#000" opacity={0.45} transform="translate(6,10)">
            {c.text}
          </text>
          <text textAnchor="middle" dominantBaseline="central" fontFamily={fonts.display} fontWeight={900} fontSize={size} letterSpacing={4} fill={c.color ?? '#FFF6E0'} stroke="#0B1026" strokeWidth={size * 0.11} paintOrder="stroke" strokeLinejoin="round">
            {c.text}
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const DayTag: React.FC = () => {
  const {shot, t} = useShot();
  const h = shot.hud;
  if (!h) return null;
  const inK = interpolate(t, [0.05, 0.45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const outK = interpolate(t, [Math.min(3.6, shot.duration - 0.3), Math.min(3.9, shot.duration)], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // the temperature ticks down to its value
  const temp = Math.round(interpolate(t, [0.3, 1.1], [h.temp + Math.min(12, Math.abs(h.temp) * 0.3 + 3), h.temp], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const cold = h.temp <= 0;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%">
        <g transform={`translate(${-60 + 150 * inK},${shot.letterbox ? 220 : 150})`} opacity={inK * outK}>
          <rect x={-20} y={-74} width={10} height={150} fill={cold ? '#9FD8FF' : '#FFB25A'} />
          <text x={10} y={-10} fontFamily={fonts.display} fontWeight={900} fontSize={84} fill="#FFF6E0" stroke="#0B1026" strokeWidth={10} paintOrder="stroke" letterSpacing={3}>
            DAY {h.day}
          </text>
          <text x={14} y={62} fontFamily={fonts.mono} fontWeight={600} fontSize={52} fill={cold ? '#9FD8FF' : '#FFD08A'} stroke="#0B1026" strokeWidth={8} paintOrder="stroke">
            {temp > 0 ? `+${temp}` : temp === 0 ? '0' : `−${Math.abs(temp)}`}°C
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
