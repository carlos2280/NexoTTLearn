import { NxlRichtextEditor } from "@carlos2280/nexott-ui/learn/react"
import { useState } from "react"
import { type LecturaPayload, parseLecturaPayload } from "./bloque-payloads"
import { BloqueSaveStatus } from "./bloque-save-status"
import { useBloqueAutoSave } from "./use-bloque-autosave"

interface BloqueLecturaProps {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
  readonly contenidoId: string
  readonly contenidoRaw: unknown
}

// Editor de bloque LECTURA. Hidrata su draft del payload `contenido` parseado
// y delega el WYSIWYG al primitivo NxlRichtextEditor (Tiptap shadow DOM).
// Auto-save debounced con flush en blur. El TIP block se inserta desde el
// menu contextual del propio Tiptap (no exponemos toolbar de "Insertar TIP"
// en F5.B; iteracion posterior — TODO).
export function BloqueLectura({
  cursoId,
  moduloId,
  seccionId,
  contenidoId,
  contenidoRaw,
}: BloqueLecturaProps) {
  const [initial] = useState<LecturaPayload>(() => parseLecturaPayload(contenidoRaw))
  const [draft, setDraft] = useState<LecturaPayload>(initial)

  const { state, flush } = useBloqueAutoSave<LecturaPayload>({
    cursoId,
    moduloId,
    seccionId,
    contenidoId,
    draft,
    initial,
    equals: (a, b) => a.cuerpo === b.cuerpo,
  })

  return (
    <div className="bloque-lectura">
      <NxlRichtextEditor
        value={draft.cuerpo}
        placeholder="Escribe el contenido de la lectura..."
        minHeight="200px"
        onNxlRichtextChange={(event) => setDraft({ cuerpo: event.detail.html })}
        onNxlRichtextBlur={() => flush()}
      />
      <div className="bloque-lectura__status">
        <BloqueSaveStatus state={state} />
      </div>
    </div>
  )
}
