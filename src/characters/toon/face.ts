/**
 * Expressions as numbers, so they blend smoothly. The DEFAULT is soft and neutral — a hero who looks
 * angry for no reason loses the audience. 'angry' exists, but only the script may ask for it.
 */
export type Face = {
  lid: number; // upper lid coverage 0..1
  eye: number; // eye size multiplier
  pupil: number; // pupil size multiplier
  browY: number; // brow raise (px at R=60), + = up
  browAng: number; // inner-brow raise in degrees, + = worried/sad, − = angry V
  mouthW: number; // 0..1 width
  open: number; // 0..1
  smile: number; // −1 (frown) .. 1 (smile)
  round: number; // 0..1 (o-shape)
  happyEyes: number; // 0..1 → eyes become ^ arcs
  blush: number;
  wobble: number; // wavy worried mouth
};

// This style's eyes are clean white ovals: a drawn upper lid on a calm face reads as droopy, half-shut eyes (v4.1
// mistake). Lids are only for blinks, real sleepiness and anger. Calm vs. startled is carried by eye size, pupil
// size and brows: only the brief startle peak enlarges the eyes and shrinks the pupils.
const F = (f: Partial<Face>): Face => ({lid: 0, eye: 1, pupil: 1, browY: 2, browAng: 5, mouthW: 0.45, open: 0, smile: 0.4, round: 0, happyEyes: 0, blush: 0, wobble: 0, ...f});

export const FACES = {
  neutral: F({}),
  smile: F({browY: 2, browAng: 3, mouthW: 0.62, smile: 0.95, blush: 0.4}),
  laugh: F({happyEyes: 1, browY: 4, browAng: 4, mouthW: 0.7, open: 0.7, smile: 1, blush: 0.6}),
  worried: F({eye: 1.0, browY: 4, browAng: 12, mouthW: 0.42, open: 0.04, smile: -0.3, wobble: 1}),
  // the two startle faces are peaks: the engine holds them ~0.6 s, then settles them (see SETTLE)
  scared: F({eye: 1.16, pupil: 0.66, browY: 10, browAng: 14, mouthW: 0.48, open: 0.5, smile: -0.35}),
  surprised: F({eye: 1.16, pupil: 0.84, browY: 12, browAng: 4, mouthW: 0.3, open: 0.6, round: 1}),
  sad: F({browY: 2, browAng: 16, mouthW: 0.46, smile: -0.8}),
  awe: F({eye: 1.08, pupil: 1.12, browY: 8, browAng: 6, mouthW: 0.32, open: 0.32, round: 0.6}),
  relieved: F({happyEyes: 0.85, browAng: 8, browY: 2, mouthW: 0.58, smile: 0.75, blush: 0.3}),
  focused: F({browY: 0, browAng: 3, mouthW: 0.38, smile: 0.12}),
  // firm, not grinning: lowered level brows, a set mouth (a smile here read as a grin on urgent lines)
  determined: F({browY: -2, browAng: -4, mouthW: 0.44, smile: 0.06}),
  cold: F({browAng: 10, browY: 2, mouthW: 0.44, open: 0.12, smile: -0.2, wobble: 1}),
  sleepy: F({lid: 0.5, browAng: 2, mouthW: 0.36, smile: 0.2}),
  angry: F({lid: 0.22, browY: -6, browAng: -16, mouthW: 0.5, smile: -0.5}),
  // settled versions of the startle faces: still reacting, no longer staring
  alert: F({browY: 6, browAng: 6, mouthW: 0.36, open: 0.12, smile: 0, round: 0.3}),
  uneasy: F({browY: 5, browAng: 13, mouthW: 0.42, open: 0.1, smile: -0.3, wobble: 0.6}),
} satisfies Record<string, Face>;
export type Expr = keyof typeof FACES;

/** How long a face takes to arrive (s): shock is fast, smiles bloom, sadness sinks in. */
export const ONSET: Partial<Record<Expr, number>> = {
  surprised: 0.18,
  scared: 0.25,
  laugh: 0.35,
  smile: 0.5,
  relieved: 0.6,
  worried: 0.6,
  focused: 0.6,
  determined: 0.6,
  awe: 0.5,
  alert: 0.5,
  uneasy: 0.6,
  neutral: 0.6,
  cold: 0.7,
  sad: 0.9,
  sleepy: 1.2,
  angry: 0.4,
};
export const onsetOf = (e: Expr) => ONSET[e] ?? 0.6;

/** A startle peaks, then settles into something a person can hold. */
export const SETTLE: Partial<Record<Expr, Expr>> = {surprised: 'alert', scared: 'uneasy'};
export const SETTLE_HOLD = 0.6;
export const SETTLE_LEN = 0.9;

export const blendFace = (a: Face, b: Face, t: number): Face => {
  const o = {} as Face;
  for (const k of Object.keys(a) as (keyof Face)[]) o[k] = a[k] + (b[k] - a[k]) * t;
  return o;
};
