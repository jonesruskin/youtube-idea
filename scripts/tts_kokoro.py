"""Kokoro-82M voiceover (Apache-2.0, runs locally, free). Same contract as scripts/tts.ts (ElevenLabs):
writes public/audio/<id>/<hash>.wav + public/voice/<id>.json, so the timeline, SRT and score re-flow to the real voice.

    npx tsx scripts/export-timeline.ts sun01 > out/sun01-timeline.json
    ~/.venv-sun/bin/python scripts/tts_kokoro.py out/sun01-timeline.json

Lines are cached by a hash of (text, voice settings), so editing one line re-voices only that line.
Word timings from Kokoro are stored per line and spread to per-character times for the rig's lip-sync.
"""
import hashlib, json, os, re, subprocess, sys, tempfile
import numpy as np
import soundfile as sf
from kokoro import KPipeline

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SR = 24000

# Per speaker: Kokoro voice, speed, and post-processing. af_heart is Kokoro's only A-grade voice.
VOICES = {
    "NARRATOR": {"voice": "af_heart", "speed": 0.86, "fx": None},
    "MIRA": {"voice": "af_bella", "speed": 1.0, "fx": "child"},
    "RADIO": {"voice": "am_michael", "speed": 0.9, "fx": "radio"},
    # Mr. Ito: British English voice, slowed and pitched down a touch for age.
    "ITO": {"voice": "bm_george", "speed": 0.88, "fx": "elder", "lang": "b"},
}

# Pronunciation fixes (Kokoro inline phonemes); the script and captions keep normal spelling.
PRONOUNCE = {"Mira": "[Mira](/mˈɪɹə/)", "Ito": "[Ito](/ˈiːtoʊ/)"}

def spoken(text):
    for word, sub in PRONOUNCE.items():
        text = re.sub(rf"\b{word}\b", sub, text)
    return text

def ffmpeg_fx(audio, fx):
    """Child voice = pitch up with formants shifted too; radio = band-limited, saturated, with a bed of static."""
    with tempfile.TemporaryDirectory() as d:
        src, dst = os.path.join(d, "in.wav"), os.path.join(d, "out.wav")
        sf.write(src, audio, SR)
        if fx == "child":
            af = "rubberband=pitch=1.2:tempo=1.0:formant=shifted,highpass=f=120"
        elif fx == "elder":
            af = "rubberband=pitch=0.94:tempo=1.0:formant=preserved,highpass=f=70"
        else:
            af = "highpass=f=350,lowpass=f=3200,acompressor=threshold=0.1:ratio=6:attack=2:release=60,volume=1.6,alimiter=limit=0.7"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af", af, "-ar", str(SR), dst], check=True)
        out, _ = sf.read(dst, dtype="float32")
    if fx == "radio":
        rng = np.random.default_rng(7)
        static = rng.standard_normal(len(out)).astype(np.float32) * 0.018
        crackle = (rng.random(len(out)) > 0.9993).astype(np.float32) * rng.standard_normal(len(out)).astype(np.float32) * 0.25
        out = out + static + crackle
    return out

def char_times(text, words):
    """Spread word start/end times over the characters of `text` (lip-sync wants one start time per character)."""
    times = [0.0] * len(text)
    pos, last = 0, 0.0
    for w in words:
        i = text.find(w["w"], pos)
        if i < 0:
            continue
        span = max(len(w["w"]), 1)
        for k in range(span):
            times[i + k] = w["s"] + (w["e"] - w["s"]) * k / span
        for k in range(pos, i):
            times[k] = last
        pos, last = i + span, w["e"]
    for k in range(pos, len(text)):
        times[k] = last
    return times

def main():
    tl = json.load(open(sys.argv[1]))
    ep = tl["id"]
    audio_dir = os.path.join(ROOT, "public", "audio", ep)
    os.makedirs(audio_dir, exist_ok=True)
    os.makedirs(os.path.join(ROOT, "public", "voice"), exist_ok=True)
    map_path = os.path.join(ROOT, "public", "voice", f"{ep}.json")
    vmap = json.load(open(map_path)) if os.path.exists(map_path) else {}
    pipes = {}
    live = {l["key"] for l in tl["lines"]}
    vmap = {k: v for k, v in vmap.items() if k in live}  # drop lines from older drafts
    made = 0
    for line in tl["lines"]:
        cfg = VOICES[line["speaker"]]
        h = hashlib.sha1(json.dumps([spoken(line["text"]), cfg]).encode()).hexdigest()[:12]
        rel = f"audio/{ep}/{h}.wav"
        abs_ = os.path.join(ROOT, "public", rel)
        if os.path.exists(abs_) and vmap.get(line["key"], {}).get("file") == rel:
            continue
        chunks, words, offset = [], [], 0.0
        lang = cfg.get("lang", "a")
        if lang not in pipes:
            pipes[lang] = KPipeline(lang_code=lang, repo_id="hexgrad/Kokoro-82M")
        for r in pipes[lang](spoken(line["text"]), voice=cfg["voice"], speed=cfg["speed"]):
            a = r.audio.numpy()
            for t in r.tokens or []:
                if t.start_ts is not None and t.end_ts is not None and t.text.strip() and any(c.isalnum() for c in t.text):
                    words.append({"w": t.text, "s": offset + t.start_ts, "e": offset + t.end_ts})
            chunks.append(a)
            offset += len(a) / SR
        audio = np.concatenate(chunks).astype(np.float32)
        # Trim Kokoro's leading pad so the line starts on its first word; keep a short natural tail.
        head = max(0.0, (words[0]["s"] if words else 0.0) - 0.04)
        tail = min(len(audio) / SR, (words[-1]["e"] if words else len(audio) / SR) + 0.28)
        audio = audio[int(head * SR):int(tail * SR)]
        words = [{**w, "s": round(w["s"] - head, 3), "e": round(w["e"] - head, 3)} for w in words]
        if cfg["fx"]:
            audio = ffmpeg_fx(audio, cfg["fx"])
        peak = float(np.max(np.abs(audio))) or 1.0
        audio = audio * (0.89 / peak)  # consistent level per line; the master pass sets final loudness
        sf.write(abs_, audio, SR, subtype="PCM_16")
        seconds = round(len(audio) / SR + 0.02, 3)
        vmap[line["key"]] = {"seconds": seconds, "file": rel, "words": words, "chars": char_times(line["text"], words)}
        json.dump(vmap, open(map_path, "w"), indent=1)
        made += 1
        print(f"✔ {line['key']:<26} {line['speaker']:<9} {seconds:6.2f}s", flush=True)
    json.dump(vmap, open(map_path, "w"), indent=1)
    print(f"\n{made} line(s) voiced, {len(tl['lines']) - made} cached.")

if __name__ == "__main__":
    main()
