import { useState, useCallback } from 'react'
import type { MaterialKey, Parameters, Polarisation } from '../types'
import { defaultParams, tempSliderMax } from '../components/ControlPanel/presets'

export interface UseParametersReturn {
  params: Parameters
  material: MaterialKey
  polarisation: Polarisation
  tempMax: number                    // dynamic max for temperature slider
  setParam: (key: keyof Parameters, value: number) => void
  setMaterial: (key: MaterialKey) => void
  setPolarisation: (pol: Polarisation) => void
}

export function useParameters(): UseParametersReturn {
  const [params, setParams]           = useState<Parameters>(defaultParams)
  const [material, setMaterialState]  = useState<MaterialKey>('316L')
  const [polarisation, setPolState]   = useState<Polarisation>('unpolarised')

  const setParam = useCallback((key: keyof Parameters, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setMaterial = useCallback((key: MaterialKey) => {
    setMaterialState(key)
    // Reset temperature to room temperature when switching material
    setParams((prev) => ({ ...prev, temperature_C: 25 }))
  }, [])

  const setPolarisation = useCallback((pol: Polarisation) => {
    setPolState(pol)
  }, [])

  const tempMax = tempSliderMax(material)

  return { params, material, polarisation, tempMax, setParam, setMaterial, setPolarisation }
}
