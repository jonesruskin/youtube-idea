"""Story-logic checks: every spatial or numerical claim the narration and diagrams make, verified against the
simulation. `tools/qa.py <ep> pre` runs CHECKS; any False blocks the render (docs/QUALITY_GATE.md #13).
Each check returns (ok, detail)."""
import numpy as np
from engine import sim as simmod

_S = None
DAY = 1 / 365.25
EARTH = 2


def S():
    global _S
    if _S is None:
        _S = simmod.load()
    return _S


def _geo(t):
    s = S()
    E, B, Sun = s.planet(EARTH, t), s.bh(t), s.sun(t)
    v1, v2 = Sun - E, B - E
    ang = float(np.degrees(np.arccos(np.dot(v1, v2) / np.linalg.norm(v1) / np.linalg.norm(v2))))
    return float(np.linalg.norm(v2)), float(np.linalg.norm(v1)), float(np.linalg.norm(B - Sun)), ang


def _earth_pass():
    ts = np.arange(-80, 20, 0.05) * DAY
    d = [_geo(t)[0] for t in ts]
    k = int(np.argmin(d))
    return float(ts[k]), float(d[k])


def t_minus_30_days():
    """c4a: 30 days before the pass, the hole is more than twice as far as the Sun, already pulls harder,
    and pulls from roughly the opposite side (a tug of war). The diagram uses these numbers."""
    tp, _ = _earth_pass()
    dB, dS, _, ang = _geo(tp - 30 * DAY)
    ratio = 10 / dB ** 2 / (1 / dS ** 2)
    ok = dB > 2 * dS and ratio > 1 and ang > 110 and abs(dB - 2.04) < 0.05 and abs(dS - 0.93) < 0.05 and abs(ratio - 2.1) < 0.15
    return ok, f"hole {dB:.2f} AU, Sun {dS:.2f} AU, {ang:.0f}° apart, pull ratio {ratio:.2f} (diagram: 2.04 / 0.93 / 133° / 2.1)"


def passes_earth_before_sun():
    """c4c → c4x → c4d: the hole passes Earth first, then reaches its closest point to the Sun."""
    tp, dmin = _earth_pass()
    ts = np.arange(-80, 20, 0.05) * DAY
    tq = float(ts[int(np.argmin([_geo(t)[2] for t in ts]))])
    return tp < tq and abs(dmin - 0.39) < 0.02, f"Earth pass day {tp / DAY:.1f} at {dmin:.2f} AU; Sun pass day {tq / DAY:.1f}"


def less_than_half_sun_distance():
    """c4c: 'At its closest, it's less than half as far away as the Sun.'"""
    tp, dmin = _earth_pass()
    _, dS, _, _ = _geo(tp)
    return dmin < 0.5 * dS, f"{dmin:.2f} AU vs Sun {dS:.2f} AU"


def moon_lost_at_the_pass():
    """c4e: Earth's Hill radius falls inside the Moon's orbit at the pass (so the Moon is lost there, before the
    Sun pass, which is where the story now shows it)."""
    tp, dmin = _earth_pass()
    rh_km = dmin * 1.496e8 * (3.0e-6 / (3 * 10)) ** (1 / 3)
    return rh_km < 384_000, f"Hill radius {rh_km:,.0f} km at the pass vs Moon orbit 384,000 km"


def not_in_front_of_the_sun():
    """c4x: from Earth the hole never crosses the Sun's disc; it comes within a few degrees ('a few degrees')."""
    ts = np.arange(-40, 20, 0.02) * DAY
    a = [_geo(t)[3] for t in ts]
    amin = float(min(a))
    return 3.0 < amin < 15.0, f"closest angle to the Sun in Earth's sky {amin:.1f}° (Sun's disc radius < 0.3°)"


def tides_dozens_of_metres():
    """c4b: tide ∝ M/d³; ~0.36 m lunar equilibrium tide → 'dozens of metres' at the pass."""
    _, dmin = _earth_pass()
    ratio = (10 * 2.7e7) * (384_400 / (dmin * 1.496e8)) ** 3
    return 20 < 0.36 * ratio < 80, f"{ratio:.0f}× the Moon's tide → ~{0.36 * ratio:.0f} m"


def speed_over_100_kms():
    """c4d: at the Sun pass the hole moves at well over 100 km/s (two-body, total mass 11 Suns)."""
    v = np.sqrt(45 ** 2 + 42.1 ** 2 * 11 / simmod.Q)
    return v > 100, f"{v:.0f} km/s at {simmod.Q} AU"


CHECKS = [t_minus_30_days, passes_earth_before_sun, less_than_half_sun_distance, moon_lost_at_the_pass,
          not_in_front_of_the_sun, tides_dozens_of_metres, speed_over_100_kms]
