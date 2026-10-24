"""Cinematic score + sound design for a File episode — synthesised from scratch (no samples, nothing to Content-ID).

    npx tsx scripts/export-timeline.ts sun01 > out/sun01-timeline.json
    ~/.venv-sun/bin/python scripts/score_cinema.py out/sun01-timeline.json      → public/audio/sun01-score.wav

Instruments: pipe organ (the theme, "Last Light"), string sections (polyBLEP saw ensembles), formant choir,
felt piano, FM bells, the ticking watch (the series' sonic logo), braams, sub drops, risers, heartbeat.
Sound design: wind, snow footsteps, ice, city/birds, metro rumble + murmur, crowd cheer, power-downs, match.
Music follows the script's `cue` per shot and is ducked under every spoken line (timeline line times).
"""
import json, os, sys
import numpy as np
from scipy.signal import butter, sosfilt, sosfilt_zi, oaconvolve, lfilter

SR = 48000
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
rng = np.random.default_rng(2026)

# ── basics ─────────────────────────────────────────────────────────────────
NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}

def hz(name):
    """'D3' → 146.83 Hz."""
    p, o = (name[:2], name[2:]) if len(name) > 2 and name[1] in "#b" else (name[:1], name[1:])
    midi = 12 * (int(o) + 1) + NOTE[p]
    return 440.0 * 2 ** ((midi - 69) / 12)

def env(n, a=0.01, r=0.3, sustain_to=None):
    """Attack/release envelope over n samples (linear attack, cosine release)."""
    e = np.ones(n, np.float32)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na, dtype=np.float32)
    nr = min(nr, n - na) if n - na > 0 else 0
    if nr > 0:
        e[n - nr:] *= (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, nr))).astype(np.float32)
    return e

def sos_lp(fc, order=2):
    return butter(order, min(fc, SR * 0.45) / (SR / 2), "low", output="sos")

def sos_hp(fc, order=2):
    return butter(order, fc / (SR / 2), "high", output="sos")

def sos_bp(lo, hi, order=2):
    return butter(order, [lo / (SR / 2), min(hi, SR * 0.45) / (SR / 2)], "band", output="sos")

def filt(sos, x):
    return sosfilt(sos, x, axis=0).astype(np.float32)

def sweep_filter(x, cutoffs, kind="low", block=512, q=None):
    """Time-varying 2nd-order filter (block-wise, state carried) — filter sweeps for braams and risers."""
    y = np.zeros_like(x)
    zi = None
    for i in range(0, len(x), block):
        fc = float(cutoffs[min(i, len(cutoffs) - 1)])
        if kind == "low":
            sos = sos_lp(fc)
        else:
            sos = sos_bp(max(30, fc / 1.4), fc * 1.4)
        if zi is None:
            zi = sosfilt_zi(sos) * 0
        seg, zi = sosfilt(sos, x[i:i + block], zi=zi)
        y[i:i + block] = seg
    return y

def saw(freq, n, detune_cents=0.0, vib=0.0, vib_rate=5.2, phase=None):
    """Band-limited (polyBLEP) sawtooth; freq may be a scalar or per-sample array."""
    f = np.full(n, freq, np.float64) if np.isscalar(freq) else freq.astype(np.float64)
    f = f * 2 ** (detune_cents / 1200)
    if vib:
        t = np.arange(n) / SR
        f = f * (1 + vib * np.sin(2 * np.pi * vib_rate * t + rng.random() * 6.28) * np.clip(t / 0.8, 0, 1))
    dt = f / SR
    ph = ((rng.random() if phase is None else phase) + np.cumsum(dt)) % 1.0
    s = 2 * ph - 1
    m = ph < dt
    x = ph[m] / dt[m]
    s[m] -= x + x - x * x - 1
    m = ph > 1 - dt
    x = (ph[m] - 1) / dt[m]
    s[m] -= x * x + x + x + 1
    return s.astype(np.float32)

def pan(mono, p):
    """p in [-1, 1] → stereo (equal power)."""
    a = (p + 1) * np.pi / 4
    return np.stack([mono * np.cos(a), mono * np.sin(a)], axis=1).astype(np.float32)

def pink(n):
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1, -2.494956002, 2.017265875, -0.522189400]
    return lfilter(b, a, rng.standard_normal(n)).astype(np.float32) * 3

def brown(n):
    x = np.cumsum(rng.standard_normal(n)).astype(np.float32)
    x -= filt(sos_lp(2), x)  # remove drift
    return x / (np.max(np.abs(x)) + 1e-9)

# ── instruments (each returns stereo float32, length n) ─────────────────────
def strings(notes, dur, a=1.2, r=1.8, bright=2600, vib=0.0035, spread=0.6, voices=(-11, -5, 0, 5, 11)):
    n = int((dur + r) * SR)
    out = np.zeros((n, 2), np.float32)
    for k, note in enumerate(notes):
        f = hz(note) if isinstance(note, str) else note
        for j, c in enumerate(voices):
            s = saw(f, n, c, vib=vib)
            out += pan(s, (j / (len(voices) - 1) - 0.5) * spread * 2 * (1 if k % 2 else -1) * 0.8)
    out = filt(sos_lp(bright), out)
    out = filt(sos_hp(60), out)
    e = env(n, a, r)
    return out * e[:, None] / (len(notes) * len(voices)) * 1.6

