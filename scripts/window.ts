// Shots in a time window with their beats/dev (to place retention beats): npx tsx scripts/window.ts <id> <from s> <to s>
import {buildTimeline} from '../src/engine/timeline';
import {loadEpisode} from './load-episode';
const [id, a, b] = process.argv.slice(2);
const {episode, voice} = await loadEpisode(id);
for (const s of buildTimeline(episode, voice).shots)
  if (s.end >= Number(a) && s.start <= Number(b))
    console.log(s.start.toFixed(1).padStart(6), s.id.padEnd(18), (s.beats ?? []).join(',').padEnd(10), s.dev ? `dev: ${s.dev}` : '', '|', (s.lines ?? []).map((l) => l.text).join(' ').slice(0, 70));
