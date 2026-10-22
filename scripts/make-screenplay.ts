// Writes a readable screenplay (docs/screenplay-<id>.md) from the episode script, so the doc and
// the video can never drift apart. Usage: npx tsx scripts/make-screenplay.ts ep01
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {buildTimeline, formatTimestamp} from '../src/engine/timeline';
import {loadEpisode, ROOT} from './load-episode';

const id = process.argv[2] ?? 'ep01';
const {episode, voice} = await loadEpisode(id);
const tl = buildTimeline(episode, voice);
const NAME = (s: string) => s.replace('_', '. ').replace('MRS. BELLO', 'MRS. BELLO');

const out: string[] = [];
out.push(`# ${episode.youtubeTitle}`);
out.push(`*THE BLINK FILES · ${episode.file} · Episode 1* — runtime ${formatTimestamp(tl.duration)} (estimated until voiced)\n`);
out.push('> Generated from `episodes/ep01-zero-g/script.ts` — edit the script, not this file.\n');
const science: string[] = [];
for (const s of tl.shots) {
  if (s.chapter) out.push(`\n## ${formatTimestamp(s.start)} · ${s.chapter}\n`);
  const tags = [s.beats?.length ? s.beats.map((b) => `\`${b}\``).join(' ') : '', s.midroll ? '**[MID-ROLL AFTER THIS SHOT]**' : ''].filter(Boolean).join(' ');
  out.push(`**${formatTimestamp(s.start)}** — *${s.action ?? s.scene}* ${tags}`);
  for (const l of s.lines ?? []) out.push(`> **${NAME(l.speaker)}:** ${l.text}`);
  if (s.science) {
    science.push(`${science.length + 1}. ${s.science.text} *(${s.science.source})*`);
    out.push(`> *Shown on screen, sourced in the description: science note ${science.length}.*`);
  }
  out.push('');
}
out.push('\n## Science shown in this episode (goes in the YouTube description)\n');
out.push(...science);
const path = join(ROOT, 'docs', `screenplay-${id}.md`);
writeFileSync(path, out.join('\n') + '\n');
console.log(`screenplay → ${path}`);
