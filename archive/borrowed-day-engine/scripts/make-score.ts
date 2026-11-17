// Procedurally synthesises an ORIGINAL score + SFX for an episode, timed to its script.
// No samples, no stock music → nothing to license, nothing to Content-ID claim.
// Usage: npm run score ep01   → public/audio/ep01-score.wav
import {mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import type {Mood, Sfx} from '../src/engine/schema';
import {buildTimeline} from '../src/engine/timeline';
import {loadEpisode, ROOT} from './load-episode';

const SR = 44100;
const id = process.argv[2] ?? 'ep01';
const {episode, voice} = await loadEpisode(id);
const tl = buildTimeline(episode, voice);
const N = Math.ceil((tl.duration + 1) * SR);
const music = new Float32Array(N);
const fx = new Float32Array(N);
const TAU = Math.PI * 2;

// Seeded noise so every render is identical.
let seed = 1234567;
const noise = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x3fffffff - 1;
};

const CHORDS: Record<Mood, number[]> = {
  wonder: [146.83, 220.0, 293.66, 369.99, 440.0, 659.25],
  warm: [98.0, 146.83, 246.94, 293.66, 369.99],
  mystery: [73.42, 110.0, 174.61, 220.0, 329.63],
  comic: [130.81, 196.0, 261.63, 329.63, 392.0],
  tension: [73.42, 116.54, 146.83, 174.61, 233.08],
  triumph: [146.83, 220.0, 293.66, 369.99, 440.0, 587.33],
  silence: [],
};
const LEVEL: Record<Mood, number> = {wonder: 0.16, warm: 0.15, mystery: 0.14, comic: 0.1, tension: 0.15, triumph: 0.18, silence: 0};

// ── mood segments ──────────────────────────────────────────────────────
type Seg = {mood: Mood; start: number; end: number};
const segs: Seg[] = [];
let current: Mood = 'mystery';
for (const s of tl.shots) {
  if (s.mood && s.mood !== current) {
    if (segs.length) segs[segs.length - 1].end = s.start;
    current = s.mood;
    segs.push({mood: current, start: s.start, end: tl.duration});
  } else if (!segs.length) {
    segs.push({mood: current, start: 0, end: tl.duration});
  }
}

const ATTACK = 1.4;
const RELEASE = 2.2;

const pad = (seg: Seg) => {
  const freqs = CHORDS[seg.mood];
  if (!freqs.length) return;
  const lvl = LEVEL[seg.mood];
  const i0 = Math.floor(seg.start * SR);
  const i1 = Math.min(N, Math.floor((seg.end + RELEASE) * SR));
  const phases = freqs.map(() => [0, 0, 0]);
  let lp = 0;
  for (let i = i0; i < i1; i++) {
    const t = i / SR;
    const env = Math.min(1, (t - seg.start) / ATTACK) * (t > seg.end ? Math.max(0, 1 - (t - seg.end) / RELEASE) : 1);
    let v = 0;
    freqs.forEach((f, k) => {
      const det = [1, 1.003, 0.997];
      for (let h = 0; h < 3; h++) {
        phases[k][h] += (TAU * f * det[h]) / SR;
        v += Math.sin(phases[k][h]) * (h === 0 ? 1 : 0.5) + Math.sin(phases[k][h] * 2) * 0.12;
      }
    });
    v /= freqs.length * 3;
    const trem = 0.85 + 0.15 * Math.sin(TAU * 0.13 * t + seg.start);
    lp += 0.08 * (v - lp); // soft low-pass
    music[i] += lp * env * trem * lvl * 2.2;
  }
};

const bell = (t0: number, f: number, amp: number, decay = 1.6) => {
  const i0 = Math.floor(t0 * SR);
  const len = Math.floor(decay * 3 * SR);
  for (let j = 0; j < len && i0 + j < N; j++) {
    const t = j / SR;
    const e = Math.exp(-t / decay * 2.2) * Math.min(1, t * 200);
    music[i0 + j] += amp * e * (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-t * 3));
  }
};

