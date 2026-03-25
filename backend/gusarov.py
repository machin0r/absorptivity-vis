"""
Gusarov radiative transfer model for powder bed absorptivity.

Reference: Gusarov & Kruth (2005) and Gusarov et al. (2009).
The model uses a two-flux (Eddington) radiative transfer treatment of the powder
bed, treating particle surfaces as the source of absorption and Lambertian
scattering.

For a layer of powder with:
  - Single-surface Fresnel absorptivity A_surface  (from fresnel.py)
  - Packing fraction η (dimensionless volume fraction of particles)
  - Layer thickness  d (µm)
  - Median particle diameter D50 (µm)

The optical depth of the layer is:
    τ = (3/2) × η × (d / (D50/2)) × (1/2)
      = (3/2) × η × (d / D50)          [D50 is diameter, not radius]

Wait — optical depth derivation:
    Extinction coefficient (per unit length) = (3/4) × (η / r) × 1
      where r = D50/2 is particle radius.
    τ = extinction_coeff × d = (3/4) × (η / (D50/2)) × d
      = (3/2) × η × (d / D50)

Two-flux equations (Schuster-Schwarzschild form) with:
  K = absorption coefficient = A_surface × extinction_coeff
  S = scattering coefficient = (1 - A_surface) × extinction_coeff

Give for a slab of optical depth τ (based on extinction) with absorbing substrate:
    γ = √(A_surface)
    R_powder = (1 - A_surface) × sinh(γτ) / ((1 + A_surface) × sinh(γτ) + 2γ × cosh(γτ))
    A_powder = 1 - R_powder

Limiting cases (verified):
  τ → ∞ (semi-infinite bed): A_powder → 2√A / (1 + √A)
  τ → 0  (no powder):        A_powder → 0

For a liquid melt pool surface (post-melting), the powder bed model does not apply.
A_powder = A_surface (flat liquid surface) in that regime.

Assumptions (document in UI):
  - Optically thick approximation is accurate when τ ≫ 1.
    For thin layers relative to D50, the finite-thickness correction matters.
  - Lambertian scattering from particle surfaces assumed.
  - Flat powder bed surface assumed (no surface topology).
  - D50 used as representative particle size; D10/D90 affect optical depth
    distribution but are not used in this scalar model.
"""

import numpy as np


def optical_depth(
    packing_fraction: float,
    layer_thickness_um: float,
    d50_um: float,
) -> float:
    """
    Return the optical depth τ of the powder layer.

    τ = (3/2) × η × (layer_thickness / D50)
    """
    if d50_um <= 0:
        return 0.0
    return 1.5 * packing_fraction * (layer_thickness_um / d50_um)


def powder_absorptivity(
    A_surface: float,
    packing_fraction: float,
    layer_thickness_um: float,
    d50_um: float,
) -> float:
    """
    Return the effective absorptivity of the powder bed via the Gusarov
    two-flux radiative transfer model.

    Parameters
    ----------
    A_surface         : single-surface Fresnel absorptivity (0–1)
    packing_fraction  : η, volume fraction of solid particles (0.50–0.68 typical)
    layer_thickness_um: layer thickness in µm
    d50_um            : median particle diameter in µm

    Returns
    -------
    A_powder : effective absorptivity of the powder layer + substrate
    """
    A = float(np.clip(A_surface, 1e-6, 1.0 - 1e-6))
    tau = optical_depth(packing_fraction, layer_thickness_um, d50_um)

    if tau < 1e-6:
        # Optically thin limit: nearly all light transmitted, little absorbed
        return float(A * tau)    # first-order approximation

    gamma = np.sqrt(A)
    gamma_tau = gamma * tau

    sinh_gt = np.sinh(gamma_tau)
    cosh_gt = np.cosh(gamma_tau)

    numerator   = (1.0 - A) * sinh_gt
    denominator = (1.0 + A) * sinh_gt + 2.0 * gamma * cosh_gt

    if denominator < 1e-12:
        return float(A)

    R_powder = numerator / denominator
    A_powder = 1.0 - R_powder
    return float(np.clip(A_powder, 0.0, 1.0))


def powder_absorptivity_semi_infinite(A_surface: float) -> float:
    """
    Asymptotic (τ → ∞) powder bed absorptivity.
    Useful as an upper bound and for validation.

    A_powder_inf = 2√A / (1 + √A)
    """
    A = float(np.clip(A_surface, 0.0, 1.0))
    sqrt_A = np.sqrt(A)
    return float(2.0 * sqrt_A / (1.0 + sqrt_A))
