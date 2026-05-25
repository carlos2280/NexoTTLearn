import { EmptyState } from "@/shared/components/ui/empty-state"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { cn } from "@/shared/lib/cn"
import { Inbox, type LucideIcon } from "lucide-react"
import type { KeyboardEvent, ReactNode } from "react"

export interface ColumnaTabla<TFila> {
  readonly id: string
  readonly cabecera: ReactNode
  readonly accesor: (fila: TFila) => ReactNode
  readonly anchoFijo?: string
  readonly alineado?: "izquierda" | "derecha" | "centrado"
  readonly className?: string
}

interface DataTableProps<TFila> {
  readonly columnas: readonly ColumnaTabla<TFila>[]
  readonly filas: readonly TFila[]
  readonly obtenerKey: (fila: TFila) => string
  readonly cargando?: boolean
  readonly vacioIcono?: LucideIcon
  readonly vacioTitulo?: string
  readonly vacioDescripcion?: string
  readonly onClickFila?: (fila: TFila) => void
  readonly accionFila?: (fila: TFila) => ReactNode
}

const ALINEADO_CLASE = {
  izquierda: "text-left",
  derecha: "text-right",
  centrado: "text-center",
}

function FilaSkeleton<TFila>({ columnas }: { readonly columnas: readonly ColumnaTabla<TFila>[] }) {
  return (
    <tr className="border-border border-b">
      {columnas.map((c) => (
        <td key={c.id} className="px-4 py-3">
          <Skeleton className="h-3.5 w-3/4" />
        </td>
      ))}
    </tr>
  )
}

interface CeldaProps<TFila> {
  readonly columna: ColumnaTabla<TFila>
  readonly fila: TFila
}

function Celda<TFila>({ columna, fila }: CeldaProps<TFila>) {
  return (
    <td
      className={cn(
        "border-border border-b px-4 py-2.5 text-text-primary",
        ALINEADO_CLASE[columna.alineado ?? "izquierda"],
        columna.className,
      )}
    >
      {columna.accesor(fila)}
    </td>
  )
}

interface FilaProps<TFila> {
  readonly fila: TFila
  readonly columnas: readonly ColumnaTabla<TFila>[]
  readonly onClickFila?: (fila: TFila) => void
  readonly accionFila?: (fila: TFila) => ReactNode
}

function Fila<TFila>({ fila, columnas, onClickFila, accionFila }: FilaProps<TFila>) {
  const esInteractiva = Boolean(onClickFila)

  function manejarTecla(event: KeyboardEvent<HTMLTableRowElement>) {
    if (!onClickFila) {
      return
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onClickFila(fila)
    }
  }

  return (
    <tr
      onClick={onClickFila ? () => onClickFila(fila) : undefined}
      onKeyDown={esInteractiva ? manejarTecla : undefined}
      tabIndex={esInteractiva ? 0 : undefined}
      role={esInteractiva ? "button" : undefined}
      className={cn(
        "border-border border-b last:border-b-0",
        "transition-colors duration-fast ease-default",
        esInteractiva &&
          "cursor-pointer hover:bg-subtle/60 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px]",
      )}
    >
      {columnas.map((c) => (
        <Celda key={c.id} columna={c} fila={fila} />
      ))}
      {accionFila ? (
        <td className="border-border border-b px-2 py-2.5 text-right">{accionFila(fila)}</td>
      ) : null}
    </tr>
  )
}

interface CabeceraColumnaProps<TFila> {
  readonly columna: ColumnaTabla<TFila>
}

function CabeceraColumna<TFila>({ columna }: CabeceraColumnaProps<TFila>) {
  return (
    <th
      scope="col"
      style={columna.anchoFijo ? { width: columna.anchoFijo } : undefined}
      className={cn(
        "border-border border-b px-4 py-2.5 font-medium text-caption text-text-secondary uppercase tracking-wide",
        ALINEADO_CLASE[columna.alineado ?? "izquierda"],
      )}
    >
      {columna.cabecera}
    </th>
  )
}

export function DataTable<TFila>({
  columnas,
  filas,
  obtenerKey,
  cargando = false,
  vacioIcono = Inbox,
  vacioTitulo = "Sin resultados",
  vacioDescripcion = "Ajusta los filtros o crea el primer elemento.",
  onClickFila,
  accionFila,
}: DataTableProps<TFila>) {
  if (!cargando && filas.length === 0) {
    return <EmptyState icono={vacioIcono} titulo={vacioTitulo} descripcion={vacioDescripcion} />
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full border-separate border-spacing-0 text-body-sm">
        <thead className="bg-subtle/60">
          <tr>
            {columnas.map((c) => (
              <CabeceraColumna key={c.id} columna={c} />
            ))}
            {accionFila ? (
              <th
                scope="col"
                className="w-12 border-border border-b px-2 py-2.5"
                aria-label="Acciones"
              />
            ) : null}
          </tr>
        </thead>
        <tbody>
          {cargando
            ? Array.from({ length: 6 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: el skeleton no tiene id estable
                <FilaSkeleton key={`sk-${i}`} columnas={columnas} />
              ))
            : filas.map((fila) => (
                <Fila
                  key={obtenerKey(fila)}
                  fila={fila}
                  columnas={columnas}
                  onClickFila={onClickFila}
                  accionFila={accionFila}
                />
              ))}
        </tbody>
      </table>
    </div>
  )
}
