"""Facts for the rogue-planet episode: every number the narration and HUD state, computed from ep_rogue/sim.py.

  python -m ep_rogue.model        # prints the fact sheet the script is written from
"""
import os, json, functools
import numpy as np
from ep_rogue import sim as S

AU_KM = 1.495978707e8
YR_D = 365.25
M_MOON_KG, M_ROGUE_KG = 7.342e22, S.M_ROGUE * 1.98847e30
D_MOON_KM = 384400.0
R_ROGUE_KM = S.R_ROGUE * AU_KM

# the arrival days the episode follows (days Earth reaches the crossing point after the rogue does)
DAY_EJECT = 0.0        # the closest pass: Earth thrown out
DAY_KEEP = -4.25       # thrown out, but the Moon comes too
DAY_SCORCH = -16.0     # pulled inward: hotter
DAY_MOON = -11.5       # pulled inward, and months later the Sun takes the Moon
DAY_FROZEN = 10.0      # stretched outward: frozen most of the year
DAY_FAR = 9.0          # (unused alternative)
MOON_PHASE = 2.1       # the Moon's starting phase for the story runs


@functools.lru_cache(None)
def run(day, years=6.0, moon=True):
    """Dense solution for one arrival day. Returns (sol, tp). Every planet + the Moon."""
    ph = list(S.BASE_PHASES)
    ph[2] = np.radians(-day * S.DEG_PER_DAY)
    st, tp = S.initial_state(S.STORY_Q, S.STORY_INC, S.STORY_NODE, ph, moon=moon, moon_phase=MOON_PHASE)
    sol = S.integrate(st, tp, years, moon_of=2 if moon else None, dense=True, rtol=1e-11)
    return sol, tp


IE, IM = 12 + 6 * 2, 12 + 6 * 8          # Earth, Moon offsets in the state vector


def state(day, t_rel_days):
    """Positions (AU) at t_rel days from the rogue's closest approach to the Sun: dict of bodies."""
    sol, tp = run(day)
    y = sol.sol(tp + t_rel_days / YR_D)
    out = dict(sun=y[0:3], rogue=y[6:9], moon=y[IM:IM + 3])
    for k, (n, _) in enumerate(S.PLANETS):
        out[n.lower()] = y[12 + 6 * k:15 + 6 * k]
    return out


def earth_orbit(day):
    sol, tp = run(day)
    s = sol.y[:, -1]
    en, a, e = S.orbit_about(s[IE:IE + 3], s[IE + 3:IE + 6], s[0:3], s[3:6], S.G)
    return a, e


def closest(day):
    """Closest Earth–rogue distance (km) and when (days from the rogue's Sun passage)."""
    sol, tp = run(day)
    ts = np.linspace(tp - 0.3, tp + 0.3, 60001)
    y = sol.sol(ts)
    d = np.linalg.norm(y[IE:IE + 3] - y[6:9], axis=0)
    i = int(np.argmin(d))
    return d[i] * AU_KM, (ts[i] - tp) * YR_D


def exit_speed(day):
    """Earth's speed relative to the Sun once far away (km/s), for an ejection."""
    sol, tp = run(day)
    s = sol.y[:, -1]
    en, _, _ = S.orbit_about(s[IE:IE + 3], s[IE + 3:IE + 6], s[0:3], s[3:6], S.G)
    return np.sqrt(2 * en) / S.KMS if en > 0 else 0.0


def moon_lost_after(day, years=3.0):
    """Days after closest approach when the Moon is first more than 1.5 million km from Earth (None = never)."""
    sol, tp = run(day)
    ts = np.linspace(tp, tp + years, 40000)
    y = sol.sol(ts)
    d = np.linalg.norm(y[IM:IM + 3] - y[IE:IE + 3], axis=0) * AU_KM
    k = np.where(d > 1.5e6)[0]
    return None if not len(k) else (ts[k[0]] - tp) * YR_D


def moon_fate(day):
    sol, tp = run(day)
    s = sol.y[:, -1]
    enE, _, _ = S.orbit_about(s[IM:IM + 3], s[IM + 3:IM + 6], s[IE:IE + 3], s[IE + 3:IE + 6], S.G * S.ME)
    if enE < 0 and np.linalg.norm(s[IM:IM + 3] - s[IE:IE + 3]) < 0.01:
        return "earth", None
    enS, a, e = S.orbit_about(s[IM:IM + 3], s[IM + 3:IM + 6], s[0:3], s[3:6], S.G)
    return ("sun", (a, e)) if enS < 0 else ("ejected", None)


