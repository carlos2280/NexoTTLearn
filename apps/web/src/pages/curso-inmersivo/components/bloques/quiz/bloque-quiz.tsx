import { useCrearIntentoBloque } from "@/features/intentos-bloque/hooks/use-crear-intento-bloque"
import { useMejorIntentoBloque } from "@/features/intentos-bloque/hooks/use-mejor-intento-bloque"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/cn"
import { sanitizarHtml } from "@/shared/lib/sanitize-html"
import {
  type ContenidoQuiz,
  type IntentoBloqueResponse,
  type PreguntaQuiz,
  contenidoQuizSchema,
} from "@nexott-learn/shared-types"
import { CheckCircle2, Sparkles, XCircle } from "lucide-react"
import { useState } from "react"
import { QuizPreguntaOpcionMultiple } from "./quiz-pregunta-opcion-multiple"
import { QuizPreguntaOpcionUnica } from "./quiz-pregunta-opcion-unica"
import { QuizPreguntaRespuestaCorta } from "./quiz-pregunta-respuesta-corta"
import { QuizPreguntaVerdaderoFalso } from "./quiz-pregunta-verdadero-falso"
import { type UseQuizRespuestasResult, useQuizRespuestas } from "./use-quiz-respuestas"

interface BloqueQuizProps {
  readonly bloqueId: string
  readonly cursoId: string
  readonly colaboradorId: string
  readonly contenido: Record<string, unknown> | null
}

/**
 * Bloque QUIZ — Sub-capa C. El participante responde, envía y ve resultado.
 * Política "mejor intento gana" (D13): se muestra el mejor previo si existe;
 * cada nuevo intento puede mejorarlo. Solución visible según `solucionVisible`
 * del contenido (`tras_intento` / `al_aprobar` / `al_cerrar`).
 *
 * El motor de auto-corrección vive en el server — aquí solo enviamos
 * respuestas y mostramos lo que devuelva.
 */
export function BloqueQuiz({ bloqueId, cursoId, colaboradorId, contenido }: BloqueQuizProps) {
  const parsed = contenidoQuizSchema.safeParse(contenido)
  if (!parsed.success) {
    return null
  }
  return (
    <QuizActivo
      bloqueId={bloqueId}
      cursoId={cursoId}
      colaboradorId={colaboradorId}
      contenido={parsed.data}
    />
  )
}

interface QuizActivoProps {
  readonly bloqueId: string
  readonly cursoId: string
  readonly colaboradorId: string
  readonly contenido: ContenidoQuiz
}

