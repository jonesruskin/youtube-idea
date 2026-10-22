/**
 * Text-driven lip-sync. Each letter maps to a mouth target (open / wide / round, plus teeth or
 * pressed lips); the mouth eases between neighbouring targets across the line's timing.
 * With ElevenLabs alignment (per-character start times) the same code follows the real audio.
 */
export type Viseme = {open: number; wide: number; round: number; teeth?: boolean; pressed?: boolean};

const REST: Viseme = {open: 0.04, wide: 0.5, round: 0};
const TARGETS: Record<string, Viseme> = {
  a: {open: 0.95, wide: 0.55, round: 0},
  e: {open: 0.5, wide: 0.95, round: 0},
  i: {open: 0.42, wide: 1, round: 0},
  y: {open: 0.4, wide: 0.9, round: 0},
  o: {open: 0.75, wide: 0.3, round: 0.9},
  u: {open: 0.38, wide: 0.15, round: 1},
  w: {open: 0.3, wide: 0.1, round: 1},
  q: {open: 0.3, wide: 0.15, round: 0.9},
  m: {open: 0, wide: 0.55, round: 0, pressed: true},
  b: {open: 0, wide: 0.55, round: 0, pressed: true},
  p: {open: 0, wide: 0.55, round: 0, pressed: true},
  f: {open: 0.14, wide: 0.65, round: 0, teeth: true},
  v: {open: 0.14, wide: 0.65, round: 0, teeth: true},
  r: {open: 0.32, wide: 0.4, round: 0.5},
  l: {open: 0.38, wide: 0.6, round: 0},
  t: {open: 0.26, wide: 0.7, round: 0, teeth: true},
  d: {open: 0.3, wide: 0.65, round: 0},
  n: {open: 0.26, wide: 0.6, round: 0},
  s: {open: 0.16, wide: 0.85, round: 0, teeth: true},
  z: {open: 0.16, wide: 0.85, round: 0, teeth: true},
  c: {open: 0.28, wide: 0.7, round: 0},
  k: {open: 0.36, wide: 0.6, round: 0},
  g: {open: 0.36, wide: 0.6, round: 0},
  h: {open: 0.5, wide: 0.55, round: 0},
  j: {open: 0.3, wide: 0.5, round: 0.4},
  x: {open: 0.3, wide: 0.7, round: 0},
};

const target = (ch: string | undefined): Viseme => (ch ? TARGETS[ch.toLowerCase()] ?? REST : REST);
const mix = (a: Viseme, b: Viseme, t: number): Viseme => ({
  open: a.open + (b.open - a.open) * t,
  wide: a.wide + (b.wide - a.wide) * t,
  round: a.round + (b.round - a.round) * t,
  teeth: t < 0.5 ? a.teeth : b.teeth,
  pressed: t < 0.5 ? a.pressed : b.pressed,
});

/**
 * Mouth shape `t` seconds into a line of `duration` seconds.
 * `charTimes` (optional) are per-character start times from ElevenLabs alignment.
 */
export const visemeAt = (text: string, t: number, duration: number, charTimes?: number[]): Viseme => {
  if (t < 0 || t > duration) return REST;
  const n = text.length;
  let idx: number;
  let frac: number;
  if (charTimes && charTimes.length === n) {
    idx = 0;
    while (idx < n - 1 && charTimes[idx + 1] <= t) idx++;
    const next = idx < n - 1 ? charTimes[idx + 1] : duration;
    frac = Math.min(1, Math.max(0, (t - charTimes[idx]) / Math.max(0.01, next - charTimes[idx])));
  } else {
    // Estimate: spaces and punctuation are brief, letters share the rest; sentence ends linger.
    const weight = (c: string) => (/[.!?]/.test(c) ? 4 : /[,;:—]/.test(c) ? 2.5 : c === ' ' ? 0.6 : 1);
    const total = [...text].reduce((s, c) => s + weight(c), 0);
    let acc = 0;
    const pos = (t / duration) * total;
    idx = 0;
    while (idx < n - 1 && acc + weight(text[idx]) < pos) acc += weight(text[idx++]);
    frac = Math.min(1, (pos - acc) / weight(text[idx]));
  }
  const cur = target(text[idx]);
  const nxt = target(text[idx + 1]);
  // Ease toward the next sound in the last 40% of each letter (co-articulation).
  const blend = frac < 0.6 ? 0 : (frac - 0.6) / 0.4;
  const v = mix(cur, nxt, blend * blend);
  // Slight jaw flutter so held vowels don't freeze.
  return {...v, open: v.open * (0.92 + 0.08 * Math.sin(t * 31))};
};

/** True if the line's emotional punctuation should raise the brows at this moment. */
export const emphasisAt = (text: string, t: number, duration: number) => {
  if (!/[!?]/.test(text)) return 0;
  const p = t / duration;
  return p > 0.55 && p < 1 ? Math.sin(((p - 0.55) / 0.45) * Math.PI) : 0;
};
