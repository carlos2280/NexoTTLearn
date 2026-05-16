import type { ColumnaTabla } from "@/shared/components/ui/data-table"
import type { AreaResponse } from "@nexott-learn/shared-types"

export const COLUMNAS_AREAS: ColumnaTabla<AreaResponse>[] = [
  {
    id: "nombre",
    cabecera: "Área",
    accesor: (a) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-text-primary">{a.nombre}</span>
        {a.descripcion ? (
          <span className="line-clamp-1 text-caption text-text-tertiary">{a.descripcion}</span>
        ) : null}
      </div>
    ),
  },
  {
    id: "actualizado",
    cabecera: "Actualizado",
    anchoFijo: "180px",
    accesor: (a) => (
      <span className="tabular text-caption text-text-tertiary">
        {new Date(a.updatedAt).toLocaleDateString("es-ES")}
      </span>
    ),
  },
]
