import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SCENES} from '../scenes';
import {Finish} from '../ui/Finish';
import type {Episode as EpisodeData, Shot} from './schema';
import {ShotProvider} from './shot-context';
import {buildTimeline, toFrames, type TimedShot, type VoiceMap} from './timeline';
import {EPISODES} from '../episodes';

export type EpisodeProps = {episodeId: string; voice: VoiceMap; hasScore: boolean};

/** Motivated entrances: a soft cut by default, whip-pans, flashes and fades where the story moves. */
const Enter: React.FC<{kind: Shot['transition']; children: React.ReactNode}> = ({kind = 'cut', children}) => {
  const f = useCurrentFrame();
  if (kind === 'whip') {
    const x = interpolate(f, [0, 9], [1, 0], {extrapolateRight: 'clamp', easing: (t) => 1 - Math.pow(1 - t, 3)});
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
  if (kind === 'fade') {
    return <AbsoluteFill style={{opacity: interpolate(f, [0, 14], [0, 1], {extrapolateRight: 'clamp'})}}>{children}</AbsoluteFill>;
  }
  return <AbsoluteFill style={{opacity: interpolate(f, [0, 3], [0.4, 1], {extrapolateRight: 'clamp'})}}>{children}</AbsoluteFill>;
};

const ShotView: React.FC<{shot: TimedShot; fps: number}> = ({shot, fps}) => {
  const Scene = SCENES[shot.scene];
  if (!Scene) throw new Error(`Unknown scene "${shot.scene}" in shot "${shot.id}"`);
  return (
    <ShotProvider shot={shot} fps={fps}>
      <Enter kind={shot.transition}>
        <Scene />
      </Enter>
    </ShotProvider>
  );
};

export const Episode: React.FC<EpisodeProps> = ({episodeId, voice, hasScore}) => {
  const ep: EpisodeData = EPISODES[episodeId];
  const tl = buildTimeline(ep, voice);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {tl.shots.map((s) => (
        <Sequence key={s.id} from={toFrames(s.start, ep.fps)} durationInFrames={Math.max(1, toFrames(s.duration, ep.fps))} name={`${s.index} ${s.id}`}>
          <ShotView shot={s} fps={ep.fps} />
        </Sequence>
      ))}
      <Finish />
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
