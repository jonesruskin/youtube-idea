"""Episode 5's own score (tools/score.py calls cue()/sfx() here first). Nothing from Ep4's chamber palette (felt piano,
celesta, river): this one is a night-sky palette synthesised here: harp arpeggios, a soft mallet (marimba/kalimba),
a warm electric piano for the chords, a breathing pad, a round bass, and one recurring motif, 'the moving star':
five notes that glide down and lift again, the way the point of light crosses the sky. Low rumble is kept small
(music gate), every cue keeps notes coming (a note onset at least every few seconds).
L = the score module's namespace (instruments, SR, rng)."""
import numpy as np


def _harp(L, f, dur, gain, bright=1.0):
    SR = L["SR"]
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for h, a in ((1, 1.0), (2, 0.5), (3, 0.28), (4, 0.14), (5, 0.08), (7, 0.03)):
        x += a * np.sin(2 * np.pi * f * h * t + h) * np.exp(-t * (0.9 + 1.4 * h / bright))
    return x * np.minimum(1.0, t / 0.004) * gain


def _mallet(L, f, dur, gain):
    SR = L["SR"]
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 3.2) + 0.25 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t * 14) + 0.08 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t * 30)
    return x * np.minimum(1.0, t / 0.002) * gain


def _epiano(L, f, dur, gain):
    SR = L["SR"]
    n = int(dur * SR)
    t = np.arange(n) / SR
    mod = np.sin(2 * np.pi * f * 1.0 * t) * 1.2 * np.exp(-t * 2.0)
    x = np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 0.8) * (1 + 0.12 * np.sin(2 * np.pi * 4.8 * t))
    return x * np.minimum(1.0, t / 0.008) * gain


def _bass(L, f, dur, gain):
    SR = L["SR"]
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 2)
    return x * np.minimum(1.0, t / 0.03) * np.exp(-t * 0.7) * gain


STAR = [("G5", 0.0), ("E5", 0.5), ("D5", 1.0), ("E5", 1.5), ("B5", 2.5)]       # the moving star: down, and up again


def _score(L, dur, prog, bpm=70, bars_per_chord=2, gain=1.0, harp=0.05, mallet=0.0, ep=0.035, pad=0.028, bass=0.038, motif=None,
           motif_gain=0.04, pattern=(0, 2, 1, 3, 2, 1, 3, 2), sparse=1, octave=2, swing=0.0):
    SR = L["SR"]
    n = int(dur * SR)
    out = np.zeros(n)
    beat = 60.0 / bpm
    bar = 4 * beat
    cl = bar * bars_per_chord
    nch = int(np.ceil(dur / cl)) + 1
    seq = [prog[i % len(prog)] for i in range(nch)]
    if pad > 0:
        out += L["pad"](seq, nch * cl, 900, gain=pad, table=L["SOFT"])[:n]

    def put(x, t0):
        i = int(t0 * SR)
        if i >= n or i < 0:
            return
        j = min(n, i + len(x))
        out[i:j] += x[: j - i]

    for c, ch in enumerate(seq):
        t0 = c * cl
        if t0 >= dur:
            break
        fs = [L["note"](nm) for nm in ch]
        tones = fs + [fs[0] * 2, fs[1] * 2]
        if ep > 0:
            for k in range(bars_per_chord):
                for f in fs:
                    put(_epiano(L, f * 2, bar + 1.0, ep), t0 + k * bar + 0.01 * fs.index(f))
        if harp > 0:
            steps = int(cl / (beat / 2))
            for k in range(steps):
                if k % sparse:
                    continue
                f = tones[pattern[k % len(pattern)] % len(tones)] * octave
                tt = t0 + k * beat / 2 + (swing * beat / 2 if k % 2 else 0)
                put(_harp(L, f, 2.4, harp * (0.8 + 0.2 * (k % 4 == 0))), tt)
        if mallet > 0:
            for k in range(int(cl / beat)):
                if (k * 5 + c) % 3 == 1:
                    put(_mallet(L, tones[(k + 2 * c) % len(tones)] * 4, 1.6, mallet), t0 + k * beat + beat / 2)
        if bass > 0:
            for k in range(int(cl / (bar / 2))):
                put(_bass(L, fs[0] / 2, bar / 2 + 0.5, bass), t0 + k * bar / 2)
        if motif and c % 2 == 0:
            for nm, st in motif:
                put(_mallet(L, L["note"](nm), 2.2, motif_gain), t0 + st * beat)
                put(_harp(L, L["note"](nm), 2.2, motif_gain * 0.5), t0 + st * beat)
    return out * L["env_adsr"](n, 1.5, 2.5) * gain


