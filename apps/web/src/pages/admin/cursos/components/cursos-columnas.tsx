import { Badge } from "@/shared/components/ui/badge"
import type { ColumnaTabla } from "@/shared/components/ui/data-table"
import type { CursoResumen, EstadoCurso } from "@nexott-learn/shared-types"

function tonoEstado(estado: EstadoCurso): "success" | "warning" | "info" | "neutro" {
  if (estado === "ACTIVO") {
    return "success"
  }
  if (estado === "BORRADOR") {
    return "warning"
  }
  if (estado === "CERRADO") {
    return "info"
  }
  return "neutro"
}

function etiquetaEstado(estado: EstadoCurso): string {
  if (estado === "ACTIVO") {
    return "Activo"
  }
  if (estado === "BORRADOR") {
    return "Borrador"
  }
  if (estado === "CERRADO") {
    return "Cerrado"
  }
  return "Archivado"
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function diasRestantes(deadlineIso: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const deadline = new Date(deadlineIso)
  deadline.setHours(0, 0, 0, 0)
  const ms = deadline.getTime() - hoy.getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

function textoDeadline(estado: EstadoCurso, dias: number): string | null {
  if (estado !== "ACTIVO" && estado !== "BORRADOR") {
    return null
  }
  if (dias < 0) {
    return `vencido hace ${Math.abs(dias)} d`
  }
  if (dias === 0) {
    return "hoy"
  }
  return `quedan ${dias} d`
}

function claseDeadline(dias: number): string {
  if (dias < 0) {
    return "text-caption text-danger-on-soft"
  }
  if (dias <= 7) {
    return "text-caption text-warning-on-soft"
  }
  return "text-caption text-text-tertiary"
}

export function construirColumnasCursos(
  nombreClientePorId: ReadonlyMap<string, string>,
): ColumnaTabla<CursoResumen>[] {
  return [
    {
      id: "titulo",
      cabecera: "Título",
      accesor: (c) => <span className="font-medium text-text-primary">{c.titulo}</span>,
    },
    {
      id: "cliente",
      cabecera: "Cliente",
      anchoFijo: "200px",
      accesor: (c) => (
        <span className="text-body-sm text-text-secondary">
          {nombreClientePorId.get(c.clienteId) ?? "—"}
        </span>
      ),
    },
    {
      id: "estado",
      cabecera: "Estado",
      anchoFijo: "120px",
      accesor: (c) => (
        <Badge tono={tonoEstado(c.estado)} conPunto={true}>
          {etiquetaEstado(c.estado)}
        </Badge>
      ),
    },
    {
      id: "inicio",
      cabecera: "Inicio",
      anchoFijo: "110px",
      accesor: (c) => (
        <span className="tabular text-caption text-text-tertiary">
          {formatearFecha(c.fechaInicio)}
        </span>
      ),
    },
    {
      id: "deadline",
      cabecera: "Deadline",
      anchoFijo: "180px",
      accesor: (c) => {
        const dias = diasRestantes(c.fechaDeadline)
        const texto = textoDeadline(c.estado, dias)
        return (
          <div className="flex flex-col">
            <span className="tabular text-body-sm text-text-primary">
              {formatearFecha(c.fechaDeadline)}
            </span>
            {texto ? <span className={claseDeadline(dias)}>{texto}</span> : null}
          </div>
        )
      },
    },
  ]
}
