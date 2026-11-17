/**
 * Lists every word drawn on screen (SVG <text> in src/), so each one is a decision, not an accident.
 *
 * The rule (docs/06-episode-formula.md): words in frame must be things that would really be there
 * (a business card, a phone screen, a shop's own name). No slogans on vehicles or houses, no labels
 * explaining the story, no notes from the writers' room. Anything flagged here needs a reason to stay.
 *
 *   npx tsx scripts/audit-text.ts            # every literal string, grouped by file
 *   npx tsx scripts/audit-text.ts src/env    # one folder
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? 'src');

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, {withFileTypes: true}).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : p.endsWith('.tsx') ? [p] : [];
  });

// Phrases that read as captions or slogans rather than things in the world.
const SLOGANY = /\b(IS|ARE|NOT|NO|NEVER|ALWAYS|GOD|LORD|BLESSED|PERMANENT|FOR SALE)\b/;

let total = 0;
for (const file of walk(root)) {
  const src = fs.readFileSync(file, 'utf8');
  const hits: string[] = [];
  for (const m of src.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)) {
    const inner = m[1].replace(/\{[^}]*\}/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!inner || /^[.!?♪♫z·\s-]*$/.test(inner)) continue;
    const line = src.slice(0, m.index).split('\n').length;
    hits.push(`  ${SLOGANY.test(inner) ? '⚠' : '·'} ${path.relative(process.cwd(), file)}:${line}  "${inner}"`);
  }
  if (hits.length) {
    console.log(hits.join('\n'));
    total += hits.length;
  }
}
console.log(`\n${total} on-screen strings. ⚠ = reads like a slogan or caption; keep it only if it would really be there.`);
