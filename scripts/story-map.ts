// The story skeleton of an episode as built: twists, day/place tags, loops (to write or audit the story contract).
//   npx tsx scripts/story-map.ts <id>
import {buildTimeline, formatTimestamp} from '../src/engine/timeline';
import {loadEpisode} from './load-episode';
const {episode, voice} = await loadEpisode(process.argv[2]);
const tl = buildTimeline(episode, voice);
console.log('duration', formatTimestamp(tl.duration));
for (const s of tl.shots as any[]) {
  const tags = [s.twist ? `TWIST${s.twist}` : '', s.hud ? ('day' in s.hud ? `DAY ${s.hud.day}` : s.hud.place) : '', (s.beats ?? []).includes('loop') ? 'loop' : ''].filter(Boolean);
  if (tags.length) console.log(formatTimestamp(s.start).padStart(6), s.id.padEnd(20), tags.join(' ').padEnd(22), (s.dev ?? (s.lines ?? []).map((l: any) => l.text).join(' ')).slice(0, 70));
}
