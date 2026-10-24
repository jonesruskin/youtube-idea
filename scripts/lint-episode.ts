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

// 4. Retention beats: a laugh, a wow, a heart moment or a new open loop at least every 45s.
let lastBeat = 0;
for (const s of tl.shots) {
  if (s.beats?.length) {
    if (s.start - lastBeat > 45) errors.push(`No beat (laugh/wow/heart/loop) between ${formatTimestamp(lastBeat)} and ${formatTimestamp(s.start)}.`);
    lastBeat = s.start;
  }
}
if (tl.duration - lastBeat > 45) errors.push(`No beat after ${formatTimestamp(lastBeat)}.`);
const laughs = tl.shots.filter((s) => s.beats?.includes('laugh')).length;
if (laughs < tl.duration / 40) warnings.push(`Only ${laughs} laughs in ${formatTimestamp(tl.duration)} — aim for one every ~30s.`);

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

// 6. Every science beat must cite a source (it goes in the description, not on screen).
for (const s of tl.shots) if (s.science && !s.science.source) errors.push(`Science in "${s.id}" has no source.`);

// 7. Chapters: YouTube needs ≥3, first at 0:00, each ≥10s.
const chapters = tl.shots.filter((s) => s.chapter);
if (chapters.length < 3) errors.push('Fewer than 3 chapters.');
if (chapters[0]?.start !== 0) errors.push('First chapter must start at 0:00.');

