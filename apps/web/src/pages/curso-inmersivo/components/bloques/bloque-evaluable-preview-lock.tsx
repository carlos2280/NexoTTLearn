import { Lock } from "lucide-react"
import { CeldaBloque } from "../ide/celda-bloque"
import type { MarcaCelda } from "../ide/celda-evaluable"

interface BloqueEvaluablePreviewLockProps {
  readonly marca: MarcaCelda
}

/**
 * Placeholder sobrio que ocupa el lugar de un bloque evaluable (QUIZ o
 * CODIGO_PREGUNTAS) cuando el participante esta en modo `preview` (sin
 * asignacion). No revelamos el contenido evaluable — solo el cartelito de
 * "inscribete" que apela al deseo sin gritar.
 *
 * Se lee como una celda del archivo (`? quiz` / `> ejercicio`) con un candado
 * en la cabecera que comunica "bloqueado". Sin aurora (esto NO es momento de
 * marca).
 */
export function BloqueEvaluablePreviewLock({ marca }: BloqueEvaluablePreviewLockProps) {
  return (
    <CeldaBloque
      glifo={marca.glifo}
      etiqueta={marca.etiqueta}
      derecha={<Lock aria-hidden={true} className="h-3.5 w-3.5 text-text-tertiary" />}
      bodyClassName="py-4"
    >
      <p className="text-body-sm text-text-secondary">
        Inscríbete como voluntario para responder y guardar tu progreso.
      </p>
    </CeldaBloque>
  )
}
