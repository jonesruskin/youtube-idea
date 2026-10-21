// Full episode render → renders/<id>.mp4 (+ thumbnail, SRT, metadata).
// Usage: npm run render ep01   (set REMOTION_BROWSER=/path/to/chrome if the bundled one can't download)
import {execSync} from 'node:child_process';
import {join} from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {ROOT} from './load-episode';

const id = process.argv[2] ?? 'ep01';
const crf = Number(process.env.CRF ?? 20);
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const run = (cmd: string) => execSync(cmd, {cwd: ROOT, stdio: 'inherit'});

run(`npx tsx scripts/lint-episode.ts ${id}`);
run(`npx tsx scripts/make-score.ts ${id}`);
run(`npx tsx scripts/make-srt.ts ${id}`);
run(`npx tsx scripts/metadata.ts ${id} > /dev/null`);

const serveUrl = await bundle({entryPoint: join(ROOT, 'src/index.ts')});
const thumb = await selectComposition({serveUrl, id: `${id}-thumbnail`, browserExecutable});
await renderStill({serveUrl, composition: thumb, output: join(ROOT, 'renders', `${id}-thumbnail.png`), browserExecutable});

const composition = await selectComposition({serveUrl, id, inputProps: {episodeId: id}, browserExecutable});
let last = -1;
await renderMedia({
  serveUrl,
  composition,
  codec: 'h264',
  crf,
  audioBitrate: '192k',
  outputLocation: join(ROOT, 'renders', `${id}.mp4`),
  inputProps: composition.props,
  concurrency: Number(process.env.CONCURRENCY ?? 4),
  imageFormat: 'jpeg',
  jpegQuality: 92,
  browserExecutable,
  onProgress: ({progress}) => {
    const pct = Math.floor(progress * 100);
    if (pct !== last && pct % 5 === 0) console.log(`render ${pct}%`);
    last = pct;
  },
});
console.log(`done → renders/${id}.mp4`);
