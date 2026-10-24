import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SCENES} from '../scenes';
import {Finish} from '../ui/Finish';
import {Callout, DayTag} from '../ui/Callouts';
import {Frost} from '../fx/cinema/atmos';
import type {Episode as EpisodeData, Shot} from './schema';
import {ShotProvider} from './shot-context';
import {buildTimeline, toFrames, type TimedShot, type VoiceMap} from './timeline';
import {EPISODES} from '../episodes';

export type EpisodeProps = {episodeId: string; voice: VoiceMap; hasScore: boolean};

/** Whip-pan length in frames. The outgoing shot is held this much longer and slides out as the new one slides in. */
const WHIP = 9;
const whipEase = (t: number) => 1 - Math.pow(1 - t, 3);

/** The outgoing half of a whip-pan: after `at` frames the whole shot slides off to the left, blurring. */
const Exit: React.FC<{at: number | null; children: React.ReactNode}> = ({at, children}) => {
  const f = useCurrentFrame();
  if (at === null || f < at) return <>{children}</>;
  const e = interpolate(f, [at, at + WHIP], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: whipEase});
  return <AbsoluteFill style={{transform: `translateX(${-e * 1920}px)`, filter: `blur(${e * 24}px)`}}>{children}</AbsoluteFill>;
};

/** Motivated entrances: a soft cut by default, whip-pans, flashes and fades where the story moves. */
const Enter: React.FC<{kind: Shot['transition']; children: React.ReactNode}> = ({kind = 'cut', children}) => {
  const f = useCurrentFrame();
  if (kind === 'whip') {
    const x = interpolate(f, [0, WHIP], [1, 0], {extrapolateRight: 'clamp', easing: whipEase});
    return (
      <AbsoluteFill style={{transform: `translateX(${x * 1920}px)`, filter: x > 0.02 ? `blur(${x * 24}px)` : undefined}}>{children}</AbsoluteFill>
    );
  }
  if (kind === 'flash') {
    const w = interpolate(f, [0, 8], [1, 0], {extrapolateRight: 'clamp'});
    return (
      <AbsoluteFill>
        {children}
        <AbsoluteFill style={{background: '#FFF6E6', opacity: w}} />
      </AbsoluteFill>
    );
  }
  // Cinema transitions (File format).
  const out = Easing.out(Easing.cubic);
  if (kind === 'pullback') {
    // Out of an extreme close-up: the frame starts huge and soft, settles into the wide.
    const z = interpolate(f, [0, 22], [2.6, 1], {extrapolateRight: 'clamp', easing: out});
    const b = interpolate(f, [0, 16], [10, 0], {extrapolateRight: 'clamp'});
    return <AbsoluteFill style={{transform: `scale(${z})`, filter: b > 0.3 ? `blur(${b}px)` : undefined}}>{children}</AbsoluteFill>;
  }
  if (kind === 'zoomThrough') {
    const z = interpolate(f, [0, 20], [1.9, 1], {extrapolateRight: 'clamp', easing: out});
    const w = interpolate(f, [0, 12], [0.7, 0], {extrapolateRight: 'clamp'});
    return (
      <AbsoluteFill style={{transform: `scale(${z})`}}>
        {children}
        <AbsoluteFill style={{background: '#FFF6E6', opacity: w}} />
      </AbsoluteFill>
    );
  }
  if (kind === 'iris') {
    const r = interpolate(f, [0, 18], [0, 1250], {extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
    return <AbsoluteFill style={{clipPath: `circle(${r}px at 50% 50%)`}}>{children}</AbsoluteFill>;
  }
  if (kind === 'frost') {
    const a = interpolate(f, [0, 20], [1, 0], {extrapolateRight: 'clamp'});
    return (
      <AbsoluteFill>
        {children}
        <AbsoluteFill style={{background: '#DCEBFA', opacity: a * 0.55}} />
        <AbsoluteFill>
          <svg viewBox="0 0 1920 1080" width="100%" height="100%">
            <Frost amount={a} seed={23} />
          </svg>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  if (kind === 'fog') {
    const a = interpolate(f, [0, 24], [1, 0], {extrapolateRight: 'clamp'});
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{filter: a > 0.02 ? `blur(${a * 18}px)` : undefined}}>{children}</AbsoluteFill>
        <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 55%, #F4F8FF 0%, #E8F0FA 45%, #DCE6F2 100%)', opacity: a * 0.85}} />
      </AbsoluteFill>
    );
  }
  if (kind === 'fade') {
    return <AbsoluteFill style={{opacity: interpolate(f, [0, 14], [0, 1], {extrapolateRight: 'clamp'})}}>{children}</AbsoluteFill>;
  }
  return <AbsoluteFill style={{opacity: interpolate(f, [0, 3], [0.4, 1], {extrapolateRight: 'clamp'})}}>{children}</AbsoluteFill>;
};

/** Film grain and gate weave over a flash-forward, so it reads as "not yet" at a glance. */
const FlashForwardGrain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%">
        <filter id="ffgrain">
          <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={f % 23} />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.35 0" />
        </filter>
        <rect width={1920} height={1080} filter="url(#ffgrain)" opacity={0.35} />
        <rect x={((f * 37) % 1700) + 100} y={0} width={2} height={1080} fill="#FFFFFF" opacity={0.18} />
        <rect width={1920} height={1080} fill="none" stroke="#000" strokeWidth={90} opacity={0.35} />
      </svg>
    </AbsoluteFill>
  );
};

