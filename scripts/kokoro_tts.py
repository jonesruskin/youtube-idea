"""Kokoro-82M (Apache-2.0) line synthesiser for scripts/tts-local.ts.

Reads a JSON list of jobs on stdin: [{"key", "text", "voice", "lang", "speed", "out"}],
writes one 24 kHz mono WAV per job and prints one JSON line per job: {"key", "seconds"}.
Models: KOKORO_MODELS dir holding model.onnx and voices.npz (see docs/BORROWED_DAY_VOICE.md).
"""
import json
import os
import sys

import soundfile as sf
from kokoro_onnx import Kokoro

models = os.environ.get("KOKORO_MODELS", "/home/user/tts/models")
kokoro = Kokoro(os.path.join(models, "model.onnx"), os.path.join(models, "voices.npz"))

for job in json.load(sys.stdin):
    samples, rate = kokoro.create(job["text"], voice=job["voice"], speed=job.get("speed", 1.0), lang=job.get("lang", "en-us"))
    sf.write(job["out"], samples, rate)
    print(json.dumps({"key": job["key"], "seconds": len(samples) / rate}), flush=True)
