"""Story-logic checks for Episode 5: every number in the narration and on screen, verified against the JPL Horizons
data and our physics in model.py (tools/qa.py <ep> pre runs CHECKS and LABEL_RULES)."""
import numpy as np
from ep_apophis import model as M


def closest_at_21_45_utc():
    tc, d, v = M.closest()
    utc = tc - 69.2 / 3600          # TDB - UTC in 2029 ~ 69.2 s
    return abs(utc - (21 + 45 / 60)) < 2 / 60, f"closest approach {M.hhmm(utc)} UTC"


def thirty_one_thousand_six_hundred_km_up():
    _, d, _ = M.closest()
    return abs((d - M.R_E) - 31600) < 150, f"{d - M.R_E:,.0f} km above the surface ('thirty-one thousand six hundred')"


def over_the_atlantic():
    lat, lon = M.sub_point(M.closest()[0])
    return 10 < lat < 45 and -60 < lon < -20, f"below it at closest: {lat:.1f} N, {lon:.1f} E (mid-Atlantic)"


def lower_than_geostationary():
    _, d, _ = M.closest()
    return d - M.R_E < M.GEO_ALT, f"{d - M.R_E:,.0f} km < geostationary {M.GEO_ALT:,.0f} km"


def a_tenth_of_the_way_to_the_moon():
    _, d, _ = M.closest()
    return 0.08 < d / M.MOON_KM < 0.12, f"{d / M.MOON_KM:.3f} of the Moon's distance"


def thirty_two_thousand_km_away():
    _, d, _ = M.closest()
    return 31000 < d - M.R_E < 33000, f"{d - M.R_E:,.0f} km ('thirty-two thousand kilometres away', rounded)"


def ring_crossed_well_north_and_never_nearer_than_6000_km():
    t, P, _ = M.geo()
    R = 42164.0
    d = np.hypot(np.hypot(P[:, 0], P[:, 1]) - R, P[:, 2])
    r = np.linalg.norm(P, axis=1)
    i = np.where(np.diff(np.sign(r - R)))[0]
    lats = [np.degrees(np.arcsin(P[k, 2] / r[k])) for k in i]
    return d.min() > 6000 and all(l > 10 for l in lats), f"nearest the GEO ring {d.min():,.0f} km; crosses its height at latitudes {[round(l) for l in lats]}"


def bent_twenty_seven_degrees():
    _, _, ang = M.vinf()
    _, _, turn = M.hyperbola_check()
    return abs(ang - 27) < 1.0 and abs(turn - ang) < 1.0, f"path bent {ang:.1f}° (two-body check {turn:.1f}°)"


def six_km_s_to_more_than_seven():
    vi, _, _ = M.vinf()
    _, _, vc = M.closest()
    return 5.5 < vi < 6.5 and 7.0 < vc < 8.0, f"{vi:.2f} km/s far away -> {vc:.2f} km/s at closest"


def year_323_then_423_days():
    b, a = M.elements()
    return abs(b["P"] - 323.5) < 1 and abs(a["P"] - 423.2) < 1, f"year {b['P']:.1f} -> {a['P']:.1f} days"


def mostly_inside_then_mostly_outside():
    b, a = M.elements()
    si, sa = M.inside_share(b), M.inside_share(a)
    return si > 0.5 and sa < 0.5, f"time inside 1 AU: {si:.0%} before, {sa:.0%} after"


def aten_then_apollo():
    b, a = M.elements()
    # Aten: a < 1 AU and aphelion > 0.983 AU; Apollo: a > 1 AU and perihelion < 1.017 AU
    return b["a"] < 1 < b["Q"] and a["a"] > 1 and a["q"] < 1.017, f"before a={b['a']:.3f} Q={b['Q']:.3f}; after a={a['a']:.3f} q={a['q']:.3f}"


def weighs_less_than_a_gram():
    g = M.weight_grams(70)
    return g < 1.0, f"70 kg weighs {g:.2f} g on Apophis (paper clip ~1 g)"


def pebble_takes_over_two_and_a_half_minutes():
    s = M.drop_seconds(1.5)
    return 150 < s < 180, f"1.5 m drop takes {s:.0f} s"


def escape_twenty_cm_per_second():
    v = M.escape_ms()
    return 0.17 < v < 0.23, f"escape speed {v * 100:.0f} cm/s"


def horizon_a_few_dozen_steps():
    d = np.sqrt(2 * (M.DIAM_M / 2) * 1.7)
    return 15 < d < 45, f"horizon for a 1.7 m eye on a 170 m sphere: {d:.0f} m (~{d / 0.75:.0f} steps)"


def tide_a_few_percent():
    s = M.tide_share()
    return 0.01 < s < 0.06, f"tide = {s:.1%} of the asteroid's own gravity"


def earth_nineteen_degrees_37_moons():
    a, m = M.earth_angle_deg(), M.moon_widths()
    return abs(a - 19.3) < 0.3 and 36 <= round(m) <= 38, f"Earth {a:.1f}° = {m:.0f} full Moons"


def night_side_first_then_half_lit():
    s = M.sun_dir()
    ph = lambda h: np.degrees(np.arccos(np.dot(M.pos_at(h) / np.linalg.norm(M.pos_at(h)), s)))
    early, close = ph(19.0), ph(M.closest()[0])
    return early > 140 and 80 < close < 110, f"phase angle (Sun-Earth-Apophis) {early:.0f}° at 19:00 (night side), {close:.0f}° at closest (half lit)"


