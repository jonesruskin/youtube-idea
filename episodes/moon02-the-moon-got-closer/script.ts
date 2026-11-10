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
const P = [c('ana', 1180, 930, {facing: 'left'}), c('lola', 1010, 930, {facing: 'right'})];
const shots: Shot[] = [
  sh('p1', stage('quay', 'day', hold(1, 960, 540), P, [], {sea: 0.6}), {lines: [N('(calm) Preview one.')]}),
  sh('p2', stage('quay', 'dusk', hold(1, 960, 540), P, [], {sea: 1.75, moon: 1.1}), {lines: [N('(calm) Preview two.')]}),
  sh('p3', stage('quay', 'night', hold(1, 700, 540), [], [], {sea: 3.0, moon: 1.3}), {lines: [N('(calm) Preview three.')]}),
  sh('p4', stage('marketst', 'night', hold(1, 900, 540), [], [], {sea: 7.9, moon: 1.8}), {lines: [N('(calm) Preview four.')]}),
  sh('p5', stage('marketst', 'day', hold(1, 960, 540), P, [], {sea: 2, moon: 1.3}), {lines: [N('(calm) Preview five.')]}),
  sh('p6', stage('hill', 'day', hold(1, 960, 540), P, [], {sea: 20, moon: 2.5, line: 1}), {lines: [N('(calm) Preview six.')]}),
  sh('p7', stage('hill', 'night', hold(1, 760, 540), P, [], {sea: 34.6, moon: 3, line: 1, chapelLit: true}), {lines: [N('(calm) Preview seven.')]}),
];
export const moon02: Episode = {
  id: 'moon02', file: 'FILE 002', title: 'The Moon Got Closer Every Night', youtubeTitle: 'The Moon Got Closer Every Night. Day 1 to Day 200 by the Sea',
  thumbnailText: 'DAY 1', commentPrompt: '', logline: '', tags: [], pinnedComment: '', fps: 30, style: 'cinema', shots,
} as Episode;
