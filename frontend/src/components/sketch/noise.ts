/**
 * Simple 1D hash-based value noise.
 * Deterministic: same seed + position = same value.
 */

function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

/** Returns a value in [-1, 1] for a given position and seed. */
export function noise1D(pos: number, seed: number = 0): number {
  const p = pos + seed * 100
  const i = Math.floor(p)
  const f = p - i
  const a = hash(i) * 2 - 1
  const b = hash(i + 1) * 2 - 1
  return lerp(a, b, smoothstep(f))
}
