// Draw a File's film-twist device at random (docs/19): npx tsx scripts/pick-twist.ts <id>
// Excludes the devices of the three Files before it in the registry; seeded by the id (reproducible, nobody chooses).
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {ROOT} from './load-episode';

export const catalogue = () => {
  const md = readFileSync(join(ROOT, 'docs', '19-film-twists.md'), 'utf8');
  const cat = md.split('## Registry')[0];
  const devices = [...cat.matchAll(/^\| `([a-z-]+)` \| ([^|]+) \| ([^|]+) \|/gm)].map((m) => ({id: m[1], film: m[2].trim(), device: m[3].trim()}));
  const reg = [...md.split('## Registry')[1].matchAll(/^\| ([a-z0-9]+) \| `([a-z-]+)` \|/gm)].map((m) => ({file: m[1], device: m[2]}));
  return {devices, reg};
};

export const recentDevices = (id: string) => {
  const {reg} = catalogue();
  const i = reg.findIndex((r) => r.file === id);
  const before = i < 0 ? reg : reg.slice(0, i);
  return before.slice(-3).map((r) => r.device);
};

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

export const draw = (id: string, skip: string[] = []) => {
  const {devices} = catalogue();
  const banned = new Set([...recentDevices(id), ...skip]);
  const pool = devices.filter((d) => !banned.has(d.id));
  return pool[hash(`twist:${id}:${skip.join(',')}`) % pool.length];
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const id = process.argv[2];
  const skip = (process.argv[3] ?? '').split(',').filter(Boolean);
  const d = draw(id, skip);
  console.log(`${id}: excluded (last three Files) ${recentDevices(id).join(', ') || 'none'}${skip.length ? `; redrawn past ${skip.join(', ')}` : ''}`);
  console.log(`→ ${d.id}: ${d.film} — ${d.device}`);
}
