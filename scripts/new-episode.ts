// Stage 0 of docs/PIPELINE.md: scaffold a complete, self-contained episode folder from episodes/_template.
// Usage: npx tsx scripts/new-episode.ts <id> <slug> "<File label>" "<Working title>"
//   e.g. npx tsx scripts/new-episode.ts moon02 the-moon-stopped "FILE 002" "The Moon Stopped"
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {ROOT} from './load-episode';

const [id, slug, file = 'FILE 00X', title = 'Working title'] = process.argv.slice(2);
if (!id || !slug || !/^[a-z][a-z0-9]*$/.test(id)) throw new Error('usage: npx tsx scripts/new-episode.ts <id: lowercase letters/digits> <slug> "<FILE 00X>" "<title>"');
const dirName = `${id}-${slug}`;
const dir = join(ROOT, 'episodes', dirName);
if (existsSync(dir)) throw new Error(`episodes/${dirName} already exists`);
mkdirSync(join(dir, 'release'), {recursive: true});
const fill = (t: string) => t.replaceAll('{{ID}}', id).replaceAll('{{FILE}}', file).replaceAll('{{TITLE}}', title).replaceAll('{{DIR}}', dirName);
for (const f of ['script.ts', 'world-model.md', 'review-log.md']) writeFileSync(join(dir, f), fill(readFileSync(join(ROOT, 'episodes', '_template', f === 'script.ts' ? 'script.ts.tmpl' : f), 'utf8')));
// register it so the Remotion composition exists
const reg = join(ROOT, 'src', 'episodes.ts');
let src = readFileSync(reg, 'utf8');
src = src.replace(/(import \{sun01\}[^\n]*\n)/, `$1import {${id}} from '../episodes/${dirName}/script';\n`).replace(/export const EPISODES: Record<string, Episode> = \{([^}]*)\};/, (_m, inner) => `export const EPISODES: Record<string, Episode> = {${inner.trim()}, ${id}};`);
writeFileSync(reg, src);
console.log(`created episodes/${dirName}/ (script.ts, world-model.md, review-log.md, release/) and registered "${id}".`);
console.log('Next: docs/PIPELINE.md stage 1 (premise) → 2 (world model) → 3 (question bank) → 4 (screenplay + two cold reads).');
