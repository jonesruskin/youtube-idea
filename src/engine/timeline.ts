import type {Episode, Line, Shot} from './schema';

/**
 * Voice timings written by scripts/tts.ts once ElevenLabs is connected.
 * Key: `${shotId}:${lineIndex}` → measured duration + audio file in /public.
 */
export type VoiceMap = Record<string, {seconds: number; file: string}>;

/** Narration pace used until real voiceover exists (~155 words per minute). */
const WORDS_PER_SECOND = 2.6;
const LINE_GAP = 0.35;
const SHOT_PAD = 0.5;

export const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export const estimateLineSeconds = (line: Line) => {
  const words = wordCount(line.text);
  // Ellipses and dashes read slower; give them a little air.
  const beats = (line.text.match(/\.\.\.|—/g) ?? []).length * 0.35;
  return Math.max(0.9, words / WORDS_PER_SECOND + beats);
};

export type TimedLine = Line & {
  key: string;
  start: number; // seconds from episode start
  end: number;
  startInShot: number;
  audio?: string;
};

export type TimedShot = Shot & {
  index: number;
  start: number;
  end: number;
  duration: number;
  timedLines: TimedLine[];
};

export type Timeline = {
  shots: TimedShot[];
  duration: number;
  lines: TimedLine[];
};

export const buildTimeline = (episode: Episode, voice: VoiceMap = {}): Timeline => {
  let t = 0;
  const shots: TimedShot[] = [];
  const all: TimedLine[] = [];
  episode.shots.forEach((shot, index) => {
    const start = t;
    let cursor = shot.lead ?? 0.3;
    const timedLines: TimedLine[] = (shot.lines ?? []).map((line, i) => {
      const key = `${shot.id}:${i}`;
      const measured = voice[key];
      const seconds = measured ? measured.seconds : estimateLineSeconds(line);
      const tl: TimedLine = {
        ...line,
        key,
        startInShot: cursor,
        start: start + cursor,
        end: start + cursor + seconds,
        audio: measured?.file,
      };
      cursor += seconds + (line.pause ?? 0) + LINE_GAP;
      return tl;
    });
    const spoken = cursor + (shot.tail ?? 0) + (timedLines.length ? SHOT_PAD - LINE_GAP : 0);
    const duration = Math.max(shot.min ?? 2, spoken);
    shots.push({...shot, index, start, end: start + duration, duration, timedLines});
    all.push(...timedLines);
    t += duration;
  });
  return {shots, duration: t, lines: all};
};

export const toFrames = (seconds: number, fps: number) => Math.round(seconds * fps);

export const formatTimestamp = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};
