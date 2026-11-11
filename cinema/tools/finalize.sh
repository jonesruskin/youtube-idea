#!/usr/bin/env bash
# Mux picture + mix, loudness-normalise to YouTube's -14 LUFS, copy deliverables to renders/.
set -euo pipefail
EP=${1:-ep_blackhole}
D="$(cd "$(dirname "$0")/.." && pwd)/build/$EP"
OUT="$(cd "$(dirname "$0")/../.." && pwd)/renders/$EP"
mkdir -p "$OUT"
ffmpeg -v error -y -i "$D/picture.mp4" -i "$D/mix.wav" -map 0:v -map 1:a -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$D/final.mp4"
# web-size copy for the repo (master stays in build/)
ffmpeg -v error -y -i "$D/final.mp4" -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -c:a copy -movflags +faststart "$OUT/$EP.mp4"
cp "$D/thumbnail.png" "$D/captions.srt" "$D/metadata.md" "$OUT/"
ls -la "$OUT"
