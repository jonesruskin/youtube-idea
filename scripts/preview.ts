// Renders one still per shot (mid-point) for visual review, plus optional contact sheet.
// Usage: npx tsx scripts/preview.ts ep01 [shotId,shotId...] [--at=0.5] [--scale=0.5]
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {buildTimeline, toFrames} from '../src/engine/timeline';
import {loadEpisode, ROOT} from './load-episode';

const args = process.argv.slice(2);
const id = args[0] ?? 'ep01';
const only = args[1] && !args[1].startsWith('--') ? args[1].split(',') : null;
const at = Number(args.find((a) => a.startsWith('--at='))?.slice(5) ?? 0.5);
const scale = Number(args.find((a) => a.startsWith('--scale='))?.slice(8) ?? 0.5);
const browserExecutable = process.env.REMOTION_BROWSER ?? null;

const {episode, voice} = await loadEpisode(id);
const tl = buildTimeline(episode, voice);
const outDir = join(ROOT, 'out', 'preview', id);
mkdirSync(outDir, {recursive: true});

const serveUrl = await bundle({entryPoint: join(ROOT, 'src/index.ts')});
const composition = await selectComposition({serveUrl, id, inputProps: {episodeId: id}, browserExecutable});
const shots = tl.shots.filter((s) => !only || only.includes(s.id));
for (const s of shots) {
  const frame = toFrames(s.start + s.duration * at, episode.fps);
  const output = join(outDir, `${String(s.index).padStart(3, '0')}-${s.id}.jpg`);
  await renderStill({serveUrl, composition, frame, output, imageFormat: 'jpeg', jpegQuality: 80, scale, inputProps: composition.props, browserExecutable});
  console.log(`${output}  (frame ${frame})`);
}
