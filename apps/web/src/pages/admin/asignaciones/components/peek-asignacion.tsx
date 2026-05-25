import { useObtenerAsignacion } from "@/features/asignaciones/hooks/use-obtener-asignacion"
import { Badge } from "@/shared/components/ui/badge"
import { SidePeek, SidePeekSeccion } from "@/shared/components/ui/side-peek"
import { Skeleton } from "@/shared/components/ui/skeleton"
import type { AsignacionDetallada } from "@nexott-learn/shared-types"
import type { ReactNode } from "react"
import { BadgeEstadoAsignacion } from "./badge-estado-asignacion"
import { SeccionHistoricoAsignacion } from "./seccion-historico-asignacion"

function formatearFecha(iso: string | null): string {
  if (!iso) {
    return "—"
  }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return "—"
  }
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
}

function etiquetaResultadoCliente(
  valor: AsignacionDetallada["resultadoEntrevistaCliente"],
): string {
  if (valor === "PASO") {
    return "Pasó"
  }
  if (valor === "NO_PASO") {
    return "No pasó"
  }
  if (valor === "PENDIENTE") {
    return "Pendiente"
  }
  return "—"
}

interface CampoProps {
  readonly etiqueta: string
  readonly valor: ReactNode
}

function Campo({ etiqueta, valor }: CampoProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption text-text-tertiary">{etiqueta}</span>
      <span className="text-body-sm text-text-primary">{valor}</span>
    </div>
  )
}

interface CuerpoProps {
  readonly detalle: AsignacionDetallada
  readonly tieneEntregaACliente: boolean
}

function CuerpoDetalle({ detalle, tieneEntregaACliente }: CuerpoProps) {
  return (
    <>
      <SidePeekSeccion titulo="Resumen">
        <div className="grid grid-cols-2 gap-4">
          <Campo etiqueta="Email" valor={detalle.colaborador.email} />
          <Campo
            etiqueta="Rol"
            valor={
              <Badge tono={detalle.rol === "ASIGNADO" ? "acento" : "info"}>
                {detalle.rol === "ASIGNADO" ? "Asignado" : "Voluntario"}
              </Badge>
            }
          />
          <Campo etiqueta="Inicio" valor={formatearFecha(detalle.fechaInicio)} />
          <Campo etiqueta="Cierre" valor={formatearFecha(detalle.fechaCierre)} />
        </div>
      </SidePeekSeccion>

      {detalle.observacionesAdmin ? (
        <SidePeekSeccion titulo="Observaciones del admin">
          <p className="whitespace-pre-wrap text-body-sm text-text-primary">
            {detalle.observacionesAdmin}
          </p>
        </SidePeekSeccion>
      ) : null}

      {detalle.rol === "ASIGNADO" && tieneEntregaACliente ? (
        <SidePeekSeccion titulo="Entrevista cliente">
          <div className="grid grid-cols-2 gap-4">
            <Campo
              etiqueta="Resultado"
              valor={etiquetaResultadoCliente(detalle.resultadoEntrevistaCliente)}
            />
            <Campo etiqueta="Fecha" valor={formatearFecha(detalle.fechaEntrevistaCliente)} />
          </div>
          {detalle.observacionesCliente ? (
            <p className="mt-2 whitespace-pre-wrap text-body-sm text-text-primary">
              {detalle.observacionesCliente}
            </p>
          ) : null}
        </SidePeekSeccion>
      ) : null}

      <SeccionHistoricoAsignacion asignacionId={detalle.id} />
    </>
  )
}

interface Props {
  readonly asignacionId: string | null
  readonly onCerrar: () => void
  readonly tieneEntregaACliente: boolean
}

export function PeekAsignacion({ asignacionId, onCerrar, tieneEntregaACliente }: Props) {
  const query = useObtenerAsignacion(asignacionId ?? undefined)
  const detalle = query.data

  return (
    <SidePeek
      abierto={asignacionId !== null}
      onCambiarAbierto={(open) => (open ? null : onCerrar())}
      titulo={detalle?.colaborador.nombreCompleto ?? "Asignación"}
      descripcion={detalle?.colaborador.email}
      cabeceraExtra={
        detalle ? (
          <BadgeEstadoAsignacion asignacion={detalle} tieneEntregaACliente={tieneEntregaACliente} />
        ) : null
      }
      ancho="xl"
    >
      {query.isLoading || !detalle ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <CuerpoDetalle detalle={detalle} tieneEntregaACliente={tieneEntregaACliente} />
      )}
    </SidePeek>
  )
}