// Karplus–Strong pluck for the comic layer.
const pluck = (t0: number, f: number, amp: number) => {
  const period = Math.max(2, Math.round(SR / f));
  const buf = Float32Array.from({length: period}, () => noise());
  const i0 = Math.floor(t0 * SR);
  const len = Math.floor(1.2 * SR);
  for (let j = 0; j < len && i0 + j < N; j++) {
    const k = j % period;
    const nxt = (k + 1) % period;
    const out = buf[k];
    buf[k] = 0.497 * (buf[k] + buf[nxt]);
    music[i0 + j] += out * amp;
  }
};

const thump = (t0: number, amp: number, f0 = 70) => {
  const i0 = Math.floor(t0 * SR);
  let ph = 0;
  for (let j = 0; j < SR * 0.5 && i0 + j < N; j++) {
    const t = j / SR;
    const f = f0 * (1 + 1.5 * Math.exp(-t * 30));
    ph += (TAU * f) / SR;
    music[i0 + j] += Math.sin(ph) * Math.exp(-t * 9) * amp;
  }
};

const rhythm = (seg: Seg) => {
  const ch = CHORDS[seg.mood];
  const dur = seg.end - seg.start;
  if (seg.mood === 'wonder' || seg.mood === 'triumph') {
    const step = seg.mood === 'triumph' ? 0.32 : 0.62;
    const notes = [...ch.slice(2), ...ch.slice(2).map((f) => f * 2)];
    for (let k = 0, t = seg.start + 0.8; t < seg.end - 0.5; k++, t += step) {
      if (seg.mood === 'wonder' && k % 4 === 3) continue;
      bell(t, notes[(k * 3) % notes.length], seg.mood === 'triumph' ? 0.035 : 0.03, 1.2);
    }
  } else if (seg.mood === 'mystery') {
    for (let t = seg.start + 1.2; t < seg.end - 1; t += 2.6) bell(t, ch[3] * 2 * (Math.floor(t) % 2 ? 1 : 1.189), 0.03, 2.2);
  } else if (seg.mood === 'comic') {
    const pent = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
    const pattern = [0, 2, 4, 2, 5, 4, 2, -1];
    for (let k = 0, t = seg.start + 0.3; t < seg.end - 0.3; k++, t += 0.27) {
      const n = pattern[k % pattern.length];
      if (n >= 0) pluck(t, pent[n], 0.11);
      if (k % 4 === 0) thump(t, 0.06, 90);
    }
  } else if (seg.mood === 'tension') {
    for (let t = seg.start + 0.4; t < seg.end; t += 0.86) {
      thump(t, 0.16, 55);
      thump(t + 0.22, 0.09, 55);
    }
    for (let t = seg.start + 0.4; t < seg.end; t += 0.43) bell(t, 2093, 0.006, 0.08);
  } else if (seg.mood === 'warm') {
    for (let k = 0, t = seg.start + 1; t < seg.end - 0.5; k++, t += 1.1) bell(t, ch[(k % 3) + 2] * 2, 0.022, 1.8);
  }
  void dur;
};

segs.forEach((s) => {
  pad(s);
  rhythm(s);
});

