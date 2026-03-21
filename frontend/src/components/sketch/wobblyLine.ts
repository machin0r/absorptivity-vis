import { noise1D } from './noise'
import { WOBBLE_AMP, WOBBLE_FREQ, STROKE_WIDTH, PENCIL_COLOR } from './constants'

interface WobblyLineOptions {
  amplitude?: number
  frequency?: number
  seed?: number
  strokeWidth?: number
  color?: string
  doubleLine?: boolean
}

/**
 * Draw a wobbly hand-drawn line between two points.
 * Uses deterministic noise so the line doesn't shimmer per frame.
 */
export function wobblyLine(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  opts: WobblyLineOptions = {}
) {
  const {
    amplitude  = WOBBLE_AMP,
    frequency  = WOBBLE_FREQ,
    seed       = 0,
    strokeWidth = STROKE_WIDTH,
    color      = PENCIL_COLOR,
    doubleLine = false,
  } = opts

  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 1) return

  // Perpendicular unit vector
  const nx = -dy / len
  const ny =  dx / len

  const segments = Math.max(8, Math.ceil(len / 6))

  const drawPass = (offsetSeed: number, alpha: number) => {
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth   = strokeWidth
    ctx.globalAlpha = alpha
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'

    for (let i = 0; i <= segments; i++) {
      const t    = i / segments
      const baseX = x0 + dx * t
      const baseY = y0 + dy * t
      const n    = noise1D(t * len * frequency, seed + offsetSeed) * amplitude
      const px   = baseX + nx * n
      const py   = baseY + ny * n
      if (i === 0) ctx.moveTo(px, py)
      else         ctx.lineTo(px, py)
    }

    ctx.stroke()
    ctx.globalAlpha = 1
  }

  drawPass(0, 1)
  if (doubleLine) drawPass(17.3, 0.3)
}