def tide_vs_moon(d_km):
    """Tidal pull of the rogue at distance d, in units of the Moon's tidal pull today."""
    return (M_ROGUE_KG / M_MOON_KG) * (D_MOON_KM / d_km) ** 3


def sky_size_deg(d_km):
    return np.degrees(2 * np.arctan(R_ROGUE_KM / d_km))


def roche_km():
    """Fluid Roche limit of Earth around the rogue (where tides would tear a fluid Earth apart)."""
    rho_r = M_ROGUE_KG / (4 / 3 * np.pi * (R_ROGUE_KM * 1e3) ** 3)
    return 2.44 * R_ROGUE_KM * (rho_r / 5514.0) ** (1 / 3)


def speed_at(r_au):
    """The rogue's speed relative to the Sun at distance r (km/s)."""
    v = S.V_INF * S.KMS
    return np.sqrt(v ** 2 + 2 * S.G * (1 + S.M_ROGUE) / r_au) / S.KMS


def climate(a, e):
    q, Q = a * (1 - e), a * (1 + e)
    return dict(a=a, e=e, peri=q, aph=Q, year_days=a ** 1.5 * YR_D, flux_peri=1 / q ** 2, flux_aph=1 / Q ** 2,
                flux_mean=1 / (a * a * np.sqrt(1 - e * e)))


def year_table():
    p = os.path.join(S.CACHE, "year_0.5.json")
    if not os.path.exists(p):
        return None
    R = json.load(open(p))
    out = {}
    for r in R:
        out[r["fate"]] = out.get(r["fate"], 0) + 0.5
    out["moon_lost_at_pass"] = sum(0.5 for r in R if r["moon_lost"])
    return out


def window(fate, lo=-40, hi=40):
    """Contiguous day ranges with this fate in the fine calendar."""
    R = S.calendar()
    days = [r["day"] for r in R if r["fate"] == fate]
    if not days:
        return []
    runs, cur = [], [days[0], days[0]]
    for d in days[1:]:
        if d - cur[1] <= 0.26:
            cur[1] = d
        else:
            runs.append(tuple(cur)); cur = [d, d]
    runs.append(tuple(cur))
    return runs


if __name__ == "__main__":
    print(f"rogue: {S.M_ROGUE / S.MJ:.0f} Jupiter masses, {R_ROGUE_KM:,.0f} km radius, {S.V_INF} km/s far away, "
          f"{speed_at(1.0):.1f} km/s at 1 AU; Roche limit for Earth {roche_km():,.0f} km")
    print("warning time from 1,000 AU at the far-away speed:", f"{1000 / (S.V_INF * S.KMS):.0f} years")
    for name, d in [("EJECT", DAY_EJECT), ("KEEP", DAY_KEEP), ("SCORCH", DAY_SCORCH), ("MOON", DAY_MOON), ("FROZEN", DAY_FROZEN)]:
        dk, tk = closest(d)
        a, e = earth_orbit(d)
        print(f"\n== {name} (day {d:+}) closest {dk:,.0f} km at t={tk:+.2f} d; sky size {sky_size_deg(dk):.1f}°; "
              f"tide {tide_vs_moon(dk):,.0f}× the Moon's")
        if np.isfinite(a):
            c = climate(a, e)
            print("   orbit: " + ", ".join(f"{k}={v:.3f}" for k, v in c.items()))
        else:
            print(f"   ejected at {exit_speed(d):.2f} km/s")
        print("   moon:", moon_fate(d), "lost after", moon_lost_after(d), "days")
    for f in ("ejected", "frozen", "scorched", "changed"):
        print(f, window(f))
    print("year:", year_table())


def magnitude(day, t_rel_days):
    """Apparent magnitude of the rogue from Earth: Jupiter-like albedo, 1.1 Jupiter radii, simple phase term."""
    st = state(day, t_rel_days)
    r = np.linalg.norm(st["rogue"] - st["sun"])
    D = np.linalg.norm(st["rogue"] - st["earth"])
    a = np.degrees(np.arccos(np.clip(np.dot(st["sun"] - st["rogue"], st["earth"] - st["rogue"]) / (r * D), -1, 1)))
    H = -9.40 - 5 * np.log10(1.1)
    return H + 5 * np.log10(r * D) + 0.005 * a, D * AU_KM, a


def first_time(day, cond, t0=-900, t1=0, n=3000):
    for t in np.linspace(t0, t1, n):
        if cond(*magnitude(day, t)):
            return t
    return None
