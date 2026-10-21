import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import type {Episode} from '../src/engine/schema';
import type {VoiceMap} from '../src/engine/timeline';

export const ROOT = new URL('..', import.meta.url).pathname;

/** Finds episodes/<id>-*\/script.ts plus public/voice/<id>.json (written by scripts/tts.ts, if voiced). */
export const loadEpisode = async (id: string) => {
  const dirName = readdirSync(join(ROOT, 'episodes')).find((d) => d === id || d.startsWith(`${id}-`));
  if (!dirName) throw new Error(`No episode folder for "${id}" in episodes/`);
  const dir = join(ROOT, 'episodes', dirName);
  const mod = await import(pathToFileURL(join(dir, 'script.ts')).href);
  const episode = Object.values(mod).find((v): v is Episode => typeof v === 'object' && v !== null && 'shots' in v);
  if (!episode) throw new Error(`episodes/${dirName}/script.ts exports no Episode`);
  const voicePath = join(ROOT, 'public', 'voice', `${id}.json`);
  const voice: VoiceMap = existsSync(voicePath) ? JSON.parse(readFileSync(voicePath, 'utf8')) : {};
  return {episode, voice, dir};
};
