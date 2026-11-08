// Renders the EyeLab review sheets (one per main character) to out/eyelab/<who>.png.
// Usage: npx tsx scripts/eyelab.ts [you,mira,ito]
import {mkdirSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {ROOT} from './load-episode';

const who = (process.argv[2] ?? 'you,mira,ito').split(',');
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const out = join(ROOT, 'out', 'eyelab');
mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: join(ROOT, 'src/index.ts'), enableCaching: false});
process.on('exit', () => rmSync(serveUrl, {recursive: true, force: true}));
for (const w of who) {
  const composition = await selectComposition({serveUrl, id: 'EyeLab', inputProps: {who: w}, browserExecutable});
  await renderStill({serveUrl, composition, output: join(out, `${w}.png`), inputProps: {who: w}, browserExecutable});
  console.log(join(out, `${w}.png`));
}
