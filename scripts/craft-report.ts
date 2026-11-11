// Craft numbers for an episode (the bar is File 001): npx tsx scripts/craft-report.ts <id> [--json]
import {buildTimeline} from '../src/engine/timeline';
import {loadEpisode} from './load-episode';
import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {ROOT} from './load-episode';

export const craft = async (id: string) => {
  const {episode} = await loadEpisode(id);
  const vp = join(ROOT, 'public', 'voice', `${id}.json`);
  return craftOf(id, buildTimeline(episode, existsSync(vp) ? JSON.parse(readFileSync(vp, 'utf8')) : {}));
};

/** The craft numbers of a built timeline (used by lint's craft gate and by this report). */
export const craftOf = (id: string, tl: {shots: unknown[]; duration: number; lines: {text: string; speaker: string; start: number; end: number}[]}) => {
  const sh = tl.shots as any[];
  const min = tl.duration / 60;
  const words = tl.lines.reduce((a, l) => a + l.text.split(/\s+/).length, 0);
  const spoken = tl.lines.reduce((a, l) => a + (l.end - l.start), 0);
  const narr = tl.lines.filter((l) => l.speaker === 'NARRATOR');
  const narrWords = narr.reduce((a, l) => a + l.text.split(/\s+/).length, 0);
  const narrSec = narr.reduce((a, l) => a + (l.end - l.start), 0);
  const cuts = sh.filter((s, i) => i > 0 && !s.flow).length;
  const transitions = sh.filter((s) => s.transition && s.transition !== 'cut');
  const sfx = sh.filter((s) => s.sfx);
  const cueChanges = sh.filter((s) => s.cue).length;
  const inserts = sh.filter((s) => s.scene !== 'stage' && s.scene !== 'title' && s.scene !== 'end').length;
  const twists = sh.filter((s) => s.twist);
  // explanation after each twist: seconds of story until the next twist that are spent on it (lines + diagrams)
  const science = sh.filter((s) => s.science);
  const diagrams = sh.filter((s) => ['diagram', 'moon', 'space', 'globe', 'sky'].includes(s.scene) || (s.scene === 'moon'));
  const silence = sh.reduce((a, s) => a + Math.max(0, s.duration - (s.timedLines ?? []).reduce((b: number, l: any) => b + (l.end - l.start), 0)), 0);
  return {
    id, minutes: +min.toFixed(1), shots: sh.length,
    wpm: +(words / (spoken / 60)).toFixed(0), narratorWpm: +(narrWords / Math.max(1, narrSec / 60)).toFixed(0),
    talkShare: +(spoken / tl.duration).toFixed(2), breathingRoomSec: +silence.toFixed(0),
    cutsPerMin: +(cuts / min).toFixed(1), transitionsPerMin: +(transitions.length / min).toFixed(2), transitionKinds: [...new Set(transitions.map((s) => s.transition))].length,
    sfxPerMin: +(sfx.length / min).toFixed(2), cueChangesPerMin: +(cueChanges / min).toFixed(2), cueKinds: new Set(sh.map((s) => s.cue).filter(Boolean)).size,
    insertsPerMin: +(inserts / min).toFixed(2), twists: twists.length, secPerTwist: +(tl.duration / Math.max(1, twists.length)).toFixed(0),
    science: science.length, diagramSec: +diagrams.reduce((a, s) => a + s.duration, 0).toFixed(0),
    threads: new Set(sh.map((s) => s.thread).filter(Boolean)).size, places: new Set(sh.filter((s) => s.scene === 'stage').map((s) => s.props?.set)).size,
  };
};
if (import.meta.url === `file://${process.argv[1]}`) console.log(JSON.stringify(await craft(process.argv[2]), null, 1));
