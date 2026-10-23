import React from 'react';
import {interpolate} from 'remotion';
import {useShot} from '../../engine/shot-context';
import {Cine, Plane} from '../../fx/cinema/camera';
import {fmtCountdown, WatchCloseUp, type WatchLight} from '../../fx/cinema/Watch';
import {Stage} from '../common';

/** The watch, full frame. Countdown mode ticks once per second-of-story; Day mode shows DAY ### and °C. */
export const WatchScene: React.FC = () => {
  const {props, frame, t, dur, progress} = useShot();
  const light = (props.light ?? 'cold') as WatchLight;
  let main = '';
  let sub: string | undefined;
  let tick = 0;
  if (props.mode === 'countdown') {
    const from = props.from as number;
    const to = props.to as number;
    const steps = from - to;
    // Land on `to` a little before the cut so the last digit is readable.
    const k = Math.min(steps, Math.floor(interpolate(t, [0.3, Math.max(0.6, dur - 0.5)], [0, steps + 0.999], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})));
    main = fmtCountdown(from - k);
    const frac = interpolate(t, [0.3, Math.max(0.6, dur - 0.5)], [0, steps + 0.999], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) % 1;
    tick = frac < 0.06 && t > 0.4 ? 1 : 0;
  } else {
    const day = props.day as number;
    main = `DAY ${String(day).padStart(3, '0')}`;
    const temp = props.temp as number;
    sub = `${temp < 0 ? '−' : ''}${Math.abs(temp)}°C`;
    tick = t < 0.12 ? 1 : 0;
  }
  const frost = light === 'cold' || light === 'starlight' ? 0.35 + 0.25 * progress : 0;
  const flash = props.mode === 'countdown' ? interpolate(t, [0, 0.15, 0.6], [0, 1, 0], {extrapolateRight: 'clamp'}) : 0;
  const z0 = props.mode === 'day' ? 1.12 : 1.04;
  return (
    <Stage bg="#000">
      <Cine keys={[[0, z0, 960, 540, props.mode === 'day' ? -2 : 1.5], [1, z0 + 0.1, 960, 530, props.mode === 'day' ? 1 : -0.5]]} progress={progress} frame={frame} handheld={0.6}>
        <Plane depth={1}>
          <WatchCloseUp main={main} sub={sub} light={light} frame={frame} frost={frost} flash={flash} tick={tick} alarm={Boolean(props.alarm)} />
        </Plane>
      </Cine>
    </Stage>
  );
};
