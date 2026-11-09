// Pacing linter: catches retention killers before anything is rendered.
// Usage: npm run lint:episode ep01
import {buildTimeline, formatTimestamp, wordCount} from '../src/engine/timeline';
import {loadEpisode} from './load-episode';
import {blinkAt, hashStr} from '../src/characters/toon/acting';

const id = process.argv[2] ?? 'ep01';
const {episode, voice} = await loadEpisode(id);
const tl = buildTimeline(episode, voice);

const errors: string[] = [];
const warnings: string[] = [];
// per-episode cast settings (defaults are File 001's)
const MAIN_CAST = episode.mainCast ?? ['you', 'mira', 'ito', 'mum'];
const NARR = episode.narratorCast ?? 'mira';
const NARR_NAME = (episode.narratorIs ?? ['Mira'])[0];
const SPK_CAST: Record<string, string> = episode.speakerCast ?? {KAI: 'you', MIRA: 'mira', ITO: 'ito', MUM: 'mum', MAN: '*'};
const COATS = episode.coatsFromDay ?? 1;
const NO_ANGRY = episode.noAngry ?? ['you', 'mira', 'ito'];

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
  // Narrated story files carry complete, explanatory lines (standards D1–D3), so they may run a little longer per
  // shot than clipped dialogue; no single shot may hold more than one long line (lint warns at 7 s; split those).
  const gate = (episode as {pacing?: number}).pacing ?? 4.0;
  if (avg > gate) errors.push(`Average shot is ${avg.toFixed(2)}s (gate ${gate}s): split the longest shots.`);
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
      if (!MAIN_CAST.includes(c.who) || c.who === 'mum') continue;
      const outfit = c.outfit ?? 'home';
      if (day < COATS && outfit !== 'home') errors.push(`Continuity: ${c.who} wears "${outfit}" before Day ${COATS} in "${s.id}".`);
      if (day >= COATS && outfit === 'home') errors.push(`Continuity: ${c.who} is still in summer clothes on Day ${day} in "${s.id}".`);
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
        if (!MAIN_CAST.includes(c.who)) continue;
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
      const present = tl.shots.slice(a, b + 1).some((x) => (((x.props as any)?.cast ?? []) as any[]).some((c) => c.who === NARR));
      if (!present) errors.push(`Perspective: "${s.id}" is narrated in the first person but ${NARR_NAME} is not in the scene.`);
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
    const MAIN = [...MAIN_CAST, 'itoYoung', 'itoMid', 'biscuit'];
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
  // ── v4 placed things: a prop put down stays in the set; a prop picked up was there before the hand arrived ──
  {
    const resolve = (at: any, s: any) => {
      if (at === undefined) return undefined;
      if (typeof at === 'number') return at;
      const m = /^l(\d+)([+-][\d.]+)?$/.exec(String(at));
      const l = m ? (s.timedLines ?? [])[Number(m[1])] : null;
      return (l ? l.startInShot : 0) + (m && m[2] ? Number(m[2]) : 0);
    };
    const PLACES = ['floor', 'table', 'desk'];
    let day5 = 0;
    let prev: {key: string; id: string; items: {prop: string; x: number}[]} | null = null;
    for (const s of tl.shots as any[]) {
      if (s.hud && 'day' in s.hud) day5 = s.hud.day;
      if (s.scene !== 'stage') continue;
      const p = s.props ?? {};
      const items = ((p.items ?? []) as any[]).map((it) => ({...it, f: resolve(it.from, s), u: resolve(it.until, s)}));
      for (const a of (p.acts ?? []) as any[]) {
        const place = a.put ?? a.take;
        if (!PLACES.includes(place)) continue;
        const hand = (resolve(a.at, s) ?? 0) + (a.dur ?? 0.8) * 0.5;
        // the kitchen draws Mira's drawing on the table itself, until `drawingUntil`
        const setOwned = a.take && a.prop === 'sunDrawing' && p.drawingUntil !== undefined && Math.abs((resolve(p.drawingUntil, s) ?? -9) - hand) < 0.35;
        const ok = setOwned || items.some((it) => it.prop === a.prop && (a.put ? it.f !== undefined && Math.abs(it.f - hand) < 0.35 : it.u !== undefined && Math.abs(it.u - hand) < 0.35));
        if (!ok) errors.push(`Props: "${s.id}" ${a.put ? 'puts' : 'takes'} ${a.prop} ${a.put ? 'on' : 'from'} the ${place} at ${a.at} with no item ${a.put ? 'appearing' : 'disappearing'} there (add items: {prop, x, y, ${a.put ? 'from' : 'until'}: hand time}).`);
      }
      const key = `${s.thread ?? ''}:${day5}:${p.set}:${p.v}`; // a place: the same set and variant
      const atStart = items.filter((it) => it.f === undefined || it.f <= 0.05);
      const atEnd = items.filter((it) => it.u === undefined || it.u >= s.duration - 0.05);
      if (prev && prev.key === key && !s.timeJump) {
        for (const it of prev.items) if (!atStart.some((x) => x.prop === it.prop && Math.abs(x.x - it.x) < 80)) errors.push(`Props: the ${it.prop} left in "${prev.id}" is missing from "${s.id}".`);
        for (const it of atStart) if (!prev.items.some((x) => x.prop === it.prop && Math.abs(x.x - it.x) < 80)) errors.push(`Props: a ${it.prop} appears in "${s.id}" that was not there in "${prev.id}".`);
      }
      prev = {key, id: s.id, items: atEnd};
    }
  }
  // ── v4 presence: nobody vanishes from a spot the next shot's camera can see ──────────────────────
  {
    const MAIN = [...MAIN_CAST, 'biscuit'];
    let day6 = 0;
    let prev: {key: string; id: string; pos: Map<string, [number, number, number]>} | null = null;
    for (const s of tl.shots as any[]) {
      if (s.hud && 'day' in s.hud) day6 = s.hud.day;
      if (s.scene !== 'stage') {
        continue;
      }
      const p = s.props ?? {};
      const key = `${s.thread ?? ''}:${day6}:${p.set}:${p.v}`;
      const cast = (p.cast ?? []) as any[];
      if (prev && prev.key === key && !s.timeJump) {
        const k0 = ((p.cam ?? [[0, 1, 960, 540]]) as number[][])[0];
        const half = 960 / k0[1] - 40;
        const halfY = 540 / k0[1];
        for (const [who, [x, y, h]] of prev.pos) {
          if (cast.some((c) => c.who === who)) continue;
          const vis = y > k0[3] - halfY + 20 && y - h < k0[3] + halfY - 20;
          if (Math.abs(x - k0[2]) < half && vis) errors.push(`Presence: ${who} is in "${prev.id}" but vanishes from "${s.id}", though their spot (x ${Math.round(x)}) is in frame.`);
        }
      }
      const pos = new Map<string, [number, number, number]>();
      for (const c of cast) {
        if (!MAIN.includes(c.who) || (c.opacity ?? 1) < 0.5) continue;
        let x = c.x;
        for (const a of (p.acts ?? []) as any[]) if (a.who === c.who && a.to !== undefined) x = Array.isArray(a.to) ? a.to[0] : a.to;
        const h = c.who === 'biscuit' ? 90 : 330 * c.depth * (c.who === 'mira' ? 0.62 : 1) * (String(c.pose ?? '').startsWith('sit') || c.pose === 'lie' ? 0.6 : 1);
        pos.set(c.who, [x, c.y, h]);
      }
      prev = {key, id: s.id, pos};
    }
  }
  // ── v4.1 face gates: expressions follow events, flow across cuts, and nobody watches a big moment blank ──
  {
    const MAIN = MAIN_CAST;
    const SETTLE: Record<string, string> = {surprised: 'alert', scared: 'uneasy'};
    const GROUPS = [
      ['neutral', 'focused', 'determined', 'alert', 'smile', 'sleepy', 'awe'],
      ['worried', 'uneasy', 'sad', 'cold', 'alert', 'focused', 'determined', 'scared', 'surprised'],
      ['smile', 'laugh', 'relieved', 'awe', 'neutral', 'alert', 'surprised'],
    ];
    const near = (a: string, b: string) => a === b || GROUPS.some((g) => g.includes(a) && g.includes(b));
    const SHOCK = ['surprised', 'scared'];
    const resolveT = (at: any, s: any) => {
      if (typeof at === 'number') return at;
      const m = /^l(\d+)([+-][\d.]+)?$/.exec(String(at));
      const l = m ? (s.timedLines ?? [])[Number(m[1])] : null;
      return (l ? l.startInShot : 0) + (m && m[2] ? Number(m[2]) : 0);
    };
    const exprs = (s: any) => {
      const p = s.props ?? {};
      const start = new Map<string, string>();
      const end = new Map<string, string>();
      const acted = new Set<string>();
      for (const c of (p.cast ?? []) as any[]) {
        if (!MAIN.includes(c.who)) continue;
        const e0 = c.expr ?? 'neutral';
        start.set(c.who, SETTLE[e0] ?? e0);
        end.set(c.who, SETTLE[e0] ?? e0);
      }
      const acts = ((p.acts ?? []) as any[]).filter((a) => a.expr && start.has(a.who)).sort((a, b) => resolveT(a.at, s) - resolveT(b.at, s));
      for (const a of acts) {
        end.set(a.who, SETTLE[a.expr] ?? a.expr);
        acted.add(a.who);
      }
      return {start, end, acted, acts};
    };
    let day7 = 0;
    const blackout = (tl.shots as any[]).find((x) => x.id === 'lights-out')?.index ?? Infinity;
    let prev: {key: string; id: string; end: Map<string, string>} | null = null;
    const shockRun = new Map<string, number>();
    for (const s of tl.shots as any[]) {
      if (s.hud && 'day' in s.hud) day7 = s.hud.day;
      if (s.scene !== 'stage') continue;
      const p = s.props ?? {};
      const key = `${s.thread ?? ''}:${day7}:${p.set}`;
      const {start, end, acted, acts} = exprs(s);
      // continuity across a cut in the same place
      if (prev && prev.key === key && !s.timeJump) {
        for (const [who, e] of start) {
          const pe = prev.end.get(who);
          if (pe && !near(pe, e)) errors.push(`Face: ${who} ends "${prev.id}" ${pe} but starts "${s.id}" ${e} (a face cannot jump between unrelated emotions across a cut).`);
        }
      }
      // a shock needs a cause in the shot, and nobody stays shocked for shot after shot
      const event = !!(s.sfx || s.dev || s.twist || (s.lines ?? []).length || (s.beats ?? []).length);
      for (const who of start.keys()) {
        const shocked = acts.some((a: any) => a.who === who && SHOCK.includes(a.expr));
        if (shocked && !event) errors.push(`Face: ${who} is startled in "${s.id}" with nothing happening.`);
        const n = shocked ? (shockRun.get(who) ?? 0) + 1 : 0;
        shockRun.set(who, n);
        if (n > 2) errors.push(`Face: ${who} is startled in ${n} shots in a row ("${s.id}"); let the reaction settle.`);
      }
      // heavy lids read as half-shut eyes: sleepy is for the breakfast before the Sun goes out, nowhere else
      if (s.index > blackout) for (const [who, e] of [...start, ...acts.map((a: any) => [a.who, a.expr] as [string, string])]) if (e === 'sleepy') errors.push(`Face: ${who} is sleepy in "${s.id}" after the Sun went out; half-shut eyes need a reason the viewer can see (use focused, cold or worried).`);
      // mood: no grins in dread, and no blank faces watching a big moment
      const grim = ['dread', 'tension', 'silence', 'sting', 'shellSting'].includes(s.cue);
      for (const [who, e] of start) {
        if (grim && ['laugh', 'smile'].includes(e) && !acted.has(who)) errors.push(`Face: ${who} smiles through a ${s.cue} moment in "${s.id}".`);
      }
      const big = s.twist || (s.beats ?? []).some((b: string) => ['wow', 'heart', 'loop'].includes(b)) || s.dev;
      if (big) for (const [who, e] of start) if (e === 'neutral' && !acted.has(who) && (p.cast as any[]).length > 1) errors.push(`Face: ${who} watches "${s.id}" with a blank face; give them the scene's feeling.`);
      prev = {key, id: s.id, end};
    }
  }
  // ── blinks: the engine never blinks twice in a flutter (two blinks with the eyes barely open between) ──
  {
    let minGap = 99;
    for (let k = 0; k < 300; k++) {
      const ev = Array.from({length: 6}, (_, i) => hashStr(`ev${k}:${i}`) * 10).sort((a, b) => a - b);
      let prev = 0;
      let lastStart = -99;
      for (let f = 0; f < 300; f++) {
        const v = blinkAt(f / 30, `lint${k}`, k % 2 === 0, ev);
        if (v >= 1 && prev < 1) {
          minGap = Math.min(minGap, f / 30 - lastStart);
          lastStart = f / 30;
        }
        prev = v;
      }
    }
    if (minGap < 0.95) errors.push(`Blinks: two blinks start ${minGap.toFixed(2)} s apart; anything under 1 s reads as a twitch.`);
  }
  // ── world state (docs/00 S3/S6): the episode's declared world rules, checked against every shot ──
  {
    const W = episode.world;
    if (W) {
      const order = tl.shots.map((x: any) => x.id);
      const idx = (id?: string) => (id ? order.indexOf(id) : -1);
      for (const [i, x] of (tl.shots as any[]).entries()) {
        const p = x.props ?? {};
        for (const rule of W.banLines ?? []) {
          if (rule.except?.includes(x.id)) continue;
          const re = new RegExp(rule.re, 'i');
          for (const l of x.lines ?? []) if (re.test(l.text)) errors.push(`World: "${x.id}" says "${l.text}", but ${rule.why}.`);
        }
        for (const rule of W.banProps ?? []) {
          if (rule.except?.includes(x.id)) continue;
          for (const cm of (p.cast ?? []) as any[]) {
            if (rule.who && !rule.who.includes(cm.who)) continue;
            if (cm.hold === rule.prop || cm.holdL === rule.prop) errors.push(`World: ${cm.who} holds a ${rule.prop} in "${x.id}", but ${rule.why}.`);
          }
          if (!rule.who) for (const it of (p.items ?? []) as any[]) if (it.prop === rule.prop) errors.push(`World: a ${rule.prop} lies in "${x.id}", but ${rule.why}.`);
          if (rule.prop === 'ham' && p.ham && !(rule.except ?? []).includes(x.id) && (rule.who ?? []).length === 0) errors.push(`World: "${x.id}" shows the ham radio, but ${rule.why}.`);
        }
        for (const rule of W.onlySfx ?? []) {
          if (x.sfx === rule.sfx && !rule.in.includes(x.id)) errors.push(`World: "${x.id}" plays ${rule.sfx}, but ${rule.why}.`);
          if ((x.beats ?? []).includes(rule.sfx) && !rule.in.includes(x.id)) errors.push(`World: "${x.id}" has a ${rule.sfx} beat, but ${rule.why}.`);
        }
        for (const rule of W.banSets ?? []) {
          if (p.set !== rule.set && x.scene !== rule.set) continue;
          if (rule.v && p.v !== rule.v && (p.props?.v ?? undefined) !== rule.v) continue;
          if (rule.prop && p[rule.prop] === undefined) continue;
          errors.push(`World: "${x.id}" uses ${rule.set}${rule.v ? ` · ${rule.v}` : ''}${rule.prop ? ` · ${rule.prop}` : ''}, but ${rule.why}.`);
        }
        for (const rule of W.presence ?? []) {
          // in person only: a voice on a phone call is not presence
          const here = ((p.cast ?? []) as any[]).some((cm) => cm.who === rule.who);
          if (!here || (rule.exceptSets ?? []).includes(p.set)) continue;
          if (rule.from && i < idx(rule.from)) errors.push(`World: ${rule.who} appears in "${x.id}" before "${rule.from}", but ${rule.why}.`);
          if (rule.until && i > idx(rule.until)) errors.push(`World: ${rule.who} appears in "${x.id}" after "${rule.until}", but ${rule.why}.`);
        }
      }
    }
  }
  // ── dialogue (docs/00 D2): no clipped clock times or jargon numbers ──
  for (const x of tl.shots as any[]) {
    for (const l of x.lines ?? []) {
      if (/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)-oh-(one|two|three|four|five|six|seven|eight|nine)\b/i.test(l.text)) errors.push(`Dialogue: "${x.id}" clips a time ("${l.text}"); say "four minutes past seven".`);
    }
  }
  // ── timing: every act, item and prop time that names a line (lN) must name a line the shot has ──
  for (const s of tl.shots as any[]) {
    const n = (s.lines ?? []).length;
    const check = (at: any, what: string) => {
      const m = /^l(\d+)/.exec(String(at ?? ''));
      if (m && Number(m[1]) >= n) errors.push(`Timing: "${s.id}" times ${what} to line ${m[1]}, but the shot has ${n} line(s).`);
    };
    const p = s.props ?? {};
    for (const a of (p.acts ?? []) as any[]) check(a.at, `an act for ${a.who}`);
    for (const it of (p.items ?? []) as any[]) {
      check(it.from, `the ${it.prop} item`);
      check(it.until, `the ${it.prop} item`);
    }
    for (const k of ['lampOn', 'tvOff', 'txOn', 'sunAt', 'flicker', 'sunrise', 'drawingUntil', 'setupAt']) check(p[k], k);
    if (s.callout) check(s.callout.at, 'the callout');
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
    const SPK = SPK_CAST;
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
      if (key !== runKey || s.timeJump) {
        runKey = key;
        side = new Map();
      }
      const fam = cast.filter((c) => MAIN_CAST.includes(c.who));
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
    for (const c of cast) if (NO_ANGRY.includes(c.who) && c.expr === 'angry') errors.push(`Expression: ${c.who} is angry in "${s.id}".`);
    for (const a of ((s.props as any)?.acts ?? []) as any[]) if (NO_ANGRY.includes(a.who) && a.expr === 'angry') errors.push(`Expression: ${a.who} turns angry in "${s.id}".`);
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
