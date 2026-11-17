"""Story-logic checks for the rogue-planet episode: every number in the narration and HUD, verified against the
N-body runs (tools/qa.py <ep> pre runs CHECKS; docs/QUALITY_GATE.md #13)."""
import json, os
import numpy as np
from ep_rogue import model as M, sim as S

AU = M.AU_KM


def _year():
    R = json.load(open(os.path.join(S.CACHE, "year_0.5.json")))
    n = len(R)
    c = {}
    for r in R:
        c[r["fate"]] = c.get(r["fate"], 0) + 1
    return {k: v / n for k, v in c.items()}, R


def odds_three_in_four_one_in_six_one_in_ten():
    f, _ = _year()
    bad = f.get("scorched", 0) + f.get("frozen", 0) + f.get("ejected", 0) + f.get("hit", 0)
    ok = 0.70 < f["same"] < 0.78 and 0.13 < f["changed"] < 0.19 and 0.08 < bad < 0.12
    return ok, f"same {f['same']:.1%}, changed {f['changed']:.1%}, world-ending {bad:.1%}"


def same_means_days_changed_means_weeks():
    _, R = _year()
    s = [abs(r["a"] ** 1.5 - 1) * 365.25 for r in R if r["fate"] == "same"]
    c = [abs(r["a"] ** 1.5 - 1) * 365.25 for r in R if r["fate"] == "changed"]
    return max(s) < 12 and min(c) > 7 and max(c) > 60, f"'same' year shift ≤ {max(s):.1f} d; 'changed' {min(c):.0f}–{max(c):.0f} d"


def ejection_window_eleven_and_a_half_days():
    w = M.window("ejected")
    span_d = sum(b - a + 0.25 for a, b in w)
    return len(w) == 1 and 11.0 <= span_d <= 12.25, f"windows {w}, total {span_d:.2f} days"


def fates_in_calendar_order():
    """Earlier arrival (Earth already past) → closer; later (rogue ahead of Earth) → farther; the middle → thrown out."""
    sc, fr, ej = M.window("scorched"), M.window("frozen"), M.window("ejected")
    ok = sc[0][1] < ej[0][0] < ej[0][1] < max(b for a, b in fr) and any(a > ej[0][1] for a, b in fr)
    return ok, f"closer {sc}, thrown out {ej}, farther {fr}"


def _side(day):
    sol, tp = M.run(day)
    ts = np.linspace(tp - 0.2, tp + 0.2, 40001)
    y = sol.sol(ts)
    d = np.linalg.norm(y[M.IE:M.IE + 3] - y[6:9], axis=0)
    i = int(d.argmin())
    return np.dot(y[6:9, i] - y[M.IE:M.IE + 3, i], y[M.IE + 3:M.IE + 6, i]) > 0


def closer_rogue_passes_behind():
    return (not _side(M.DAY_SCORCH)) and M.DAY_SCORCH < -10, f"day {M.DAY_SCORCH}: rogue crosses behind Earth (≈ two weeks after Earth went by)"


def farther_rogue_passes_in_front():
    return _side(M.DAY_FROZEN) and 6 < M.DAY_FROZEN < 15, f"day {M.DAY_FROZEN}: rogue crosses in front (a week or two before Earth gets there)"


def closer_orbit_numbers():
    c = M.climate(*M.earth_orbit(M.DAY_SCORCH))
    ok = (275 < c["year_days"] < 290 and 0.70 < c["peri"] < 0.723 and 1.9 < c["flux_peri"] < 2.1
          and 1.40 < c["flux_mean"] < 1.5 and 0.38 < 1 / c["peri"] - 1 < 0.45)
    return ok, f"year {c['year_days']:.0f} d, perihelion {c['peri']:.3f} AU (Venus 0.723), {c['flux_peri']:.2f}× sunlight, mean {c['flux_mean']:.2f}×, Sun {100 * (1 / c['peri'] - 1):.0f}% wider"


def moon_fate_numbers():
    dk, _ = M.closest(M.DAY_MOON)
    a, e = M.earth_orbit(M.DAY_MOON)
    t = M.moon_lost_after(M.DAY_MOON)
    fate, orb = M.moon_fate(M.DAY_MOON)
    ok = (9.8e6 < dk < 10.8e6 and 26 < dk / M.D_MOON_KM < 28 and a * (1 - e) < 0.723 and t is not None and 120 < t < 126
          and fate == "sun" and abs(M.DAY_MOON - M.DAY_SCORCH) >= 4 and abs(M.DAY_MOON - M.DAY_SCORCH) < 5)
    return ok, f"closest {dk / 1e6:.2f} M km ({dk / M.D_MOON_KM:.0f}× the Moon), perihelion {a * (1 - e):.3f} AU, Moon lost after {t:.0f} d → orbits the {fate} (a={orb[0]:.2f} AU)"


