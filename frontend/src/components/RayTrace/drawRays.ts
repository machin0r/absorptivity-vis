import { wobblyLine } from '../sketch/wobblyLine'
import { STROKE_WIDTH, STROKE_WIDTH_THIN } from '../sketch/constants'
import type { RayData } from '../../types'

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

export function drawRays(
  ctx: CanvasRenderingContext2D,
  rays: RayData[],
  toCanvas: (x: number, y: number) => { x: number; y: number },
) {
  for (let ri = 0; ri < rays.length; ri++) {
    const ray = rays[ri]
    for (let si = 0; si < ray.segments.length; si++) {
      const seg = ray.segments[si]
      const p0 = toCanvas(seg.x0, seg.y0)
      const p1 = toCanvas(seg.x1, seg.y1)
      wobblyLine(ctx, p0.x, p0.y, p1.x, p1.y, {
        color: segmentStyle(seg.intensity),
        strokeWidth: seg.intensity > 0.3 ? STROKE_WIDTH : STROKE_WIDTH_THIN,
        seed: ri * 31.7 + si * 7.3,
        amplitude: 0.8,
      })
    }
  }
}
