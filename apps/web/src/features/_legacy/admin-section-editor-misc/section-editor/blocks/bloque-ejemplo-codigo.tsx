import { NxlCodeEditor, type NxlCodeEditorLanguage } from "@carlos2280/nexott-ui/learn/react"
import {
  NxtButton,
  NxtInputField,
  NxtSelect,
  NxtSelectOption,
  NxtSwitch,
  NxtText,
} from "@carlos2280/nexott-ui/react"
import type { PreguntaComprension } from "@nexott-learn/shared-types"
import { useState } from "react"
import { type EjemploCodigoPayload, jsonEquals, parseEjemploCodigoPayload } from "./bloque-payloads"
import { BloqueSaveStatus } from "./bloque-save-status"
import { useBloqueAutoSave } from "./use-bloque-autosave"

interface BloqueEjemploCodigoProps {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
  readonly contenidoId: string
  readonly contenidoRaw: unknown
}

const LENGUAJES_SOPORTADOS: readonly NxlCodeEditorLanguage[] = [
  "javascript",
  "typescript",
  "python",
]

// Si el back devuelve un lenguaje legacy fuera del set soportado por
// NxlCodeEditor, mostramos el editor con highlight de "javascript" pero
// CONSERVAMOS el valor original en el draft hasta que el admin lo cambie
// explicitamente desde el select. Asi no sobreescribimos en silencio.
function lenguajeParaEditor(lenguaje: string): NxlCodeEditorLanguage {
  return (LENGUAJES_SOPORTADOS as readonly string[]).includes(lenguaje)
    ? (lenguaje as NxlCodeEditorLanguage)
    : "javascript"
}

