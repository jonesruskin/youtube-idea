// One command for stage 6 of docs/PIPELINE.md: everything that can be checked before voicing and rendering.
// Usage: npx tsx scripts/check-episode.ts <id>
//   1. lint-episode (props, faces, blinks, sleepy, presence, 180°, timing, world state, dialogue, pacing)
//   2. question bank (docs/00 S4): ≥100 numbered questions, every one answered with a real shot id or OPEN, ≤2 OPEN
//   2b. dialogue ledger (docs/00 D8–D16): every line signed off in context (scripts/dialogue-review.ts)
//   2e. text-safe (docs/00 P12): labels under the letterbox, cut off, overlapping or covered (--fast skips)
//   3. packaging (docs/00 K1–K3): title 50–70 characters, no spoiler words in title / alternates / thumbnail text /
//      logline / tags / pinned comment
// Exit code 1 on any failure.
import {execSync} from 'node:child_process';
import {existsSync, readdirSync, readFileSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {loadEpisode, ROOT} from './load-episode';

const id = process.argv[2];
if (!id) throw new Error('usage: npx tsx scripts/check-episode.ts <id>');
const {episode} = await loadEpisode(id);
const fails: string[] = [];
const ok: string[] = [];

// 1 · lint
try {
  const out = execSync(`npx tsx scripts/lint-episode.ts ${id}`, {cwd: ROOT, stdio: 'pipe'}).toString();
  ok.push('lint: passes');
  const warn = out.split('\n').filter((l) => l.includes('⚠')).length;
  if (warn) ok.push(`lint: ${warn} warning(s) (advisory)`);
} catch (e) {
  const out = String((e as {stdout?: Buffer}).stdout ?? '');
  out.split('\n').filter((l) => l.includes('✖')).forEach((l) => fails.push(`lint: ${l.replace(/^\s*✖\s*/, '')}`));
  if (!fails.length) fails.push('lint: failed');
}

// 1b · the treatment exists and passes (stage 1), and the gates themselves still catch every known defect
if (id !== 'sun01' && id !== 'ep01') {
  try { execSync(`npx tsx scripts/check-treatment.ts ${id}`, {cwd: ROOT, stdio: 'pipe'}); ok.push('treatment: passes'); }
  catch { fails.push(`treatment: check-treatment ${id} fails (stage 1 comes before everything)`); }
}
if (!process.argv.includes('--fast')) {
  try { execSync('npx tsx scripts/test-gates.ts', {cwd: ROOT, stdio: 'pipe'}); ok.push('gate self-test: every planted defect is caught'); }
  catch (e: any) { fails.push('gate self-test: a gate no longer catches its defect (npx tsx scripts/test-gates.ts)'); }
}

// 2 · question bank
const qbPath = episode.questionBank ? join(ROOT, episode.questionBank) : null;
if (!qbPath || !existsSync(qbPath)) fails.push(`question bank: missing (set episode.questionBank; docs/00 S4)`);
else {
  const text = readFileSync(qbPath, 'utf8');
  const at = text.search(/^##+\s*(\d+\.\s*)?question bank/im);
  const bank = at >= 0 ? text.slice(at) : '';
  const qs = bank.split('\n').filter((l) => /^\d+\.\s/.test(l.trim()));
  const ids = new Set(episode.shots.map((s) => s.id));
  let open = 0;
  const unanswered: string[] = [];
  for (const q of qs) {
    if (/OPEN \(series\)/.test(q)) {
      open++;
      continue;
    }
    // the answer must cite at least one real shot id in brackets: (shot-a, shot-b)
    const cites = [...q.matchAll(/\(([^()]+)\)\s*$/g)].map((m) => m[1]);
    const shotsCited = cites.join(',').split(/[,\s]+/).map((x) => x.trim()).filter(Boolean);
    const real = shotsCited.filter((x) => ids.has(x));
    const fake = shotsCited.filter((x) => !ids.has(x));
    if (!real.length) unanswered.push(q.trim().slice(0, 90));
    else if (fake.length) unanswered.push(`${q.trim().slice(0, 60)} … cites unknown shot(s): ${fake.join(', ')}`);
  }
  if (qs.length < 100) fails.push(`question bank: only ${qs.length} questions (need ≥100)`);
  if (open > 2) fails.push(`question bank: ${open} OPEN questions (max 2)`);
  unanswered.forEach((q) => fails.push(`question bank: no real shot cited → ${q}`));
  if (qs.length >= 100 && open <= 2 && !unanswered.length) ok.push(`question bank: ${qs.length} questions, ${open} open on purpose, every answer cites a shot`);
}

// 2b · dialogue ledger (docs/00 D8–D16): every line signed off in context, flagged lines explained
try {
  const out = execSync(`npx tsx scripts/dialogue-review.ts ${id}`, {cwd: ROOT, stdio: 'pipe'}).toString();
  ok.push(out.trim().replace(/^✔\s*/, ''));
} catch (e) {
  const out = String((e as {stdout?: Buffer}).stdout ?? '');
  const lines = out.split('\n').filter((l) => l.trim());
  fails.push(lines[0]?.replace(/^✖\s*/, '') ?? 'dialogue review: failed');
  lines.slice(1, 12).forEach((l) => fails.push(`  ${l.trim()}`));
}

// 2b+ · real bodies (docs/00 P13): every Moon, Earth and planet is drawn from a real map; the gate tests itself first
{
  const {checkRealBodies} = await import('./real-bodies');
  const {errors, files} = checkRealBodies();
  if (errors.length) fails.push(...errors);
  else ok.push(`real bodies: ${files} source files, every Moon, Earth and planet from a real map (self-test passed)`);
}

// 2c · premise registry (docs/00 S11): a new story, not a re-use of an earlier episode's event or title
{
  const reg = join(ROOT, 'docs', 'premises.md');
  if (!existsSync(reg)) fails.push('premise registry: docs/premises.md missing');
  else {
    const STOPW = new Set('the a an and of to in on at for with my our is was were it its their they a i we when while from by as be up out this that what who'.split(' '));
    const words = (t: string) => new Set(t.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOPW.has(w)));
    const rows = readFileSync(reg, 'utf8').split('\n').filter((l) => /^\|\s*[a-z]+\d+\s*\|/.test(l)).map((l) => l.split('|').map((c) => c.trim()));
    const mine = rows.find((r) => r[1] === id);
    if (!mine) fails.push(`premise registry: ${id} is not registered in docs/premises.md`);
    const lead = (t: string) => t.toLowerCase().split(/\s+/).slice(0, 4).join(' ');
    for (const r of rows) {
      if (r[1] === id) continue;
      if (r[4] === 'archived' && mine?.[4] === 'released') continue; // a rejected later draft doesn't fail the original
      if (lead(r[2]) === lead(episode.title) || lead(r[2]) === lead(episode.youtubeTitle)) fails.push(`premise registry: title starts like ${r[1]} ("${r[2]}"); every episode is a new story (S11)`);
      if (mine) {
        const a2 = words(mine[3]);
        const b2 = words(r[3]);
        const shared = [...a2].filter((w) => b2.has(w));
        const j = shared.length / Math.max(1, Math.min(a2.size, b2.size));
        if (j > 0.3) fails.push(`premise registry: premise overlaps ${r[1]} (${shared.join(', ')}); every episode is a new story (S11)`);
      }
    }
    if (mine && !fails.some((f) => f.startsWith('premise registry'))) ok.push('premise registry: a new story (no shared event or title lead)');
  }
}

// 2d · the title and end cards belong to this episode (a File must never open with another File's title)
if (id !== 'sun01') {
  const tcard = episode.shots.find((x) => x.scene === 'title');
  const ecard = episode.shots.find((x) => x.scene === 'end');
  const tl = (tcard?.props as any)?.titleLines as string[] | undefined;
  if (!tcard || !tl?.length) fails.push('title card: set props.titleLines (the default is File 001\'s title)');
  else if (tl.join(' ').toLowerCase().includes('sun went out')) fails.push('title card: shows File 001\'s title');
  else ok.push(`title card: "${tl.join(' ')}"`);
  if (!ecard || !(ecard.props as any)?.motif) fails.push('end card: set props.motif (the default is File 001\'s shell)');
}

// 2e · text-safe (docs/00 P12): every label visible in the browser render (skip with --fast; render.ts always runs it)
if (!process.argv.includes('--fast')) {
  const {bundle} = await import('@remotion/bundler');
  const {auditText} = await import('./text-safe');
  const serveUrl = await bundle({entryPoint: join(ROOT, 'src/index.ts'), enableCaching: false});
  // each bundle is ~470 MB in /tmp: remove it when the script ends (21 leaked bundles once filled the disk)
  process.on('exit', () => rmSync(serveUrl, {recursive: true, force: true}));
  const {errors, samples} = await auditText(serveUrl, id, process.env.REMOTION_BROWSER ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell');
  if (errors.length) fails.push(...errors);
  else ok.push(`text-safe: ${samples} samples, every label visible`);
}

// 3 · packaging
const t = episode.youtubeTitle;
if (t.length < 50 || t.length > 70) fails.push(`title: "${t}" is ${t.length} characters (50–70)`);
else ok.push(`title: ${t.length} characters`);
const spoilers = (episode.spoilers ?? []).map((s) => s.toLowerCase());
const surfaces: [string, string][] = [
  ['title', t],
  ...(episode.titleAlternates ?? []).map((a, i) => [`alternate ${i + 1}`, a] as [string, string]),
  ['thumbnail text', episode.thumbnailText],
  ['logline', episode.logline],
  ['tags', episode.tags.join(' · ')],
  ['pinned comment', episode.pinnedComment],
];
// the three thumbnail concepts in the treatment are packaging too (vol/moon B and C live only there and in the tsx)
const treatmentPath = join(ROOT, 'episodes', readdirSync(join(ROOT, 'episodes')).find((d) => d.startsWith(`${id}-`)) ?? id, 'treatment.md');
if (existsSync(treatmentPath)) {
  const m = readFileSync(treatmentPath, 'utf8').match(/## Thumbnails\n([\s\S]*?)(\n## |$)/);
  if (m) m[1].split('\n').filter((l) => l.trim()).forEach((l, i) => surfaces.push([`thumbnail concept ${i + 1}`, l]));
}
// series-wide reveal words: a thumbnail or title that says someone knew, hid or lied gives away the mystery's owner
// (the CEO rejected "HE KNEW" on File 001; "SHE KNEW" reached File 002's treatment before this line existed)
const REVEAL = ['knew', 'secret', 'secretly', 'lied', 'lying', 'liar', 'hid', 'hiding', 'hidden truth', 'the truth', 'betrayed', 'traitor', 'twist', 'behind it'];
for (const [where, text] of surfaces) {
  const low = ` ${text.toLowerCase()} `;
  for (const w of REVEAL) if (new RegExp(`[^a-z]${w}[^a-z]`).test(low)) fails.push(`spoiler: reveal word "${w}" in ${where} (docs/00 K1: never say who knows)`);
  for (const sp of spoilers) if (new RegExp(`[^a-z]${sp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^a-z]`).test(low)) fails.push(`spoiler: "${sp}" in ${where}`);
}
if (!spoilers.length) fails.push('spoilers: episode.spoilers is empty (docs/00 K1)');
else ok.push(`spoilers: none of ${spoilers.length} spoiler words appear in title, thumbnails, logline, tags or pinned comment`);

console.log(`\ncheck-episode ${id}`);
ok.forEach((l) => console.log(`  ✔ ${l}`));
fails.forEach((l) => console.log(`  ✖ ${l}`));
console.log(fails.length ? `\n${fails.length} problem(s).` : '\nall checks pass.');
process.exit(fails.length ? 1 : 0);
