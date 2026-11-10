// Trace what one character holds, shot by shot (start → end), to spot props that pop in or out across cuts:
//   npx tsx scripts/hold-trace.ts <id> <who>
import {loadEpisode} from './load-episode';
const [id, who] = process.argv.slice(2);
const {episode} = await loadEpisode(id);
let prev = '';
for (const s of episode.shots) {
  const p = (s.props ?? {}) as any;
  const c = (p.cast ?? []).find((x: any) => x.who === who);
  if (!c) { if (s.scene !== 'stage') continue; prev = `(not in ${s.id})`; continue; }
  let h = c.hold ?? '-', hl = c.holdL ?? '-';
  const start = `${h}|${hl}`;
  const ev: string[] = [];
  for (const a of p.acts ?? []) if (a.who === who) {
    if (a.take !== undefined) { h = a.prop; ev.push(`take ${a.prop}@${a.at}`); }
    if (a.put !== undefined) { ev.push(`put ${a.prop ?? h}→${a.put}@${a.at}`); if (h === (a.prop ?? h)) h = '-'; }
    if (a.give !== undefined) { ev.push(`give ${a.prop ?? h}→${a.give}@${a.at}`); h = '-'; }
    if (a.hold !== undefined) { ev.push(`HOLD=${a.hold}@${a.at}`); h = a.hold ?? '-'; }
  }
  const end = `${h}|${hl}`;
  const flag = prev && !prev.startsWith('(') && prev !== start ? '  ◀◀ CHANGED ACROSS CUT' : '';
  if (flag || ev.length) console.log(s.id.padEnd(20), start.padEnd(22), ev.join(', ').padEnd(40), end, flag, s.timeJump ? '(timeJump)' : '');
  prev = end;
}