def organ(notes, dur, a=0.09, r=0.9, bright=1.0):
    n = int((dur + r) * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2), np.float32)
    bars = [(0.5, 0.55), (1, 1.0), (2, 0.7), (3, 0.32), (4, 0.42 * bright), (6, 0.18 * bright), (8, 0.16 * bright)]
    trem = 1 + 0.025 * np.sin(2 * np.pi * 5.6 * t)
    for k, note in enumerate(notes):
        f = hz(note) if isinstance(note, str) else note
        m = np.zeros(n, np.float32)
        for h, lv in bars:
            if f * h < 9000:
                m += lv * np.sin(2 * np.pi * f * h * t * (1 + 0.0007 * k) + rng.random() * 6.28).astype(np.float32)
        out += pan(m, ((k % 3) - 1) * 0.35)
    air = filt(sos_bp(1500, 6000), rng.standard_normal((n, 2)).astype(np.float32)) * 0.004
    out = (out * trem[:, None] / max(1, len(notes)) * 0.5 + air) * env(n, a, r)[:, None]
    return out

VOWELS = {"ah": [(800, 1.0), (1150, 0.6), (2900, 0.25)], "oo": [(320, 1.0), (870, 0.35), (2250, 0.1)], "eh": [(500, 1.0), (1700, 0.5), (2500, 0.3)]}

def choir(notes, dur, vowel="ah", a=1.6, r=2.2):
    n = int((dur + r) * SR)
    src = np.zeros((n, 2), np.float32)
    for k, note in enumerate(notes):
        f = hz(note) if isinstance(note, str) else note
        for j, c in enumerate((-14, -6, 0, 7, 13)):
            src += pan(saw(f, n, c, vib=0.006, vib_rate=4.6 + j * 0.3), (j - 2) * 0.3)
    out = np.zeros_like(src)
    for fc, g in VOWELS[vowel]:
        out += filt(sos_bp(fc / 1.18, fc * 1.18), src) * g
    breath = filt(sos_bp(900, 5000), rng.standard_normal((n, 2)).astype(np.float32)) * 0.01
    return (out / (len(notes) * 5) * 2.2 + breath) * env(n, a, r)[:, None]

def piano(note, dur=3.0, vel=0.7, bright=3200):
    f = hz(note) if isinstance(note, str) else note
    n = int((dur + 1.2) * SR)
    t = np.arange(n) / SR
    m = np.zeros(n, np.float32)
    B = 0.00035
    for k in range(1, 14):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > 12000:
            break
        m += (vel / k ** 1.15) * np.sin(2 * np.pi * fk * t + rng.random()).astype(np.float32) * np.exp(-t * (0.55 + 0.42 * k)).astype(np.float32)
    ham = filt(sos_lp(1800), rng.standard_normal(n).astype(np.float32)) * np.exp(-t * 90).astype(np.float32) * 0.25 * vel
    m = filt(sos_lp(bright), m + ham)
    m *= env(n, 0.004, 0.9)
    p = np.clip((np.log2(f / 261.6)) * 0.35, -0.7, 0.7)
    return pan(m * 0.35, p)

def bell(note, dur=4.0, vel=0.5, ratio=3.5):
    f = hz(note) if isinstance(note, str) else note
    n = int(dur * SR)
    t = np.arange(n) / SR
    idx = 2.2 * np.exp(-t * 2.5)
    m = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * ratio * t)) * np.exp(-t * 1.1)
    return pan((m * vel * 0.3).astype(np.float32), rng.uniform(-0.5, 0.5))

def tick(tock=False, vel=1.0):
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n).astype(np.float32) * np.exp(-t * 900).astype(np.float32)
    f0 = 2350 if tock else 3150
    body = filt(sos_bp(f0 / 1.08, f0 * 1.08), noise) * 6
    click = np.sin(2 * np.pi * (1650 if tock else 2050) * t).astype(np.float32) * np.exp(-t * 260).astype(np.float32) * 0.4
    return pan((body + click) * 0.5 * vel, -0.25 if tock else 0.25)

def boom(vel=1.0, dur=3.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 32 + 70 * np.exp(-t * 5)
    ph = 2 * np.pi * np.cumsum(f) / SR
    m = np.sin(ph) * np.exp(-t * 1.1)
    hit = filt(sos_lp(500), rng.standard_normal(n).astype(np.float32)) * np.exp(-t * 30).astype(np.float32) * 0.6
    m = np.tanh((m + hit) * 1.6) * 0.8
    return pan(m.astype(np.float32) * vel, 0)

def braam(root="D1", dur=4.0, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    m = np.zeros(n, np.float32)
    for note in (root, root[:-1] + str(int(root[-1]) + 1), "A" + str(int(root[-1]) + 1)):
        for c in (-18, -7, 0, 8, 17):
            m += saw(hz(note), n, c)
    m = np.tanh(m * 0.35)
    cut = 140 + 1700 * np.clip(t / 0.35, 0, 1) * np.exp(-np.maximum(0, t - 0.35) * 1.2)
    m = sweep_filter(m, np.repeat(cut, 1)[::1], "low")
    e = np.clip(t / 0.06, 0, 1) * np.exp(-t * 0.55)
    return pan((m * e * 0.5 * vel).astype(np.float32), 0) * np.array([1, 0.96], np.float32)

def riser(dur=4.0, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n).astype(np.float32)
    cut = 300 * (20 ** (t / dur))
    y = sweep_filter(x, cut, "band") * (t / dur) ** 2.2
    s = saw(110 * 2 ** (2 * t / dur), n) * 0.05 * (t / dur) ** 2
    return pan((y * 0.9 + s) * vel, 0) * np.array([1, 1], np.float32)

def whoosh(dur=1.6, vel=1.0, up=True):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n).astype(np.float32)
    shape = np.sin(np.pi * t / dur) ** 2
    cut = 400 + 3500 * (shape if up else 1 - shape)
    y = sweep_filter(x, cut, "band") * shape
    p = np.linspace(-0.6, 0.6, n)
    return np.stack([y * np.cos((p + 1) * np.pi / 4), y * np.sin((p + 1) * np.pi / 4)], 1).astype(np.float32) * vel * 0.8

def heartbeat(vel=1.0):
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    m = np.sin(2 * np.pi * 52 * t) * np.exp(-t * 16)
    t2 = np.clip(t - 0.28, 0, None)
    m += 0.7 * np.sin(2 * np.pi * 48 * t2) * np.exp(-t2 * 18) * (t > 0.28)
    return pan((m * vel * 0.9).astype(np.float32), 0)

def taiko(vel=1.0):
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    f = 70 + 60 * np.exp(-t * 30)
    m = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.5)
    slap = filt(sos_bp(200, 1200), rng.standard_normal(n).astype(np.float32)) * np.exp(-t * 60).astype(np.float32) * 0.5
    return pan(((m + slap) * vel * 0.8).astype(np.float32), rng.uniform(-0.2, 0.2))

