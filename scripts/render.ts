// Full episode render → episodes/<id folder>/release/: <id>.mp4 (web) + <id>-master.mp4, SRTs, metadata, thumbnails.
// Usage: npm run render ep01   (set REMOTION_BROWSER=/path/to/chrome if the bundled one can't download)
// Cinema episodes (style: 'cinema', e.g. sun01) expect the Kokoro voice + cinematic score to exist already:
//   npx tsx scripts/export-timeline.ts sun01 > out/sun01-timeline.json
//   ~/.venv-sun/bin/python scripts/tts_kokoro.py out/sun01-timeline.json
//   npx tsx scripts/export-timeline.ts sun01 > out/sun01-timeline.json   (re-export with voiced timings)
//   ~/.venv-sun/bin/python scripts/score_cinema.py out/sun01-timeline.json
// and finish with a master pass: loudness to −14 LUFS / −1 dBTP, captions embedded as a soft subtitle track.
import {execSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {loadEpisode, ROOT} from './load-episode';

const id = process.argv[2] ?? 'ep01';
const crf = Number(process.env.CRF ?? 20);
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const run = (cmd: string) => execSync(cmd, {cwd: ROOT, stdio: 'inherit'});
const {episode, dir: epDir} = await loadEpisode(id);
const rel = join(epDir, 'release');
mkdirSync(rel, {recursive: true});
const cinema = episode.style === 'cinema';

run(`npx tsx scripts/lint-episode.ts ${id}`);
if (!cinema) run(`npx tsx scripts/make-score.ts ${id}`);
else if (!existsSync(join(ROOT, 'public', 'audio', `${id}-score.wav`))) throw new Error(`Missing public/audio/${id}-score.wav — run scripts/score_cinema.py first.`);
run(`npx tsx scripts/make-srt.ts ${id}`);
run(`npx tsx scripts/metadata.ts ${id} > /dev/null`);

const serveUrl = await bundle({entryPoint: join(ROOT, 'src/index.ts'), enableCaching: false});
// each bundle is ~260 MB in /tmp: remove ours when the script ends, or the disk fills up across runs
process.on('exit', () => rmSync(serveUrl, {recursive: true, force: true}));
for (const [suffix, name] of [['', 'a'], ['-b', 'b'], ['-c', 'c']]) {
  const thumb = await selectComposition({serveUrl, id: `${id}-thumbnail${suffix}`, browserExecutable}).catch(() => null);
  if (thumb) await renderStill({serveUrl, composition: thumb, output: join(rel, `thumbnail-${name}.png`), browserExecutable});
}
run(`npx tsx scripts/metadata.ts ${id} > /dev/null`); // again, now that the thumbnails exist

const composition = await selectComposition({serveUrl, id, inputProps: {episodeId: id}, browserExecutable});
// v5.2: no frame renders until every label is visible (letterbox, frame/panel edges, overlaps, things drawn over it)
if (!process.env.REMIX && !process.env.FRAMES) {
  const {auditText} = await import('./text-safe');
  const {errors, samples} = await auditText(serveUrl, id, browserExecutable);
  if (errors.length) {
    for (const e of errors) console.log(`  ✖ ${e}`);
    throw new Error(`text-safe: ${errors.length} problem(s) in ${samples} samples — fix before rendering`);
  }
  console.log(`✔ text-safe: ${samples} samples, every label visible`);
}
const raw = cinema ? join(ROOT, 'out', `${id}-raw.mov`) : join(rel, `${id}.mp4`);
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
}
// What the picture depends on (script, voiced timings, engine) but not the score: lets an audio-only change remix.
const pictureStamp = () => {
  const h = createHash('sha256');
  h.update(readFileSync(join(epDir, 'script.ts')));
  const vj = join(ROOT, 'public', 'voice', `${id}.json`);
  if (existsSync(vj)) h.update(readFileSync(vj));
  h.update(execSync('git rev-parse HEAD:src && git diff HEAD -- src', {cwd: ROOT}).toString());
  h.update(`${crf}:${composition.durationInFrames}:${composition.fps}`);
  return h.digest('hex');
};
const picFile = join(rel, '.picture');
const mixWav = (wav: string) => {
  // Same placement as Episode.tsx (score at 0, each line in its Sequence), mixed directly: seconds, not hours.
  const tlPath = join(ROOT, 'out', `${id}-timeline.json`);
  writeFileSync(tlPath, execSync(`npx tsx scripts/export-timeline.ts ${id}`, {cwd: ROOT, maxBuffer: 256 * 1024 * 1024}));
  const part = wav.replace(/\.wav$/, '.part.wav');
  run(`python3 scripts/mix_audio.py "${tlPath}" public/voice/${id}.json public/audio/${id}-score.wav "${part}" ${composition.durationInFrames / composition.fps}`);
  renameSync(part, wav);
};
const master0 = join(rel, `${id}-master.mp4`);
if (cinema && process.env.REMIX) {
  // Audio-only pass (score or mix changed, picture didn't): reuse the master's video stream bit for bit, remix the
  // sound and re-master. Refused unless the master was built from exactly this picture (release/.picture).
  if (!existsSync(master0) || !existsSync(picFile) || readFileSync(picFile, 'utf8').trim() !== pictureStamp())
    throw new Error('REMIX refused: the picture changed since the master was rendered (or no .picture stamp) → full render');
  const wav = join(ROOT, 'out', `${id}-remix.wav`);
  mixWav(wav);
  run(`ffmpeg -v error -y -i "${master0}" -i "${wav}" -map 0:v -map 1:a -c:v copy -c:a pcm_s24le "${raw}"`);
  unlinkSync(wav);
  const frames = parseInt(execSync(`ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 "${raw}"`).toString());
  if (frames !== composition.durationInFrames) throw new Error(`remix video has ${frames} frames, expected ${composition.durationInFrames}`);
  console.log(`remix: picture reused (${frames} frames), sound rebuilt ✔`);
} else if (cinema) {
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
  // KEEP_CHUNKS=1: a fix that only touches later scenes keeps the chunks already verified (use with care)
  if (!process.env.KEEP_CHUNKS && existsSync(dir) && (!existsSync(stampFile) || readFileSync(stampFile, 'utf8') !== stamp)) {
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
  if (!existsSync(wav)) mixWav(wav);
  const list = join(dir, 'list.txt');
  writeFileSync(list, files.map((f) => `file '${f}'`).join('\n') + '\n');
  run(`ffmpeg -v error -y -f concat -safe 0 -i "${list}" -i "${wav}" -map 0:v -map 1:a -c:v copy -c:a pcm_s24le -t ${end / composition.fps} "${raw}"`);
  const frames = parseInt(execSync(`ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 "${raw}"`).toString());
  if (frames !== end) throw new Error(`joined video has ${frames} frames, expected ${end}`);
  console.log(`joined ${n} chunks → ${frames} frames ✔`);
  if (process.env.FRAMES) { console.log(`dev run (FRAMES=${end}) → ${raw}`); process.exit(0); }
}

if (cinema) {
  // Master: flat gain to −14 LUFS, then an 4×-oversampled limiter at −2 dBFS that only catches transient peaks
  // (true peak lands ≈ −1.5 dBTP after AAC). Unlike loudnorm's dynamic fallback, this keeps the film's dynamics.
  const r = (p: string) => join(rel, p);
  const meas = execSync(`ffmpeg -hide_banner -i "${raw}" -map 0:a -af ebur128=framelog=quiet -f null - 2>&1`, {cwd: ROOT, maxBuffer: 256 * 1024 * 1024}).toString();
  const inI = Number([...meas.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].pop()![1]);
  const gain = (-14 - inI + 0.6).toFixed(2); // +0.6 dB compensates what the limiter shaves off
  // AAC can overshoot the limiter; measure the encoded true peak and tighten the limiter until it is ≤ −1.2 dBTP.
  for (const lim of [0.794, 0.708, 0.631, 0.562]) {
    const chain = `aresample=192000,volume=${gain}dB,alimiter=limit=${lim}:attack=0.5:release=40:level=disabled,aresample=48000`;
    run(`ffmpeg -v error -y -i "${raw}" -i "${r(`${id}.srt`)}" -map 0:v -map 0:a -map 1:0 -c:v copy -af "${chain}" -c:a aac -b:a 256k -c:s mov_text -metadata:s:s:0 language=eng -movflags +faststart "${r(`${id}-master.mp4`)}"`);
    const pk = execSync(`ffmpeg -hide_banner -i "${r(`${id}-master.mp4`)}" -map 0:a -af ebur128=peak=true:framelog=quiet -f null - 2>&1`, {cwd: ROOT, maxBuffer: 256 * 1024 * 1024}).toString();
    const tp = Number([...pk.matchAll(/Peak:\s+(-?[\d.]+) dBFS/g)].pop()?.[1] ?? 0);
    console.log(`master: limiter ${lim} → true peak ${tp} dBTP`);
    if (tp <= -1.2) break;
  }
  unlinkSync(raw);
  if (!process.env.FRAMES) writeFileSync(picFile, pictureStamp() + '\n'); // the master now holds this picture
  // The master stays (Git LFS); a ~90 MB web copy sits beside it for quick viewing.
  const hq = r(`${id}-master.mp4`);
  const mb = statSync(hq).size / 1e6;
  if (mb <= 95) {
    copyFileSync(hq, r(`${id}.mp4`));
  } else {
    const secs = Number(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${hq}"`).toString());
    const vk = Math.floor((90 * 8000) / secs - 192);
    run(`ffmpeg -v error -y -i "${hq}" -map 0 -c:v libx264 -preset slow -b:v ${vk}k -maxrate ${Math.floor(vk * 1.6)}k -bufsize ${vk * 2}k -c:a aac -b:a 192k -c:s copy -movflags +faststart "${r(`${id}.mp4`)}"`);
  }
  rmSync(join(ROOT, 'out', 'chunks'), {recursive: true, force: true});
  // the release folder explains itself
  const size = (f: string) => (existsSync(r(f)) ? `${(statSync(r(f)).size / 1e6).toFixed(0)} MB` : '—');
  const rev = execSync('git rev-parse --short HEAD', {cwd: ROOT}).toString().trim();
  const voiceNote = process.env.VOICE === 'elevenlabs' ? 'ElevenLabs (final)' : 'Kokoro-82M, free local voices (placeholder: to be replaced with ElevenLabs once the picture is approved)';
  writeFileSync(
    r('README.md'),
    `# ${episode.file} · ${episode.youtubeTitle}\n\n` +
      `Everything needed to publish this episode. Big files are stored with Git LFS (\`git lfs pull\` to download them).\n\n` +
      `| file | what it is |\n|---|---|\n` +
      `| \`${id}-master.mp4\` | upload master: 1080p30, H.264, AAC 256k, −14 LUFS, soft English subtitles (${size(`${id}-master.mp4`)}) |\n` +
      `| \`${id}.mp4\` | web copy for quick viewing (${size(`${id}.mp4`)}) |\n` +
      `| \`${id}.srt\` | English captions for YouTube |\n` +
      `| \`${id}-described.srt\` | captions plus stage directions (review copy) |\n` +
      `| \`metadata.md\` | title, Test & Compare alternates, description with chapters and sources, tags, pinned comment, mid-rolls, end screen |\n` +
      `| \`thumbnail-a/b/c.png\` | three spoiler-free thumbnails for Test & Compare |\n\n` +
      `- **Runtime:** ${Math.floor(composition.durationInFrames / composition.fps / 60)}:${String(Math.round((composition.durationInFrames / composition.fps) % 60)).padStart(2, '0')}\n` +
      `- **Voice:** ${voiceNote}\n- **Music and sound:** synthesised score and sound design (scripts/score_cinema.py)\n- **Built from:** commit \`${rev}\`\n`,
  );
  console.log(`done → ${rel}: ${id}.mp4, ${id}-master.mp4, ${id}.srt, ${id}-described.srt, metadata.md, thumbnails`);
} else {
  console.log(`done → ${rel}/${id}.mp4`);
}
