// Treatment gate (docs/00 S13–S16, PIPELINE stage 1): a File's story is checked on one page before anything is built.
//   npx tsx scripts/check-treatment.ts <id>
// Fails unless episodes/<id>-*/treatment.md has: a 50–70 character title; a premise; a hook; a clock with 6+ numbered
// steps (each with a number in it); a mystery with a question, an owner, 3+ plants and an answer; 4+ twists each
// written "We thought …, but …"; 6+ science facts each with a source; a heart (want, cost, payoff); a final image;
// 3 thumbnails; and a premise that is not a registered one (docs/premises.md).
import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {ROOT} from './load-episode';

const id = process.argv[2];
if (!id) throw new Error('usage: npx tsx scripts/check-treatment.ts <id>');
const dir = readdirSync(join(ROOT, 'episodes')).find((d) => d === id || d.startsWith(`${id}-`));
const file = dir ? join(ROOT, 'episodes', dir, 'treatment.md') : '';
if (!dir || !existsSync(file)) { console.log(`✖ no episodes/${id}-*/treatment.md`); process.exit(1); }
const md = readFileSync(file, 'utf8');
const sec = (name: string) => (new RegExp(`^## ${name}[^\\n]*\\n([\\s\\S]*?)(?=^## |\\Z)`, 'm').exec(md + '\n## ')?.[1] ?? '').trim();
const items = (t: string) => t.split('\n').filter((l) => /^\d+\.\s+\S/.test(l)).map((l) => l.replace(/^\d+\.\s+/, '').trim());
const field = (t: string, k: string) => (new RegExp(`^${k}:\\s*(.+)$`, 'mi').exec(t)?.[1] ?? '').trim();
const filled = (t: string) => t.length > 0 && !/[<>]/.test(t);
const fails: string[] = [];
const ok: string[] = [];
const need = (cond: boolean, pass: string, fail: string) => (cond ? ok : fails).push(cond ? pass : fail);

const title = sec('Title').split('\n')[0] ?? '';
need(filled(title) && title.length >= 50 && title.length <= 70, `title: ${title.length} characters`, `title: "${title}" is ${title.length} characters (50–70)`);
need(filled(sec('Premise')) && sec('Premise').split(/\s+/).length >= 30, 'premise', 'premise: write the causal chain (30+ words)');
need(filled(sec('Hook')) && sec('Hook').split(/\s+/).length >= 12, 'hook', 'hook: describe the impossible event as one picture');
const clock = sec('Clock');
const steps = items(clock);
need(filled(field(clock, 'Unit')), `clock unit: ${field(clock, 'Unit')}`, 'clock: name the unit');
need(steps.length >= 6 && steps.every((s) => /\d/.test(s) && filled(s)), `clock: ${steps.length} steps`, `clock: ${steps.length} steps with a number in each (need 6+)`);
const mys = sec('Mystery');
need(filled(field(mys, 'Question')) && field(mys, 'Question').includes('?'), 'mystery question', 'mystery: write the question (with a ?)');
need(filled(field(mys, 'Owner')), 'mystery owner', 'mystery: name who knows more than they say');
need(items(mys).filter(filled).length >= 3, `mystery: ${items(mys).length} plants`, `mystery: ${items(mys).length} plants (need 3+)`);
need(filled(field(mys, 'Answer')), 'mystery answer', 'mystery: write the answer');
const tw = items(sec('Twists'));
const good = tw.filter((t) => /^we thought .{8,}, but .{8,}/i.test(t) && filled(t));
need(good.length >= 4 && good.length === tw.length, `twists: ${good.length}`, `twists: ${good.length} of ${tw.length} written "We thought …, but …" (need 4+, all in that form)`);
const sci = items(sec('Science'));
const sourced = sci.filter((t) => /Source:\s*\S{3,}/.test(t) && filled(t));
need(sourced.length >= 6, `science: ${sourced.length} sourced facts`, `science: ${sourced.length} facts with "Source:" (need 6+)`);
const heart = sec('Heart');
need(['Want', 'Cost', 'Payoff'].every((k) => filled(field(heart, k))), 'heart', 'heart: want, cost and payoff');
need(filled(sec('Final image')), 'final image', 'final image: describe it');
need(items(sec('Thumbnails')).filter(filled).length >= 3, 'thumbnails: 3', 'thumbnails: 3 concepts');
need(filled(sec('Why someone subscribes after this')), 'subscribe reason', 'subscribe reason: one sentence');
// premise registry: not an event or title already used
const reg = readFileSync(join(ROOT, 'docs', 'premises.md'), 'utf8').split('\n').filter((l) => /^\| [a-z]/.test(l) && !l.startsWith('| id'));
const words = (t: string) => new Set(t.toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter((w) => w.length > 4));
const mine = words(`${title} ${sec('Premise')}`);
for (const row of reg) {
  const [rid, rtitle, rprem] = row.split('|').slice(1).map((x) => x.trim());
  if (rid === id) continue;
  const theirs = words(`${rtitle} ${rprem}`);
  const shared = [...theirs].filter((w) => mine.has(w)).length / Math.max(1, theirs.size);
  if (shared > 0.4) fails.push(`premise: shares ${Math.round(shared * 100)}% of its words with ${rid} ("${rtitle}"): a File is a new story (S11)`);
  if (rtitle.toLowerCase().split(/\s+/).slice(0, 4).join(' ') === title.toLowerCase().split(/\s+/).slice(0, 4).join(' ')) fails.push(`title: opens like ${rid}`);
}
if (!fails.some((f) => f.startsWith('premise') || f.startsWith('title: opens'))) ok.push('premise: new (registry)');
console.log(`\ncheck-treatment ${id}`);
ok.forEach((l) => console.log(`  ✔ ${l}`));
fails.forEach((l) => console.log(`  ✖ ${l}`));
console.log(fails.length ? `\n${fails.length} problem(s): the treatment is not ready to build.` : '\ntreatment passes: ready for the world model.');
process.exit(fails.length ? 1 : 0);
