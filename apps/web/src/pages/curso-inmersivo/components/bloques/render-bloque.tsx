import type {
  BloqueDetalleResponse,
  ContenidoCodigoTests,
  ModoCursoParticipante,
} from "@nexott-learn/shared-types"
import { BloqueCodigoIlustrativo } from "./bloque-codigo-ilustrativo"
import { BloqueCodigoPreguntas } from "./bloque-codigo-preguntas"
import { BloqueEvaluablePreviewLock } from "./bloque-evaluable-preview-lock"
import { BloqueParrafo } from "./bloque-parrafo"
import { BloqueRecurso } from "./bloque-recurso"
import { BloqueTip } from "./bloque-tip"
import { BloqueVideo } from "./bloque-video"
import { BloqueQuiz } from "./quiz/bloque-quiz"

interface RenderBloqueProps {
  readonly bloque: BloqueDetalleResponse
  readonly cursoId: string
  /**
   * `null` cuando el modo es `preview` (no hay asignacion y por tanto no hay
   * colaborador con el que registrar intentos). En ese caso los bloques
   * evaluables se renderizan en lectura con un CTA bloqueado.
   */
  readonly colaboradorId: string | null
  readonly modo: ModoCursoParticipante
  /**
   * Contenido del bloque `CODIGO_TESTS` hermano si existe. Solo aplica cuando
   * `bloque.tipo === "CODIGO_PREGUNTAS"`; permite que el navegador ejecute los
   * tests del reto en el cliente (Pyodide / Web Worker).
   */
  readonly contenidoTests: ContenidoCodigoTests | null
}

/**
 * Dispatcher por `tipo` (D5.3). Los bloques de contenido (Sub-capa B) son
 * iguales en los tres modos (asignado | voluntario | preview). Los evaluables
 * (Sub-capa C) cambian en modo `preview`: muestran el enunciado pero el CTA
 * se sustituye por un mensaje sobrio invitando a inscribirse.
 *
 * `CODIGO_TESTS` se oculta al participante: vive emparejado al
 * `CODIGO_PREGUNTAS` y solo lo consume el motor de auto-correccion del
 * server (D16b §16b.6).
 */
export function RenderBloque({
  bloque,
  cursoId,
  colaboradorId,
  modo,
  contenidoTests,
}: RenderBloqueProps) {
  switch (bloque.tipo) {
    case "PARRAFO":
      return <BloqueParrafo contenido={bloque.contenido} />
    case "TIP":
      return <BloqueTip contenido={bloque.contenido} />
    case "VIDEO":
      return <BloqueVideo contenido={bloque.contenido} />
    case "RECURSO":
      return <BloqueRecurso contenido={bloque.contenido} />
    case "CODIGO_ILUSTRATIVO":
      return <BloqueCodigoIlustrativo contenido={bloque.contenido} />
    case "QUIZ": {
      if (modo === "preview" || !colaboradorId) {
        return <BloqueEvaluablePreviewLock titulo="Quiz" />
      }
      return (
        <BloqueQuiz
          bloqueId={bloque.id}
          cursoId={cursoId}
          colaboradorId={colaboradorId}
          contenido={bloque.contenido}
        />
      )
    }
    case "CODIGO_PREGUNTAS": {
      if (modo === "preview" || !colaboradorId) {
        return <BloqueEvaluablePreviewLock titulo="Ejercicio de código" />
      }
      return (
        <BloqueCodigoPreguntas
          bloqueId={bloque.id}
          cursoId={cursoId}
          contenido={bloque.contenido}
          contenidoTests={contenidoTests}
        />
      )
    }
    case "CODIGO_TESTS":
      return null
    default:
      return null
  }
}
