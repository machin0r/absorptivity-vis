import type { ComputeResponse } from '../../types'
import { RegimeIndicator } from './RegimeIndicator'

interface Props {
  data: ComputeResponse | null
  loading: boolean
}

function Skeleton({ w, h }: { w: number; h: number }) {
  return <div className="skeleton" style={{ width: `${w}px`, height: `${h}px` }} />
}

function Divider() {
  return (
    <div
      style={{
        width:      '1px',
        alignSelf:  'stretch',
        background: 'var(--border-subtle)',
        flexShrink: 0,
      }}
    />
  )
}

function Label({ children }: { children: string }) {
  return (
    <p
      style={{
        fontSize:      '9px',
        color:         'var(--text-muted)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontFamily:    "'IBM Plex Sans', sans-serif",
        marginBottom:  '4px',
      }}
    >
      {children}
    </p>
  )
}

function formatSigma(sigma: number): string {
  return sigma.toExponential(2).replace('e+', ' × 10^').replace('e-', ' × 10^-')
}

export function ResultsPanel({ data, loading }: Props) {
  const isReady = !!data

  return (
    <div
      className="card w-full"
      style={{ background: 'var(--bg-secondary)' }}
    >
      <div
        className="flex gap-5 items-start flex-wrap"
        style={{ padding: '14px 18px' }}
      >

        {/* ── A_powder — primary result ────────────────────────────── */}
        <div style={{ minWidth: '110px' }}>
          <Label>A_powder</Label>
          {isReady ? (
            <>
              <div
                className="numeral"
                style={{
                  fontSize:    '32px',
                  fontWeight:  600,
                  color:       'var(--text-primary)',
                  lineHeight:  1,
                  marginBottom: '4px',
                }}
              >
                {data.A_powder.toFixed(3)}
              </div>
              <p style={{ fontSize: '9px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                effective powder bed<br />absorptivity
              </p>
            </>
          ) : (
            <div className="flex flex-col gap-1">
              <Skeleton w={90} h={32} />
              <Skeleton w={70} h={10} />
            </div>
          )}
        </div>

        <Divider />

        {/* ── A_surface ────────────────────────────────────────────── */}
        <div style={{ minWidth: '100px' }}>
          <Label>A_surface</Label>
          {isReady ? (
            <>
              <div
                className="numeral"
                style={{
                  fontSize:    '24px',
                  fontWeight:  500,
                  color:       'var(--text-secondary)',
                  lineHeight:  1,
                  marginBottom: '6px',
                }}
              >
                {data.A_surface.toFixed(3)}
              </div>
              <div
                className="numeral"
                style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6 }}
              >
                <span>s: {data.A_surface_s.toFixed(3)}</span>
                <br />
                <span>p: {data.A_surface_p.toFixed(3)}</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-1">
              <Skeleton w={75} h={24} />
              <Skeleton w={60} h={10} />
              <Skeleton w={60} h={10} />
            </div>
          )}
        </div>

        <Divider />

        {/* ── Regime ──────────────────────────────────────────────── */}
        <div style={{ minWidth: '140px', flex: '1 1 140px' }}>
          <Label>Regime</Label>
          {isReady ? (
            <RegimeIndicator regime={data.regime} note={data.regime_note} />
          ) : (
            <div className="flex flex-col gap-2">
              <Skeleton w={90} h={20} />
              <Skeleton w={140} h={10} />
              <Skeleton w={120} h={10} />
            </div>
          )}
        </div>

        <Divider />

        {/* ── Material properties ──────────────────────────────────── */}
        <div style={{ minWidth: '160px', flex: '1 1 160px' }}>
          <Label>Optical constants</Label>
          {isReady ? (
            <div
              className="numeral"
              style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.8 }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>n = </span>
                {data.material_properties.n.toFixed(3)}
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>k = </span>
                {data.material_properties.k.toFixed(3)}
              </div>
              <div style={{ marginTop: '2px', fontSize: '10px', color: 'var(--text-muted)' }}>
                σ = {formatSigma(data.material_properties.sigma_S_per_m)} S/m
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <Skeleton w={80} h={11} />
              <Skeleton w={80} h={11} />
              <Skeleton w={110} h={11} />
            </div>
          )}
        </div>

      </div>

      {/* loading underline */}
      {loading && (
        <div
          style={{
            height:     '2px',
            background: 'linear-gradient(90deg, transparent, var(--border-active), transparent)',
            borderRadius: '0 0 8px 8px',
          }}
        />
      )}
    </div>
  )
}
