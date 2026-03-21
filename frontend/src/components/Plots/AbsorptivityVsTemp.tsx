import { useRef, useEffect } from 'react'
import type { ComputeResponse } from '../../types'
import {
  makePlotArea, toPlotX, toPlotY,
  drawAxes, drawXTicks, drawYTicks,
  drawSketchCurve, drawVerticalMarker, niceTickValues,
} from './plotUtils'
import { PENCIL_COLOR, PENCIL_LIGHT, PENCIL_FAINT, LASER_COLOR } from '../sketch/constants'

interface Props {
  data: ComputeResponse | null
  currentTemp: number
  loading: boolean
}

const CSS_HEIGHT = 180

export function AbsorptivityVsTemp({ data, currentTemp, loading }: Props) {
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

    const { A_vs_temperature: curve, material_properties: matProps } = data
    const { temperatures_C, A_surface_values, A_powder_values } = curve

    const a    = makePlotArea(cssW, cssH)
    const xMin = temperatures_C[0]
    const xMax = temperatures_C[temperatures_C.length - 1]
    const rawMax = Math.max(...A_powder_values, ...A_surface_values)
    const yMin = 0
    const yMax = Math.min(1.0, Math.ceil((rawMax + 0.05) * 10) / 10)

    drawAxes(ctx, a, 'Temperature (°C)', 'Absorptivity')

    drawXTicks(ctx, a, niceTickValues(xMin, xMax, 5), xMin, xMax)
    drawYTicks(ctx, a, niceTickValues(yMin, yMax, 4), yMin, yMax)

    // ── A_surface curve (dashed, muted) ──────────────────────────────────
    const surfPts = temperatures_C.map((T, i) => ({
      x: toPlotX(T, xMin, xMax, a),
      y: toPlotY(A_surface_values[i], yMin, yMax, a),
    }))
    drawSketchCurve(ctx, surfPts, {
      color: PENCIL_LIGHT, dashed: true, seed: 10, wobbleAmp: 0.3,
    })

    // ── A_powder curve (solid, darker) ───────────────────────────────────
    const powdPts = temperatures_C.map((T, i) => ({
      x: toPlotX(T, xMin, xMax, a),
      y: toPlotY(A_powder_values[i], yMin, yMax, a),
    }))
    drawSketchCurve(ctx, powdPts, {
      color: PENCIL_COLOR, strokeWidth: 1.5, seed: 20, wobbleAmp: 0.3,
    })

    // ── Liquidus marker ───────────────────────────────────────────────────
    const T_liq = matProps.T_liquidus_C
    if (T_liq >= xMin && T_liq <= xMax) {
      const liqX = toPlotX(T_liq, xMin, xMax, a)
      drawVerticalMarker(ctx, liqX, a, {
        color: PENCIL_FAINT, dashed: true, label: 'liq.', labelAbove: true, seed: 50,
      })
    }

    // ── Current temperature marker ────────────────────────────────────────
    const clampedT = Math.max(xMin, Math.min(xMax, currentTemp))
    const markerX  = toPlotX(clampedT, xMin, xMax, a)
    drawVerticalMarker(ctx, markerX, a, { color: LASER_COLOR, seed: 60 })

    // Dots at intersection with each curve
    const ni = temperatures_C.reduce(
      (bi, T, i) => Math.abs(T - currentTemp) < Math.abs(temperatures_C[bi] - currentTemp) ? i : bi, 0,
    )
    ctx.beginPath()
    ctx.arc(markerX, toPlotY(A_surface_values[ni], yMin, yMax, a), 2.5, 0, Math.PI * 2)
    ctx.fillStyle = PENCIL_LIGHT
    ctx.fill()

    ctx.beginPath()
    ctx.arc(markerX, toPlotY(A_powder_values[ni], yMin, yMax, a), 3, 0, Math.PI * 2)
    ctx.fillStyle = LASER_COLOR
    ctx.fill()

    // ── Legend ────────────────────────────────────────────────────────────
    ctx.save()
    ctx.font = '8px "IBM Plex Sans", sans-serif'
    ctx.textAlign = 'left'
    const lx = a.x + 6
    let   ly = a.y + 10

    ctx.setLineDash([3, 2])
    ctx.strokeStyle = PENCIL_LIGHT
    ctx.lineWidth   = 1
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 14, ly); ctx.stroke()
    ctx.fillStyle = PENCIL_LIGHT
    ctx.fillText('A_surface', lx + 17, ly + 3)
    ly += 11

    ctx.setLineDash([])
    ctx.strokeStyle = PENCIL_COLOR
    ctx.lineWidth   = 1.5
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 14, ly); ctx.stroke()
    ctx.fillStyle = PENCIL_COLOR
    ctx.fillText('A_powder', lx + 17, ly + 3)

    ctx.restore()

    if (loading) {
      ctx.font      = '8px "JetBrains Mono", monospace'
      ctx.fillStyle = PENCIL_LIGHT
      ctx.textAlign = 'left'
      ctx.fillText('updating…', a.x + 4, a.y + a.h - 4)
    }
  }, [data, currentTemp, loading])

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
