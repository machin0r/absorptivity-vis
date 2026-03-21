import { Layout } from './components/Layout'
import { Header } from './components/Header'
import { ControlPanel } from './components/ControlPanel/ControlPanel'
import { RayTraceCanvas } from './components/RayTrace/RayTraceCanvas'
import { AbsorptivityVsTemp } from './components/Plots/AbsorptivityVsTemp'
import { AbsorptivityVsAngle } from './components/Plots/AbsorptivityVsAngle'
import { ResultsPanel } from './components/Results/ResultsPanel'
import { MethodologyPanel } from './components/InfoPanel/MethodologyPanel'
import { useParameters } from './hooks/useParameters'
import { useAbsorptivityCompute } from './hooks/useAbsorptivityCompute'
import { useRayTrace } from './hooks/useRayTrace'

export default function App() {
  const {
    params, material, polarisation, tempMax,
    setParam, setMaterial, setPolarisation,
  } = useParameters()

  const compute = useAbsorptivityCompute(params, material, polarisation)
  const rayTrace = useRayTrace(params, material, polarisation)


  return (
    <Layout
      header={<Header />}
      sidebar={
        <ControlPanel
          params={params}
          material={material}
          polarisation={polarisation}
          tempMax={tempMax}
          onParamChange={setParam}
          onMaterialChange={setMaterial}
          onPolarisationChange={setPolarisation}
        />
      }
      main={
        <div className="flex flex-col gap-4 w-full">
          <div className="animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
            <RayTraceCanvas
              data={rayTrace.data}
              loading={rayTrace.loading}
              error={rayTrace.error}
            />
          </div>

          {/* Output plots — stack on mobile, side-by-side on sm+ */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
            <AbsorptivityVsTemp
              data={compute.data}
              currentTemp={params.temperature_C}
              loading={compute.loading}
            />
            <AbsorptivityVsAngle
              data={compute.data}
              currentAngle={params.angle_deg}
              polarisation={polarisation}
              loading={compute.loading}
            />
          </div>

          <div className="animate-fade-in-up stagger-4" style={{ opacity: 0 }}>
            <ResultsPanel data={compute.data} loading={compute.loading} />
          </div>

          <div className="animate-fade-in-up stagger-5" style={{ opacity: 0 }}>
            <MethodologyPanel />
          </div>
        </div>
      }
      footer={
        <footer
          className="border-t border-border-subtle px-6 py-3 flex items-center justify-between"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <span className="font-mono text-text-muted" style={{ fontSize: '10px' }}>
            A_surface from Fresnel · A_powder from Gusarov two-flux radiative transfer
          </span>
          <span className="font-mono text-text-muted" style={{ fontSize: '10px' }}>
            Palik · NIST · ASM
          </span>
        </footer>
      }
    />
  )
}
