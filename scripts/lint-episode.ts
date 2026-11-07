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
  if (!s.beats?.includes('loop') && !/\?|not|yet|n't|never|\.\.\./i.test(last)) warnings.push(`Mid-roll after "${s.id}" does not end on an open loop.`);
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
    if (s.hud && 'day' in s.hud) day = s.hud.day;
    if (s.thread) continue; // other timelines (1982, a memory) dress for their own day
    for (const c of ((s.props as any)?.cast ?? []) as any[]) {
      if (!['you', 'mira', 'ito'].includes(c.who)) continue;
      const outfit = c.outfit ?? 'home';
      if (day === 0 && outfit !== 'home') errors.push(`Continuity: ${c.who} wears "${outfit}" before Day 1 in "${s.id}".`);
      if (day >= 1 && outfit === 'home') errors.push(`Continuity: ${c.who} is still in summer clothes on Day ${day} in "${s.id}".`);
    }
  }
  // chronology: nothing may show what the episode is hiding before the shot marked `reveal`
  const revealAt = tl.shots.findIndex((s) => s.reveal);
  if (revealAt >= 0) {
    const SHELL_SPACE = ['close', 'race', 'shellGlimpse', 'shellReveal', 'shellOrbit', 'beam', 'flicker', 'signal'];
    tl.shots.slice(0, revealAt).forEach((s) => {
      const p = (s.props ?? {}) as any;
      const leaks = (s.scene === 'space' && SHELL_SPACE.includes(p.v)) || (s.scene === 'diagram' && p.shell) || s.scene === 'end';
      if (leaks) errors.push(`Chronology: "${s.id}" shows the ${tl.shots[revealAt].reveal} before it is discovered in "${tl.shots[revealAt].id}".`);
    });
  }
  // the narrator is a person telling her own story: first person, never "you" as the hero (the end card may ask the viewer)
  for (const s of tl.shots) {
    if (s.scene === 'end') continue;
    for (const l of s.lines ?? []) if (l.speaker === 'NARRATOR' && /\byou(r|'re|'ll)?\b/i.test(l.text)) errors.push(`Narration: "${s.id}" addresses "you"; the narrator tells her own story.`);
  }
  // the other timeline is never narrated or Day-tagged (the viewer must not be told it is the past)
  for (const s of tl.shots.filter((x) => x.thread === '1982')) {
    if ((s.lines ?? []).length) errors.push(`1982: "${s.id}" has spoken lines; that thread stays silent until the reveal.`);
    if (s.hud) errors.push(`1982: "${s.id}" carries a time tag.`);
  }
  // costume continuity inside a scene: the same people in the same place on the same day wear the same thing
  {
    let day2 = 0;
    let runKey = '';
    let worn = new Map<string, string>();
    for (const s of tl.shots) {
      if (s.hud && 'day' in s.hud) day2 = s.hud.day;
      const p = (s.props ?? {}) as any;
      if (s.thread || s.scene !== 'stage') continue;
      const key = `${day2}:${p.set}`;
      if (key !== runKey) {
        runKey = key;
        worn = new Map();
      }
      for (const c of (p.cast ?? []) as any[]) {
        if (!['you', 'mira', 'ito', 'mum'].includes(c.who)) continue;
        const o = c.outfit ?? 'home';
        if (worn.has(c.who) && worn.get(c.who) !== o) errors.push(`Continuity: ${c.who} changes from "${worn.get(c.who)}" to "${o}" mid-scene in "${s.id}".`);
        worn.set(c.who, o);
      }
    }
  }
  // perspective: when the narrator says "I"/"we" about a scene, she must be in that scene (she only tells what she saw)
  {
    const isScene = (x: (typeof tl.shots)[number]) => !x.thread && ['stage', 'closeup', 'sky', 'thermal'].includes(x.scene);
    tl.shots.forEach((s, i) => {
      if (s.thread || s.scene !== 'stage') return;
      const first = (s.lines ?? []).some((l) => l.speaker === 'NARRATOR' && /\b(I|me|my|we|us|our)\b/.test(l.text));
      if (!first) return;
      const set = (s.props as any)?.set;
      let a = i;
      let b = i;
      while (a > 0 && isScene(tl.shots[a - 1]) && ((tl.shots[a - 1].props as any)?.set ?? set) === set) a--;
      while (b < tl.shots.length - 1 && isScene(tl.shots[b + 1]) && ((tl.shots[b + 1].props as any)?.set ?? set) === set) b++;
      const present = tl.shots.slice(a, b + 1).some((x) => (((x.props as any)?.cast ?? []) as any[]).some((c) => c.who === 'mira'));
      if (!present) errors.push(`Perspective: "${s.id}" is narrated in the first person but Mira is not in the scene.`);
    });
  }
  // letterbox belongs to sequences: an isolated letterboxed shot is ignored by the renderer
  tl.shots.forEach((s, i) => {
    if (s.letterbox && !tl.shots[i - 1]?.letterbox && !tl.shots[i + 1]?.letterbox) warnings.push(`Letterbox on isolated shot "${s.id}" is ignored (bars only run across sequences).`);
  });
  // captions: a lower-third callout must not sit on a face (seated/close shots put faces low in frame)
  for (const s of tl.shots) {
    const p = (s.props ?? {}) as any;
    if (s.scene !== 'stage' || !s.callout || s.callout.pos === 'top') continue;
    const cam = (p.cam ?? [[0, 1, 960, 540]]) as number[][];
    const k = cam[cam.length - 1];
    for (const c of (p.cast ?? []) as any[]) {
      if (c.who === 'biscuit' || (c.opacity ?? 1) < 0.5) continue;
      const faceY = c.y - 300 * 0.85 * c.depth * (String(c.pose ?? '').startsWith('sit') || c.pose === 'crouch' ? 0.55 : 1);
      const sy = (faceY - k[3]) * k[1] + 540;
      const sx = (c.x - k[2]) * k[1] + 960;
      if (sy > 760 && sy < 1080 && Math.abs(sx - 960) < 520) warnings.push(`Caption in "${s.id}" may cover ${c.who}'s face; use pos 'top'.`);
    }
  }
  // ── v4 continuity gates: nothing a person holds may pop in or out ─────────────────────────────
  {
    type Hold = {r?: string; l?: string};
    const MAIN = ['you', 'mira', 'ito', 'itoYoung', 'itoMid', 'mum', 'biscuit'];
    const resolve = (at: any, s: any) => {
      if (typeof at === 'number') return at;
      const m = /^l(\d+)([+-][\d.]+)?$/.exec(String(at));
      const l = m ? (s.timedLines ?? [])[Number(m[1])] : null;
      return (l ? l.startInShot : 0) + (m && m[2] ? Number(m[2]) : 0);
    };
    const endState = (s: any) => {
      const p = s.props ?? {};
      const st = new Map<string, Hold>();
      for (const c of (p.cast ?? []) as any[]) if (MAIN.includes(c.who)) st.set(c.who, {r: c.hold ?? undefined, l: c.holdL ?? undefined});
      const acts = [...((p.acts ?? []) as any[])].sort((a, b) => resolve(a.at, s) - resolve(b.at, s));
      for (const a of acts) {
        if (!st.has(a.who) && !(a.give && st.has(a.give))) continue;
        const h = st.get(a.who) ?? {};
        if ('hold' in a || 'holdL' in a) errors.push(`Props: "${s.id}" sets ${a.who}'s ${'hold' in a ? 'hold' : 'holdL'} directly at ${a.at}; use give/take/put so the change is seen.`);
        if (a.put || a.give) {
          if (a.left) h.l = undefined;
          else h.r = undefined;
          if (a.give) {
            if (!a.prop) errors.push(`Props: "${s.id}" give without prop.`);
            const g = st.get(a.give) ?? {};
            g.r = a.prop;
            st.set(a.give, g);
          }
        }
        if (a.take) {
          if (!a.prop) errors.push(`Props: "${s.id}" take without prop.`);
          if (a.left) h.l = a.prop;
          else h.r = a.prop;
        }
        st.set(a.who, h);
      }
      return st;
    };
    let day3 = 0;
    let prev: {key: string; end: Map<string, Hold>; id: string} | null = null;
    for (const s of tl.shots as any[]) {
      if (s.hud && 'day' in s.hud) day3 = s.hud.day;
      if (s.scene !== 'stage') continue;
      const p = s.props ?? {};
      const key = `${s.thread ?? ''}:${day3}:${p.set}`;
      if (prev && prev.key === key && !s.timeJump) {
        for (const c of (p.cast ?? []) as any[]) {
          if (!MAIN.includes(c.who) || !prev.end.has(c.who)) continue;
          const e = prev.end.get(c.who)!;
          const r = c.hold ?? undefined;
          const l = c.holdL ?? undefined;
          if (e.r !== r || e.l !== l) errors.push(`Props: ${c.who} ends "${prev.id}" holding [${e.r ?? '-'} | ${e.l ?? '-'}] but starts "${s.id}" holding [${r ?? '-'} | ${l ?? '-'}].`);
        }
      }
      prev = {key, end: endState(s), id: s.id};
    }
  }
  // ── v4 acting gates: no talk loops; gestures are rare and scripted ─────────────────────────────
  {
    const per = new Map<string, {lines: number; g: number}>();
    for (const s of tl.shots as any[]) {
      for (const a of ((s.props as any)?.acts ?? []) as any[]) if (a.loop === 'talk') errors.push(`Acting: "${s.id}" uses a 'talk' arm loop; people do not wave on every line.`);
      for (const l of s.lines ?? []) {
        if (['NARRATOR', 'RADIO', 'MUM_RADIO'].includes(l.speaker)) continue;
        const x = per.get(l.speaker) ?? {lines: 0, g: 0};
        x.lines++;
        if (l.g) x.g++;
        per.set(l.speaker, x);
        if (l.g === 'count' && !/\b(one|two|three|four|five|first|1|2|3|twenty|forty|sixteen)\b/i.test(l.text)) warnings.push(`Gesture: "count" on a line with no number in "${s.id}".`);
      }
    }
    for (const [spk, x] of per) if (x.g > Math.ceil(x.lines / 3)) errors.push(`Acting: ${spk} gestures on ${x.g} of ${x.lines} lines (cap: 1 in 3).`);
  }
  // ── v4 staging gates: speakers are in the shot; two people talking keep their sides (180° rule) ──
  {
    const SPK: Record<string, string> = {KAI: 'you', MIRA: 'mira', ITO: 'ito', MUM: 'mum', MAN: '*'};
    let side = new Map<string, number>();
    let runKey = '';
    let day4 = 0;
    for (const s of tl.shots as any[]) {
      if (s.hud && 'day' in s.hud) day4 = s.hud.day;
      if (s.scene !== 'stage') continue;
      const p = s.props ?? {};
      const cast = (p.cast ?? []) as any[];
      for (const l of s.lines ?? []) {
        const who = SPK[l.speaker];
        if (!who || who === '*') continue;
        if (!cast.some((c) => c.who === who || c.speaker === l.speaker)) errors.push(`Staging: ${l.speaker} speaks in "${s.id}" but is not in the shot.`);
      }
      const key = `${s.thread ?? ''}:${day4}:${p.set}`;
      if (key !== runKey) {
        runKey = key;
        side = new Map();
      }
      const fam = cast.filter((c) => ['you', 'mira', 'ito', 'mum'].includes(c.who));
      for (const a of fam)
        for (const b of fam) {
          if (a.who >= b.who) continue;
          const pair = `${a.who}|${b.who}`;
          const sgn = Math.sign(a.x - b.x);
          const moves = ((p.acts ?? []) as any[]).some((x) => (x.who === a.who || x.who === b.who) && x.to !== undefined);
          if (side.has(pair) && side.get(pair) !== sgn && !moves && sgn !== 0) errors.push(`Staging: ${a.who} and ${b.who} swap sides in "${s.id}" (180° rule).`);
          if (!moves) side.set(pair, sgn);
        }
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