const ShotView: React.FC<{shot: TimedShot; fps: number; prevDay: number; exitAt: number | null}> = ({shot, fps, prevDay, exitAt}) => {
  const Scene = SCENES[shot.scene];
  if (!Scene) throw new Error(`Unknown scene "${shot.scene}" in shot "${shot.id}"`);
  return (
    <Exit at={exitAt}>
    <ShotProvider shot={shot} fps={fps}>
      <Enter kind={shot.transition}>
        {shot.look === 'flashforward' ? (
          <AbsoluteFill style={{filter: 'saturate(0.18) contrast(1.25) brightness(1.08) sepia(0.25)'}}>
            <Scene />
          </AbsoluteFill>
        ) : (
          <Scene />
        )}
      </Enter>
      {shot.look === 'flashforward' && <FlashForwardGrain />}
      <DayTag prevDay={prevDay} />
      <Callout />
    </ShotProvider>
    </Exit>
  );
};

/** 2.39:1 bars that slide in for letterboxed shots (the three biggest moments) and out again after. */
const Letterbox: React.FC<{shots: TimedShot[]; fps: number}> = ({shots, fps}) => {
  const f = useCurrentFrame();
  const t = f / fps;
  const i = shots.findIndex((s) => t >= s.start && t < s.end);
  if (i < 0) return null;
  const s = shots[i];
  const RAMP = 0.6;
  let v = 0;
  if (s.letterbox) {
    const inFrom = shots[i - 1]?.letterbox ? 1 : interpolate(t, [s.start, s.start + RAMP], [0, 1], {extrapolateRight: 'clamp'});
    const outTo = shots[i + 1]?.letterbox ? 1 : interpolate(t, [s.end - RAMP, s.end], [1, 0], {extrapolateLeft: 'clamp'});
    v = Math.min(inFrom, outTo);
  }
  if (v <= 0) return null;
  const h = 138 * Easing.inOut(Easing.cubic)(v);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: h, background: '#000'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: h, background: '#000'}} />
    </AbsoluteFill>
  );
};

export const Episode: React.FC<EpisodeProps> = ({episodeId, voice, hasScore}) => {
  const ep: EpisodeData = EPISODES[episodeId];
  const tl = buildTimeline(ep, voice);
  // the last Day shown before each shot (flash-forwards don't count), for the year bar
  let story = 0;
  const prevDays = tl.shots.map((s) => {
    const prev = story;
    if (s.hud && s.look !== 'flashforward') story = s.hud.day;
    return prev;
  });
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {tl.shots.map((s, i) => {
        const len = Math.max(1, toFrames(s.duration, ep.fps));
        const whipOut = tl.shots[i + 1]?.transition === 'whip';
        return (
          <Sequence key={s.id} from={toFrames(s.start, ep.fps)} durationInFrames={len + (whipOut ? WHIP : 0)} name={`${s.index} ${s.id}`}>
            <ShotView shot={s} fps={ep.fps} prevDay={prevDays[i]} exitAt={whipOut ? len : null} />
          </Sequence>
        );
      })}
      <Finish />
      {ep.style === 'cinema' && <Letterbox shots={tl.shots} fps={ep.fps} />}
      {hasScore && <Audio src={staticFile(`audio/${episodeId}-score.wav`)} />}
      {tl.lines
        .filter((l) => l.audio)
        .map((l) => (
          <Sequence key={l.key} from={toFrames(l.start, ep.fps)} durationInFrames={toFrames(l.end - l.start + 0.5, ep.fps)}>
            <Audio src={staticFile(l.audio!)} />
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};

/** Pulls voice timings + score presence from /public at render time, so a fresh clone renders silently. */
export const calculateEpisodeMetadata = async ({props}: {props: EpisodeProps}) => {
  const ep = EPISODES[props.episodeId];
  let voice: VoiceMap = {};
  try {
    const r = await fetch(staticFile(`voice/${props.episodeId}.json`));
    if (r.ok) voice = await r.json();
  } catch {
    // no voiceover yet
  }
  let hasScore = false;
  try {
    hasScore = (await fetch(staticFile(`audio/${props.episodeId}-score.wav`), {method: 'HEAD'})).ok;
  } catch {
    hasScore = false;
  }
  const tl = buildTimeline(ep, voice);
  return {durationInFrames: toFrames(tl.duration, ep.fps), fps: ep.fps, props: {...props, voice, hasScore}};
};
