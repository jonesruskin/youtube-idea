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

const F = (f: Partial<Face>): Face => ({lid: 0, eye: 1, pupil: 1, browY: 2, browAng: 5, mouthW: 0.45, open: 0, smile: 0.4, round: 0, happyEyes: 0, blush: 0, wobble: 0, ...f});

export const FACES = {
  neutral: F({}),
  smile: F({lid: 0, browY: 2, browAng: 3, mouthW: 0.62, smile: 0.95, blush: 0.4}),
  laugh: F({happyEyes: 1, browY: 4, browAng: 4, mouthW: 0.7, open: 0.7, smile: 1, blush: 0.6}),
  worried: F({lid: 0.06, eye: 1.05, browY: 4, browAng: 12, mouthW: 0.42, open: 0.04, smile: -0.3, wobble: 1}),
  scared: F({lid: 0, eye: 1.2, pupil: 0.62, browY: 10, browAng: 14, mouthW: 0.48, open: 0.55, smile: -0.35}),
  surprised: F({lid: 0, eye: 1.22, pupil: 0.82, browY: 13, browAng: 4, mouthW: 0.3, open: 0.75, round: 1}),
  sad: F({lid: 0.22, browY: 2, browAng: 16, mouthW: 0.46, smile: -0.8}),
  awe: F({lid: 0, eye: 1.16, pupil: 1.15, browY: 9, browAng: 6, mouthW: 0.32, open: 0.42, round: 0.7}),
  relieved: F({happyEyes: 0.85, browAng: 8, browY: 2, mouthW: 0.58, smile: 0.75, blush: 0.3}),
  focused: F({lid: 0.1, browY: 0, browAng: 3, mouthW: 0.38, smile: 0.12}),
  determined: F({lid: 0.06, browY: 0, browAng: 1, mouthW: 0.5, smile: 0.45}),
  cold: F({lid: 0.06, browAng: 10, browY: 2, mouthW: 0.44, open: 0.12, smile: -0.2, wobble: 1}),
  sleepy: F({lid: 0.92, browAng: 2, mouthW: 0.36, smile: 0.2}),
  angry: F({lid: 0.3, browY: -6, browAng: -16, mouthW: 0.5, smile: -0.5}),
} satisfies Record<string, Face>;
export type Expr = keyof typeof FACES;

export const blendFace = (a: Face, b: Face, t: number): Face => {
  const o = {} as Face;
  for (const k of Object.keys(a) as (keyof Face)[]) o[k] = a[k] + (b[k] - a[k]) * t;
  return o;
};