// 8. The narrated File format (cinema) has stricter gates, benchmarked against the genre's hits.
const cinemaReport: string[] = [];
if (episode.style === 'cinema') {
  // the end card is YouTube's end-screen slot (subscribe + next video), not story pacing: it doesn't count
  const story = tl.shots.filter((s, i) => !(i === tl.shots.length - 1 && s.scene === 'end'));
  const n = story.length;
  const avg = story.reduce((a, s) => a + s.duration, 0) / n;
  cinemaReport.push(`avg shot ${avg.toFixed(2)}s`);
  if (avg > 3.7) errors.push(`Average shot is ${avg.toFixed(2)}s — the genre cuts every ~3s (gate 3.7s).`);
  // a long shot must have acting or a camera move
  for (const s of tl.shots) {
    const p = (s.props ?? {}) as any;
    const acts = (p.acts ?? []) as unknown[];
    const cam = (p.cam ?? []) as number[][];
    const camMove = cam.length > 1 ? Math.abs(cam[cam.length - 1][1] - cam[0][1]) / cam[0][1] + Math.hypot(cam[cam.length - 1][2] - cam[0][2], cam[cam.length - 1][3] - cam[0][3]) / 600 : 0;
    if (s.scene === 'stage' && s.duration > 3.5 && acts.length === 0 && camMove < 0.12) errors.push(`Idle: "${s.id}" (${s.duration.toFixed(1)}s) has no acting and barely any camera move.`);
    if (s.duration > 6.5) warnings.push(`"${s.id}" runs ${s.duration.toFixed(1)}s — consider splitting.`);
  }
  // developments: at least one every 30s; ≥ 2 per minute overall; ≥ 4 reveals
  const devs = tl.shots.filter((s) => s.dev || s.twist).map((s) => s.start);
  let prev = 0;
  for (const d of [...devs, tl.duration]) {
    if (d - prev > 30) errors.push(`No plot development between ${formatTimestamp(prev)} and ${formatTimestamp(d)}.`);
    prev = d;
  }
  const dpm = devs.length / (tl.duration / 60);
  cinemaReport.push(`${devs.length} developments (${dpm.toFixed(1)}/min)`);
  if (dpm < 2) errors.push(`Only ${dpm.toFixed(1)} developments per minute (gate 2).`);
  const twists = tl.shots.filter((s) => s.twist).length;
  cinemaReport.push(`${twists} reveals`);
  if (twists < 4) errors.push(`Only ${twists} reveals (gate 4).`);
  if (!firstLine || firstLine.start > 5) errors.push('The hook must be spoken within 5 seconds.');
  // narration pace (benchmark 130–160 wpm of speech)
  const speech = tl.lines.reduce((t, l) => t + (l.end - l.start), 0);
  const wpm = tl.lines.reduce((n, l) => n + wordCount(l.text), 0) / (speech / 60);
  cinemaReport.push(`${wpm.toFixed(0)} wpm`);
  if (wpm < 120 || wpm > 170) errors.push(`Narration pace ${wpm.toFixed(0)} wpm is outside 120–170.`);
  // on-screen text budget
  const callouts = tl.shots.filter((s) => s.callout).length;
  cinemaReport.push(`${callouts} callouts`);
  if (callouts > 20) errors.push(`${callouts} callouts — on-screen words must stay rare (gate 20).`);
  // costume continuity: tees before Day 1, coats from Day 1
  let day = 0;
  for (const s of tl.shots) {
    if (s.hud) day = s.hud.day;
    for (const c of ((s.props as any)?.cast ?? []) as any[]) {
      if (!['you', 'mira', 'ito'].includes(c.who)) continue;
      const outfit = c.outfit ?? 'home';
      if (day === 0 && outfit !== 'home') errors.push(`Continuity: ${c.who} wears "${outfit}" before Day 1 in "${s.id}".`);
      if (day >= 1 && outfit === 'home') errors.push(`Continuity: ${c.who} is still in summer clothes on Day ${day} in "${s.id}".`);
    }
  }
  // scale: everyone on the same floor line shares one depth (heights come from the chart, never per shot)
  for (const s of tl.shots) {
    const cast = ((s.props as any)?.cast ?? []) as any[];
    for (const a of cast) for (const b of cast) if (a !== b && Math.abs(a.y - b.y) < 30 && a.depth !== b.depth) errors.push(`Scale: ${a.who} and ${b.who} stand together at different depths in "${s.id}".`);
    // expressions: the hero and family never look angry
    for (const c of cast) if (['you', 'mira', 'ito'].includes(c.who) && c.expr === 'angry') errors.push(`Expression: ${c.who} is angry in "${s.id}".`);
    for (const a of ((s.props as any)?.acts ?? []) as any[]) if (['you', 'mira', 'ito'].includes(a.who) && a.expr === 'angry') errors.push(`Expression: ${a.who} turns angry in "${s.id}".`);
    // extras variety: never the same extra twice in a shot
    const ex = cast.filter((c) => String(c.who).startsWith('extra:')).map((c) => c.who);
    if (new Set(ex).size !== ex.length) errors.push(`Extras: duplicate extra in "${s.id}".`);
  }
}

const words = tl.lines.reduce((n, l) => n + wordCount(l.text), 0);
console.log(`\n${episode.youtubeTitle}`);
console.log(`  runtime   ${formatTimestamp(tl.duration)} (${tl.duration.toFixed(1)}s, ${tl.shots.length} shots, ${words} words)`);
console.log(`  timings   ${Object.keys(voice).length ? 'voiced' : 'estimated (no voiceover yet)'}`);
console.log(`  mid-rolls ${mids.map(formatTimestamp).join(', ') || '—'}`);
console.log(`  chapters  ${chapters.map((c) => `${formatTimestamp(c.start)} ${c.chapter}`).join(' | ')}`);
console.log(`  beats     ${laughs} laughs · ${tl.shots.filter((s) => s.beats?.includes('wow')).length} wows · ${tl.shots.filter((s) => s.beats?.includes('heart')).length} hearts · ${tl.shots.filter((s) => s.beats?.includes('loop')).length} open loops`);
if (cinemaReport.length) console.log(`  file fmt  ${cinemaReport.join(' · ')}`);
warnings.forEach((w) => console.log(`  ⚠ ${w}`));
errors.forEach((e) => console.log(`  ✖ ${e}`));
if (errors.length) process.exit(1);
console.log('  ✔ passes\n');
