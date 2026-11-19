"""Episode 4's own sound bed (tools/score.py calls cue()/sfx() here first). Nothing from the earlier cue library:
river water and birds at dawn, a sub-rumble for the quake, glass ticking on water, rushing floodwater, true
silence, then the distant boom that arrives last. L = the score module's namespace (instruments, SR, rng)."""
import numpy as np


def _water(L, dur, gain=0.03, bright=900, burble=1.0):
    n = int(dur * L["SR"])
    nz = L["rng"].normal(0, 1, n)
    base = L["lowpass"](L["highpass"](nz, 200), bright)
    t = np.arange(n) / L["SR"]
    mod = 0.6 + 0.4 * np.sin(2 * np.pi * 0.13 * t) * np.sin(2 * np.pi * 0.31 * t + 1)
    out = base * mod * gain
    k = int(0.04 * L["SR"])
    tk = np.arange(k) / L["SR"]
    for b in L["rng"].uniform(0, dur, int(dur * 3 * burble)):       # small burbles
        i = int(b * L["SR"])
        f = L["rng"].uniform(500, 1400)
        g = np.sin(2 * np.pi * (f + 2000 * tk) * tk) * np.exp(-tk * 90) * gain * 0.8
        out[i:i + k] += g[: max(0, min(k, n - i))]
    return out


def _birds(L, dur, gain=0.012, rate=0.25):
    n = int(dur * L["SR"])
    out = np.zeros(n)
    for b in L["rng"].uniform(0, dur, int(dur * rate)):
        f0 = L["rng"].uniform(2400, 4200)
        for j in range(int(L["rng"].integers(2, 5))):
            k = int(0.09 * L["SR"])
            tk = np.arange(k) / L["SR"]
            sweep = f0 * (1 + 0.25 * np.sin(np.pi * tk / 0.09)) * (1 - 0.1 * j)
            g = np.sin(2 * np.pi * np.cumsum(sweep) / L["SR"]) * np.sin(np.pi * tk / 0.09) ** 2 * gain
            i = int((b + j * 0.13) * L["SR"])
            out[i:i + k] += g[: max(0, min(k, n - i))]
    return out


def _pings(L, dur, rate=8.0, gain=0.02, lo=3000, hi=7000):
    n = int(dur * L["SR"])
    out = np.zeros(n)
    k = int(0.25 * L["SR"])
    tk = np.arange(k) / L["SR"]
    for b in L["rng"].uniform(0, dur, int(dur * rate)):
        f = L["rng"].uniform(lo, hi)
        g = (np.sin(2 * np.pi * f * tk) + 0.4 * np.sin(2 * np.pi * f * 2.76 * tk)) * np.exp(-tk * L["rng"].uniform(25, 60)) * gain * L["rng"].uniform(0.3, 1)
        i = int(b * L["SR"])
        out[i:i + k] += g[: max(0, min(k, n - i))]
    return out


def _rumble(L, dur, gain=0.3, fc=70):
    n = int(dur * L["SR"])
    t = np.arange(n) / L["SR"]
    nz = L["lowpass"](L["rng"].normal(0, 1, n), fc, 4)
    return nz / (np.abs(nz).max() + 1e-9) * gain * L["env_adsr"](n, min(0.5, dur / 4), min(1.5, dur / 3))


# ───────────── the score (founder, Ep4 v2: pleasant music under everything, not bare drones and noise) ─────────────
# A small chamber palette synthesised here: felt piano (arpeggios + a motif), warm strings (pad), a soft upright bass,
# and a celesta for the glass. One recurring motif (the 'count': four rising notes) ties the whole film together.
def _piano(L, f, dur, gain, bright=1.0):
    SR = L["SR"]
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for h, a in ((1, 1.0), (2, 0.42), (3, 0.2), (4, 0.11), (5, 0.06), (6, 0.03)):
        x += a * np.sin(2 * np.pi * f * h * (1 + 0.0004 * h * h) * t) * np.exp(-t * (1.1 + 0.9 * h / bright))
    att = np.minimum(1.0, t / 0.006)
    return x * att * gain


def _celesta(L, f, dur, gain):
    SR = L["SR"]
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 2.2) + 0.35 * np.sin(2 * np.pi * f * 4.0 * t) * np.exp(-t * 6)
    return x * np.minimum(1.0, t / 0.003) * gain


def _bass(L, f, dur, gain):
    SR = L["SR"]
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3)
    return x * np.minimum(1.0, t / 0.02) * np.exp(-t * 0.9) * gain


