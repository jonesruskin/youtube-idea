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


def analyse(path, fps=30.0):
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
        if d[i] > max(4.0, 5 * local + 1.5):
            a, b = fs[i], fs[i + 1]                     # d[i] is the change from frame i to i+1
            corr = cv2.compareHist(hist(a), hist(b), cv2.HISTCMP_CORREL)
            bright = abs(float(a.mean()) - float(b.mean()))
            t = (i + 1) / fps
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
