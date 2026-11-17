// Render an episode's three thumbnails for review: npx tsx scripts/thumbs.ts <id> → out/review/<id>/thumb-{a,b,c}.png
// plus a 320×180 sheet (the size most viewers first see them at, docs/00 K2).
import {join} from 'node:path';
import {mkdirSync, rmSync} from 'node:fs';
import {execSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {ROOT} from './load-episode';

const id = process.argv[2];
const browserExecutable = process.env.REMOTION_BROWSER ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const serveUrl = await bundle({entryPoint: join(ROOT, 'src/index.ts'), enableCaching: false});
process.on('exit', () => rmSync(serveUrl, {recursive: true, force: true}));
const dir = join(ROOT, 'out', 'review', id);
mkdirSync(dir, {recursive: true});
for (const [suffix, name] of [['', 'a'], ['-b', 'b'], ['-c', 'c']]) {
  const composition = await selectComposition({serveUrl, id: `${id}-thumbnail${suffix}`, browserExecutable});
  await renderStill({serveUrl, composition, output: join(dir, `thumb-${name}.png`), browserExecutable});
}
execSync(`ffmpeg -y -loglevel error -i ${dir}/thumb-a.png -i ${dir}/thumb-b.png -i ${dir}/thumb-c.png -filter_complex "[0]scale=320:180[a];[1]scale=320:180[b];[2]scale=320:180[c];[a][b][c]hstack=3" ${dir}/thumbs-320.png`);
console.log(`✔ thumbnails → ${dir}/thumb-{a,b,c}.png, ${dir}/thumbs-320.png`);
