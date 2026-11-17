// Direction sheet (docs/00 P1): for every shot where something moves (a cast member walking or running, an animal,
// a vehicle, or a moving insert such as a fish or a trail of prints), two frames 0.5 s apart, side by side, so a
// person can check at a glance that heads, toes and bonnets lead the motion. Writes out/review/<id>/direction-*.jpg.
// Usage: npx tsx scripts/direction-sheet.ts <id> [shotId,shotId…]
import {execSync} from 'node:child_process';
import {mkdirSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {buildTimeline, toFrames} from '../src/engine/timeline';
import {loadEpisode, ROOT} from './load-episode';

const id = process.argv[2] ?? 'sun01';
const only = process.argv[3]?.split(',');
const MOVING_INSERTS = ['fishIce', 'pawprints'];
const MOVING_SETS = ['bus', 'beach'];
const {episode, voice} = await loadEpisode(id);
const tl = buildTimeline(episode, voice);
const moving = tl.shots.filter((s) => {
  if (only) return only.includes(s.id);
  const p = (s.props ?? {}) as {acts?: {to?: unknown}[]; v?: string; set?: string};
  return (p.acts ?? []).some((a) => a.to !== undefined) || MOVING_INSERTS.includes(p.v ?? '') || (p.set === 'montage' && MOVING_SETS.includes(p.v ?? ''));
});
const out = join(ROOT, 'out', 'review', id, 'direction');
rmSync(out, {recursive: true, force: true});
mkdirSync(out, {recursive: true});
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const serveUrl = await bundle({entryPoint: join(ROOT, 'src/index.ts'), enableCaching: false});
process.on('exit', () => rmSync(serveUrl, {recursive: true, force: true}));
const composition = await selectComposition({serveUrl, id, inputProps: {episodeId: id}, browserExecutable});
const pairs: string[] = [];
for (const s of moving) {
  const t1 = s.start + Math.min(s.duration * 0.4, Math.max(0, s.duration - 0.7));
  const files = [t1, t1 + 0.5].map((t, k) => join(out, `${String(s.index).padStart(3, '0')}-${s.id}-${k}.jpg`));
  for (const [k, t] of [t1, t1 + 0.5].entries()) {
    await renderStill({serveUrl, composition, frame: toFrames(t, episode.fps), output: files[k], imageFormat: 'jpeg', jpegQuality: 80, scale: 0.35, inputProps: composition.props, browserExecutable});
  }
  const pair = join(out, `${String(s.index).padStart(3, '0')}-${s.id}.jpg`);
  execSync(`ffmpeg -v error -y -i "${files[0]}" -i "${files[1]}" -filter_complex "hstack,drawtext=text='${s.id}':x=10:y=10:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6" "${pair}"`);
  rmSync(files[0]);
  rmSync(files[1]);
  pairs.push(pair);
}
// contact sheets: 3 pairs per sheet, stacked
for (let i = 0; i < pairs.length; i += 3) {
  const group = pairs.slice(i, i + 3);
  const sheet = join(ROOT, 'out', 'review', id, `direction-${String(i / 3 + 1).padStart(2, '0')}.jpg`);
  execSync(`ffmpeg -v error -y ${group.map((g) => `-i "${g}"`).join(' ')} -filter_complex "${group.map((_, k) => `[${k}:v]`).join('')}vstack=inputs=${group.length}" "${sheet}"`);
}
console.log(`${moving.length} moving shots → out/review/${id}/direction-*.jpg (left: t, right: t + 0.5 s; head, toes and bonnets must lead)`);
