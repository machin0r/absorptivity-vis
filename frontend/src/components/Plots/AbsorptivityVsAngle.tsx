import { useRef, useEffect } from 'react'
import type { ComputeResponse, Polarisation } from '../../types'
import {
  makePlotArea, toPlotX, toPlotY,
  drawAxes, drawXTicks, drawYTicks,
  drawSketchCurve, drawVerticalMarker, niceTickValues,
} from './plotUtils'
import { PENCIL_COLOR, PENCIL_LIGHT, PENCIL_FAINT, LASER_COLOR } from '../sketch/constants'

interface Props {
  data: ComputeResponse | null
  currentAngle: number
  polarisation: Polarisation
  loading: boolean
}

const CSS_HEIGHT = 240
const ANGLE_TICKS = [0, 15, 30, 45, 60, 75]

export function AbsorptivityVsAngle({ data, currentAngle, polarisation, loading }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr  = window.devicePixelRatio || 1
    const cssW = canvas.offsetWidth || 400
    const cssH = CSS_HEIGHT

    canvas.width  = cssW * dpr
    canvas.height = cssH * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, cssW, cssH)

    if (!data) {
      if (loading) {
        ctx.font      = '10px "JetBrains Mono", monospace'
        ctx.fillStyle = PENCIL_FAINT
        ctx.textAlign = 'center'
        ctx.fillText('computing…', cssW / 2, cssH / 2)
      }
      return
    }

    const { A_vs_angle: curve } = data
    const { angles_deg, A_s_values, A_p_values, A_avg_values } = curve

    const a    = makePlotArea(cssW, cssH)
    const xMin = 0
    const xMax = 85
    const rawMax = Math.max(...A_s_values, ...A_p_values, ...A_avg_values)
    const yMin = 0
    const yMax = Math.min(1.0, Math.ceil((rawMax + 0.05) * 10) / 10)

    drawAxes(ctx, a, 'Angle (°)', 'Absorptivity')
    drawXTicks(ctx, a, ANGLE_TICKS, xMin, xMax)
    drawYTicks(ctx, a, niceTickValues(yMin, yMax, 4), yMin, yMax)

    // ── A_s curve (dashed, muted) ─────────────────────────────────────────
    const sPts = angles_deg.map((θ, i) => ({
      x: toPlotX(θ, xMin, xMax, a),
      y: toPlotY(A_s_values[i], yMin, yMax, a),
    }))
    drawSketchCurve(ctx, sPts, { color: PENCIL_LIGHT, dashed: true, seed: 30, wobbleAmp: 0.3 })

    // ── A_p curve (dashed, accent) ────────────────────────────────────────
    const pPts = angles_deg.map((θ, i) => ({
      x: toPlotX(θ, xMin, xMax, a),
      y: toPlotY(A_p_values[i], yMin, yMax, a),
    }))
    drawSketchCurve(ctx, pPts, {
      color: LASER_COLOR, dashed: true, alpha: 0.75, seed: 40, wobbleAmp: 0.3,
    })

    // ── A_avg curve (solid, dark) ─────────────────────────────────────────
    const avgPts = angles_deg.map((θ, i) => ({
      x: toPlotX(θ, xMin, xMax, a),
      y: toPlotY(A_avg_values[i], yMin, yMax, a),
    }))
    drawSketchCurve(ctx, avgPts, {
      color: PENCIL_COLOR, strokeWidth: 1.5, seed: 50, wobbleAmp: 0.3,
    })

    // ── Brewster angle annotation (peak of A_p) ───────────────────────────
    const maxApIdx = A_p_values.indexOf(Math.max(...A_p_values))
    const θ_br = angles_deg[maxApIdx]
    if (θ_br >= 5 && θ_br <= 82) {
      const brX = toPlotX(θ_br, xMin, xMax, a)
      drawVerticalMarker(ctx, brX, a, {
        color: PENCIL_FAINT, dashed: true, label: 'Br.', labelAbove: true, seed: 70,
      })
    }

    // ── Current angle marker ──────────────────────────────────────────────
    const markerX = toPlotX(Math.min(xMax, currentAngle), xMin, xMax, a)
    drawVerticalMarker(ctx, markerX, a, { color: LASER_COLOR, seed: 80 })

    // Dots on each curve at current angle
    const ni = angles_deg.reduce(
      (bi, θ, i) => Math.abs(θ - currentAngle) < Math.abs(angles_deg[bi] - currentAngle) ? i : bi, 0,
    )
    const dotConfigs = [
      { values: A_s_values,   color: PENCIL_LIGHT,  r: 2   },
      { values: A_p_values,   color: LASER_COLOR,   r: 2   },
      { values: A_avg_values, color: PENCIL_COLOR,  r: 2.5 },
    ]
    for (const { values, color, r } of dotConfigs) {
      ctx.beginPath()
      ctx.arc(markerX, toPlotY(values[ni], yMin, yMax, a), r, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
    }

    // ── Legend (top-right) ────────────────────────────────────────────────
    ctx.save()
    ctx.font = '8px "IBM Plex Sans", sans-serif'
    ctx.textAlign = 'left'
    const lx = a.x + a.w - 52
    let   ly = a.y + 10

    // A_s
    ctx.setLineDash([3, 2]); ctx.strokeStyle = PENCIL_LIGHT; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 12, ly); ctx.stroke()
    ctx.fillStyle = PENCIL_LIGHT
    ctx.fillText('A_s', lx + 15, ly + 3)
    ly += 11

    // A_p
    ctx.setLineDash([3, 2]); ctx.strokeStyle = LASER_COLOR; ctx.globalAlpha = 0.75
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 12, ly); ctx.stroke()
    ctx.globalAlpha = 1; ctx.fillStyle = LASER_COLOR
    ctx.fillText('A_p', lx + 15, ly + 3)
    ly += 11

    // A_avg
    ctx.setLineDash([]); ctx.strokeStyle = PENCIL_COLOR; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 12, ly); ctx.stroke()
    ctx.fillStyle = PENCIL_COLOR
    ctx.fillText('A_avg', lx + 15, ly + 3)

    // Highlight the active polarisation label
    const activeLabel = polarisation === 's' ? 'A_s'
      : polarisation === 'p' ? 'A_p'
      : 'A_avg'
    ctx.font = '8px "IBM Plex Sans", sans-serif'
    ctx.strokeStyle = PENCIL_FAINT
    ctx.lineWidth   = 0.5
    ctx.setLineDash([])
    const labelYmap: Record<string, number> = { A_s: a.y + 10 + 3, A_p: a.y + 21 + 3, A_avg: a.y + 32 + 3 }
    const textW = ctx.measureText(activeLabel).width
    ctx.strokeRect(lx + 14, labelYmap[activeLabel] - 8, textW + 2, 10)

    ctx.restore()

    if (loading) {
      ctx.font      = '8px "JetBrains Mono", monospace'
      ctx.fillStyle = PENCIL_LIGHT
      ctx.textAlign = 'left'
      ctx.fillText('updating…', a.x + 4, a.y + a.h - 4)
    }
  }, [data, currentAngle, polarisation, loading])

  return (
    <div
      className="card flex-1 overflow-hidden"
      style={{ height: `${CSS_HEIGHT}px`, background: 'var(--bg-secondary)' }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  )
}
