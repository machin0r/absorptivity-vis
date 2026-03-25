import { useState } from 'react'
import type { MaterialKey, Parameters, Polarisation } from '../../types'
import { LASER_SLIDERS, POWDER_SLIDERS } from './presets'
import { ParameterSlider } from './ParameterSlider'
import { MaterialSelector } from './MaterialSelector'
import { WavelengthSelector } from './WavelengthSelector'
import { PolarisationSelector } from './PolarisationSelector'

interface ControlPanelProps {
  params: Parameters
  material: MaterialKey
  polarisation: Polarisation
  tempMax: number
  onParamChange: (key: keyof Parameters, value: number) => void
  onMaterialChange: (key: MaterialKey) => void
  onPolarisationChange: (pol: Polarisation) => void
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="font-sans font-semibold text-text-muted uppercase tracking-widest"
      style={{ fontSize: '10px', letterSpacing: '0.12em' }}
    >
      {children}
    </h3>
  )
}

export function ControlPanel({
  params,
  material,
  polarisation,
  tempMax,
  onParamChange,
  onMaterialChange,
  onPolarisationChange,
}: ControlPanelProps) {
  return (
    <div className="flex flex-col gap-5 h-full" aria-label="Parameter controls">

      {/* ── LASER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
        <SectionLabel>Laser</SectionLabel>

        <WavelengthSelector
          value={params.wavelength_nm}
          onChange={(nm) => onParamChange('wavelength_nm', nm)}
        />

        {LASER_SLIDERS.map((meta, i) => (
          <ParameterSlider
            key={meta.key}
            meta={meta}
            value={params[meta.key]}
            onChange={onParamChange}
            animationClass={`stagger-${i + 2}`}
          />
        ))}

      </div>

      <div className="border-t border-border-subtle" />

      {/* ── MATERIAL ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
        <SectionLabel>Material</SectionLabel>

        <MaterialSelector value={material} onChange={onMaterialChange} />

        <ParameterSlider
          meta={{
            key: 'temperature_C',
            label: 'Temperature',
            symbol: 'T',
            unit: '\u00b0C',
            min: 25,
            max: tempMax,
            step: 10,
            defaultValue: 25,
            tooltip: 'Surface temperature at the laser interaction zone. Drives the Hagen-Rubens conductivity correction — absorptivity rises toward the melting point. At or above liquidus, the powder model is replaced by flat-surface Fresnel.',
          }}
          value={params.temperature_C}
          max={tempMax}
          onChange={onParamChange}
          animationClass="stagger-4"
        />
      </div>

      <div className="border-t border-border-subtle" />

      {/* ── POWDER BED ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 animate-fade-in-up stagger-4" style={{ opacity: 0 }}>
        <SectionLabel>Powder Bed</SectionLabel>

        {POWDER_SLIDERS.map((meta, i) => (
          <ParameterSlider
            key={meta.key}
            meta={meta}
            value={params[meta.key]}
            onChange={onParamChange}
            animationClass={`stagger-${Math.min(i + 4, 6)}`}
          />
        ))}

        {/* Optical depth indicator */}
        <div className="card p-3 animate-fade-in-up stagger-6" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-text-muted" style={{ fontSize: '11px' }}>Optical depth</span>
            <span className="numeral text-accent-primary font-medium" style={{ fontSize: '13px' }}>
              {(1.5 * params.packing_fraction * params.layer_thickness_um / params.d50_um).toFixed(2)}
            </span>
          </div>
          <p className="text-text-muted leading-snug" style={{ fontSize: '10px' }}>
            {'\u03c4'} = 1.5 {'\u00d7'} {'\u03b7'} {'\u00d7'} (t / D50) — Gusarov model assumes {'\u03c4'} {'\u226b'} 1
          </p>
        </div>
      </div>

      <div className="border-t border-border-subtle" />

      {/* ── ADVANCED ──────────────────────────────────────────────────────── */}
      <AdvancedSection
        polarisation={polarisation}
        onPolarisationChange={onPolarisationChange}
      />

    </div>
  )
}

function AdvancedSection({
  polarisation,
  onPolarisationChange,
}: {
  polarisation: Polarisation
  onPolarisationChange: (pol: Polarisation) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up stagger-6" style={{ opacity: 0 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-left"
        aria-expanded={open}
      >
        <h3
          className="font-sans font-semibold text-text-muted uppercase tracking-widest"
          style={{ fontSize: '10px', letterSpacing: '0.12em' }}
        >
          Advanced
        </h3>
        <span
          style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            transition: 'transform 0.2s ease',
            display: 'inline-block',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <PolarisationSelector
          value={polarisation}
          onChange={onPolarisationChange}
        />
      )}
    </div>
  )
}
