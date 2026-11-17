// The longest shots (candidates to split for pacing): npx tsx scripts/long-shots.ts <id> [n]
import {buildTimeline} from '../src/engine/timeline';
import {loadEpisode} from './load-episode';
const id = process.argv[2];
const {episode, voice} = await loadEpisode(id);
const tl = buildTimeline(episode, voice);
for (const s of [...tl.shots].sort((a, b) => b.duration - a.duration).slice(0, Number(process.argv[3] ?? 30)))
  console.log(s.duration.toFixed(1).padStart(5), s.id.padEnd(20), s.scene.padEnd(9), (s.lines ?? []).map((l) => l.text).join(' | ').slice(0, 110));
