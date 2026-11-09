// Every spoken line with its shot context, for a line-by-line read: npx tsx scripts/dump-lines.ts <id> [--raw]
// --raw: the script's own shots before autoSplit (if the script exports `rawShots`), keyed as written.
import {readdirSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import type {Shot} from '../src/engine/schema';
import {loadEpisode, ROOT} from './load-episode';

const id = process.argv[2];
const {episode} = await loadEpisode(id);
let shots: Shot[] = episode.shots;
if (process.argv.includes('--raw')) {
  const d = readdirSync(join(ROOT, 'episodes')).find((x) => x === id || x.startsWith(`${id}-`))!;
  const mod = await import(pathToFileURL(join(ROOT, 'episodes', d, 'script.ts')).href);
  shots = mod.rawShots ?? shots;
}
for (const s of shots) {
  if (!s.lines?.length) continue;
  console.log(`## ${s.id}${s.beats?.length ? ' [' + s.beats.join(',') + ']' : ''} — ${(s.action ?? '').slice(0, 110)}`);
  s.lines.forEach((l, i) => console.log(`  ${i} ${l.speaker}: ${l.text}`));
}
