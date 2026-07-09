import type {
  BloqueDetalleResponse,
  ContenidoCodigoTests,
  ContenidoSqlTests,
  ModoCursoParticipante,
} from "@nexott-learn/shared-types"
import { contenidoQuizSchema } from "@nexott-learn/shared-types"
import type { ReactNode } from "react"
import { MARCA_CODIGO, MARCA_QUIZ, MARCA_SQL, type MarcaCelda } from "../ide/celda-evaluable"
import { BloqueCodigoIlustrativo } from "./bloque-codigo-ilustrativo"
import { BloqueCodigoPreguntas } from "./bloque-codigo-preguntas"
import { BloqueDiagrama } from "./bloque-diagrama"
import { BloqueEvaluableCerrado } from "./bloque-evaluable-cerrado"
import { BloqueEvaluablePreviewLock } from "./bloque-evaluable-preview-lock"
import { BloqueParrafo } from "./bloque-parrafo"
import { BloqueRecurso } from "./bloque-recurso"
import { BloqueTip } from "./bloque-tip"
import { BloqueVideo } from "./bloque-video"
import { EvaluableConIndicador } from "./evaluable-con-indicador"
import { BloqueGitEjercicio } from "./git-ejercicio/bloque-git-ejercicio"
import { BloqueQuiz } from "./quiz/bloque-quiz"
import { BloqueSqlEjercicio } from "./sql-ejercicio/bloque-sql-ejercicio"

const NOTA_APROBADO_CODIGO_DEFAULT = 60
const NOTA_APROBADO_SQL_DEFAULT = 60

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
  /**
   * Contenido del bloque `SQL_TESTS` hermano si existe. Solo aplica cuando
   * `bloque.tipo === "SQL_EJERCICIO"`; aporta las semillas + consultas de
   * referencia con que el navegador (PGlite) corre la suite en el cliente.
   */
  readonly contenidoSqlTests: ContenidoSqlTests | null
  /**
   * Curso cerrado (`avance.estaCerrado === true`). Los bloques evaluables se
   * renderizan en modo lectura — sin inputs, sin CTA — mostrando el resultado
   * del mejor intento. Ortogonal al `modo` (un curso `asignado` se cierra,
   * no cambia de modo).
   */
  readonly soloLectura: boolean
}

/**
 * Dispatcher por `tipo` (D5.3). Los bloques de contenido (Sub-capa B) son
 * iguales en los tres modos (asignado | voluntario | preview). Los evaluables
 * (Sub-capa C) delegan su triple estado —cerrado / preview / activo— en
 * `EnvolturaEvaluable`, que es idéntica para QUIZ, CODIGO_PREGUNTAS y
 * SQL_EJERCICIO.
 *
 * `CODIGO_TESTS` / `SQL_TESTS` se ocultan al participante: viven emparejados a
 * su ejercicio y solo los consume el motor de auto-correccion (D16b §16b.6).
 */
export function RenderBloque({
  bloque,
  cursoId,
  colaboradorId,
  modo,
  contenidoTests,
  contenidoSqlTests,
  soloLectura,
}: RenderBloqueProps) {
  const comun = { bloqueId: bloque.id, colaboradorId, modo, soloLectura }
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
    case "DIAGRAMA":
      return <BloqueDiagrama contenido={bloque.contenido} />
    case "QUIZ":
      return (
        <EnvolturaEvaluable
          {...comun}
          marca={MARCA_QUIZ}
          notaMinima={notaMinimaQuiz(bloque.contenido)}
        >
          {(colab) => (
            <BloqueQuiz
              bloqueId={bloque.id}
              cursoId={cursoId}
              colaboradorId={colab}
              contenido={bloque.contenido}
            />
          )}
        </EnvolturaEvaluable>
      )
    case "CODIGO_PREGUNTAS":
      return (
        <EnvolturaEvaluable
          {...comun}
          marca={MARCA_CODIGO}
          notaMinima={NOTA_APROBADO_CODIGO_DEFAULT}
        >
          {(colab) => (
            <BloqueCodigoPreguntas
              bloqueId={bloque.id}
              cursoId={cursoId}
              colaboradorId={colab}
              contenido={bloque.contenido}
              contenidoTests={contenidoTests}
            />
          )}
        </EnvolturaEvaluable>
      )
    case "SQL_EJERCICIO":
      return (
        <EnvolturaEvaluable {...comun} marca={MARCA_SQL} notaMinima={NOTA_APROBADO_SQL_DEFAULT}>
          {(colab) => (
            <BloqueSqlEjercicio
              bloqueId={bloque.id}
              cursoId={cursoId}
              colaboradorId={colab}
              contenido={bloque.contenido}
              contenidoTests={contenidoSqlTests}
            />
          )}
        </EnvolturaEvaluable>
      )
    case "GIT_EJERCICIO":
      // Autocontenido: no registra intento (por ahora). El `objetivo` declarativo
      // del contenido habilita el futuro modo evaluable sin cambiar el modelo.
      return <BloqueGitEjercicio contenido={bloque.contenido} />
    case "CODIGO_TESTS":
      return null
    case "SQL_TESTS":
      return null
    default:
      return null
  }
}

interface EnvolturaEvaluableProps {
  readonly bloqueId: string
  readonly colaboradorId: string | null
  readonly modo: ModoCursoParticipante
  readonly soloLectura: boolean
  readonly marca: MarcaCelda
  readonly notaMinima: number
  /** Render del bloque activo; recibe el `colaboradorId` ya garantizado no-nulo. */
  readonly children: (colaboradorId: string) => ReactNode
}

/**
 * Triple estado de un bloque evaluable, compartido por QUIZ / CODIGO_PREGUNTAS
 * / SQL_EJERCICIO:
 *  - curso cerrado → resultado del mejor intento en lectura.
 *  - preview o sin colaborador → cartel de "inscríbete".
 *  - activo → el bloque real envuelto en su indicador de intento.
 */
function EnvolturaEvaluable({
  bloqueId,
  colaboradorId,
  modo,
  soloLectura,
  marca,
  notaMinima,
  children,
}: EnvolturaEvaluableProps) {
  if (soloLectura) {
    return (
      <BloqueEvaluableCerrado
        bloqueId={bloqueId}
        colaboradorId={colaboradorId}
        marca={marca}
        notaMinima={notaMinima}
      />
    )
  }
  if (modo === "preview" || !colaboradorId) {
    return <BloqueEvaluablePreviewLock marca={marca} />
  }
  return (
    <EvaluableConIndicador
      bloqueId={bloqueId}
      colaboradorId={colaboradorId}
      notaMinima={notaMinima}
    >
      {children(colaboradorId)}
    </EvaluableConIndicador>
  )
}

function notaMinimaQuiz(contenido: Record<string, unknown> | null): number {
  const parsed = contenidoQuizSchema.safeParse(contenido)
  if (parsed.success) {
    return parsed.data.notaMinima
  }
  return 60
}
