import type { MaterialKey } from '../../types'
import { MATERIAL_PRESETS } from './presets'

interface MaterialSelectorProps {
  value: MaterialKey
  onChange: (key: MaterialKey) => void
}

export function MaterialSelector({ value, onChange }: MaterialSelectorProps) {
  const current = MATERIAL_PRESETS.find((p) => p.key === value)

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-text-secondary text-xs font-medium uppercase tracking-wider">
        Material
      </span>
      <select
        className="styled-select"
        value={value}
        onChange={(e) => onChange(e.target.value as MaterialKey)}
        aria-label="Material selection"
      >
        {MATERIAL_PRESETS.map((p) => (
          <option key={p.key} value={p.key}>{p.label}</option>
        ))}
      </select>
      {current && (
        <p className="text-text-muted leading-snug" style={{ fontSize: '11px' }}>
          {current.description}
        </p>
      )}
    </div>
  )
}
