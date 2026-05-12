import { CentroRevision } from "./components/centro-revision"
import { CursosEnMarcha } from "./components/cursos-en-marcha"
import { HeroBienvenida } from "./components/hero-bienvenida"
import { PulsoKpis } from "./components/pulso-kpis"
import { StreamPulso } from "./components/stream-pulso"

export function InicioPage() {
  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-12">
      <HeroBienvenida />
      <PulsoKpis />
      <div className="grid grid-cols-1 gap-12 xl:grid-cols-[1.4fr_1fr]">
        <CentroRevision />
        <StreamPulso />
      </div>
      <CursosEnMarcha />
    </div>
  )
}
