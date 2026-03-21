import { noise1D } from './noise'
import { WOBBLE_AMP, PENCIL_COLOR, STROKE_WIDTH } from './constants'

interface SketchEllipseOptions {
  amplitude?: number
  seed?: number
  color?: string
  strokeWidth?: number
  fillColor?: string
  segments?: number
}

/**
 * Draw a hand-drawn wobbly ellipse (or circle when rx === ry).
 * Returns the array of perimeter points for external use.
 */
export function sketchEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  opts: SketchEllipseOptions = {}
): { x: number; y: number }[] {
  const {
    amplitude  = WOBBLE_AMP,
    seed       = 0,
    color      = PENCIL_COLOR,
    strokeWidth = STROKE_WIDTH,
    fillColor,
    segments   = 40,
  } = opts

  const points: { x: number; y: number }[] = []

  for (let i = 0; i <= segments; i++) {
    const t     = (i / segments) * Math.PI * 2
    const baseX = cx + Math.cos(t) * rx
    const baseY = cy + Math.sin(t) * ry
    const nx    = Math.cos(t)
    const ny    = Math.sin(t)
    const n     = noise1D(i * 0.5, seed) * amplitude
    points.push({ x: baseX + nx * n, y: baseY + ny * n })
  }

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
  ctx.closePath()

  if (fillColor) {
    ctx.fillStyle = fillColor
    ctx.fill()
  }

  ctx.strokeStyle = color
  ctx.lineWidth   = strokeWidth
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'
  ctx.stroke()

  return points
}

/** Build a clipping path from a wobbly ellipse (no stroke/fill). */
export function ellipseClipPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: number = 0,
  amplitude: number = WOBBLE_AMP,
  segments: number = 40
): void {
  ctx.beginPath()
  for (let i = 0; i <= segments; i++) {
    const t  = (i / segments) * Math.PI * 2
    const nx = Math.cos(t)
    const ny = Math.sin(t)
    const n  = noise1D(i * 0.5, seed) * amplitude
    const x  = cx + nx * (rx + n)
    const y  = cy + ny * (ry + n)
    if (i === 0) ctx.moveTo(x, y)
    else         ctx.lineTo(x, y)
  }
  ctx.closePath()
}
