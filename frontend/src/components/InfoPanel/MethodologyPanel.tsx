import { useState } from 'react'

const LIMITATIONS = [
  '(n, k) values are temperature-independent in v1 — significant above ~500 °C',
  'Hagen-Rubens relation is less accurate at short wavelengths (515 nm)',
  'Gusarov model assumes optically thick bed — thin layers relative to D50 are less accurate',
  'Powder bed surface is assumed flat — real beds have surface topology',
  'Keyhole regime is flagged but not modelled — full coupling required',
  'Beam polarisation state in real machines is often not well characterised',
  'Beam profile (Gaussian vs top-hat) is not modelled',
  'Oxide layers and surface contamination are not modelled',
  '2D ray trace is illustrative only — absorptivity is from the Gusarov model',
]

function SectionHead({ children }: { children: string }) {
  return (
    <h4
      style={{
        fontSize:      '9px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color:         'var(--text-muted)',
        fontFamily:    "'IBM Plex Sans', sans-serif",
        marginBottom:  '8px',
      }}
    >
      {children}
    </h4>
  )
}

function Eq({ children }: { children: string }) {
  return (
    <div
      className="numeral"
      style={{
        background:   'var(--bg-tertiary)',
        border:       '1px solid var(--border-subtle)',
        borderRadius: '4px',
        padding:      '8px 10px',
        fontSize:     '11px',
        lineHeight:   1.7,
        color:        'var(--text-secondary)',
        whiteSpace:   'pre',
        overflowX:    'auto',
      }}
    >
      {children}
    </div>
  )
}

export function MethodologyPanel() {
  const [open, setOpen] = useState(false)

  return (
    <div className="card w-full overflow-hidden">
      {/* Header / toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
        style={{ background: 'transparent' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        aria-expanded={open}
      >
        <span
          style={{
            fontSize:   '11px',
            fontWeight: 500,
            color:      'var(--text-secondary)',
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        >
          Methodology &amp; Limitations
        </span>
        <span
          style={{
            fontSize:   '10px',
            color:      'var(--text-muted)',
            transition: 'transform 0.2s ease',
            display:    'inline-block',
            transform:  open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          className="flex flex-col gap-5 border-t border-border-subtle"
          style={{ padding: '16px' }}
        >

          {/* ── Fresnel ─────────────────────────────────────────────── */}
          <div>
            <SectionHead>Surface absorptivity — Fresnel equations</SectionHead>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '8px' }}>
              Complex refractive index <span className="numeral">ñ = n + ik</span> gives reflectance for each
              polarisation. Temperature correction via Hagen-Rubens scales <span className="numeral">σ(T)</span>.
            </p>
            <Eq>{`R_s = |(cos θ − √(ñ² − sin²θ)) / (cos θ + √(ñ² − sin²θ))|²
R_p = |(ñ²cos θ − √(ñ² − sin²θ)) / (ñ²cos θ + √(ñ² − sin²θ))|²
A = 1 − R`}</Eq>
          </div>

          {/* ── Hagen-Rubens ────────────────────────────────────────── */}
          <div>
            <SectionHead>Temperature correction — Hagen-Rubens</SectionHead>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '8px' }}>
              Valid in the IR regime. Electrical conductivity <span className="numeral">σ(T)</span> is
              tabulated per material and interpolated across the temperature slider.
              Absorptivity rises toward the melting point, then jumps at the liquid transition.
            </p>
            <Eq>{`A_HR ≈ 2√(2ε₀ω / σ(T))    where  ω = 2πc / λ`}</Eq>
          </div>

          {/* ── Gusarov ─────────────────────────────────────────────── */}
          <div>
            <SectionHead>Powder bed absorptivity — Gusarov two-flux model</SectionHead>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '8px' }}>
              Two-flux radiative transfer through a packed bed of spheres. Derives effective absorptivity
              from single-surface Fresnel reflectance and packing geometry. Optical depth:
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '8px' }}>
              The 2D ray trace above shows the multiple-reflection mechanism qualitatively using specular
              reflections between a small number of particles. The Gusarov model works differently: it treats
              the powder bed as a 1D slab with diffuse (Lambertian) scattering and solves for the steady-state
              radiation field analytically. This captures the statistical effect of many reflections in 3D that
              a 2D cross-section with 20 rays cannot, which is why the reported A_powder value comes from
              Gusarov, not the ray trace.
            </p>
            <Eq>{`τ = 1.5 × η × (t / D50)    [Gusarov & Kruth, 2005]

Inputs: A_surface, η (packing fraction), t (layer thickness), D50
Output: A_powder — the primary reported number`}</Eq>
          </div>

          {/* ── Limitations ─────────────────────────────────────────── */}
          <div>
            <SectionHead>Known limitations</SectionHead>
            <ul style={{ margin: 0, paddingLeft: '14px' }}>
              {LIMITATIONS.map((lim) => (
                <li
                  key={lim}
                  style={{
                    fontSize:    '11px',
                    color:       'var(--text-muted)',
                    lineHeight:  1.55,
                    marginBottom: '3px',
                  }}
                >
                  {lim}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Sources ─────────────────────────────────────────────── */}
          <div>
            <SectionHead>Data sources</SectionHead>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              <div><span className="numeral">(n, k)</span> — Palik, <em>Handbook of Optical Constants of Solids</em></div>
              <div><span className="numeral">σ(T)</span> — ASM Handbook, NIST property databases</div>
              <div>Gusarov model — Gusarov &amp; Kruth (2005); Gusarov et al. (2009)</div>
              <div>Fresnel &amp; Hagen-Rubens — standard electromagnetic theory</div>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
