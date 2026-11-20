"""THE NUMBERS for Episode 5, all from real data or our own physics. `python -m ep_apophis.model` prints them.

Data: JPL Horizons (solution as of Nov 2026), downloaded once into ep_apophis/data/ so every render is reproducible
offline:
  apophis_geo.csv     Apophis, geocentric ICRF vectors, every 2 min, 12-15 April 2029 (km, km/s)
  sun_geo.csv/moon    the Sun and the Moon, geocentric, hourly on 13 April 2029
  elements.csv        heliocentric osculating elements on 1 March and 1 June 2029 (before / after)
  apophis_helio.csv   heliocentric ecliptic vectors (AU), every 2 days, April 2028 - June 2030; earth_helio.csv the same for Earth
  obs_lisbon.csv      the sky from Lisbon: azimuth, altitude, magnitude, every 2 min (13 April, 18:00-24:00 UTC)
Our physics on top: the flyby re-flown as a two-body hyperbola (check), the bend of the path, tides on the
asteroid, its feeble gravity (a dropped pebble, escape speed), satellite shells for comparison.
"""
import os, functools
import numpy as np

D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
GM_E = 398600.4418          # km^3/s^2
R_E = 6371.0                # km (mean)
R_EQ = 6378.137
GEO_ALT = 35786.0           # geostationary altitude, km
GPS_ALT = 20200.0
ISS_ALT = 420.0
MOON_KM = 384400.0
G = 6.674e-11

# Apophis, the body (sources in script.py): mean diameter ~340 m (NASA), radar shape elongated and two-lobed,
# about 450 m long; density assumed 2.6 g/cm^3 (S/Sq-type rubble pile, as in the tidal studies)
DIAM_M = 340.0
LONG_M = 450.0
RHO = 2600.0
SPIN_H = 264.18             # Lee et al. 2022 (via Hirabayashi 2025): spin 264.18 h, precession 27.3855 h (tumbler)
PREC_H = 27.3855
EIFFEL_M = 330.0
YARKOVSKY_M_PER_YR = 170.0  # drift from the purely gravitational orbit (Tholen/Farnocchia, Univ. of Hawaii 2020)
KEYHOLE_M = 610.0           # the 2036 keyhole width (Farnocchia et al. 2013, ~600 m)


def _csv(name):
    rows = []
    for line in open(os.path.join(D, name)):
        line = line.strip()
        if not line or line.startswith("$$"):
            continue
        rows.append([x.strip() for x in line.split(",")])
    return rows


def _month(s):
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].index(s) + 1


@functools.lru_cache(None)
def geo():
    """(t_hours_from_2029-04-13_00:00_TDB, xyz km, v km/s) for Apophis."""
    r = _csv("apophis_geo.csv")
    jd = np.array([float(x[0]) for x in r])
    t = (jd - 2462239.5) * 24.0
    p = np.array([[float(x[2]), float(x[3]), float(x[4])] for x in r])
    v = np.array([[float(x[5]), float(x[6]), float(x[7])] for x in r])
    return t, p, v


@functools.lru_cache(None)
def closest():
    """Refine the closest approach with a cubic spline through the samples."""
    from scipy.interpolate import CubicSpline
    t, p, v = geo()
    cs = CubicSpline(t, p)
    tt = np.linspace(t[0], t[-1], 400000)
    d = np.linalg.norm(cs(tt), axis=1)
    i = int(np.argmin(d))
    return float(tt[i]), float(d[i]), np.linalg.norm(cs(tt[i], 1)) / 3600.0


def pos_at(h):
    """Apophis geocentric position (km) at hours after 13 April 2029 00:00 TDB."""
    from scipy.interpolate import CubicSpline
    t, p, _ = geo()
    return _spline()(h)


@functools.lru_cache(None)
def _spline():
    from scipy.interpolate import CubicSpline
    t, p, _ = geo()
    return CubicSpline(t, p)


def dist_at(h):
    return float(np.linalg.norm(pos_at(h)))


def alt_at(h):
    return dist_at(h) - R_E


def hhmm(h):
    hh = int(np.floor(h)) % 24
    mm = int(round((h - np.floor(h)) * 60))
    if mm == 60:
        hh, mm = (hh + 1) % 24, 0
    return f"{hh:02d}:{mm:02d}"


@functools.lru_cache(None)
def vinf():
    """Speed far from Earth (start of the data, ~34 h before) and the bend of the path (angle between the incoming
    and outgoing velocity, end to end)."""
    t, p, v = geo()
    v_in, v_out = v[0], v[-1]
    ang = np.degrees(np.arccos(np.dot(v_in, v_out) / np.linalg.norm(v_in) / np.linalg.norm(v_out)))
    return float(np.linalg.norm(v_in)), float(np.linalg.norm(v_out)), float(ang)


