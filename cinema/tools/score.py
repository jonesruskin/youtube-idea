"""Original score + sound design, synthesised from the script's music cues, mixed under the narration.
Output: build/<ep>/mix.wav (48 kHz stereo). Everything here is generated, so it is original by construction."""
import os, sys, json, importlib.util
import numpy as np
import soundfile as sf
from scipy.signal import lfilter, fftconvolve, butter, sosfilt, resample_poly

ep = sys.argv[1] if len(sys.argv) > 1 else "ep_blackhole"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("script", os.path.join(ROOT, ep, "script.py"))
mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
tl = json.load(open(os.path.join(ROOT, "build", ep, "voice", "timeline.json")))
SR = 48000
TOTAL = tl["total"] + 1.0
N = int(TOTAL * SR)
rng = np.random.default_rng(1)

# ───────────── instruments ─────────────
TAB = 4096
_ph = np.arange(TAB) / TAB
SAW = sum(np.sin(2 * np.pi * k * _ph) / k for k in range(1, 14)) * 0.6
SOFT = sum(np.sin(2 * np.pi * k * _ph) / (k * k) for k in range(1, 8))
SINE = np.sin(2 * np.pi * _ph)


def osc(freq, n, table=SAW, phase0=0.0):
    f = np.broadcast_to(np.asarray(freq, np.float64), (n,))
    ph = (np.cumsum(f) / SR + phase0) % 1.0
    return table[(ph * TAB).astype(np.int64) % TAB]


def lowpass(x, fc, order=2):
    sos = butter(order, min(fc, SR / 2 - 100) / (SR / 2), "low", output="sos")
    return sosfilt(sos, x)


def highpass(x, fc, order=2):
    sos = butter(order, fc / (SR / 2), "high", output="sos")
    return sosfilt(sos, x)


def env_adsr(n, a, r, sustain=1.0):
    e = np.ones(n) * sustain
    na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, sustain, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e


def note(name):
    names = {"C": -9, "C#": -8, "D": -7, "Eb": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "Ab": -1, "G#": -1, "A": 0, "Bb": 1, "A#": 1, "B": 2, "Db": -8, "D#": -6}
    n, o = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((names[n] + (o - 4) * 12) / 12)


def pad(chords, dur, bright=900, detune=0.004, gain=0.08, table=SAW):
    """Chord sequence spread evenly over dur; three detuned voices per note, slow filter breathing."""
    n = int(dur * SR)
    out = np.zeros(n)
    per = n // len(chords)
    for i, ch in enumerate(chords):
        seg = np.zeros(per + int(1.5 * SR))
        m = len(seg)
        for nm in ch:
            f = note(nm)
            for d in (-detune, 0, detune):
                seg += osc(f * (1 + d), m, table, rng.random())
        seg *= env_adsr(m, 1.6, 1.8)
        a = i * per
        b = min(n, a + m)
        out[a:b] += seg[: b - a]
    t = np.arange(n) / SR
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * t / 9.0)
    out = lowpass(out, bright) * 0.6 + lowpass(out, bright * 2.2) * 0.4 * lfo
    return out * gain


def drone(freq, dur, gain=0.1, wobble=0.15):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = osc(freq, n, SOFT) + 0.6 * osc(freq * 0.5, n, SINE) + 0.25 * osc(freq * 1.5 * (1 + 0.002 * np.sin(t * 0.7)), n, SOFT)
    x *= 1 + wobble * np.sin(2 * np.pi * t / 6.5)
    return lowpass(x, 400) * gain * env_adsr(n, 2.5, 2.5)


def shimmer(freqs, dur, gain=0.02):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sum(osc(note(f), n, SINE) * (0.5 + 0.5 * np.sin(2 * np.pi * t * (0.13 + 0.07 * i) + i)) for i, f in enumerate(freqs))
    return x * gain * env_adsr(n, 3, 3)


def pluck(freq, dur=1.2, gain=0.1, bright=3000):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = osc(freq, n, SAW) * np.exp(-t * 5) + osc(freq * 2, n, SINE) * np.exp(-t * 9) * 0.3
    return lowpass(x, bright) * gain


def bell(freq, dur=3.0, gain=0.08):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * freq * r * t) * np.exp(-t * d) * a for r, d, a in ((1, 1.2, 1), (2.76, 2.5, 0.4), (5.4, 4, 0.2), (8.93, 6, 0.1)))
    return x * gain


