import type { MaterialKey, MaterialPreset, ParameterMeta, Parameters } from '../../types'

// ── Material presets ──────────────────────────────────────────────────────────

export const MATERIAL_PRESETS: MaterialPreset[] = [
  { key: '316L',      label: '316L Stainless Steel', description: 'Austenitic stainless steel, excellent corrosion resistance', T_liquidus_C: 1400, T_solidus_C: 1370 },
  { key: 'Ti-6Al-4V', label: 'Ti-6Al-4V',            description: 'Titanium alloy, aerospace and medical applications',          T_liquidus_C: 1655, T_solidus_C: 1604 },
  { key: 'IN718',     label: 'IN718 (Inconel 718)',   description: 'Nickel superalloy, high-temperature turbine applications',    T_liquidus_C: 1336, T_solidus_C: 1260 },
  { key: 'AlSi10Mg',  label: 'AlSi10Mg',              description: 'Aluminium alloy, lightweight automotive and aerospace',       T_liquidus_C:  596, T_solidus_C:  555 },
  { key: 'CoCrMo',    label: 'CoCrMo',                description: 'Cobalt-chromium alloy, biomedical implants',                 T_liquidus_C: 1350, T_solidus_C: 1315 },
  { key: 'Cu',        label: 'Copper (Cu)',            description: 'Pure copper — high conductivity, challenging at 1064 nm',    T_liquidus_C: 1085, T_solidus_C: 1083 },
]

export function getPreset(key: MaterialKey): MaterialPreset {
  return MATERIAL_PRESETS.find((p) => p.key === key) ?? MATERIAL_PRESETS[0]
}

/** Maximum temperature for the slider (300°C above liquidus). */
export function tempSliderMax(key: MaterialKey): number {
  return getPreset(key).T_liquidus_C + 300
}

// ── Wavelength presets ────────────────────────────────────────────────────────

export const WAVELENGTH_PRESETS = [
  { nm: 515,   label: '515 nm', sublabel: 'Green' },
  { nm: 1064,  label: '1064 nm', sublabel: 'Nd:YAG / Fibre' },
  { nm: 10600, label: '10600 nm', sublabel: 'CO\u2082' },
]

// ── Numeric slider metadata ───────────────────────────────────────────────────
// String params (material, polarisation, wavelength presets) use dedicated selectors.

export const LASER_SLIDERS: ParameterMeta[] = [
  {
    key: 'angle_deg',
    label: 'Angle of incidence',
    symbol: '\u03b8',
    unit: '\u00b0',
    min: 0, max: 85, step: 1, defaultValue: 0,
    tooltip: 'Angle of the laser beam from the surface normal (0\u00b0 = normal incidence). Affects Fresnel s/p splitting and the pseudo-Brewster angle enhancement for p-polarisation.',
  },
  {
    key: 'spot_diameter_um',
    label: 'Spot diameter',
    symbol: 'd',
    unit: '\u00b5m',
    min: 20, max: 500, step: 5, defaultValue: 80,
    tooltip: 'Laser spot diameter at the powder bed surface. Used for display scaling and regime indication. Does not affect the absorptivity calculation directly in v1.',
  },
]

export const POWDER_SLIDERS: ParameterMeta[] = [
  {
    key: 'd10_um',
    label: 'D10',
    symbol: 'D\u2081\u2080',
    unit: '\u00b5m',
    min: 5, max: 60, step: 1, defaultValue: 15,
    tooltip: '10th percentile of the particle size distribution — 10% of particles are smaller than this diameter. Affects the spread of particle sizes in the ray trace scene.',
  },
  {
    key: 'd50_um',
    label: 'D50 (median)',
    symbol: 'D\u2085\u2080',
    unit: '\u00b5m',
    min: 10, max: 80, step: 1, defaultValue: 30,
    tooltip: 'Median particle diameter. Used as the representative particle size in the Gusarov radiative transfer model. Ratio of layer thickness to D50 determines optical depth.',
  },
  {
    key: 'd90_um',
    label: 'D90',
    symbol: 'D\u2089\u2080',
    unit: '\u00b5m',
    min: 20, max: 120, step: 1, defaultValue: 50,
    tooltip: '90th percentile of the particle size distribution — 90% of particles are smaller than this diameter.',
  },
  {
    key: 'packing_fraction',
    label: 'Packing fraction',
    symbol: '\u03b7',
    unit: '',
    min: 0.50, max: 0.68, step: 0.01, defaultValue: 0.60,
    tooltip: 'Volume fraction of solid particles in the powder bed. Typical random packing: 0.60\u20130.64. Higher packing \u2192 greater optical depth \u2192 more multiple reflections \u2192 higher effective absorptivity.',
  },
  {
    key: 'layer_thickness_um',
    label: 'Layer thickness',
    symbol: 't',
    unit: '\u00b5m',
    min: 10, max: 100, step: 5, defaultValue: 40,
    tooltip: 'Thickness of the powder layer. With packing fraction and D50, determines the optical depth \u03c4 = 1.5 \u00d7 \u03b7 \u00d7 (t/D50). Thin layers (t \u2248 D50) are less optically thick, reducing the multiple-reflection enhancement.',
  },
]

// ── Default parameters ────────────────────────────────────────────────────────

export function defaultParams(): Parameters {
  return {
    wavelength_nm:      1064,
    angle_deg:          0,
    spot_diameter_um:   80,
    temperature_C:      25,
    d10_um:             15,
    d50_um:             30,
    d90_um:             50,
    packing_fraction:   0.60,
    layer_thickness_um: 40,
  }
}
