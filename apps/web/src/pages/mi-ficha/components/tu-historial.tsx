import { useHistorialFicha } from "@/features/me/hooks/use-historial-ficha"
import { Button } from "@/shared/components/ui/button"
import { slugArea } from "@/shared/lib/slug-area"
import type { EventoHistorialFicha } from "@nexott-learn/shared-types"
import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { etiquetaNivelSkill, relativizarFecha } from "../mi-ficha.helpers"

const PAGINA_INICIAL = 5
const PAGINA_INCREMENTO = 5

export function TuHistorial() {
  const { data, isLoading, error } = useHistorialFicha()
  const [visibles, setVisibles] = useState(PAGINA_INICIAL)

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
          <EventoItem key={evento.id} evento={evento} />
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
    </section>
  )
}

interface EventoItemProps {
  readonly evento: EventoHistorialFicha
}

function EventoItem({ evento }: EventoItemProps) {
  const fechaRel = relativizarFecha(evento.fecha)
  const colorDot =
    evento.tipo === "SKILL_DEMOSTRADA"
      ? `var(--color-area-${slugArea(evento.areaNombre)})`
      : "var(--color-text-tertiary)"

  return (
    <li className="grid grid-cols-[100px_auto_1fr] items-start gap-3 border-border border-b py-4 last:border-b-0">
      <span className="text-caption text-text-tertiary">{fechaRel}</span>
      <span
        aria-hidden="true"
        className="mt-1.5 block h-2 w-2 shrink-0 rounded-full"
        style={{ background: colorDot }}
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <DescripcionEvento evento={evento} />
        <SubLineaEvento evento={evento} />
      </div>
    </li>
  )
}

function DescripcionEvento({ evento }: EventoItemProps) {
  switch (evento.tipo) {
    case "SKILL_DEMOSTRADA":
      return (
        <p className="text-body-sm text-text-secondary">
          Demostraste <span className="font-medium text-text-primary">{evento.skillNombre}</span>
        </p>
      )
    case "CURSO_INICIADO":
      return (
        <p className="text-body-sm text-text-secondary">
          Iniciaste el curso{" "}
          <span className="font-medium text-text-primary">{evento.cursoTitulo}</span>
        </p>
      )
    case "CURSO_COMPLETADO":
      return (
        <p className="text-body-sm text-text-secondary">
          Completaste el curso{" "}
          <span className="font-medium text-text-primary">{evento.cursoTitulo}</span>
        </p>
      )
    default:
      return null
  }
}

function SubLineaEvento({ evento }: EventoItemProps) {
  if (evento.tipo !== "SKILL_DEMOSTRADA") {
    return null
  }
  return (
    <p className="text-caption text-text-tertiary">
      {evento.areaNombre} <span className="text-text-disabled">·</span>{" "}
      {etiquetaNivelSkill(evento.nivelCualitativo)} <span className="text-text-disabled">·</span>{" "}
      {evento.origenNarrativo}
    </p>
  )
}
