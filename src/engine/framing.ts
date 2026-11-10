import {designOf, type CastEntry} from '../characters/toon/acting';
import {HERO_PX} from '../characters/toon/design';
import type {CamKey} from '../fx/cinema/camera';

/**
 * Framing rules applied to every stage camera before a frame is drawn (and used by the linter, so the check sees
 * exactly what the render shows).
 *
 *  1. Close-ups frame faces, not coordinates: a key zoomed past 1.8× re-centres vertically on the face of the cast
 *     member nearest its x (a close-up can never crop a head off, whatever the character's height).
 *  2. Heads are whole (CEO v5.3; docs/00 P4): no main character's head may be cut by the frame edge. The camera
 *     slides sideways (up to 14% of the frame, or 34% as a last resort) and/or changes zoom by up to ±20% to bring the
 *     head fully in, or fully out if that is the smaller move, and moves down to keep heads under the top edge.
 *
 * `cast` positions are where people are when that key is reached: pass the cast at the start for the first key and
 * after its walks for the last.
 */
export type Head = {who: string; x: number; y: number; r: number};

export const headOf = (c: CastEntry): Head | null => {
  if (c.who === 'biscuit') return null;
  const d = designOf(c.who);
  if (!d) return null;
  const H = HERO_PX * d.height * c.depth;
  const r = H * d.head * 1.12; // hair and hats reach past the head circle
  return {who: c.who, x: c.x, y: c.y - H + H * d.head, r};
};

const faceY = (c: CastEntry) => {
  if (c.who === 'biscuit') return {fy: c.y - 84 * c.depth, H: 100 * c.depth};
  const d = designOf(c.who)!;
  const H = HERO_PX * d.height * c.depth;
  return {fy: c.y - H * (1 - d.head), H};
};

/** Named characters (not extras, not the dog) must keep their heads whole; an extra may be cropped like a passer-by. */
export const isNamed = (who: string) => !who.startsWith('extra:') && who !== 'biscuit';
/** Where everyone stands once their walks are done (the last camera key frames this). */
export const afterWalks = (cast: CastEntry[], acts: {who: string; to?: number | [number, number]}[]): CastEntry[] =>
  cast.map((c) => {
    const w = acts.filter((a) => a.who === c.who && a.to !== undefined).pop();
    return w ? {...c, x: Array.isArray(w.to) ? w.to[0] : (w.to as number)} : c;
  });
/** Apply the framing rules to a whole camera move. */
export const frameCamera = (keys: CamKey[], cast: CastEntry[], acts: {who: string; to?: number | [number, number]}[]): CamKey[] => {
  const main = cast.map((c) => c.who).filter(isNamed);
  const end = afterWalks(cast, acts);
  return keys.map((k, i) => reframe(k, i === keys.length - 1 && keys.length > 1 ? end : cast, main));
};

export const reframe = (k: CamKey, castAtKey: CastEntry[], main: string[]): CamKey => {
  const [at, z0, x0, y0, r] = k;
  let y = y0;
  if (z0 >= 1.8 && castAtKey.length) {
    const near = [...castAtKey].sort((a, b) => Math.abs(a.x - x0) - Math.abs(b.x - x0))[0];
    const {fy, H} = faceY(near);
    y = fy + H * 0.12;
  }
  const heads = castAtKey.filter((c) => main.includes(c.who) && !(c as any).carriedBy && (c.opacity ?? 1) > 0.2).map(headOf).filter(Boolean) as Head[];
  if (!heads.length) return [at, z0, x0, y, r] as CamKey;
  // try the framing as written, then small slides, then small zoom changes with slides; keep the smallest change
  // that leaves every head whole (fully in, or fully out at the sides)
  const bad = (z: number, cx: number, cy: number) => {
    const hw = 960 / z;
    const hh = 540 / z;
    return heads.some((h) => (h.x - h.r < cx - hw && h.x + h.r > cx - hw) || (h.x + h.r > cx + hw && h.x - h.r < cx + hw) || (h.x > cx - hw && h.x < cx + hw && h.y - h.r < cy - hh && h.y + h.r > cy - hh));
  };
  const fit = (z: number, share = 0.14): [number, number] | null => {
    const hw = 960 / z;
    const hh = 540 / z;
    const maxShift = (1920 * share) / z;
    const xs = [0];
    for (const h of heads) {
      xs.push(h.x - h.r - (x0 - hw) - 6, h.x + h.r - (x0 - hw) + 6, h.x + h.r - (x0 + hw) + 6, h.x - h.r - (x0 + hw) - 6);
    }
    const cands = xs.filter((d) => Math.abs(d) <= maxShift).sort((a, b) => Math.abs(a) - Math.abs(b));
    for (const d of cands) {
      const cx = x0 + d;
      let cy = y;
      const inFrame = heads.filter((h) => h.x > cx - hw && h.x < cx + hw);
      const top = Math.min(...inFrame.map((h) => h.y - h.r - 8), Infinity);
      if (top < cy - hh) cy -= Math.min(cy - hh - top, (1080 * 0.14) / z);
      if (!bad(z, cx, cy)) return [cx, cy];
    }
    return null;
  };
  for (const m of [1, 0.94, 0.88, 1.08, 0.82, 1.16, 1.24]) {
    const z = z0 * m;
    if (z < 1) continue;
    const got = fit(z);
    if (got) return [at, z, got[0], got[1], r] as CamKey;
  }
  // last resort: a wider slide (the subject moves to a third of the frame) rather than a cut head
  for (const m of [1, 0.9, 1.1]) {
    const got = fit(z0 * m, 0.34);
    if (got) return [at, z0 * m, got[0], got[1], r] as CamKey;
  }
  return [at, z0, x0, y, r] as CamKey;
};

/** Is any main character's head cut by the frame edge under this camera key? (for the linter) */
export const cutHeads = (k: CamKey, castAtKey: CastEntry[], main: string[]): {who: string; edge: string}[] => {
  const [, z, x, y] = k;
  const hw = 960 / z;
  const hh = 540 / z;
  const out: {who: string; edge: string}[] = [];
  for (const c of castAtKey) {
    if (!main.includes(c.who) || (c as any).carriedBy || (c.opacity ?? 1) <= 0.2) continue;
    const h = headOf(c);
    if (!h) continue;
    if (h.x - h.r < x - hw && h.x + h.r > x - hw) out.push({who: c.who, edge: 'left'});
    else if (h.x + h.r > x + hw && h.x - h.r < x + hw) out.push({who: c.who, edge: 'right'});
    else if (h.x > x - hw && h.x < x + hw && h.y - h.r < y - hh && h.y + h.r > y - hh) out.push({who: c.who, edge: 'top'});
  }
  return out;
};
