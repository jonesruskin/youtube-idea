import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SCENES} from '../scenes';
import {Footnote} from '../ui/Footnote';
import type {Episode as EpisodeData} from './schema';
import {ShotProvider} from './shot-context';
import {buildTimeline, toFrames, type TimedShot, type VoiceMap} from './timeline';
import {EPISODES} from '../episodes';

export type EpisodeProps = {episodeId: string; voice: VoiceMap; hasScore: boolean};

const SoftCut: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{opacity: interpolate(f, [0, 4], [0, 1], {extrapolateRight: 'clamp'})}}>{children}</AbsoluteFill>;
};

const ShotView: React.FC<{shot: TimedShot; fps: number}> = ({shot, fps}) => {
  const Scene = SCENES[shot.scene];
  if (!Scene) throw new Error(`Unknown scene "${shot.scene}" in shot "${shot.id}"`);
  return (
    <ShotProvider shot={shot} fps={fps}>
      <SoftCut>
        <Scene />
        {shot.footnote && <Footnote n={shot.footnote.n} text={shot.footnote.text} fps={fps} duration={shot.duration} />}
      </SoftCut>
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
