import { wobblyLine } from '../sketch/wobblyLine'
import { PENCIL_LIGHT, PENCIL_FAINT, STROKE_WIDTH_THIN } from '../sketch/constants'
import type { RayTraceSummary, SceneBounds } from '../../types'

export function drawAnnotations(
  ctx: CanvasRenderingContext2D,
  summary: RayTraceSummary,
  scene: SceneBounds,
  toCanvas: (x: number, y: number) => { x: number; y: number },
  cssW: number,
  cssH: number,
) {
  // ── Powder surface boundary ──────────────────────────────────────────────
  const surfL = toCanvas(0, scene.powder_top_um)
  const surfR = toCanvas(scene.width_um, scene.powder_top_um)
  wobblyLine(ctx, surfL.x, surfL.y, surfR.x, surfR.y, {
    color: PENCIL_FAINT,
    strokeWidth: STROKE_WIDTH_THIN,
    seed: 42,
    amplitude: 1.2,
  })

  // ── Substrate bottom boundary ────────────────────────────────────────────
  const botL = toCanvas(0, scene.powder_bottom_um)
  const botR = toCanvas(scene.width_um, scene.powder_bottom_um)
  wobblyLine(ctx, botL.x, botL.y, botR.x, botR.y, {
    color: PENCIL_FAINT,
    strokeWidth: STROKE_WIDTH_THIN,
    seed: 99,
    amplitude: 1.0,
  })

  // ── "powder surface" label ───────────────────────────────────────────────
  ctx.save()
  ctx.font = '9px "IBM Plex Sans", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillStyle = PENCIL_LIGHT
  ctx.fillText('powder surface', surfL.x + 4, surfL.y - 4)
  ctx.restore()

  // ── Summary stats (top-right) ────────────────────────────────────────────
  ctx.save()
  ctx.font = '10px "JetBrains Mono", monospace'
  ctx.textAlign = 'right'
  ctx.fillStyle = PENCIL_LIGHT
  const stats = [
    `rays: ${summary.ray_count}`,
    `avg bounces: ${summary.avg_bounces.toFixed(1)}`,
    `absorbed: ${(summary.fraction_absorbed * 100).toFixed(0)}%`,
    `escaped: ${(summary.fraction_escaped * 100).toFixed(0)}%`,
  ]
  let ty = 16
  for (const line of stats) {
    ctx.fillText(line, cssW - 10, ty)
    ty += 14
  }
  ctx.restore()

  // ── Callout label ────────────────────────────────────────────────────────
  ctx.save()
  ctx.font = '9px "IBM Plex Sans", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = PENCIL_LIGHT
  ctx.fillText(
    'Visualisation shows the multiple-reflection mechanism. Absorptivity value computed from Gusarov model — see methodology.',
    cssW / 2,
    cssH - 8,
  )
  ctx.restore()
}