def _music(L, dur, prog, bpm=66, bars_per_chord=2, gain=1.0, arp=0.05, bass=0.06, strings=0.03, motif=None, motif_gain=0.04,
           celesta=0.0, pattern=(0, 1, 2, 1, 3, 2, 1, 2), sparse=1, bright=1.0):
    """prog: list of chords as note names (root first). 4/4 at bpm; eighth-note arpeggio, a bass note per half bar,
    a strings pad, and a motif every 4 bars."""
    SR = L["SR"]
    n = int(dur * SR)
    out = np.zeros(n)
    beat = 60.0 / bpm
    bar = 4 * beat
    chord_len = bar * bars_per_chord
    nchords = int(np.ceil(dur / chord_len)) + 1
    seq = [prog[i % len(prog)] for i in range(nchords)]
    if strings > 0:
        out += L["pad"](seq, nchords * chord_len, 1100 * bright, gain=strings, table=L["SOFT"])[:n] if True else 0
    def put(x, t0):
        i = int(t0 * SR)
        if i >= n:
            return
        j = min(n, i + len(x))
        out[i:j] += x[: j - i]
    for c, ch in enumerate(seq):
        t0 = c * chord_len
        if t0 >= dur:
            break
        fs = [L["note"](nm) for nm in ch]
        tones = fs + [fs[0] * 2]
        if arp > 0:
            steps = int(chord_len / (beat / 2))
            for k in range(steps):
                if k % sparse:
                    continue
                f = tones[pattern[k % len(pattern)] % len(tones)] * 2
                vel = 0.75 + 0.25 * (k % 4 == 0)
                put(_piano(L, f, 2.5, arp * vel, bright), t0 + k * beat / 2)
        if bass > 0:
            for k in range(int(chord_len / (bar / 2))):
                put(_bass(L, fs[0] / 2, bar / 2 + 0.6, bass), t0 + k * bar / 2)
        if celesta > 0:
            for k in range(int(chord_len / beat)):
                if (k * 7 + c) % 3 == 0:
                    put(_celesta(L, tones[(k + c) % len(tones)] * 4, 2.0, celesta), t0 + k * beat + beat / 2)
        if motif and c % 2 == 0:
            for k, (nm, step) in enumerate(motif):
                put(_piano(L, L["note"](nm), 3.0, motif_gain, bright * 1.2), t0 + step * beat)
    env = L["env_adsr"](n, 2.0, 3.0)
    return out * env * gain


COUNT = [("D5", 0), ("E5", 1), ("F#5", 2), ("A5", 3)]            # the counting motif: four rising notes
COUNT_MIN = [("D5", 0), ("E5", 1), ("F5", 2), ("A5", 3)]


def cue(name, dur, L):
    n = int(dur * L["SR"])
    if name == "storm":                                   # rain on the window, under a gentle piano in A minor
        rain = L["lowpass"](L["highpass"](L["rng"].normal(0, 1, n), 900), 6000) * 0.012
        return rain + _rumble(L, dur, 0.02, 60) + _music(L, dur, [["A3", "C4", "E4"], ["F3", "A3", "C4"], ["C4", "E4", "G4"], ["G3", "B3", "D4"]],
                                                       bpm=64, arp=0.045, bass=0.05, strings=0.025, motif=COUNT_MIN, sparse=2)
    if name == "riverdawn":                               # the river's theme: D major, warm and moving
        return (_water(L, dur, 0.008) + _birds(L, dur, 0.008)
                + _music(L, dur, [["D3", "F#3", "A3"], ["A2", "C#3", "E3"], ["B2", "D3", "F#3"], ["G2", "B2", "D3"]],
                         bpm=72, arp=0.05, bass=0.055, strings=0.03, motif=COUNT, motif_gain=0.035))
    if name == "hush":                                    # the flash nobody sees: suspended, glassy
        return _water(L, dur, 0.005, 600, 0.3) + _music(L, dur, [["D3", "A3", "E4"], ["B2", "F#3", "C#4"], ["G2", "D3", "A3"], ["A2", "E3", "B3"]],
                                                          bpm=60, arp=0.04, bass=0.04, strings=0.035, celesta=0.012, sparse=2)
    if name == "tremor":                                  # the waves: D minor, a pulse that walks, low rumble kept small
        return _rumble(L, dur, 0.03, 55) + _music(L, dur, [["D3", "F3", "A3"], ["Bb2", "D3", "F3"], ["G2", "Bb2", "D3"], ["A2", "C#3", "E3"]],
                                                       bpm=84, bars_per_chord=1, arp=0.05, bass=0.07, strings=0.03, pattern=(0, 2, 1, 2, 0, 2, 1, 3))
    if name == "glassrain":                               # glass falling like rain: bright, celesta over piano
        return _pings(L, dur, 3.0, 0.005) + _music(L, dur, [["E3", "G#3", "B3"], ["C#3", "E3", "G#3"], ["A2", "C#3", "E3"], ["B2", "D#3", "F#3"]],
                                                         bpm=76, arp=0.045, bass=0.05, strings=0.03, celesta=0.02, motif=[("E5", 0), ("F#5", 1), ("G#5", 2), ("B5", 3)])
    if name == "surge":                                   # the flood: C minor, driving eighths, strings swell
        x = L["lowpass"](L["highpass"](L["rng"].normal(0, 1, n), 120), 1400) * 0.012 * L["env_adsr"](n, 3.0, 2.0)
        return x + _music(L, dur, [["C3", "Eb3", "G3"], ["Ab2", "C3", "Eb3"], ["Eb3", "G3", "Bb3"], ["Bb2", "D3", "F3"]],
                          bpm=92, bars_per_chord=1, arp=0.055, bass=0.075, strings=0.045, pattern=(0, 1, 2, 3, 2, 1, 2, 1))
    if name == "silence":                                 # after the flood: very quiet, sparse piano and a held string
        return _music(L, dur, [["A2", "E3", "C4"], ["F2", "C3", "A3"], ["C3", "G3", "E4"], ["G2", "D3", "B3"]],
                      bpm=54, arp=0.03, bass=0.025, strings=0.025, sparse=3, motif=COUNT_MIN, motif_gain=0.025)
    if name == "ash":                                     # loss: slow, tender
        return _water(L, dur, 0.004, 400, 0.1) + _music(L, dur, [["A3", "C4", "E4"], ["E3", "G3", "B3"], ["F3", "A3", "C4"], ["C4", "E4", "G4"]],
                                                          bpm=58, arp=0.04, bass=0.03, strings=0.035, sparse=2)
    if name == "evidence":                                # the dig: curious, warm, the count motif returns
        return _music(L, dur, [["F3", "A3", "C4"], ["D3", "F3", "A3"], ["Bb2", "D3", "F3"], ["C3", "E3", "G3"]],
                      bpm=80, arp=0.05, bass=0.055, strings=0.03, motif=[("C5", 0), ("D5", 1), ("E5", 2), ("G5", 3)], celesta=0.008)
    if name == "nextup":                                  # the teaser: open, starry
        return _music(L, dur, [["E3", "G3", "B3"], ["C3", "E3", "G3"], ["G2", "B2", "D3"], ["D3", "F#3", "A3"]],
                      bpm=70, arp=0.045, bass=0.045, strings=0.035, celesta=0.016)
    return None


