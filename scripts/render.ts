// Full episode render → renders/<id>.mp4 (+ thumbnail, SRT, metadata).
// Usage: npm run render ep01   (set REMOTION_BROWSER=/path/to/chrome if the bundled one can't download)
// Cinema episodes (style: 'cinema', e.g. sun01) expect the Kokoro voice + cinematic score to exist already:
//   npx tsx scripts/export-timeline.ts sun01 > out/sun01-timeline.json
//   ~/.venv-sun/bin/python scripts/tts_kokoro.py out/sun01-timeline.json
//   npx tsx scripts/export-timeline.ts sun01 > out/sun01-timeline.json   (re-export with voiced timings)
//   ~/.venv-sun/bin/python scripts/score_cinema.py out/sun01-timeline.json
// and finish with a master pass: loudness to −14 LUFS / −1 dBTP, captions embedded as a soft subtitle track.
import {execSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {loadEpisode, ROOT} from './load-episode';

const id = process.argv[2] ?? 'ep01';
const crf = Number(process.env.CRF ?? 20);
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const run = (cmd: string) => execSync(cmd, {cwd: ROOT, stdio: 'inherit'});
const {episode, dir: epDir} = await loadEpisode(id);
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
const common = {serveUrl, composition, inputProps: composition.props, browserExecutable, concurrency: Number(process.env.CONCURRENCY ?? 4), imageFormat: 'jpeg' as const, jpegQuality: 92};
const progress = (label: string) => {
  let last = -1;
  return ({progress: p}: {progress: number}) => {
    const pct = Math.floor(p * 100);
    if (pct !== last && pct % 5 === 0) console.log(`${label} ${pct}%`);
    last = pct;
  };
};

if (!cinema) {
  await renderMedia({...common, codec: 'h264', crf, audioBitrate: '320k', outputLocation: raw, onProgress: progress('render')});
} else {
  // Resumable render: muted video in 60 s chunks + one audio pass, joined losslessly.
  // A container restart costs at most one chunk; re-run the same command to resume.
  const dir = join(ROOT, 'out', process.env.FRAMES ? 'chunks-dev' : 'chunks');
  const stampFile = join(dir, 'stamp');
  const voiceDir = join(ROOT, 'public', 'audio', id);
  const h = createHash('sha256');
  h.update(readFileSync(join(epDir, 'script.ts')));
  const voiceJson = join(ROOT, 'public', 'voice', `${id}.json`);
  if (existsSync(voiceJson)) h.update(readFileSync(voiceJson));
  h.update(execSync('git rev-parse HEAD:src && git diff HEAD -- src', {cwd: ROOT}).toString());
  const score = statSync(join(ROOT, 'public', 'audio', `${id}-score.wav`));
  h.update(`${score.size}:${score.mtimeMs}`);
  if (existsSync(voiceDir)) h.update(readdirSync(voiceDir).sort().join(','));
  h.update(`${crf}:${composition.durationInFrames}:${composition.fps}:${process.env.CHUNK_FRAMES ?? 1800}:${process.env.FRAMES ?? ''}`);
  const stamp = h.digest('hex');
  if (existsSync(dir) && (!existsSync(stampFile) || readFileSync(stampFile, 'utf8') !== stamp)) {
    console.log('chunks are stale → wiping out/chunks');
    rmSync(dir, {recursive: true, force: true});
  }
  mkdirSync(dir, {recursive: true});
  writeFileSync(stampFile, stamp);

  const total = composition.durationInFrames;
  const size = Number(process.env.CHUNK_FRAMES ?? 1800);
  const end = process.env.FRAMES ? Number(process.env.FRAMES) : total; // dev: render only the first N frames
  const n = Math.ceil(end / size);
  const files: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = i * size;
    const b = Math.min(end, a + size) - 1;
    const f = join(dir, `${id}-${String(i).padStart(3, '0')}.mp4`);
    files.push(f);
    if (existsSync(f)) { console.log(`chunk ${i + 1}/${n} already done`); continue; }
    const part = f.replace(/\.mp4$/, '.part.mp4');
    await renderMedia({...common, codec: 'h264', crf, muted: true, frameRange: [a, b], outputLocation: part, onProgress: progress(`chunk ${i + 1}/${n}`)});
    renameSync(part, f);
    console.log(`chunk ${i + 1}/${n} done (frames ${a}–${b})`);
  }
  const wav = join(dir, `${id}-audio.wav`);
  if (!existsSync(wav)) {
    // Same placement as Episode.tsx (score at 0, each line in its Sequence), mixed directly: seconds, not hours.
    const tlPath = join(ROOT, 'out', `${id}-timeline.json`);
    writeFileSync(tlPath, execSync(`npx tsx scripts/export-timeline.ts ${id}`, {cwd: ROOT}));
    const part = wav.replace(/\.wav$/, '.part.wav');
    run(`python3 scripts/mix_audio.py "${tlPath}" public/voice/${id}.json public/audio/${id}-score.wav "${part}" ${total / composition.fps}`);
    renameSync(part, wav);
  }
  const list = join(dir, 'list.txt');
  writeFileSync(list, files.map((f) => `file '${f}'`).join('\n') + '\n');
  run(`ffmpeg -v error -y -f concat -safe 0 -i "${list}" -i "${wav}" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -t ${end / composition.fps} "${raw}"`);
  const frames = parseInt(execSync(`ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 "${raw}"`).toString());
  if (frames !== end) throw new Error(`joined video has ${frames} frames, expected ${end}`);
  console.log(`joined ${n} chunks → ${frames} frames ✔`);
  if (process.env.FRAMES) { console.log(`dev run (FRAMES=${end}) → ${raw}`); process.exit(0); }
}

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
  rmSync(join(ROOT, 'out', 'chunks'), {recursive: true, force: true});
  console.log(`done → renders/${id}.mp4 (+ ${existsSync(hq) ? `${id}-hq.mp4, ` : ''}${id}.srt, ${id}-thumbnail.png, ${id}-metadata.md)`);
} else {
  console.log(`done → renders/${id}.mp4`);
}
