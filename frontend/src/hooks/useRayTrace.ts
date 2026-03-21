import { useState, useEffect, useRef } from 'react'
import { fetchRayTrace } from '../api/compute'
import type { MaterialKey, Parameters, Polarisation, RayTraceRequest, RayTraceResponse } from '../types'

interface UseRayTraceReturn {
  data: RayTraceResponse | null
  loading: boolean
  error: string | null
}

export function useRayTrace(
  params: Parameters,
  material: MaterialKey,
  polarisation: Polarisation,
  nRays = 20,
): UseRayTraceReturn {
  const [data, setData] = useState<RayTraceResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const req: RayTraceRequest = {
      wavelength_nm: params.wavelength_nm,
      angle_deg: params.angle_deg,
      spot_diameter_um: params.spot_diameter_um,
      polarisation,
      material,
      temperature_C: params.temperature_C,
      d10_um: params.d10_um,
      d50_um: params.d50_um,
      d90_um: params.d90_um,
      packing_fraction: params.packing_fraction,
      layer_thickness_um: params.layer_thickness_um,
      n_rays: nRays,
    }

    const timeout = setTimeout(() => {
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      setLoading(true)
      setError(null)

      fetchRayTrace(req, abortRef.current.signal)
        .then((result) => {
          setData(result)
          setLoading(false)
        })
        .catch((err: Error) => {
          if (err.name !== 'AbortError') {
            setError(err.message)
            setLoading(false)
          }
        })
    }, 50)

    return () => clearTimeout(timeout)
  }, [params, material, polarisation, nRays])

  return { data, loading, error }
}
