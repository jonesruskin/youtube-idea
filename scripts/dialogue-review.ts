// Dialogue & logic review gate (docs/00 D8–D16). Every spoken line is read in context and signed off in a
// ledger; a signature only counts while the line's text is unchanged (hash), so any rewrite forces a re-read.
//
//   npx tsx scripts/dialogue-review.ts <id>            check (exit 1 on any unsigned, stale or unexplained line)
//   npx tsx scripts/dialogue-review.ts <id> --update   write the review sheet + add/refresh ledger rows (new = TODO)
//
// Writes out/review/<id>/dialogue-sheet.md: every exchange in order (previous line → this line, with flags),
// then each character's lines on their own (to catch knowledge, credit and voice slips), then all numbers said.
//
// Heuristic flags (each flagged line needs a written verdict in the ledger, not just ✓):
//   echo       a reply that repeats the other speaker's words flat ("You kept them alive." → "They kept me alive.")
//              instead of taking a stance ("No. They kept me alive.")
//   answer     a reply that doesn't answer the question asked (yes/no question without yes/no; why without a reason …)
//   narrator   the first-person narrator naming themselves in the third person
//   repeat     a phrase repeated from one of the five lines before (narrator restating the anchor, double counts)
//   referent   a line opening with a pronoun right after a cut and another speaker: check what it points to
//   credit     praise or thanks: did that person really do it, and didn't the speaker already know or say it?
//   numbers    two different counts of the same unit (43 years / 44 years): even when both are right, viewers hear a mistake
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {loadEpisode, ROOT} from './load-episode';

const id = process.argv[2];
const update = process.argv.includes('--update');
if (!id) throw new Error('usage: npx tsx scripts/dialogue-review.ts <id> [--update]');
const {episode, dir} = await loadEpisode(id);

type L = {key: string; shot: string; speaker: string; text: string; feel?: string; heart: boolean; flags: string[]};
const lines: L[] = [];
for (const s of episode.shots) (s.lines ?? []).forEach((l, i) => lines.push({key: `${s.id}:${i}`, shot: s.id, speaker: l.speaker, text: l.text, feel: l.feel, heart: !!s.beats?.includes('heart'), flags: []}));

