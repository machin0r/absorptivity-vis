"""
Material optical and electrical property data for laser absorptivity calculations.

Optical constants (n, k) sourced from:
  - Palik, E.D. (ed.) Handbook of Optical Constants of Solids (1985/1991)
  - Tolochko et al. (2000) for steel/Ti alloys at 1064 nm
  - Hagen-Rubens formula used for consistent 10600 nm CO2 values

Electrical conductivity σ(T) sourced from:
  - ASM Handbook Vol. 2 (non-ferrous alloys)
  - NIST property tables
  - Fischer et al. for high-temperature data

Values are room-temperature bulk properties; powder beds will differ slightly
due to surface oxide layers, composition tolerances, and surface topology.
All (n, k) values are at room temperature (~25°C). Temperature correction
is applied via the Hagen-Rubens scaling in hagen_rubens.py.
"""

import numpy as np

# Reference temperature for σ scaling
T_REF_C = 25.0

# ── Optical constants at tabulated wavelengths ───────────────────────────────
# Format: {wavelength_nm: (n, k)}
# At 10600 nm (CO2 laser), values are derived from Hagen-Rubens:
#   n ≈ k ≈ sqrt(sigma / (2 * eps0 * omega))

MATERIALS: dict[str, dict] = {
    "316L": {
        "label": "316L Stainless Steel",
        "description": "Austenitic stainless steel, excellent corrosion resistance",
        # (n, k) at key wavelengths — Palik / Tolochko
        "nk": {
            515:   (1.66, 3.26),
            1064:  (3.81, 4.44),
            10600: (20.7, 20.7),   # HR-consistent with sigma_ref
        },
        # σ(T) in S/m — tabulated (T_C, sigma) pairs, including liquid phase
        # Solid phase: σ decreases with T (metallic conduction)
        # Liquid: significant drop at melting for most metals
        "sigma_T": [
            (25,   1.35e6),
            (200,  1.18e6),
            (400,  1.02e6),
            (600,  0.88e6),
            (800,  0.76e6),
            (1000, 0.65e6),
            (1200, 0.56e6),
            (1370, 0.51e6),   # near solidus
            (1400, 0.80e6),   # liquid — conductivity recovers slightly
            (1600, 0.75e6),
        ],
        "T_liquidus_C": 1400.0,
        "T_solidus_C":  1370.0,
    },

    "Ti-6Al-4V": {
        "label": "Ti-6Al-4V",
        "description": "Titanium alloy, widely used in aerospace and medical",
        "nk": {
            515:   (2.12, 2.96),
            1064:  (3.50, 3.60),
            10600: (13.3, 13.3),
        },
        "sigma_T": [
            (25,   5.60e5),
            (200,  5.00e5),
            (400,  4.30e5),
            (600,  3.70e5),
            (800,  3.20e5),
            (1000, 2.80e5),
            (1200, 2.50e5),
            (1604, 2.20e5),   # near solidus
            (1655, 7.00e5),   # liquid (β-Ti conductivity recovers)
            (1800, 6.50e5),
        ],
        "T_liquidus_C": 1655.0,
        "T_solidus_C":  1604.0,
    },

    "IN718": {
        "label": "IN718 (Inconel 718)",
        "description": "Nickel superalloy, high-temperature turbine applications",
        "nk": {
            515:   (1.83, 3.40),
            1064:  (2.97, 3.45),
            10600: (16.0, 16.0),
        },
        "sigma_T": [
            (25,   8.00e5),
            (200,  7.20e5),
            (400,  6.20e5),
            (600,  5.40e5),
            (800,  4.60e5),
            (1000, 3.90e5),
            (1200, 3.30e5),
            (1260, 3.10e5),   # near solidus
            (1336, 7.20e5),   # liquid
            (1500, 6.80e5),
        ],
        "T_liquidus_C": 1336.0,
        "T_solidus_C":  1260.0,
    },

    "AlSi10Mg": {
        "label": "AlSi10Mg",
        "description": "Aluminium alloy, lightweight automotive and aerospace",
        # Al dominates optical properties; Si content minor effect
        "nk": {
            515:   (0.82, 6.41),
            1064:  (1.44, 8.33),
            10600: (83.7, 83.7),
        },
        "sigma_T": [
            (25,   2.20e7),
            (100,  1.85e7),
            (200,  1.45e7),
            (300,  1.15e7),
            (400,  9.00e6),
            (500,  6.50e6),
            (555,  5.20e6),   # near solidus
            (596,  4.00e6),   # liquid (drops significantly at melting)
            (700,  3.50e6),
        ],
        "T_liquidus_C": 596.0,
        "T_solidus_C":  555.0,
    },

    "CoCrMo": {
        "label": "CoCrMo",
        "description": "Cobalt-chromium alloy, biomedical implants",
        "nk": {
            515:   (1.72, 3.25),
            1064:  (2.89, 3.20),
            10600: (17.8, 17.8),
        },
        "sigma_T": [
            (25,   1.00e6),
            (200,  0.88e6),
            (400,  0.75e6),
            (600,  0.63e6),
            (800,  0.54e6),
            (1000, 0.47e6),
            (1200, 0.41e6),
            (1315, 0.37e6),   # near solidus
            (1350, 0.65e6),   # liquid
            (1500, 0.60e6),
        ],
        "T_liquidus_C": 1350.0,
        "T_solidus_C":  1315.0,
    },

    "Cu": {
        "label": "Copper (Cu)",
        "description": "Pure copper — high conductivity, challenging at 1064 nm",
        # Cu interband transitions near 600 nm → higher k at 515 nm
        "nk": {
            515:   (1.04, 2.14),   # near interband edge, significant absorption
            1064:  (0.27, 6.97),   # highly reflective NIR
            10600: (137.7, 137.7),
        },
        "sigma_T": [
            (25,   5.96e7),
            (100,  4.90e7),
            (200,  3.75e7),
            (300,  3.00e7),
            (500,  2.10e7),
            (700,  1.60e7),
            (900,  1.30e7),
            (1000, 1.20e7),
            (1083, 1.10e7),   # near solidus/liquidus (Cu has narrow range)
            (1085, 3.80e6),   # liquid — large conductivity drop at melting
            (1200, 3.50e6),
        ],
        "T_liquidus_C": 1085.0,
        "T_solidus_C":  1083.0,
    },
}

