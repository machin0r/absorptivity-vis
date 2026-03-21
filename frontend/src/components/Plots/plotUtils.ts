import { noise1D } from '../sketch/noise'
import { wobblyLine } from '../sketch/wobblyLine'
import {
  PENCIL_COLOR, PENCIL_LIGHT,
  STROKE_WIDTH_THIN,
} from '../sketch/constants'

export interface PlotArea {
  x: number; y: number; w: number; h: number
}

export const PLOT_MARGINS = { top: 14, right: 16, bottom: 30, left: 38 }

export function makePlotArea(cssW: number, cssH: number): PlotArea {
  return {
    x: PLOT_MARGINS.left,
    y: PLOT_MARGINS.top,
    w: cssW - PLOT_MARGINS.left - PLOT_MARGINS.right,
    h: cssH - PLOT_MARGINS.top  - PLOT_MARGINS.bottom,
  }
}

export function toPlotX(v: number, min: number, max: number, a: PlotArea): number {
  return a.x + ((v - min) / (max - min)) * a.w
}

export function toPlotY(v: number, min: number, max: number, a: PlotArea): number {
  return a.y + a.h - ((v - min) / (max - min)) * a.h
}

export function drawAxes(
  ctx: CanvasRenderingContext2D,
  a: PlotArea,
  xLabel: string,
  yLabel: string,
) {
  ctx.save()

  // X axis
  wobblyLine(ctx, a.x, a.y + a.h, a.x + a.w + 8, a.y + a.h, {
    color: PENCIL_COLOR, strokeWidth: STROKE_WIDTH_THIN, seed: 11, amplitude: 0.5,
  })
  ctx.beginPath()
  ctx.moveTo(a.x + a.w + 8, a.y + a.h)
  ctx.lineTo(a.x + a.w + 3, a.y + a.h - 3)
  ctx.lineTo(a.x + a.w + 3, a.y + a.h + 3)
  ctx.closePath()
  ctx.fillStyle = PENCIL_COLOR
  ctx.fill()

  // Y axis
  wobblyLine(ctx, a.x, a.y + a.h, a.x, a.y - 8, {
    color: PENCIL_COLOR, strokeWidth: STROKE_WIDTH_THIN, seed: 22, amplitude: 0.5,
  })
  ctx.beginPath()
  ctx.moveTo(a.x, a.y - 8)
  ctx.lineTo(a.x - 3, a.y - 3)
  ctx.lineTo(a.x + 3, a.y - 3)
  ctx.closePath()
  ctx.fillStyle = PENCIL_COLOR
  ctx.fill()

  // Axis labels
  ctx.font = '9px "IBM Plex Sans", sans-serif'
  ctx.fillStyle = PENCIL_LIGHT
  ctx.textAlign = 'center'
  ctx.fillText(xLabel, a.x + a.w / 2, a.y + a.h + 26)

  ctx.translate(a.x - 30, a.y + a.h / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText(yLabel, 0, 0)

  ctx.restore()
}

export function drawXTicks(
  ctx: CanvasRenderingContext2D,
  a: PlotArea,
  ticks: number[],
  xMin: number, xMax: number,
  fmt: (v: number) => string = (v) => String(Math.round(v)),
) {
  ctx.save()
  ctx.font = '8px "JetBrains Mono", monospace'
  ctx.fillStyle = PENCIL_LIGHT
  ctx.textAlign = 'center'
  ctx.strokeStyle = PENCIL_LIGHT
  ctx.lineWidth = STROKE_WIDTH_THIN

  for (const v of ticks) {
    const px = toPlotX(v, xMin, xMax, a)
    ctx.beginPath()
    ctx.moveTo(px, a.y + a.h)
    ctx.lineTo(px, a.y + a.h + 4)
    ctx.stroke()
    ctx.fillText(fmt(v), px, a.y + a.h + 13)
  }
  ctx.restore()
}

export function drawYTicks(
  ctx: CanvasRenderingContext2D,
  a: PlotArea,
  ticks: number[],
  yMin: number, yMax: number,
  fmt: (v: number) => string = (v) => v.toFixed(2),
) {
  ctx.save()
  ctx.font = '8px "JetBrains Mono", monospace'
  ctx.fillStyle = PENCIL_LIGHT
  ctx.textAlign = 'right'
  ctx.strokeStyle = PENCIL_LIGHT
  ctx.lineWidth = STROKE_WIDTH_THIN

  for (const v of ticks) {
    const py = toPlotY(v, yMin, yMax, a)
    ctx.beginPath()
    ctx.moveTo(a.x - 4, py)
    ctx.lineTo(a.x, py)
    ctx.stroke()
    ctx.fillText(fmt(v), a.x - 6, py + 3)
  }
  ctx.restore()
}

export function drawSketchCurve(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  opts: {
    color?: string
    strokeWidth?: number
    dashed?: boolean
    seed?: number
    wobbleAmp?: number
    alpha?: number
  } = {},
) {
  if (points.length < 2) return
  const {
    color      = PENCIL_COLOR,
    strokeWidth = STROKE_WIDTH_THIN,
    dashed     = false,
    seed       = 0,
    wobbleAmp  = 0.4,
    alpha      = 1,
  } = opts

  ctx.save()
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.lineWidth   = strokeWidth
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'
  ctx.globalAlpha = alpha
  if (dashed) ctx.setLineDash([4, 3])

  for (let i = 0; i < points.length; i++) {
    const { x, y } = points[i]
    const n = noise1D(i * 0.35, seed) * wobbleAmp
    if (i === 0) ctx.moveTo(x, y + n)
    else         ctx.lineTo(x, y + n)
  }
  ctx.stroke()
  ctx.restore()
}

export function drawVerticalMarker(
  ctx: CanvasRenderingContext2D,
  px: number,
  a: PlotArea,
  opts: {
    color?: string
    dashed?: boolean
    label?: string
    labelAbove?: boolean
    seed?: number
  } = {},
) {
  const { color = PENCIL_LIGHT, dashed = false, label, labelAbove = true, seed = 0 } = opts

  ctx.save()
  if (dashed) ctx.setLineDash([3, 3])
  wobblyLine(ctx, px, a.y, px, a.y + a.h, {
    color, strokeWidth: STROKE_WIDTH_THIN, seed, amplitude: 0.4,
  })
  ctx.restore()

  if (label) {
    ctx.save()
    ctx.font = '8px "IBM Plex Sans", sans-serif'
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.fillText(label, px, labelAbove ? a.y - 3 : a.y + a.h + 18)
    ctx.restore()
  }
}

export function niceTickValues(min: number, max: number, targetCount = 4): number[] {
  const range = max - min
  if (range <= 0) return [min]
  const rough  = range / (targetCount - 1)
  const mag    = Math.pow(10, Math.floor(Math.log10(rough)))
  const normed = rough / mag
  const step   = normed <= 1.5 ? mag : normed <= 3.5 ? 2 * mag : normed <= 7.5 ? 5 * mag : 10 * mag

  const ticks: number[] = []
  for (let v = Math.ceil(min / step) * step; v <= max + step * 0.01; v += step) {
    const rounded = Math.round(v * 1e9) / 1e9
    if (rounded >= min - step * 0.01 && rounded <= max + step * 0.01) ticks.push(rounded)
  }
  return ticks
}
