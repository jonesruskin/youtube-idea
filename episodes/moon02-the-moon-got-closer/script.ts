import type {Line, Shot, Episode} from '../../src/engine/schema';
import {line} from '../../src/engine/delivery';

// PREVIEW SKELETON (set review only): the real shot list replaces this once the sets pass their stills review.
type G = Line['g'];
const L =
  (speaker: Line['speaker']) =>
  (text: string, pause?: number, g?: G): Line => line(speaker, text, pause, g);
const N = L('NARRATOR');
type Cam = [number, number, number, number, number?];
const hold = (z: number, x: number, y: number): Cam[] => [[0, z, x, y], [1, z * 1.04, x, y]];
type C = {who: string; x: number; y: number; depth: number; [k: string]: unknown};
const c = (who: string, x: number, y: number, o: Record<string, unknown> = {}, depth = 1.2): C => ({who, x, y, depth, ...o});
const stage = (set: string, v: string, cam: Cam[], cast: C[], acts: Record<string, unknown>[] = [], extra: Record<string, unknown> = {}) => ({scene: 'stage', props: {set, v, cam, cast, acts, ...extra}});
const sh = (id: string, base: {scene: string; props?: Record<string, unknown>}, o: Partial<Shot> = {}): Shot => ({id, ...base, ...o}) as Shot;
const sc = (scene: string, props: Record<string, unknown> = {}) => ({scene, props});
const P = [c('nana', 980, 930, {facing: 'right'}), c('wren', 1200, 930, {facing: 'left'})];
const shots: Shot[] = [
  sh('p1', stage('nanakitchen', 'day', hold(1, 960, 540), [c('nana', 760, 930, {facing: 'right'}), c('wren', 1060, 930, {facing: 'left'}), c('tess', 1480, 930, {facing: 'left'})], [], {sea: 1.7, moon: 1.1}), {lines: [N('(calm) Preview one.')]}),
  sh('p2', stage('nanakitchen', 'night', hold(1.3, 900, 600), [c('nana', 840, 930, {pose: 'sitChair', seat: 'chair', facing: 'right'})], [], {sea: 2, moon: 1.3}), {lines: [N('(calm) Preview two.')]}),
  sh('p3', stage('boardroom', 'day', hold(1, 960, 540), [c('nana', 760, 930, {facing: 'right'}), c('wren', 560, 930, {facing: 'right'}), c('pell', 1500, 930, {facing: 'left'})]), {lines: [N('(calm) Preview three.')]}),
  sh('p4', stage('chapelin', 'night', hold(1, 960, 540), P, [], {moon: 2.7, sea: 30}), {lines: [N('(calm) Preview four.')]}),
  sh('p5', sc('moon', {v: 'log', extra: 1, rows: [['1', '1.7 m', '1.3 m', ''], ['2', '1.7 m', '1.3 m', ''], ['3', '1.8 m', '1.2 m', '+0.1 m']]}), {lines: [N('(calm) Preview five.')]}),
  sh('p6', sc('moon', {v: 'sum'}), {lines: [N('(calm) Preview six, the sum page.')]}),
  sh('p7', sc('moon', {v: 'orbit', from: 384000, to: 290000}), {lines: [N('(calm) Preview seven.')]}),
  sh('p8', sc('moon', {v: 'cube'}), {lines: [N('(calm) Preview eight.')]}),
  sh('p9', sc('moon', {v: 'sling'}), {lines: [N('(calm) Preview nine.')]}),
  sh('p10', sc('moon', {v: 'grain'}), {lines: [N('(calm) Preview ten.')]}),
  sh('p11', sc('moon', {v: 'roche'}), {lines: [N('(calm) Preview eleven.')]}),
  sh('p12', sc('moon', {v: 'leaves', from: 128000, to: 128000}), {lines: [N('(calm) Preview twelve.')]}),
  sh('p13', sc('moon', {v: 'title'}), {lines: [N('(calm) Preview thirteen.')]}),
  sh('p14', sc('moon', {v: 'deeds'}), {hud: {day: 60, km: 290000, of: 200}, lines: [N('(calm) Preview fourteen.')]}),
];
export const moon02: Episode = {
  id: 'moon02', file: 'FILE 002', title: 'The Moon Got Closer Every Night', youtubeTitle: 'The Moon Got Closer Every Night. Day 1 to Day 200 by the Sea',
  thumbnailText: 'DAY 1', commentPrompt: '', logline: '', tags: [], pinnedComment: '', fps: 30, style: 'cinema', shots,
} as Episode;
