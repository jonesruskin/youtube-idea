"""N-body simulation: a 10-solar-mass black hole crossing the Solar System.
Units: AU, years, solar masses (G = 4π²). Planar (ecliptic) for clarity; Sun and BH interact, planets are test particles."""
import os, json
import numpy as np
from scipy.integrate import solve_ivp
from .core import CACHE

G = 4 * np.pi ** 2
M_SUN, M_BH = 1.0, 10.0
V_INF = 45.0 / 4.74047  # 45 km/s in AU/yr
Q = 1.0                 # Sun–BH periapsis distance (AU)
T0, T1 = -32.0, 4.0
PLANETS = [  # name, a (AU), encounter angular offset (deg) relative to the BH at radius crossing (None = free phase)
    ("Mercury", 0.387, None, 40), ("Venus", 0.723, None, 200), ("Earth", 1.0, "earth", 0),
    ("Mars", 1.524, None, 300), ("Jupiter", 5.203, 9.0, 0), ("Saturn", 9.537, 16.0, 0),
    ("Uranus", 19.19, 55.0, 0), ("Neptune", 30.07, 2.2, 0),
]


def _twobody_state(t):
    """Exact Sun–BH relative state (BH − Sun) at time t (t=0 at periapsis), hyperbolic Kepler orbit."""
    mu = G * (M_SUN + M_BH)
    ah = mu / V_INF ** 2
    e = 1 + Q / ah
    n = np.sqrt(mu / ah ** 3)
    Mm = n * t
    Hh = np.arcsinh(Mm / e)
    for _ in range(80):
        Hh -= (e * np.sinh(Hh) - Hh - Mm) / (e * np.cosh(Hh) - 1)
    x = ah * (e - np.cosh(Hh))
    y = ah * np.sqrt(e * e - 1) * np.sinh(Hh)
    dH = n / (e * np.cosh(Hh) - 1)
    vx = -ah * np.sinh(Hh) * dH
    vy = ah * np.sqrt(e * e - 1) * np.cosh(Hh) * dH
    ang = np.radians(-118)
    c, s_ = np.cos(ang), np.sin(ang)
    return np.array([c * x - s_ * y, s_ * x + c * y]), np.array([c * vx - s_ * vy, s_ * vx + c * vy])


def _bh_angle_at_radius(R):
    ts = np.linspace(T0, 0, 40000)
    rs = np.array([np.linalg.norm(_twobody_state(t)[0]) for t in ts])
    i = np.argmin(np.abs(rs - R))
    p = _twobody_state(ts[i])[0]
    return ts[i], np.arctan2(p[1], p[0])


def _deriv(t, s, npl):
    # s = [sun x,y,vx,vy, bh x,y,vx,vy, planets...]
    out = np.empty_like(s)
    sun, bh = s[0:2], s[4:6]
    d = bh - sun
    r3 = np.linalg.norm(d) ** 3
    out[0:2], out[4:6] = s[2:4], s[6:8]
    out[2:4] = G * M_BH * d / r3
    out[6:8] = -G * M_SUN * d / r3
    P = s[8:].reshape(npl, 4)
    o = out[8:].reshape(npl, 4)
    o[:, 0:2] = P[:, 2:4]
    ds = sun - P[:, 0:2]
    db = bh - P[:, 0:2]
    o[:, 2:4] = G * M_SUN * ds / (np.linalg.norm(ds, axis=1) ** 3)[:, None] + G * M_BH * db / (np.maximum(np.linalg.norm(db, axis=1), 1e-4) ** 3)[:, None]
    return out


def simulate(earth_offset_deg=-90.0):
    # initial Sun–BH relative state; put barycentre at rest at the origin
    r, v = _twobody_state(T0)
    mt = M_SUN + M_BH
    sun_p, bh_p = -r * M_BH / mt, r * M_SUN / mt
    sun_v, bh_v = -v * M_BH / mt, v * M_SUN / mt
    st = [*sun_p, *sun_v, *bh_p, *bh_v]
    for name, a, off, free in PLANETS:
        n = 2 * np.pi / a ** 1.5
        if off is None:
            th0 = np.radians(free)
        else:
            o = earth_offset_deg if off == "earth" else off
            tk, angk = _bh_angle_at_radius(a)
            th0 = angk + np.radians(o) - n * (tk - T0)
        vc = np.sqrt(G * M_SUN / a)
        p = sun_p + a * np.array([np.cos(th0), np.sin(th0)])
        vv = sun_v + vc * np.array([-np.sin(th0), np.cos(th0)])
        st += [*p, *vv]
    st = np.array(st)
    ts = np.unique(np.concatenate([np.linspace(T0, T1, 6000), np.linspace(-1.0, 1.0, 8000), np.linspace(-0.15, 0.15, 6000)]))
    sol = solve_ivp(_deriv, (T0, T1), st, t_eval=ts, args=(len(PLANETS),), method="DOP853", rtol=1e-10, atol=1e-12)
    return sol.t, sol.y


def load():
    p = os.path.join(CACHE, "sim_v1.npz")
    if not os.path.exists(p):
        t, y = simulate()
        np.savez(p, t=t, y=y)
    d = np.load(p)
    return Sim(d["t"], d["y"])


class Sim:
    names = [p[0] for p in PLANETS]

    def __init__(self, t, y):
        self.t, self.y = t, y

    def _interp(self, k, t):
        return np.array([np.interp(t, self.t, self.y[k]), np.interp(t, self.t, self.y[k + 1])])

    def sun(self, t):
        return self._interp(0, t)

    def bh(self, t):
        return self._interp(4, t)

    def planet(self, i, t):
        return self._interp(8 + 4 * i, t)

    def planet_v(self, i, t):
        return self._interp(10 + 4 * i, t)

    def sun_v(self, t):
        return self._interp(2, t)

    def fate(self, i):
        t = self.t[-1]
        r = self.planet(i, t) - self.sun(t)
        v = self.planet_v(i, t) - self.sun_v(t)
        e = 0.5 * v @ v - G * M_SUN / np.linalg.norm(r)
        return "ejected" if e > 0 else "bound", float(np.linalg.norm(r))


if __name__ == "__main__":
    s = load()
    for i, n in enumerate(Sim.names):
        d = np.min(np.linalg.norm(np.array([s.planet(i, t) - s.bh(t) for t in s.t]), axis=1))
        print(n, s.fate(i), "min dist to BH %.3f AU" % d)