def cue(name, dur, L):
    if name == "dusk":            # the rooftop at dusk: wonder, G major, the motif from the first bar
        return _score(L, dur, [["G3", "B3", "D4"], ["E3", "G3", "B3"], ["C3", "E3", "G3"], ["D3", "F#3", "A3"]], bpm=72, harp=0.05, motif=STAR)
    if name == "archive":         # 2004: tense curiosity, a ticking mallet in D minor
        return _score(L, dur, [["D3", "F3", "A3"], ["Bb2", "D3", "F3"], ["C3", "E3", "G3"], ["A2", "C#3", "E3"]], bpm=88, bars_per_chord=1, harp=0.035,
                      mallet=0.03, ep=0.03, pattern=(0, 1, 2, 1, 0, 3, 2, 1))
    if name == "rock":            # the rock: weighty but beautiful, E minor
        return _score(L, dur, [["E3", "G3", "B3"], ["C3", "E3", "G3"], ["A2", "C3", "E3"], ["B2", "D#3", "F#3"]], bpm=64, harp=0.045, ep=0.04, bass=0.035)
    if name == "night":           # the night from the ground: open, starry, the motif returns
        return _score(L, dur, [["D3", "F#3", "A3"], ["B2", "D3", "F#3"], ["G2", "B2", "D3"], ["A2", "C#3", "E3"]], bpm=76, harp=0.05, mallet=0.02, motif=[("A5", 0), ("F#5", 0.5), ("E5", 1), ("F#5", 1.5), ("C#6", 2.5)])
    if name == "surface":         # standing on the asteroid: suspended, weightless, F lydian
        return _score(L, dur, [["F3", "A3", "C4", "E4"], ["G3", "B3", "D4"], ["F3", "A3", "C4"], ["E3", "G3", "B3"]], bpm=60, harp=0.04, mallet=0.025, ep=0.03, sparse=2,
                      pattern=(0, 3, 1, 4, 2, 4, 1, 3), octave=2)
    if name == "pull":            # Earth is the truck: driving eighths, C minor
        return _score(L, dur, [["C3", "Eb3", "G3"], ["Ab2", "C3", "Eb3"], ["Bb2", "D3", "F3"], ["G2", "B2", "D3"]], bpm=96, bars_per_chord=1, harp=0.05, ep=0.035, bass=0.038,
                      pattern=(0, 1, 2, 3, 2, 1, 2, 3))
    if name == "orbit":           # a new year: hopeful, A major, the motif transposed up
        return _score(L, dur, [["A3", "C#4", "E4"], ["F#3", "A3", "C#4"], ["D3", "F#3", "A3"], ["E3", "G#3", "B3"]], bpm=74, harp=0.05, mallet=0.02,
                      motif=[("E6", 0), ("C#6", 0.5), ("B5", 1), ("C#6", 1.5), ("G#6", 2.5)], motif_gain=0.03)
    if name == "nextup":          # the teaser: bright, a little ominous
        return _score(L, dur, [["E3", "G3", "B3"], ["C3", "E3", "G3"], ["D3", "F#3", "A3"], ["B2", "D#3", "F#3"]], bpm=70, harp=0.045, mallet=0.03)
    if name == "mirror":          # the mirror ending: the motif, slowed, then home
        return _score(L, dur, [["G3", "B3", "D4"], ["C3", "E3", "G3"], ["E3", "G3", "B3"], ["D3", "F#3", "A3"]], bpm=60, harp=0.045, ep=0.035, sparse=2, motif=STAR, motif_gain=0.035)
    return None


def sfx(kind, L):
    SR = L["SR"]
    if kind == "truck":           # a lorry passing close: engine and tyre noise rising and falling, with a Doppler drop
        n = int(3.2 * SR)
        t = np.arange(n) / SR
        env = np.exp(-((t - 1.2) / 0.55) ** 2)
        f = 95 * (1 + 0.08 * np.tanh((1.2 - t) * 3))
        eng = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + np.sin(2 * np.pi * np.cumsum(f * 2) / SR) * 0.25
        tyre = L["lowpass"](L["highpass"](L["rng"].normal(0, 1, n), 300), 2500) * 0.6
        return (eng * 0.6 + tyre) * env * 0.35
    if kind == "slide":           # gravel slipping
        n = int(3.0 * SR)
        t = np.arange(n) / SR
        x = np.zeros(n)
        for b in L["rng"].uniform(0, 2.6, 160):
            i = int(b * SR); k = int(0.02 * SR)
            x[i:i + k] += L["rng"].normal(0, 1, k)[: max(0, min(k, n - i))] * np.exp(-np.arange(min(k, n - i)) / (0.004 * SR))
        return L["highpass"](x, 800) * 0.05 * L["env_adsr"](n, 0.4, 1.2)
    return None


NO_WHOOSH = True
