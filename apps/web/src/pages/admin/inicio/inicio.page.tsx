import { CentroRevision } from "./components/centro-revision"
import { CursosEnMarcha } from "./components/cursos-en-marcha"
import { HeroBienvenida } from "./components/hero-bienvenida"
import { PulsoKpis } from "./components/pulso-kpis"
import { StreamPulso } from "./components/stream-pulso"

export function InicioPage() {
  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-16">
      {/* Zona superior — el "cockpit": bienvenida + estado del sistema en una unidad. */}
      <section className="flex flex-col gap-8">
        <HeroBienvenida />
        <PulsoKpis />
      </section>

      {/* Zona media — operativa: lo que requiere atención del admin ahora. */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.4fr_1fr]">
        <CentroRevision />
        <StreamPulso />
      </div>

      {/* Zona inferior — lo que está corriendo. Información, no acción. */}
      <CursosEnMarcha />
    </div>
  )
}
