import { useRef, useEffect } from 'react'
import type { RayTraceResponse } from '../../types'
import { drawParticles } from './drawParticles'
import { drawRays } from './drawRays'
import type { AnimationParams } from './drawRays'
import { drawAnnotations } from './drawAnnotations'
import { PENCIL_FAINT, PENCIL_LIGHT } from '../sketch/constants'
import { RAY_PROPAGATION_DURATION_S } from '../sketch/constants'

interface Props {
  data: RayTraceResponse | null
  loading: boolean
  error: string | null
}

const CSS_HEIGHT = 320

export function RayTraceCanvas({ data, loading, error }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dataRef = useRef<RayTraceResponse | null>(null)
  const loadingRef = useRef(loading)
  const rafRef = useRef<number>(0)
  const prevTimeRef = useRef<number>(0)
  const timeRef = useRef<number>(0)
  const propagationRef = useRef<number>(1) // start converged
  const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 })

  // Sync data into ref, reset propagation on new data
  useEffect(() => {
    dataRef.current = data
    if (data) {
      propagationRef.current = 0
    }
  }, [data])

  // Sync loading into ref
  useEffect(() => {
    loadingRef.current = loading
  }, [loading])

  // Animation loop
  useEffect(() => {
    const loop = (timestamp: number) => {
      const dt = prevTimeRef.current
        ? (timestamp - prevTimeRef.current) / 1000
        : 0.016
      prevTimeRef.current = timestamp
      timeRef.current += dt

      // Advance propagation
      if (propagationRef.current < 1) {
        propagationRef.current = Math.min(
          1,
          propagationRef.current + dt / RAY_PROPAGATION_DURATION_S
        )
      }

      const canvas = canvasRef.current
      if (!canvas) { rafRef.current = requestAnimationFrame(loop); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { rafRef.current = requestAnimationFrame(loop); return }

      const dpr = window.devicePixelRatio || 1
      const cssW = canvas.offsetWidth || 600
      const cssH = CSS_HEIGHT

      // Only reset canvas buffer when size changes
      if (sizeRef.current.w !== cssW || sizeRef.current.h !== cssH) {
        canvas.width = cssW * dpr
        canvas.height = cssH * dpr
        sizeRef.current = { w: cssW, h: cssH }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, cssW, cssH)

      const currentData = dataRef.current
      if (!currentData) {
        if (loadingRef.current) {
          ctx.font = '11px "JetBrains Mono", monospace'
          ctx.fillStyle = PENCIL_FAINT
          ctx.textAlign = 'center'
          ctx.fillText('computing…', cssW / 2, cssH / 2)
        }
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      const { particles, rays, summary, scene } = currentData

      // Coordinate mapping: scene µm → canvas px
      const PAD = 28
      const CALLOUT_H = 22
      const usableW = cssW - 2 * PAD
      const usableH = cssH - 2 * PAD - CALLOUT_H

      const scale = Math.min(usableW / scene.width_um, usableH / scene.height_um)
      const offsetX = PAD + (usableW - scene.width_um * scale) / 2
      const offsetY = PAD + (usableH - scene.height_um * scale) / 2

      const toCanvas = (x: number, y: number) => ({
        x: offsetX + x * scale,
        y: offsetY + y * scale,
      })

      // Substrate region (below powder bed)
      const subTL = toCanvas(0, scene.powder_bottom_um)
      const subBR = toCanvas(scene.width_um, scene.height_um)
      ctx.fillStyle = 'rgba(229, 224, 219, 0.55)'
      ctx.fillRect(subTL.x, subTL.y, subBR.x - subTL.x, subBR.y - subTL.y)

      const anim: AnimationParams = {
        time: timeRef.current,
        propagation: propagationRef.current,
      }

      // Scene elements
      drawParticles(ctx, particles, toCanvas, scale, anim)
      drawRays(ctx, rays, toCanvas, anim)
      drawAnnotations(ctx, summary, scene, toCanvas, cssW, cssH)

      // Subtle "updating…" indicator while new data loads
      if (loadingRef.current) {
        ctx.font = '9px "JetBrains Mono", monospace'
        ctx.textAlign = 'left'
        ctx.fillStyle = PENCIL_LIGHT
        ctx.fillText('updating…', 10, cssH - 10)
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div
      className="card w-full overflow-hidden relative"
      style={{ height: `${CSS_HEIGHT}px`, background: 'var(--bg-secondary)' }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      {error && !data && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
