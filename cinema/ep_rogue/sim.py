"""Rogue planet through the Solar System: N-body simulation.

Units: AU, years, solar masses (G = 4π²). The Sun and the rogue interact with each other; the eight planets are test
particles; the Moon is a test particle around a massive Earth (only integrated when it matters).

Two products:
  monte_carlo()  thousands of passes with random geometry and random arrival dates → the odds of each fate for Earth
  story_run()    the one pass the episode follows, with every planet, for the diagrams
"""
import os, json
import numpy as np
from scipy.integrate import solve_ivp

G = 4 * np.pi ** 2
MJ = 9.546e-4                 # Jupiter mass in solar masses
ME = 3.003e-6                 # Earth mass in solar masses
KMS = 1 / 4.74047             # km/s → AU/yr
M_ROGUE = 5 * MJ              # five Jupiters
V_INF = 20.0                  # km/s relative to the Sun, far away (typical of nearby stars and their planets)
R_ROGUE = 0.000495            # AU, 1.1 Jupiter radii (a 5 MJ giant is about Jupiter's size)
R_START = 80.0                # AU: start of the integration on the incoming branch
PLANETS = [("Mercury", 0.387), ("Venus", 0.723), ("Earth", 1.0), ("Mars", 1.524),
           ("Jupiter", 5.203), ("Saturn", 9.537), ("Uranus", 19.19), ("Neptune", 30.07)]
A_MOON = 0.00257              # AU (384,400 km)
HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "..", "build", "ep_rogue")


def _rot(v, inc, node):
    ci, si, cn, sn = np.cos(inc), np.sin(inc), np.cos(node), np.sin(node)
    x, y, z = v
    y, z = y * ci - z * si, y * si + z * ci
    return np.array([x * cn - y * sn, x * sn + y * cn, z])


def rogue_start(q, inc, node, m_r=M_ROGUE, vinf=V_INF, r0=R_START):
    """Rogue–Sun relative state at distance r0 on the incoming branch, and the time until periapsis."""
    mu = G * (1 + m_r)
    v = vinf * KMS
    a = mu / v ** 2
    e = 1 + q / a
    p = a * (e * e - 1)
    nu = -np.arccos((p / r0 - 1) / e)
    r = p / (1 + e * np.cos(nu))
    h = np.sqrt(mu * p)
    pos = _rot(r * np.array([np.cos(nu), np.sin(nu), 0.0]), inc, node)
    vel = _rot(mu / h * np.array([-np.sin(nu), e + np.cos(nu), 0.0]), inc, node)
    F = np.arccosh((e + np.cos(nu)) / (1 + e * np.cos(nu)))
    tp = (e * np.sinh(F) - F) / np.sqrt(mu / a ** 3)
    return pos, vel, tp


def initial_state(q, inc, node, phases, tp_shift=0.0, m_r=M_ROGUE, moon=False, moon_phase=0.0):
    """phases: planet angles (rad) at the moment of the rogue's closest approach to the Sun (t = tp)."""
    pos, vel, tp = rogue_start(q, inc, node, m_r)
    mt = 1 + m_r
    sun_p, sun_v = -pos * m_r / mt, -vel * m_r / mt
    rog_p, rog_v = pos / mt, vel / mt
    st = [*sun_p, *sun_v, *rog_p, *rog_v]
    earth = None
    for (name, a), ph in zip(PLANETS, phases):
        n = 2 * np.pi / a ** 1.5
        th = ph - n * tp
        vc = np.sqrt(G / a)
        p = sun_p + a * np.array([np.cos(th), np.sin(th), 0.0])
        v = sun_v + vc * np.array([-np.sin(th), np.cos(th), 0.0])
        st += [*p, *v]
        if name == "Earth":
            earth = (p, v)
    if moon:
        nm = np.sqrt(G * ME / A_MOON ** 3)
        p = earth[0] + A_MOON * np.array([np.cos(moon_phase), np.sin(moon_phase), 0.0])
        v = earth[1] + A_MOON * nm * np.array([-np.sin(moon_phase), np.cos(moon_phase), 0.0])
        st += [*p, *v]
    return np.array(st), tp