def moon_not_lost_at_the_pass():
    """'not close enough to rip the Moon away … for four months nothing seems wrong': Moon still within 1.5 M km for 100 d."""
    t = M.moon_lost_after(M.DAY_MOON)
    return t > 100, f"the Moon stays with Earth for {t:.0f} days after the pass"


def moon_coin_toss():
    """On these dates the outcome depends on the Moon's phase at the pass (both outcomes occur)."""
    out = []
    for ph in (0.0, 2.1, 4.2):
        p = list(S.BASE_PHASES)
        p[2] = np.radians(-M.DAY_MOON * S.DEG_PER_DAY)
        st, tp = S.initial_state(S.STORY_Q, S.STORY_INC, S.STORY_NODE, p, moon=True, moon_phase=ph)
        st2, _ = S.initial_state(S.STORY_Q, S.STORY_INC, S.STORY_NODE, [*p[:2], np.radians(10 * S.DEG_PER_DAY), *p[3:]], moon=True, moon_phase=ph)
        for s0, day in ((st, M.DAY_MOON), (st2, -10.0)):
            sol = S.integrate(s0, tp, 3.0, moon_of=2, dense=True, rtol=1e-11)
            ts = np.linspace(tp, tp + 3.0, 6000)
            y = sol.sol(ts)
            d = np.linalg.norm(y[M.IM:M.IM + 3] - y[M.IE:M.IE + 3], axis=0) * AU
            out.append(bool((d > 1.5e6).any()))
    return (any(out) and not all(out)), f"Moon lost in {sum(out)} of {len(out)} phase/date combinations"


def farther_orbit_numbers():
    c = M.climate(*M.earth_orbit(M.DAY_FROZEN))
    y = c["year_days"]
    a, e = c["a"], c["e"]
    E = np.linspace(0, 2 * np.pi, 200001)
    r = a * (1 - e * np.cos(E))
    dM = np.gradient(E - e * np.sin(E))
    below_half = dM[r > np.sqrt(2)].sum() / dM.sum() * y
    above_half = y - below_half
    ok = (960 < y < 1000 and 2.15 < c["aph"] < 3.3 and c["aph"] > 1.524 and 2.7 < c["aph"] < 3.0 and 0.30 < 1 / c["aph"] < 0.37
          and 0.11 < c["flux_aph"] < 0.14 and c["flux_mean"] < 0.43 and c["flux_peri"] < 1.0 and below_half > 730.5 and 150 < above_half < 200)
    return ok, (f"year {y:.0f} d ({y / 365.25:.2f} yr), aphelion {c['aph']:.2f} AU (belt 2.15–3.3), Sun {1 / c['aph']:.2f}× as wide, "
                f"{c['flux_aph']:.3f}× light at aphelion, mean {c['flux_mean']:.2f} (Mars 0.43), perihelion {c['flux_peri']:.2f}, "
                f"< half for {below_half:.0f} d, ≥ half for {above_half:.0f} d")


def thrown_out_numbers():
    dk, _ = M.closest(M.DAY_EJECT)
    sz = M.sky_size_deg(dk)
    tide = M.tide_vs_moon(dk)
    margin = dk - M.roche_km()
    v = M.exit_speed(M.DAY_EJECT)
    ok = (205e3 < dk < 216e3 and dk < M.D_MOON_KM and 37 < sz < 40 and 70 < sz / 0.52 < 80 and 7.5e5 < tide < 8e5
          and 25e3 < margin < 35e3 and 39 < v < 41)
    return ok, f"closest {dk:,.0f} km, {sz:.1f}° wide ({sz / 0.52:.0f} full Moons), tide {tide:,.0f}×, {margin:,.0f} km outside the Roche limit, leaves at {v:.1f} km/s"


def thrown_out_after_two_years():
    st = M.state(M.DAY_EJECT, 2 * 365.25)
    r = np.linalg.norm(st["earth"] - st["sun"])
    return 15 < r < 19.2, f"{r:.1f} AU from the Sun after 2 years (Uranus 19.2 AU)"


