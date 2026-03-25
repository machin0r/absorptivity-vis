"""
Fresnel reflectance / absorptivity for a metal surface with complex refractive index.

Equations follow standard electromagnetic theory (Born & Wolf, Principles of Optics).
Complex refractive index convention: ñ = n + ik (k > 0 for absorbing media).

For s-polarisation (TE), reflectance amplitude:
    r_s = (cos θ − √(ñ² − sin²θ)) / (cos θ + √(ñ² − sin²θ))

For p-polarisation (TM), reflectance amplitude:
    r_p = (ñ² cos θ − √(ñ² − sin²θ)) / (ñ² cos θ + √(ñ² − sin²θ))

R_s = |r_s|²,   R_p = |r_p|²
A_s = 1 − R_s,  A_p = 1 − R_p
A_avg = (A_s + A_p) / 2   (unpolarised or circular)
"""

import numpy as np


def _sqrt_complex(z: complex) -> complex:
    """Principal square root of a complex number (positive real part)."""
    return complex(np.sqrt(z))


def fresnel_components(
    n: float,
    k: float,
    angle_deg: float,
) -> tuple[float, float]:
    """
    Return (A_s, A_p) — absorptivities for s and p polarisations.

    Parameters
    ----------
    n, k      : real and imaginary parts of complex refractive index ñ = n + ik
    angle_deg : angle of incidence in degrees (0 = normal incidence)
    """
    theta = np.radians(angle_deg)
    cos_theta = np.cos(theta)
    sin_theta = np.sin(theta)

    n_tilde = complex(n, k)           # ñ = n + ik
    n_sq = n_tilde ** 2               # ñ²

    # √(ñ² − sin²θ) — complex square root, principal branch
    inner = n_sq - complex(sin_theta ** 2)
    sqrt_inner = _sqrt_complex(inner)  # ñ cos θ_t  (Snell's law in complex form)

    # ── s-polarisation ────────────────────────────────────────────────────────
    # r_s = (cos θ_i − √(ñ² − sin²θ)) / (cos θ_i + √(ñ² − sin²θ))
    r_s_num = complex(cos_theta) - sqrt_inner
    r_s_den = complex(cos_theta) + sqrt_inner
    R_s = abs(r_s_num / r_s_den) ** 2

    # ── p-polarisation ────────────────────────────────────────────────────────
    # r_p = (ñ² cos θ_i − √(ñ² − sin²θ)) / (ñ² cos θ_i + √(ñ² − sin²θ))
    r_p_num = n_sq * cos_theta - sqrt_inner
    r_p_den = n_sq * cos_theta + sqrt_inner
    R_p = abs(r_p_num / r_p_den) ** 2

    A_s = 1.0 - R_s
    A_p = 1.0 - R_p

    return float(np.clip(A_s, 0.0, 1.0)), float(np.clip(A_p, 0.0, 1.0))


def fresnel_absorptivity(
    n: float,
    k: float,
    angle_deg: float,
    polarisation: str,
) -> tuple[float, float, float]:
    """
    Return (A_s, A_p, A_surface) for the given polarisation.

    Parameters
    ----------
    polarisation : one of 's', 'p', 'circular', 'unpolarised'

    Returns
    -------
    A_s, A_p, A_surface
        A_surface is the reported absorptivity for the chosen polarisation:
        - 's'           → A_s
        - 'p'           → A_p
        - 'circular'    → (A_s + A_p) / 2
        - 'unpolarised' → (A_s + A_p) / 2
    """
    A_s, A_p = fresnel_components(n, k, angle_deg)
    A_avg = (A_s + A_p) / 2.0

    if polarisation == "s":
        A_surface = A_s
    elif polarisation == "p":
        A_surface = A_p
    else:   # 'circular' or 'unpolarised'
        A_surface = A_avg

    return A_s, A_p, A_surface


def fresnel_vs_angle(
    n: float,
    k: float,
    angle_range: tuple[float, float] = (0.0, 85.0),
    n_points: int = 86,
) -> tuple[list[float], list[float], list[float], list[float]]:
    """
    Return (angles_deg, A_s_values, A_p_values, A_avg_values) over an angle sweep.
    """
    angles = np.linspace(angle_range[0], angle_range[1], n_points)
    A_s_vals, A_p_vals, A_avg_vals = [], [], []

    for theta in angles:
        A_s, A_p = fresnel_components(n, k, float(theta))
        A_s_vals.append(A_s)
        A_p_vals.append(A_p)
        A_avg_vals.append((A_s + A_p) / 2.0)

    return angles.tolist(), A_s_vals, A_p_vals, A_avg_vals
