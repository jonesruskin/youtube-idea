import React from 'react';

/**
 * The reply, 1,679 pulses laid out as 23 columns × 73 rows — the same prime-grid format as humanity's 1974 Arecibo
 * message, because 1,679 = 23 × 73 can only be arranged one way. Top to bottom:
 *   1–10   the count Mr. Ito started (1, 2, 3), carried on to ten: "we understood you"
 *   …      a builder, and beside it, small, a human (they know our shape from our broadcasts)
 *   …      their star with its planets, one raised: home
 *   …      a dotted path from their star to our Sun, their ship parked beside our Sun (in its shell); Earth raised to the right
 *   …      an empty square: "your turn"
 */
export const COLS = 23;
export const ROWS = 73;
type Cell = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 off · 1 count · 2 builder/ship/path · 3 human · 4 their system · 5 sun in shell · 6 earth/empty-square
const build = (): Cell[][] => {
  const g: Cell[][] = Array.from({length: ROWS}, () => Array(COLS).fill(0) as Cell[]);
  const set = (x: number, y: number, v: Cell) => {
    if (x >= 0 && x < COLS && y >= 0 && y < ROWS) g[y][x] = v;
  };
  // 1..10, one row each
  for (let k = 1; k <= 10; k++) for (let i = 0; i < k; i++) set(1 + i * 2, k, 1);
  // builder: a tall figure with a crested head and three-fingered hands (rows 14–34), centred at x = 14
  const bx = 14;
  [[-2, 14], [-1, 14], [0, 14], [1, 14], [2, 14], [-3, 15], [3, 15], [-3, 16], [3, 16], [-2, 17], [2, 17], [-1, 18], [0, 18], [1, 18]].forEach(([dx, y]) => set(bx + dx, y, 2));
  set(bx, 16, 2);
  for (let y = 19; y <= 29; y++) set(bx, y, 2);
  for (let y = 20; y <= 28; y++) set(bx + (y < 25 ? 1 : 0), y, 2);
  for (let i = 1; i <= 5; i++) {
    set(bx - i, 20 + i, 2);
    set(bx + i, 20 + i, 2);
  }
  [[-6, 25], [-7, 25], [-6, 26], [6, 25], [7, 25], [6, 26]].forEach(([dx, y]) => set(bx + dx, y, 2));
  for (let y = 30; y <= 34; y++) {
    set(bx - 1 - Math.floor((y - 30) / 2), y, 2);
    set(bx + 1 + Math.floor((y - 30) / 2), y, 2);
  }
  // a small human beside it (rows 27–34): head, body, arms, legs
  const hx = 4;
  set(hx, 27, 3);
  for (let y = 28; y <= 31; y++) set(hx, y, 3);
  set(hx - 1, 29, 3);
  set(hx + 1, 29, 3);
  set(hx - 1, 32, 3);
  set(hx + 1, 32, 3);
  set(hx - 1, 33, 3);
  set(hx + 1, 33, 3);
  // their system (rows 38–41): the star, then six planets; the fourth raised
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 0], [0, -1], [2, 1], [1, 2]]) set(2 + dx, 39 + dy, 4);
  [6, 9, 12, 15, 18, 21].forEach((x, i) => set(x, i === 3 ? 38 : 40, 4));
  // the journey: a dotted path from their system down to our Sun
  for (let y = 42; y <= 48; y += 2) set(4 + Math.round((y - 42) * 0.5), y, 2);
  // our Sun inside the shell (rows 49–57, centred x = 15), Earth raised to the right
  const sx = 15;
  const sy = 53;
  for (let a = 0; a < 24; a++) set(Math.round(sx + Math.cos((a / 24) * 6.283) * 4), Math.round(sy + Math.sin((a / 24) * 6.283) * 4), 5);
  set(sx, sy, 5);
  set(sx + 1, sy, 5);
  set(sx, sy + 1, 5);
  set(sx + 1, sy + 1, 5);
  // their ship, parked beside our Sun: a sail (triangle) on a short hull, left of the shell
  for (let r = 0; r <= 4; r++) for (let x = 6; x <= 6 + r; x++) set(x, 50 + r, 2);
  for (let x = 5; x <= 11; x++) set(x, 55, 2);
  // Earth, raised to the right of the Sun
  set(22, 51, 6);
  // the empty square: your turn (rows 61–71)
  for (let i = 0; i <= 10; i++) {
    set(6 + i, 61, 6);
    set(6 + i, 71, 6);
    set(6, 61 + i, 6);
    set(16, 61 + i, 6);
  }
  return g;
};
export const REPLY = build();
const COL: Record<number, string> = {1: '#FFFFFF', 2: '#C77DFF', 3: '#7FD8FF', 4: '#FFD27A', 5: '#FF8A3A', 6: '#7FE8A8'};

/** The picture centred on (0,0). `reveal` 0..1 fills it row by row as the pulses arrive; `focus` lights the square. */
export const ReplyPicture: React.FC<{cell: number; reveal: number; frame: number; focus?: number; dim?: number}> = ({cell, reveal, frame, focus = 0, dim = 0}) => {
  const w = COLS * cell;
  const h = ROWS * cell;
  const rowsShown = Math.floor(reveal * ROWS);
  return (
    <g transform={`translate(${-w / 2},${-h / 2})`}>
      <rect x={-cell} y={-cell} width={w + 2 * cell} height={h + 2 * cell} fill="#05060D" stroke="#3A4466" strokeWidth={2} />
      {Array.from({length: ROWS}, (_, y) =>
        Array.from({length: COLS}, (_, x) => {
          const v = REPLY[y][x];
          const on = y < rowsShown && v > 0;
          const isSquare = v === 6 && y >= 61;
          const o = on ? (isSquare && focus > 0 ? 0.6 + 0.4 * Math.sin(frame * 0.25) : 1) * (1 - dim * (isSquare ? 0 : 0.7)) : 0.07;
          return <rect key={`${x}-${y}`} x={x * cell + 1} y={y * cell + 1} width={cell - 2} height={cell - 2} fill={on ? COL[v] : '#2A3152'} opacity={o} />;
        }),
      )}
      {reveal < 1 && <rect x={0} y={rowsShown * cell} width={w} height={cell} fill="#FFFFFF" opacity={0.5} />}
    </g>
  );
};

/** Mira's sun drawing as a 23 × 23 picture (the reply that goes back): a sun with rays, a small girl underneath. */
export const DRAWING: number[][] = (() => {
  const N = 23;
  const g = Array.from({length: N}, () => Array(N).fill(0));
  const cx = 11;
  const cy = 8;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= 4.2) g[y][x] = 1; // the sun
      else if (d > 5.2 && d < 7.2 && (Math.round((Math.atan2(y - cy, x - cx) / Math.PI) * 8) % 2 === 0)) g[y][x] = 1; // rays
    }
  // a little girl with pigtails at the bottom
  const pts = [[11, 17], [10, 17], [12, 17], [9, 16], [13, 16], [11, 18], [11, 19], [10, 19], [12, 19], [9, 20], [13, 20], [10, 21], [12, 21], [10, 22], [12, 22]];
  pts.forEach(([x, y]) => (g[y][x] = 2));
  return g;
})();
