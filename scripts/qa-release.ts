// Stage 10 of docs/PIPELINE.md: the gates on the final rendered files, plus the sheets for the visual pass.
// Usage: npx tsx scripts/qa-release.ts <id>
//   audio  — scripts/qa_audio.py on the master: −14 LUFS ±1, true peak ≤ −1 dBTP, every line ≥ 6 dB over the bed
//   motion — scripts/qa_motion.py on the web copy: 0 idle shots
//   frames — frame count of the web copy equals the timeline
//   sheets — a 0.5 fps filmstrip of the whole film to out/review/<id>/filmstrip-*.jpg (read against the screenplay)
// Exit code 1 if a gate fails. The visual pass (filmstrip, direction sheet, face strips) is logged in review-log.md.
import {execSync} from 'node:child_process';
import {existsSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {buildTimeline, toFrames} from '../src/engine/timeline';
import {loadEpisode, ROOT} from './load-episode';

const id = process.argv[2] ?? 'sun01';
const {episode, voice, dir} = await loadEpisode(id);
const tl = buildTimeline(episode, voice);
const rel = join(dir, 'release');
const master = join(rel, `${id}-master.mp4`);
const web = join(rel, `${id}.mp4`);
const py = existsSync('/home/user/.venv-sun/bin/python') ? '/home/user/.venv-sun/bin/python' : 'python3';
const tlPath = join(ROOT, 'out', `${id}-timeline.json`);
writeFileSync(tlPath, execSync(`npx tsx scripts/export-timeline.ts ${id}`, {cwd: ROOT}));
const results: [string, boolean, string][] = [];
const run = (name: string, cmd: string, pass: (out: string) => boolean) => {
  try {
    const out = execSync(cmd, {cwd: ROOT, stdio: 'pipe', maxBuffer: 64 * 1024 * 1024}).toString();
    results.push([name, pass(out), out.trim().split('\n').slice(-2).join(' · ')]);
  } catch (e) {
    const out = String((e as {stdout?: Buffer}).stdout ?? '') + String((e as {stderr?: Buffer}).stderr ?? '');
    results.push([name, false, out.trim().split('\n').slice(-3).join(' · ')]);
  }
};
for (const f of [master, web]) if (!existsSync(f)) throw new Error(`missing ${f}: render first (stage 9)`);
run('audio', `${py} scripts/qa_audio.py "${tlPath}" "${master}"`, (o) => /audio gates pass/.test(o));
run('motion', `python3 scripts/qa_motion.py "${web}" "${tlPath}"`, (o) => /\b0 idle shot/.test(o));
const frames = parseInt(execSync(`ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 "${web}"`).toString());
const want = toFrames(tl.duration, episode.fps);
results.push(['frames', Math.abs(frames - want) <= 1, `${frames} frames in the web copy, timeline ${want}`]);
// filmstrip for the visual pass
const sheets = join(ROOT, 'out', 'review', id);
mkdirSync(sheets, {recursive: true});
for (const f of execSync(`ls "${sheets}"`).toString().split('\n').filter((x) => x.startsWith('filmstrip-'))) rmSync(join(sheets, f));
execSync(`ffmpeg -v error -y -i "${web}" -vf "fps=0.5,scale=480:-1,tile=6x6" "${join(sheets, 'filmstrip-%02d.jpg')}"`);
console.log(`\nqa-release ${id}`);
for (const [n, ok, info] of results) console.log(`  ${ok ? '✔' : '✖'} ${n}: ${info}`);
console.log(`  → visual pass: out/review/${id}/filmstrip-*.jpg (+ direction-sheet.ts, eyelab.ts); log it in review-log.md`);
process.exit(results.every((r) => r[1]) ? 0 : 1);
