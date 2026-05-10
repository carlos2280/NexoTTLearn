import { Badge, type BadgeProps } from "@/shared/ui/patterns/badge"
import { PageHeader } from "@/shared/ui/patterns/page-header"
import { Button } from "@/shared/ui/primitives/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/primitives/dropdown-menu"
import type { CursoDetalle, EstadoCurso } from "@nexott-learn/shared-types"
import { Copy, Lock, MoreHorizontal, Pencil, Trash2, XCircle } from "lucide-react"
import { formatFechaCorta, formatRelativo } from "../lib/format"

interface BadgeEstado {
  readonly tone: BadgeProps["tone"]
  readonly label: string
}

function badgeParaEstado(estado: EstadoCurso): BadgeEstado {
  if (estado === "BORRADOR") {
    return { tone: "info", label: "Borrador" }
  }
  if (estado === "ACTIVO") {
    return { tone: "success", label: "Activo" }
  }
  return { tone: "neutral", label: "Cerrado" }
}

interface CursoDetalleHeaderProps {
  readonly curso: CursoDetalle
  readonly onEditar: () => void
  readonly onDuplicar: () => void
  readonly onDespublicar: () => void
  readonly onCerrar: () => void
  readonly onEliminar: () => void
}

export function CursoDetalleHeader({
  curso,
  onEditar,
  onDuplicar,
  onDespublicar,
  onCerrar,
  onEliminar,
}: CursoDetalleHeaderProps) {
  const badgeEstado = badgeParaEstado(curso.estado)
  const puedeDespublicar = curso.estado === "ACTIVO"
  const puedeCerrar = curso.estado === "ACTIVO"
  const puedeEliminar = curso.estado === "BORRADOR" && curso.contadores.inscripcionesActivas === 0

  const meta = (
    <>
      <Badge tone={badgeEstado.tone} size="md">
        {badgeEstado.label}
      </Badge>
      {curso.permiteInscripcionLibre ? (
        <Badge tone="info" size="md">
          Catálogo libre
        </Badge>
      ) : null}
    </>
  )

  const actions = (
    <>
      <Button onClick={onEditar}>
        <Pencil aria-hidden="true" />
        Editar
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild={true}>
          <Button variant="ghost" size="icon" aria-label="Más acciones">
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem icon={Copy} onSelect={onDuplicar}>
            Duplicar
          </DropdownMenuItem>
          {puedeDespublicar ? (
            <DropdownMenuItem icon={Lock} onSelect={onDespublicar}>
              Despublicar
            </DropdownMenuItem>
          ) : null}
          {puedeCerrar ? (
            <DropdownMenuItem icon={XCircle} onSelect={onCerrar}>
              Cerrar curso
            </DropdownMenuItem>
          ) : null}
          {puedeEliminar ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={Trash2} tone="danger" onSelect={onEliminar}>
                Eliminar
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow={curso.empresaCliente}
        title={curso.titulo}
        subtitle={curso.descripcion ?? undefined}
        meta={meta}
        actions={actions}
      />
      <dl className="flex flex-wrap items-start gap-x-8 gap-y-3 border-glass-border border-t pt-4">
        <MetadataItem label="Inicio" value={formatFechaCorta(curso.fechaInicio)} />
        <MetadataItem label="Deadline" value={formatFechaCorta(curso.deadline)} />
        <MetadataItem label="Duración" value={curso.duracionEstimada ?? "—"} />
        <MetadataItem
          label="Áreas"
          value={`${curso.contadores.areas} · ${curso.contadores.modulos} módulos`}
        />
        <MetadataItem
          label="Inscripciones activas"
          value={String(curso.contadores.inscripcionesActivas)}
        />
        <MetadataItem label="Última edición" value={formatRelativo(curso.updatedAt)} />
      </dl>
    </div>
  )
}

function MetadataItem({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-medium text-[11px] text-text-muted uppercase tracking-wider">{label}</dt>
      <dd className="font-medium text-sm text-text-primary">{value}</dd>
    </div>
  )
}
