import { useState, useEffect, useRef } from 'react'
import { fetchCompute } from '../api/compute'
import type { ComputeRequest, ComputeResponse, MaterialKey, Parameters, Polarisation } from '../types'

interface UseAbsorptivityComputeReturn {
  data: ComputeResponse | null
  loading: boolean
  error: string | null
}

export function useAbsorptivityCompute(
  params: Parameters,
  material: MaterialKey,
  polarisation: Polarisation,
): UseAbsorptivityComputeReturn {
  const [data, setData] = useState<ComputeResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const req: ComputeRequest = { ...params, material, polarisation }

    const timeout = setTimeout(() => {
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      setLoading(true)
      setError(null)

      fetchCompute(req, abortRef.current.signal)
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
  }, [params, material, polarisation])

  return { data, loading, error }
}
