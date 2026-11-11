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
    # Kai, 16: a light young male voice nudged up a little so he reads as a teenager, not a man
    "KAI": {"voice": "am_liam", "speed": 1.0, "fx": "teen"},
    # Mum (Grace Okafor), heard first over the radio, then in person
    "MUM": {"voice": "af_sarah", "speed": 0.92, "fx": None},
    "MUM_RADIO": {"voice": "af_sarah", "speed": 0.92, "fx": "radio"},
    # a passer-by shouting in the street
    "MAN": {"voice": "am_fenrir", "speed": 1.05, "fx": None},
    # television: a newsreader and a scientist at a press conference, through a TV speaker
    "ANCHOR": {"voice": "bf_emma", "speed": 0.95, "fx": "tv", "lang": "b"},
    "SCIENTIST": {"voice": "am_adam", "speed": 0.95, "fx": "tv"},
    # File 002
    "TOMAS": {"voice": "am_puck", "speed": 1.0, "fx": "boy"},
    "LOLA": {"voice": "af_kore", "speed": 0.88, "fx": "elder"},
    "ROSA": {"voice": "af_nova", "speed": 0.95, "fx": None},
    "ROSA_RADIO": {"voice": "af_nova", "speed": 0.95, "fx": "radio"},
    "CAPTAIN": {"voice": "am_onyx", "speed": 0.95, "fx": None},
    "OFFICER": {"voice": "af_jessica", "speed": 0.95, "fx": None},
    "CLERK": {"voice": "am_eric", "speed": 0.95, "fx": "radio"},
    # File 002 (vol02)
    "ANA": {"voice": "af_sky", "speed": 1.0, "fx": "child"},
    "LUI": {"voice": "af_jessica", "speed": 1.02, "fx": "child"},
    "SIONE": {"voice": "am_adam", "speed": 0.95, "fx": None},
    "MELE": {"voice": "af_nova", "speed": 0.95, "fx": None},
    "MELE_PHONE": {"voice": "af_nova", "speed": 0.95, "fx": "radio"},
    "TEACHER": {"voice": "bm_lewis", "speed": 0.98, "fx": None},
    "COLLEAGUE": {"voice": "am_eric", "speed": 0.98, "fx": None},
    "JAZ": {"voice": "am_puck", "speed": 1.04, "fx": "boy"},
    # File 002 (moon02)
    "WREN": {"voice": "af_sky", "speed": 1.0, "fx": "child"},
    "NANA": {"voice": "bf_emma", "speed": 0.9, "fx": "elder", "lang": "b"},
    "TESS": {"voice": "af_sarah", "speed": 0.96, "fx": None},
    "PELL": {"voice": "bm_lewis", "speed": 0.95, "fx": None, "lang": "b"},
    "ROSE": {"voice": "bf_lily", "speed": 0.92, "fx": None, "lang": "b"},
    "WRENOLD": {"voice": "bf_isabella", "speed": 0.8, "fx": None, "lang": "b"},
    "PUPIL": {"voice": "af_bella", "speed": 1.0, "fx": "child"},
    "PUPIL2": {"voice": "am_puck", "speed": 1.0, "fx": "boy"},
    "OFFICIAL": {"voice": "bm_george", "speed": 0.94, "fx": None, "lang": "b"},
}

# Per-episode voice overrides (each File has its own narrator)
EP_VOICES = {
    "sun02": {"NARRATOR": {"voice": "am_michael", "speed": 0.9, "fx": None}},
    "vol02": {"NARRATOR": {"voice": "af_aoede", "speed": 0.9, "fx": None}},
    "moon02": {"NARRATOR": {"voice": "bf_isabella", "speed": 0.8, "fx": None, "lang": "b"}, "WREN": {"voice": "af_sky", "speed": 0.94, "fx": "child"}, "NANA": {"voice": "bf_emma", "speed": 0.85, "fx": "elder", "lang": "b"}, "TESS": {"voice": "af_sarah", "speed": 0.92, "fx": None}, "PELL": {"voice": "bm_lewis", "speed": 0.9, "fx": None, "lang": "b"}, "ANCHOR": {"voice": "af_nova", "speed": 0.98, "fx": "tv"}, "SCIENTIST": {"voice": "am_michael", "speed": 0.95, "fx": "tv"}},
}