const STOP = new Set('a an the and or but so to of in on at for with from by is are was were be been am it its it\'s this that these those i me my we us our you your he him his she her they them their there here what who why where when how do does did not no yes just very all one too up out as if then than can could will would should have has had get got'.split(' '));
const STANCE = /^(no|yes|yeah|yep|nope|well|but|so|exactly|right|oh|not|then|and|because|actually|okay|ok|maybe|probably|of course|i don't know|i don't think|i think|i'm not sure|not yet|it can't|it isn't|that's not|much|even|mm)\b/i;
const AUX = /^(is|are|was|were|do|does|did|can|could|will|would|should|have|has|am|shall|may|isn't|aren't|don't|didn't|won't|can't)\b/i;
const words = (t: string) => t.toLowerCase().replace(/[“”"…—–.,!?;:()]/g, ' ').split(/\s+/).filter(Boolean);
const stem = (w: string) => w.replace(/'s$/, '').replace(/(ies)$/, 'y').replace(/(?<=[a-z]{3})s$/, '');
const content = (t: string) => new Set(words(t).filter((w) => !STOP.has(w) && w.length > 2).map(stem));
const isNarr = (sp: string) => sp === 'NARRATOR';
const NAMES = (episode.narratorIs ?? []).map((n) => n.toLowerCase());

// v5.2 feeling checks (CEO: "Mum says 'You kept them alive.' This sentence has no emotion whatsoever").
// A person thanks, fears, teases, misses: they don't file a report. These catch the report-shaped line.
const FEELING_WORDS = /\b(thank|thanks|grateful|love|miss|so glad|so scared|sorry|please|proud|couldn't have|can't believe|mean[st]? (so much|everything)|i was (so )?(scared|worried)|oh|god|wow)\b/i;
const CALM = new Set(['calm', 'dry', 'firm']); // (a newsreader is always 'broadcast': the heart is in the family's reaction)
for (const l of lines) {
  if (isNarr(l.speaker)) continue;
  const t = l.text.trim();
  if (/^(you|you've|you have|you're)\s+(kept|saved|found|brought|looked after|took care|got|did|made|came|helped|stayed|carried|fixed)\b/i.test(t) && !FEELING_WORDS.test(t))
    l.flags.push('feeling: says what someone did, not what it means to the speaker (thank them, say what they feared, what it means)');
  if (l.heart && l.feel && CALM.has(l.feel)) l.flags.push(`feeling: a heart moment said "${l.feel}"; what does the speaker feel here?`);
  if (/!\s*$/.test(t) && l.feel && ['calm', 'tender', 'sad', 'tired', 'wistful', 'guilty', 'grieving'].includes(l.feel)) l.flags.push(`feeling: an exclamation said "${l.feel}"`);
}

for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  const p = lines[i - 1];
  const t = l.text.trim();
  // echo
  if (p && p.speaker !== l.speaker && !isNarr(l.speaker) && !isNarr(p.speaker)) {
    const c = content(t);
    const pc = content(p.text);
    const shared = [...c].filter((w) => pc.has(w));
    if (c.size >= 2 && shared.length / c.size >= 0.6 && !STANCE.test(t)) l.flags.push(`echo: repeats "${shared.join(', ')}" from ${p.speaker} flat; open with a stance (No, … / Yes, … / Well, …) or say it differently`);
  }
  // answer
  if (p && p.speaker !== l.speaker && !isNarr(l.speaker) && /\?\s*$/.test(p.text.trim())) {
    const q = p.text.trim().replace(/^[^a-z]*(?=[a-z])/i, '');
    const qBody = q.replace(/^(mr\.? \w+|mira|kai|mum|lola|tomás|tomas)[,.]?\s+/i, '');
    const a = t.toLowerCase();
    const isQ = /\?\s*$/.test(t);
    if (AUX.test(qBody) && !STANCE.test(t) && !isQ) l.flags.push(`answer: "${p.text}" is a yes/no question; the reply doesn't say yes, no or "I don't know"`);
    else if (/^why\b/i.test(qBody) && !/\b(because|so|to|since|cause)\b/.test(a) && !isQ) l.flags.push(`answer: "${p.text}" asks why; the reply gives no reason`);
    else if (/^who\b/i.test(qBody) && !/\b(me|you|him|her|them|us|nobody|someone|they|i|we|[A-Z]\w+)\b/.test(t) && !isQ) l.flags.push(`answer: "${p.text}" asks who; the reply names nobody`);
    else if (/^where\b/i.test(qBody) && !/\b(in|at|on|under|there|here|near|by|down|up|know)\b/.test(a) && !isQ) l.flags.push(`answer: "${p.text}" asks where; the reply names no place`);
    else if (/^when\b/i.test(qBody) && !/\b(soon|at|tomorrow|today|tonight|never|after|before|day|week|month|year|minute|hour|morning|night|o'clock|can)\b/.test(a) && !isQ) l.flags.push(`answer: "${p.text}" asks when; the reply gives no time`);
  }
  // narrator naming themselves
  if (isNarr(l.speaker)) for (const n of NAMES) if (new RegExp(`\\b${n}\\b`, 'i').test(t)) l.flags.push(`narrator: the narrator is ${n}; say "I/me/my", never "${n}"`);
  // repeat
  const w = words(t);
  for (let j = Math.max(0, i - 5); j < i; j++) {
    const pw = words(lines[j].text).join(' ');
    for (let k = 0; k + 3 <= w.length; k++) {
      const gram = w.slice(k, k + 3);
      if (gram.filter((x) => !STOP.has(x)).length < 2) continue;
      if (` ${pw} `.includes(` ${gram.join(' ')} `)) {
        l.flags.push(`repeat: "${gram.join(' ')}" was just said in ${lines[j].key} (${lines[j].speaker})`);
        k = w.length;
        j = i;
      }
    }
  }
  // referent
  if (p && p.shot !== l.shot && p.speaker !== l.speaker && /^(they|they're|their|them|those|he|she|his|her)\b/i.test(t))
    l.flags.push(`referent: opens with "${w[0]}" after a cut and a different speaker: is it clear what "${w[0]}" means?`);
  // credit
  if (/\b(clever|brilliant|genius|smart|well done|good (boy|girl|dog)|you found|you did it|thank(s| you)|kept (me|them|us|you) alive|saved)\b/i.test(t))
    l.flags.push('credit: praise or thanks. Did that person really do it, and does the speaker already know or own it (did they suggest it themselves earlier)?');
}
// numbers: same unit, different counts
const counts = new Map<string, Map<string, string>>();
const NUM = 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred'.split(' ');
for (const l of lines)
  for (const m of l.text.toLowerCase().matchAll(/((?:[a-z]+-)?[a-z]+|\d+)\s+(years|days|minutes|light-years)\b/g)) {
    const n = m[1];
    if (!/^\d+$/.test(n) && !NUM.some((x) => n.includes(x))) continue;
    const u = m[2];
    if (!counts.has(u)) counts.set(u, new Map());
    counts.get(u)!.set(n, l.key);
  }
const numberNotes: string[] = [];
for (const [u, m] of counts) {
  const keys = [...m.keys()];
  if (keys.length > 1) numberNotes.push(`${u}: ${keys.map((k) => `${k} (${m.get(k)})`).join(', ')}`);
}
// near-miss counts get a flag on each line that says them (e.g. forty-three vs forty-four)
const tens = (s: string) => s.split('-')[0];
for (const [u, m] of counts) {
  const ks = [...m.keys()];
  const unit = (x: string) => NUM.indexOf(x.split('-')[1] ?? '');
  for (const a of ks) for (const b of ks) if (a < b && a.includes('-') && b.includes('-') && tens(a) === tens(b) && Math.abs(unit(a) - unit(b)) === 1) {
    for (const k of new Set([m.get(a)!, m.get(b)!])) lines.find((l) => l.key === k)?.flags.push(`numbers: "${a} ${u}" and "${b} ${u}" are both said; viewers hear a contradiction even if both are right (use a year or one count)`);
  }
}

// ── sheet ──
const hash = (t: string) => createHash('sha1').update(t).digest('hex').slice(0, 8);
const sheet: string[] = [`# Dialogue sheet · ${id}`, '', 'Read every exchange as a first-time viewer. For each line ask: does it answer what was said? Is every "it/they/that" clear? Does the speaker already know this? Does credit go to whoever really did it? Would a real person say it this way?', '', '## Exchanges', ''];
let lastShot = '';
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.shot !== lastShot) sheet.push(`**${l.shot}**`);
  lastShot = l.shot;
  sheet.push(`- \`${l.key}\` **${l.speaker}**${l.feel ? ` *(${l.feel})*` : ''}: ${l.text}${l.flags.map((f) => `\n  - ⚑ ${f}`).join('')}`);
}
sheet.push('', '## Each character on their own', '');
for (const sp of [...new Set(lines.map((l) => l.speaker))]) {
  sheet.push(`### ${sp}`, ...lines.filter((l) => l.speaker === sp).map((l) => `- \`${l.shot}\` ${l.text}`), '');
}
sheet.push('## Numbers said aloud (same unit, several values)', '', ...(numberNotes.length ? numberNotes.map((n) => `- ${n}`) : ['- none']));
const outDir = join(ROOT, 'out', 'review', id);
mkdirSync(outDir, {recursive: true});
writeFileSync(join(outDir, 'dialogue-sheet.md'), sheet.join('\n') + '\n');

// ── ledger ──
const ledgerPath = episode.dialogueLedger ? join(ROOT, episode.dialogueLedger) : join(dir, 'dialogue-review.md');
const old = new Map<string, {hash: string; verdict: string}>();
if (existsSync(ledgerPath))
  for (const row of readFileSync(ledgerPath, 'utf8').split('\n')) {
    const m = row.match(/^\|\s*`([^`]+)`\s*\|\s*([0-9a-f]{8})\s*\|[^|]*\|[^|]*\|\s*(.*?)\s*\|\s*$/);
    if (m) old.set(m[1], {hash: m[2], verdict: m[3]});
  }
const fails: string[] = [];
const rows: string[] = [];
for (const l of lines) {
  const h = hash(`${l.speaker}|${l.text}|${l.feel ?? ""}`); // the feeling is part of the line: change it and it is re-read
  const o = old.get(l.key);
  let verdict = o && o.hash === h ? o.verdict : 'TODO';
  if (o && o.hash !== h) fails.push(`${l.key}: line changed since it was signed off; re-read it in context`);
  else if (!o) fails.push(`${l.key}: not signed off`);
  else if (verdict === 'TODO' || !verdict) fails.push(`${l.key}: TODO`);
  else if (l.flags.length && verdict.replace(/[✓\s]/g, '').length < 12) fails.push(`${l.key}: flagged (${l.flags.map((f) => f.split(':')[0]).join(', ')}) but the verdict doesn't explain why the line is right`);
  const flagCell = l.flags.map((f) => f.split(':')[0]).join(', ');
  rows.push(`| \`${l.key}\` | ${h} | ${l.speaker} · ${l.text.replace(/\|/g, '/')} | ${flagCell} | ${verdict.replace(/\|/g, '/')} |`);
}
if (update) {
  const head = [
    `# Dialogue review ledger · ${id}`,
    '',
    'Every spoken line, signed off after reading it in context (`out/review/' + id + '/dialogue-sheet.md`). A row only counts while its hash matches',
    'the line: change a line and it must be re-read. Flagged lines need a written reason, not just ✓. Rules: docs/00 D8–D16.',
    '',
    '| key | hash | line | flags | verdict |',
    '|---|---|---|---|---|',
  ];
  writeFileSync(ledgerPath, [...head, ...rows].join('\n') + '\n');
  console.log(`wrote ${ledgerPath.replace(ROOT, '')} and out/review/${id}/dialogue-sheet.md`);
}
const flagged = lines.filter((l) => l.flags.length).length;
if (fails.length) {
  console.log(`✖ dialogue review: ${fails.length} line(s) not signed off (${flagged} flagged by heuristics)`);
  fails.slice(0, 40).forEach((f) => console.log(`  ✖ ${f}`));
  if (fails.length > 40) console.log(`  … ${fails.length - 40} more`);
  process.exit(1);
}
console.log(`✔ dialogue review: all ${lines.length} lines signed off (${flagged} flagged, each with a written reason)`);
