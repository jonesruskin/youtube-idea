"""Episode 4 physics: what reaches one riverbank 3,050 km from Chicxulub, and when.

Everything the narration says about timing is computed here (and checked in claims.py):
  seismic   ray tracing of P and S waves through a layered spherical Earth (Snell's law on a sphere),
            Rayleigh waves along the surface at a typical group speed
  glass     ballistic flight of ejecta-curtain spherules (Kepler two-body, launch 30–60° above the horizon),
            then the plunge through the atmosphere (drag, exponential air) to the river
  light     the impact fireball/plume becomes visible above Tanis's horizon once it is higher than the
            geometric horizon height for that range
  sound     the far-field pressure wave at the speed of sound
Sources for the inputs are listed in script.META['sources'].
"""
import functools
import numpy as np
from scipy.integrate import solve_ivp, quad
from scipy.optimize import brentq

R_E = 6371.0                 # km
MU = 398600.4418             # km^3/s^2, Earth's GM
DIST_KM = 3050.0             # Tanis to the centre of Chicxulub, palaeo-distance (DePalma et al. 2019)
DELTA = DIST_KM / R_E        # range angle (rad)
ATM_TOP = 100.0              # km, "top of the atmosphere" for the ballistic leg
C_SOUND = 0.335              # km/s, mean speed of sound along a lower-atmosphere path (~ 7 °C)
RAYLEIGH_U = 3.9             # km/s, typical Rayleigh-wave group speed for long periods at this range
RHO_GLASS = 2600.0           # kg/m^3, impact glass
SOLAR = 1.0                  # kW/m^2, bright midday sunlight at the ground
REENTRY_PEAK = 6.0           # kW/m^2, Goldin & Melosh 2009 nominal peak irradiance at the ground
REENTRY_ABOVE_SUN_MIN = 25   # minutes above normal sunlight in that model


# ------------------------------------------------------------------------------------------------ seismic
# 1-D velocity model (km/s) close to IASP91/PREM in the crust and mantle (the rays at 27° never reach the core)
_LAYERS = [  # depth_top, depth_bot, vp_top, vp_bot
    (0, 20, 5.8, 5.8), (20, 35, 6.5, 6.5), (35, 210, 8.04, 8.30), (210, 410, 8.30, 9.03),
    (410, 660, 9.36, 10.20), (660, 1000, 10.79, 11.20), (1000, 2000, 11.20, 12.70), (2000, 2889, 12.70, 13.70)]
_VPVS = [(0, 35, 1.73), (35, 2889, 1.82)]


def _v(depth, wave="P"):
    for a, b, v0, v1 in _LAYERS:
        if a <= depth <= b:
            vp = v0 + (v1 - v0) * (depth - a) / (b - a)
            break
    else:
        vp = 13.7
    if wave == "P":
        return vp
    k = next(r for a, b, r in _VPVS if a <= depth <= b + 1e-9)
    return vp / k


@functools.lru_cache(maxsize=None)
def _ray_tables(wave):
    """Distance and travel time against ray parameter p (s/rad), by numerical integration on a fine radius grid."""
    r = np.linspace(R_E - 2880.0, R_E, 30000)
    v = np.array([_v(R_E - x, wave) for x in r])
    eta = r / v                                         # s/rad
    out = []
    for p in np.linspace(eta.min() * 1.0005, eta[-1] * 0.9995, 600):
        # turning radius: deepest point where eta(r) = p, coming down from the surface
        idx = np.where(eta < p)[0]
        i0 = idx.max() + 1 if len(idx) else 0
        rr, ee = r[i0:], eta[i0:]
        s = np.sqrt(np.maximum(ee ** 2 - p ** 2, 1e-12))
        dD = p / (rr * s)
        dT = ee ** 2 / (rr * s)
        D = 2 * np.trapezoid(dD, rr)
        T = 2 * np.trapezoid(dT, rr)
        out.append((p, D, T))
    return np.array(out)


def seismic_minutes(wave, delta=DELTA):
    """First-arrival travel time (minutes) of a P or S wave at range angle delta."""
    tab = _ray_tables(wave)
    D, T = tab[:, 1], tab[:, 2]
    ok = np.isfinite(D) & np.isfinite(T)
    D, T = D[ok], T[ok]
    # the first arrival at this range: smallest time among branches that reach it
    best = np.inf
    for i in range(len(D) - 1):
        a, b = D[i], D[i + 1]
        if (a - delta) * (b - delta) <= 0 and a != b:
            t = T[i] + (T[i + 1] - T[i]) * (delta - a) / (b - a)
            best = min(best, t)
    return best / 60.0


def rayleigh_minutes(dist=DIST_KM):
    return dist / RAYLEIGH_U / 60.0