function QuizActivo({ bloqueId, cursoId, colaboradorId, contenido }: QuizActivoProps) {
  const respuestas = useQuizRespuestas(contenido)
  const mejor = useMejorIntentoBloque({ colaboradorId, bloqueId })
  const crear = useCrearIntentoBloque()
  const [ultimoIntento, setUltimoIntento] = useState<IntentoBloqueResponse | null>(null)

  const aprobado = (mejor.data?.nota ?? -1) >= contenido.notaMinima
  const mostrarSolucion = decidirMostrarSolucion(
    contenido.solucionVisible,
    !!ultimoIntento,
    aprobado,
  )
  const totalContestadas = respuestas.contestadas
  const total = contenido.preguntas.length
  const completo = totalContestadas === total

  const onEnviar = (): void => {
    setUltimoIntento(null)
    crear.mutate(
      {
        body: {
          bloqueId,
          cursoId,
          respuestas: {
            tipo: "QUIZ",
            preguntas: [...respuestas.construirEnvio(contenido.preguntas)],
          },
        },
      },
      {
        onSuccess: (intento) => {
          setUltimoIntento(intento)
        },
      },
    )
  }

  const onReintentar = (): void => {
    setUltimoIntento(null)
    respuestas.limpiar()
  }

  return (
    <article
      className="relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-border bg-surface p-6"
      style={{ boxShadow: "var(--shadow-card-resting)" }}
    >
      <CabeceraQuiz
        notaMinima={contenido.notaMinima}
        totalPreguntas={total}
        mejorNota={mejor.data?.nota ?? null}
        aprobado={aprobado}
      />
      <ol className="flex flex-col gap-6">
        {contenido.preguntas.map((pregunta, idx) => (
          <PreguntaItem
            key={pregunta.id}
            numero={idx + 1}
            pregunta={pregunta}
            respuestas={respuestas}
            bloqueado={crear.isPending}
            mostrarSolucion={mostrarSolucion}
          />
        ))}
      </ol>
      {ultimoIntento ? (
        <ResultadoIntento intento={ultimoIntento} notaMinima={contenido.notaMinima} />
      ) : null}
      <footer className="flex items-center justify-between gap-3 border-border border-t pt-4">
        <p className="text-caption text-text-tertiary">
          Contestadas {totalContestadas}/{total} · Aprobar con ≥ {contenido.notaMinima}
        </p>
        <div className="flex items-center gap-2">
          {ultimoIntento ? (
            <Button variant="secondary" size="sm" onClick={onReintentar}>
              Volver a intentar
            </Button>
          ) : null}
          <Button onClick={onEnviar} disabled={!completo || crear.isPending}>
            {crear.isPending ? "Enviando…" : ultimoIntento ? "Reenviar" : "Enviar"}
          </Button>
        </div>
      </footer>
    </article>
  )
}

interface CabeceraQuizProps {
  readonly notaMinima: number
  readonly totalPreguntas: number
  readonly mejorNota: number | null
  readonly aprobado: boolean
}

function CabeceraQuiz({ notaMinima, totalPreguntas, mejorNota, aprobado }: CabeceraQuizProps) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-aurora-violet" aria-hidden={true} />
        <span className="nx-eyebrow text-aurora-violet">
          Quiz · {totalPreguntas} pregunta{totalPreguntas === 1 ? "" : "s"}
        </span>
      </div>
      {mejorNota !== null ? (
        <div
          className={cn(
            "flex items-center gap-2 rounded-pill border px-3 py-1",
            aprobado
              ? "border-success/40 bg-success-soft text-success-on-soft"
              : "border-border bg-subtle text-text-secondary",
          )}
        >
          <span className="font-mono text-caption tracking-wider">Mejor intento</span>
          <span className="tabular font-mono font-semibold text-body-sm">
            {mejorNota.toFixed(0)}
          </span>
          <span className="text-caption">/ {notaMinima.toFixed(0)}</span>
        </div>
      ) : null}
    </header>
  )
}

interface PreguntaItemProps {
  readonly numero: number
  readonly pregunta: PreguntaQuiz
  readonly respuestas: UseQuizRespuestasResult
  readonly bloqueado: boolean
  readonly mostrarSolucion: boolean
}

function PreguntaItem({
  numero,
  pregunta,
  respuestas,
  bloqueado,
  mostrarSolucion,
}: PreguntaItemProps) {
  return (
    <li className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <span className="tabular shrink-0 font-mono font-semibold text-caption text-text-tertiary">
          {String(numero).padStart(2, "0")}
        </span>
        <p className="text-body text-text-primary">{pregunta.enunciado}</p>
      </div>
      <ContenidoPregunta
        pregunta={pregunta}
        respuestas={respuestas}
        bloqueado={bloqueado}
        mostrarSolucion={mostrarSolucion}
      />
      {mostrarSolucion && pregunta.explicacion ? (
        <aside
          className="rounded-xl border border-border bg-subtle p-3 text-body-sm text-text-secondary"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: explicación del admin, sanitizada.
          dangerouslySetInnerHTML={{ __html: sanitizarHtml(pregunta.explicacion) }}
        />
      ) : null}
    </li>
  )
}

interface ContenidoPreguntaProps {
  readonly pregunta: PreguntaQuiz
  readonly respuestas: UseQuizRespuestasResult
  readonly bloqueado: boolean
  readonly mostrarSolucion: boolean
}

