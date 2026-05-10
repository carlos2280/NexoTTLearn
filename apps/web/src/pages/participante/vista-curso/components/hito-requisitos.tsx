import type { VistaHitoRequisito } from "@nexott-learn/shared-types"
import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import { ICONO_REQ_CUMPLIDO, ICONO_REQ_PENDIENTE } from "./hito-presets"

interface HitoRequisitosProps {
  readonly requisitos: readonly VistaHitoRequisito[]
}

// §4.4.2 checklist de requisitos del hito bloqueado.
export function HitoRequisitos({ requisitos }: HitoRequisitosProps) {
  if (requisitos.length === 0) {
    return null
  }
  return (
    <ul className="flex flex-col gap-1.5 border-glass-border border-t pt-3">
      <li className="font-medium text-[11px] text-text-muted uppercase tracking-[0.06em]">
        Para desbloquearlo necesitas:
      </li>
      {requisitos.map((req, i) => {
        const Icon = req.cumplido ? ICONO_REQ_CUMPLIDO : ICONO_REQ_PENDIENTE
        const colorIcon = req.cumplido ? "text-success" : "text-danger"
        const colorTexto = req.cumplido ? "text-text-muted line-through" : "text-text-secondary"
        return (
          <li key={`${i}-${req.texto}`} className="flex items-start gap-2 text-[13px]">
            <Icon className={`mt-0.5 size-3.5 shrink-0 ${colorIcon}`} strokeWidth={2.25} />
            <span className={`flex-1 ${colorTexto}`}>{req.texto}</span>
            {!req.cumplido && req.hrefAccion !== null ? (
              <Link
                to={req.hrefAccion}
                className="inline-flex items-center gap-0.5 font-semibold text-[12px] text-brand-violet-soft transition-colors hover:text-brand-violet"
              >
                Ir
                <ChevronRight className="size-3.5" strokeWidth={2.25} />
              </Link>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
