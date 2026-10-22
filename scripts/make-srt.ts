// Writes a speaker-labelled .srt from the episode timeline (estimated timings until voiced;
// re-run after `npm run voice` and it uses the real ElevenLabs timings).
// Usage: npm run srt ep01 → renders/ep01.srt
import {mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {buildTimeline} from '../src/engine/timeline';
import {loadEpisode, ROOT} from './load-episode';

const id = process.argv[2] ?? 'ep01';
const {episode, voice} = await loadEpisode(id);
const tl = buildTimeline(episode, voice);

const ts = (s: number) => {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
};
const NAMES: Record<string, string> = {
  KEMI: 'KEMI',
  TUNDE: 'TUNDE',
  CUSTOMER: 'CUSTOMER',
  PASSENGER: 'PASSENGER',
  IYA: 'IYA OSUN',
  MAGS: 'MAGS',
  EXECUTOR: 'EXECUTOR',
  JONAH: 'JONAH',
  GRANDMA: 'GRANDMA',
  MRS_BELLO: 'MRS. BELLO',
  KADE: 'KADE',
  ANCHOR: 'NEWS ANCHOR',
  CAPTAIN: 'CAPTAIN (RADIO)',
  FISHERMAN: 'FISHERMAN',
  ASSISTANT: 'ASSISTANT',
};
// Split long lines into ≤2-row cues of ~42 chars so they read comfortably.
const chunk = (text: string, max = 84) => {
  const words = text.split(' ');
  const out: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) {
      out.push(cur.trim());
      cur = w;
    } else cur += ' ' + w;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
};
const wrap2 = (t: string) => {
  if (t.length <= 42) return t;
  const mid = t.lastIndexOf(' ', Math.ceil(t.length / 2) + 4);
  return `${t.slice(0, mid)}\n${t.slice(mid + 1)}`;
};

let n = 0;
const cues: string[] = [];
let lastSpeaker = '';
// Wordless beats (time cards, title) get a bracketed description so the file reads as a full log.
type Cue = {start: number; end: number; text: string};
const silent: Cue[] = tl.shots
  .filter((s) => !s.lines?.length)
  .map((s) => {
    const p = (s.props ?? {}) as Record<string, string>;
    const text = s.action ? `[${s.action}]` : `[${s.id}]`;
    return {start: s.start + 0.2, end: s.end - 0.2, text};
  });
const events = [...tl.lines.map((l) => ({kind: 'line' as const, start: l.start, l})), ...silent.map((c) => ({kind: 'silent' as const, start: c.start, c}))].sort((a, b) => a.start - b.start);
for (const ev of events) {
  if (ev.kind === 'silent') {
    cues.push(`${++n}\n${ts(ev.c.start)} --> ${ts(ev.c.end)}\n${ev.c.text}\n`);
    lastSpeaker = '';
    continue;
  }
  const l = ev.l;
  const parts = chunk(l.text);
  const total = parts.reduce((a, p) => a + p.length, 0);
  let t = l.start;
  parts.forEach((p, i) => {
    const d = ((l.end - l.start) * p.length) / total;
    const label = i === 0 && l.speaker !== lastSpeaker ? `${NAMES[l.speaker]}: ` : '';
    cues.push(`${++n}\n${ts(t)} --> ${ts(t + d)}\n${wrap2(label + p)}\n`);
    t += d;
  });
  lastSpeaker = l.speaker;
}
mkdirSync(join(ROOT, 'renders'), {recursive: true});
const out = join(ROOT, 'renders', `${id}.srt`);
writeFileSync(out, cues.join('\n'));
console.log(`${n} cues → ${out}`);

// Described version for reviewing without voice: each shot's stage direction as a bracketed cue
// (shown for its first ~3s, before the dialogue for that moment), then the dialogue.
const described: {start: number; end: number; text: string}[] = [];
for (const s of tl.shots) {
  if (s.action) described.push({start: s.start + 0.05, end: s.start + Math.min(3.2, s.duration - 0.1), text: `[${s.action}]`});
}
for (const l of tl.lines) described.push({start: l.start, end: l.end, text: `${NAMES[l.speaker]}: ${l.text}`});
described.sort((a, b) => a.start - b.start);
const dOut = join(ROOT, 'renders', `${id}-described.srt`);
writeFileSync(dOut, described.map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${c.text}\n`).join('\n'));
console.log(`${described.length} described cues → ${dOut}`);
