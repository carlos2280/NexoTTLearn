import { useCrearIntentoBloque } from "@/features/intentos-bloque/hooks/use-crear-intento-bloque"
import { useMejorIntentoBloque } from "@/features/intentos-bloque/hooks/use-mejor-intento-bloque"
import { Button } from "@/shared/components/ui/button"
import {
  type ContenidoQuiz,
  type IntentoBloqueResponse,
  contenidoQuizSchema,
} from "@nexott-learn/shared-types"
import { useMemo, useState } from "react"
import { CeldaBloque } from "../../ide/celda-bloque"
import { PreguntaItem } from "./pregunta-item"
import { construirRespuestasRevision } from "./respuestas-revision"
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
  // El alumno pidió reintentar un quiz ya aprobado → salimos de revisión.
  const [reintentando, setReintentando] = useState(false)

  // `aprobado` considera tanto el ultimo intento recien enviado como el
  // mejor historico cacheado. Sin esto, la solucion no se muestra entre el
  // POST exitoso y el refetch de `useMejorIntentoBloque`, y en mocks que
  // no persisten el mejor nunca se mostraria.
  const notaVigente = Math.max(ultimoIntento?.nota ?? -1, mejor.data?.nota ?? -1)
  const aprobado = notaVigente >= contenido.notaMinima

  // Modo revisión (P13): al VOLVER a un quiz ya aprobado (sin envío fresco esta
  // sesión), hidratamos la vista con las respuestas guardadas en solo lectura.
  const respuestasGuardadas = mejor.data?.respuestas
  const enRevision =
    aprobado && !ultimoIntento && !reintentando && respuestasGuardadas?.tipo === "QUIZ"
  const respuestasRevision = useMemo(
    () => construirRespuestasRevision(respuestasGuardadas),
    [respuestasGuardadas],
  )

  const total = contenido.preguntas.length
  const completo = respuestas.contestadas === total

  // Fuentes de render: en revisión salen del mejor intento guardado; en modo
  // interactivo, del último envío de esta sesión.
  const respuestasParaRender = enRevision ? respuestasRevision : respuestas
  const bloqueado = enRevision || crear.isPending
  const intentoVigente = enRevision ? (mejor.data ?? null) : ultimoIntento
  // B-extra.2 punto 4: ids de preguntas falladas indexados para lookup O(1).
  const preguntasFalladasSet = intentoVigente
    ? new Set(intentoVigente.preguntasFalladas)
    : undefined
  const mostrarSolucion = decidirMostrarSolucion(
    contenido.solucionVisible,
    enRevision || !!ultimoIntento,
    aprobado,
  )

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

  const onVolverAIntentar = (): void => {
    setUltimoIntento(null)
    setReintentando(true)
    respuestas.limpiar()
  }

  return (
    <CeldaBloque
      glifo="?"
      etiqueta={`quiz · ${total} pregunta${total === 1 ? "" : "s"}`}
      tonoGlifo="text-accent"
      bodyClassName="flex flex-col gap-5"
    >
      <ol className="flex flex-col gap-6">
        {contenido.preguntas.map((pregunta, idx) => (
          <PreguntaItem
            key={pregunta.id}
            numero={idx + 1}
            pregunta={pregunta}
            respuestas={respuestasParaRender}
            bloqueado={bloqueado}
            verSolucion={mostrarSolucion}
            preguntasFalladas={preguntasFalladasSet}
          />
        ))}
      </ol>
      {/* Siempre montado (aunque no haya intento) para que su región live anuncie
          el veredicto de forma fiable al poblarse. */}
      <ResultadoIntentoQuiz
        intento={intentoVigente}
        notaMinima={contenido.notaMinima}
        totalPreguntas={total}
        mejorPrevio={enRevision ? (mejor.data ?? null) : mejorPrevioAlEnviar}
        anunciar={!enRevision}
      />
      <QuizFooter
        enRevision={enRevision}
        contestadas={respuestas.contestadas}
        total={total}
        completo={completo}
        enviando={crear.isPending}
        hayUltimoIntento={!!ultimoIntento}
        onEnviar={onEnviar}
        onVolverAIntentar={onVolverAIntentar}
      />
    </CeldaBloque>
  )
}

interface QuizFooterProps {
  readonly enRevision: boolean
  readonly contestadas: number
  readonly total: number
  readonly completo: boolean
  readonly enviando: boolean
  readonly hayUltimoIntento: boolean
  readonly onEnviar: () => void
  readonly onVolverAIntentar: () => void
}

function QuizFooter({
  enRevision,
  contestadas,
  total,
  completo,
  enviando,
  hayUltimoIntento,
  onEnviar,
  onVolverAIntentar,
}: QuizFooterProps) {
  return (
    <footer className="flex items-center justify-between gap-3 border-border border-t pt-4">
      <p className="text-caption text-text-tertiary">
        {enRevision
          ? "Ya aprobaste este quiz — en revisión."
          : `Contestadas ${contestadas} de ${total}.`}
      </p>
      <div className="flex items-center gap-2">
        {enRevision || hayUltimoIntento ? (
          <Button variant="secondary" size="sm" onClick={onVolverAIntentar}>
            Volver a intentar
          </Button>
        ) : null}
        {enRevision ? null : (
          <Button onClick={onEnviar} disabled={!completo || enviando}>
            {enviando ? "Enviando…" : hayUltimoIntento ? "Reenviar" : "Enviar"}
          </Button>
        )}
      </div>
    </footer>
  )
}
