"""
Processing regime classification.

Regime is determined primarily from the temperature setting relative to the
material's solidus/liquidus temperatures.

  Powder bed   — T < T_solidus:   powder particles solid, no melting
  Liquid surface — T ≥ T_liquidus: full melt pool, flat surface Fresnel applies.
                   Gusarov powder model no longer valid; A_powder → A_surface.
  Keyhole        — cannot be determined from temperature alone; requires laser
                   power and scan speed. Flagged with a note when temperature
                   is significantly above liquidus (rough heuristic only).

Note: the absorptivity values returned for the 'liquid_surface' regime use flat
surface Fresnel with liquid-phase optical constants. The powder model is NOT
applied above the liquidus.
"""

from materials import MATERIALS

# Temperature above liquidus at which keyhole risk is flagged (rough heuristic)
_KEYHOLE_DELTA_C = 300.0


def classify_regime(
    material: str,
    temperature_C: float,
) -> tuple[str, str]:
    """
    Return (regime_key, regime_note).

    regime_key : 'powder_bed' | 'liquid_surface' | 'keyhole'
    regime_note: human-readable explanation shown in the UI
    """
    mat = MATERIALS[material]
    T_sol = mat["T_solidus_C"]
    T_liq = mat["T_liquidus_C"]

    if temperature_C < T_sol:
        return (
            "powder_bed",
            (
                f"Powder bed regime. Temperature ({temperature_C:.0f}°C) is below "
                f"the solidus ({T_sol:.0f}°C). Powder particles remain solid. "
                f"Gusarov model applied for effective absorptivity."
            ),
        )

    if temperature_C < T_liq:
        return (
            "liquid_surface",
            (
                f"Partial melting / sintering zone ({temperature_C:.0f}°C). "
                f"Between solidus ({T_sol:.0f}°C) and liquidus ({T_liq:.0f}°C). "
                f"Absorptivity transitions from powder to flat-surface values. "
                f"Powder bed model less accurate in this region."
            ),
        )

    if temperature_C >= T_liq + _KEYHOLE_DELTA_C:
        return (
            "keyhole",
            (
                f"High-temperature liquid surface ({temperature_C:.0f}°C, "
                f"{temperature_C - T_liq:.0f}°C above liquidus). "
                f"Keyhole formation is possible at high energy densities. "
                f"Absorptivity is shown as a range; accurate prediction requires "
                f"coupled thermal-fluid simulation. "
                f"Laser power and scan speed are needed to assess keyhole risk."
            ),
        )

    return (
        "liquid_surface",
        (
            f"Liquid surface regime. Temperature ({temperature_C:.0f}°C) is above "
            f"the liquidus ({T_liq:.0f}°C). Melt pool surface is flat. "
            f"Flat-surface Fresnel absorptivity applies; Gusarov model not used."
        ),
    )
