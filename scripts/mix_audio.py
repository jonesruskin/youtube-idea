"""Mix the episode soundtrack exactly as the Remotion composition places it, without a frame-by-frame audio render.

Episode.tsx plays the score from frame 0 and each voiced line inside a Sequence that starts at
round(start*fps) and lasts round((end-start+0.5)*fps) frames. This reproduces that placement sample-accurately
(measured against a Remotion audio render: identical score, voice −3 dB per channel, ≤0.4 ms offset) at 48 kHz stereo and writes a 32-bit float WAV (no clipping; the master loudnorm pass sets the final level).

Usage: python3 scripts/mix_audio.py out/sun01-timeline.json public/voice/sun01.json public/audio/sun01-score.wav OUT.wav SECONDS
"""
import json
import math
import subprocess
import sys

import numpy as np

SR = 48000


def decode(path: str, channels: int) -> np.ndarray:
    raw = subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', str(channels), '-ar', str(SR), '-'],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype='<f4').reshape(-1, channels)


def main() -> None:
    tl_path, voice_path, score_path, out_path, seconds = sys.argv[1:6]
    tl = json.load(open(tl_path))
    voice = json.load(open(voice_path))
    fps = tl['fps']
    n = int(round(float(seconds) * SR))
    mix = np.zeros((n, 2), dtype=np.float32)

    score = decode(score_path, 2)[:n]
    mix[: len(score)] += score

    placed = 0
    for line in tl['lines']:
        v = voice.get(line['key'])
        if not v or not v.get('file'):
            continue
        jsround = lambda x: math.floor(x + 0.5)  # Math.round semantics (Python's round() is banker's)
        a = jsround(line['start'] * fps)
        length = jsround((line['end'] - line['start'] + 0.5) * fps)
        s0 = round(a / fps * SR)
        s1 = min(n, round((a + length) / fps * SR))
        clip = decode(f"public/{v['file']}", 1)[: max(0, s1 - s0)]
        mix[s0 : s0 + len(clip)] += clip * np.float32(0.70710678)  # mono → both channels at −3 dB, as Remotion does (measured)
        placed += 1

    subprocess.run(
        ['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_f32le', out_path],
        input=mix.astype('<f4').tobytes(), check=True,
    )
    peak = float(np.abs(mix).max())
    print(f'mixed score + {placed} lines → {out_path} ({n / SR:.2f}s, peak {20 * np.log10(peak + 1e-9):.1f} dBFS)')


if __name__ == '__main__':
    main()
