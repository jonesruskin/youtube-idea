// Full episode render → renders/<id>.mp4 (+ thumbnail, SRT, metadata).
// Usage: npm run render ep01   (set REMOTION_BROWSER=/path/to/chrome if the bundled one can't download)
// Cinema episodes (style: 'cinema', e.g. sun01) expect the Kokoro voice + cinematic score to exist already:
//   npx tsx scripts/export-timeline.ts sun01 > out/sun01-timeline.json
//   ~/.venv-sun/bin/python scripts/tts_kokoro.py out/sun01-timeline.json
//   npx tsx scripts/export-timeline.ts sun01 > out/sun01-timeline.json   (re-export with voiced timings)
//   ~/.venv-sun/bin/python scripts/score_cinema.py out/sun01-timeline.json
// and finish with a master pass: loudness to −14 LUFS / −1 dBTP, captions embedded as a soft subtitle track.
import {execSync} from 'node:child_process';
import {existsSync, renameSync, statSync, unlinkSync} from 'node:fs';
import {join} from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {loadEpisode, ROOT} from './load-episode';

const id = process.argv[2] ?? 'ep01';
const crf = Number(process.env.CRF ?? 20);
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const run = (cmd: string) => execSync(cmd, {cwd: ROOT, stdio: 'inherit'});
const {episode} = await loadEpisode(id);
const cinema = episode.style === 'cinema';

run(`npx tsx scripts/lint-episode.ts ${id}`);
if (!cinema) run(`npx tsx scripts/make-score.ts ${id}`);
else if (!existsSync(join(ROOT, 'public', 'audio', `${id}-score.wav`))) throw new Error(`Missing public/audio/${id}-score.wav — run scripts/score_cinema.py first.`);
run(`npx tsx scripts/make-srt.ts ${id}`);
run(`npx tsx scripts/metadata.ts ${id} > /dev/null`);

const serveUrl = await bundle({entryPoint: join(ROOT, 'src/index.ts')});
const thumb = await selectComposition({serveUrl, id: `${id}-thumbnail`, browserExecutable});
await renderStill({serveUrl, composition: thumb, output: join(ROOT, 'renders', `${id}-thumbnail.png`), browserExecutable});

const composition = await selectComposition({serveUrl, id, inputProps: {episodeId: id}, browserExecutable});
const raw = join(ROOT, 'renders', cinema ? `${id}-raw.mp4` : `${id}.mp4`);
let last = -1;
await renderMedia({
  serveUrl,
  composition,
  codec: 'h264',
  crf,
  audioBitrate: '320k',
  outputLocation: raw,
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

if (cinema) {
  // Master: two-pass EBU R128 loudness normalisation, then embed the captions as a soft subtitle track.
  const r = (p: string) => join(ROOT, 'renders', p);
  const probe = execSync(`ffmpeg -hide_banner -i "${raw}" -af loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json -f null - 2>&1`, {cwd: ROOT}).toString();
  const m = JSON.parse(probe.slice(probe.lastIndexOf('{'), probe.lastIndexOf('}') + 1));
  const ln = `loudnorm=I=-14:TP=-1.0:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  run(`ffmpeg -v error -y -i "${raw}" -i "${r(`${id}.srt`)}" -map 0:v -map 0:a -map 1:0 -c:v copy -af "${ln},aresample=48000" -c:a aac -b:a 256k -c:s mov_text -metadata:s:s:0 language=eng -movflags +faststart "${r(`${id}-hq.mp4`)}"`);
  unlinkSync(raw);
  // Web copy for the repo (GitHub's 100 MB file limit): re-encode only if needed.
  const hq = r(`${id}-hq.mp4`);
  const mb = statSync(hq).size / 1e6;
  if (mb <= 95) {
    renameSync(hq, r(`${id}.mp4`));
  } else {
    const secs = Number(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${hq}"`).toString());
    const vk = Math.floor((90 * 8000) / secs - 192);
    run(`ffmpeg -v error -y -i "${hq}" -map 0 -c:v libx264 -preset slow -b:v ${vk}k -maxrate ${Math.floor(vk * 1.6)}k -bufsize ${vk * 2}k -c:a aac -b:a 192k -c:s copy -movflags +faststart "${r(`${id}.mp4`)}"`);
  }
  console.log(`done → renders/${id}.mp4 (+ ${existsSync(hq) ? `${id}-hq.mp4, ` : ''}${id}.srt, ${id}-thumbnail.png, ${id}-metadata.md)`);
} else {
  console.log(`done → renders/${id}.mp4`);
}
