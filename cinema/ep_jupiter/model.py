"""Jupiter descent model (first principles, documented assumptions).

Atmosphere (0 to ~1 kbar): dry adiabat anchored to the Galileo probe, T(1 bar) = 166 K, R/cp = 0.30 (Galileo: 166 K at
1 bar → ~425 K at 22 bar), mean molecular weight 2.3 g/mol, ideal gas, hydrostatic.
Deep interior: n = 1 polytrope (rho = rho_c sin(x)/x), which reproduces Jupiter's radius-independence of mass, puts
2 Mbar at 0.81 R_J (literature: 0.81 R_J) and gives a central pressure of ~40 Mbar (literature 40-70 Mbar).
Deep temperatures follow a published adiabat: 5,700 K at 1 Mbar, 6,840 K at 2 Mbar, ~20,000 K at the centre.
The fall: a crewed ship (12 t, 4 m wide, Cd 0.8) released at rest at the 1-bar level, falling at drag-limited speed.
"""
import numpy as np

G, RJ, MJ = 6.674e-11, 6.9911e7, 1.898e27
R_GAS, MU, KAPPA, T0, G0 = 8.314, 0.0023, 0.30, 166.0, 24.79
CP = R_GAS / (KAPPA * MU)          # J/kg/K
LAPSE = G0 / CP                     # K per metre (dry adiabatic lapse rate)


def atm(z):
    """z = depth below 1 bar (m) → T (K), P (bar), rho (kg/m³) on the dry adiabat (valid to ~1 kbar)."""
    T = T0 + LAPSE * z
    P = (T / T0) ** (1 / KAPPA)
    rho = P * 1e5 * MU / (R_GAS * T)
    return T, P, rho


RHO_C = np.pi ** 2 / 3 * MJ / (4 / 3 * np.pi * RJ ** 3)
K_POLY = 2 * G * RJ ** 2 / np.pi


def poly(z):
    r = max(1.0, RJ - z)
    x = np.pi * r / RJ
    rho = RHO_C * np.sin(x) / x
    return K_POLY * rho ** 2 / 1e5, rho          # P (bar), rho


def deep_T(P):
    """Temperature (K) on the interior adiabat, log-interpolated through published points."""
    pts = [(1.0, T0), (1e3, atm_T_at_P(1e3)), (1e6, 5700.0), (2e6, 6840.0), (4e7, 20000.0)]
    lp = np.log([p for p, _ in pts]); lt = np.log([t for _, t in pts])
    return float(np.exp(np.interp(np.log(P), lp, lt)))


def atm_T_at_P(P):
    return T0 * P ** KAPPA


def profile(z):
    """Atmosphere above 1,000 km, polytrope below 1,500 km (their pressures cross at ~1,400 km / ~16 kbar),
    log-blended in between. Above 1 kbar the ideal-gas temperature is replaced by the interior adiabat."""
    Ta, Pa, ra = atm(z)
    if z <= 1.0e6:
        P, rho = Pa, ra
    else:
        Pp, rp = poly(z)
        if z >= 1.5e6:
            P, rho = Pp, rp
        else:
            k = (z - 1.0e6) / 0.5e6
            P = float(np.exp(np.log(Pa) * (1 - k) + np.log(Pp) * k))
            rho = float(np.exp(np.log(ra) * (1 - k) + np.log(rp) * k))
    T = Ta if P < 1e3 else deep_T(P)
    return T, P, rho


def fall(m=12000.0, D=4.0, cd=0.8, dt=0.5, z_max=None, stop=None, z0=-20e3):
    """Released at rest 20 km above the 1-bar level (~0.4 bar, above the ammonia cloud tops)."""
    A = np.pi * D ** 2 / 4
    z, v, t = z0, 0.0, 0.0
    out = []
    while True:
        T, P, rho = profile(z) if z >= 0 else atm(z)
        g = G0
        drag = 0.5 * rho * cd * A * v * v
        a = g - drag / m
        v = max(0.0, v + a * dt)
        z += v * dt
        t += dt
        out.append((t, z, v, T, P, rho))
        if (z_max and z >= z_max) or (stop and stop(t, z, v, T, P)):
            break
    return np.array(out)


def when(arr, col, value):
    i = int(np.argmax(arr[:, col] >= value))
    return arr[i]


def deep_fall(m=12000.0, D=4.0, cd=0.8, z0=600e3, t0=0.0, dz=2000.0):
    """Quasi-static descent below the fast-fall zone: speed = drag-limited, with buoyancy of a sealed ship of volume V.
    Returns rows (t, z, v, T, P, rho) until the ship is neutrally buoyant (it floats)."""
    A, V = np.pi * D ** 2 / 4, np.pi * D ** 3 / 6
    z, t, out = z0, t0, []
    while True:
        T, P, rho = profile(z)
        r = RJ - z
        x = np.pi * r / RJ
        g = G * MJ * (np.sin(x) - x * np.cos(x)) / np.pi / r ** 2 if z > 1.5e6 else G0
        net = (m - rho * V) * g
        if net <= 0:
            break
        v = np.sqrt(2 * net / (rho * cd * A))
        out.append((t, z, v, T, P, rho))
        if v < 0.02:
            break
        t += dz / v
        z += dz
    return np.array(out), m / V


if __name__ == "__main__":
    ar = fall(z_max=700e3)
    print("t(min)  depth(km)  v(m/s)  T(K)  P(bar)")
    for label, col, val in [("ammonia clouds 0.7 bar", 4, 0.0), ("1 bar", 1, 0), ("NH4SH 2 bar", 4, 2), ("water clouds 5 bar", 4, 5),
                            ("room temp 293K", 3, 293), ("10 bar", 4, 10), ("Galileo 22 bar", 4, 22), ("boiling 373K", 3, 373),
                            ("Draper 798K", 3, 798), ("Al melts 933K", 3, 933), ("sub crush 1100 bar", 4, 1100)]:
        r = when(ar, col, val)
        print(f"{label:24s} {r[0]/60:7.1f} {r[1]/1e3:8.1f} {r[2]:7.1f} {r[3]:6.0f} {r[4]:8.1f}")
    for z in [100e3, 300e3, 1000e3, 2000e3, 5000e3, 10000e3, 13300e3, 20000e3, 40000e3, 69000e3]:
        print(f"depth {z/1e3:7.0f} km  T={profile(z)[0]:7.0f} K  P={profile(z)[1]:12.0f} bar  rho={profile(z)[2]:8.1f}")
    print("max fall speed", ar[:, 2].max(), "at", ar[ar[:, 2].argmax(), 1] / 1e3, "km")