function ContenidoPregunta({
  pregunta,
  respuestas,
  bloqueado,
  mostrarSolucion,
}: ContenidoPreguntaProps) {
  switch (pregunta.tipo) {
    case "OPCION_UNICA":
      return (
        <QuizPreguntaOpcionUnica
          pregunta={pregunta}
          opcionElegidaId={respuestas.opcionUnica(pregunta.id)}
          onCambiar={(opcionId) => respuestas.setOpcionUnica(pregunta.id, opcionId)}
          bloqueado={bloqueado}
          opcionCorrectaId={pregunta.opciones.find((o) => o.esCorrecta)?.id ?? null}
          mostrarSolucion={mostrarSolucion}
        />
      )
    case "OPCION_MULTIPLE":
      return (
        <QuizPreguntaOpcionMultiple
          pregunta={pregunta}
          opcionesElegidasIds={respuestas.opcionMultiple(pregunta.id)}
          onToggle={(opcionId) => respuestas.toggleOpcionMultiple(pregunta.id, opcionId)}
          bloqueado={bloqueado}
          opcionesCorrectasIds={pregunta.opciones.filter((o) => o.esCorrecta).map((o) => o.id)}
          mostrarSolucion={mostrarSolucion}
        />
      )
    case "VERDADERO_FALSO":
      return (
        <QuizPreguntaVerdaderoFalso
          pregunta={pregunta}
          valor={respuestas.vf(pregunta.id)}
          onCambiar={(valor) => respuestas.setVerdaderoFalso(pregunta.id, valor)}
          bloqueado={bloqueado}
          mostrarSolucion={mostrarSolucion}
        />
      )
    case "RESPUESTA_CORTA":
      return (
        <QuizPreguntaRespuestaCorta
          pregunta={pregunta}
          texto={respuestas.texto(pregunta.id)}
          onCambiar={(texto) => respuestas.setTexto(pregunta.id, texto)}
          bloqueado={bloqueado}
          mostrarSolucion={mostrarSolucion}
        />
      )
    default: {
      const _exhaustivo: never = pregunta
      throw new Error(`Pregunta no manejada: ${JSON.stringify(_exhaustivo)}`)
    }
  }
}

interface ResultadoIntentoProps {
  readonly intento: IntentoBloqueResponse
  readonly notaMinima: number
}

function ResultadoIntento({ intento, notaMinima }: ResultadoIntentoProps) {
  const aprobado = intento.nota >= notaMinima
  const Icono = aprobado ? CheckCircle2 : XCircle
  return (
    <aside
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4",
        aprobado ? "border-success/30 bg-success-soft" : "border-warmth/30 bg-warning-soft",
      )}
    >
      <Icono
        className={cn("mt-0.5 h-5 w-5 shrink-0", aprobado ? "text-success" : "text-warmth")}
        aria-hidden={true}
      />
      <div className="flex flex-col gap-1">
        <p
          className={cn("text-body-sm", aprobado ? "text-success-on-soft" : "text-warning-on-soft")}
        >
          {aprobado
            ? `Aprobado · ${intento.nota.toFixed(0)} / 100. Tu mejor intento ahora cuenta para tu nota de skill.`
            : `Intento registrado · ${intento.nota.toFixed(0)} / 100. Sigue intentando — la mejor nota gana.`}
        </p>
        {intento.esMejorIntento ? (
          <p className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
            Nuevo mejor intento
          </p>
        ) : null}
      </div>
    </aside>
  )
}

function decidirMostrarSolucion(
  modo: ContenidoQuiz["solucionVisible"],
  haIntentado: boolean,
  aprobado: boolean,
): boolean {
  if (!haIntentado) {
    return false
  }
  if (modo === "tras_intento") {
    return true
  }
  if (modo === "al_aprobar") {
    return aprobado
  }
  return false
}
