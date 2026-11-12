"""Contact sheet per beat: 3 frames + the narration it must explain. Used by review and the QA gate."""
import sys, os, glob, json, importlib
import cv2, numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
ep, out = sys.argv[1], sys.argv[2]
segs = sys.argv[3].split(",")
bm = importlib.import_module(ep + ".beats")
tl = {s["id"]: s for s in json.load(open(os.path.join(ROOT, "build", ep, "voice", "timeline.json")))["segments"]}
D = os.path.join(ROOT, "build", ep, "stills")
rows = []
for sid in segs:
    for bi, b in enumerate(bm.BEATS[sid]):
        ims = [cv2.imread(f"{D}/{sid}_{bi:02d}_{k}.jpg") for k in range(3)]
        if any(i is None for i in ims):
            continue
        ims = [cv2.resize(i, (480, 270)) for i in ims]
        line = tl[sid]["lines"][b.line]["text"] if tl[sid]["lines"] else "(no narration)"
        pan = np.zeros((270, 520, 3), np.uint8) + 18
        cv2.putText(pan, f"{sid} #{bi}", (12, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 220, 255), 2)
        y = 62
        words, cur = line.split(), ""
        for w in words:
            if len(cur) + len(w) > 40:
                cv2.putText(pan, cur, (12, y), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (230, 230, 230), 1); y += 24; cur = w
            else:
                cur = (cur + " " + w).strip()
        cv2.putText(pan, cur, (12, y), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (230, 230, 230), 1)
        cv2.putText(pan, "> " + b.name[:46], (12, 250), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (120, 200, 120), 1)
        rows.append(np.hstack([pan] + ims))
cv2.imwrite(out, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 82])
print(len(rows), "beats")