# Pronunciation fixes (Kokoro inline phonemes); the script and captions keep normal spelling.
PRONOUNCE = {"Mira": "[Mira](/mˈɪɹə/)", "Ito": "[Ito](/ˈiːtoʊ/)", "Kai": "[Kai](/kˈaɪ/)", "Tomás": "[Tomás](/toʊmˈɑs/)", "Amihan": "[Amihan](/ɑmˈiːhɑn/)", "anak": "[anak](/ˈɑnɑk/)", "Lola": "[Lola](/lˈoʊlə/)", "Luzon": "[Luzon](/luːzˈɔn/)", "Pilar": "[Pilar](/piːlˈɑɹ/)", "Ana": "[Ana](/ˈɑːnə/)", "Lui": "[Lui](/lˈuːi/)", "Mele": "[Mele](/mˈɛlɛ/)", "Sione": "[Sione](/siˈoʊnɛ/)", "Kōwhai": "[Kōwhai](/kˈɔːfaɪ/)", "Rangitoto": "[Rangitoto](/ɹˌɑŋɡiːtˈoʊtoʊ/)", "Motutapu": "[Motutapu](/mˌoʊtuːtˈɑːpuː/)"}

def spoken(text):
    for word, sub in PRONOUNCE.items():
        text = re.sub(rf"\b{word}\b", sub, text)
    return text

PAD = 0.3  # s of silence around audio sent through rubberband/ffmpeg: its latency otherwise clips short lines' edges

def padded(fn):
    def run(audio, *a):
        n = int(PAD * SR)
        out = fn(np.concatenate([np.zeros(n, np.float32), audio.astype(np.float32), np.zeros(n, np.float32)]), *a)
        return out[n:n + len(audio)] if len(out) >= n + len(audio) else out[n:]
    return run

def ffmpeg_fx(audio, fx, feel_pitch=1.0):
    """Child voice = pitch up with formants shifted too; radio = band-limited, saturated, with a bed of static."""
    with tempfile.TemporaryDirectory() as d:
        src, dst = os.path.join(d, "in.wav"), os.path.join(d, "out.wav")
        sf.write(src, audio, SR)
        if fx == "child":
            af = f"rubberband=pitch={1.2 * feel_pitch:.4f}:tempo=1.0:formant=shifted,highpass=f=120"
        elif fx == "teen":
            af = f"rubberband=pitch={1.06 * feel_pitch:.4f}:tempo=1.0:formant=preserved,highpass=f=90"
        elif fx == "tv":
            af = "highpass=f=140,lowpass=f=6500,acompressor=threshold=0.15:ratio=4:attack=3:release=80"
        elif fx == "boy":
            af = f"rubberband=pitch={1.12 * feel_pitch:.4f}:tempo=1.0:formant=preserved,highpass=f=110"
        elif fx == "elder":
            af = f"rubberband=pitch={0.94 * feel_pitch:.4f}:tempo=1.0:formant=preserved,highpass=f=70"
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

# Delivery marks (src/engine/delivery.ts): *stress*, " / " beat, " // " long beat. Bump to re-voice everything.
DELIVERY_VERSION = 8
STRESS = re.compile(r"\*([^*]+)\*")
BEATS = {"/": 0.24, "//": 0.6}  # plus ≈0.11 s of phrase edges

def segments(say):
    """'a / b // c' → [('a', 0.35), ('b', 0.8), ('c', 0)]"""
    parts = re.split(r"\s+(//?)\s+", " " + say.strip() + " ")
    out = []
    for i in range(0, len(parts), 2):
        seg = parts[i].strip()
        beat = BEATS.get(parts[i + 1], 0) if i + 1 < len(parts) else 0
        # after a full stop Kokoro already pauses: a short beat there only adds a breath
        if beat == BEATS["/"] and re.search(r"[.!?…]\*?$", seg):
            beat = 0.08
        if seg:
            out.append((seg, beat))
        elif out:
            out[-1] = (out[-1][0], out[-1][1] + beat)
    return out

