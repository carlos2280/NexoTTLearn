import {
  NxtButton,
  NxtCheckbox,
  NxtInputField,
  NxtRadio,
  NxtRadioGroup,
  NxtSelect,
  NxtSelectOption,
  NxtSwitch,
  NxtText,
} from "@carlos2280/nexott-ui/react"
import type { OpcionTest, PreguntaTest, TipoPreguntaTest } from "@nexott-learn/shared-types"
import { useState } from "react"
import { type TestPayload, jsonEquals, parseTestPayload } from "./bloque-payloads"
import { BloqueSaveStatus } from "./bloque-save-status"
import { useBloqueAutoSave } from "./use-bloque-autosave"

interface BloqueTestProps {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
  readonly contenidoId: string
  readonly contenidoRaw: unknown
}

const OPCIONES_VERDADERO_FALSO: readonly OpcionTest[] = [
  { texto: "Verdadero", esCorrecta: false },
  { texto: "Falso", esCorrecta: false },
]

function tipoLegible(tipo: TipoPreguntaTest): string {
  switch (tipo) {
    case "seleccion_unica":
      return "Seleccion unica"
    case "seleccion_multiple":
      return "Seleccion multiple"
    case "verdadero_falso":
      return "Verdadero / falso"
    default:
      return "Pregunta"
  }
}

function nuevaPreguntaPorDefecto(): PreguntaTest {
  return {
    enunciado: "",
    tipo: "seleccion_unica",
    opciones: [
      { texto: "", esCorrecta: false },
      { texto: "", esCorrecta: false },
    ],
  }
}

// Migracion non-destructive de opciones al cambiar el tipo de la pregunta.
// - verdadero_falso: si las opciones existentes son exactamente 2, conserva
//   sus textos y flags. Si no, sustituye por las dos canonicas.
// - seleccion_unica: deja a lo sumo 1 correcta (la primera marcada).
// - seleccion_multiple: deja las opciones tal cual.
function migrarOpcionesAlCambiarTipo(
  opcionesActuales: readonly OpcionTest[],
  tipoNuevo: TipoPreguntaTest,
): OpcionTest[] {
  if (tipoNuevo === "verdadero_falso") {
    if (opcionesActuales.length === 2) {
      return opcionesActuales.map((o) => ({ texto: o.texto, esCorrecta: o.esCorrecta }))
    }
    return OPCIONES_VERDADERO_FALSO.map((o) => ({ ...o }))
  }

  if (tipoNuevo === "seleccion_unica") {
    let yaMarcada = false
    return opcionesActuales.map((o) => {
      if (o.esCorrecta && !yaMarcada) {
        yaMarcada = true
        return { ...o }
      }
      return { ...o, esCorrecta: false }
    })
  }

  // seleccion_multiple: opciones tal cual
  return opcionesActuales.map((o) => ({ ...o }))
}

