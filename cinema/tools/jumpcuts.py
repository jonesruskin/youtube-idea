"""Jump-cut detector for a finished video. A cut is fine when the picture changes to a different scene; it is a
JUMP when the picture changes abruptly but stays the same scene (same place, same palette: a planet that shifts,
a background that restarts). Prints suspicious timestamps.  python tools/jumpcuts.py video.mp4"""
import sys, subprocess, numpy as np, cv2

W_, H_ = 192, 108


def frames(path):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={W_}:{H_}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         stdout=subprocess.PIPE)
    n = W_ * H_ * 3
    while True:
        b = p.stdout.read(n)
        if len(b) < n:
            break
        yield np.frombuffer(b, np.uint8).reshape(H_, W_, 3)


def hist(f):
    hsv = cv2.cvtColor(f, cv2.COLOR_RGB2HSV)
    h = cv2.calcHist([hsv], [0, 1, 2], None, [12, 6, 6], [0, 180, 0, 256, 0, 256])
    return cv2.normalize(h, h).flatten()


def analyse(path, fps=30.0, skip=()):
    """skip: [(t0, t1)] windows of planned transitions (dissolves, chapter fades) that are allowed to change fast."""
    fs, ds = [], []
    prev = None
    for f in frames(path):
        g = cv2.GaussianBlur(f, (0, 0), 1.0).astype(np.float32)
        if prev is not None:
            ds.append(float(np.mean(np.abs(g - prev))))
        prev = g
        fs.append(f)
    d = np.array(ds)
    jumps, cuts = [], []
    for i in range(1, len(d) - 1):
        lo, hi = max(0, i - 15), min(len(d), i + 16)
        local = np.median(np.r_[d[lo:i], d[i + 1:hi]]) if hi - lo > 2 else 0
        if d[i] > max(4.0, 5 * local + 1.5) and d[i] > 1.8 * max(d[i - 1], d[i + 1]):   # a spike, not a smooth fade
            a, b = fs[i], fs[i + 1]                     # d[i] is the change from frame i to i+1
            corr = cv2.compareHist(hist(a), hist(b), cv2.HISTCMP_CORREL)
            bright = abs(float(a.mean()) - float(b.mean()))
            t = (i + 1) / fps
            if any(t0 <= t <= t1 for t0, t1 in skip):
                continue
            # a flash (lightning, up to 0.7 s of flicker) is a brightness bump that comes back down
            ref = max(float(fs[max(0, i - 12)].mean()), float(fs[min(len(fs) - 1, i + 26)].mean()))
            if max(float(a.mean()), float(b.mean())) - ref > 0.8:
                continue
            # a change of light over the whole frame (flash decay), not a change of picture
            dm = np.abs(a.astype(np.float32) - b.astype(np.float32)).mean(2)
            bands = [dm[k:k + H_ // 6].mean() for k in range(0, H_, H_ // 6)]
            if bright > 1.5 and max(bands) < 1.7 * min(bands):
                continue
            # same palette and similar brightness, yet the picture jumped: same scene, discontinuous
            if corr > 0.90 and bright < 12:
                jumps.append((round(t, 2), round(d[i], 1), round(corr, 3)))
            else:
                cuts.append(round(t, 2))
    # consecutive flagged frames are one event (a short dissolve between two framings of the same scene)
    events = []
    for t, dd, cc in jumps:
        if events and t - events[-1][1] <= 0.12:
            events[-1][1] = t
            events[-1][2] = max(events[-1][2], dd)
        else:
            events.append([t, t, dd, cc])
    return [tuple(e) for e in events], cuts


if __name__ == "__main__":
    j, c = analyse(sys.argv[1])
    print(f"{len(c)} scene cuts, {len(j)} SAME-SCENE JUMPS")
    for a, b, dd, cc in j:
        print(f"  jump {a:7.2f}s → {b:7.2f}s  (change {dd:.1f}, palette match {cc:.3f})")


def stalls(path, fps=30.0, skip=()):
    """Motion stalls: inside a moving shot, the picture's motion nearly stops for a moment and then resumes
    (a fall that pauses mid-air, a spiral that spins, stops and spins again). Returns [(t0, t1, depth)]."""
    mags, prev = [], None
    for f in frames(path):
        g = cv2.cvtColor(f, cv2.COLOR_RGB2GRAY)
        if prev is not None:
            fl = cv2.calcOpticalFlowFarneback(prev, g, None, 0.5, 2, 9, 2, 5, 1.1, 0)
            mags.append(float(np.median(np.hypot(fl[..., 0], fl[..., 1]))))
        prev = g
    m = np.array(mags)
    out, i = [], 0
    while i < len(m):
        lo, hi = max(0, i - 45), min(len(m), i + 46)
        ref = np.median(m[lo:hi])
        if ref > 0.25 and m[i] < 0.3 * ref:
            j = i
            while j + 1 < len(m) and m[j + 1] < 0.3 * ref:
                j += 1
            before, after = m[max(0, i - 12):i], m[j + 1:j + 13]
            t0, t1 = (i + 1) / fps, (j + 1) / fps
            if 3 <= j - i + 1 <= 24 and len(before) and len(after) and before.mean() > 0.6 * ref and after.mean() > 0.6 * ref \
                    and not any(a <= t0 <= b for a, b in skip):
                out.append((round(t0, 2), round(t1, 2), round(float(m[i:j + 1].mean() / ref), 2)))
            i = j + 1
        else:
            i += 1
    return out