def hyperbola_check():
    """Two-body check: from v_inf and the perigee distance the hyperbolic turn angle is 2*asin(1/e)."""
    vi, vo, ang = vinf()
    _, rp, vp = closest()
    v_inf = np.sqrt(max(vp ** 2 - 2 * GM_E / rp, 1e-9))
    e = 1 + rp * v_inf ** 2 / GM_E
    return float(v_inf), float(e), float(np.degrees(2 * np.arcsin(1 / e)))


@functools.lru_cache(None)
def elements():
    """Before (1 Mar 2029) and after (1 Jun 2029): e, i, a (AU), period (days)."""
    out = []
    for x in _csv("elements.csv"):
        e, inc = float(x[2]), float(x[4])
        a_au = float(x[11]) / 149597870.7
        per_d = float(x[13]) / 86400.0
        q_au = float(x[3]) / 149597870.7
        Q_au = float(x[12]) / 149597870.7
        out.append(dict(e=e, i=inc, a=a_au, P=per_d, q=q_au, Q=Q_au))
    return out


@functools.lru_cache(None)
def helio():
    """Heliocentric ecliptic positions (AU): days from 2029-04-13, apophis xyz, earth xyz."""
    ra, re_ = _csv("apophis_helio.csv"), _csv("earth_helio.csv")
    jd = np.array([float(x[0]) for x in ra])
    a = np.array([[float(x[2]), float(x[3]), float(x[4])] for x in ra])
    e = np.array([[float(x[2]), float(x[3]), float(x[4])] for x in re_])
    return jd - 2462239.5, a, e


def orbit_ellipse(el, n=720, omega=None, node=None, argp=None):
    """Points of a Keplerian ellipse in its own plane (AU), perihelion on +x."""
    nu = np.linspace(0, 2 * np.pi, n)
    a, e = el["a"], el["e"]
    r = a * (1 - e * e) / (1 + e * np.cos(nu))
    return np.stack([r * np.cos(nu), r * np.sin(nu)], -1)


def inside_share(el):
    """Fraction of the orbit (by time) spent closer to the Sun than 1 AU."""
    a, e = el["a"], el["e"]
    M = np.linspace(0, 2 * np.pi, 20000, endpoint=False)
    E = M.copy()
    for _ in range(30):
        E = E - (E - e * np.sin(E) - M) / (1 - e * np.cos(E))
    r = a * (1 - e * np.cos(E))
    return float(np.mean(r < 1.0))


# ─────────────────────────────────────── the asteroid as a place ───────────────────────────────────────
def mass_kg():
    r = DIAM_M / 2
    return 4 / 3 * np.pi * r ** 3 * RHO


def surface_g():
    return G * mass_kg() / (DIAM_M / 2) ** 2


def escape_ms():
    return float(np.sqrt(2 * G * mass_kg() / (DIAM_M / 2)))


def drop_seconds(h=1.5):
    return float(np.sqrt(2 * h / surface_g()))


def weight_grams(kg=70.0):
    """What a person's weight on Apophis would weigh on Earth (grams)."""
    return kg * surface_g() / 9.81 * 1000.0


def tidal_ms2(d_km=None):
    """Earth's tidal acceleration across the asteroid's long half-length at distance d (centre to centre)."""
    if d_km is None:
        d_km = closest()[1]
    return 2 * GM_E * 1e9 * (LONG_M / 2) / (d_km * 1e3) ** 3


def tide_share():
    """Tidal pull at closest approach, as a fraction of the asteroid's own surface gravity."""
    return tidal_ms2() / surface_g()


def earth_angle_deg(d_km=None):
    """Angular diameter of Earth seen from Apophis."""
    if d_km is None:
        d_km = closest()[1]
    return float(np.degrees(2 * np.arcsin(R_E / d_km)))


def moon_widths(d_km=None):
    return earth_angle_deg(d_km) / 0.52


# ─────────────────────────────────────── the sky from Lisbon ───────────────────────────────────────
@functools.lru_cache(None)
def lisbon():
    """(hours UTC on 13 April, azimuth, altitude, apparent magnitude)"""
    out = []
    for x in _csv("obs_lisbon.csv"):
        d, hm = x[0].split()
        hh, mm = map(int, hm.split(":"))
        h = hh + mm / 60 + (24 if d.endswith("14") else 0)
        mag = float(x[5]) if x[5] not in ("n.a.", "") else np.nan
        out.append((h, float(x[3]), float(x[4]), mag))
    return np.array(out)


