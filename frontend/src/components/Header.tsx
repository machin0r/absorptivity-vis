export function Header() {
  return (
    <header
      className="flex items-center justify-between px-6 py-4 border-b border-border-subtle animate-fade-in-up stagger-1"
      style={{ opacity: 0 }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Logo mark — laser beam hitting powder */}
        <div
          className="shrink-0 w-8 h-8 rounded flex items-center justify-center"
          style={{ background: '#F5F0EB', border: '1px solid #E0D8D0' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            {/* Laser beam */}
            <line x1="9" y1="1" x2="9" y2="8" stroke="#C05030" strokeWidth="1.4" strokeLinecap="round" />
            {/* Reflected rays */}
            <line x1="9" y1="8" x2="4" y2="3"  stroke="#C05030" strokeWidth="0.9" strokeLinecap="round" strokeOpacity="0.6" />
            <line x1="9" y1="8" x2="14" y2="3" stroke="#C05030" strokeWidth="0.9" strokeLinecap="round" strokeOpacity="0.6" />
            {/* Powder bed circles */}
            <circle cx="5"  cy="12" r="2.5" stroke="#999" strokeWidth="1"   fill="#f5f0eb" />
            <circle cx="9"  cy="10" r="2"   stroke="#999" strokeWidth="1"   fill="#f5f0eb" />
            <circle cx="13" cy="12" r="2.5" stroke="#999" strokeWidth="1"   fill="#f5f0eb" />
          </svg>
        </div>

        <div className="min-w-0">
          <h1
            className="font-sans font-semibold text-text-primary truncate"
            style={{ fontSize: '15px', letterSpacing: '0.02em' }}
          >
            Laser Absorptivity Calculator
          </h1>
          <p className="text-text-muted truncate" style={{ fontSize: '11px' }}>
            Fresnel · Hagen-Rubens · Gusarov radiative transfer
          </p>
        </div>
      </div>
    </header>
  )
}