def make_deriv(m_r, npl, moon_of=None):
    """moon_of: index of the planet the last test particle orbits (that planet gets Earth's mass for it)."""
    def f(t, s):
        o = np.empty_like(s)
        S, R = s[0:3], s[6:9]
        d = R - S
        r3 = np.dot(d, d) ** 1.5
        o[0:3], o[6:9] = s[3:6], s[9:12]
        o[3:6] = G * m_r * d / r3
        o[9:12] = -G * d / r3
        P = s[12:].reshape(-1, 6)
        O = o[12:].reshape(-1, 6)
        O[:, 0:3] = P[:, 3:6]
        dS = S - P[:, 0:3]
        dR = R - P[:, 0:3]
        nS = np.einsum("ij,ij->i", dS, dS) ** 1.5
        nR = np.maximum(np.einsum("ij,ij->i", dR, dR), 1e-12) ** 1.5
        O[:, 3:6] = G * dS / nS[:, None] + G * m_r * dR / nR[:, None]
        if moon_of is not None:
            dE = P[moon_of, 0:3] - P[-1, 0:3]
            O[-1, 3:6] += G * ME * dE / max(np.dot(dE, dE), 1e-14) ** 1.5
        return o
    return f


def integrate(st, tp, t_after, m_r=M_ROGUE, moon_of=None, dense=False, rtol=1e-10):
    npl = (len(st) - 12) // 6
    sol = solve_ivp(make_deriv(m_r, npl, moon_of), (0.0, tp + t_after), st, method="DOP853", rtol=rtol,
                    atol=rtol * 1e-2, dense_output=dense)
    return sol


def orbit_about(p, v, cp, cv, mu):
    r, w = p - cp, v - cv
    en = 0.5 * w @ w - mu / np.linalg.norm(r)
    h = np.cross(r, w)
    e = np.sqrt(max(0.0, 1 + 2 * en * (h @ h) / mu ** 2))
    a = -mu / (2 * en) if en < 0 else np.inf
    return en, a, e


def classify(a, e):
    """Earth's new orbit → climate class (by perihelion/aphelion and the year-averaged sunlight)."""
    if not np.isfinite(a):
        return "ejected"
    q, Q = a * (1 - e), a * (1 + e)
    flux = 1 / (a * a * np.sqrt(1 - e * e))        # year-averaged sunlight, Earth today = 1
    if q < 0.02:
        return "sun"
    if abs(a - 1) < 0.02 and e < 0.05:
        return "same"
    if Q > 1.5 and flux < 0.8:
        return "frozen"
    if q < 0.8 and flux > 1.15:
        return "scorched"
    return "changed"


def _mc_one(args):
    seed, qmax = args
    rng = np.random.default_rng(seed)
    q = qmax * np.sqrt(rng.uniform(0, 1))             # uniform in the target area (pass within qmax of the Sun)
    inc = np.arccos(rng.uniform(-1, 1))
    node = rng.uniform(0, 2 * np.pi)
    phases = rng.uniform(0, 2 * np.pi, len(PLANETS))
    st, tp = initial_state(q, inc, node, phases)
    sol = integrate(st, tp, 6.0, dense=True, rtol=1e-9)
    ts = np.linspace(max(0, tp - 2), tp + 6, 6000)
    Y = sol.sol(ts)
    ie = 12 + 6 * 2
    dE = np.linalg.norm(Y[ie:ie + 3] - Y[6:9], axis=0)
    dmin = float(dE.min())
    s = sol.y[:, -1]
    en, a, e = orbit_about(s[ie:ie + 3], s[ie + 3:ie + 6], s[0:3], s[3:6], G)
    fate = "hit" if dmin < R_ROGUE + 4.26e-5 else classify(a, e)
    # the Moon: integrate the pair only when the rogue comes close enough to matter
    moon_lost = False
    if dmin < 0.06:
        st2, _ = initial_state(q, inc, node, phases, moon=True, moon_phase=rng.uniform(0, 2 * np.pi))
        sol2 = integrate(st2, tp, 3.0, moon_of=2, rtol=1e-10)
        s2 = sol2.y[:, -1]
        im = len(s2) - 6
        en_m, _, _ = orbit_about(s2[im:im + 3], s2[im + 3:im + 6], s2[ie:ie + 3], s2[ie + 3:ie + 6], G * ME)
        moon_lost = bool(en_m > 0 or np.linalg.norm(s2[im:im + 3] - s2[ie:ie + 3]) > 0.01)
    # other planets ejected
    lost = []
    for k, (name, _) in enumerate(PLANETS):
        i = 12 + 6 * k
        en_k, _, _ = orbit_about(s[i:i + 3], s[i + 3:i + 6], s[0:3], s[3:6], G)
        if en_k > 0:
            lost.append(name)
    return dict(seed=seed, q=q, inc=float(np.degrees(inc)), node=float(node), phases=phases.tolist(), dmin=dmin,
                a=float(a) if np.isfinite(a) else None, e=float(e), fate=fate, moon_lost=moon_lost, lost=lost)