# Tabulated wavelengths available for each material
_TABULATED_WL = [515, 1064, 10600]   # nm


def get_nk(material: str, wavelength_nm: float) -> tuple[float, float]:
    """
    Return (n, k) for a material at a given wavelength via log-linear interpolation
    between the three tabulated wavelengths (515, 1064, 10600 nm).

    Extrapolation beyond 10600 nm uses the 10600 nm values.
    Extrapolation below 515 nm uses the 515 nm values.
    """
    mat = MATERIALS[material]
    nk_table = mat["nk"]

    wl = float(wavelength_nm)
    wls = sorted(nk_table.keys())   # [515, 1064, 10600]

    if wl <= wls[0]:
        return nk_table[wls[0]]
    if wl >= wls[-1]:
        return nk_table[wls[-1]]

    # Find bracketing wavelengths
    for i in range(len(wls) - 1):
        wl_lo, wl_hi = wls[i], wls[i + 1]
        if wl_lo <= wl <= wl_hi:
            # Log-linear interpolation
            t = np.log(wl / wl_lo) / np.log(wl_hi / wl_lo)
            n_lo, k_lo = nk_table[wl_lo]
            n_hi, k_hi = nk_table[wl_hi]
            n = n_lo + t * (n_hi - n_lo)
            k = k_lo + t * (k_hi - k_lo)
            return float(n), float(k)

    return nk_table[wls[-1]]   # fallback


def get_sigma(material: str, temperature_C: float) -> float:
    """
    Return electrical conductivity σ (S/m) at a given temperature via
    linear interpolation of the tabulated σ(T) data.

    Clamps to the first/last tabulated value for out-of-range temperatures.
    """
    sigma_table = MATERIALS[material]["sigma_T"]
    temps = [row[0] for row in sigma_table]
    sigmas = [row[1] for row in sigma_table]
    return float(np.interp(temperature_C, temps, sigmas))


def get_sigma_ref(material: str) -> float:
    """Return σ at the reference temperature (25°C)."""
    return get_sigma(material, T_REF_C)
