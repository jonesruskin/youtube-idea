"""MUSIC GATE (founder, Ep4 v2: "most of the time it is just plain sound that is unsettling and uncomfortable ... we also
have to incorporate other background music which can make the whole video pleasant to hear").

Measured on build/<ep>/music_stem.wav (the score bed before narration ducking), in 2 s windows:
  tonal        the bed must be music, not noise or a bare drone: spectral flatness (60 Hz - 5 kHz) low and a clear
               pitch-class (chroma) peak, in at least 85 % of windows
  notes        something musical happens: a note onset (spectral flux peak) at least every 6 s, over >= 90 % of the run
  no-drone     low rumble (< 110 Hz) carries no more than 45 % of the bed's energy in any 10 s stretch, median <= 30 %
  silence      no stretch longer than 4 s where the bed is silent (true silence on a narration film feels broken)
"""
import os, sys, json
import numpy as np, soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def analyse(path):
    x, sr = sf.read(path)
    if x.ndim > 1:
        x = x.mean(1)
    win = int(2.0 * sr)
    hop = win
    f = np.fft.rfftfreq(win, 1 / sr)
    band = (f > 60) & (f < 5000)
    lo = f < 110
    pcs = (np.round(12 * np.log2(np.maximum(f, 1) / 440.0)) % 12).astype(int)
    flat, chroma_pk, lowshare, rms = [], [], [], []
    for i in range(0, len(x) - win, hop):
        seg = x[i:i + win] * np.hanning(win)
        P = np.abs(np.fft.rfft(seg)) ** 2 + 1e-12
        pb = P[band]
        flat.append(float(np.exp(np.mean(np.log(pb))) / np.mean(pb)))
        ch = np.bincount(pcs[band], weights=pb, minlength=12)
        chroma_pk.append(float(ch.max() / (ch.mean() + 1e-12)))
        lowshare.append(float(P[lo & (f > 20)].sum() / P[(f > 20) & (f < 8000)].sum()))
        rms.append(float(np.sqrt(np.mean(x[i:i + win] ** 2))))
    # onsets: spectral flux on 46 ms frames
    n = 2048
    fr = np.lib.stride_tricks.sliding_window_view(x, n)[::n // 2]
    S = np.abs(np.fft.rfft(fr * np.hanning(n), axis=1))
    flux = np.maximum(np.diff(np.log1p(S * 50), axis=0), 0).sum(1)
    from scipy.ndimage import median_filter
    mad = np.median(np.abs(flux - np.median(flux))) + 1e-9
    thr = median_filter(flux, 43) + 4.0 * mad               # local baseline: a soft note counts, birdsong can't mask it
    t_on = np.where((flux[1:-1] > thr[1:-1]) & (flux[1:-1] >= flux[:-2]) & (flux[1:-1] >= flux[2:]))[0] * (n / 2) / sr
    return dict(flat=np.array(flat), chroma=np.array(chroma_pk), low=np.array(lowshare), rms=np.array(rms), onsets=t_on, dur=len(x) / sr)


def gate(ep, res):
    p = os.path.join(ROOT, "build", ep, "music_stem.wav")
    if not os.path.exists(p):
        res("FAIL", "music", "no music_stem.wav: run tools/score.py")
        return
    a = analyse(p)
    loud = a["rms"] > 0.02 * a["rms"].max()
    tonal = (a["flat"] < 0.12) & (a["chroma"] > 2.2)
    tshare = float(tonal[loud].mean()) if loud.any() else 0.0
    on = np.concatenate([[0.0], a["onsets"], [a["dur"]]])
    gaps = np.diff(on)
    covered = 1.0 - float(gaps[gaps > 6.0].sum() - 6.0 * (gaps > 6.0).sum()) / a["dur"]
    k = 5
    low10 = np.convolve(a["low"], np.ones(k) / k, "valid")
    sil, run, worst = (~loud), 0, 0
    for s_ in sil:
        run = run + 2 if s_ else 0
        worst = max(worst, run)
    ok = tshare >= 0.85 and covered >= 0.90 and low10.max() <= 0.45 and np.median(a["low"]) <= 0.30 and worst <= 4
    res("PASS" if ok else "FAIL", "music",
        f"tonal {tshare:.0%} of the bed (need 85 %); a note at least every 6 s over {covered:.0%} (need 90 %); "
        f"low rumble median {np.median(a['low']):.0%} / worst 10 s {low10.max():.0%} (max 30 % / 45 %); longest silent bed {worst} s (max 4)")


if __name__ == "__main__":
    out = []
    gate(sys.argv[1], lambda *r: out.append(r))
    print(out)