def monte_carlo(n=4000, qmax=2.0, jobs=4):
    from multiprocessing import Pool
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, f"mc_{n}_{qmax}.json")
    if os.path.exists(path):
        return json.load(open(path))
    with Pool(jobs) as p:
        out = p.map(_mc_one, [(s, qmax) for s in range(n)], chunksize=8)
    json.dump(out, open(path, "w"))
    return out


if __name__ == "__main__":
    import sys, collections, time
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 400
    t0 = time.time()
    R = monte_carlo(n)
    c = collections.Counter(r["fate"] for r in R)
    print(f"{n} passes within 2 AU of the Sun ({time.time() - t0:.0f}s)")
    for k, v in c.most_common():
        print(f"  {k:9s} {v:5d}  {100 * v / n:5.1f}%")
    print("  moon lost", sum(r["moon_lost"] for r in R))
    lc = collections.Counter(x for r in R for x in r["lost"])
    print("  planets ejected:", dict(lc))


# ═══════════════════════ the calendar: one path, every possible arrival day ═══════════════════════
STORY_Q, STORY_INC, STORY_NODE = 1.0, np.radians(4.0), 0.0
DEG_PER_DAY = 360.0 / 365.25
BASE_PHASES = [np.radians(x) for x in (130, 250, 0, 300, 75, 205, 320, 40)]   # other planets: fixed, arbitrary


def _cal_one(dday):
    ph = list(BASE_PHASES)
    ph[2] = np.radians(-dday * DEG_PER_DAY)      # Earth reaches the crossing point `dday` days after the rogue
    st, tp = initial_state(STORY_Q, STORY_INC, STORY_NODE, ph, moon=True, moon_phase=1.0)
    sol = integrate(st, tp, 4.0, moon_of=2, dense=True, rtol=1e-10)
    ts = np.linspace(tp - 0.5, tp + 1.0, 30000)
    Y = sol.sol(ts)
    ie = 24
    dE = np.linalg.norm(Y[ie:ie + 3] - Y[6:9], axis=0)
    dmin = float(dE.min())
    s = sol.y[:, -1]
    en, a, e = orbit_about(s[ie:ie + 3], s[ie + 3:ie + 6], s[0:3], s[3:6], G)
    fate = "hit" if dmin < R_ROGUE + 4.26e-5 else classify(a, e)
    im = len(s) - 6
    en_m, _, _ = orbit_about(s[im:im + 3], s[im + 3:im + 6], s[ie:ie + 3], s[ie + 3:ie + 6], G * ME)
    moon_lost = bool(en_m > 0 or np.linalg.norm(s[im:im + 3] - s[ie:ie + 3]) > 0.01)
    # the Moon's fate if lost: bound to the Sun, to the rogue, or ejected
    mf = None
    if moon_lost:
        enr, _, _ = orbit_about(s[im:im + 3], s[im + 3:im + 6], s[6:9], s[9:12], G * M_ROGUE)
        ens, _, _ = orbit_about(s[im:im + 3], s[im + 3:im + 6], s[0:3], s[3:6], G)
        mf = "rogue" if (enr < 0 and np.linalg.norm(s[im:im + 3] - s[6:9]) < 0.3) else ("sun" if ens < 0 else "ejected")
    return dict(day=float(dday), dmin=dmin, a=float(a) if np.isfinite(a) else None, e=float(e), fate=fate,
                moon_lost=moon_lost, moon_fate=mf)


def calendar(lo=-40.0, hi=40.0, step=0.25, jobs=4):
    from multiprocessing import Pool
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, f"calendar_{lo}_{hi}_{step}.json")
    if os.path.exists(path):
        return json.load(open(path))
    days = np.arange(lo, hi + 1e-9, step)
    with Pool(jobs) as p:
        out = p.map(_cal_one, days, chunksize=4)
    json.dump(out, open(path, "w"))
    return out


def year_odds(step=0.5, jobs=4):
    """Every arrival day of the year (Earth's offset from the crossing point), fate counted in days."""
    from multiprocessing import Pool
    path = os.path.join(CACHE, f"year_{step}.json")
    if os.path.exists(path):
        return json.load(open(path))
    days = np.arange(-182.5, 182.5, step)
    with Pool(jobs) as p:
        out = p.map(_cal_one, days, chunksize=4)
    json.dump(out, open(path, "w"))
    return out
