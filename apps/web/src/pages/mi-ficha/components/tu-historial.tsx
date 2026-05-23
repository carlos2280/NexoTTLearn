import { DrawerReleerEntrevista } from "@/features/entrevista-ia/components/drawer-releer-entrevista"
import { useHistorialFicha } from "@/features/me/hooks/use-historial-ficha"
import { Button } from "@/shared/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useRef, useState } from "react"
import { agruparEventosPorMes } from "../mi-ficha.helpers"
import { EventoItem } from "./evento-item"
import { MarcadorInicio, MarcadorPresente } from "./marcador-timeline"

const PAGINA_INICIAL = 5
const PAGINA_INCREMENTO = 5

export function TuHistorial() {
  const { data, isLoading, error } = useHistorialFicha()
  const [visibles, setVisibles] = useState(PAGINA_INICIAL)
  const [intentoIaAbierto, setIntentoIaAbierto] = useState<string | null>(null)
  const sectionRef = useRef<HTMLElement>(null)

  const colapsar = () => {
    setVisibles(PAGINA_INICIAL)
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  if (isLoading || error) {
    return null
  }
  if (!data || data.length === 0) {
    return null
  }

  const mostrados = data.slice(0, visibles)
  const restantes = Math.max(0, data.length - visibles)
  const grupos = agruparEventosPorMes(mostrados)

  return (
    <section
      ref={sectionRef}
      className="flex scroll-mt-6 flex-col gap-5"
      aria-labelledby="tu-historial-titulo"
    >
      <header className="flex flex-col gap-1.5">
        <span className="nx-eyebrow text-text-tertiary">Tu camino</span>
        <h2 id="tu-historial-titulo" className="text-h2 text-text-primary">
          Lo que ha pasado en tu camino
        </h2>
      </header>

      <div className="flex flex-col gap-6">
        <MarcadorPresente />
        {grupos.map((grupo) => (
          <section key={grupo.clave} className="flex flex-col gap-2">
            <h3 className="nx-eyebrow text-aurora-violet">{grupo.label}</h3>
            <ol className="flex flex-col">
              {grupo.eventos.map((evento) => (
                <EventoItem
                  key={evento.id}
                  evento={evento}
                  onReleerEntrevista={(intentoId) => setIntentoIaAbierto(intentoId)}
                />
              ))}
            </ol>
          </section>
        ))}
        {restantes === 0 ? <MarcadorInicio /> : null}
      </div>

      {restantes > 0 || visibles > PAGINA_INICIAL ? (
        <div className="flex justify-center gap-2 pt-1">
          {restantes > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVisibles((v) => v + PAGINA_INCREMENTO)}
            >
              Ver mas
              <ChevronDown className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            </Button>
          ) : null}
          {visibles > PAGINA_INICIAL ? (
            <Button variant="ghost" size="sm" onClick={colapsar}>
              Ver menos
              <ChevronUp className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            </Button>
          ) : null}
        </div>
      ) : null}

      {intentoIaAbierto !== null ? (
        <DrawerReleerEntrevista
          abierto={true}
          onCambiarAbierto={(abierto) => {
            if (!abierto) {
              setIntentoIaAbierto(null)
            }
          }}
          intentoId={intentoIaAbierto}
        />
      ) : null}
    </section>
  )
}
