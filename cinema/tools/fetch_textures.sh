#!/usr/bin/env bash
# Planet textures from Solar System Scope (CC BY 4.0 — credit "Solar System Scope" in the description).
set -e
D="$(cd "$(dirname "$0")/.." && pwd)/assets/tex"; mkdir -p "$D"; cd "$D"
for f in 8k_earth_daymap 8k_earth_nightmap 8k_earth_clouds 8k_stars_milky_way 2k_sun 8k_moon 8k_jupiter 8k_saturn 2k_neptune 2k_mars 2k_uranus 2k_venus_atmosphere 2k_mercury; do
  [ -f "$f.jpg" ] || curl -sSL -A "Mozilla/5.0" -o "$f.jpg" "https://www.solarsystemscope.com/textures/download/$f.jpg"
done
[ -f 8k_saturn_ring_alpha.png ] || curl -sSL -A "Mozilla/5.0" -o 8k_saturn_ring_alpha.png https://www.solarsystemscope.com/textures/download/8k_saturn_ring_alpha.png
ls
