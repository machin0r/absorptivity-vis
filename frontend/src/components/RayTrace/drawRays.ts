import { wobblyLine } from '../sketch/wobblyLine'
import { STROKE_WIDTH, STROKE_WIDTH_THIN } from '../sketch/constants'
import type { RayData } from '../../types'

export interface AnimationParams {
  /** Wall-clock accumulated time in seconds, for sin-based pulses */
  time: number
  /** Ray reveal progress: 0 = nothing visible, 1 = all rays fully drawn */
  propagation: number
}

/**
 * Map a ray segment intensity [0,1] to an rgba colour string.
 * Full intensity → LASER_COLOR (#C05030), zero → PENCIL_LIGHT (#999999).
 */
function segmentStyle(intensity: number): string {
  const t = Math.max(0, Math.min(1, intensity))
  // Lerp from PENCIL_LIGHT (153,153,153) to LASER_COLOR (192,80,48)
  const r = Math.round(153 + 39 * t)
  const g = Math.round(153 - 73 * t)
  const b = Math.round(153 - 105 * t)
  const a = (0.2 + t * 0.8).toFixed(2)
  return `rgba(${r},${g},${b},${a})`
}

function easeOut(t: number): number {
  return 1 - (1 - t) ** 2
}

export function drawRays(
  ctx: CanvasRenderingContext2D,
  rays: RayData[],
  toCanvas: (x: number, y: number) => { x: number; y: number },
  anim?: AnimationParams,
) {
  const totalSegments = rays.reduce((sum, r) => sum + r.segments.length, 0)
  const easedProp = anim ? easeOut(anim.propagation) : 1
  let globalIdx = 0

  for (let ri = 0; ri < rays.length; ri++) {
    const ray = rays[ri]
    for (let si = 0; si < ray.segments.length; si++) {
      const seg = ray.segments[si]

      // Compute how visible this segment is (0 = hidden, 1 = fully drawn)
      let segProgress = 1
      if (anim && totalSegments > 0) {
        const segStart = globalIdx / totalSegments
        const segEnd = (globalIdx + 1) / totalSegments
        segProgress = Math.max(0, Math.min(1, (easedProp - segStart) / (segEnd - segStart)))
      }
      globalIdx++

      if (segProgress === 0) continue

      // Clip endpoint for partially revealed segments
      const endX = segProgress < 1 ? seg.x0 + (seg.x1 - seg.x0) * segProgress : seg.x1
      const endY = segProgress < 1 ? seg.y0 + (seg.y1 - seg.y0) * segProgress : seg.y1

      const p0 = toCanvas(seg.x0, seg.y0)
      const p1 = toCanvas(endX, endY)

      // Pulse on first segment (incoming laser) once fully revealed
      if (si === 0 && anim && segProgress === 1) {
        ctx.save()
        ctx.globalAlpha = 0.7 + Math.sin(anim.time * 3) * 0.3
      }

      // Drift seed on incoming rays so wobble shimmers over time
      const seed = (si === 0 && anim && segProgress === 1)
        ? ri * 31.7 + anim.time * 0.05
        : ri * 31.7 + si * 7.3

      wobblyLine(ctx, p0.x, p0.y, p1.x, p1.y, {
        color: segmentStyle(seg.intensity),
        strokeWidth: seg.intensity > 0.3 ? STROKE_WIDTH : STROKE_WIDTH_THIN,
        seed,
        amplitude: 0.8,
      })

      if (si === 0 && anim && segProgress === 1) {
        ctx.restore()
      }
    }
  }
}
