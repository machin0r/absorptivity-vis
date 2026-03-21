import type { RegimeKey } from '../../types'

interface Props {
  regime: RegimeKey
  note: string
}

const REGIME_CONFIG: Record<RegimeKey, { label: string; color: string; bg: string; border: string }> = {
  powder_bed: {
    label:  'Powder Bed',
    color:  'var(--text-primary)',
    bg:     'var(--bg-tertiary)',
    border: 'var(--border-active)',
  },
  liquid_surface: {
    label:  'Liquid Surface',
    color:  'var(--accent-primary)',
    bg:     '#FDF0EB',
    border: 'var(--accent-primary)',
  },
  keyhole: {
    label:  'Keyhole',
    color:  'var(--accent-primary)',
    bg:     '#FDEAE4',
    border: 'var(--accent-primary)',
  },
}

export function RegimeIndicator({ regime, note }: Props) {
  const cfg = REGIME_CONFIG[regime]
  return (
    <div>
      <span
        className="numeral"
        style={{
          display:      'inline-block',
          padding:      '2px 8px',
          borderRadius: '4px',
          border:       `1px solid ${cfg.border}`,
          background:   cfg.bg,
          color:        cfg.color,
          fontSize:     '11px',
          fontWeight:   500,
          letterSpacing: '0.03em',
        }}
      >
        {cfg.label}
      </span>
      <p
        style={{
          fontSize:   '10px',
          color:      'var(--text-muted)',
          marginTop:  '5px',
          lineHeight: 1.45,
          maxWidth:   '180px',
        }}
      >
        {note}
      </p>
    </div>
  )
}