# ── sound design ───────────────────────────────────────────────────────────
def wind(dur, vel=1.0, gust=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2), np.float32)
    for ch in range(2):
        x = pink(n)
        lfo = 0.5 + 0.5 * np.sin(2 * np.pi * (0.07 + 0.03 * ch) * t + rng.random() * 6) * np.sin(2 * np.pi * 0.023 * t + ch)
        cut = 350 + 900 * lfo * gust + 150
        out[:, ch] = sweep_filter(x, cut, "band") * (0.5 + 0.5 * lfo)
    return out * vel * 0.5 * env(n, 1.5, 1.5)[:, None]

def city_morning(dur):
    n = int(dur * SR)
    rumble = filt(sos_lp(180), brown(n)) * 0.6
    out = pan(rumble, 0) * 0.5
    t0 = 0.0
    while t0 < dur - 1:
        t0 += rng.uniform(0.6, 2.2)
        k = int(t0 * SR)
        m = int(0.12 * SR)
        tt = np.arange(m) / SR
        f = rng.uniform(3200, 5200) * (1 + 0.25 * np.sin(2 * np.pi * rng.uniform(15, 30) * tt))
        chirp = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.12) ** 2 * 0.06
        if k + m < n:
            out[k:k + m] += pan(chirp.astype(np.float32), rng.uniform(-0.8, 0.8))
    return out * env(n, 1.0, 1.0)[:, None]

def metro_bed(dur, murmur=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    rum = filt(sos_lp(110), brown(n)) * 0.9
    mur = np.zeros((n, 2), np.float32)
    for ch in range(2):
        x = filt(sos_bp(280, 1300), rng.standard_normal(n).astype(np.float32))
        am = filt(sos_lp(5), np.abs(rng.standard_normal(n)).astype(np.float32)) * 3
        mur[:, ch] = x * am * 0.08 * murmur
    return (pan(rum, 0) * 0.45 + mur) * env(n, 1.0, 1.0)[:, None]

def crowd_cheer(dur=4.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2), np.float32)
    for ch in range(2):
        x = filt(sos_bp(500, 3200), rng.standard_normal(n).astype(np.float32))
        jit = 0.6 + 0.4 * filt(sos_lp(14), rng.standard_normal(n).astype(np.float32)) * 4
        out[:, ch] = x * jit
    e = np.clip(t / 0.35, 0, 1) * np.exp(-np.maximum(0, t - 0.6) * 0.8)
    return out * e[:, None] * 0.25

def powerdown(dur=1.8, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 120 * np.exp(-t * 1.6) + 25
    ph = 2 * np.pi * np.cumsum(f) / SR
    m = (np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)) * np.exp(-t * 1.4)
    clunk = filt(sos_lp(300), rng.standard_normal(n).astype(np.float32)) * np.exp(-t * 40).astype(np.float32)
    return pan(((m * 0.5 + clunk) * vel * 0.6).astype(np.float32), 0)

def footsteps(dur, rate=1.8, vel=1.0):
    n = int(dur * SR)
    out = np.zeros((n, 2), np.float32)
    k = 0
    i = 0
    while k < n - SR // 4:
        m = int(0.16 * SR)
        tt = np.arange(m) / SR
        grains = (rng.random(m) > 0.75).astype(np.float32) * rng.standard_normal(m).astype(np.float32)
        crunch = filt(sos_bp(900, 4500), grains) * np.exp(-tt * 18).astype(np.float32)
        out[k:k + m] += pan(crunch * 0.5 * vel, -0.2 if i % 2 else 0.2)
        k += int(SR / rate * rng.uniform(0.92, 1.08))
        i += 1
    return out

def match_strike():
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    s = filt(sos_bp(2000, 7000), rng.standard_normal(n).astype(np.float32)) * np.exp(-t * 14).astype(np.float32)
    flame = filt(sos_lp(700), rng.standard_normal(n).astype(np.float32)) * np.clip(t / 0.1, 0, 1) * 0.3
    return pan(s * 0.6 + flame, 0.2)

