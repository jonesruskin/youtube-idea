// ElevenLabs voiceover: one request per line, one voice per speaker, cached by content hash.
// Writes public/audio/<id>/<hash>.mp3 and public/voice/<id>.json (measured durations), which the
// timeline then uses instead of estimates — so the video, SRT and score all re-time to the real voice.
// Usage: npm run voice ep01        (needs ELEVENLABS_API_KEY + VOICE_* in .env; see docs/ELEVENLABS_SETUP.md)
import 'dotenv/config';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import type {Speaker} from '../src/engine/schema';
import type {VoiceMap} from '../src/engine/timeline';
import {loadEpisode, ROOT} from './load-episode';

const id = process.argv[2] ?? 'ep01';
const key = process.env.ELEVENLABS_API_KEY;
const model = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
if (!key) {
  console.error('ELEVENLABS_API_KEY is not set. Follow docs/ELEVENLABS_SETUP.md, then re-run `npm run voice ' + id + '`.');
  process.exit(1);
}

// Per-character delivery. Lower stability = more expressive; style adds performance.
const SETTINGS: Record<Speaker, {stability: number; similarity_boost: number; style: number}> = {
  EXECUTOR: {stability: 0.6, similarity_boost: 0.8, style: 0.25},
  JONAH: {stability: 0.38, similarity_boost: 0.8, style: 0.55},
  GRANDMA: {stability: 0.45, similarity_boost: 0.8, style: 0.5},
  MRS_BELLO: {stability: 0.5, similarity_boost: 0.8, style: 0.35},
  KADE: {stability: 0.55, similarity_boost: 0.85, style: 0.4},
  ANCHOR: {stability: 0.7, similarity_boost: 0.8, style: 0.15},
  CAPTAIN: {stability: 0.3, similarity_boost: 0.75, style: 0.6},
  FISHERMAN: {stability: 0.45, similarity_boost: 0.75, style: 0.4},
  ASSISTANT: {stability: 0.55, similarity_boost: 0.8, style: 0.3},
};

const voiceFor = (s: Speaker) => {
  const v = process.env[`VOICE_${s}`] || (s === 'FISHERMAN' || s === 'CAPTAIN' ? process.env.VOICE_CAPTAIN || process.env.VOICE_FISHERMAN : undefined);
  if (!v) throw new Error(`Missing VOICE_${s} in .env`);
  return v;
};

const {episode} = await loadEpisode(id);
const audioDir = join(ROOT, 'public', 'audio', id);
mkdirSync(audioDir, {recursive: true});
mkdirSync(join(ROOT, 'public', 'voice'), {recursive: true});
const mapPath = join(ROOT, 'public', 'voice', `${id}.json`);
const map: VoiceMap = existsSync(mapPath) ? JSON.parse(readFileSync(mapPath, 'utf8')) : {};

// Flatten lines so each request can pass its neighbours for natural prosody.
const flat = episode.shots.flatMap((s) => (s.lines ?? []).map((l, i) => ({key: `${s.id}:${i}`, ...l})));
let made = 0;
for (let i = 0; i < flat.length; i++) {
  const line = flat[i];
  const voiceId = voiceFor(line.speaker);
  const settings = SETTINGS[line.speaker];
  const hash = createHash('sha1').update(JSON.stringify([line.text, voiceId, model, settings])).digest('hex').slice(0, 12);
  const file = `audio/${id}/${hash}.mp3`;
  const abs = join(ROOT, 'public', file);
  if (existsSync(abs) && map[line.key]?.file === file) continue;

  const prev = flat[i - 1]?.speaker === line.speaker ? flat[i - 1].text : undefined;
  const next = flat[i + 1]?.speaker === line.speaker ? flat[i + 1].text : undefined;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {'xi-api-key': key, 'Content-Type': 'application/json'},
    body: JSON.stringify({text: line.text, model_id: model, voice_settings: settings, previous_text: prev, next_text: next}),
  });
  if (!res.ok) {
    console.error(`✖ ${line.key} (${line.speaker}): ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  type Align = {character_end_times_seconds?: number[]};
  const body = (await res.json()) as {audio_base64: string; alignment?: Align; normalized_alignment?: Align};
  const audio = Buffer.from(body.audio_base64, 'base64');
  writeFileSync(abs, audio);
  const ends = body.alignment?.character_end_times_seconds ?? body.normalized_alignment?.character_end_times_seconds ?? [];
  // Fallback: 128 kbps CBR → bytes × 8 / 128000.
  const seconds = (ends.length ? ends[ends.length - 1] : (audio.length * 8) / 128000) + 0.05;
  map[line.key] = {seconds, file};
  writeFileSync(mapPath, JSON.stringify(map, null, 2));
  made++;
  console.log(`✔ ${line.key.padEnd(22)} ${line.speaker.padEnd(10)} ${seconds.toFixed(2)}s`);
}
console.log(`\n${made} new line(s) voiced, ${flat.length - made} cached. Now run: npm run render ${id}`);