def sfx(kind, L):
    SR = L["SR"]
    if kind == "tick":
        return _pings(L, 0.6, 3.0, 0.05)
    if kind == "jolt":
        n = int(2.5 * SR); t = np.arange(n) / SR
        return np.sin(2 * np.pi * (40 + 40 * np.exp(-t * 8)) * t) * np.exp(-t * 3) * 0.45 + _rumble(L, 2.5, 0.12, 90)
    if kind == "quake":
        return _rumble(L, 6.0, 0.35, 60)
    if kind == "roll":
        n = int(8.0 * SR); t = np.arange(n) / SR
        return _rumble(L, 8.0, 0.3, 45) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.6 * t))
    if kind == "ticks":
        return _pings(L, 4.0, 40.0, 0.03)
    if kind == "surge":
        n = int(9.0 * SR)
        x = L["lowpass"](L["rng"].normal(0, 1, n), 2500) * L["env_adsr"](n, 1.2, 4.0)
        return x * 0.22 + _rumble(L, 9.0, 0.3, 80)
    if kind == "thunder":                                 # crack, then the long roll
        n = int(6.0 * SR); t = np.arange(n) / SR
        crack = L["highpass"](L["rng"].normal(0, 1, n), 1500) * np.exp(-t * 18) * 0.5
        roll = L["lowpass"](L["rng"].normal(0, 1, n), 180, 4) * (np.exp(-t * 0.8) * (1 + 0.6 * np.sin(2 * np.pi * 1.3 * t))) * 3
        x = crack + roll
        return x / (np.abs(x).max() + 1e-9) * 0.8
    if kind == "flash":                                   # a bright swelling hit for the impact
        n = int(4.0 * SR); t = np.arange(n) / SR
        x = L["lowpass"](L["rng"].normal(0, 1, n), 3000) * np.exp(-t * 2.5) * 0.4 + np.sin(2 * np.pi * 55 * t) * np.exp(-t * 1.5) * 0.4
        return x
    if kind == "farboom":
        n = int(9.0 * SR); t = np.arange(n) / SR
        b = np.sin(2 * np.pi * (28 + 30 * np.exp(-t * 2)) * t) * np.exp(-t * 0.7)
        nz = L["lowpass"](L["rng"].normal(0, 1, n), 140, 4) * np.exp(-t * 0.6) * 3
        roll = L["lowpass"](L["rng"].normal(0, 1, n), 60, 4) * (np.exp(-((t - 2.5) / 1.5) ** 2)) * 4
        x = (b + nz + roll)
        return x / (np.abs(x).max() + 1e-9) * 0.85
    return None
NO_WHOOSH = True     # this episode cuts on silence and ambience, not swooshes
