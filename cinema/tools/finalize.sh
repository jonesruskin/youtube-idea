#!/usr/bin/env bash
# Mux picture + mix at YouTube's -14 LUFS, then write the episode's deliverables.
#   build/<ep>/final.mp4     master (not in the repo)
#   renders/<NN_name>/       upload.mp4 (the YouTube master: 1080p, CRF 20, AAC 320k, stored with Git LFS)
#                            + preview.mp4 (two-pass, < 95 MB, plain git) + thumbnail.png + captions.srt + metadata.md
set -euo pipefail
EP=${1:-ep_blackhole}
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
D="$ROOT/build/$EP"
FOLDER=$(cd "$ROOT" && python3 -c "import importlib.util as u;s=u.spec_from_file_location('s','$EP/script.py');m=u.module_from_spec(s);s.loader.exec_module(m);print(m.FOLDER)")
OUT="$(cd "$ROOT/.." && pwd)/renders/$FOLDER"
mkdir -p "$OUT"
ffmpeg -v error -y -i "$D/picture.mp4" -i "$D/mix.wav" -map 0:v -map 1:a -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$D/final.mp4"
ffmpeg -v error -y -i "$D/final.mp4" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -c:a copy -movflags +faststart "$D/upload.mp4"
P="$D/pass"
ffmpeg -v error -y -i "$D/final.mp4" -c:v libx264 -preset slow -b:v 1350k -maxrate 2600k -bufsize 5200k -pass 1 -passlogfile "$P" -an -f mp4 /dev/null
ffmpeg -v error -y -i "$D/final.mp4" -c:v libx264 -preset slow -b:v 1350k -maxrate 2600k -bufsize 5200k -pass 2 -passlogfile "$P" -c:a aac -b:a 128k -movflags +faststart "$OUT/preview.mp4"
rm -f "$P"*
cp "$D/thumbnail.png" "$D/captions.srt" "$D/UPLOAD.md" "$D/title.txt" "$D/description.txt" "$D/tags.txt" "$D/pinned_comment.txt" "$OUT/"
# The master goes into renders/ (and Git LFS) only after the founder approves the preview: MASTER=1 tools/finalize.sh <ep>
if [ "${MASTER:-0}" = "1" ]; then cp "$D/upload.mp4" "$OUT/"; else rm -f "$OUT/upload.mp4"; fi
rm -f "$OUT/metadata.md"
ls -la "$OUT"