def eiffel_tower_wide():
    return abs(M.DIAM_M - M.EIFFEL_M) / M.EIFFEL_M < 0.1, f"{M.DIAM_M:.0f} m mean diameter vs {M.EIFFEL_M:.0f} m tower"


def tumbles_daily_and_every_eleven_days():
    return abs(M.PREC_H / 24 - 1.1) < 0.2 and abs(M.SPIN_H / 24 - 11) < 0.5, f"precession {M.PREC_H / 24:.2f} d, rotation {M.SPIN_H / 24:.1f} d"


def lisbon_brightest_twenty_to_nine():
    L = M.lisbon()
    i = int(np.nanargmin(L[:, 3]))
    return abs(L[i, 0] - (20 + 40 / 60)) < 0.1 and L[i, 3] < 3.0 and L[i, 2] > 20, f"brightest mag {L[i, 3]:.1f} at {M.hhmm(L[i, 0])} UTC, altitude {L[i, 2]:.0f}°"


def lisbon_highest_two_thirds_up_in_the_south_at_twenty_past_nine():
    L = M.lisbon()
    i = int(np.nanargmax(L[:, 2]))
    return abs(L[i, 0] - (21 + 20 / 60)) < 0.1 and 0.62 < L[i, 2] / 90 < 0.78 and 135 < L[i, 1] < 225, f"highest {L[i, 2]:.0f}° ({L[i, 2] / 90:.0%} of the way up) at azimuth {L[i, 1]:.0f}°, {M.hhmm(L[i, 0])} UTC"


def lisbon_rises_in_the_east():
    L = M.lisbon()
    up = L[L[:, 2] > 0][0]
    return 60 < up[1] < 130, f"rises at azimuth {up[1]:.0f}° ({M.hhmm(up[0])} UTC)"


def fist_of_sky_in_ten_minutes_when_high():
    r = M.lisbon_rate_deg_per_min(None)      # at its highest over Lisbon (65°)
    return 8 <= 10 / r <= 12, f"{r:.2f}°/min at its highest: a 10° fist in {10 / r:.1f} min"


def keyhole_few_hundred_metres_hit_seven_years_later():
    return 100 <= M.KEYHOLE_M <= 900 and 2036 - 2029 == 7, f"2036 keyhole ~{M.KEYHOLE_M:.0f} m wide; 2036 - 2029 = 7 years"


def sunlight_drift_170_m_a_year():
    return M.YARKOVSKY_M_PER_YR == 170.0, "Yarkovsky drift ~170 m/yr (Univ. of Hawaii 2020)"


def tide_on_earth_a_few_atoms():
    h = M.earth_tide_m()
    return 1e-10 <= h <= 1e-9, f"tide raised on Earth {h * 1e10:.1f} angstrom (an atom is ~1-3 angstrom)"


def earthlight_a_thousand_full_moons():
    x = M.earthlight_x_fullmoon()
    return 700 <= x <= 1400, f"Earthlight on Apophis ~{x:.0f} x full moonlight"


def nearly_overhead_in_central_africa():
    # at 20:30 UTC the point below it is 4 N, 13 E (Cameroon/Gabon): straight overhead there
    lat, lon = M.sub_point(20.5)
    return -10 < lat < 10 and 5 < lon < 30, f"below it at 20:30 UTC: {lat:.1f} N, {lon:.1f} E"


def indian_ocean_to_the_americas():
    pts = [M.sub_point(h) for h in (19.0, 20.5, M.closest()[0], 23.0)]
    lons = [p[1] for p in pts]
    return lons[0] > 40 and 0 < lons[1] < 30 and lons[-1] < -90, f"below it: {[(round(a), round(b)) for a, b in pts]} (Indian Ocean, Africa, Atlantic, America)"


CHECKS = [closest_at_21_45_utc, thirty_one_thousand_six_hundred_km_up, over_the_atlantic, lower_than_geostationary,
          a_tenth_of_the_way_to_the_moon, thirty_two_thousand_km_away, ring_crossed_well_north_and_never_nearer_than_6000_km,
          bent_twenty_seven_degrees, six_km_s_to_more_than_seven, year_323_then_423_days, mostly_inside_then_mostly_outside,
          aten_then_apollo, weighs_less_than_a_gram, pebble_takes_over_two_and_a_half_minutes, escape_twenty_cm_per_second,
          horizon_a_few_dozen_steps, tide_a_few_percent, earth_nineteen_degrees_37_moons, night_side_first_then_half_lit,
          eiffel_tower_wide, tumbles_daily_and_every_eleven_days, lisbon_brightest_twenty_to_nine, lisbon_rises_in_the_east, lisbon_highest_two_thirds_up_in_the_south_at_twenty_past_nine,
          fist_of_sky_in_ten_minutes_when_high, indian_ocean_to_the_americas,
          keyhole_few_hundred_metres_hit_seven_years_later, sunlight_drift_170_m_a_year, tide_on_earth_a_few_atoms,
          earthlight_a_thousand_full_moons, nearly_overhead_in_central_africa]

# label placement (measured in the stills): (segment, label A, label B, reference): A must sit nearer the reference
LABEL_RULES = [
    ("c5b", "near end: pulled harder", "far end: pulled less", "EARTH"),
    ("c6a", "BEFORE: 323 days", "AFTER: 423 days", "SUN"),
]