// ── SFX ────────────────────────────────────────────────────────────────
const addNoise = (t0: number, len: number, amp: number, shape: (x: number) => number, lpA: number, lpB = lpA) => {
  const i0 = Math.max(0, Math.floor(t0 * SR));
  let lp = 0;
  for (let j = 0; j < len * SR && i0 + j < N; j++) {
    const x = j / (len * SR);
    const a = lpA + (lpB - lpA) * x;
    lp += a * (noise() - lp);
    fx[i0 + j] += lp * amp * shape(x);
  }
};
const tone = (t0: number, len: number, f0: number, f1: number, amp: number, shape: (x: number) => number) => {
  const i0 = Math.max(0, Math.floor(t0 * SR));
  let ph = 0;
  for (let j = 0; j < len * SR && i0 + j < N; j++) {
    const x = j / (len * SR);
    ph += (TAU * (f0 + (f1 - f0) * x)) / SR;
    fx[i0 + j] += Math.sin(ph) * amp * shape(x);
  }
};
const SFX: Record<Sfx, (t: number) => void> = {
  whoosh: (t) => addNoise(t - 0.2, 1.2, 0.5, (x) => Math.sin(Math.PI * x) ** 2, 0.02, 0.3),
  impact: (t) => {
    tone(t, 1.2, 90, 32, 0.5, (x) => Math.exp(-x * 5));
    addNoise(t, 0.4, 0.35, (x) => Math.exp(-x * 8), 0.4);
  },
  riser: (t) => {
    addNoise(t, 2.2, 0.25, (x) => x * x, 0.01, 0.25);
    tone(t, 2.2, 200, 800, 0.05, (x) => x * x);
  },
  chime: (t) => [880, 1318.5, 1760, 2637].forEach((f, k) => bell(t + k * 0.07, f, 0.035, 1.6)),
  decloak: (t) => {
    for (let k = 0; k < 14; k++) bell(t + k * 0.11, 1200 + ((k * 397) % 1600), 0.018, 0.9);
    addNoise(t, 2.4, 0.12, (x) => Math.sin(Math.PI * x), 0.15);
  },
  thunder: (t) => {
    addNoise(t, 3, 0.7, (x) => Math.exp(-x * 2.2) * (0.6 + 0.4 * Math.sin(x * 40)), 0.01);
    tone(t, 2, 45, 30, 0.25, (x) => Math.exp(-x * 2));
  },
  powercut: (t) => {
    tone(t, 0.6, 180, 40, 0.25, (x) => 1 - x);
    addNoise(t, 0.05, 0.6, () => 1, 0.6);
  },
  stamp: (t) => {
    tone(t, 0.25, 120, 60, 0.45, (x) => Math.exp(-x * 10));
    addNoise(t, 0.08, 0.5, (x) => 1 - x, 0.5);
  },
  // Zero-G: a rising glassy shimmer.
  float: (t) => {
    tone(t, 1.4, 300, 900, 0.07, (x) => Math.sin(Math.PI * x));
    for (let k = 0; k < 6; k++) bell(t + k * 0.09, 1046.5 * Math.pow(1.122, k), 0.02, 0.6);
  },
  crash: (t) => {
    addNoise(t, 1.1, 0.8, (x) => Math.exp(-x * 4), 0.35, 0.05);
    tone(t, 0.8, 70, 35, 0.4, (x) => Math.exp(-x * 5));
  },
  sneeze: (t) => {
    addNoise(t, 0.35, 0.3, (x) => (x < 0.7 ? x / 0.7 : 1) * 0.6, 0.05, 0.12);
    addNoise(t + 0.38, 0.25, 0.7, (x) => Math.exp(-x * 9), 0.6);
  },
  cheer: (t) => {
    for (let k = 0; k < 8; k++) addNoise(t + k * 0.05, 2.2, 0.08, (x) => Math.sin(Math.PI * x) * (0.7 + 0.3 * Math.sin(x * 30 + k)), 0.08 + k * 0.01);
  },
  horn: (t) => {
    [0, 0.45].forEach((d) => {
      tone(t + d, 0.32, 392, 392, 0.06, (x) => (x < 0.9 ? 1 : (1 - x) * 10));
      tone(t + d, 0.32, 494, 494, 0.05, (x) => (x < 0.9 ? 1 : (1 - x) * 10));
    });
  },
  siren: (t) => {
    for (let k = 0; k < 4; k++) {
      tone(t + k * 0.6, 0.3, 650, 950, 0.045, () => 1);
      tone(t + k * 0.6 + 0.3, 0.3, 950, 650, 0.045, () => 1);
    }
  },
  // A cascade of small metallic clinks (coins landing).
  coins: (t) => {
    for (let k = 0; k < 22; k++) {
      const d = k * 0.07 + ((k * 37) % 11) * 0.006;
      bell(t + d, 2600 + ((k * 571) % 1900), 0.012, 0.18);
      addNoise(t + d, 0.02, 0.12, (x) => 1 - x, 0.7);
    }
  },
  // Launch whistle, then a deep bloom and crackle.
  firework: (t) => {
    tone(t, 0.7, 900, 2400, 0.03, (x) => x);
    tone(t + 0.7, 1.4, 60, 30, 0.45, (x) => Math.exp(-x * 4));
    addNoise(t + 0.7, 0.5, 0.45, (x) => Math.exp(-x * 6), 0.3);
    for (let k = 0; k < 16; k++) addNoise(t + 0.9 + k * 0.06 + ((k * 13) % 5) * 0.01, 0.03, 0.18, (x) => 1 - x, 0.8);
  },
  // Twelve slow, deep chimes compressed into one strike plus tick.
  clock: (t) => {
    for (let k = 0; k < 4; k++) addNoise(t + k * 0.5, 0.02, 0.25, (x) => 1 - x, 0.9);
    bell(t + 2, 196, 0.12, 3.2);
    bell(t + 2, 392, 0.05, 2.4);
  },
  // A big stadium crowd: a long swell of filtered noise.
  crowd: (t) => {
    for (let k = 0; k < 10; k++) addNoise(t + k * 0.04, 4.5, 0.07, (x) => Math.min(1, x * 4) * (1 - x) * 1.4 * (0.8 + 0.2 * Math.sin(x * 22 + k)), 0.05 + k * 0.012);
  },
};
for (const s of tl.shots) if (s.sfx) SFX[s.sfx](s.start);

