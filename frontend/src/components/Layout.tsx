import type { ReactNode } from 'react'

interface LayoutProps {
  header: ReactNode
  sidebar: ReactNode
  main: ReactNode
  footer: ReactNode
}

export function Layout({ header, sidebar, main, footer }: LayoutProps) {
  return (
    <div className="flex flex-col" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {header}

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row" style={{ minHeight: 0 }}>
        {/* Sidebar */}
        <aside
          className="shrink-0 overflow-y-auto border-border-subtle p-4 border-b md:border-b-0 md:border-r w-full md:w-[300px] max-h-[45vh] md:max-h-none"
          style={{ background: 'var(--bg-secondary)' }}
        >
          {sidebar}
        </aside>

        {/* Main visualization area */}
        <main
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-4"
          style={{ minWidth: 0 }}
        >
          {main}
        </main>
      </div>

      {footer}
    </div>
  )
}