def moon_flung_separately_on_worst_day():
    f, _ = M.moon_fate(M.DAY_EJECT)
    return f != "earth", f"worst day: Moon {f}"


def edge_of_window_keeps_moon():
    f, _ = M.moon_fate(M.DAY_KEEP)
    a, _ = M.earth_orbit(M.DAY_KEEP)
    return f == "earth" and not np.isfinite(a), f"day {M.DAY_KEEP}: Earth ejected, Moon {f}"


def encounter_about_two_weeks():
    sol, tp = M.run(M.DAY_EJECT)
    ts = np.linspace(tp - 0.1, tp + 0.1, 40001)
    y = sol.sol(ts)
    dR = np.linalg.norm(y[M.IE:M.IE + 3] - y[6:9], axis=0)
    dS = np.linalg.norm(y[M.IE:M.IE + 3] - y[0:3], axis=0)
    k = np.where(S.M_ROGUE / dR ** 2 > 0.5 / dS ** 2)[0]
    d = (ts[k[-1]] - ts[k[0]]) * 365.25
    return 11 < d < 17, f"rogue's pull > half the Sun's for {d:.1f} days"


def warning_and_sky_timeline():
    yrs = 1000 / (S.V_INF * S.KMS)
    eye = -M.first_time(M.DAY_EJECT, lambda m, D, a: m < 6, -6000, 0, 6000) / 365.25
    jup = -M.first_time(M.DAY_EJECT, lambda m, D, a: m < -2.7)
    ven = [-M.first_time(d, lambda m, D, a: m < -4.6) for d in (M.DAY_EJECT, 90.0)]
    moon = -M.first_time(M.DAY_EJECT, lambda m, D, a: M.sky_size_deg(D) > 0.52, -100, 0, 4000)
    ok = 200 < yrs < 260 and 7.0 < eye < 8.0 and 225 < jup < 270 and all(130 < v < 175 for v in ven) and 10 < moon < 16
    return ok, f"{yrs:.0f} yr warning; naked eye {eye:.1f} yr; > Jupiter {jup:.0f} d; > Venus {ven[0]:.0f}/{ven[1]:.0f} d; wider than the Moon {moon:.0f} d"


def masses_and_speeds():
    me = S.M_ROGUE / S.ME
    dd = 29.78 * 86400 / 1e6
    ok = 1550 < me < 1650 and 2.4 < dd < 2.7 and abs(S.STORY_Q - 1.0) < 1e-9 and 45 < M.speed_at(1.0) < 48
    return ok, f"{me:,.0f} Earth masses; Earth moves {dd:.2f} M km/day; passes the Sun at {S.STORY_Q} AU"


def encounter_rate_order_of_magnitude():
    pc_au = 206265.0
    n = 0.025
    b = 1 / pc_au
    v = S.V_INF * 1.0227e-6                    # km/s → pc/yr
    vesc = 42.1
    rate = n * np.pi * b * b * (1 + (vesc / S.V_INF) ** 2) * v
    ratio = (1 / rate) / 1.38e10
    return 1e5 < ratio < 1e6, f"one pass within 1 AU per {1 / rate:.1e} yr = {ratio:,.0f}× the age of the universe"


def tides_from_the_sun():
    a, e = M.earth_orbit(M.DAY_MOON)
    k = 0.46 / (a * (1 - e)) ** 3
    return 1.8 < k < 2.05 and k > 1, f"Sun's tide at the new perihelion = {k:.2f}× the Moon's today (today 0.46×)"


CHECKS = [odds_three_in_four_one_in_six_one_in_ten, same_means_days_changed_means_weeks, ejection_window_eleven_and_a_half_days,
          fates_in_calendar_order, closer_rogue_passes_behind, farther_rogue_passes_in_front, closer_orbit_numbers,
          moon_fate_numbers, moon_not_lost_at_the_pass, moon_coin_toss, farther_orbit_numbers, thrown_out_numbers,
          thrown_out_after_two_years, moon_flung_separately_on_worst_day, edge_of_window_keeps_moon, encounter_about_two_weeks,
          warning_and_sky_timeline, masses_and_speeds, encounter_rate_order_of_magnitude, tides_from_the_sun]

if __name__ == "__main__":
    for fn in CHECKS:
        ok, d = fn()
        print("PASS" if ok else "FAIL", fn.__name__, "—", d)
