// Free local voiceover with Kokoro-82M (Apache-2.0: commercial use allowed). Same output as scripts/tts.ts —
// public/audio/<id>/<hash>.mp3 plus public/voice/<id>.json — so timeline, SRTs, score and lip-sync re-time to it.
// ElevenLabs (`npm run voice`) stays the upgrade path; this needs no account.
// Usage: npm run voice:local bd01   (setup: docs/BORROWED_DAY_VOICE.md)
import {execFileSync, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import type {Speaker} from '../src/engine/schema';
import type {VoiceMap} from '../src/engine/timeline';
import {loadEpisode, ROOT} from './load-episode';

const id = process.argv[2] ?? 'bd01';
const PY = process.env.KOKORO_PYTHON ?? '/home/user/tts/venv/bin/python';

/** Casting: a Kokoro voice, accent and pace per speaker. The narrator gets the strongest voice. */
const CAST: Partial<Record<Speaker, {voice: string; lang: 'en-us' | 'en-gb'; speed: number}>> = {
  NARRATOR: {voice: 'af_heart', lang: 'en-us', speed: 0.95},
  RICHEST: {voice: 'am_michael', lang: 'en-us', speed: 1.0},
  MARCUS: {voice: 'am_onyx', lang: 'en-us', speed: 0.9},
  ADA: {voice: 'bf_emma', lang: 'en-gb', speed: 1.02},
  FRIEND: {voice: 'am_puck', lang: 'en-us', speed: 1.05},
  PRESIDENT: {voice: 'bm_george', lang: 'en-gb', speed: 0.95},
  MAMA: {voice: 'bf_isabella', lang: 'en-gb', speed: 1.0},
  SISTER: {voice: 'af_sky', lang: 'en-us', speed: 1.08},
  IYA: {voice: 'af_aoede', lang: 'en-us', speed: 1.0},
  YOU: {voice: 'am_echo', lang: 'en-us', speed: 1.0},
};

/** Spoken-only respellings (captions keep the real spelling). */
const SAY: [RegExp, string][] = [
  [/\bjollof\b/gi, 'jollaf'],
  [/\bEhn\?/g, 'Ehn!'],
  [/\bnaira\b/gi, 'nyra'],
  [/\bSix a\.m\./g, 'Six A M.'],
  [/^Then\.\.\. lunch in Paris\.$/, 'Then. Lunch, in Paris.'],
  [/^Eat\. You're too thin\.$/, 'Eat! You are too thin.'],
];
const spoken = (t: string) => SAY.reduce((s, [re, to]) => s.replace(re, to), t).replace(/\.\.\./g, '…');

const {episode} = await loadEpisode(id);
const audioDir = join(ROOT, 'public', 'audio', id);
mkdirSync(audioDir, {recursive: true});
mkdirSync(join(ROOT, 'public', 'voice'), {recursive: true});
const mapPath = join(ROOT, 'public', 'voice', `${id}.json`);
const map: VoiceMap = existsSync(mapPath) ? JSON.parse(readFileSync(mapPath, 'utf8')) : {};

type Job = {key: string; text: string; voice: string; lang: string; speed: number; out: string; file: string};
const jobs: Job[] = [];
const reuse: {key: string; file: string; of: string}[] = []; // identical lines (same text + voice) share one clip
const keep = new Set<string>();
for (const s of episode.shots)
  (s.lines ?? []).forEach((l, i) => {
    const cast = CAST[l.speaker];
    if (!cast) throw new Error(`No Kokoro voice cast for ${l.speaker}`);
    const key = `${s.id}:${i}`;
    keep.add(key);
    const text = spoken(l.text);
    const hash = createHash('sha1').update(JSON.stringify(['kokoro-v1.0', text, cast])).digest('hex').slice(0, 12);
    const file = `audio/${id}/${hash}.mp3`;
    if (existsSync(join(ROOT, 'public', file)) && map[key]?.file === file) return;
    const twin = jobs.find((j) => j.file === file);
    if (twin) return void reuse.push({key, file, of: twin.key});
    jobs.push({key, text, ...cast, out: join(audioDir, `${hash}.wav`), file});
  });
for (const k of Object.keys(map)) if (!keep.has(k)) delete map[k];

if (jobs.length) {
  const res = spawnSync(PY, ['-I', join(ROOT, 'scripts', 'kokoro_tts.py')], {input: JSON.stringify(jobs), encoding: 'utf8', maxBuffer: 1 << 26});
  if (res.status !== 0) {
    console.error(res.stderr);
    process.exit(1);
  }
  const done = new Map(res.stdout.trim().split('\n').map((l) => JSON.parse(l) as {key: string; seconds: number}).map((r) => [r.key, r.seconds]));
  for (const j of jobs) {
    const abs = join(ROOT, 'public', j.file);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', j.out, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '44100', '-b:a', '160k', abs]);
    rmSync(j.out);
    map[j.key] = {seconds: (done.get(j.key) ?? 0) + 0.05, file: j.file};
    console.log(`✔ ${j.key.padEnd(20)} ${j.voice.padEnd(12)} ${(done.get(j.key) ?? 0).toFixed(2)}s`);
  }
}
for (const r of reuse) map[r.key] = {...map[r.of], file: r.file};
writeFileSync(mapPath, JSON.stringify(map, null, 2));
console.log(`\n${jobs.length} line(s) voiced, ${keep.size - jobs.length} cached. Now: npm run render ${id}`);