def ice_crack(vel=1.0):
    n = int(0.8 * SR)
    t = np.arange(n) / SR
    clicks = (rng.random(n) > 0.997).astype(np.float32) * rng.standard_normal(n).astype(np.float32)
    ping = np.sin(2 * np.pi * rng.uniform(900, 1600) * t) * np.exp(-t * 9)
    return pan((filt(sos_hp(1200), clicks) * 1.5 + ping * 0.25).astype(np.float32) * vel * 0.5, rng.uniform(-0.6, 0.6))

def static(dur, vel=1.0):
    n = int(dur * SR)
    x = filt(sos_bp(400, 5000), rng.standard_normal(n).astype(np.float32))
    crackle = (rng.random(n) > 0.9985).astype(np.float32) * rng.standard_normal(n).astype(np.float32) * 3
    return pan((x * 0.05 + crackle * 0.05) * vel, -0.1) * env(n, 0.2, 0.3)[:, None]

def whale(dur=5.0, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 180 + 120 * np.sin(np.pi * t / dur) + 8 * np.sin(2 * np.pi * 3 * t)
    m = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / dur) ** 2
    return pan((m * 0.12 * vel).astype(np.float32), rng.uniform(-0.5, 0.5))

# ── reverb ─────────────────────────────────────────────────────────────────
def impulse(rt60=3.2, length=None, damp=5000):
    L = int((length or rt60 * 1.2) * SR)
    t = np.arange(L) / SR
    ir = rng.standard_normal((L, 2)).astype(np.float32) * np.exp(-6.9 * t / rt60)[:, None].astype(np.float32)
    dark = filt(sos_lp(damp * 0.35), ir)
    mix = np.clip(t / (rt60 * 0.6), 0, 1)[:, None]
    ir = ir * (1 - mix) + dark * mix
    ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))[:, None]
    return ir / np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True))

def reverb(x, ir, wet=0.35):
    y = np.zeros_like(x)
    for ch in range(2):
        y[:, ch] = oaconvolve(x[:, ch], ir[:, ch], mode="full")[: len(x)]
    return x * (1 - wet * 0.5) + y * wet * 2.0

# ── the score ──────────────────────────────────────────────────────────────
class Mix:
    def __init__(self, dur):
        self.n = int((dur + 4) * SR)
        self.music = np.zeros((self.n, 2), np.float32)
        self.hall = np.zeros((self.n, 2), np.float32)  # organ/choir send to the cathedral
        self.fx = np.zeros((self.n, 2), np.float32)
        self.hits = np.zeros((self.n, 2), np.float32)

    def add(self, bus, t, sig, gain=1.0):
        k = int(t * SR)
        if k >= self.n or k + len(sig) <= 0:
            return
        if k < 0:
            sig, k = sig[-k:], 0
        m = min(len(sig), self.n - k)
        getattr(self, bus)[k:k + m] += sig[:m] * gain

THEME_MINOR = [  # (beat, length, note) — "Last Light", 4 bars of 4 beats
    (0, 2, "A4"), (2, 1, "D5"), (3, 1, "C5"), (4, 1.5, "D5"), (5.5, 0.5, "F5"), (6, 2, "E5"),
    (8, 2, "C5"), (10, 1, "A4"), (11, 1, "G4"), (12, 4, "A4"),
    (16, 2, "F5"), (18, 1, "E5"), (19, 1, "D5"), (20, 1.5, "C5"), (21.5, 0.5, "A4"), (22, 2, "C5"),
    (24, 2, "E5"), (26, 1, "D5"), (27, 1, "C5"), (28, 4, "D5"),
]
PROG_MINOR = [["D3", "A3", "D4", "F4"], ["Bb2", "F3", "Bb3", "D4"], ["F2", "C3", "F3", "A3"], ["C3", "G3", "C4", "E4"],
              ["Bb2", "F3", "Bb3", "D4"], ["F2", "C3", "F3", "A3"], ["C3", "G3", "C4", "E4"], ["D3", "A3", "D4", "F4"]]
PROG_MAJOR = [["D3", "A3", "D4", "F#4"], ["G2", "D3", "G3", "B3"], ["B2", "F#3", "B3", "D4"], ["A2", "E3", "A3", "C#4"],
              ["G2", "D3", "G3", "B3"], ["D3", "A3", "D4", "F#4"], ["A2", "E3", "A3", "C#4"], ["D3", "A3", "D4", "F#4"]]
THEME_MAJOR = [(b, l, n.replace("C5", "C#5").replace("F5", "F#5")) for b, l, n in THEME_MINOR]
BASS = {"D": "D2", "Bb": "Bb1", "F": "F2", "C": "C2", "G": "G1", "B": "B1", "A": "A1"}

def bass_of(chord):
    root = chord[0][:-1]
    return BASS.get(root, root + "2")

def chords(mix, s, e, prog, bpm, inst="strings", gain=1.0, bars_per_chord=1, octave_bass=True, choir_vowel=None):
    beat = 60 / bpm
    bar = 4 * beat * bars_per_chord
    t, i = s, 0
    while t < e - 0.5:
        d = min(bar, e - t)
        c = prog[i % len(prog)]
        notes = c + ([bass_of(c)] if octave_bass else [])
        if inst == "strings":
            mix.add("music", t, strings(notes, d, a=min(1.2, d * 0.4), r=1.6), gain)
        elif inst == "organ":
            mix.add("hall", t, organ(notes, d), gain)
        if choir_vowel:
            mix.add("hall", t, choir(c[1:], d, choir_vowel, a=min(1.6, d * 0.5)), gain * 0.8)
        t += bar
        i += 1

