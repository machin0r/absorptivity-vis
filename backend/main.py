import time
from pathlib import Path

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from fresnel import fresnel_absorptivity, fresnel_vs_angle
from gusarov import powder_absorptivity
from hagen_rubens import temperature_corrected_nk
from materials import MATERIALS, get_nk, get_sigma
from models import (
    AngleCurve,
    ComputeRequest,
    ComputeResponse,
    MaterialProperties,
    RayTraceRequest,
    RayTraceResponse,
    TemperatureCurve,
)
from raytrace import run_raytrace
from regime import classify_regime

app = FastAPI(
    title="Laser Absorptivity API",
    description="Fresnel + Hagen-Rubens + Gusarov absorptivity for metal powder beds.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/materials")
def get_materials() -> dict:
    """Return the material catalogue for the frontend selector."""
    return {
        key: {
            "label": mat["label"],
            "description": mat["description"],
            "T_liquidus_C": mat["T_liquidus_C"],
            "T_solidus_C": mat["T_solidus_C"],
        }
        for key, mat in MATERIALS.items()
    }


def _compute_surface_absorptivity(
    material: str,
    wavelength_nm: float,
    angle_deg: float,
    polarisation: str,
    temperature_C: float,
) -> tuple[float, float, float, float, float]:
    """
    Compute temperature-corrected Fresnel absorptivity.

    Returns (A_s, A_p, A_surface, n_T, k_T).
    """
    n_ref, k_ref = get_nk(material, wavelength_nm)
    n_T, k_T = temperature_corrected_nk(material, n_ref, k_ref, temperature_C)
    A_s, A_p, A_surface = fresnel_absorptivity(n_T, k_T, angle_deg, polarisation)
    return A_s, A_p, A_surface, n_T, k_T


def _is_liquid(material: str, temperature_C: float) -> bool:
    return temperature_C >= MATERIALS[material]["T_liquidus_C"]


def _compute_temperature_curve(
    req: ComputeRequest,
) -> TemperatureCurve:
    """
    A vs T from 25°C to 300°C above liquidus, 60 points.
    Above liquidus: A_powder = A_surface (flat liquid, no powder model).
    """
    mat = MATERIALS[req.material]
    T_liq = mat["T_liquidus_C"]
    T_max = T_liq + 300.0
    temperatures = np.linspace(25.0, T_max, 60).tolist()

    A_surf_vals: list[float] = []
    A_powd_vals: list[float] = []

    for T in temperatures:
        _, _, A_surface, _, _ = _compute_surface_absorptivity(
            req.material, req.wavelength_nm, req.angle_deg, req.polarisation, T
        )
        if _is_liquid(req.material, T):
            # Flat liquid surface: Gusarov model does not apply
            A_powder = A_surface
        else:
            A_powder = powder_absorptivity(
                A_surface,
                req.packing_fraction,
                req.layer_thickness_um,
                req.d50_um,
            )
        A_surf_vals.append(round(A_surface, 6))
        A_powd_vals.append(round(A_powder, 6))

    return TemperatureCurve(
        temperatures_C=temperatures,
        A_surface_values=A_surf_vals,
        A_powder_values=A_powd_vals,
    )


def _compute_angle_curve(
    req: ComputeRequest,
    n_T: float,
    k_T: float,
) -> AngleCurve:
    """A_s, A_p, A_avg vs angle (0–85°) at current temperature."""
    angles, A_s_vals, A_p_vals, A_avg_vals = fresnel_vs_angle(n_T, k_T)
    return AngleCurve(
        angles_deg=angles,
        A_s_values=[round(v, 6) for v in A_s_vals],
        A_p_values=[round(v, 6) for v in A_p_vals],
        A_avg_values=[round(v, 6) for v in A_avg_vals],
    )


@app.post("/api/compute", response_model=ComputeResponse)
def compute(req: ComputeRequest) -> ComputeResponse:
    t0 = time.perf_counter()

    try:
        # ── Surface absorptivity at current state ────────────────────────────
        A_s, A_p, A_surface, n_T, k_T = _compute_surface_absorptivity(
            req.material,
            req.wavelength_nm,
            req.angle_deg,
            req.polarisation,
            req.temperature_C,
        )

        # ── Powder bed absorptivity ──────────────────────────────────────────
        if _is_liquid(req.material, req.temperature_C):
            A_powder = A_surface   # flat liquid, no powder scattering
        else:
            A_powder = powder_absorptivity(
                A_surface,
                req.packing_fraction,
                req.layer_thickness_um,
                req.d50_um,
            )

        # ── Regime ──────────────────────────────────────────────────────────
        regime, regime_note = classify_regime(req.material, req.temperature_C)

        # ── Curves ──────────────────────────────────────────────────────────
        temp_curve = _compute_temperature_curve(req)
        angle_curve = _compute_angle_curve(req, n_T, k_T)

        # ── Material properties at current state ─────────────────────────────
        mat = MATERIALS[req.material]
        sigma_T = get_sigma(req.material, req.temperature_C)
        mat_props = MaterialProperties(
            n=round(n_T, 4),
            k=round(k_T, 4),
            sigma_S_per_m=round(sigma_T, 2),
            T_liquidus_C=mat["T_liquidus_C"],
            T_solidus_C=mat["T_solidus_C"],
        )

    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Computation error: {e}")

    elapsed_ms = (time.perf_counter() - t0) * 1000
    print(f"[compute] {elapsed_ms:.1f} ms  {req.material} wl={req.wavelength_nm}nm T={req.temperature_C}C")

    return ComputeResponse(
        A_surface=round(A_surface, 6),
        A_surface_s=round(A_s, 6),
        A_surface_p=round(A_p, 6),
        A_powder=round(A_powder, 6),
        A_vs_temperature=temp_curve,
        A_vs_angle=angle_curve,
        regime=regime,
        regime_note=regime_note,
        material_properties=mat_props,
    )


@app.post("/api/raytrace", response_model=RayTraceResponse)
def raytrace(req: RayTraceRequest) -> RayTraceResponse:
    t0 = time.perf_counter()
    try:
        data = run_raytrace(
            material=req.material,
            wavelength_nm=req.wavelength_nm,
            angle_deg=req.angle_deg,
            polarisation=req.polarisation,
            temperature_C=req.temperature_C,
            d10_um=req.d10_um,
            d50_um=req.d50_um,
            d90_um=req.d90_um,
            packing_fraction=req.packing_fraction,
            layer_thickness_um=req.layer_thickness_um,
            n_rays=req.n_rays,
            spot_diameter_um=req.spot_diameter_um,
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Ray trace error: {e}")

    elapsed_ms = (time.perf_counter() - t0) * 1000
    print(f"[raytrace] {elapsed_ms:.1f} ms  {len(data['particles'])} particles, {req.n_rays} rays")
    return RayTraceResponse(**data)


# Serve built frontend in production (Docker) — skipped during local dev
_static_dir = Path(__file__).parent / "static"
if _static_dir.is_dir():
    app.mount("/assets", StaticFiles(directory=_static_dir / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str) -> FileResponse:
        file = _static_dir / full_path
        if file.is_file():
            return FileResponse(file)
        return FileResponse(_static_dir / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