// Editor de bloque TEST. Stack vertical: configuracion (3 controles) +
// lista de preguntas siempre expandidas + boton agregar. Cada pregunta
// renderiza un sub-editor distinto segun su tipo. La logica de "una
// correcta vs muchas correctas" vive en JS (no en validacion del schema).
export function BloqueTest({
  cursoId,
  moduloId,
  seccionId,
  contenidoId,
  contenidoRaw,
}: BloqueTestProps) {
  const [initial] = useState<TestPayload>(() => parseTestPayload(contenidoRaw))
  const [draft, setDraft] = useState<TestPayload>(initial)

  const { state, flush } = useBloqueAutoSave<TestPayload>({
    cursoId,
    moduloId,
    seccionId,
    contenidoId,
    draft,
    initial,
    equals: jsonEquals,
  })

  const updatePregunta = (index: number, parcial: Partial<PreguntaTest>): void => {
    setDraft((prev) => ({
      ...prev,
      preguntas: prev.preguntas.map((p, i) => (i === index ? { ...p, ...parcial } : p)),
    }))
  }

  const removePregunta = (index: number): void => {
    setDraft((prev) => ({
      ...prev,
      preguntas: prev.preguntas.filter((_, i) => i !== index),
    }))
    flush()
  }

  const addPregunta = (): void => {
    setDraft((prev) => ({
      ...prev,
      preguntas: [...prev.preguntas, nuevaPreguntaPorDefecto()],
    }))
    flush()
  }

  const cambiarTipoPregunta = (index: number, tipoNuevo: TipoPreguntaTest): void => {
    setDraft((prev) => ({
      ...prev,
      preguntas: prev.preguntas.map((p, i) => {
        if (i !== index) {
          return p
        }
        if (p.tipo === tipoNuevo) {
          return p
        }
        return {
          ...p,
          tipo: tipoNuevo,
          opciones: migrarOpcionesAlCambiarTipo(p.opciones, tipoNuevo),
        }
      }),
    }))
    flush()
  }

  const updateOpciones = (index: number, opciones: OpcionTest[]): void => {
    setDraft((prev) => ({
      ...prev,
      preguntas: prev.preguntas.map((p, i) => (i === index ? { ...p, opciones } : p)),
    }))
  }

  return (
    <div className="bloque-test">
      <section className="bloque-test__section">
        <header className="bloque-test__section-header">
          <NxtText size="sm" weight="semibold">
            Configuracion
          </NxtText>
          <NxtText size="xs" tone="dim">
            Reglas globales del test que afectan a todas las preguntas.
          </NxtText>
        </header>

        <div className="bloque-test__config">
          <NxtSwitch
            label="Aleatorizar orden de preguntas"
            description="El alumno ve las preguntas en orden distinto cada intento."
            checked={draft.aleatorizar}
            onNxtSwitchChange={(event) => {
              setDraft((prev) => ({ ...prev, aleatorizar: event.detail.checked }))
              flush()
            }}
          />

          <NxtSwitch
            label="Mostrar resultado inmediato"
            description="Tras cada pregunta el alumno ve si acerto."
            checked={draft.mostrarResultadoInmediato}
            onNxtSwitchChange={(event) => {
              setDraft((prev) => ({ ...prev, mostrarResultadoInmediato: event.detail.checked }))
              flush()
            }}
          />

          <div className="bloque-test__config-intentos">
            <NxtInputField
              variant="filled"
              type="number"
              label="Intentos permitidos"
              helper="Numero de veces que el alumno puede repetir el test (minimo 1)."
              min={1}
              value={String(draft.intentosPermitidos)}
              onChange={(event) => {
                const parsed = Number(event.target.value)
                // Si el admin escribe 0, vacio o no-numero, descartamos el cambio.
                // El schema valida >=1 en el back y rechazaria un PATCH invalido.
                if (!Number.isFinite(parsed) || parsed < 1) {
                  return
                }
                setDraft((prev) => ({ ...prev, intentosPermitidos: Math.floor(parsed) }))
              }}
              onBlur={() => flush()}
            />
          </div>
        </div>
      </section>

      <section className="bloque-test__section">
        <header className="bloque-test__section-header">
          <NxtText size="sm" weight="semibold">
            Preguntas
          </NxtText>
          <NxtText size="xs" tone="dim">
            El admin puede mezclar los 3 tipos de pregunta en un mismo test.
          </NxtText>
        </header>

        {draft.preguntas.length === 0 ? (
          <div className="bloque-test__empty">
            <NxtText size="xs" tone="dim">
              Aun no has agregado preguntas.
            </NxtText>
          </div>
        ) : (
          <ul className="bloque-test__list">
            {draft.preguntas.map((pregunta, index) => (
              <PreguntaItem
                // biome-ignore lint/suspicious/noArrayIndexKey: orden = orden de insercion, sin DnD
                key={index}
                pregunta={pregunta}
                index={index}
                onUpdate={updatePregunta}
                onRemove={removePregunta}
                onCambiarTipo={cambiarTipoPregunta}
                onUpdateOpciones={updateOpciones}
                onFlush={flush}
              />
            ))}
          </ul>
        )}

        <div className="bloque-test__add">
          <NxtButton variant="ghost" size="sm" icon="plus" onNxtButtonClick={() => addPregunta()}>
            Agregar pregunta
          </NxtButton>
        </div>
      </section>

      <div className="bloque-test__status">
        <BloqueSaveStatus state={state} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Sub-componentes locales
// ─────────────────────────────────────────────────────────────────

interface PreguntaItemProps {
  readonly pregunta: PreguntaTest
  readonly index: number
  readonly onUpdate: (index: number, parcial: Partial<PreguntaTest>) => void
  readonly onRemove: (index: number) => void
  readonly onCambiarTipo: (index: number, tipoNuevo: TipoPreguntaTest) => void
  readonly onUpdateOpciones: (index: number, opciones: OpcionTest[]) => void
  readonly onFlush: () => void
}

function PreguntaItem({
  pregunta,
  index,
  onUpdate,
  onRemove,
  onCambiarTipo,
  onUpdateOpciones,
  onFlush,
}: PreguntaItemProps) {
  const resumenEnunciado = pregunta.enunciado.trim().slice(0, 80)

  return (
    <li className="bloque-test__item">
      <header className="bloque-test__item-header">
        <NxtText size="xs" tone="dim">
          {`Pregunta ${index + 1} — ${tipoLegible(pregunta.tipo)}`}
          {resumenEnunciado === "" ? "" : ` · ${resumenEnunciado}`}
        </NxtText>
      </header>

      <div className="bloque-test__item-row">
        <div className="bloque-test__item-tipo">
          <NxtSelect
            label="Tipo de pregunta"
            value={pregunta.tipo}
            onNxtSelectChange={(event) => {
              onCambiarTipo(index, event.detail.value as TipoPreguntaTest)
            }}
            onNxtSelectClose={() => onFlush()}
          >
            <NxtSelectOption value="seleccion_unica">Seleccion unica</NxtSelectOption>
            <NxtSelectOption value="seleccion_multiple">Seleccion multiple</NxtSelectOption>
            <NxtSelectOption value="verdadero_falso">Verdadero / falso</NxtSelectOption>
          </NxtSelect>
        </div>
      </div>

      <div className="bloque-test__field">
        <NxtInputField
          variant="filled"
          label="Enunciado"
          placeholder="Escribe la pregunta tal como la vera el alumno..."
          multiline={true}
          rows={2}
          value={pregunta.enunciado}
          onChange={(event) => onUpdate(index, { enunciado: event.target.value })}
          onBlur={() => onFlush()}
        />
      </div>

      <OpcionesEditor
        tipo={pregunta.tipo}
        opciones={pregunta.opciones}
        onChange={(next) => onUpdateOpciones(index, next)}
        onFlush={onFlush}
      />

      <div className="bloque-test__field">
        <NxtInputField
          variant="filled"
          label="Explicacion (opcional)"
          helper="Se muestra al alumno tras responder esta pregunta."
          placeholder="Ej: La opcion correcta es B porque..."
          multiline={true}
          rows={3}
          value={pregunta.explicacion ?? ""}
          onChange={(event) =>
            onUpdate(index, {
              explicacion: event.target.value === "" ? undefined : event.target.value,
            })
          }
          onBlur={() => onFlush()}
        />
      </div>

      <div className="bloque-test__item-actions">
        <NxtButton variant="ghost" size="sm" icon="trash" onNxtButtonClick={() => onRemove(index)}>
          Eliminar pregunta
        </NxtButton>
      </div>
    </li>
  )
}

interface OpcionesEditorProps {
  readonly tipo: TipoPreguntaTest
  readonly opciones: readonly OpcionTest[]
  readonly onChange: (next: OpcionTest[]) => void
  readonly onFlush: () => void
}

function OpcionesEditor({ tipo, opciones, onChange, onFlush }: OpcionesEditorProps) {
  if (tipo === "verdadero_falso") {
    return <OpcionesVerdaderoFalso opciones={opciones} onChange={onChange} onFlush={onFlush} />
  }
  if (tipo === "seleccion_unica") {
    return <OpcionesSeleccionUnica opciones={opciones} onChange={onChange} onFlush={onFlush} />
  }
  return <OpcionesSeleccionMultiple opciones={opciones} onChange={onChange} onFlush={onFlush} />
}

interface OpcionesSubEditorProps {
  readonly opciones: readonly OpcionTest[]
  readonly onChange: (next: OpcionTest[]) => void
  readonly onFlush: () => void
}

function OpcionesSeleccionUnica({ opciones, onChange, onFlush }: OpcionesSubEditorProps) {
  const indiceCorrecta = opciones.findIndex((o) => o.esCorrecta)
  const valueRadio = indiceCorrecta >= 0 ? String(indiceCorrecta) : ""

  const updateTexto = (idx: number, texto: string): void => {
    onChange(opciones.map((o, i) => (i === idx ? { ...o, texto } : o)))
  }

  const marcarCorrecta = (idx: number): void => {
    onChange(opciones.map((o, i) => ({ ...o, esCorrecta: i === idx })))
    onFlush()
  }

  const removeOpcion = (idx: number): void => {
    onChange(opciones.filter((_, i) => i !== idx))
    onFlush()
  }

  const addOpcion = (): void => {
    onChange([...opciones, { texto: "", esCorrecta: false }])
    onFlush()
  }

  return (
    <div className="bloque-test__opciones">
      <NxtText size="xs" tone="dim">
        Marca la unica opcion correcta.
      </NxtText>

      {opciones.length === 0 ? (
        <div className="bloque-test__empty">
          <NxtText size="xs" tone="dim">
            Sin opciones.
          </NxtText>
        </div>
      ) : (
        <NxtRadioGroup
          label=""
          value={valueRadio}
          onNxtRadioChange={(event) => {
            const idx = Number(event.detail.value)
            if (Number.isInteger(idx) && idx >= 0 && idx < opciones.length) {
              marcarCorrecta(idx)
            }
          }}
        >
          {opciones.map((_, idx) => (
            <NxtRadio
              // biome-ignore lint/suspicious/noArrayIndexKey: orden = orden de insercion, sin DnD
              key={idx}
              value={String(idx)}
              label={`Opcion ${idx + 1}`}
            />
          ))}
        </NxtRadioGroup>
      )}

      <ul className="bloque-test__opciones-list">
        {opciones.map((opcion, idx) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: orden = orden de insercion, sin DnD
            key={idx}
            className="bloque-test__opcion"
          >
            <div className="bloque-test__opcion-input">
              <NxtInputField
                variant="filled"
                label={`Texto opcion ${idx + 1}`}
                placeholder="Escribe el texto de la opcion..."
                value={opcion.texto}
                onChange={(event) => updateTexto(idx, event.target.value)}
                onBlur={() => onFlush()}
              />
            </div>
            <NxtButton
              variant="ghost"
              size="sm"
              icon="trash"
              onNxtButtonClick={() => removeOpcion(idx)}
            >
              Eliminar
            </NxtButton>
          </li>
        ))}
      </ul>

      <div className="bloque-test__add">
        <NxtButton variant="ghost" size="sm" icon="plus" onNxtButtonClick={() => addOpcion()}>
          Agregar opcion
        </NxtButton>
      </div>
    </div>
  )
}

function OpcionesSeleccionMultiple({ opciones, onChange, onFlush }: OpcionesSubEditorProps) {
  const updateTexto = (idx: number, texto: string): void => {
    onChange(opciones.map((o, i) => (i === idx ? { ...o, texto } : o)))
  }

  const toggleCorrecta = (idx: number, checked: boolean): void => {
    onChange(opciones.map((o, i) => (i === idx ? { ...o, esCorrecta: checked } : o)))
    onFlush()
  }

  const removeOpcion = (idx: number): void => {
    onChange(opciones.filter((_, i) => i !== idx))
    onFlush()
  }

  const addOpcion = (): void => {
    onChange([...opciones, { texto: "", esCorrecta: false }])
    onFlush()
  }

  return (
    <div className="bloque-test__opciones">
      <NxtText size="xs" tone="dim">
        Marca todas las opciones correctas (puede haber varias).
      </NxtText>

      {opciones.length === 0 ? (
        <div className="bloque-test__empty">
          <NxtText size="xs" tone="dim">
            Sin opciones.
          </NxtText>
        </div>
      ) : (
        <ul className="bloque-test__opciones-list">
          {opciones.map((opcion, idx) => (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: orden = orden de insercion, sin DnD
              key={idx}
              className="bloque-test__opcion"
            >
              <div className="bloque-test__opcion-correcta">
                <NxtCheckbox
                  label="Correcta"
                  checked={opcion.esCorrecta}
                  onNxtCheckboxChange={(event) => toggleCorrecta(idx, event.detail.checked)}
                />
              </div>
              <div className="bloque-test__opcion-input">
                <NxtInputField
                  variant="filled"
                  label={`Texto opcion ${idx + 1}`}
                  placeholder="Escribe el texto de la opcion..."
                  value={opcion.texto}
                  onChange={(event) => updateTexto(idx, event.target.value)}
                  onBlur={() => onFlush()}
                />
              </div>
              <NxtButton
                variant="ghost"
                size="sm"
                icon="trash"
                onNxtButtonClick={() => removeOpcion(idx)}
              >
                Eliminar
              </NxtButton>
            </li>
          ))}
        </ul>
      )}

      <div className="bloque-test__add">
        <NxtButton variant="ghost" size="sm" icon="plus" onNxtButtonClick={() => addOpcion()}>
          Agregar opcion
        </NxtButton>
      </div>
    </div>
  )
}

function OpcionesVerdaderoFalso({ opciones, onChange, onFlush }: OpcionesSubEditorProps) {
  const indiceCorrecta = opciones.findIndex((o) => o.esCorrecta)
  const valueRadio = indiceCorrecta >= 0 ? String(indiceCorrecta) : ""

  const marcarCorrecta = (idx: number): void => {
    onChange(opciones.map((o, i) => ({ ...o, esCorrecta: i === idx })))
    onFlush()
  }

  return (
    <div className="bloque-test__opciones">
      <NxtText size="xs" tone="dim">
        Marca cual de las dos respuestas es la correcta.
      </NxtText>

      <NxtRadioGroup
        label=""
        value={valueRadio}
        onNxtRadioChange={(event) => {
          const idx = Number(event.detail.value)
          if (Number.isInteger(idx) && idx >= 0 && idx < opciones.length) {
            marcarCorrecta(idx)
          }
        }}
      >
        {opciones.map((opcion, idx) => (
          <NxtRadio
            // biome-ignore lint/suspicious/noArrayIndexKey: opciones canonicas fijas (Verdadero/Falso)
            key={idx}
            value={String(idx)}
            label={opcion.texto}
          />
        ))}
      </NxtRadioGroup>
    </div>
  )
}
