import { useMejorIntentoBloque } from "@/features/intentos-bloque/hooks/use-mejor-intento-bloque"
import { Button } from "@/shared/components/ui/button"
import { CodeEditorNexott } from "@/shared/components/ui/code-editor-nexott"
import { cn } from "@/shared/lib/cn"
import {
  type ContenidoSqlEjercicio,
  type ContenidoSqlTests,
  type IntentoBloqueResponse,
  contenidoSqlEjercicioSchema,
} from "@nexott-learn/shared-types"
import { Play, RotateCcw, Send } from "lucide-react"
import { useState } from "react"
import { MARCA_SQL } from "../../ide/celda-evaluable"
import { EncabezadoCelda } from "../../ide/encabezado-celda"
import { ResultadoIntento } from "../codigo-preguntas/resultado-intento"
import { PanelEnunciadoSql } from "./panel-enunciado-sql"
import { TerminalSql } from "./terminal-sql"
import { useFlujoSql } from "./use-flujo-sql"

interface BloqueSqlEjercicioProps {
  readonly bloqueId: string
  readonly cursoId: string
  readonly colaboradorId: string | null
  readonly contenido: Record<string, unknown> | null
  readonly contenidoTests: ContenidoSqlTests | null
}

const NOTA_APROBADO_DEFAULT = 60
const ARCHIVO = "consulta.sql"

type EstadoEditor = "virgen" | "paso" | "pendiente"

function derivarEstadoEditor(input: {
  readonly consulta: string
  readonly consultaInicial: string
  readonly ejecucion: { readonly testsPasados: number; readonly testsTotales: number } | null
  readonly consultaEjecutada: string | null
}): EstadoEditor {
  if (input.consulta === input.consultaInicial && input.consultaEjecutada === null) {
    return "virgen"
  }
  if (
    input.ejecucion !== null &&
    input.consultaEjecutada === input.consulta &&
    input.ejecucion.testsPasados === input.ejecucion.testsTotales
  ) {
    return "paso"
  }
  return "pendiente"
}

/**
 * Bloque SQL_EJERCICIO — reto de SQL. Espejo de CODIGO_PREGUNTAS: enunciado +
 * esquema arriba, frame IDE abajo (top bar + editor SQL + terminal con las
 * filas). El runner corre la consulta en PGlite (navegador) contra un
 * `SQL_TESTS` hermano y persiste el intento con la nota recalculada en backend.
 */
export function BloqueSqlEjercicio({
  bloqueId,
  cursoId,
  colaboradorId,
  contenido,
  contenidoTests,
}: BloqueSqlEjercicioProps) {
  const parsed = contenidoSqlEjercicioSchema.safeParse(contenido)
  if (!parsed.success) {
    return null
  }
  return (
    <RetoSqlActivo
      bloqueId={bloqueId}
      cursoId={cursoId}
      colaboradorId={colaboradorId}
      contenido={parsed.data}
      contenidoTests={contenidoTests}
    />
  )
}

interface RetoSqlActivoProps {
  readonly bloqueId: string
  readonly cursoId: string
  readonly colaboradorId: string | null
  readonly contenido: ContenidoSqlEjercicio
  readonly contenidoTests: ContenidoSqlTests | null
}

