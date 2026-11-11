# Cinema: the photoreal pipeline

This replaces the flat-character Remotion look with a **cinematic space-documentary** pipeline. Everything is generated in Python: lensing, planets, simulations, typography, score and narration. Flagship episode: **"What If a Black Hole Passed Through Our Solar System?"** (8:20).

## Why the change
The old episodes looked like clip-art and had no voice. The channels that earn the most in this niche (space documentaries and "what if" explainers) all share three things:
1. **A human-sounding narrator.** The old cuts had none. Now: Kokoro-82M (Apache-2.0), a neural voice that runs locally for $0.
2. **Imagery that looks real.** NASA-style planets, real starfields and believable physics. Now: ray-cast textured planets, a procedural Milky Way and real gravitational lensing.
3. **Credibility you can screenshot.** Now: every orbit comes from an actual N-body simulation, and every fact is sourced in the description. The simulation produced the twists (the Moon stripped from Earth, Venus captured, Saturn keeping its rings), so the story is something nobody else can copy.

## Pipeline
```bash
# one-time: python3.12 venv with kokoro + soundfile + en_core_web_sm (voice); any python with numpy opencv-python-headless pillow scipy soundfile (render)
python tools/voice.py ep_blackhole              # narration → build/ep_blackhole/voice/*.wav + timeline.json
python -m engine.render ep_blackhole --stills   # 3 review stills per shot → build/ep_blackhole/stills
python -m engine.render ep_blackhole            # all shots, 4 processes → picture.mp4   (~1.5 h on 4 CPUs)
python tools/score.py ep_blackhole              # original score + SFX, ducked under the voice → mix.wav
python tools/metadata.py ep_blackhole           # captions.srt + metadata.md (titles, chapters, mid-rolls, sources)
python tools/thumbnail.py                       # thumbnail.png
tools/finalize.sh ep_blackhole                  # mux, -14 LUFS, copy to renders/ep_blackhole/
```

## Layout
```
ep_blackhole/script.py   the episode as data: narration lines, shot per segment, cards, music cues, science notes
engine/core.py           maths, noise, star rendering, bloom/filmic tonemap/grain post chain
engine/space.py          procedural Milky Way canvas + point-lens gravitational lensing (inverse ray mapping)
engine/planet.py         ray-cast planets: day/night/clouds/specular/atmosphere, Saturn's rings, the filtered Sun
engine/sim.py            N-body: 10 M☉ black hole at 45 km/s, periapsis 1 AU; planets as test particles
engine/shots_space.py    lens, planet, earth, sun, leave (inverse-square sunlight), spaghetti (tidal disruption particle sim)
engine/shots_ground.py   night sky with a stargazer, rising tide, frozen surface with air falling as snow, deep-sea vent
engine/shots_diagram.py  live orbit diagrams from the sim, eccentric-orbit year, galaxy maps, the Moon leaving
engine/cards.py          typography: chapter and fate cards, stats, tags, title, end screen
engine/render.py         timeline → parallel per-segment encode → picture.mp4
tools/                   voice, score, metadata, thumbnail, finalize, contact sheets
```

## How to make the next episode
Copy `ep_blackhole/script.py`, write the narration and pick shots from the library. Run voice, then stills, then review, then render. Each new shot type you add becomes reusable for every later episode.

## Licences
Textures: Solar System Scope, CC BY 4.0 (credited in the description). Voice: Kokoro-82M, Apache-2.0. Fonts: Inter, IBM Plex Mono, Cormorant (all OFL). Score: synthesised in `tools/score.py`, so it is original.
