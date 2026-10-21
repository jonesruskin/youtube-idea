// Generates YouTube title, description (chapters from real timings, footnote sources), tags.
// Usage: npm run metadata ep01 → renders/ep01-metadata.md
import {mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {buildTimeline, formatTimestamp} from '../src/engine/timeline';
import {loadEpisode, ROOT} from './load-episode';

const id = process.argv[2] ?? 'ep01';
const {episode, voice} = await loadEpisode(id);
const tl = buildTimeline(episode, voice);
const chapters = tl.shots.filter((s) => s.chapter).map((s) => `${formatTimestamp(s.start)} ${s.chapter}`);
const notes = tl.shots.filter((s) => s.footnote).map((s) => `(${s.footnote!.n}) ${s.footnote!.text} — Source: ${s.footnote!.source}`);
const mids = tl.shots.filter((s) => s.midroll).map((s) => formatTimestamp(s.end));

const description = `Betelgeuse went dark. Three days later, every radio on Earth received the last will and testament of the Vey — and they left everything to twelve humans. Heir Number One is a 17-year-old phone repairer from Lagos. His inheritance: their spaceship. The catch: three rules. Break one, and the richest man on Earth gets it instead.

${episode.commentPrompt} Tell us below — the Executor is still reading.

${chapters.join('\n')}

EXECUTOR'S FOOTNOTES (the real science in this story)
${notes.join('\n')}

THE BLINK FILES — every series is a File. File 01: THE WILL. Twelve heirs. Twelve inheritances. One sealed Item Thirteen.
New heir every week. Subscribe so the Executor can find you.

This is a work of fiction. Betelgeuse is real and has not gone dark (yet).
#whatif #space #aliens #animation #theblinkfiles`;

const md = `# ${episode.youtubeTitle}

**Thumbnail text:** ${episode.thumbnailText}
**Runtime:** ${formatTimestamp(tl.duration)}
**Manual mid-roll positions:** ${mids.join(', ')} (set these in YouTube Studio → Monetization → Ad breaks; leave auto-placement OFF so ads land on our cliffhangers)

## Description (paste as-is)

\`\`\`
${description}
\`\`\`

## Tags
what if, aliens, spaceship, alien inheritance, betelgeuse, space, moon, animation, story, sci-fi, the blink files, what if aliens left you, kármán line, apollo 11, lagos

## Pinned comment
Item Thirteen is sealed until all twelve heirs are together. Who do YOU think the small seat is for? 👀
`;
mkdirSync(join(ROOT, 'renders'), {recursive: true});
writeFileSync(join(ROOT, 'renders', `${id}-metadata.md`), md);
console.log(md);
