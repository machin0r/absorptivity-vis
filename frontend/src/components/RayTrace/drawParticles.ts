import { sketchEllipse, ellipseClipPath } from '../sketch/sketchEllipse'
import { crosshatch } from '../sketch/crosshatch'
import { PENCIL_COLOR, POWDER_BED_FILL, STROKE_WIDTH } from '../sketch/constants'
import type { ParticleData } from '../../types'

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: ParticleData[],
  toCanvas: (x: number, y: number) => { x: number; y: number },
  scale: number,
) {
  const maxEnergy = Math.max(...particles.map((p) => p.absorbed_energy), 0.001)

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]
    const c = toCanvas(p.x, p.y)
    const r = p.radius * scale

    if (r < 2) continue

    // 1. Fill + crosshatch, clipped to wobbly circle shape
    ctx.save()
    ellipseClipPath(ctx, c.x, c.y, r, r, i * 13.7)
    ctx.clip()
    ctx.fillStyle = POWDER_BED_FILL
    ctx.fillRect(c.x - r - 2, c.y - r - 2, (r + 2) * 2, (r + 2) * 2)
    crosshatch(ctx, { x: c.x - r - 2, y: c.y - r - 2, w: (r + 2) * 2, h: (r + 2) * 2 }, {
      seedBase: i * 3.3,
      amplitude: 0.8,
      spacing: 7,
    })
    ctx.restore()

    // 2. Absorbed energy glow (warm radial gradient over particle)
    const normEnergy = p.absorbed_energy / maxEnergy
    if (normEnergy > 0.05) {
      const alpha = normEnergy * 0.5
      const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r)
      grad.addColorStop(0, `rgba(220, 100, 40, ${alpha.toFixed(2)})`)
      grad.addColorStop(0.6, `rgba(192, 80, 48, ${(alpha * 0.4).toFixed(2)})`)
      grad.addColorStop(1, 'rgba(192, 80, 48, 0)')
      ctx.beginPath()
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()
    }

    // 3. Wobbly pencil outline
    sketchEllipse(ctx, c.x, c.y, r, r, {
      seed: i * 13.7,
      color: PENCIL_COLOR,
      strokeWidth: STROKE_WIDTH,
    })
  }
}