function RetoSqlActivo({
  bloqueId,
  cursoId,
  colaboradorId,
  contenido,
  contenidoTests,
}: RetoSqlActivoProps) {
  const flujo = useFlujoSql({ bloqueId, cursoId, contenido, contenidoTests })
  const mejor = useMejorIntentoBloque({ colaboradorId: colaboradorId ?? undefined, bloqueId })
  const [mejorPrevioAlEnviar, setMejorPrevioAlEnviar] = useState<IntentoBloqueResponse | null>(null)
  const onEnviar = (): void => {
    setMejorPrevioAlEnviar(mejor.data ?? null)
    flujo.enviar()
  }
  const isPending = flujo.isEjecutando || flujo.isEnviando
  const puedeReset = !isPending && flujo.consulta !== contenido.consultaInicial
  const tieneConsulta = flujo.consulta.trim().length > 0
  const puedeAccionar = Boolean(flujo.puedeEjecutar && !isPending && tieneConsulta)
  const todosLosTestsPasaron = Boolean(
    flujo.ejecucion && flujo.ejecucion.testsPasados === flujo.ejecucion.testsTotales,
  )
  const estadoEditor = derivarEstadoEditor({
    consulta: flujo.consulta,
    consultaInicial: contenido.consultaInicial,
    ejecucion: flujo.ejecucion,
    consultaEjecutada: flujo.consultaEjecutada,
  })

  return (
    <article className="flex flex-col gap-5">
      <EncabezadoCelda
        glifo={MARCA_SQL.glifo}
        etiqueta={MARCA_SQL.etiqueta}
        tonoGlifo="text-accent"
      />
      <PanelEnunciadoSql contenido={contenido} />
      <div
        className="overflow-hidden rounded-2xl border border-border-strong bg-surface"
        style={{ boxShadow: "var(--shadow-card-resting)" }}
      >
        <TopBarSql
          estado={estadoEditor}
          onEjecutar={flujo.ejecutar}
          puedeEjecutar={puedeAccionar}
          isEjecutando={flujo.isEjecutando}
        />
        <CodeEditorNexott
          value={flujo.consulta}
          onValueChange={flujo.setConsulta}
          lenguaje="sql"
          rows={Math.max(6, contenido.consultaInicial.split("\n").length + 2)}
          placeholder="Escribe tu consulta…"
          mostrarNumerosLinea={true}
          embedded={true}
        />
        <div className="flex items-center justify-between gap-3 border-border border-t bg-subtle px-3 py-2">
          <Button variant="ghost" size="sm" onClick={flujo.reset} disabled={!puedeReset}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden={true} />
            Restaurar consulta
          </Button>
          <div className="flex items-center gap-3">
            <p className="hidden text-body-sm text-text-tertiary sm:block">
              Solo se guarda tu mejor intento.
            </p>
            <Button
              size="sm"
              variant={todosLosTestsPasaron ? "aurora" : "primary"}
              onClick={onEnviar}
              disabled={!puedeAccionar}
            >
              <Send className="mr-1.5 h-3 w-3" aria-hidden={true} />
              {flujo.isEnviando ? "Enviando…" : "Enviar intento"}
            </Button>
          </div>
        </div>
        <TerminalSql ejecucion={flujo.ejecucion} isEjecutando={flujo.isEjecutando} />
      </div>
      {flujo.errorEjecucion ? (
        <aside className="rounded-xl border border-danger/30 bg-danger-soft p-3 text-body-sm text-danger-on-soft">
          No pudimos ejecutar tu consulta en el navegador: {flujo.errorEjecucion.message}
        </aside>
      ) : null}
      {/* Siempre montado (aunque no haya intento) para que su región live anuncie
          el veredicto de forma fiable al poblarse. */}
      <ResultadoIntento
        intento={flujo.ultimoIntento}
        notaAprobado={NOTA_APROBADO_DEFAULT}
        mejorPrevio={mejorPrevioAlEnviar}
      />
    </article>
  )
}

interface TopBarSqlProps {
  readonly estado: EstadoEditor
  readonly onEjecutar: () => void
  readonly puedeEjecutar: boolean
  readonly isEjecutando: boolean
}

const DOT_ESTADO: Record<EstadoEditor, { readonly cls: string; readonly label: string }> = {
  virgen: { cls: "bg-border-strong", label: "Editor sin tocar" },
  paso: { cls: "bg-state-solido", label: "Última ejecución: todos los tests pasaron" },
  pendiente: { cls: "bg-warmth", label: "Tienes cambios sin probar o tests con fallos" },
}

function TopBarSql({ estado, onEjecutar, puedeEjecutar, isEjecutando }: TopBarSqlProps) {
  const { cls, label } = DOT_ESTADO[estado]
  return (
    <div className="flex items-center justify-between border-border border-b bg-subtle px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5" aria-hidden={true}>
          <span className="h-2.5 w-2.5 rounded-pill bg-state-no-apto" />
          <span className="h-2.5 w-2.5 rounded-pill bg-warmth" />
          <span className="h-2.5 w-2.5 rounded-pill bg-state-solido" />
        </div>
        <span className="font-mono text-caption text-text-secondary">{ARCHIVO} · sql</span>
        <span
          className={cn("ml-1 inline-block h-1.5 w-1.5 rounded-pill", cls)}
          title={label}
          aria-label={label}
        />
      </div>
      <Button size="sm" variant="secondary" onClick={onEjecutar} disabled={!puedeEjecutar}>
        <Play className="mr-1.5 h-3 w-3 fill-current" aria-hidden={true} />
        {isEjecutando ? "Ejecutando…" : "Ejecutar"}
      </Button>
    </div>
  )
}
