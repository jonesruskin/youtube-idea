import sys, os, glob, cv2, numpy as np
d, out = sys.argv[1], sys.argv[2]
ids = sys.argv[3].split(",")
rows = []
for i in ids:
    ims = [cv2.resize(cv2.imread(f"{d}/{i}_{k}.jpg"), (640, 360)) for k in range(3)]
    row = np.hstack(ims); cv2.putText(row, i, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 255), 2)
    rows.append(row)
cv2.imwrite(out, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 85])