def stress_words(span):
    """Kokoro/misaki stress markup: each stressed word becomes [word](+1) (names keep their phoneme fix instead).
    +2 and stress on very short lines bend the vowels ('To me' read as 'That's amazing' once aged): see the caller."""
    out = []
    for tok in span.split():
        m = re.match(r"^([\w'’-]+)(\W*)$", tok)
        if not m or any(m.group(1) == n for n in PRONOUNCE):
            out.append(tok)
        else:
            out.append(f"[{m.group(1)}](+1){m.group(2)}")
    return " ".join(out)

def pitch_shift(audio, ratio):
    """A feeling's pitch (a scared voice rises, a sad one sinks), formants kept so the voice stays itself."""
    with tempfile.TemporaryDirectory() as d:
        src, dst = os.path.join(d, "in.wav"), os.path.join(d, "out.wav")
        sf.write(src, audio, SR)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af", f"rubberband=pitch={ratio}:tempo=1.0:formant=preserved", "-ar", str(SR), dst], check=True)
        out, _ = sf.read(dst, dtype="float32")
    return out

ffmpeg_fx = padded(ffmpeg_fx)
pitch_shift = padded(pitch_shift)

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
        cfg = {**VOICES[line["speaker"]], **EP_VOICES.get(ep, {}).get(line["speaker"], {})}
        fv = line.get("fv") or {"speed": 1.0, "pitch": 1.0, "level": 1.0}
        say = line.get("say") or line["text"]
        h = hashlib.sha1(json.dumps([spoken(say), cfg, fv, DELIVERY_VERSION]).encode()).hexdigest()[:12]
        rel = f"audio/{ep}/{h}.wav"
        abs_ = os.path.join(ROOT, "public", rel)
        if os.path.exists(abs_) and vmap.get(line["key"], {}).get("file") == rel:
            continue
        lang = cfg.get("lang", "a")
        if lang not in pipes:
            pipes[lang] = KPipeline(lang_code=lang, repo_id="hexgrad/Kokoro-82M")
        # Delivery: the whole line in ONE pass (natural intonation runs across the beats), stress marked inline; then
        # each beat is inserted as silence at the end of the word before it (Kokoro's word timestamps). If the words
        # can't be matched to the phrases, fall back to synthesising the phrases one by one.
        segs = segments(say)
        def synth(txt):
            ws, au, loc = [], [], 0.0
            for r in pipes[lang](txt, voice=cfg["voice"], speed=cfg["speed"] * fv["speed"]):
                a = r.audio.numpy()
                for t in r.tokens or []:
                    if t.start_ts is not None and t.end_ts is not None and t.text.strip() and any(c.isalnum() for c in t.text):
                        ws.append({"w": t.text, "s": loc + t.start_ts, "e": loc + t.end_ts})
                au.append(a)
                loc += len(a) / SR
            return (np.concatenate(au) if au else np.zeros(1, np.float32)), ws
        full = " ".join(seg for seg, _ in segs)
        want = [w.lower() for span in STRESS.findall(full) for w in re.findall(r"[\w'’-]+", span)]
        short = len(re.findall(r"[\w'’]+", STRESS.sub(lambda m: m.group(1), full))) <= 3
        mark = (lambda m: m.group(1)) if short else (lambda m: stress_words(m.group(1)))  # tiny lines: lift only
        base, words = synth(spoken(STRESS.sub(mark, full)))
        counts = [len(re.findall(r"[\w'’]+(?:[-.:][\w'’]+)*", STRESS.sub(lambda m: m.group(1), seg))) for seg, _ in segs]
        chunks, offset, stressed = [], 0.0, []
        if len(segs) == 1 or sum(counts) == len(words):
            # cut points: after the last word of each phrase that ends in a beat
            cuts, n = [], 0
            for (seg, beat), c in zip(segs, counts):
                n += c
                if beat and n < len(words):
                    cuts.append((words[n - 1]["e"], beat, n))
            pos, shift, out_words = 0, 0.0, []
            for k, w in enumerate(words):
                out_words.append(w)
            for t_cut, beat, n in cuts:
                a = int(t_cut * SR)
                chunks.append(base[pos:a])
                chunks.append(np.zeros(int(beat * SR), np.float32))
                pos = a
                for w in words[n:]:
                    w["s"] += beat
                    w["e"] += beat
            chunks.append(base[pos:])
        else:
            words = []
            for si, (seg, beat) in enumerate(segs):
                seg_audio, seg_words = synth(spoken(STRESS.sub(lambda m: stress_words(m.group(1)), seg)))
                if seg_words:
                    h0 = max(0.0, seg_words[0]["s"] - 0.03) if si > 0 else 0.0
                    t0 = min(len(seg_audio) / SR, seg_words[-1]["e"] + 0.08) if si < len(segs) - 1 else len(seg_audio) / SR
                    seg_audio = seg_audio[int(h0 * SR):int(t0 * SR)]
                    seg_words = [{**w, "s": w["s"] - h0 + offset, "e": w["e"] - h0 + offset} for w in seg_words]
                chunks.append(seg_audio)
                offset += len(seg_audio) / SR
                words += seg_words
                if beat:
                    chunks.append(np.zeros(int(beat * SR), np.float32))
                    offset += beat
        for w in words:
            key = re.sub(r"[^\w'’-]", "", w["w"].lower())
            if want and key == want[0]:
                stressed.append((w["s"], w["e"]))
                want.pop(0)
        audio = np.concatenate(chunks).astype(np.float32)
        # stress: the marked words a little louder (+3.5 dB, 25 ms ramps), on top of Kokoro's own emphasis
        if stressed:
            env = np.ones(len(audio), np.float32)
            ramp = int(0.025 * SR)
            for s0, e0 in stressed:
                a0, b0 = int(s0 * SR), min(len(audio), int(e0 * SR))
                if b0 <= a0:
                    continue
                g = np.full(b0 - a0, 1.5, np.float32)
                r = min(ramp, (b0 - a0) // 2)
                if r > 0:
                    g[:r] = np.linspace(1, 1.5, r)
                    g[-r:] = np.linspace(1.5, 1, r)
                env[a0:b0] = np.maximum(env[a0:b0], g)
            audio = audio * env
        # Trim Kokoro's leading pad so the line starts on its first word; keep a short natural tail.
        head = max(0.0, (words[0]["s"] if words else 0.0) - 0.04)
        tail = min(len(audio) / SR, (words[-1]["e"] if words else len(audio) / SR) + 0.28)
        audio = audio[int(head * SR):int(tail * SR)]
        words = [{**w, "s": round(w["s"] - head, 3), "e": round(w["e"] - head, 3)} for w in words]
        # ONE pitch pass at most (two rubberband passes in a row smear into a chorus: "double voices", CEO v5.3):
        # the feeling's pitch is folded into the age filter below; a voice with no filter gets no pitch pass at all.
        if cfg["fx"]:
            audio = ffmpeg_fx(audio, cfg["fx"], fv["pitch"])
        peak = float(np.max(np.abs(audio))) or 1.0
        audio = audio * (0.89 / peak) * fv["level"]  # consistent level per line, scaled by the feeling (a whisper is quieter)
        sf.write(abs_, audio, SR, subtype="PCM_16")
        seconds = round(len(audio) / SR + 0.02, 3)
        vmap[line["key"]] = {"seconds": seconds, "file": rel, "words": words, "chars": char_times(line["text"], words)}
        json.dump(vmap, open(map_path, "w"), indent=1)
        made += 1
        print(f"✔ {line['key']:<26} {line['speaker']:<9} {seconds:6.2f}s", flush=True)
    json.dump(vmap, open(map_path, "w"), indent=1)
    print(f"\n{made} line(s) voiced, {len(tl['lines']) - made} cached.")
    # old takes pile up (every rewrite or delivery change voices a new file): keep only what the map uses
    used = {os.path.basename(v["file"]) for v in vmap.values()}
    stale = [f for f in os.listdir(audio_dir) if f.endswith(".wav") and f not in used]
    for f in stale:
        os.remove(os.path.join(audio_dir, f))
    if stale:
        print(f"pruned {len(stale)} old take(s)")

if __name__ == "__main__":
    main()
