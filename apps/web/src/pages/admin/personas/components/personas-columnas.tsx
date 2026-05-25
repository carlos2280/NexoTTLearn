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

interface CeldaAccesoProps {
  readonly usuario: ColaboradorAdminResumen["usuario"]
}

function CeldaAcceso({ usuario }: CeldaAccesoProps) {
  if (!usuario) {
    return <span className="text-caption text-text-tertiary">—</span>
  }

  if (usuario.bloqueado) {
    return (
      <Badge variant="soft" tono="danger" conPunto={true}>
        <ShieldAlert className="h-3 w-3" aria-hidden={true} />
        Bloqueado
      </Badge>
    )
  }

  if (usuario.requiereCambioPassword) {
    return <span className="text-caption text-warning-on-soft">Cambio pwd pendiente</span>
  }

  const mfa = usuario.mfaHabilitado
  return (
    <span className="inline-flex items-center gap-1.5 text-caption text-text-tertiary">
      <span
        aria-hidden={true}
        className={
          mfa
            ? "inline-block h-1.5 w-1.5 rounded-pill bg-success"
            : "inline-block h-1.5 w-1.5 rounded-pill bg-text-tertiary"
        }
      />
      {mfa ? "MFA activo" : "Sin MFA"}
    </span>
  )
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
    accesor: (p) => <CeldaAcceso usuario={p.usuario} />,
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
