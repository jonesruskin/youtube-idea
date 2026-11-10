// Text-safety gate (CEO v5.2: "the city names are blocked by a black border"). Renders the film in the browser
// without encoding (every Nth frame), reads every visible piece of text and the letterbox bars, and fails:
//   · bar      text hidden under a letterbox bar
//   · edge     text cut off by the frame edge
//   · overlap  two different labels on top of each other
//   · cover    an opaque shape painted over the letters (a lamp tube across a label)
// Text inside a set (shop signs; data-text="set") may be cropped; labels a viewer must read are tagged data-text="info".
// A problem must last ≥ 2 samples (≥ 0.5 s) so text sliding in or out doesn't count.
// Usage: npx tsx scripts/text-safe.ts sun01   (render.ts runs it before rendering a single chunk)
import {join} from 'node:path';
import {mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {bundle} from '@remotion/bundler';
import {renderFrames, selectComposition} from '@remotion/renderer';
import {buildTimeline} from '../src/engine/timeline';
import {loadEpisode, ROOT} from './load-episode';

type T = {t: string; q: number[][]; o: number; k: string; cover: number; cols?: number; clip: number[][]; v?: P};
type Sample = {f: number; bar: number; texts: T[]};
type P = number[][];

// convex polygon clipping (Sutherland–Hodgman) → exact overlap areas for rotated text boxes
const areaOf = (p: P) => Math.abs(p.reduce((s, [x, y], i) => s + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * y, 0)) / 2;
const clip = (subject: P, clipper: P): P => {
  const ccw = clipper.reduce((s, [x, y], i) => s + x * clipper[(i + 1) % clipper.length][1] - clipper[(i + 1) % clipper.length][0] * y, 0) > 0;
  let out = subject;
  for (let i = 0; i < clipper.length && out.length; i++) {
    const [ax, ay] = clipper[i];
    const [bx, by] = clipper[(i + 1) % clipper.length];
    const side = ([x, y]: number[]) => ((bx - ax) * (y - ay) - (by - ay) * (x - ax)) * (ccw ? 1 : -1);
    const inp = out;
    out = [];
    for (let j = 0; j < inp.length; j++) {
      const c = inp[j];
      const p = inp[(j + inp.length - 1) % inp.length];
      const sc = side(c);
      const sp = side(p);
      const cross = () => {
        const t = sp / (sp - sc);
        return [p[0] + (c[0] - p[0]) * t, p[1] + (c[1] - p[1]) * t];
      };
      if (sc >= 0) {
        if (sp < 0) out.push(cross());
        out.push(c);
      } else if (sp >= 0) out.push(cross());
    }
  }
  return out;
};
const box = (x: number, y: number, w: number, h: number): P => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const overlap = (a: P, b: P) => (a.length && b.length ? areaOf(clip(a, b)) : 0);

export const auditText = async (serveUrl: string, id: string, browserExecutable: string | null, every = 15) => {
  const {episode, voice} = await loadEpisode(id);
  const tl = buildTimeline(episode, voice);
  const comp = await selectComposition({serveUrl, id, inputProps: {episodeId: id, audit: true}, browserExecutable});
  const samples: Sample[] = [];
  await renderFrames({
    serveUrl,
    composition: comp,
    inputProps: comp.props,
    browserExecutable,
    imageFormat: 'none',
    everyNthFrame: every,
    frameRange: process.env.AUDIT_RANGE ? (process.env.AUDIT_RANGE.split("-").map(Number) as [number, number]) : null,
    concurrency: Number(process.env.CONCURRENCY ?? 4),
    outputDir: null,
    onStart: () => undefined,
    onFrameUpdate: () => undefined,
    onBrowserLog: (log) => {
      if (log.text.startsWith('TEXTAUDIT ')) samples.push(JSON.parse(log.text.slice(10)));
    },
  });
  samples.sort((a, b) => a.f - b.f);
  const shotAt = (f: number) => tl.shots.find((s) => f / comp.fps >= s.start && f / comp.fps < s.end)?.id ?? '?';
  const area = (a: T) => areaOf(a.q);
  const hits = new Map<string, number[]>(); // problem key → sample indices
  const note = (k: string, i: number) => hits.set(k, [...(hits.get(k) ?? []), i]);
  samples.forEach((s, i) => {
    const shot = shotAt(s.f);
    const frame = box(0, 0, 1920, 1080);
    // what can actually be seen of each text: its outline cropped by the panels it is drawn in and by the frame
    for (const a of s.texts) a.v = [...a.clip.map(([x, y, w, h]) => box(x, y, w, h)), frame].reduce((p, c) => (p.length ? clip(p, c) : p), a.q);
    for (const a of s.texts) {
      if (a.k === 'set') continue; // a sign in the set cropped by the frame or a bar is just the world; labels are not
      if (s.bar > 4) {
        const hidden = overlap(a.v!, box(0, 0, 1920, s.bar)) + overlap(a.v!, box(0, 1080 - s.bar, 1920, s.bar));
        if (hidden > 0.12 * area(a)) note(`bar|${shot}|${a.t}`, i);
      }
      const seen = a.v!.length ? areaOf(a.v!) : 0;
      if (a.k !== 'scroll' && a.o >= 0.6 && seen > 0.02 * area(a) && area(a) - seen > 0.15 * area(a)) note(`edge|${shot}|${a.t}`, i);
      // any hidden letter column fails (a 30% threshold once let a HUD box hide "EV" of "EVERY PORT…")
      if (a.k !== 'set' && a.o >= 0.6 && (a.cover > 0.3 || (a.cols ?? 0) >= 1)) note(`cover|${shot}|${a.t}`, i);
    }
    for (let p = 0; p < s.texts.length; p++)
      for (let q = p + 1; q < s.texts.length; q++) {
        const a = s.texts[p];
        const b = s.texts[q];
        // set signs may overlap each other (parallax); a label drawn on top of a set sign (later = on top) is fine
        if (a.t === b.t || a.o < 0.6 || b.o < 0.6 || (a.k === 'set' && b.k === 'set') || (a.k === 'set' && b.k !== 'set')) continue;
        if (a.v!.length && b.v!.length && overlap(a.v!, b.v!) > 0.25 * Math.min(area(a), area(b))) note(`overlap|${shot}|${[a.t, b.t].sort().join(' ⟷ ')}`, i);
      }
  });
  const errors: string[] = [];
  for (const [k, idx] of hits) {
    const lasting = idx.some((v, j) => idx[j + 1] === v + 1);
    if (!lasting) continue;
    const [kind, shot, what] = k.split('|');
    const why = kind === 'bar' ? 'is hidden under the letterbox bar' : kind === 'edge' ? 'is cut off by the frame or panel edge' : kind === 'cover' ? 'is covered by something drawn over it' : 'overlap each other';
    errors.push(`Text: "${what}" ${why} in "${shot}" (${(samples[idx[0]].f / comp.fps).toFixed(1)}s).`);
  }
  mkdirSync(join(ROOT, 'out', 'review', id), {recursive: true});
  writeFileSync(join(ROOT, 'out', 'review', id, 'text-audit.json'), JSON.stringify(samples));
  return {errors, samples: samples.length};
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const id = process.argv[2] ?? 'sun01';
  const serveUrl = await bundle({entryPoint: join(ROOT, 'src/index.ts'), enableCaching: false});
  // each bundle is ~470 MB in /tmp: remove it when the script ends (21 leaked bundles once filled the disk)
  process.on('exit', () => rmSync(serveUrl, {recursive: true, force: true}));
  const {errors, samples} = await auditText(serveUrl, id, process.env.REMOTION_BROWSER ?? null);
  for (const e of errors) console.log(`  ✖ ${e}`);
  console.log(errors.length ? `✖ text-safe: ${errors.length} problem(s) in ${samples} samples` : `✔ text-safe: ${samples} samples, every label visible`);
  process.exit(errors.length ? 1 : 0);
}