def boom(dur=4.0, gain=0.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 30 + 70 * np.exp(-t * 3)
    x = osc(f, n, SINE) * np.exp(-t * 1.1)
    nz = lowpass(rng.normal(0, 1, n), 300) * np.exp(-t * 4) * 0.5
    return (x + nz) * gain


def riser(dur=2.5, gain=0.12):
    n = int(dur * SR)
    t = np.arange(n) / SR
    k = (t / dur) ** 2
    nz = rng.normal(0, 1, n)
    out = np.zeros(n)
    chunk = SR // 20
    for i in range(0, n, chunk):
        fc = 300 + 5000 * k[i]
        out[i:i + chunk] = lowpass(nz[i:i + chunk + 400], fc)[: len(out[i:i + chunk])]
    tone = osc(200 + 600 * k, n, SINE) * 0.3
    return (out * 0.6 + tone) * k * gain


def whoosh(dur=0.9, gain=0.05):
    n = int(dur * SR)
    t = np.arange(n) / SR
    e = np.sin(np.pi * t / dur) ** 2
    return lowpass(rng.normal(0, 1, n), 1200) * e * gain


def heartbeat(dur, bpm=62, gain=0.35):
    n = int(dur * SR)
    out = np.zeros(n)
    beat = 60 / bpm
    k = int(0.35 * SR)
    t = np.arange(k) / SR
    th = osc(55 * (1 + np.exp(-t * 30)), k, SINE) * np.exp(-t * 14)
    for b in np.arange(0, dur, beat):
        for off, g in ((0, 1.0), (0.24, 0.7)):
            i = int((b + off) * SR)
            if i + k < n:
                out[i:i + k] += th * g
    return out * gain * env_adsr(n, 2.0, 2.0)


def ostinato(root, dur, bpm=96, gain=0.05):
    n = int(dur * SR)
    out = np.zeros(n)
    step = 60 / bpm / 2
    pattern = [0, 0, 7, 0, 3, 0, 7, 10]
    for i, b in enumerate(np.arange(0, dur - 1.2, step)):
        f = note(root) * 2 ** (pattern[i % 8] / 12)
        p = pluck(f, 0.5, 1.0, 1800 + 1200 * (b / dur))
        j = int(b * SR)
        out[j:j + len(p)] += p[: n - j]
    return out * gain * env_adsr(n, 1.0, 1.5)


# ───────────── cue library ─────────────
def cue(name, dur):
    if name == "open":
        return drone(note("A1"), dur, 0.12) + shimmer(["E5", "A5", "B5"], dur, 0.012)
    if name == "reveal":
        return drone(note("F1"), dur, 0.14) + pad([["F2", "C3", "Ab3"]], dur, 500, gain=0.05) + shimmer(["C6", "Eb6"], dur, 0.01)
    if name == "title":
        return pad([["D2", "A2", "F3", "C4"]], dur + 2, 700, gain=0.06)[: int(dur * SR)]
    if name == "wonder":
        return pad([["A2", "E3", "C4"], ["F2", "C3", "A3"], ["C3", "G3", "E4"], ["G2", "D3", "B3"]] * max(1, int(dur // 24) + 1), dur, 1100, gain=0.055) + shimmer(["E5", "G5", "C6"], dur, 0.008)
    if name in ("dread", "quiet"):
        g = 0.05 if name == "quiet" else 0.06
        return pad([["D2", "A2", "F3"], ["Bb1", "F2", "D3"], ["G1", "D2", "Bb2"], ["A1", "E2", "C#3"]] * max(1, int(dur // 30) + 1), dur, 600, gain=g) + drone(note("D1"), dur, 0.08)
    if name == "tension":
        return ostinato("E2", dur, 92, 0.045) + drone(note("E1"), dur, 0.1) + pad([["E2", "B2", "G3"], ["C2", "G2", "E3"]] * 4, dur, 700, gain=0.035)
    if name == "pulse":
        return heartbeat(dur, 60, 0.32) + drone(note("C#1"), dur, 0.11) + shimmer(["G#5", "D6"], dur, 0.008)
    if name == "impact":
        return drone(note("C1"), dur, 0.14) + pad([["C2", "G2", "Eb3", "Bb3"]], dur, 500, gain=0.06)
    if name == "fall":
        n = int(dur * SR)
        t = np.arange(n) / SR
        cl = sum(osc(note(f) * (1 + 0.02 * t / dur), n, SAW) for f in ("C3", "C#3", "F#3", "G3"))
        return lowpass(cl, 500 + 1500 * (t[-1] / dur)) * 0.025 * env_adsr(n, 3, 2) + drone(note("C1"), dur, 0.1) + highpass(rng.normal(0, 1, n), 2000) * 0.004 * env_adsr(n, 4, 3)
    if name == "ache":
        return pad([["D3", "F3", "A3"], ["Bb2", "D3", "F3"], ["F2", "A2", "C3"], ["C3", "E3", "G3"]] * max(1, int(dur // 24) + 1), dur, 900, gain=0.06, table=SOFT)
    if name == "drift":
        return shimmer(["B4", "F#5", "C#6", "G#6"], dur, 0.014) + drone(note("B0"), dur, 0.08, 0.05)
    if name == "hope":
        return pad([["C3", "G3", "E4"], ["G2", "D3", "B3"], ["A2", "E3", "C4"], ["F2", "C3", "A3"]] * max(1, int(dur // 22) + 1), dur, 1500, gain=0.065, table=SOFT) + shimmer(["E5", "G5"], dur, 0.01)
    if name == "resolve":
        return pad([["F2", "C3", "A3"], ["C3", "G3", "E4"], ["D3", "A3", "F4"], ["Bb2", "F3", "D4"]] * max(1, int(dur // 24) + 1), dur, 1200, gain=0.055, table=SOFT)
    if name == "last":
        return drone(note("A1"), dur, 0.09) + shimmer(["E5", "A5"], dur, 0.01)
    return np.zeros(int(dur * SR))


# ───────────── arrange ─────────────
segs = {s["id"]: s for s in tl["segments"]}
music = np.zeros(N)
sfx = np.zeros(N)
regions = []
cur = None
for seg in mod.SEGMENTS:
    t = segs[seg["id"]]
    if seg.get("music"):
        if cur: cur[2] = t["start"]
        cur = [seg["music"], t["start"], None]
        regions.append(cur)
cur[2] = TOTAL
for name, a, b in regions:
    a0 = max(0, a - 1.0)
    dur = b - a0 + 2.0
    x = cue(name, dur)
    x *= env_adsr(len(x), 1.2, 2.0)
    i = int(a0 * SR)
    j = min(N, i + len(x))
    music[i:j] += x[: j - i]


def place(buf, x, t):
    i = int(t * SR)
    if i < 0:
        x = x[-i:]; i = 0
    j = min(N, i + len(x))
    buf[i:j] += x[: j - i]


prev_type = None
for k, seg in enumerate(mod.SEGMENTS):
    t = segs[seg["id"]]
    c = seg.get("card") or {}
    if c.get("kind") in ("chapter", "fate"):
        place(sfx, riser(2.2, 0.08), t["start"] - 2.2)
        place(sfx, boom(4.5, 0.5), t["start"] + 0.05)
    if c.get("kind") == "title":
        place(sfx, boom(6.0, 0.7), t["start"] + 0.2)
        place(sfx, bell(note("A4"), 5, 0.05), t["start"] + 0.4)
    if seg["id"] in ("open3",):
        place(sfx, boom(5.0, 0.55), t["start"] + 0.1)
    if seg["id"] == "c4d":
        place(sfx, riser(3.0, 0.1), t["start"] + t["dur"] * 0.25)
        place(sfx, boom(6.0, 0.6), t["start"] + t["dur"] * 0.25 + 3.0)
    if c.get("kind") == "stat":
        place(sfx, bell(note("E5"), 2.5, 0.035), t["start"] + c.get("at", 0) * t["dur"] + 0.2)
    st = seg["shot"]["type"]
    if k and st != prev_type and not c.get("kind") in ("chapter", "fate", "title"):
        place(sfx, whoosh(0.9, 0.035), t["start"] - 0.6)
    prev_type = st
    for fl in seg["shot"].get("flare", []):
        m = (fl["t0"] + fl["t1"]) / 2
        if 0 <= m <= 1:
            place(sfx, bell(note("B5"), 3.5, 0.03), t["start"] + m * t["dur"] - 0.3)

# narration track
voice = np.zeros(N)
for seg in mod.SEGMENTS:
    t = segs[seg["id"]]
    a, sr = sf.read(os.path.join(ROOT, "build", ep, "voice", seg["id"] + ".wav"))
    a = resample_poly(a, SR, sr)
    place(voice, a, t["start"])
# light voice polish: high-pass rumble, gentle presence
voice = highpass(voice, 70)
voice = voice + 0.15 * highpass(voice, 3000)

# reverb on music + sfx
def reverb(x, secs=3.2, mix=0.35):
    n = int(secs * SR)
    t = np.arange(n) / SR
    ir_l = rng.normal(0, 1, n) * np.exp(-t * 6.9 / secs)
    ir_r = rng.normal(0, 1, n) * np.exp(-t * 6.9 / secs)
    ir_l, ir_r = lowpass(ir_l, 5000), lowpass(ir_r, 5000)
    ir_l /= np.sqrt(np.sum(ir_l ** 2)); ir_r /= np.sqrt(np.sum(ir_r ** 2))
    wl = fftconvolve(x, ir_l)[: len(x)]
    wr = fftconvolve(x, ir_r)[: len(x)]
    return np.stack([x * (1 - mix) + wl * mix, x * (1 - mix) + wr * mix], -1)


bus = reverb(music + sfx * 0.8, 3.4, 0.4)
# sidechain duck under narration
envv = np.abs(voice)
win = int(0.25 * SR)
cs = np.cumsum(np.concatenate([np.zeros(win // 2), envv, np.zeros(win - win // 2)]))
envv = (cs[win:] - cs[:-win])[: len(voice)] / win
envv = np.clip(envv / (np.percentile(envv[envv > 1e-4], 90) + 1e-9), 0, 1)
duck = 1 - 0.6 * envv
duck = lfilter([0.002], [1, -0.998], duck) / 1.0
bus *= duck[:, None]
vs = np.stack([voice, voice], -1)
mix = vs * 1.0 + bus * 0.36
mix /= np.max(np.abs(mix)) * 1.05
sf.write(os.path.join(ROOT, "build", ep, "mix.wav"), mix.astype(np.float32), SR, subtype="PCM_24")
print("mix.wav", mix.shape[0] / SR, "s")
