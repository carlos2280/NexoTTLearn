import { useMejorIntentoBloque } from "@/features/intentos-bloque/hooks/use-mejor-intento-bloque"
import { Button } from "@/shared/components/ui/button"
import { CodeEditorNexott } from "@/shared/components/ui/code-editor-nexott"
import {
  type ContenidoCodigoPreguntas,
  type ContenidoCodigoTests,
  contenidoCodigoPreguntasSchema,
} from "@nexott-learn/shared-types"
import { Play, RotateCcw } from "lucide-react"
import { Cabecera } from "./codigo-preguntas/cabecera"
import { PanelEnunciado } from "./codigo-preguntas/panel-enunciado"
import { ResultadoIntento } from "./codigo-preguntas/resultado-intento"
import { ResultadosTests } from "./codigo-preguntas/resultados-tests"
import { useFlujoCodigoPregunta } from "./codigo-preguntas/use-flujo-codigo-pregunta"

interface BloqueCodigoPreguntasProps {
  readonly bloqueId: string
  readonly cursoId: string
  readonly colaboradorId: string
  readonly contenido: Record<string, unknown> | null
  readonly contenidoTests: ContenidoCodigoTests | null
}

const NOTA_APROBADO_DEFAULT = 60

/**
 * Bloque CODIGO_PREGUNTAS — reto de código.
 *
 *  - Layout split: enunciado a la izquierda · editor + resultados a la derecha.
 *  - Auto-corregible (`modoSimple=false` + bloque CODIGO_TESTS hermano):
 *    ejecuta los tests en el navegador (Pyodide / Web Worker) y persiste el
 *    intento con los resultados que el backend recalcula.
 *  - Rúbrica (`modoSimple=true`): muestra la rúbrica y avisa de revisión
 *    manual; el envío automático no aplica.
 */
export function BloqueCodigoPreguntas({
  bloqueId,
  cursoId,
  colaboradorId,
  contenido,
  contenidoTests,
}: BloqueCodigoPreguntasProps) {
  const parsed = contenidoCodigoPreguntasSchema.safeParse(contenido)
  if (!parsed.success) {
    return null
  }
  return (
    <RetoActivo
      bloqueId={bloqueId}
      cursoId={cursoId}
      colaboradorId={colaboradorId}
      contenido={parsed.data}
      contenidoTests={contenidoTests}
    />
  )
}

interface RetoActivoProps {
  readonly bloqueId: string
  readonly cursoId: string
  readonly colaboradorId: string
  readonly contenido: ContenidoCodigoPreguntas
  readonly contenidoTests: ContenidoCodigoTests | null
}

function RetoActivo({
  bloqueId,
  cursoId,
  colaboradorId,
  contenido,
  contenidoTests,
}: RetoActivoProps) {
  const mejor = useMejorIntentoBloque({ colaboradorId, bloqueId })
  const flujo = useFlujoCodigoPregunta({ bloqueId, cursoId, contenido, contenidoTests })
  const isPending = flujo.isEjecutando || flujo.isEnviando

  return (
    <article
      className="relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-border bg-surface p-6"
      style={{ boxShadow: "var(--shadow-card-resting)" }}
    >
      <Cabecera
        mejorNota={mejor.data?.nota ?? null}
        lenguaje={contenido.lenguaje}
        notaAprobado={NOTA_APROBADO_DEFAULT}
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,1.4fr)]">
        <PanelEnunciado contenido={contenido} puedeEjecutar={flujo.puedeEjecutar} />
        <div className="flex flex-col gap-3">
          <CodeEditorNexott
            value={flujo.codigo}
            onValueChange={flujo.setCodigo}
            lenguaje={contenido.lenguaje}
            rows={Math.max(10, contenido.esqueletoInicial.split("\n").length + 2)}
            placeholder="Escribe tu solución…"
          />
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={flujo.reset}
              disabled={isPending || flujo.codigo === contenido.esqueletoInicial}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden={true} />
              Restaurar esqueleto
            </Button>
            <Button
              onClick={flujo.ejecutar}
              disabled={!flujo.puedeEjecutar || isPending || flujo.codigo.trim().length === 0}
            >
              <Play className="mr-1.5 h-3.5 w-3.5" aria-hidden={true} />
              {flujo.isEjecutando
                ? "Ejecutando…"
                : flujo.isEnviando
                  ? "Guardando…"
                  : "Ejecutar tests"}
            </Button>
          </div>
        </div>
      </div>
      {flujo.errorEjecucion ? (
        <aside className="rounded-xl border border-danger/30 bg-danger-soft p-3 text-body-sm text-danger-on-soft">
          No pudimos ejecutar los tests en el navegador: {flujo.errorEjecucion.message}
        </aside>
      ) : null}
      {flujo.ejecucion ? <ResultadosTests ejecucion={flujo.ejecucion} /> : null}
      {flujo.ultimoIntento ? (
        <ResultadoIntento intento={flujo.ultimoIntento} notaAprobado={NOTA_APROBADO_DEFAULT} />
      ) : null}
    </article>
  )
}
