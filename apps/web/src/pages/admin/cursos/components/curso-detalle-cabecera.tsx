import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import type { CursoDetalle, EstadoCurso } from "@nexott-learn/shared-types"
import { Archive, ArchiveRestore, ChevronLeft, Copy, History, Pencil, Rocket } from "lucide-react"
import { Link } from "react-router-dom"

interface CursoDetalleCabeceraProps {
  readonly curso: CursoDetalle
  readonly nombreCliente: string | undefined
  readonly onEditar: () => void
  readonly onPublicar: () => void
  readonly onArchivar: () => void
  readonly onDesarchivar: () => void
  readonly onDuplicar: () => void
  readonly onVerLog: () => void
}

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

function diasRestantes(iso: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

export function CursoDetalleCabecera({
  curso,
  nombreCliente,
  onEditar,
  onPublicar,
  onArchivar,
  onDesarchivar,
  onDuplicar,
  onVerLog,
}: CursoDetalleCabeceraProps) {
  const dias = diasRestantes(curso.fechaDeadline)
  const textoDias =
    curso.estado === "ACTIVO" || curso.estado === "BORRADOR"
      ? dias < 0
        ? `vencido hace ${Math.abs(dias)} días`
        : dias === 0
          ? "vence hoy"
          : `quedan ${dias} días`
      : null

  return (
    <header className="flex flex-col gap-3">
      <Link
        to={RUTAS.admin.cursos}
        className="inline-flex w-fit items-center gap-1 text-body-sm text-text-secondary hover:text-text-primary"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
        Volver a cursos
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-h1 text-text-primary">{curso.titulo}</h1>
            <Badge tono={tonoEstado(curso.estado)} conPunto={true}>
              {etiquetaEstado(curso.estado)}
            </Badge>
          </div>
          {nombreCliente ? (
            <span className="text-body-sm text-text-secondary">{nombreCliente}</span>
          ) : null}
          <span className="tabular text-body-sm text-text-tertiary">
            Deadline: {formatearFecha(curso.fechaDeadline)}
            {textoDias ? ` · ${textoDias}` : ""}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onVerLog}>
            <History className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            Log de cambios
          </Button>
          {curso.estado === "BORRADOR" ? (
            <Button variant="secondary" size="sm" onClick={onEditar}>
              <Pencil className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
              Editar
            </Button>
          ) : null}
          {curso.estado === "BORRADOR" ? (
            <Button variant="primary" size="sm" onClick={onPublicar}>
              <Rocket className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
              Publicar
            </Button>
          ) : null}
          {curso.estado === "CERRADO" ? (
            <Button variant="secondary" size="sm" onClick={onArchivar}>
              <Archive className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
              Archivar
            </Button>
          ) : null}
          {curso.estado === "ARCHIVADO" ? (
            <Button variant="secondary" size="sm" onClick={onDesarchivar}>
              <ArchiveRestore className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
              Desarchivar
            </Button>
          ) : null}
          <Button variant="secondary" size="sm" onClick={onDuplicar}>
            <Copy className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            Duplicar
          </Button>
        </div>
      </div>
    </header>
  )
}
