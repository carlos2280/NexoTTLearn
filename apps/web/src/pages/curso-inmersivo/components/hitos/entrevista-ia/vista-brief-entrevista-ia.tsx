import { Button } from "@/shared/components/ui/button"
import type { EntrevistaIaResponse } from "@nexott-learn/shared-types"
import { ArrowRight } from "lucide-react"
import { ComoFunciona } from "./como-funciona"

interface VistaBriefEntrevistaIaProps {
  readonly entrevista: EntrevistaIaResponse
  readonly onEmpezar: () => void
}

/**
 * Vista 1 del hito Entrevista IA (spec 06 — sin intento previo, disponible).
 * Brief con duracion estimada + "Como funciona" (3 reglas fijas del sistema).
 *
 * La cuota de intentos por hora NO se expone al participante (decision
 * 06-D-01, 2026-05-16): es configuracion operativa de costo LLM que el
 * admin gestiona por curso. Cuando se alcanza el limite, la disponibilidad
 * devuelve `RATE_LIMIT_HORA` y la vista 5 (bloqueada) lo comunica con su
 * propio copy. Aqui no aparece numero alguno.
 *
 * Cero numeros de evaluacion: umbral, filosofia, profundidad, tono, areas
 * son maquinaria interna que no se expone al participante.
 */
export function VistaBriefEntrevistaIa({ entrevista, onEmpezar }: VistaBriefEntrevistaIaProps) {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="nx-eyebrow text-aurora-violet">Hito de cierre</span>
        <h2 className="text-display-md text-text-primary leading-tight">Entrevista IA</h2>
        <p className="text-body text-text-secondary">
          Una conversacion corta con un evaluador. Sera de unos {entrevista.duracionMinutos}{" "}
          minutos.
        </p>
      </header>

      <ComoFunciona />

      <footer className="flex flex-col items-start gap-2">
        <Button variant="aurora" onClick={onEmpezar}>
          Iniciar entrevista
          <ArrowRight className="ml-2 h-3.5 w-3.5" aria-hidden={true} />
        </Button>
        <p className="text-caption text-text-tertiary">Tomate tu tiempo.</p>
      </footer>
    </section>
  )
}
