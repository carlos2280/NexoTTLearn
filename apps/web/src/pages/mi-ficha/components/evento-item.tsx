import { cn } from "@/shared/lib/cn"
import { slugArea } from "@/shared/lib/slug-area"
import type { EventoHistorialFicha } from "@nexott-learn/shared-types"
import { motion, useReducedMotion } from "framer-motion"
import { esHitoMayor, etiquetaNivelSkill, relativizarFecha } from "../mi-ficha.helpers"

interface EventoItemProps {
  readonly evento: EventoHistorialFicha
  readonly onReleerEntrevista: (intentoId: string) => void
}

/**
 * Item del timeline de /mi-ficha. Distingue **hitos mayores** (curso
 * completado, skill via transversal o entrevista IA, salto a Excelencia)
 * de **eventos menores** con tratamiento visual distinto: punto aurora con
 * halo para hitos, punto de color de area para el resto. Asi el lector
 * escanea el arco del viaje sin ahogarse en el detalle.
 *
 * Cuando el evento es `SKILL_DEMOSTRADA` con origen `ENTREVISTA_IA` y
 * `referenciaIntentoIaId`, muestra debajo un link sutil "Releer la
 * entrevista" — abre el drawer compartido con la transcripcion.
 */
export function EventoItem({ evento, onReleerEntrevista }: EventoItemProps) {
  const reducedMotion = useReducedMotion()
  const fechaRel = relativizarFecha(evento.fecha)
  const esHito = esHitoMayor(evento)
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
      className={cn(
        "grid grid-cols-[100px_auto_1fr] items-start gap-3 border-border border-b last:border-b-0",
        esHito ? "py-5" : "py-3",
      )}
    >
      <span className={cn("text-caption", esHito ? "text-text-secondary" : "text-text-tertiary")}>
        {fechaRel}
      </span>
      <PuntoTimeline evento={evento} esHito={esHito} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <DescripcionEvento evento={evento} esHito={esHito} />
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

interface PuntoTimelineProps {
  readonly evento: EventoHistorialFicha
  readonly esHito: boolean
}

function PuntoTimeline({ evento, esHito }: PuntoTimelineProps) {
  if (esHito) {
    return (
      <span
        aria-hidden="true"
        className="mt-2 block h-2.5 w-2.5 shrink-0 rounded-full bg-aurora-violet ring-2 ring-[rgb(var(--color-aurora-violet-rgb)/0.18)]"
      />
    )
  }
  const colorDot =
    evento.tipo === "SKILL_DEMOSTRADA"
      ? `var(--color-area-${slugArea(evento.areaNombre)})`
      : "var(--color-text-tertiary)"
  return (
    <span
      aria-hidden="true"
      className="mt-2 block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ background: colorDot }}
    />
  )
}

interface DescripcionEventoProps {
  readonly evento: EventoHistorialFicha
  readonly esHito: boolean
}

function DescripcionEvento({ evento, esHito }: DescripcionEventoProps) {
  const claseTexto = esHito ? "text-body text-text-secondary" : "text-body-sm text-text-secondary"
  switch (evento.tipo) {
    case "SKILL_DEMOSTRADA":
      return (
        <p className={claseTexto}>
          Demostraste <span className="font-medium text-text-primary">{evento.skillNombre}</span>
        </p>
      )
    case "CURSO_INICIADO":
      return (
        <p className={claseTexto}>
          Iniciaste el curso{" "}
          <span className="font-medium text-text-primary">{evento.cursoTitulo}</span>
        </p>
      )
    case "CURSO_COMPLETADO":
      return (
        <p className={claseTexto}>
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
