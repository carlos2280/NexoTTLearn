import { Card } from "@/shared/components/ui/card"
import type { DetalleColaboradorAsignacion } from "@nexott-learn/shared-types"
import { Mail, UserCircle2 } from "lucide-react"
import type { ReactNode } from "react"

interface DetalleIdentidadProps {
  readonly nombre: string
  readonly email: string
  readonly asignacion: DetalleColaboradorAsignacion
}

function formatearFecha(iso: string | null): string {
  if (!iso) {
    return "—"
  }
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function legibleEstado(estado: string): string {
  return estado.replace(/_/g, " ")
}

export function DetalleIdentidad({ nombre, email, asignacion }: DetalleIdentidadProps) {
  return (
    <Card tono="hero" densidad="generosa" className="flex flex-col gap-5">
      <header className="flex items-start gap-4">
        <span
          aria-hidden={true}
          className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/20 bg-surface text-accent"
        >
          <UserCircle2 className="h-7 w-7" />
        </span>
        <div className="flex flex-1 flex-col gap-1">
          <h2 className="text-h2 text-text-primary">{nombre}</h2>
          <span className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary">
            <Mail className="h-3.5 w-3.5" aria-hidden={true} />
            {email}
          </span>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metrica eyebrow="Estado">{legibleEstado(asignacion.estado)}</Metrica>
        <Metrica eyebrow="Rol">{legibleEstado(asignacion.rolAsignacion)}</Metrica>
        <Metrica eyebrow="Inscrito">{formatearFecha(asignacion.fechaInscripcion)}</Metrica>
        <Metrica eyebrow="Cierre">{formatearFecha(asignacion.fechaCierre)}</Metrica>
      </dl>
    </Card>
  )
}

interface MetricaProps {
  readonly eyebrow: string
  readonly children: ReactNode
}

function Metrica({ eyebrow, children }: MetricaProps) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="nx-eyebrow text-text-tertiary">{eyebrow}</dt>
      <dd className="font-medium text-body-sm text-text-primary">{children}</dd>
    </div>
  )
}
