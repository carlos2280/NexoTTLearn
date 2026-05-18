import { Badge } from "@/shared/components/ui/badge"
import { RUTAS } from "@/shared/constants/rutas"
import type { IntentoTransversalAdminResponse } from "@nexott-learn/shared-types"
import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

interface HeaderIntentoTransversalProps {
  readonly intento: IntentoTransversalAdminResponse
}

type EstadoIntento = IntentoTransversalAdminResponse["estado"]
type TonoBadge = "neutro" | "success" | "danger" | "warning"

const TONO_ESTADO: ReadonlyMap<EstadoIntento, TonoBadge> = new Map([
  ["EN_EVALUACION", "warning"],
  ["EVALUADO", "neutro"],
  ["FINALIZADO", "success"],
  ["ANULADO", "danger"],
])

const ETIQUETA_ESTADO: ReadonlyMap<EstadoIntento, string> = new Map([
  ["EN_EVALUACION", "En evaluación"],
  ["EVALUADO", "Listo para finalizar"],
  ["FINALIZADO", "Finalizado"],
  ["ANULADO", "Anulado"],
])

export function HeaderIntentoTransversal({ intento }: HeaderIntentoTransversalProps) {
  const fechaTxt = new Date(intento.fecha).toLocaleString("es-CL", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
  return (
    <header className="flex flex-col gap-3 border-border border-b pb-6">
      <Link
        to={RUTAS.admin.cursoDetalle(intento.curso.id)}
        className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden={true} />
        Volver al curso
      </Link>
      <div className="flex flex-col gap-2">
        <span className="nx-eyebrow text-text-tertiary">Intento transversal</span>
        <h1 className="text-display-md text-text-primary leading-tight">
          {intento.colaborador.nombre}
        </h1>
        <p className="text-body text-text-secondary">
          {intento.curso.titulo}
          <span className="px-2 text-text-disabled">·</span>
          {intento.transversal.descripcion}
        </p>
        <p className="text-body-sm text-text-tertiary">{intento.colaborador.email}</p>
        <div className="mt-1 flex items-center gap-3 text-body-sm text-text-tertiary">
          <span>{fechaTxt}</span>
          <span className="text-text-disabled">·</span>
          <Badge tono={TONO_ESTADO.get(intento.estado) ?? "neutro"} conPunto={false}>
            {ETIQUETA_ESTADO.get(intento.estado) ?? intento.estado}
          </Badge>
          {intento.anulado && intento.estado !== "ANULADO" ? (
            <Badge tono="danger" conPunto={false}>
              Anulado
            </Badge>
          ) : null}
        </div>
      </div>
    </header>
  )
}
