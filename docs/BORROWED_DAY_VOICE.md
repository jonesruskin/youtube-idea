# Borrowed Day · free local voice (Kokoro-82M)

Borrowed Day is narrated in the second person ("You wake up…"), so it can't ship silent. Until there's an ElevenLabs account, voices come from **Kokoro-82M**, an open neural TTS model under the **Apache-2.0** licence, which allows commercial use. It runs on the CPU in this repo's pipeline and writes the same files `npm run voice` writes, so the timeline, captions, score and lip-sync all re-time to it.

## One-time setup (~360 MB)
```bash
python3.12 -m venv /home/user/tts/venv
/home/user/tts/venv/bin/pip install kokoro-onnx soundfile
mkdir -p /home/user/tts/models/voices
curl -L -o /home/user/tts/models/model.onnx https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/onnx/model.onnx
for v in af_heart am_michael am_onyx bf_emma am_puck bm_george bf_isabella af_sky af_aoede am_echo; do
  curl -L -o /home/user/tts/models/voices/$v.bin https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices/$v.bin
done
# pack the voices into the .npz kokoro-onnx expects
/home/user/tts/venv/bin/python -c "import numpy as np,glob,os; np.savez('/home/user/tts/models/voices.npz', **{os.path.basename(p)[:-4]: np.fromfile(p, dtype=np.float32).reshape(-1,1,256) for p in glob.glob('/home/user/tts/models/voices/*.bin')})"
```
Other paths can be set with `KOKORO_PYTHON` (the venv's python) and `KOKORO_MODELS` (the folder with `model.onnx` and `voices.npz`).

## Use
```bash
npm run voice:local bd01      # voices new or changed lines only (cached by content hash)
npm run lint:episode bd01     # runtime now uses the real line lengths
npm run render bd01
```

## Casting (`scripts/tts-local.ts` → `CAST`)
| Speaker | Kokoro voice | Notes |
|---|---|---|
| NARRATOR | `af_heart` | The highest-rated Kokoro voice, slowed slightly (0.95). The narrator is the channel's brand. |
| RICHEST | `am_michael` | Calm, warm |
| MARCUS | `am_onyx` | Deep, slowed (0.9) |
| ADA | `bf_emma` | British, crisp |
| FRIEND | `am_puck` | Bright, fast |
| PRESIDENT | `bm_george` | British, grand |
| MAMA | `bf_isabella` | |
| SISTER | `af_sky` | Fast (1.08) |
| IYA | `af_aoede` | |
| YOU | `am_echo` | Your body's voice, in the Return |

**Known limit:** Kokoro has no Nigerian voices, so Mama, Iya and your sister don't sound like Lagos. That is the biggest reason to move this channel to ElevenLabs (`npm run voice`, see `ELEVENLABS_SETUP.md`), which has African-accented voices.

## Pronunciation
`SAY` in `scripts/tts-local.ts` holds spoken-only respellings (e.g. *jollof → jollaf*). Captions keep the real spelling. To check every line, transcribe the clips back with Whisper and compare against the script. Numerals that Whisper writes as digits are expected; anything else is a real mispronunciation.
