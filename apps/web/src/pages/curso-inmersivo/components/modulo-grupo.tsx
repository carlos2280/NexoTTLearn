import { cn } from "@/shared/lib/cn"
import type {
  CursoArbolSeccion,
  MeAvanceSeccionEstado,
  ModoCursoParticipante,
  SeccionPlanItemParticipante,
} from "@nexott-learn/shared-types"
import { ChevronRight, Folder, FolderOpen } from "lucide-react"
import { useState } from "react"
import { FilaSeccion } from "./fila-seccion"

interface ModuloGrupoProps {
  readonly titulo: string
  readonly secciones: readonly CursoArbolSeccion[]
  readonly planById: ReadonlyMap<string, SeccionPlanItemParticipante>
  readonly estadoAvanceById: ReadonlyMap<string, MeAvanceSeccionEstado>
  readonly modo: ModoCursoParticipante
  readonly seccionActivaId: string | null
  readonly onSeleccionar: (seccionId: string) => void
  readonly soloLectura: boolean
}

/**
 * Grupo "modulo" del sidebar como CARPETA del árbol de archivos del IDE:
 * cabecera colapsable (chevron + carpeta + nombre) y, debajo, las secciones
 * como archivos indentados con guía de árbol. El colapso es estado local — no
 * coordina entre módulos. La lógica de estado de cada sección sigue intacta
 * en `FilaSeccion`.
 */
export function ModuloGrupo({
  titulo,
  secciones,
  planById,
  estadoAvanceById,
  modo,
  seccionActivaId,
  onSeleccionar,
  soloLectura,
}: ModuloGrupoProps) {
  const [abierto, setAbierto] = useState(true)
  return (
    <section className="flex flex-col">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className={cn(
          "group flex w-full items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left text-text-secondary",
          "transition-colors duration-fast ease-default hover:bg-surface hover:text-text-primary",
        )}
      >
        <ChevronRight
          aria-hidden={true}
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-text-tertiary transition-transform duration-fast ease-default",
            abierto ? "rotate-90" : "",
          )}
        />
        {abierto ? (
          <FolderOpen
            aria-hidden={true}
            strokeWidth={1.75}
            className="h-4 w-4 shrink-0 text-accent"
          />
        ) : (
          <Folder
            aria-hidden={true}
            strokeWidth={1.75}
            className="h-4 w-4 shrink-0 text-text-tertiary"
          />
        )}
        <span className="truncate font-code font-medium text-body-sm">{titulo}</span>
      </button>
      {abierto ? (
        <ul className="mt-0.5 ml-[15px] flex flex-col gap-0.5 border-border border-l pl-2">
          {secciones.map((seccion) => {
            const plan = planById.get(seccion.seccionId) ?? null
            return (
              <FilaSeccion
                key={seccion.seccionId}
                titulo={seccion.titulo}
                seccionId={seccion.seccionId}
                modo={modo}
                plan={plan}
                estadoAvance={estadoAvanceById.get(seccion.seccionId) ?? null}
                activa={seccion.seccionId === seccionActivaId}
                onSeleccionar={onSeleccionar}
                soloLectura={soloLectura}
              />
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
