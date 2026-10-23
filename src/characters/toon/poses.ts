/**
 * Poses for the toon rig. Angles are degrees from straight down; positive swings toward screen-right
 * (the rig is always drawn facing right and mirrored for facing left). [upper, bend] per limb.
 */
export type Limb = [number, number];
export type Pose = {
  lArm: Limb; // the far arm when facing right
  rArm: Limb; // the near arm
  lLeg: Limb;
  rLeg: Limb;
  lean: number; // whole body tilt (deg), + = forward when facing right
  crouch: number; // 0..1 lowers the hips (knees bend)
  tilt: number; // head tilt (deg)
};

const P = (p: Partial<Pose>): Pose => ({lArm: [-8, -6], rArm: [8, 6], lLeg: [-2, 0], rLeg: [2, 0], lean: 0, crouch: 0, tilt: 0, ...p});

export const POSES = {
  stand: P({}),
  relaxed: P({lArm: [-6, -10], rArm: [10, 14], lean: 1}),
  hold: P({rArm: [30, 95]}), // something at chest height in the near hand
  holdBoth: P({lArm: [20, 90], rArm: [34, 92]}),
  carry: P({lArm: [40, 70], rArm: [52, 66], lean: -3}),
  point: P({rArm: [96, -4]}),
  pointUp: P({rArm: [140, 8], tilt: -10}),
  wave: P({rArm: [128, 28]}),
  reach: P({lArm: [70, 4], rArm: [84, 2], lean: 6}),
  reachUp: P({lArm: [125, 10], rArm: [145, 6], tilt: -12}),
  armsUp: P({lArm: [-125, -20], rArm: [125, 20], tilt: -6}),
  cheer: P({lArm: [-122, -18], rArm: [122, 18], tilt: -8}),
  handsOnHead: P({lArm: [-125, -95], rArm: [125, 95], tilt: 4}),
  shrug: P({lArm: [-40, -80], rArm: [40, 80], tilt: 6}),
  think: P({rArm: [40, 140], tilt: 8}),
  coverMouth: P({rArm: [36, 150]}),
  hug: P({lArm: [50, 100], rArm: [60, 100], lean: 4}),
  flinch: P({lArm: [60, 120], rArm: [80, 120], lean: -8, crouch: 0.25, tilt: -6}),
  tape: P({lArm: [130, 20], rArm: [150, 10], tilt: -8}),
  pour: P({rArm: [80, 30], lArm: [50, 70], lean: 8}),
  torch: P({rArm: [84, 6], lArm: [-6, -10]}),
  lookUp: P({tilt: -18, lArm: [-10, -8], rArm: [12, 8]}),
  crouch: P({crouch: 0.55, lArm: [30, 40], rArm: [40, 40], lean: 10}),
  kneel: P({lLeg: [8, -96], rLeg: [82, -84], rArm: [50, 40], lArm: [20, 30], lean: 4}),
  sit: P({lLeg: [86, 0], rLeg: [90, 0], lArm: [20, 30], rArm: [30, 30], lean: -4}),
  sitChair: P({lLeg: [82, -82], rLeg: [86, -86], lArm: [20, 40], rArm: [30, 40]}),
  sitHug: P({lLeg: [128, -112], rLeg: [134, -116], lArm: [70, 60], rArm: [80, 60], lean: 6}),
  shiver: P({lArm: [30, 130], rArm: [40, 130], crouch: 0.1}),
  push: P({lArm: [80, -10], rArm: [90, -10], lean: 14, lLeg: [-20, 0], rLeg: [20, 0]}),
  cane: P({rArm: [30, 20], lean: 6}),
} satisfies Record<string, Pose>;
export type PoseName = keyof typeof POSES;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const L = (a: Limb, b: Limb, t: number): Limb => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const blendPose = (a: Pose, b: Pose, t: number): Pose => ({
  lArm: L(a.lArm, b.lArm, t),
  rArm: L(a.rArm, b.rArm, t),
  lLeg: L(a.lLeg, b.lLeg, t),
  rLeg: L(a.rLeg, b.rLeg, t),
  lean: lerp(a.lean, b.lean, t),
  crouch: lerp(a.crouch, b.crouch, t),
  tilt: lerp(a.tilt, b.tilt, t),
});

/**
 * Walk/run overlay for a body facing right. `phase` advances with distance travelled (no foot sliding).
 * Contact positions have legs apart and the body low; passing positions have legs together and the body high.
 */
export const gait = (base: Pose, phase: number, kind: 'walk' | 'run', elder = false): {pose: Pose; bob: number} => {
  const s = Math.sin(phase);
  const c = Math.cos(phase);
  const A = kind === 'run' ? 34 : elder ? 16 : 24;
  const B = kind === 'run' ? 70 : 38;
  const leg = (sn: number, cs: number): Limb => [A * sn, -B * Math.max(0, cs)];
  const arm = (sn: number): Limb => (kind === 'run' ? [-A * 1.1 * sn, 75] : [-A * 0.9 * sn, 14]);
  const pose: Pose = {
    ...base,
    lLeg: leg(s, c),
    rLeg: leg(-s, -c),
    // keep a held prop steady: only swing an arm that isn't holding something up
    lArm: Math.abs(base.lArm[1]) > 60 ? base.lArm : arm(-s),
    rArm: Math.abs(base.rArm[1]) > 60 || base.rArm[0] > 60 ? base.rArm : arm(s),
    lean: base.lean + (kind === 'run' ? 6 : elder ? 7 : 3),
    crouch: base.crouch + (kind === 'run' ? 0.03 : 0.02),
  };
  const bob = kind === 'run' ? -14 * Math.abs(Math.sin(phase)) + 4 : 6 * (Math.abs(c) - 0.5);
  return {pose, bob};
};

/** Stride length in hero-scale px (one half-cycle = one step). */
export const STRIDE = {walk: 70, run: 120};
