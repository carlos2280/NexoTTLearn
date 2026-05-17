import { slugArea } from "@/shared/lib/slug-area"
import type { EventoHistorialFicha } from "@nexott-learn/shared-types"
import { motion, useReducedMotion } from "framer-motion"
import { etiquetaNivelSkill, relativizarFecha } from "../mi-ficha.helpers"

interface EventoItemProps {
  readonly evento: EventoHistorialFicha
  readonly onReleerEntrevista: (intentoId: string) => void
}

/**
 * Item del timeline de /mi-ficha. Cuando el evento es `SKILL_DEMOSTRADA`
 * con origen `ENTREVISTA_IA` y `referenciaIntentoIaId`, muestra debajo un
 * link sutil "Releer la entrevista" — abre el drawer compartido con la
 * transcripcion (decision B post-06 F3).
 */
export function EventoItem({ evento, onReleerEntrevista }: EventoItemProps) {
  const reducedMotion = useReducedMotion()
  const fechaRel = relativizarFecha(evento.fecha)
  const colorDot =
    evento.tipo === "SKILL_DEMOSTRADA"
      ? `var(--color-area-${slugArea(evento.areaNombre)})`
      : "var(--color-text-tertiary)"
  const intentoIaId =
    evento.tipo === "SKILL_DEMOSTRADA" &&
    evento.origen === "ENTREVISTA_IA" &&
    evento.referenciaIntentoIaId
      ? evento.referenciaIntentoIaId
      : null

  return (
    <motion.li
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 18, mass: 0.6 }}
      className="grid grid-cols-[100px_auto_1fr] items-start gap-3 border-border border-b py-4 last:border-b-0"
    >
      <span className="text-caption text-text-tertiary">{fechaRel}</span>
      <span
        aria-hidden="true"
        className="mt-1.5 block h-2 w-2 shrink-0 rounded-full"
        style={{ background: colorDot }}
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <DescripcionEvento evento={evento} />
        <SubLineaEvento evento={evento} />
        {intentoIaId !== null ? (
          <button
            type="button"
            onClick={() => onReleerEntrevista(intentoIaId)}
            className="mt-1 self-start text-caption text-text-tertiary underline-offset-4 transition-colors duration-base ease-default hover:text-text-secondary hover:underline"
          >
            Releer la entrevista
          </button>
        ) : null}
      </div>
    </motion.li>
  )
}

function DescripcionEvento({ evento }: { readonly evento: EventoHistorialFicha }) {
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

function SubLineaEvento({ evento }: { readonly evento: EventoHistorialFicha }) {
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