// Editor de bloque EJEMPLO_CODIGO. Layout 50/50 en desktop (explicacion +
// codigo lado a lado) y stack vertical en mobile. Debajo: toggle de modo
// interactivo y lista expandible de preguntas de comprension. F6.A solo
// edita y persiste — la ejecucion del codigo en runtime alumno vive en F14.
export function BloqueEjemploCodigo({
  cursoId,
  moduloId,
  seccionId,
  contenidoId,
  contenidoRaw,
}: BloqueEjemploCodigoProps) {
  const [initial] = useState<EjemploCodigoPayload>(() => parseEjemploCodigoPayload(contenidoRaw))
  const [draft, setDraft] = useState<EjemploCodigoPayload>(initial)

  const { state, flush } = useBloqueAutoSave<EjemploCodigoPayload>({
    cursoId,
    moduloId,
    seccionId,
    contenidoId,
    draft,
    initial,
    equals: jsonEquals,
  })

  const updatePregunta = (index: number, parcial: Partial<PreguntaComprension>): void => {
    setDraft((prev) => ({
      ...prev,
      preguntasComprension: prev.preguntasComprension.map((p, i) =>
        i === index ? { ...p, ...parcial } : p,
      ),
    }))
  }

  const removePregunta = (index: number): void => {
    setDraft((prev) => ({
      ...prev,
      preguntasComprension: prev.preguntasComprension.filter((_, i) => i !== index),
    }))
    // Eliminar es accion atomica: persistimos sin esperar a un blur.
    flush()
  }

  const addPregunta = (): void => {
    setDraft((prev) => ({
      ...prev,
      preguntasComprension: [...prev.preguntasComprension, { pregunta: "", respuestaEsperada: "" }],
    }))
    flush()
  }

  return (
    <div className="bloque-ejemplo-codigo">
      <div className="bloque-ejemplo-codigo__columns">
        <div className="bloque-ejemplo-codigo__col">
          <NxtInputField
            variant="filled"
            label="Explicacion"
            placeholder="Describe que muestra este ejemplo de codigo..."
            multiline={true}
            rows={6}
            value={draft.explicacion}
            onChange={(event) => setDraft((prev) => ({ ...prev, explicacion: event.target.value }))}
            onBlur={() => flush()}
          />
        </div>

        <div className="bloque-ejemplo-codigo__col">
          <div className="bloque-ejemplo-codigo__field">
            <NxtSelect
              label="Lenguaje"
              value={draft.lenguaje}
              onNxtSelectChange={(event) => {
                const nuevo = event.detail.value
                setDraft((prev) => ({ ...prev, lenguaje: nuevo }))
              }}
              onNxtSelectClose={() => flush()}
            >
              <NxtSelectOption value="javascript">JavaScript</NxtSelectOption>
              <NxtSelectOption value="typescript">TypeScript</NxtSelectOption>
              <NxtSelectOption value="python">Python</NxtSelectOption>
            </NxtSelect>
          </div>

          <div className="bloque-ejemplo-codigo__editor">
            <NxlCodeEditor
              value={draft.codigo}
              language={lenguajeParaEditor(draft.lenguaje)}
              minHeight="240px"
              maxHeight="480px"
              placeholder="Pega o escribe el codigo del ejemplo..."
              onNxlCodeChange={(event) =>
                setDraft((prev) => ({ ...prev, codigo: event.detail.value }))
              }
              onNxlCodeBlur={() => flush()}
            />
          </div>
        </div>
      </div>

      <div className="bloque-ejemplo-codigo__toggle">
        <NxtSwitch
          label="Permitir ejecucion en runtime alumno"
          description="Si esta activo, el alumno podra ejecutar el codigo desde el visor del curso (disponible en una version futura)."
          checked={draft.esInteractivo}
          onNxtSwitchChange={(event) => {
            setDraft((prev) => ({ ...prev, esInteractivo: event.detail.checked }))
            flush()
          }}
        />
      </div>

      <section className="bloque-ejemplo-codigo__preguntas">
        <header className="bloque-ejemplo-codigo__preguntas-header">
          <NxtText size="sm" weight="semibold">
            Preguntas de comprension
          </NxtText>
          <NxtText size="xs" tone="dim">
            Opcionales. Se mostraran al alumno tras el ejemplo para reforzar el aprendizaje.
          </NxtText>
        </header>

        {draft.preguntasComprension.length === 0 ? (
          <div className="bloque-ejemplo-codigo__preguntas-empty">
            <NxtText size="xs" tone="dim">
              Aun no has agregado preguntas.
            </NxtText>
          </div>
        ) : (
          <ul className="bloque-ejemplo-codigo__preguntas-list">
            {draft.preguntasComprension.map((pregunta, index) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: orden = orden de insercion, sin DnD en F6.A
                key={index}
                className="bloque-ejemplo-codigo__pregunta"
              >
                <div className="bloque-ejemplo-codigo__pregunta-fields">
                  <NxtInputField
                    variant="filled"
                    label={`Pregunta ${index + 1}`}
                    placeholder="¿Que hace la linea X?"
                    value={pregunta.pregunta}
                    onChange={(event) => updatePregunta(index, { pregunta: event.target.value })}
                    onBlur={() => flush()}
                  />
                  <NxtInputField
                    variant="filled"
                    label="Respuesta esperada"
                    placeholder="Resumen de la respuesta correcta..."
                    multiline={true}
                    rows={3}
                    value={pregunta.respuestaEsperada}
                    onChange={(event) =>
                      updatePregunta(index, { respuestaEsperada: event.target.value })
                    }
                    onBlur={() => flush()}
                  />
                </div>
                <div className="bloque-ejemplo-codigo__pregunta-actions">
                  <NxtButton
                    variant="ghost"
                    size="sm"
                    icon="trash"
                    onNxtButtonClick={() => removePregunta(index)}
                  >
                    Eliminar
                  </NxtButton>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="bloque-ejemplo-codigo__preguntas-add">
          <NxtButton variant="ghost" size="sm" icon="plus" onNxtButtonClick={() => addPregunta()}>
            Agregar pregunta
          </NxtButton>
        </div>
      </section>

      <div className="bloque-ejemplo-codigo__status">
        <BloqueSaveStatus state={state} />
      </div>
    </div>
  )
}
