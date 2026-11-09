// Stills for review: npx tsx scripts/stills.ts <id> <seconds…>  → out/review/<id>/stills/<s>.jpg (half size)
import {join} from 'node:path';
import {mkdirSync} from 'node:fs';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {ROOT} from './load-episode';

const [id, ...secs] = process.argv.slice(2);
const browserExecutable = process.env.REMOTION_BROWSER ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const serveUrl = await bundle({entryPoint: join(ROOT, 'src/index.ts'), enableCaching: false});
const composition = await selectComposition({serveUrl, id, inputProps: {episodeId: id}, browserExecutable});
const dir = join(ROOT, 'out', 'review', id, 'stills');
mkdirSync(dir, {recursive: true});
for (const s of secs.map(Number)) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(s * composition.fps));
  await renderStill({serveUrl, composition, frame, output: join(dir, `${s.toFixed(1)}.jpg`), imageFormat: 'jpeg', jpegQuality: 85, scale: Number(process.env.SCALE ?? 0.5), inputProps: composition.props, browserExecutable});
}
console.log(`✔ ${secs.length} still(s) → ${dir}`);
