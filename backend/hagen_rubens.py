"""
Temperature correction for optical constants via the Hagen-Rubens relation.

The Hagen-Rubens (HR) relation connects electrical conductivity σ to the
optical constants of a metal in the infrared regime (ω ≪ scattering rate):

    n(T) ≈ k(T) ≈ √(σ(T) / (2ε₀ω))

This means optical constants scale as √σ(T). Given tabulated (n₀, k₀) at a
reference temperature T_ref with conductivity σ_ref, the temperature-corrected
optical constants are:

    n(T) = n₀ × √(σ(T) / σ_ref)
    k(T) = k₀ × √(σ(T) / σ_ref)

This preserves the Fresnel angular and polarisation behaviour while propagating
the temperature dependence through the conductivity.

Limitations (document these in the UI):
  - Most accurate in the far-IR (CO₂ laser, 10600 nm)
  - Less accurate at NIR (1064 nm) and inaccurate at visible wavelengths (515 nm)
    where interband transitions dominate and HR does not apply
  - (n, k) values for liquid phase are extrapolated from σ_liquid using HR;
    actual liquid metal optical constants may differ due to structural changes
"""

from __future__ import annotations

import numpy as np

from materials import get_sigma, get_sigma_ref


def temperature_corrected_nk(
    material: str,
    n_ref: float,
    k_ref: float,
    temperature_C: float,
) -> tuple[float, float]:
    """
    Return (n, k) at the given temperature using Hagen-Rubens scaling.

    The scaling factor is √(σ(T) / σ_ref).  For most metals, σ decreases
    with temperature, so n and k decrease — which via Fresnel causes absorptivity
    to increase, consistent with observation.

    Parameters
    ----------
    material      : material key (used for σ(T) lookup)
    n_ref, k_ref  : tabulated optical constants at room temperature
    temperature_C : target temperature in °C
    """
    sigma_T = get_sigma(material, temperature_C)
    sigma_ref = get_sigma_ref(material)

    # Avoid division by zero if σ_ref is somehow zero
    if sigma_ref <= 0:
        return n_ref, k_ref

    scale = np.sqrt(sigma_T / sigma_ref)
    return float(n_ref * scale), float(k_ref * scale)


def hagen_rubens_absorptivity(sigma: float, wavelength_nm: float) -> float:
    """
    Direct Hagen-Rubens absorptivity estimate: A_HR = 2√(2ε₀ω / σ).

    This is the closed-form prediction, valid only in the far-IR regime.
    Used for reference / validation; the main pipeline uses temperature-corrected
    Fresnel rather than this formula directly.

    Parameters
    ----------
    sigma        : electrical conductivity in S/m
    wavelength_nm: laser wavelength in nm
    """
    eps0 = 8.854187817e-12  # F/m
    c = 2.99792458e8        # m/s
    omega = 2.0 * np.pi * c / (wavelength_nm * 1e-9)   # rad/s

    ratio = 2.0 * eps0 * omega / sigma
    if ratio < 0:
        return 0.0
    A_HR = 2.0 * np.sqrt(ratio)
    return float(np.clip(A_HR, 0.0, 1.0))
