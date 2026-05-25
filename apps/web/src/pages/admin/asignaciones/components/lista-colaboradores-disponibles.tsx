import { AvatarIniciales } from "@/shared/components/ui/avatar-iniciales"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Skeleton } from "@/shared/components/ui/skeleton"
import type { ColaboradorDisponible } from "@nexott-learn/shared-types"
import { Users } from "lucide-react"

interface ListaProps {
  readonly filas: readonly ColaboradorDisponible[]
  readonly seleccionados: ReadonlySet<string>
  readonly onAlternar: (id: string) => void
  readonly cargando: boolean
  readonly enviando: boolean
  readonly errorCarga: boolean
  readonly totalSinFiltros: number
}

/**
 * Lista interna del dialogo de asignación: skeleton durante carga, estado
 * vacío diferenciado (sin candidatos vs sin coincidencias), error de red, o
 * lista con checkbox + avatar + nombre + email.
 */
export function ListaColaboradoresDisponibles({
  filas,
  seleccionados,
  onAlternar,
  cargando,
  enviando,
  errorCarga,
  totalSinFiltros,
}: ListaProps) {
  if (cargando) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }
  if (errorCarga) {
    return (
      <p
        role="alert"
        className="rounded-lg bg-subtle px-3 py-6 text-center text-body-sm text-danger-on-soft"
      >
        No pudimos cargar los colaboradores. Reintenta en un momento.
      </p>
    )
  }
  if (filas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg bg-subtle px-3 py-10 text-center">
        <Users className="h-5 w-5 text-text-tertiary" aria-hidden={true} />
        <p className="text-body-sm text-text-secondary">
          {totalSinFiltros === 0
            ? "No hay colaboradores disponibles para este curso."
            : "Sin coincidencias. Ajusta la búsqueda."}
        </p>
      </div>
    )
  }
  return (
    <ul className="max-h-[420px] divide-y divide-border overflow-y-auto rounded-lg border border-border">
      {filas.map((c) => {
        const marcado = seleccionados.has(c.id)
        return (
          <li key={c.id}>
            <label
              className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors duration-fast ease-default hover:bg-subtle"
              htmlFor={`col-disp-${c.id}`}
            >
              <Checkbox
                id={`col-disp-${c.id}`}
                checked={marcado}
                onChange={() => onAlternar(c.id)}
                disabled={enviando}
              />
              <AvatarIniciales nombre={c.nombre} tamano="sm" />
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium text-text-primary">{c.nombre}</span>
                <span className="truncate text-caption text-text-tertiary">{c.email}</span>
              </div>
            </label>
          </li>
        )
      })}
    </ul>
  )
}
