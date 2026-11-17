/**
 * Where people can stand, per set (docs/00 P14). The CEO: "characters not properly standing on the surface like stairs,
 * floor". Each set declares its walkable surfaces for the cast plane as treads: [x0, x1, y] (top of the surface).
 * - The renderer (Actors) plants every standing character's feet on the tread under them; while walking across a
 *   flight they follow the line through the tread centres, so they climb instead of gliding through the steps.
 * - Lint (grounding gate) fails anyone placed or walking where there is no surface (off the quay into the water, in
 *   the sky beside a staircase), any set used without a declared ground, and a cast y that is off its surface.
 * The numbers are read from each set's own drawing code (comments say where); scripts/feet-sheet.ts is the eye check.
 * Characters standing in a different plane (far figures, depth ≠ the set's cast depth), seated, carried, swimming or
 * surfing are exempt; they say so with `ground: false` on the cast entry, or by their depth.
 */
export type Tread = [x0: number, x1: number, y: number];
type Ground = {depth: number; treads: (v: string, p: Record<string, unknown>) => Tread[]};

const flat = (y: number, x0 = -3000, x1 = 5000): Tread[] => [[x0, x1, y]];

/** Treads of a flight. `fromX`/`fromY`: the first tread's left edge and top; `run`, `rise`: tread width and riser
 *  height (rise > 0 goes down to the right); `n` treads. */
const flight = (fromX: number, fromY: number, run: number, rise: number, n: number): Tread[] =>
  Array.from({length: n}, (_, k) => [fromX + k * run, fromX + (k + 1) * run, fromY + k * rise] as Tread);

export const GROUNDS: Record<string, Ground> = {
  // ── File 001 (sun01) ──
  kitchen: {depth: 1.2, treads: () => flat(930)},
  apartment: {depth: 1.2, treads: () => flat(930)},
  bathroom: {depth: 1.2, treads: () => flat(930)},
  hospital: {depth: 1.2, treads: () => flat(930)},
  market: {depth: 1.2, treads: () => flat(940)},
  metro: {depth: 1.2, treads: () => flat(900)},
  roof: {depth: 1.2, treads: () => flat(900)},
  harbor: {depth: 1.2, treads: () => flat(940)},
  street: {depth: 1.2, treads: () => flat(960)},
  snowstreet: {depth: 1.2, treads: () => flat(960)},
  surface: {depth: 1.2, treads: () => flat(940)},
  river: {depth: 1.2, treads: () => flat(940)},
  observatory: {depth: 1.2, treads: (v) => (v === 'room' ? flat(920) : flat(860))},
  // home.tsx 'stairs': the flight up to the next floor, 8 treads 120 px wide, 40 px risers, from x −600 at y 600 down
  // to the landing at y 940 (the last tread is 880 from x 240; the landing starts at 360)
  stairs: {depth: 1.2, treads: () => [...flight(-600, 600, 120, 40, 8), [360, 5000, 940]]},
  // inserts.tsx 'montage': one figure per world vignette, each placed on its own scenery (beach wave, field, bus stop)
  montage: {depth: 1.2, treads: (v) => (v === 'field' ? flat(930) : v === 'bus' ? flat(960) : flat(1060))},
  // ── File 002 (moon02) ──
  nanakitchen: {depth: 1.2, treads: () => flat(930)},
  boardroom: {depth: 1.2, treads: () => flat(930)},
  chapelin: {depth: 1.2, treads: () => flat(930)},
  // sets.tsx quay: cobbles from x 300 at y 930; left of the quay wall is the harbour basin (water or mud, no footing)
  quay: {depth: 1.2, treads: () => [[300, 5000, 930]]},
  // sets.tsx marketst: pavement from x 380 at y 930; seven steps down to the quay to the left, 70 px apart, 46 px risers
  marketst: {depth: 1.2, treads: () => [...Array.from({length: 7}, (_, i) => [380 - (i + 1) * 70, 380 - i * 70, 930 + i * 46] as Tread).reverse(), [380, 5000, 930]]},
  // sets.tsx hill: the top step and chapel platform at y 930 from x 550; five more steps, each 150 px further left and
  // 103 px (0.5 m) lower
  hill: {depth: 1.2, treads: () => [...Array.from({length: 5}, (_, j) => {
    const i = 5 - j;
    return [700 - (i + 1) * 150, 700 - i * 150, 930 + i * 103] as Tread;
  }), [550, 5000, 930]]},
};

const treadsOf = (set: string, v: string, p: Record<string, unknown> = {}) => GROUNDS[set]?.treads(v, p) ?? null;

/** The surface height under x (null = nothing to stand on, or the set declares no ground). */
export const groundAt = (set: string, v: string, x: number, depth = 1.2, p: Record<string, unknown> = {}): number | null => {
  const g = GROUNDS[set];
  if (!g || Math.abs(depth - g.depth) > 0.05) return null;
  const t = treadsOf(set, v, p)!.find(([a, b]) => x >= a && x < b);
  return t ? t[2] : null;
};

/** While walking: the line through tread centres (a person climbing a flight), flat on a single surface. */
export const groundWalking = (set: string, v: string, x: number, depth = 1.2, p: Record<string, unknown> = {}): number | null => {
  const g = GROUNDS[set];
  if (!g || Math.abs(depth - g.depth) > 0.05) return null;
  const ts = treadsOf(set, v, p)!;
  const i = ts.findIndex(([a, b]) => x >= a && x < b);
  if (i < 0) return null;
  const [a, b, y] = ts[i];
  const c = (a + b) / 2;
  const nb = x < c ? ts[i - 1] : ts[i + 1];
  if (!nb || Math.abs(b - a) > 1200 || Math.abs(nb[1] - nb[0]) > 1200) return y; // long flat floors: no ramp
  const nc = (nb[0] + nb[1]) / 2;
  const u = (x - c) / (nc - c);
  return y + (nb[2] - y) * Math.max(0, Math.min(1, u));
};

export const hasGround = (set: string) => set in GROUNDS;