def melody(mix, s, e, theme, bpm, inst="organ", gain=1.0, octave=0):
    beat = 60 / bpm
    loop = 32 * beat
    t0 = s
    while t0 < e:
        for b, l, n in theme:
            t = t0 + b * beat
            if t >= e - 0.3:
                break
            nn = n[:-1] + str(int(n[-1]) + octave)
            d = min(l * beat, e - t)
            if inst == "organ":
                mix.add("hall", t, organ([nn], d * 0.95, a=0.05, r=0.5, bright=0.6), gain)
            elif inst == "piano":
                mix.add("music", t, piano(nn, d + 1.5, 0.6), gain)
            elif inst == "strings":
                mix.add("music", t, strings([nn], d, a=0.25, r=0.8, bright=3600, voices=(-6, 0, 6)), gain)
            elif inst == "choir":
                mix.add("hall", t, choir([nn], d, "ah", a=0.3, r=1.0), gain)
        t0 += loop

def ticks(mix, s, e, rate=1.0, vel=1.0, bus="fx"):
    t, k = s, 0
    while t < e:
        mix.add(bus, t, tick(k % 2 == 1, vel))
        t += 1 / rate
        k += 1

def arpeggio(mix, s, e, prog, bpm, gain=1.0, pattern=(0, 1, 2, 3, 2, 1, 2, 3)):
    beat = 60 / bpm / 2
    t, i = s, 0
    while t < e - 0.2:
        c = prog[(i // len(pattern)) % len(prog)]
        n = c[pattern[i % len(pattern)] % len(c)]
        mix.add("music", t, piano(n, 2.2, 0.45 + 0.1 * (i % 4 == 0)), gain)
        t += beat
        i += 1

def ostinato(mix, s, e, bpm, notes, gain=1.0):
    step = 60 / bpm / 4
    t, i = s, 0
    while t < e - 0.1:
        n = notes[i % len(notes)]
        mix.add("music", t, strings([n], step * 0.9, a=0.008, r=0.12, bright=3000, vib=0, voices=(-7, 0, 7)), gain * (1.15 if i % 4 == 0 else 0.85))
        t += step
        i += 1

SHELL = ["D2", "Eb2", "A1"]  # the shell's motif: a rising half-step that falls a tritone — wrong, patient, huge

def shell_motif(mix, t, gain=1.0, long=4.0):
    """Three low organ/brass notes + choir halo. Plays at every reveal of the shell."""
    for k, n in enumerate(SHELL):
        mix.add("hall", t + k * 0.9, organ([n, hz_up(n)], long - k * 0.6, a=0.15, r=1.8, bright=0.6), gain)
    mix.add("hall", t + 1.2, choir(["D4", "Eb4", "A4"], long, "oo", a=1.2, r=2.2), 0.6 * gain)
    mix.add("hits", t, braam("D1", long, 0.9), 0.6 * gain)

def hz_up(n):
    return n[:-1] + str(int(n[-1]) + 1)

def beep(f=1320, dur=0.12, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) * env(n, 0.004, dur * 0.5)
    return pan((x * 0.5 * vel).astype(np.float32), 0)

def render(tl):
    dur = tl["duration"]
    mix = Mix(dur)
    shots = {s["id"]: s for s in tl["shots"]}
    regions, cur = [], None
    for s in tl["shots"]:
        if s["cue"] and s["cue"] != (cur and cur["cue"]):
            if cur:
                cur["end"] = s["start"]
            cur = {"cue": s["cue"], "start": s["start"], "end": dur, "shot": s["id"]}
            regions.append(cur)
    B = shots["lights-out"]["start"]  # the frame the light goes out
    gate = []
    lines = {l["key"]: l for l in tl["lines"]}

    for r in regions:
        c, s, e = r["cue"], r["start"], r["end"]
        L = e - s
        if c == "open":
            # the Sun roaring; plates clanking into place; the last lock is a braam
            roar = filt(sos_lp(900), brown(int((L + 1) * SR)))
            mix.add("fx", s, pan((roar * 0.5).astype(np.float32), 0), 1.0)
            close_end = shots["shell-closes"]["end"]
            for k in range(14):
                t = s + 0.6 + (close_end - s - 1.2) * (k / 14) ** 0.8
                mix.add("fx", t, tick(k % 3 == 0, 1.3), 0.9)
            mix.add("hits", close_end - 0.6, boom(1.0, 4), 1.0)
            shell_motif(mix, close_end - 0.6, 0.9)
            mix.add("fx", shots["light-race"]["start"], whoosh(3.0, 0.9), 0.9)
            mix.add("music", shots["light-race"]["start"], strings(["A5", "E6"], e - shots["light-race"]["start"], a=1.5, r=1.0, bright=7000, voices=(-3, 3)), 0.3)
        elif c == "morning":
            arpeggio(mix, s, e, [["D3", "A3", "C#4", "F#4"], ["G2", "D3", "F#3", "B3"], ["B2", "F#3", "A3", "D4"], ["A2", "E3", "G3", "C#4"]], 88, 0.9)
            mix.add("fx", s, city_morning(L + 1), 0.8)
            # the light front is still coming: a faint high tone under the warmth
            mix.add("music", s, strings(["A6"], L, a=3, r=1, bright=8000, voices=(-2, 2)), 0.12)
        elif c == "race":
            ticks(mix, s, B, 1.0, 1.1)
            rl = B - s + 0.6
            mix.add("hits", B - rl, riser(rl, 1.0), 0.95)
            mix.add("music", s - 1.0, strings(["D3", "A3", "D4", "Eb4", "A4"], B - s + 1.0, a=2.0, r=0.05, bright=4200), 0.9)
            gate.append((B, B + 1.3))
        elif c == "silence":
            mix.add("hits", B + 1.35, boom(1.0, 5), 1.0)
            mix.add("hall", B + 1.45, organ(["D1", "D2", "A2", "D3", "F3"], e - B - 1.3, a=3.0, r=2.5), 1.2)
            mix.add("hall", B + 2.0, choir(["D4", "F4", "A4"], e - B - 1.8, "oo", a=3, r=2.5), 0.7)
        elif c == "title":
            mix.add("hits", s + 0.2, braam("D1", 5, 1.0), 1.0)
            shell_motif(mix, s + 0.25, 0.7, long=L + 1)
        elif c == "unease":
            m = strings(["D2", "A2", "Eb3", "D3"], L, a=1.0, r=1.0, bright=1800)
            tt = np.arange(len(m)) / SR
            m *= (0.7 + 0.3 * np.sin(2 * np.pi * 9 * tt))[:, None].astype(np.float32)
            mix.add("music", s, m, 0.85)
            for k in range(int(L / 0.86)):
                mix.add("hits", s + k * 0.86, heartbeat(0.6), 0.7)
        elif c == "curious":
            # pizzicato-ish plucks + bells: Ito's excitement, the puzzle
            notes = ["D4", "F4", "A4", "D5", "C5", "A4", "F4", "E4"]
            t, i = s + 0.1, 0
            while t < e - 0.2:
                mix.add("music", t, piano(notes[i % len(notes)], 0.6, 0.55, bright=4500), 0.7)
                t += 0.36
                i += 1
            mix.add("music", s, strings(["D3", "A3", "F4"], L, a=0.8, r=1.0, bright=2400), 0.45)
        elif c == "reveal":
            mix.add("music", s + 0.15, bell("A5", 5, 0.6), 0.9)
            mix.add("hall", s + 0.1, choir(["D4", "F4", "A4"], L, "oo", a=1.0, r=2), 0.8)
            mix.add("music", s, strings(["D3", "A3", "F4"], L, a=1.0, r=2, bright=2600), 0.6)
        elif c == "sting":
            mix.add("hits", s, boom(0.8, 3), 0.8)
            mix.add("music", s, strings(["D3", "Ab3", "D4", "Eb4"], L, a=0.3, r=1.5, bright=3000), 0.75)
            mix.add("music", s + 0.1, bell("D6", 4, 0.5), 0.7)
        elif c == "shellSting":
            shell_motif(mix, s + 0.05, 1.0, long=max(3.0, L))
        elif c == "work":
            ostinato(mix, s, e, 104, ["D3", "A3", "F3", "A3"], 0.5)
            chords(mix, s, e, [["D3", "A3", "D4", "F4"], ["Bb2", "F3", "Bb3", "D4"], ["G2", "D3", "G3", "Bb3"], ["A2", "E3", "A3", "C#4"]], 104, "strings", 0.55)
            t = s
            while t < e - 0.3:
                mix.add("hits", t, taiko(0.6), 0.45)
                t += 60 / 104 * 2
        elif c == "mystery":
            mix.add("hall", s, organ(["D1", "D2"], L, a=1.5, r=2), 0.7)
            for k, n in enumerate(["Bb4", "A4", "D5", "Eb5", "A4", "D5"]):
                if s + 0.8 + k * 2.2 < e:
                    mix.add("music", s + 0.8 + k * 2.2, piano(n, 4, 0.5), 0.8)
            mix.add("fx", s, static(L, 0.6), 0.6)
        elif c == "wonder":
            prog = [["D3", "A3", "D4", "F#4"], ["E3", "G#3", "B3", "E4"], ["D3", "A3", "D4", "F#4"], ["B2", "F#3", "B3", "D4"]]
            chords(mix, s, e, prog, 58, "strings", 1.2, choir_vowel="ah")
            for k in range(int(L // 1.2)):
                mix.add("music", s + 0.6 + k * 1.2, bell(rng.choice(["F#6", "A6", "D7", "G#6", "E6"]), 5, 0.3), 0.85)
            mix.add("fx", s, wind(L + 1, 0.5, 0.3), 0.5)
        elif c == "tension":
            m = strings(["D2", "A2", "D3", "Eb3", "A3"], L, a=L * 0.5, r=1.0, bright=2200)
            mix.add("music", s, m, 0.95)
            k, t = 0, s + 0.5
            while t < e:
                mix.add("hits", t, heartbeat(0.75), 0.75)
                t += max(0.5, 0.95 - k * 0.025)
                k += 1
            mix.add("fx", s, wind(L + 1, 0.9, 0.6), 0.7)
            for sid in ("grid-fail", "candles"):
                if sid in shots:
                    mix.add("fx", shots[sid]["start"] + 0.1, powerdown(1.6, 1.0), 1.0)
            if "candles" in shots:
                mix.add("fx", shots["candles"]["start"] + 0.6, match_strike(), 1.0)
        elif c == "chase":
            ostinato(mix, s, e - 1.4, 136, ["D3", "D3", "F3", "D3", "G3", "D3", "F3", "E3"], 0.55)
            t = s
            while t < e - 1.4:
                mix.add("hits", t, taiko(1.0), 0.7)
                t += 60 / 136 * 2
            mix.add("music", e - 1.5, strings(["Bb2", "D3", "E3", "A3", "Bb3"], 2.5, a=0.05, r=2.0, bright=3500), 1.0)
            mix.add("hits", e - 1.5, boom(0.8, 3), 0.85)
            mix.add("fx", s, wind(L + 1, 1.3, 0.9), 0.9)
            mix.add("fx", s + 0.3, footsteps(L - 1, 3.2, 1.0), 0.7)
        elif c == "search":
            mix.add("fx", s, wind(L + 1, 0.9, 0.6), 0.9)
            mix.add("fx", s + 0.4, footsteps(L - 1, 1.7, 1.0), 0.8)
            for k, n in enumerate(["D5", "A5", "F5", "E5", "D5", "C6", "A5", "F5"]):
                if s + 0.6 + k * 1.7 < e:
                    mix.add("music", s + 0.6 + k * 1.7, piano(n, 4, 0.45), 0.8)
            mix.add("music", s, strings(["D4", "A4"], L, a=2, r=2, bright=2200), 0.4)
        elif c == "warm":
            prog = [["F2", "C3", "F3", "A3", "C4"], ["Bb2", "F3", "Bb3", "D4"], ["D3", "A3", "D4", "F4"], ["C3", "G3", "C4", "E4"]]
            chords(mix, s, e, prog, 64, "strings", 1.0, choir_vowel="ah")
            melody(mix, s + 1.0, e, THEME_MAJOR, 64, "piano", 0.5)
        elif c == "tunnel":
            prog = [["F2", "C3", "F3", "A3"], ["C3", "G3", "C4", "E4"], ["D3", "A3", "D4", "F4"], ["Bb2", "F3", "Bb3", "D4"]]
            chords(mix, s, e, prog, 72, "strings", 0.75)
            mix.add("fx", s, metro_bed(L + 1, 1.0), 0.8)
            melody(mix, s + 2.0, e, THEME_MINOR, 72, "piano", 0.5)
        elif c == "shell":
            shell_motif(mix, s + 0.1, 1.1, long=min(8, L))
            mix.add("hall", s, organ(["D1", "A1", "D2"], L, a=2.0, r=2.5, bright=0.4), 0.8)
            for k in range(int(L // 2.5)):
                mix.add("music", s + 1.5 + k * 2.5, bell(rng.choice(["Eb6", "A5", "D6"]), 5, 0.3), 0.6)
        elif c == "dread":
            mix.add("fx", s + 0.5, powerdown(2.2, 1.2), 1.0)
            mix.add("hits", s + 0.6, boom(0.6, 3), 0.7)
            mix.add("hall", s + 1.0, organ(["D1", "A1"], L - 1, a=2, r=1.5), 0.7)
            t = s + 2.0
            while t < e:
                mix.add("hits", t, heartbeat(0.8), 0.8)
                t += 0.92
            mix.add("music", s + 2, strings(["Eb3", "A3", "D4"], L - 2, a=2.5, r=1.0, bright=2000), 0.7)
        elif c == "hope":
            mix.add("fx", s + 0.3, powerdown(0.5, 0.3)[::-1], 0.8)
            mix.add("fx", s + 0.7, crowd_cheer(4.5), 1.5)
            prog = [["F2", "C3", "F3", "A3", "C4"], ["Bb2", "F3", "Bb3", "D4"], ["C3", "G3", "C4", "E4"], ["F2", "C3", "F3", "A3", "C4"]]
            chords(mix, s + 0.5, e, prog, 66, "strings", 1.4, choir_vowel="ah")
            mix.add("hits", s + 0.5, boom(0.6, 3), 0.6)
            melody(mix, s + 3, e, THEME_MAJOR, 66, "piano", 0.5)
        elif c == "finale":
            chords(mix, s, e, PROG_MINOR, 60, "strings", 0.9, choir_vowel="oo")
            melody(mix, s + 1, e, THEME_MINOR, 60, "piano", 0.7)
            for k in range(int(L // 1.6)):
                mix.add("music", s + 0.8 + k * 1.6, bell(rng.choice(["D6", "A6", "F6"]), 5, 0.25), 0.6)
        elif c == "flash":
            # the door opens: a riser into the one-second Sun, then a full major chord that cuts to silence
            one = shots["one-second"]
            fl = one["start"] + 0.15 + 0.3
            mix.add("hits", fl - 2.6, riser(2.6, 1.0), 1.0)
            mix.add("hall", fl, organ(["D2", "A2", "D3", "F#3", "A3", "D4", "F#4"], 1.15, a=0.02, r=0.4), 1.6)
            mix.add("hall", fl, choir(["D4", "F#4", "A4", "D5"], 1.15, "ah", a=0.05, r=0.5), 1.2)
            mix.add("hits", fl, boom(1.0, 5), 1.0)
            mix.add("music", fl + 1.2, strings(["D3", "A3", "F4"], e - fl - 1.2, a=2.5, r=2, bright=2200), 0.6)
        elif c == "afterglow":
            mix.add("music", s, strings(["D4", "F#4", "A4"], L, a=0.5, r=2.0, bright=3000), 0.6)
            mix.add("music", s + 0.4, bell("F#6", 5, 0.4), 0.7)
        elif c == "signal":
            mix.add("fx", s, static(L, 1.0), 0.9)
            mix.add("hall", s, organ(["D1", "D2"], L, a=1.0, r=2), 0.6)
            # the count: 1, 2, 3 pulses, each just before Ito says the number
            for i in range(3):
                key = f"counting:{i}"
                if key in lines:
                    t0 = lines[key]["start"] - 0.75
                    for k in range(i + 1):
                        mix.add("fx", t0 + k * 0.18, beep(1320, 0.11, 1.2), 1.0)
            # and once more under the planets, then nothing
            if "count-planets" in shots:
                t0 = shots["count-planets"]["start"] + 0.2
                for i in range(3):
                    for k in range(i + 1):
                        mix.add("fx", t0 + i * 0.9 + k * 0.16, beep(1320, 0.1, 0.9), 0.9)
        elif c == "end":
            chords(mix, s, e, PROG_MINOR, 60, "organ", 0.7)
            melody(mix, s + 1.5, e, THEME_MINOR, 60, "organ", 0.55)
            for k in range(int(L // 1.0)):
                t0 = s + 0.5 + k * 1.0
                for j in range((k % 3) + 1):
                    mix.add("fx", t0 + j * 0.16, beep(1320, 0.08, 0.5), 0.5)
    # per-shot sound effects and whip transitions
    for sh in tl["shots"]:
        t0 = sh["start"]
        fx = sh.get("sfx")
        if sh.get("transition") == "whip":
            mix.add("fx", t0 - 0.15, whoosh(0.6, 1.0), 0.9)
        if fx == "powercut":
            mix.add("fx", t0, powerdown(1.0, 1.2), 1.0)
        elif fx == "decloak":
            mix.add("music", t0 + 0.9, bell("A6", 3, 0.5)[::-1].copy(), 0.6)
        elif fx == "riser":
            mix.add("hits", t0, riser(min(3, sh["end"] - t0), 0.8), 0.8)
        elif fx == "impact":
            mix.add("hits", t0, boom(1.0, 3.5), 1.0)
        elif fx == "whoosh":
            mix.add("fx", t0, whoosh(1.2, 1.2), 1.0)
            mix.add("fx", t0, wind(2.5, 1.4, 1.0), 0.9)
        elif fx == "chime":
            mix.add("music", t0 + 0.1, bell("E6", 3, 0.6), 0.8)
        elif fx == "crash":
            mix.add("fx", t0, ice_crack(1.0), 0.8)
        elif fx == "stamp":
            for k in range(3):
                mix.add("hits", t0 + 0.1 + k * 0.28, taiko(0.8), 0.9)
    return mix, gate, B

def duck_curve(n, lines, depth_db, pad=0.12, release=0.55):
    g = np.zeros(n, np.float32)
    for l in lines:
        a, b = int((l["start"] - pad) * SR), int((l["end"] + pad) * SR)
        g[max(0, a):min(n, b)] = 1
    w = int(release * SR)
    k = np.hanning(2 * w).astype(np.float32)
    k /= k.sum()
    g = np.convolve(g, k, mode="same")
    g = np.clip(g * 1.6, 0, 1)
    return 1 - g * (1 - 10 ** (-depth_db / 20))

def limiter(x, thr=0.89, look=0.005):
    w = int(look * SR)
    peak = np.max(np.abs(x), axis=1)
    from scipy.ndimage import maximum_filter1d, uniform_filter1d
    env_ = maximum_filter1d(peak, size=2 * w + 1)
    gain = np.minimum(1, thr / (env_ + 1e-9))
    gain = uniform_filter1d(gain, size=w * 4)
    return x * gain[:, None]

def main():
    tl = json.load(open(sys.argv[1]))
    mix, gate, B = render(tl)
    n = mix.n
    print("rendered instruments; mixing…", flush=True)
    hall_ir = impulse(5.5, damp=4200)
    room_ir = impulse(2.6, damp=6000)
    music = reverb(mix.music, room_ir, 0.32) + reverb(mix.hall, hall_ir, 0.45) * 0.9
    hits = reverb(mix.hits, room_ir, 0.2)
    fx = reverb(mix.fx, room_ir, 0.12)
    # Narration must sit ≥10 dB over the bed (≥6 dB on every line): music ducks 16 dB under every line, hits 18 dB, sound design 14 dB.
    duck_m = duck_curve(n, tl["lines"], 16.0)
    duck_h = duck_curve(n, tl["lines"], 18.0)
    duck_f = duck_curve(n, tl["lines"], 14.0)
    out = music * duck_m[:, None] + hits * duck_h[:, None] + fx * duck_f[:, None]
    # hard silences (the blackout; the blink) — 15 ms edges
    t = np.arange(n) / SR
    g = np.ones(n, np.float32)
    for a, b in gate:
        g *= np.clip(np.maximum((a - t) / 0.015, (t - b) / 0.4), 0, 1).astype(np.float32)
    out *= g[:, None]
    out = out[: int((tl["duration"] + 0.5) * SR)]
    # level: score sits under the voice; master loudness is set in the final ffmpeg pass
    rms = np.sqrt(np.mean(out ** 2))
    out *= 10 ** (-22 / 20) / (rms + 1e-9)
    out = limiter(out, 0.89)
    out = np.clip(out, -0.97, 0.97)
    path = os.path.join(ROOT, "public", "audio", f"{tl['id']}-score.wav")
    import soundfile as sf
    sf.write(path, out, SR, subtype="PCM_16")
    print(f"✔ {path}  {len(out) / SR:.1f}s  blackout at {B:.2f}s")

if __name__ == "__main__":
    main()
