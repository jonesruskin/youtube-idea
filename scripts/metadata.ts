// Generates YouTube title, description (chapters from real timings, footnote sources), tags.
// Usage: npm run metadata ep01 → renders/ep01-metadata.md
import {mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {CHANNELS} from '../src/channels';
import {buildTimeline, formatTimestamp} from '../src/engine/timeline';
import {loadEpisode, ROOT} from './load-episode';

const id = process.argv[2] ?? 'ep01';
const {episode, voice} = await loadEpisode(id);
const tl = buildTimeline(episode, voice);
const chapters = tl.shots.filter((s) => s.chapter).map((s) => `${formatTimestamp(s.start)} ${s.chapter}`);
const notes = tl.shots.filter((s) => s.science).map((s, i) => `(${i + 1}) ${s.science!.text} — Source: ${s.science!.source}`);
const ch = CHANNELS[episode.channel ?? 'blink'];
const mids = tl.shots.filter((s) => s.midroll).map((s) => formatTimestamp(s.end));

const description = `${episode.logline}

${episode.commentPrompt} ${ch.commentTail}

${chapters.join('\n')}

${ch.factsHeader}
${notes.join('\n')}

${ch.footer}`;

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
