// Feet review sheet (docs/00 P14): every named character's contact with the ground, at the start and end of every stage
// shot, cropped from the real render. npx tsx scripts/feet-sheet.ts <id> → out/review/<id>/feet-NN.jpg
// The grounding gate in lint checks positions against each set's declared ground; this sheet is the eye check that the
// declared ground matches what the set actually draws.
import {execSync} from 'node:child_process';
import {mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {afterWalks, frameCamera, isNamed} from '../src/engine/framing';
import {camAt} from '../src/fx/cinema/camera';
import {groundAt} from '../src/engine/grounds';
import {ROOT} from './load-episode';

const id = process.argv[2];
const only = process.argv[3]; // optional: comma list of set names
const tl = JSON.parse(execSync(`npx tsx scripts/export-timeline.ts ${id}`, {cwd: ROOT, maxBuffer: 256 * 1024 * 1024}).toString());
const browserExecutable = process.env.REMOTION_BROWSER ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const serveUrl = await bundle({entryPoint: join(ROOT, 'src/index.ts'), enableCaching: false});
process.on('exit', () => rmSync(serveUrl, {recursive: true, force: true}));
const composition = await selectComposition({serveUrl, id, inputProps: {episodeId: id}, browserExecutable});
const dir = join(ROOT, 'out', 'review', id, 'feet');
rmSync(dir, {recursive: true, force: true});
mkdirSync(dir, {recursive: true});
const crops: string[] = [];
let n = 0;
for (const s of tl.shots) {
  const p = s.props ?? {};
  if (s.scene !== 'stage' || !(p.cast ?? []).length) continue;
  if (only && !only.split(',').includes(p.set)) continue;
  const cast0 = (p.cast as any[]).filter((c) => isNamed(c.who) && !c.carriedBy && (c.opacity ?? 1) > 0.2);
  if (!cast0.length) continue;
  const keys = frameCamera(p.cam ?? [[0, 1, 960, 540]], p.cast, p.acts ?? []);
  for (const [tag, prog] of [['a', 0.04], ['b', 0.96]] as const) {
    const cast = tag === 'a' ? cast0 : afterWalks(cast0, p.acts ?? []);
    const cam = camAt(keys, prog);
    const frame = Math.min(composition.durationInFrames - 1, Math.round((s.start + (s.end - s.start) * prog) * composition.fps));
    const png = join(dir, `f${n}.png`);
    await renderStill({serveUrl, composition, frame, output: png, inputProps: composition.props, browserExecutable});
    for (const c of cast) {
      const gy = groundAt(p.set, p.v ?? '', c.x, c.depth ?? 1.2);
      const fy = c.seat ? c.y : gy ?? c.y;
      const sx = Math.round(960 + (c.x - cam.x) * cam.z);
      const sy = Math.round(540 + (fy - cam.y) * cam.z);
      if (sx < 40 || sx > 1880 || sy < 40 || sy > 1060) continue;
      const w = Math.round(Math.max(160, 120 * cam.z));
      const h = Math.round(w * 0.62);
      const out = join(dir, `c${crops.length}.jpg`);
      const label = `${s.id} ${tag} ${c.who}`.replace(/[:']/g, '');
      execSync(`ffmpeg -v error -y -i ${png} -vf "crop=${w}:${h}:${Math.max(0, Math.min(1920 - w, sx - w / 2))}:${Math.max(0, Math.min(1080 - h, sy - h * 0.7))},scale=320:198,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='${label}':x=4:y=4:fontsize=13:fontcolor=white:box=1:boxcolor=black@0.6" ${out}`);
      crops.push(out);
    }
    rmSync(png);
    n++;
  }
}
const per = 48;
for (let i = 0; i * per < crops.length; i++) {
  const list = join(dir, `list${i}.txt`);
  writeFileSync(list, crops.slice(i * per, (i + 1) * per).map((c) => `file '${c}'`).join('\n'));
  execSync(`ffmpeg -v error -y -f concat -safe 0 -i ${list} -vf "tile=8x6" -frames:v 1 ${join(ROOT, 'out', 'review', id, `feet-${String(i + 1).padStart(2, '0')}.jpg`)}`);
}
console.log(`✔ ${crops.length} feet crops → out/review/${id}/feet-*.jpg`);
