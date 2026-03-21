import type { ComputeRequest, ComputeResponse, RayTraceRequest, RayTraceResponse } from '../types'

export async function fetchCompute(
  req: ComputeRequest,
  signal: AbortSignal,
): Promise<ComputeResponse> {
  const res = await fetch('/api/compute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    signal,
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`/api/compute ${res.status}: ${detail}`)
  }
  return res.json() as Promise<ComputeResponse>
}

export async function fetchRayTrace(
  req: RayTraceRequest,
  signal: AbortSignal,
): Promise<RayTraceResponse> {
  const res = await fetch('/api/raytrace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    signal,
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`/api/raytrace ${res.status}: ${detail}`)
  }
  return res.json() as Promise<RayTraceResponse>
}
