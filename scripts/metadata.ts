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
const notes = tl.shots.filter((s) => s.science).map((s, i) => `(${i + 1}) ${s.science!.text} — Source: ${s.science!.source}`);
const mids = tl.shots.filter((s) => s.midroll).map((s) => formatTimestamp(s.end));

const fileDescription = `${episode.logline}

${episode.commentPrompt} Tell us below 👇

${chapters.join('\n')}

THE REAL SCIENCE IN THIS STORY
${notes.join('\n')}

THE BLINK FILES — every File, the world ends a different way. Every File, your watch counts down first. Subscribe: the next countdown has already started.

This is a work of fiction. The Sun cannot simply vanish — it has about five billion years of fuel left. Everything that happens after it does is real physics.
#whatif #space #survival #animation #theblinkfiles`;

const description = episode.style === 'cinema' ? fileDescription : `${episode.logline}

${episode.commentPrompt} Tell us below — the Executor is still reading.

${chapters.join('\n')}

THE REAL SCIENCE IN THIS EPISODE
${notes.join('\n')}

THE BLINK FILES — twelve gifts from a dead star, twelve ordinary people. New heir every week.

This is a work of fiction. Betelgeuse is real — and has not gone dark (yet).
#whatif #space #superpower #animation #theblinkfiles`;

const md = `# ${episode.youtubeTitle}

**Thumbnail text:** ${episode.thumbnailText}
**Runtime:** ${formatTimestamp(tl.duration)}
**Manual mid-roll positions:** ${mids.join(', ')} (set these in YouTube Studio → Monetization → Ad breaks; leave auto-placement OFF so ads land on our cliffhangers)

## Description (paste as-is)

\`\`\`
${description}
\`\`\`

## Tags
${episode.tags.join(', ')}

## Pinned comment
${episode.pinnedComment}
`;
mkdirSync(join(ROOT, 'renders'), {recursive: true});
writeFileSync(join(ROOT, 'renders', `${id}-metadata.md`), md);
console.log(md);
