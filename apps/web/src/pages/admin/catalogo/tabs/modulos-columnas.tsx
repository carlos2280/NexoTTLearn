import { Badge } from "@/shared/components/ui/badge"
import type { ColumnaTabla } from "@/shared/components/ui/data-table"
import type { EstadoModulo, ModuloResponse } from "@nexott-learn/shared-types"

function BadgeEstado({ estado }: { readonly estado: EstadoModulo }) {
  return estado === "ACTIVO" ? (
    <Badge tono="success" conPunto={true}>
      Activo
    </Badge>
  ) : (
    <Badge tono="neutro" conPunto={true}>
      Archivado
    </Badge>
  )
}

export const COLUMNAS_MODULOS: ColumnaTabla<ModuloResponse>[] = [
  {
    id: "titulo",
    cabecera: "Módulo",
    accesor: (m) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-text-primary">{m.titulo}</span>
        {m.descripcion ? (
          <span className="line-clamp-1 text-caption text-text-tertiary">{m.descripcion}</span>
        ) : null}
      </div>
    ),
  },
  {
    id: "estado",
    cabecera: "Estado",
    anchoFijo: "140px",
    accesor: (m) => <BadgeEstado estado={m.estado} />,
  },
  {
    id: "actualizado",
    cabecera: "Actualizado",
    anchoFijo: "150px",
    accesor: (m) => (
      <span className="tabular text-caption text-text-tertiary">
        {new Date(m.updatedAt).toLocaleDateString("es-ES")}
      </span>
    ),
  },
]
