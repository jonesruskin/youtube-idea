import React, {createContext, useContext} from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import type {Speaker} from './schema';
import type {TimedShot} from './timeline';

type ShotCtx = {shot: TimedShot; fps: number};
const Ctx = createContext<ShotCtx | null>(null);

/** For components that may render outside a shot (thumbnails, model sheets). */
export const useShotOptional = () => {
  const v = useContext(Ctx);
  const frame = useCurrentFrame();
  if (!v) return null;
  const t = frame / v.fps;
  /** The line `speaker` is saying right now, with local timing — or null. */
  const lineNow = (speaker: Speaker) => {
    const l = v.shot.timedLines.find((x) => x.speaker === speaker && t >= x.startInShot && t <= x.startInShot + (x.end - x.start));
    return l ? {text: l.text, t: t - l.startInShot, duration: l.end - l.start, chars: l.chars} : null;
  };
  return {t, lineNow};
};

export const ShotProvider: React.FC<ShotCtx & {children: React.ReactNode}> = ({children, ...v}) => <Ctx.Provider value={v}>{children}</Ctx.Provider>;

/** Local timing helpers for scene components (frame is local to the shot's Sequence). */
export const useShot = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useShot() outside a shot');
  const frame = useCurrentFrame();
  const {shot, fps} = v;
  const t = frame / fps; // seconds into shot
  const dur = shot.duration;
  const progress = Math.min(1, t / dur);
  /** Is `speaker` mid-line right now? */
  const speaking = (speaker: Speaker) => shot.timedLines.some((l) => l.speaker === speaker && t >= l.startInShot && t <= l.startInShot + (l.end - l.start));
  /** Seconds at which line i starts within the shot. */
  const lineAt = (i: number) => shot.timedLines[i]?.startInShot ?? 0;
  /** 0→1 ramp starting at second `from`, lasting `len` seconds. */
  const ramp = (from: number, len = 0.6, ease = Easing.inOut(Easing.cubic)) =>
    interpolate(t, [from, from + len], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const props = (shot.props ?? {}) as Record<string, any>;
  return {shot, fps, frame, t, dur, progress, speaking, lineAt, ramp, props};
};
