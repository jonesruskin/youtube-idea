// Gate self-test: plants every known defect (scripts/gate-mutations.ts) in File 001, one at a time, and checks that
// the lint stops it with the right error. A clean File 001 must also pass. Run after ANY change to the linter:
//   npx tsx scripts/test-gates.ts        (exit 1 if a gate no longer catches its defect)
import {spawnSync} from 'node:child_process';
import {MUTATIONS} from './gate-mutations';
import {ROOT} from './load-episode';

const lint = (mut?: string) => {
  const r = spawnSync('npx', ['tsx', 'scripts/lint-episode.ts', 'sun01'], {cwd: ROOT, env: {...process.env, ...(mut ? {LINT_MUTATE: mut} : {})}, encoding: 'utf8'});
  return `${r.stdout}\n${r.stderr}`;
};
let bad = 0;
const clean = lint();
if (!/✔ passes/.test(clean)) { console.log('✖ clean File 001 does not pass lint'); bad++; } else console.log('✔ clean File 001 passes');
for (const [name, m] of Object.entries(MUTATIONS)) {
  const out = lint(name);
  const hit = out.split('\n').find((l) => m.expect.test(l));
  if (hit) console.log(`✔ ${name.padEnd(12)} caught  (${m.caught})`);
  else { bad++; console.log(`✖ ${name.padEnd(12)} NOT caught  (${m.caught})  expected ${m.expect}`); }
}
console.log(bad ? `\n${bad} gate(s) failed their self-test.` : `\nall ${Object.keys(MUTATIONS).length} planted defects are caught.`);
process.exit(bad ? 1 : 0);
