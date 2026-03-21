import { useState } from 'react'
import { WAVELENGTH_PRESETS } from './presets'

interface WavelengthSelectorProps {
  value: number
  onChange: (nm: number) => void
}

export function WavelengthSelector({ value, onChange }: WavelengthSelectorProps) {
  const [customInput, setCustomInput] = useState('')

  const isPreset    = WAVELENGTH_PRESETS.some((p) => p.nm === value)
  const activePreset = WAVELENGTH_PRESETS.find((p) => p.nm === value)

  const handleCustomCommit = () => {
    const nm = parseFloat(customInput)
    if (!isNaN(nm) && nm > 0) onChange(nm)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-text-secondary text-xs font-medium">Wavelength</span>
        <span className="numeral text-accent-primary font-medium" style={{ fontSize: '13px' }}>
          {value} nm
        </span>
      </div>

      {/* Preset buttons */}
      <div className="flex gap-1.5">
        {WAVELENGTH_PRESETS.map((p) => (
          <button
            key={p.nm}
            onClick={() => onChange(p.nm)}
            className="flex-1 flex flex-col items-center py-1.5 px-1 rounded transition-colors"
            style={{
              fontSize: '10px',
              border: p.nm === value ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              background: p.nm === value ? '#FDF0EC' : 'var(--bg-primary)',
              color: p.nm === value ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}
          >
            <span className="numeral font-medium">{p.label}</span>
            <span style={{ color: p.nm === value ? '#C05030aa' : 'var(--text-muted)', fontSize: '9px' }}>
              {p.sublabel}
            </span>
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          placeholder="Custom nm"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onBlur={handleCustomCommit}
          onKeyDown={(e) => e.key === 'Enter' && handleCustomCommit()}
          className="flex-1 numeral text-text-primary outline-none"
          style={{
            fontSize: '12px',
            padding: '5px 8px',
            border: !isPreset && customInput ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
            borderRadius: '6px',
            background: 'var(--bg-primary)',
          }}
          aria-label="Custom wavelength in nanometres"
          min={1}
          max={100000}
        />
        <span className="text-text-muted" style={{ fontSize: '11px' }}>nm</span>
      </div>

      {activePreset && (
        <p className="text-text-muted" style={{ fontSize: '10px' }}>
          {activePreset.sublabel} laser
        </p>
      )}
    </div>
  )
}
