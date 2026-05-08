import type { VistaCursoHero } from "@nexott-learn/shared-types"
import { MoreHorizontal } from "lucide-react"

interface VistaCursoHeroMetaProps {
  readonly hero: VistaCursoHero
  readonly nivelLabel: string
}

const FORMATO_FECHA = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short" })

function formatearFecha(iso: string | null): string | null {
  if (iso === null) {
    return null
  }
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) {
    return null
  }
  return FORMATO_FECHA.format(fecha)
}

// §4.2.2/3 badges + menu [⋯] + titulo + descripcion + meta line.
export function VistaCursoHeroMeta({ hero, nivelLabel }: VistaCursoHeroMetaProps) {
  const inicio = formatearFecha(hero.fechaInicioIso)
  const deadline = formatearFecha(hero.deadlineIso)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-glass-border bg-surface-2 px-2 py-0.5 font-medium text-[10.5px] text-text-secondary uppercase tracking-[0.06em]">
          <span className="size-1.5 rounded-full bg-brand-violet-soft" />
          {nivelLabel}
        </span>
        <span className="rounded-full border border-glass-border bg-surface-2 px-2 py-0.5 font-medium text-[10.5px] text-text-muted">
          {hero.cantidadModulos} modulos
        </span>
        <span
          className={
            hero.tipoInscripcion === "SOLICITUD"
              ? "rounded-full border border-brand-violet/25 bg-brand-violet/10 px-2 py-0.5 font-medium text-[10.5px] text-brand-violet-soft"
              : "rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-2 py-0.5 font-medium text-[10.5px] text-brand-cyan"
          }
        >
          {hero.tipoInscripcion === "SOLICITUD" ? "Asignado" : "Libre"}
        </span>
        {hero.permiteAbandonar ? (
          <button
            type="button"
            aria-label="Mas opciones"
            className="ml-auto grid size-7 place-items-center rounded-md text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
          >
            <MoreHorizontal className="size-4" strokeWidth={1.75} />
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="font-extrabold text-3xl text-text-primary leading-tight md:text-[32px]">
          {hero.titulo}
        </h1>
        <p className="text-[15px] text-text-secondary leading-snug">{hero.descripcion}</p>
      </div>
      <p className="text-[13px] text-text-muted">
        Para <span className="text-text-secondary">{hero.empresaCliente}</span>
        {inicio !== null ? <> · Inicio: {inicio}</> : null}
        {deadline !== null ? <> · Deadline: {deadline}</> : null}
      </p>
    </div>
  )
}
