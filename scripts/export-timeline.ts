// Dumps an episode's timeline (shots, cues, voiced/estimated line times) as JSON for the Python steps
// (scripts/tts_kokoro.py reads the lines; scripts/score_cinema.py reads shots, cues and line times).
// Usage: npx tsx scripts/export-timeline.ts sun01 > out/sun01-timeline.json
import {buildTimeline} from '../src/engine/timeline';
import {loadEpisode} from './load-episode';

const id = process.argv[2] ?? 'sun01';
const {episode, voice} = await loadEpisode(id);
const tl = buildTimeline(episode, voice);
const out = {
  id,
  fps: episode.fps,
  duration: tl.duration,
  voiced: Object.keys(voice).length > 0,
  shots: tl.shots.map((s) => ({id: s.id, scene: s.scene, start: s.start, end: s.end, cue: s.cue ?? null, mood: s.mood ?? null, sfx: s.sfx ?? null, transition: s.transition ?? 'cut', props: s.props ?? {}})),
  lines: tl.lines.map((l) => ({key: l.key, speaker: l.speaker, text: l.text, start: l.start, end: l.end})),
};
process.stdout.write(JSON.stringify(out, null, 1));
