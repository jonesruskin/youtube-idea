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


def cue(name, dur, L):
    n = int(dur * L["SR"])
    if name == "riverdawn":
        return (_water(L, dur, 0.022) + _birds(L, dur) + L["pad"]([["D3", "A3", "E4"], ["C3", "G3", "D4"], ["Bb2", "F3", "D4"], ["C3", "G3", "E4"]] * max(1, int(dur // 24) + 1), dur, 900, gain=0.04, table=L["SOFT"]))
    if name == "storm":                                   # steady rain on a window, distant rumbles
        rain = L["lowpass"](L["highpass"](L["rng"].normal(0, 1, n), 900), 7000) * 0.035
        t = np.arange(n) / L["SR"]
        rum = _rumble(L, dur, 0.06, 70) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * t))
        return rain + rum + L["drone"](L["note"]("A1"), dur, 0.03)
    if name == "hush":
        return _water(L, dur, 0.012, 600, 0.4) + L["drone"](L["note"]("D2"), dur, 0.05, 0.05) + L["shimmer"](["A4", "E5"], dur, 0.006)
    if name == "tremor":
        return _rumble(L, dur, 0.10, 55) + L["drone"](L["note"]("D1"), dur, 0.09) + _water(L, dur, 0.01, 500, 0.3)
    if name == "glassrain":
        return _pings(L, dur, 6.0, 0.012) + L["pad"]([["E3", "B3", "F#4"], ["D3", "A3", "E4"]] * max(1, int(dur // 16) + 1), dur, 1400, gain=0.035, table=L["SOFT"]) + L["highpass"](L["rng"].normal(0, 1, n), 4000) * 0.0025
    if name == "surge":
        x = L["lowpass"](L["highpass"](L["rng"].normal(0, 1, n), 120), 1600) * 0.05 * L["env_adsr"](n, 3.0, 2.0)
        return x + L["drone"](L["note"]("C1"), dur, 0.12) + L["pad"]([["C2", "G2", "Db3"]], dur, 500, gain=0.04)
    if name == "silence":
        return np.zeros(n)
    if name == "ash":
        out = L["drone"](L["note"]("A1"), dur, 0.07, 0.05) + _water(L, dur, 0.006, 400, 0.1)
        for i, b in enumerate(np.arange(1.0, dur - 2, 4.5)):
            p = L["pluck"](L["note"](["A3", "E3", "C4", "G3"][i % 4]), 3.0, 0.05, 1200)
            j = int(b * L["SR"])
            out[j:j + len(p)] += p[: max(0, n - j)]
        return out
    if name == "evidence":
        out = L["pad"]([["F2", "C3", "A3"], ["D2", "A2", "F3"], ["Bb1", "F2", "D3"], ["C2", "G2", "E3"]] * max(1, int(dur // 24) + 1), dur, 1200, gain=0.045, table=L["SOFT"])
        motif = ["A4", "C5", "E5", "D5", "C5", "A4", "G4", "E4"]
        for i, b in enumerate(np.arange(2.0, dur - 2, 0.75)):
            if i % 16 < 8:
                p = L["pluck"](L["note"](motif[i % 8]), 1.0, 0.03, 2600)
                j = int(b * L["SR"])
                out[j:j + len(p)] += p[: max(0, n - j)]
        return out
    if name == "nextup":
        return L["drone"](L["note"]("E2"), dur, 0.06) + L["shimmer"](["B4", "E5", "G#5"], dur, 0.01) + _pings(L, dur, 1.0, 0.008, 1500, 3000)
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
