import type { BloqueDetalleResponse } from "@nexott-learn/shared-types"
import type { ReactNode } from "react"
import { tipoBloqueMeta } from "../../bloque-tipo-meta"
import { IndicadorGuardado } from "./indicador-guardado"
import type { EstadoGuardado } from "./use-auto-guardar-bloque"

interface EditorBloqueShellProps {
  readonly bloque: BloqueDetalleResponse
  readonly titulo: string
  readonly descripcion?: ReactNode
  /** Slot opcional bajo el indicador de guardado (tiempo de lectura, contador, etc.). */
  readonly meta?: ReactNode
  readonly estadoGuardado: EstadoGuardado
  readonly children: ReactNode
}

/**
 * Shell canónico para cualquier editor de bloque del builder.
 *
 * Encapsula el header repetido (eyebrow `Bloque · {tipo}` + título + descripción
 * + IndicadorGuardado a la derecha) y un slot `children` para el cuerpo
 * específico del tipo. Una mejora visual aquí propaga a los 8 editores.
 */
export function EditorBloqueShell({
  bloque,
  titulo,
  descripcion,
  meta,
  estadoGuardado,
  children,
}: EditorBloqueShellProps) {
  const tipoMeta = tipoBloqueMeta(bloque.tipo)

  return (
    <div className="relative flex flex-col gap-5">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="nx-eyebrow text-text-tertiary">Bloque · {tipoMeta.etiqueta}</span>
          <h2 className="text-h2 text-text-primary">{titulo}</h2>
          {descripcion ? (
            <p className="max-w-xl text-body-sm text-text-secondary">{descripcion}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <IndicadorGuardado estado={estadoGuardado} />
          {meta}
        </div>
      </header>
      {children}
    </div>
  )
}
