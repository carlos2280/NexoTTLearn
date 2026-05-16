import { AvatarIniciales } from "@/shared/components/ui/avatar-iniciales"
import { Badge } from "@/shared/components/ui/badge"
import type { ColumnaTabla } from "@/shared/components/ui/data-table"
import type { Asignacion } from "@nexott-learn/shared-types"
import { BadgeEstadoAsignacion } from "./badge-estado-asignacion"

function formatearFechaCorta(iso: string | null): string {
  if (!iso) {
    return "—"
  }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return "—"
  }
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
}

export function construirColumnasAsignaciones(): readonly ColumnaTabla<Asignacion>[] {
  return [
    {
      id: "persona",
      cabecera: "Persona",
      accesor: (a) => (
        <div className="flex items-center gap-2.5">
          <AvatarIniciales nombre={a.colaborador.nombreCompleto} tamano="sm" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-text-primary">
              {a.colaborador.nombreCompleto}
            </span>
            <span className="truncate text-caption text-text-tertiary">{a.colaborador.email}</span>
          </div>
        </div>
      ),
    },
    {
      id: "rol",
      cabecera: "Rol",
      anchoFijo: "140px",
      accesor: (a) => (
        <Badge tono={a.rol === "ASIGNADO" ? "acento" : "info"}>
          {a.rol === "ASIGNADO" ? "Asignado" : "Voluntario"}
        </Badge>
      ),
    },
    {
      id: "estado",
      cabecera: "Estado",
      anchoFijo: "160px",
      accesor: (a) => <BadgeEstadoAsignacion asignacion={a} />,
    },
    {
      id: "inicio",
      cabecera: "Inicio",
      anchoFijo: "100px",
      accesor: (a) => (
        <span className="tabular text-text-secondary">{formatearFechaCorta(a.fechaInicio)}</span>
      ),
    },
    {
      id: "cierre",
      cabecera: "Cierre",
      anchoFijo: "100px",
      accesor: (a) => (
        <span className="tabular text-text-secondary">{formatearFechaCorta(a.fechaCierre)}</span>
      ),
    },
  ]
}
