import { Badge } from "@/shared/components/ui/badge"
import type { ColumnaTabla } from "@/shared/components/ui/data-table"
import type { ColaboradorAdminResumen } from "@nexott-learn/shared-types"
import { ShieldAlert } from "lucide-react"
import { BadgeEstadoEmpleado } from "./badge-estado-empleado"
import { BadgeRol } from "./badge-rol"

function formatearFecha(iso: string | null): string {
  if (!iso) {
    return "Nunca"
  }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return "—"
  }
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
}

export const COLUMNAS_PERSONAS: ColumnaTabla<ColaboradorAdminResumen>[] = [
  {
    id: "persona",
    cabecera: "Persona",
    accesor: (p) => (
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-medium text-text-primary">{p.nombre}</span>
        <span className="truncate text-caption text-text-tertiary">{p.email}</span>
      </div>
    ),
  },
  {
    id: "rol",
    cabecera: "Rol",
    anchoFijo: "150px",
    accesor: (p) => <BadgeRol rol={p.usuario?.rol} />,
  },
  {
    id: "estado",
    cabecera: "Estado",
    anchoFijo: "140px",
    accesor: (p) => <BadgeEstadoEmpleado estado={p.estadoEmpleado} />,
  },
  {
    id: "acceso",
    cabecera: "Acceso",
    anchoFijo: "180px",
    accesor: (p) => {
      if (!p.usuario) {
        return <span className="text-caption text-text-tertiary">—</span>
      }
      if (p.usuario.bloqueado) {
        return (
          <Badge tono="danger" conPunto={true}>
            <ShieldAlert className="h-3 w-3" aria-hidden={true} />
            Bloqueado
          </Badge>
        )
      }
      if (p.usuario.requiereCambioPassword) {
        return (
          <Badge tono="warning" conPunto={true}>
            Debe cambiar pwd
          </Badge>
        )
      }
      if (p.usuario.mfaHabilitado) {
        return (
          <Badge tono="info" conPunto={false}>
            MFA activo
          </Badge>
        )
      }
      return (
        <Badge tono="contorno" conPunto={false}>
          Sin MFA
        </Badge>
      )
    },
  },
  {
    id: "ultimoLogin",
    cabecera: "Último acceso",
    anchoFijo: "150px",
    accesor: (p) => (
      <span className="tabular text-caption text-text-tertiary">
        {formatearFecha(p.usuario?.ultimoLogin ?? null)}
      </span>
    ),
  },
]