# ------------------------------------------------------------------------------------------------ ballistic
def _kepler_flight(v, elev_deg, r_end=R_E + ATM_TOP):
    """Launch from the surface at speed v (km/s), elevation elev above the local horizon.
    Returns (range angle to the point where it comes back down to r_end, time of flight to there, entry speed, entry angle)."""
    r0 = R_E
    a_el = np.radians(elev_deg)
    h = r0 * v * np.cos(a_el)                           # specific angular momentum
    eps = v * v / 2 - MU / r0
    a = -MU / (2 * eps)
    e = np.sqrt(max(0.0, 1 + 2 * eps * h * h / MU ** 2))
    p = h * h / MU
    f0 = np.arccos(np.clip((p / r0 - 1) / e, -1, 1))    # true anomaly at launch (ascending, 0 < f0 < pi)
    f1 = np.arccos(np.clip((p / r_end - 1) / e, -1, 1)) # coming back down through r_end at 2*pi - f1
    dtheta = 2 * np.pi - f1 - f0
    Ean = lambda f: 2 * np.arctan(np.sqrt((1 - e) / (1 + e)) * np.tan(f / 2))
    E0, E1 = Ean(f0), Ean(f1)
    n = np.sqrt(MU / a ** 3)
    t = ((2 * np.pi - E1 + e * np.sin(E1)) - (E0 - e * np.sin(E0))) / n
    v_end = np.sqrt(2 * (eps + MU / r_end))
    gam = np.degrees(np.arccos(np.clip(h / (r_end * v_end), -1, 1)))   # angle below the local horizon
    return dtheta, t, v_end, gam


def _range_to_ground(v, elev):
    # range measured to where the trajectory would meet the ground (the atmosphere leg adds very little range)
    return _kepler_flight(v, elev, R_E)[0]


def launch_speed(elev_deg, delta=DELTA):
    return brentq(lambda v: _range_to_ground(v, elev_deg) - delta, 1.0, 7.8)


@functools.lru_cache(maxsize=None)
def ballistic(elev_deg):
    """Speed needed to reach Tanis, minutes until it is back at the top of the atmosphere overhead, entry speed/angle."""
    v = launch_speed(elev_deg)
    d, t, ve, g = _kepler_flight(v, elev_deg, R_E + ATM_TOP)
    return dict(v=v, minutes=t / 60.0, v_entry=ve, entry_deg=g, apex_km=_apex(v, elev_deg))


def _apex(v, elev):
    h = R_E * v * np.cos(np.radians(elev))
    eps = v * v / 2 - MU / R_E
    a = -MU / (2 * eps)
    e = np.sqrt(1 + 2 * eps * h * h / MU ** 2)
    return a * (1 + e) - R_E


def ballistic_window(lo=30.0, hi=60.0):
    ts = [ballistic(e)["minutes"] for e in np.linspace(lo, hi, 13)]
    return min(ts), max(ts)


# ------------------------------------------------------------------------------------------------ the plunge
def _air(h_km):
    """Air density (kg/m^3) and dynamic viscosity (Pa s), a two-scale-height fit to the standard atmosphere."""
    rho = 1.225 * np.exp(-h_km / 8.4) if h_km < 25 else 1.225 * np.exp(-25 / 8.4) * np.exp(-(h_km - 25) / 6.5)
    return rho, 1.8e-5


def _cd(Re):
    Re = max(Re, 1e-6)
    return 24 / Re * (1 + 0.15 * Re ** 0.687) + 0.42 / (1 + 4.25e4 * Re ** -1.16)


@functools.lru_cache(maxsize=None)
def plunge(d_mm, elev_deg=45.0):
    """Time (minutes) from the top of the atmosphere (100 km) to the ground for a glass sphere of diameter d_mm."""
    b = ballistic(elev_deg)
    d = d_mm * 1e-3
    m = RHO_GLASS * np.pi * d ** 3 / 6
    A = np.pi * d * d / 4
    g = 9.81
    vx0 = b["v_entry"] * 1e3 * np.cos(np.radians(b["entry_deg"]))
    vz0 = -b["v_entry"] * 1e3 * np.sin(np.radians(b["entry_deg"]))
    def rhs(t, y):
        x, z, vx, vz = y
        rho, mu = _air(z / 1e3)
        sp = np.hypot(vx, vz)
        Re = rho * sp * d / mu
        F = 0.5 * rho * _cd(Re) * A * sp
        return [vx, vz, -F * vx / m, -g - F * vz / m]
    hit = lambda t, y: y[1]
    hit.terminal, hit.direction = True, -1
    s = solve_ivp(rhs, (0, 10 * 3600), [0, ATM_TOP * 1e3, vx0, vz0], events=hit, rtol=1e-6, atol=1e-3, max_step=20.0)
    t_ground = s.t_events[0][0] if len(s.t_events[0]) else np.inf
    # where the fast part ends: speed below 100 m/s (glowing streak over, just falling)
    sp = np.hypot(s.y[2], s.y[3])
    k = np.argmax(sp < 100.0)
    return dict(minutes=t_ground / 60.0, slow_alt_km=s.y[1][k] / 1e3, slow_after_s=s.t[k],
                v_ground=float(sp[-1]))


def glass_on_river(d_mm=1.0, elev_deg=45.0):
    return ballistic(elev_deg)["minutes"] + plunge(d_mm, elev_deg)["minutes"]


