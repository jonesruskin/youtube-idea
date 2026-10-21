import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, fonts} from '../theme';

const CIRCLED = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

/** "Executor's Footnote" — the science layer, woven in rather than bolted on as a segment. */
export const Footnote: React.FC<{n: number; text: string; fps: number; duration: number}> = ({n, text, fps, duration}) => {
  const frame = useCurrentFrame();
  const t = frame / fps;
  const start = 0.9;
  const hold = Math.min(duration - start - 0.5, Math.max(6, text.length / 16));
  const inP = interpolate(t, [start, start + 0.45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const outP = interpolate(t, [start + hold, start + hold + 0.4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const op = inP * (1 - outP);
  if (op <= 0) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 70,
          bottom: 70,
          width: 700,
          transform: `translateX(${(1 - inP) * -40}px)`,
          opacity: op,
          background: 'rgba(11,16,38,0.88)',
          border: `2px solid ${C.gold}`,
          borderRadius: 18,
          padding: '22px 28px 24px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.45)',
          display: 'flex',
          gap: 20,
        }}
      >
        <div style={{fontFamily: fonts.will, fontWeight: 700, fontSize: 64, lineHeight: '56px', color: C.gold}}>{CIRCLED[n] ?? n}</div>
        <div>
          <div style={{fontFamily: fonts.mono, fontSize: 18, letterSpacing: 4, color: C.gold, marginBottom: 8}}>EXECUTOR’S FOOTNOTE</div>
          <div style={{fontFamily: fonts.ui, fontSize: 27, lineHeight: '36px', color: C.pearl}}>{text}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
