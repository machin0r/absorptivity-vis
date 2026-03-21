import { useState, useRef, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: string
}

export function Tooltip({ content }: TooltipProps) {
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLSpanElement>(null)
  const [style, setStyle] = useState<React.CSSProperties>({ position: 'fixed', visibility: 'hidden' })

  const show = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setAnchor({ top: rect.top - 8, left: rect.left + rect.width / 2 })
  }, [])

  const hide = useCallback(() => {
    setAnchor(null)
    setStyle({ position: 'fixed', visibility: 'hidden' })
  }, [])

  useLayoutEffect(() => {
    if (!anchor || !tooltipRef.current) return
    const tt  = tooltipRef.current.getBoundingClientRect()
    const pad = 8
    let left  = anchor.left - tt.width / 2
    let top   = anchor.top  - tt.height
    if (left < pad) left = pad
    if (left + tt.width > window.innerWidth - pad) left = window.innerWidth - pad - tt.width
    if (top  < pad) top  = anchor.top + 22
    setStyle({ position: 'fixed', top, left, visibility: 'visible' })
  }, [anchor])

  return (
    <span className="tooltip-root" onMouseEnter={show} onMouseLeave={hide}>
      <span
        ref={triggerRef}
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-text-muted text-text-muted hover:border-accent-primary hover:text-accent-primary transition-colors cursor-help select-none"
        style={{ fontSize: '9px', lineHeight: 1 }}
        aria-label="Info"
      >
        i
      </span>
      {anchor && createPortal(
        <span ref={tooltipRef} className="tooltip-box" role="tooltip" style={style}>
          {content}
        </span>,
        document.body
      )}
    </span>
  )
}