def lisbon_rate_deg_per_min(h=None):
    L = lisbon()
    i = int(np.nanargmax(L[:, 2])) if h is None else int(np.argmin(np.abs(L[:, 0] - h)))
    i = min(max(i, 1), len(L) - 2)
    a1, e1, a2, e2 = map(np.radians, (L[i - 1, 1], L[i - 1, 2], L[i + 1, 1], L[i + 1, 2]))
    c = np.sin(e1) * np.sin(e2) + np.cos(e1) * np.cos(e2) * np.cos(a2 - a1)
    return float(np.degrees(np.arccos(np.clip(c, -1, 1))) / ((L[i + 1, 0] - L[i - 1, 0]) * 60))


def sub_point(h):
    """Latitude/longitude below the asteroid (Earth rotation by GMST), degrees."""
    p = pos_at(h)
    jd = 2462239.5 + h / 24.0
    T = (jd - 2451545.0) / 36525.0
    gmst = (280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T) % 360
    ra = np.degrees(np.arctan2(p[1], p[0]))
    dec = np.degrees(np.arcsin(p[2] / np.linalg.norm(p)))
    lon = ((ra - gmst + 180) % 360) - 180
    return float(dec), float(lon)


@functools.lru_cache(None)
def sun_dir():
    """Unit vector Earth -> Sun (geocentric ICRF) at 13 April 2029 21:45."""
    r = _csv("sun_geo.csv")
    p = np.array([float(x) for x in r[21][2:5]]) * (15 / 60) + np.array([float(x) for x in r[22][2:5]]) * (45 / 60)
    return p / np.linalg.norm(p)


def earth_tide_m():
    """Height of the ocean tide Apophis raises on Earth at closest approach (equilibrium tide)."""
    d = closest()[1] * 1e3
    return mass_kg() / 5.972e24 * (R_E * 1e3 / d) ** 3 * R_E * 1e3


def earthlight_x_fullmoon():
    """Earthlight on Apophis at closest (Earth half lit, albedo 0.30) vs full moonlight on Earth (albedo 0.12)."""
    return (earth_angle_deg() / 0.52) ** 2 * (0.30 / 0.12) / np.pi


if __name__ == "__main__":
    tc, dc, vc = closest()
    print(f"closest approach  13 Apr 2029 {hhmm(tc)} TDB (~{hhmm(tc - 69.2 / 3600)} UTC)  centre {dc:,.0f} km  surface {dc - R_E:,.0f} km  speed {vc:.2f} km/s")
    print(f"  vs geostationary altitude {GEO_ALT:,.0f} km: {GEO_ALT - (dc - R_E):,.0f} km lower;  Moon distance / {MOON_KM / dc:.1f}")
    vi, vo, ang = vinf()
    print(f"speed 34 h before {vi:.2f} km/s, 34 h after {vo:.2f} km/s; path bent by {ang:.1f} deg (data, end to end)")
    vinf_, e, turn = hyperbola_check()
    print(f"  two-body check: v_inf {vinf_:.2f} km/s, e {e:.2f}, turn {turn:.1f} deg")
    b, a = elements()
    print(f"orbit before: a {b['a']:.4f} AU, e {b['e']:.3f}, i {b['i']:.2f}, year {b['P']:.1f} d, inside 1 AU {inside_share(b):.0%} of the time")
    print(f"orbit after : a {a['a']:.4f} AU, e {a['e']:.3f}, i {a['i']:.2f}, year {a['P']:.1f} d, inside 1 AU {inside_share(a):.0%} of the time")
    print(f"mass {mass_kg():.2e} kg  surface g {surface_g():.2e} m/s2  escape {escape_ms() * 100:.0f} cm/s  70 kg weighs {weight_grams():.2f} g  "
          f"1.5 m drop {drop_seconds():.0f} s")
    print(f"tide at closest {tidal_ms2():.2e} m/s2 = {tide_share():.1%} of its own gravity; Earth from Apophis {earth_angle_deg():.1f} deg = {moon_widths():.0f} full Moons")
    L = lisbon()
    up = L[L[:, 2] > 0]
    print(f"Lisbon: rises {hhmm(up[0, 0])} UTC at az {up[0, 1]:.0f}; max alt {np.nanmax(L[:, 2]):.0f} deg at {hhmm(L[np.nanargmax(L[:, 2]), 0])}; "
          f"brightest mag {np.nanmin(L[:, 3]):.1f} at {hhmm(L[np.nanargmin(L[:, 3]), 0])}; rate {lisbon_rate_deg_per_min():.2f} deg/min")
    for h in (19.0, 20.0, 20.5, 21.0, 21.5, tc, 22.5, 23.0):
        print(f"  {hhmm(h)}  sub-point {sub_point(h)}  alt {alt_at(h):,.0f} km")
