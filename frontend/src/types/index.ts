// ── Material / laser string types ────────────────────────────────────────────

export type MaterialKey = '316L' | 'Ti-6Al-4V' | 'IN718' | 'AlSi10Mg' | 'CoCrMo' | 'Cu'
export type Polarisation = 'unpolarised' | 's' | 'p' | 'circular'

// ── Numeric slider parameters ─────────────────────────────────────────────────
// String params (material, polarisation) are kept separate in state.

export interface Parameters {
  wavelength_nm: number
  angle_deg: number
  spot_diameter_um: number
  temperature_C: number
  d10_um: number
  d50_um: number
  d90_um: number
  packing_fraction: number
  layer_thickness_um: number
}

export interface ParameterMeta {
  key: keyof Parameters
  label: string
  symbol: string
  unit: string
  min: number
  max: number
  step: number
  defaultValue: number
  tooltip: string
}

// ── Material presets ──────────────────────────────────────────────────────────

export interface MaterialPreset {
  key: MaterialKey
  label: string
  description: string
  T_liquidus_C: number
  T_solidus_C: number
}

// ── API request / response ────────────────────────────────────────────────────

export interface ComputeRequest {
  wavelength_nm: number
  angle_deg: number
  spot_diameter_um: number
  polarisation: Polarisation
  material: MaterialKey
  temperature_C: number
  d10_um: number
  d50_um: number
  d90_um: number
  packing_fraction: number
  layer_thickness_um: number
}

export interface TemperatureCurve {
  temperatures_C: number[]
  A_surface_values: number[]
  A_powder_values: number[]
}

export interface AngleCurve {
  angles_deg: number[]
  A_s_values: number[]
  A_p_values: number[]
  A_avg_values: number[]
}

export interface MaterialProperties {
  n: number
  k: number
  sigma_S_per_m: number
  T_liquidus_C: number
  T_solidus_C: number
}

export type RegimeKey = 'powder_bed' | 'liquid_surface' | 'keyhole'

export interface ComputeResponse {
  A_surface: number
  A_surface_s: number
  A_surface_p: number
  A_powder: number
  A_vs_temperature: TemperatureCurve
  A_vs_angle: AngleCurve
  regime: RegimeKey
  regime_note: string
  material_properties: MaterialProperties
}

// ── Ray trace ─────────────────────────────────────────────────────────────────

export interface RayTraceRequest {
  wavelength_nm: number
  angle_deg: number
  spot_diameter_um: number
  polarisation: Polarisation
  material: MaterialKey
  temperature_C: number
  d10_um: number
  d50_um: number
  d90_um: number
  packing_fraction: number
  layer_thickness_um: number
  n_rays: number
}

export interface ParticleData {
  x: number
  y: number
  radius: number
  absorbed_energy: number
}

export interface RaySegmentData {
  x0: number
  y0: number
  x1: number
  y1: number
  intensity: number
}

export interface RayData {
  segments: RaySegmentData[]
  absorbed_total: number
  n_bounces: number
  escaped: boolean
}

export interface RayTraceSummary {
  ray_count: number
  avg_bounces: number
}

export interface SceneBounds {
  width_um: number
  height_um: number
  powder_top_um: number
  powder_bottom_um: number
}

export interface RayTraceResponse {
  particles: ParticleData[]
  rays: RayData[]
  summary: RayTraceSummary
  scene: SceneBounds
}