// ── duck music under dialogue, then mix ───────────────────────────────
const duck = new Float32Array(N).fill(1);
for (const l of tl.lines) {
  const a = Math.floor((l.start - 0.15) * SR);
  const b = Math.floor((l.end + 0.25) * SR);
  for (let i = Math.max(0, a); i < Math.min(N, b); i++) duck[i] = 0.6;
}
// smooth the duck envelope
let d = 1;
for (let i = 0; i < N; i++) {
  d += (duck[i] - d) * 0.0004;
  duck[i] = d;
}
const mix = new Float32Array(N);
let sq = 0;
for (let i = 0; i < N; i++) {
  mix[i] = music[i] * duck[i] + fx[i] * 0.6;
  sq += mix[i] * mix[i];
}
// Loudness target ≈ -21 dBFS RMS, then a tanh soft-limiter keeps SFX peaks under 0 dBFS.
const rms = Math.sqrt(sq / N) || 1e-6;
const drive = 0.09 / rms;
const gain = 1;
for (let i = 0; i < N; i++) mix[i] = Math.tanh(mix[i] * drive * 1.1) * 0.89;
// fade in/out
const fade = SR * 1.5;
const out = Buffer.alloc(44 + N * 4);
out.write('RIFF', 0);
out.writeUInt32LE(36 + N * 4, 4);
out.write('WAVEfmt ', 8);
out.writeUInt32LE(16, 16);
out.writeUInt16LE(1, 20);
out.writeUInt16LE(2, 22);
out.writeUInt32LE(SR, 24);
out.writeUInt32LE(SR * 4, 28);
out.writeUInt16LE(4, 32);
out.writeUInt16LE(16, 34);
out.write('data', 36);
out.writeUInt32LE(N * 4, 40);
const haas = Math.floor(SR * 0.012);
for (let i = 0; i < N; i++) {
  const f = Math.min(1, i / fade, (N - i) / fade);
  const l = mix[i] * gain * f;
  const r = (i >= haas ? mix[i - haas] : 0) * gain * f * 0.92 + l * 0.08;
  out.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(l * 32767))), 44 + i * 4);
  out.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(r * 32767))), 46 + i * 4);
}
mkdirSync(join(ROOT, 'public', 'audio'), {recursive: true});
const path = join(ROOT, 'public', 'audio', `${id}-score.wav`);
writeFileSync(path, out);
console.log(`score → ${path} (${tl.duration.toFixed(1)}s, ${segs.length} mood segments, ${tl.shots.filter((s) => s.sfx).length} sfx)`);
