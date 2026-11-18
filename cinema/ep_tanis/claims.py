"""Story-logic checks for the Tanis episode: every timing and number in the narration, verified against model.py
(tools/qa.py <ep> pre runs CHECKS)."""
import numpy as np
from ep_tanis import model as M


def light_in_a_hundredth_of_a_second():
    ms = M.light_ms()
    return 5 <= ms <= 15, f"light crosses 3,050 km in {ms:.1f} ms"


def fireball_must_climb_over_800_km():
    h = M.horizon_height_km()
    return 800 <= h <= 850, f"horizon height for 3,050 km: {h:.0f} km ('more than eight hundred kilometres')"


def fireball_clears_horizon_in_a_minute_or_two():
    # the vapour plume expands upward at ~10 km/s or more (part of it reaches escape speed, Kring & Durda 2002)
    t = [M.horizon_height_km() / v / 60 for v in (7.0, 10.0, 15.0)]
    return 0.5 <= min(t) and max(t) <= 2.2, f"at 7–15 km/s the plume clears the horizon in {min(t):.1f}–{max(t):.1f} min"


def p_wave_at_five_minutes_forty_seven():
    p = M.seismic_minutes("P")
    mm, ss = int(p), round((p - int(p)) * 60)
    return abs(p - (5 + 47 / 60)) < 0.02 and abs(p - 6.0) < 0.5, f"P wave {p:.2f} min = {mm}:{ss:02d} (paper ~6)"


def s_wave_at_ten_and_a_half():
    s = M.seismic_minutes("S")
    return abs(s - 10.5) < 0.15 and abs(s - 10.0) < 1.0, f"S wave {s:.2f} min (paper ~10)"


def surface_waves_at_thirteen():
    r = M.rayleigh_minutes()
    return abs(r - 13.0) < 0.3, f"Rayleigh {r:.2f} min (paper ~13)"


def droplets_launched_at_five_km_s():
    v = [M.ballistic(e)["v"] for e in (30, 45, 60)]
    return 4.7 <= min(v) and max(v) <= 5.7, "launch speeds " + ", ".join(f"{x:.2f}" for x in v) + " km/s ('five kilometres per second')"


def hundreds_of_km_up():
    a = [M.ballistic(e)["apex_km"] for e in (30, 45, 60)]
    return min(a) > 200, "apex " + ", ".join(f"{x:.0f}" for x in a) + " km ('hundreds of kilometres above the planet')"


def back_overhead_twelve_to_twenty_five_minutes():
    lo, hi = M.ballistic_window()
    return 11.5 <= lo <= 13.0 and 24.0 <= hi <= 25.5, f"overhead {lo:.1f}–{hi:.1f} min for launch 30–60° (paper 13–25)"


def entry_at_about_five_km_s():
    v = [M.ballistic(e)["v_entry"] for e in (30, 45, 60)]
    return 4.5 <= min(v) and max(v) <= 5.5, "entry " + ", ".join(f"{x:.2f}" for x in v) + " km/s"


def streaks_burn_out_within_a_minute_or_two():
    s = [M.plunge(d)["slow_after_s"] for d in (0.7, 1.0, 1.4)]
    return max(s) <= 120, "below 100 m/s after " + ", ".join(f"{x:.0f}" for x in s) + " s (0.7, 1.0, 1.4 mm)"


def sand_grain_bead_takes_most_of_an_hour():
    t = M.plunge(1.0)["minutes"]
    return 40 <= t <= 60, f"1 mm bead: {t:.0f} min from 100 km to the ground"


def first_glass_on_the_river_about_fifty_five_minutes():
    # the biggest common beads (1.4 mm) from the 45–50° launch the paper assumes for most spherules
    t = [M.glass_on_river(1.4, e) for e in (45.0, 50.0)]
    return all(48 <= x <= 62 for x in t), "1.4 mm beads on the water at " + ", ".join(f"{x:.0f}" for x in t) + " min"


def smaller_beads_keep_falling_another_hour():
    t = M.glass_on_river(0.7)
    return t >= 100, f"0.7 mm beads arrive at {t:.0f} min (still falling more than an hour after the first)"


def sinks_fifteen_cm_per_second():
    _, v = M.settle_in_water_s(1.0)
    return 0.13 <= v <= 0.17, f"1 mm glass bead sinks at {v * 100:.1f} cm/s"


def sky_hotter_than_sun_for_half_an_hour():
    ok = M.REENTRY_ABOVE_SUN_MIN >= 20 and M.REENTRY_PEAK / M.SOLAR >= 3
    return ok, f"model input (Goldin & Melosh 2009): above sunlight ~{M.REENTRY_ABOVE_SUN_MIN} min, peak {M.REENTRY_PEAK / M.SOLAR:.0f}× ('several times')"


def quartz_overhead_about_thirty_eight_minutes():
    # shocked quartz launched steeply (70–79°): our Kepler arcs for 70° and 75°
    t = [M.ballistic(e)["minutes"] for e in (70.0, 75.0)]
    return 30 <= min(t) <= 45, "70° / 75° launch overhead at " + ", ".join(f"{x:.0f}" for x in t) + " min (paper: from ~38)"


def sound_after_two_hours_thirty_two():
    m = M.sound_hours() * 60
    return abs(m - 152) < 1.0, f"sound arrives {m:.1f} min = {int(m // 60)} h {m % 60:.0f} min"


def sound_is_last():
    c = M.clock()
    others = [c["P"], c["S"], c["rayleigh"], c["glass_overhead_hi"], c["glass_on_river_1mm"], c["glass_on_river_14mm"]]
    return c["sound"] > max(others) and c["sound"] < 18 * 60, f"sound {c['sound']:.0f} min vs latest other {max(others):.0f} min; tsunami ≥ 1080 min"


def order_of_arrivals():
    c = M.clock()
    seq = [c["light"], c["P"], c["S"], c["rayleigh"], c["glass_on_river_14mm"], c["sound"]]
    return all(a < b for a, b in zip(seq, seq[1:])), "light < P < S < Rayleigh < glass on the water < sound"


CHECKS = [light_in_a_hundredth_of_a_second, fireball_must_climb_over_800_km, fireball_clears_horizon_in_a_minute_or_two,
          p_wave_at_five_minutes_forty_seven, s_wave_at_ten_and_a_half, surface_waves_at_thirteen,
          droplets_launched_at_five_km_s, hundreds_of_km_up, back_overhead_twelve_to_twenty_five_minutes,
          entry_at_about_five_km_s, streaks_burn_out_within_a_minute_or_two, sand_grain_bead_takes_most_of_an_hour,
          first_glass_on_the_river_about_fifty_five_minutes, smaller_beads_keep_falling_another_hour,
          sinks_fifteen_cm_per_second, sky_hotter_than_sun_for_half_an_hour, quartz_overhead_about_thirty_eight_minutes,
          sound_after_two_hours_thirty_two, sound_is_last, order_of_arrivals]
