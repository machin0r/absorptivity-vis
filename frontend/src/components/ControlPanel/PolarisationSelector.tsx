import type { Polarisation } from '../../types'

const OPTIONS: { value: Polarisation; label: string; sublabel: string }[] = [
  { value: 'unpolarised', label: 'Unpol.',   sublabel: 'avg' },
  { value: 'circular',    label: 'Circular', sublabel: '(s+p)/2' },
  { value: 's',           label: 's-pol',    sublabel: 'TE' },
  { value: 'p',           label: 'p-pol',    sublabel: 'TM' },
]

interface PolarisationSelectorProps {
  value: Polarisation
  onChange: (pol: Polarisation) => void
}

export function PolarisationSelector({ value, onChange }: PolarisationSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-text-secondary text-xs font-medium">Polarisation</span>
      <div className="flex gap-1">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex-1 flex flex-col items-center py-1.5 rounded transition-colors"
            style={{
              fontSize: '10px',
              border: opt.value === value ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              background: opt.value === value ? '#FDF0EC' : 'var(--bg-primary)',
              color: opt.value === value ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}
          >
            <span className="font-medium">{opt.label}</span>
            <span style={{ fontSize: '9px', color: opt.value === value ? '#C05030aa' : 'var(--text-muted)' }}>
              {opt.sublabel}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
