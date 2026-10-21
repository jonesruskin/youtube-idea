// Pacing linter: catches retention killers before anything is rendered.
// Usage: npm run lint:episode ep01
import {buildTimeline, formatTimestamp, wordCount} from '../src/engine/timeline';
import {loadEpisode} from './load-episode';

const id = process.argv[2] ?? 'ep01';
const {episode, voice} = await loadEpisode(id);
const tl = buildTimeline(episode, voice);

const errors: string[] = [];
const warnings: string[] = [];

// 1. Runtime: 8:00+ unlocks manual mid-rolls. Never pad: 8:00 is a floor, not a target.
if (tl.duration < 480) errors.push(`Runtime ${formatTimestamp(tl.duration)} is under 8:00 (mid-roll threshold).`);

// 2. The first line must land inside 15 seconds — and the first shot should be a peak moment.
const firstLine = tl.lines[0];
if (!firstLine || firstLine.start > 15) errors.push('No spoken hook in the first 15 seconds.');

// 3. Shot length: a static frame longer than ~16s bleeds viewers.
for (const s of tl.shots) {
  if (s.duration > 16) warnings.push(`Shot "${s.id}" runs ${s.duration.toFixed(1)}s — split it or add a camera beat.`);
}

// 4. Re-hooks: something new (sfx, mood change, chapter, footnote or midroll loop) at least every 75s.
let lastHook = 0;
for (const s of tl.shots) {
  if (s.sfx || s.mood || s.chapter || s.footnote) {
    if (s.start - lastHook > 75) warnings.push(`No re-hook between ${formatTimestamp(lastHook)} and ${formatTimestamp(s.start)}.`);
    lastHook = s.start;
  }
}

// 5. Mid-rolls must sit on open loops, and not before 2:30 or within 90s of each other.
const mids = tl.shots.filter((s) => s.midroll).map((s) => s.end);
if (mids.length === 0 && tl.duration >= 480) warnings.push('No mid-roll markers — you are leaving money on the table.');
mids.forEach((m, i) => {
  if (m < 150) errors.push(`Mid-roll at ${formatTimestamp(m)} is too early.`);
  if (i > 0 && m - mids[i - 1] < 90) errors.push(`Mid-rolls at ${formatTimestamp(mids[i - 1])} and ${formatTimestamp(m)} are too close.`);
});
for (const s of tl.shots.filter((x) => x.midroll)) {
  const last = s.lines?.[s.lines.length - 1]?.text ?? '';
  if (!/\?|not|yet|n't|never|\.\.\./i.test(last)) warnings.push(`Mid-roll after "${s.id}" does not end on an open loop.`);
}

// 6. Every footnote must cite a source.
for (const s of tl.shots) if (s.footnote && !s.footnote.source) errors.push(`Footnote ${s.footnote.n} has no source.`);

// 7. Chapters: YouTube needs ≥3, first at 0:00, each ≥10s.
const chapters = tl.shots.filter((s) => s.chapter);
if (chapters.length < 3) errors.push('Fewer than 3 chapters.');
if (chapters[0]?.start !== 0) errors.push('First chapter must start at 0:00.');

const words = tl.lines.reduce((n, l) => n + wordCount(l.text), 0);
console.log(`\n${episode.youtubeTitle}`);
console.log(`  runtime   ${formatTimestamp(tl.duration)} (${tl.duration.toFixed(1)}s, ${tl.shots.length} shots, ${words} words)`);
console.log(`  timings   ${Object.keys(voice).length ? 'ElevenLabs voice' : 'estimated (no voiceover yet)'}`);
console.log(`  mid-rolls ${mids.map(formatTimestamp).join(', ') || '—'}`);
console.log(`  chapters  ${chapters.map((c) => `${formatTimestamp(c.start)} ${c.chapter}`).join(' | ')}`);
warnings.forEach((w) => console.log(`  ⚠ ${w}`));
errors.forEach((e) => console.log(`  ✖ ${e}`));
if (errors.length) process.exit(1);
console.log('  ✔ passes\n');
