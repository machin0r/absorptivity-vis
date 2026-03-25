from typing import Literal

from pydantic import BaseModel, Field


class ComputeRequest(BaseModel):
    wavelength_nm: float = Field(..., gt=0, description="Laser wavelength in nm")
    angle_deg: float = Field(..., ge=0.0, le=85.0, description="Angle of incidence in degrees")
    spot_diameter_um: float = Field(default=80.0, gt=0, description="Spot diameter in µm (display/regime only)")
    polarisation: Literal["s", "p", "circular", "unpolarised"] = Field(
        default="unpolarised", description="Laser polarisation state"
    )
    material: Literal["316L", "Ti-6Al-4V", "IN718", "AlSi10Mg", "CoCrMo", "Cu"] = Field(
        ..., description="Material selection"
    )
    temperature_C: float = Field(..., description="Surface/interaction temperature in °C")
    d10_um: float = Field(..., gt=0, description="D10 particle size in µm")
    d50_um: float = Field(..., gt=0, description="D50 particle size in µm")
    d90_um: float = Field(..., gt=0, description="D90 particle size in µm")
    packing_fraction: float = Field(..., ge=0.50, le=0.68, description="Powder bed packing fraction")
    layer_thickness_um: float = Field(..., gt=0, description="Layer thickness in µm")


class TemperatureCurve(BaseModel):
    temperatures_C: list[float]
    A_surface_values: list[float]
    A_powder_values: list[float]


class AngleCurve(BaseModel):
    angles_deg: list[float]
    A_s_values: list[float]
    A_p_values: list[float]
    A_avg_values: list[float]


class MaterialProperties(BaseModel):
    n: float
    k: float
    sigma_S_per_m: float
    T_liquidus_C: float
    T_solidus_C: float


class RayTraceRequest(BaseModel):
    wavelength_nm: float = Field(..., gt=0)
    angle_deg: float = Field(..., ge=0.0, le=85.0)
    spot_diameter_um: float = Field(default=80.0, gt=0)
    polarisation: Literal["s", "p", "circular", "unpolarised"] = Field(default="unpolarised")
    material: Literal["316L", "Ti-6Al-4V", "IN718", "AlSi10Mg", "CoCrMo", "Cu"]
    temperature_C: float
    d10_um: float = Field(..., gt=0)
    d50_um: float = Field(..., gt=0)
    d90_um: float = Field(..., gt=0)
    packing_fraction: float = Field(..., ge=0.50, le=0.68)
    layer_thickness_um: float = Field(..., gt=0)
    n_rays: int = Field(default=20, ge=3, le=50)


class RaySegmentData(BaseModel):
    x0: float
    y0: float
    x1: float
    y1: float
    intensity: float


class ParticleData(BaseModel):
    x: float
    y: float
    radius: float
    absorbed_energy: float


class RayData(BaseModel):
    segments: list[RaySegmentData]
    absorbed_total: float
    n_bounces: int
    escaped: bool


class RayTraceSummary(BaseModel):
    ray_count: int
    avg_bounces: float


class SceneBounds(BaseModel):
    width_um: float
    height_um: float
    powder_top_um: float
    powder_bottom_um: float


class RayTraceResponse(BaseModel):
    particles: list[ParticleData]
    rays: list[RayData]
    summary: RayTraceSummary
    scene: SceneBounds


class ComputeResponse(BaseModel):
    A_surface: float = Field(..., description="Fresnel absorptivity for selected polarisation")
    A_surface_s: float = Field(..., description="s-polarisation absorptivity")
    A_surface_p: float = Field(..., description="p-polarisation absorptivity")
    A_powder: float = Field(..., description="Gusarov effective powder bed absorptivity")
    A_vs_temperature: TemperatureCurve
    A_vs_angle: AngleCurve
    regime: Literal["powder_bed", "liquid_surface", "keyhole"]
    regime_note: str
    material_properties: MaterialProperties
