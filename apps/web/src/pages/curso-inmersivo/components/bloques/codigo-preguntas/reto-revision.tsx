import { Button } from "@/shared/components/ui/button"
import { CodeEditorNexott } from "@/shared/components/ui/code-editor-nexott"
import { extraerTextoPlano } from "@/shared/lib/sanitize-html"
import type {
  ContenidoCodigoPreguntas,
  ContenidoCodigoTests,
  IntentoBloqueResponse,
  ResultadoTestGuardado,
} from "@nexott-learn/shared-types"
import { RotateCcw } from "lucide-react"
import { EncabezadoCelda } from "../../ide/encabezado-celda"
import { EjemplosTests } from "./ejemplos-tests"
import { extraerPistasOcultos } from "./extraer-pistas-ocultos"
import { PanelEnunciado } from "./panel-enunciado"
import { reconstruirEjecucion } from "./reconstruir-ejecucion"
import { ResultadoIntento } from "./resultado-intento"
import { TerminalTests } from "./terminal-tests"

interface RetoRevisionProps {
  readonly contenido: ContenidoCodigoPreguntas
  readonly contenidoTests: ContenidoCodigoTests | null
  readonly codigoEnviado: string
  readonly resultadosTests: readonly ResultadoTestGuardado[]
  readonly intento: IntentoBloqueResponse
  readonly notaAprobado: number
  readonly archivo: string
  readonly onReintentar: () => void
}

/**
 * Vista de REVISIÓN del reto de código (P21): al volver a un reto ya aprobado
 * se muestra el código enviado en solo lectura + los resultados de los tests
 * guardados, reusando el mismo frame IDE que la vista activa. Sirve para todos
 * los lenguajes (el lenguaje es un campo del contenido). Botón "Volver a
 * intentar" para rehacerlo (intentos ilimitados; el mejor intento gana).
 */
export function RetoRevision({
  contenido,
  contenidoTests,
  codigoEnviado,
  resultadosTests,
  intento,
  notaAprobado,
  archivo,
  onReintentar,
}: RetoRevisionProps) {
  const ejecucion = reconstruirEjecucion(resultadosTests)
  const hayPistaOculta = extraerPistasOcultos(ejecucion.resultados).some(
    (p) => extraerTextoPlano(p.texto).length > 0,
  )

  return (
    <article className="flex flex-col gap-5">
      <EncabezadoCelda glifo=">" etiqueta="ejercicio de código" tonoGlifo="text-accent" />
      <PanelEnunciado contenido={contenido} />
      <EjemplosTests tests={contenidoTests?.tests ?? []} />
      <div
        className="overflow-hidden rounded-2xl border border-border-strong bg-surface"
        style={{ boxShadow: "var(--shadow-card-resting)" }}
      >
        <div className="flex items-center justify-between gap-3 border-border border-b bg-subtle px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" aria-hidden={true}>
              <span className="h-2.5 w-2.5 rounded-pill bg-state-no-apto" />
              <span className="h-2.5 w-2.5 rounded-pill bg-warmth" />
              <span className="h-2.5 w-2.5 rounded-pill bg-state-solido" />
            </div>
            <span className="font-mono text-caption text-text-secondary">
              {archivo} · {contenido.lenguaje}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-pill border border-success/30 bg-success-soft px-2 py-0.5 font-mono text-[10px] text-success-on-soft uppercase tracking-wider">
            Ya enviado
          </span>
        </div>
        <CodeEditorNexott
          value={codigoEnviado}
          lenguaje={contenido.lenguaje}
          rows={Math.max(10, codigoEnviado.split("\n").length + 1)}
          readOnly={true}
          mostrarNumerosLinea={true}
          embedded={true}
        />
        <div className="flex items-center justify-between gap-3 border-border border-t bg-subtle px-3 py-2">
          <p className="text-body-sm text-text-tertiary">Tu código enviado (solo lectura).</p>
          <Button variant="ghost" size="sm" onClick={onReintentar}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden={true} />
            Volver a intentar
          </Button>
        </div>
        <TerminalTests ejecucion={ejecucion} isEjecutando={false} />
      </div>
      <ResultadoIntento
        intento={intento}
        notaAprobado={notaAprobado}
        mejorPrevio={intento}
        hayPistaOculta={hayPistaOculta}
        anunciar={false}
      />
    </article>
  )
}
