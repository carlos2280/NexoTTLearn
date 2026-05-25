import { Badge } from "@/shared/components/ui/badge"
import type { ColumnaTabla } from "@/shared/components/ui/data-table"
import type { ClienteResponse } from "@nexott-learn/shared-types"

export const COLUMNAS_CLIENTES: ColumnaTabla<ClienteResponse>[] = [
  {
    id: "nombre",
    cabecera: "Cliente",
    accesor: (c) => <span className="font-medium text-text-primary">{c.nombre}</span>,
  },
  {
    id: "estado",
    cabecera: "Estado",
    anchoFijo: "140px",
    accesor: (c) =>
      c.activo ? (
        <Badge tono="success" conPunto={true}>
          Activo
        </Badge>
      ) : (
        <Badge tono="neutro" conPunto={true}>
          Inactivo
        </Badge>
      ),
  },
  {
    id: "creacion",
    cabecera: "Creación",
    anchoFijo: "150px",
    accesor: (c) => (
      <span className="tabular text-caption text-text-tertiary">
        {new Date(c.fechaCreacion).toLocaleDateString("es-ES")}
      </span>
    ),
  },
]
