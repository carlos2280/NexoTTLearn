import { DrawerReleerEntrevista } from "@/features/entrevista-ia/components/drawer-releer-entrevista"
import { useHistorialFicha } from "@/features/me/hooks/use-historial-ficha"
import { Button } from "@/shared/components/ui/button"
import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { EventoItem } from "./evento-item"

const PAGINA_INICIAL = 5
const PAGINA_INCREMENTO = 5

export function TuHistorial() {
  const { data, isLoading, error } = useHistorialFicha()
  const [visibles, setVisibles] = useState(PAGINA_INICIAL)
  const [intentoIaAbierto, setIntentoIaAbierto] = useState<string | null>(null)

  if (isLoading || error) {
    return null
  }
  if (!data || data.length === 0) {
    return null
  }

  const mostrados = data.slice(0, visibles)
  const restantes = Math.max(0, data.length - visibles)

  return (
    <section className="flex flex-col gap-5" aria-labelledby="tu-historial-titulo">
      <header className="flex flex-col gap-1.5">
        <span className="nx-eyebrow text-text-tertiary">Tu historial</span>
        <h2 id="tu-historial-titulo" className="text-h2 text-text-primary">
          Lo que ha pasado en tu camino
        </h2>
      </header>

      <ol className="flex flex-col">
        {mostrados.map((evento) => (
          <EventoItem
            key={evento.id}
            evento={evento}
            onReleerEntrevista={(intentoId) => setIntentoIaAbierto(intentoId)}
          />
        ))}
      </ol>

      {restantes > 0 ? (
        <div className="flex justify-center pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVisibles((v) => v + PAGINA_INCREMENTO)}
          >
            Ver mas
            <ChevronDown className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          </Button>
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
