/** Placeholder panels for Phase 3 — replaced in Phases 5 & 6. */
export function VisualizationPlaceholder() {
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Ray trace canvas placeholder */}
      <div
        className="card w-full flex items-center justify-center"
        style={{ height: '320px', background: 'var(--bg-tertiary)' }}
      >
        <div className="text-center">
          <p className="text-text-muted font-mono" style={{ fontSize: '12px' }}>
            2D Ray Trace
          </p>
          <p className="text-text-muted" style={{ fontSize: '10px', marginTop: '4px' }}>
            Canvas visualisation — Phase 5
          </p>
        </div>
      </div>

      {/* Output plots row */}
      <div className="flex gap-4">
        {(['A vs Temperature', 'A vs Angle'] as const).map((label) => (
          <div
            key={label}
            className="card flex-1 flex items-center justify-center"
            style={{ height: '180px', background: 'var(--bg-tertiary)' }}
          >
            <div className="text-center">
              <p className="text-text-muted font-mono" style={{ fontSize: '11px' }}>{label}</p>
              <p className="text-text-muted" style={{ fontSize: '10px', marginTop: '4px' }}>Phase 6</p>
            </div>
          </div>
        ))}
      </div>

      {/* Results placeholder */}
      <div
        className="card w-full p-4 flex items-center justify-center"
        style={{ background: 'var(--bg-tertiary)' }}
      >
        <p className="text-text-muted font-mono" style={{ fontSize: '11px' }}>
          Results panel — Phase 7
        </p>
      </div>
    </div>
  )
}