def settle_in_water_s(d_mm=1.0, depth_m=3.0):
    """Seconds for a glass bead to sink through still river water (drag-balanced settling)."""
    d = d_mm * 1e-3
    rho_w, mu_w, g = 1000.0, 1.0e-3, 9.81
    f = lambda v: (RHO_GLASS - rho_w) * g * np.pi * d ** 3 / 6 - 0.5 * rho_w * _cd(rho_w * v * d / mu_w) * np.pi * d * d / 4 * v * v
    v = brentq(f, 1e-6, 5.0)
    return depth_m / v, v


# ------------------------------------------------------------------------------------------------ light / sound
def horizon_height_km(delta=DELTA):
    """How high something above the crater must be to rise over Tanis's horizon (straight-line sight, no refraction)."""
    return R_E * (1 / np.cos(delta) - 1)


def sound_hours(dist=DIST_KM):
    return dist / C_SOUND / 3600.0


def light_ms(dist=DIST_KM):
    return dist / 299792.458 * 1e3


# ------------------------------------------------------------------------------------------------ the arrival clock
def clock():
    """Every arrival at Tanis, in minutes after impact (central values)."""
    lo, hi = ballistic_window()
    return dict(
        light=light_ms() / 60000.0,
        P=seismic_minutes("P"), S=seismic_minutes("S"), rayleigh=rayleigh_minutes(),
        glass_overhead=ballistic(45.0)["minutes"], glass_overhead_lo=lo, glass_overhead_hi=hi,
        glass_on_river_1mm=glass_on_river(1.0), glass_on_river_03mm=glass_on_river(0.3),
        glass_on_river_14mm=glass_on_river(1.4), sound=sound_hours() * 60.0,
    )


if __name__ == "__main__":
    print("horizon height km", round(horizon_height_km(), 1))
    print("P", seismic_minutes("P"), "S", seismic_minutes("S"), "Rayleigh", rayleigh_minutes())
    for e in (30, 45, 60):
        print("elev", e, ballistic(e))
    print("window", ballistic_window())
    for dmm in (0.3, 0.7, 1.0, 1.4):
        print("plunge", dmm, plunge(dmm), "total", glass_on_river(dmm))
    print("settle", settle_in_water_s(1.0), settle_in_water_s(0.3))
    print("sound h", sound_hours(), "light ms", light_ms())


# ------------------------------------------------------------------------------------------------ paths for drawing
@functools.lru_cache(maxsize=None)
def ray_path(wave, delta=DELTA, n=200):
    """(theta, r) points of the first-arrival ray from the crater (theta=0) to Tanis (theta=delta)."""
    tab = _ray_tables(wave)
    D, P_ = tab[:, 1], tab[:, 0]
    i = int(np.argmin(np.abs(D - delta)))
    p = P_[i]
    r = np.linspace(R_E - 2880.0, R_E, 30000)
    v = np.array([_v(R_E - x, wave) for x in r])
    eta = r / v
    idx = np.where(eta < p)[0]
    i0 = idx.max() + 1 if len(idx) else 0
    rr, ee = r[i0:], eta[i0:]
    s = np.sqrt(np.maximum(ee ** 2 - p ** 2, 1e-12))
    dth = p / (rr * s)
    th = np.concatenate([[0], np.cumsum(0.5 * (dth[1:] + dth[:-1]) * np.diff(rr))])   # from the turning point up
    half = th[-1]
    th_down = half - th[::-1]                                        # crater side, descending
    r_down = rr[::-1]
    th_all = np.concatenate([th_down, half + th[1:]])
    r_all = np.concatenate([r_down, rr[1:]])
    th_all = th_all * delta / th_all[-1]
    k = np.linspace(0, len(th_all) - 1, n).astype(int)
    return th_all[k], r_all[k]


@functools.lru_cache(maxsize=None)
def arc_path(elev_deg, n=160):
    """(theta, r) of the ballistic arc from the crater to where it re-enters over Tanis; with times (s)."""
    v = launch_speed(elev_deg)
    r0 = R_E
    a_el = np.radians(elev_deg)
    h = r0 * v * np.cos(a_el)
    eps = v * v / 2 - MU / r0
    a = -MU / (2 * eps)
    e = np.sqrt(1 + 2 * eps * h * h / MU ** 2)
    p = h * h / MU
    f0 = np.arccos(np.clip((p / r0 - 1) / e, -1, 1))
    f1 = np.arccos(np.clip((p / (R_E + ATM_TOP) - 1) / e, -1, 1))
    f = np.linspace(f0, 2 * np.pi - f1, n)
    r = p / (1 + e * np.cos(f))
    Ean = lambda ff: 2 * np.arctan(np.sqrt((1 - e) / (1 + e)) * np.tan(ff / 2))
    E = np.where(f <= np.pi, Ean(f), 2 * np.pi + Ean(f - 2 * np.pi))
    Mn = E - e * np.sin(E)
    nmo = np.sqrt(MU / a ** 3)
    tt = (Mn - Mn[0]) / nmo
    return f - f0, r, tt
