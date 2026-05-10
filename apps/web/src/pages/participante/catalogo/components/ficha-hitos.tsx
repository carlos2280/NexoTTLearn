import type { CatalogoFichaHitos } from "@nexott-learn/shared-types"
import { Mic, Trophy } from "lucide-react"

interface FichaHitosProps {
  readonly hitos: CatalogoFichaHitos
}

// §2.3 ficha-curso-libre.md · "Hitos de este curso" — solo se renderiza si
// hay al menos uno (transversal o entrevista IA).
export function FichaHitos({ hitos }: FichaHitosProps) {
  const sinHitos = !(hitos.tieneTransversal || hitos.tieneEntrevistaIA)
  if (sinHitos) {
    return null
  }
  return (
    <section className="flex flex-col gap-3 rounded-[20px] border border-glass-border bg-surface-1 p-6 md:p-8">
      <h2 className="font-semibold text-text-primary text-xl">Hitos de este curso</h2>
      <ul className="flex flex-col gap-2.5 text-[14px] text-text-secondary">
        {hitos.tieneTransversal ? (
          <li className="flex items-start gap-3 rounded-[12px] border border-glass-border bg-surface-2 p-3.5">
            <Trophy
              aria-hidden="true"
              strokeWidth={1.5}
              className="size-5 shrink-0 text-amber-300"
            />
            <span className="flex flex-col gap-0.5">
              <span className="font-medium text-text-primary">Proyecto transversal</span>
              <span className="text-[12.5px] text-text-muted">
                Se desbloquea al completar las areas obligatorias
              </span>
            </span>
          </li>
        ) : null}
        {hitos.tieneEntrevistaIA ? (
          <li className="flex items-start gap-3 rounded-[12px] border border-glass-border bg-surface-2 p-3.5">
            <Mic aria-hidden="true" strokeWidth={1.5} className="size-5 shrink-0 text-brand-cyan" />
            <span className="flex flex-col gap-0.5">
              <span className="font-medium text-text-primary">Entrevista final con IA</span>
              <span className="text-[12.5px] text-text-muted">
                Se desbloquea al aprobar el proyecto transversal
              </span>
            </span>
          </li>
        ) : null}
      </ul>
    </section>
  )
}
