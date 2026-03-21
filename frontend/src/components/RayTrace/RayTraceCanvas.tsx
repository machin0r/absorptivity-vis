import { useRef, useEffect } from 'react'
import type { RayTraceResponse } from '../../types'
import { drawParticles } from './drawParticles'
import { drawRays } from './drawRays'
import { drawAnnotations } from './drawAnnotations'
import { PENCIL_FAINT, PENCIL_LIGHT } from '../sketch/constants'

interface Props {
  data: RayTraceResponse | null
  loading: boolean
  error: string | null
}

const CSS_HEIGHT = 320

export function RayTraceCanvas({ data, loading, error }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const cssW = canvas.offsetWidth || 600
    const cssH = CSS_HEIGHT

    canvas.width  = cssW * dpr
    canvas.height = cssH * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, cssW, cssH)

    // No data yet — show placeholder text
    if (!data) {
      if (loading) {
        ctx.font = '11px "JetBrains Mono", monospace'
        ctx.fillStyle = PENCIL_FAINT
        ctx.textAlign = 'center'
        ctx.fillText('computing…', cssW / 2, cssH / 2)
      }
      return
    }

    const { particles, rays, summary, scene } = data

    // ── Coordinate mapping: scene µm → canvas px ────────────────────────────
    const PAD      = 28
    const CALLOUT_H = 22
    const usableW = cssW - 2 * PAD
    const usableH = cssH - 2 * PAD - CALLOUT_H

    const scale   = Math.min(usableW / scene.width_um, usableH / scene.height_um)
    const offsetX = PAD + (usableW - scene.width_um  * scale) / 2
    const offsetY = PAD + (usableH - scene.height_um * scale) / 2

    const toCanvas = (x: number, y: number) => ({
      x: offsetX + x * scale,
      y: offsetY + y * scale,
    })

    // ── Substrate region (below powder bed) ──────────────────────────────────
    const subTL = toCanvas(0, scene.powder_bottom_um)
    const subBR = toCanvas(scene.width_um, scene.height_um)
    ctx.fillStyle = 'rgba(229, 224, 219, 0.55)'
    ctx.fillRect(subTL.x, subTL.y, subBR.x - subTL.x, subBR.y - subTL.y)

    // ── Scene elements ───────────────────────────────────────────────────────
    drawParticles(ctx, particles, toCanvas, scale)
    drawRays(ctx, rays, toCanvas)
    drawAnnotations(ctx, summary, scene, toCanvas, cssW, cssH)

    // ── Subtle "updating…" indicator while new data loads ───────────────────
    if (loading) {
      ctx.font = '9px "JetBrains Mono", monospace'
      ctx.textAlign = 'left'
      ctx.fillStyle = PENCIL_LIGHT
      ctx.fillText('updating…', 10, cssH - 10)
    }
  }, [data, loading])

  return (
    <div
      className="card w-full overflow-hidden relative"
      style={{ height: `${CSS_HEIGHT}px`, background: 'var(--bg-secondary)' }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      {error && !data && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
