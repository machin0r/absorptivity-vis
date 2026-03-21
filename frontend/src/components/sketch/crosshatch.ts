import { wobblyLine } from './wobblyLine'
import { HATCH_SPACING, PENCIL_LIGHT, STROKE_WIDTH_THIN } from './constants'

interface CrosshatchOptions {
  spacing?: number
  angle?: number      // radians
  color?: string
  strokeWidth?: number
  amplitude?: number
  seedBase?: number
}

/**
 * Fill a clipped region with crosshatch lines.
 * Call with the clipping path already set via ctx.clip().
 */
export function crosshatch(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; w: number; h: number },
  opts: CrosshatchOptions = {}
) {
  const {
    spacing     = HATCH_SPACING,
    angle       = Math.PI / 4,
    color       = PENCIL_LIGHT,
    strokeWidth = STROKE_WIDTH_THIN,
    amplitude   = 1.2,
    seedBase    = 0,
  } = opts

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const diagonal = Math.sqrt(bounds.w * bounds.w + bounds.h * bounds.h)
  const cx = bounds.x + bounds.w / 2
  const cy = bounds.y + bounds.h / 2
  const count = Math.ceil(diagonal / spacing)

  for (let i = -count; i <= count; i++) {
    const offset = i * spacing
    const ox = cx + sin * offset
    const oy = cy - cos * offset
    const halfLen = diagonal / 2
    const x0 = ox - cos * halfLen
    const y0 = oy - sin * halfLen
    const x1 = ox + cos * halfLen
    const y1 = oy + sin * halfLen
    wobblyLine(ctx, x0, y0, x1, y1, { amplitude, seed: seedBase + i * 7.7, strokeWidth, color })
  }
}

export function doubleCrosshatch(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; w: number; h: number },
  opts: Omit<CrosshatchOptions, 'angle'> & { angle1?: number; angle2?: number } = {}
) {
  const { angle1 = Math.PI / 4, angle2 = -Math.PI / 4, ...rest } = opts
  crosshatch(ctx, bounds, { ...rest, angle: angle1 })
  crosshatch(ctx, bounds, { ...rest, angle: angle2, seedBase: (rest.seedBase ?? 0) + 100 })
}
