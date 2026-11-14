"""Story-logic checks for the Jupiter fall: every number the narration and HUD state, and the order of events,
verified against the fall simulation (tools/qa.py <ep> pre runs CHECKS; docs/QUALITY_GATE.md #13)."""
import numpy as np
from ep_jupiter import vis as V


def crush_depth_and_time():
    """'ninety-eight minutes', '579 km', Mariana-Trench pressure (~1,100 × Earth)."""
    st = V.at(V.T_CRUSH)
    ok = abs(V.T_CRUSH / 60 - 98) < 1.0 and abs(st["z"] - 579) < 5 and abs(st["P"] - 1100) < 30
    return ok, f"{V.T_CRUSH / 60:.1f} min, {st['z']:.0f} km, {st['P']:.0f} × Earth"


def galileo_at_seven_minutes():
    """'At seven minutes … deeper than anything we've sent' (Galileo: 123 km)."""
    st = V.at(7 * 60)
    return 115 < st["z"] < 135, f"depth at 7 min: {st['z']:.0f} km (Galileo lost at ~123 km)"


def floats_at_5350_km():
    """'six and a half days', '5,350 km down', '< a tenth of the way' (7.7 %)."""
    st = V.at(V.T_FLOAT)
    ok = abs(st["z"] - 5350) < 60 and 6.3 < V.T_FLOAT / 86400 < 6.8 and st["v"] < 5
    return ok, f"{st['z']:.0f} km after {V.T_FLOAT / 86400:.2f} days, speed {st['v']:.1f} km/h, {100 * st['z'] / 69911:.1f} % of the radius"


def falls_monotonically():
    """The ship only ever goes down until it floats (it never climbs): depth is non-decreasing in sim time."""
    ts = np.geomspace(1, V.T_FLOAT, 4000)
    z = np.array([V.at(t)["z"] for t in ts])
    worst = float(np.min(np.diff(z)))
    return worst > -0.05, f"largest upward step {-min(0.0, worst):.3f} km"


CHECKS = [crush_depth_and_time, galileo_at_seven_minutes, floats_at_5350_km, falls_monotonically]
