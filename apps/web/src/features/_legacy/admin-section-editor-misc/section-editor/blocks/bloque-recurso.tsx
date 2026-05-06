import { NxtInputField, NxtSelect, NxtSelectOption, NxtText } from "@carlos2280/nexott-ui/react"
import type { TipoRecurso } from "@nexott-learn/shared-types"
import { useState } from "react"
import { type RecursoPayload, jsonEquals, parseRecursoPayload } from "./bloque-payloads"
import { BloqueSaveStatus } from "./bloque-save-status"
import { useBloqueAutoSave } from "./use-bloque-autosave"

interface BloqueRecursoProps {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
  readonly contenidoId: string
  readonly contenidoRaw: unknown
}

// Editor de bloque RECURSO. F5.B solo soporta tipoRecurso "link" — pdf y
// archivo se exponen en el select como "Proximamente" (disabled). Si el back
// devuelve un bloque con tipoRecurso pdf/archivo (legacy), mostramos vista
// read-only para no perder datos al re-guardar.
export function BloqueRecurso({
  cursoId,
  moduloId,
  seccionId,
  contenidoId,
  contenidoRaw,
}: BloqueRecursoProps) {
  const [initial] = useState<RecursoPayload>(() => parseRecursoPayload(contenidoRaw))
  const [draft, setDraft] = useState<RecursoPayload>(initial)

  const { state, flush } = useBloqueAutoSave<RecursoPayload>({
    cursoId,
    moduloId,
    seccionId,
    contenidoId,
    draft,
    initial,
    equals: jsonEquals,
  })

  if (initial.tipoRecurso !== "link") {
    return (
      <div className="bloque-recurso bloque-recurso--readonly">
        <NxtText size="sm" tone="dim">
          Este recurso es de tipo <strong>{initial.tipoRecurso.toUpperCase()}</strong> y requiere
          una version futura del editor (upload nativo). Puedes seguir editandolo en tipo "Link"
          cuando este disponible.
        </NxtText>
      </div>
    )
  }

  return (
    <div className="bloque-recurso">
      <div className="bloque-recurso__field">
        <NxtSelect
          label="Tipo de recurso"
          value={draft.tipoRecurso}
          onNxtSelectChange={(event) => {
            const nuevo = event.detail.value as TipoRecurso
            if (nuevo !== "link") {
              return
            }
            setDraft((prev) => ({ ...prev, tipoRecurso: nuevo }))
          }}
          onNxtSelectClose={() => flush()}
        >
          <NxtSelectOption value="link">Link</NxtSelectOption>
          <NxtSelectOption value="pdf" disabled={true}>
            PDF (proximamente)
          </NxtSelectOption>
          <NxtSelectOption value="archivo" disabled={true}>
            Archivo (proximamente)
          </NxtSelectOption>
        </NxtSelect>
      </div>

      <div className="bloque-recurso__field">
        <NxtInputField
          variant="filled"
          label="URL"
          placeholder="https://..."
          value={draft.url}
          onChange={(event) => setDraft((prev) => ({ ...prev, url: event.target.value }))}
          onBlur={() => flush()}
        />
      </div>

      <div className="bloque-recurso__field">
        <NxtInputField
          variant="filled"
          label="Descripcion"
          placeholder="Breve descripcion (opcional)"
          multiline={true}
          rows={2}
          value={draft.descripcion ?? ""}
          onChange={(event) =>
            setDraft((prev) => ({
              ...prev,
              descripcion: event.target.value === "" ? undefined : event.target.value,
            }))
          }
          onBlur={() => flush()}
        />
      </div>

      <BloqueRecursoPreview url={draft.url} />

      <div className="bloque-recurso__status">
        <BloqueSaveStatus state={state} />
      </div>
    </div>
  )
}

interface BloqueRecursoPreviewProps {
  readonly url: string
}

function BloqueRecursoPreview({ url }: BloqueRecursoPreviewProps) {
  const trimmed = url.trim()
  if (trimmed.length === 0) {
    return null
  }
  // No intentamos resolver titulo/og-tags: el admin las anotara en
  // descripcion. Mostramos la URL como link clickeable (target=_blank) en una
  // tarjeta sutil, suficiente para validar que el destino es el correcto.
  return (
    <a className="bloque-recurso__preview" href={trimmed} target="_blank" rel="noopener noreferrer">
      {trimmed}
    </a>
  )
}
