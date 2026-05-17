import { useCrearIntentoBloque } from "@/features/intentos-bloque/hooks/use-crear-intento-bloque"
import { useMejorIntentoBloque } from "@/features/intentos-bloque/hooks/use-mejor-intento-bloque"
import { Button } from "@/shared/components/ui/button"
import {
  type ContenidoQuiz,
  type IntentoBloqueResponse,
  contenidoQuizSchema,
} from "@nexott-learn/shared-types"
import { useState } from "react"
import { CabeceraQuiz } from "./cabecera-quiz"
import { PreguntaItem } from "./pregunta-item"
import { ResultadoIntentoQuiz, decidirMostrarSolucion } from "./resultado-intento-quiz"
import { useQuizRespuestas } from "./use-quiz-respuestas"

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
  // Snapshot del mejor previo en el momento del envío. Sirve para distinguir
  // "primera vez que apruebas" en el banner sin contaminar el cache de Tanstack.
  const [mejorPrevioAlEnviar, setMejorPrevioAlEnviar] = useState<IntentoBloqueResponse | null>(null)

  // `aprobado` considera tanto el ultimo intento recien enviado como el
  // mejor historico cacheado. Sin esto, la solucion no se muestra entre el
  // POST exitoso y el refetch de `useMejorIntentoBloque`, y en mocks que
  // no persisten el mejor nunca se mostraria.
  const notaVigente = Math.max(ultimoIntento?.nota ?? -1, mejor.data?.nota ?? -1)
  const aprobado = notaVigente >= contenido.notaMinima
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
    setMejorPrevioAlEnviar(mejor.data ?? null)
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
      <CabeceraQuiz totalPreguntas={total} />
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
        <ResultadoIntentoQuiz
          intento={ultimoIntento}
          notaMinima={contenido.notaMinima}
          mejorPrevio={mejorPrevioAlEnviar}
        />
      ) : null}
      <footer className="flex items-center justify-between gap-3 border-border border-t pt-4">
        <p className="text-caption text-text-tertiary">
          Contestadas {totalContestadas} de {total}.
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
