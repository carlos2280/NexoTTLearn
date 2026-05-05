import { NxlCodeEditor, type NxlCodeEditorLanguage } from "@carlos2280/nexott-ui/learn/react"
import {
  NxtButton,
  NxtInputField,
  NxtRadio,
  NxtRadioGroup,
  NxtSelect,
  NxtSelectOption,
  NxtSwitch,
  NxtText,
} from "@carlos2280/nexott-ui/react"
import type {
  ArchivoInicial,
  LenguajeEjercicio,
  ModoEjercicio,
  TestEjercicio,
} from "@nexott-learn/shared-types"
import { useState } from "react"
import { type EjercicioPayload, jsonEquals, parseEjercicioPayload } from "./bloque-payloads"
import { BloqueSaveStatus } from "./bloque-save-status"
import { useBloqueAutoSave } from "./use-bloque-autosave"

interface BloqueEjercicioProps {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
  readonly contenidoId: string
  readonly contenidoRaw: unknown
}

// El enum del schema admite "react", pero NxlCodeEditor solo soporta nativo
// javascript/typescript/python. Mapeamos "react" -> "typescript" porque el
// parser TS de CodeMirror reconoce JSX/TSX. El draft.lenguaje SIEMPRE conserva
// el valor original ("react" incluido) — este helper solo decide el highlight.
function lenguajeParaEditor(lenguaje: LenguajeEjercicio): NxlCodeEditorLanguage {
  if (lenguaje === "react") {
    return "typescript"
  }
  return lenguaje
}

// Editor de bloque EJERCICIO. Modo guiado/reto con campos condicionales
// non-destructive: alternar modo NO borra los campos del modo opuesto, solo
// los oculta. El draft conserva todo lo que el admin haya escrito en ambos
// modos hasta que recargue. F6.B solo edita y persiste — la ejecucion del
// codigo en runtime alumno vive en F14.
export function BloqueEjercicio({
  cursoId,
  moduloId,
  seccionId,
  contenidoId,
  contenidoRaw,
}: BloqueEjercicioProps) {
  const [initial] = useState<EjercicioPayload>(() => parseEjercicioPayload(contenidoRaw))
  const [draft, setDraft] = useState<EjercicioPayload>(initial)

  const { state, flush } = useBloqueAutoSave<EjercicioPayload>({
    cursoId,
    moduloId,
    seccionId,
    contenidoId,
    draft,
    initial,
    equals: jsonEquals,
  })

  const lenguajeEditor = lenguajeParaEditor(draft.lenguaje)

  const updateArchivo = (index: number, parcial: Partial<ArchivoInicial>): void => {
    setDraft((prev) => ({
      ...prev,
      archivosIniciales: prev.archivosIniciales.map((a, i) =>
        i === index ? { ...a, ...parcial } : a,
      ),
    }))
  }

  const removeArchivo = (index: number): void => {
    setDraft((prev) => ({
      ...prev,
      archivosIniciales: prev.archivosIniciales.filter((_, i) => i !== index),
    }))
    flush()
  }

  const addArchivo = (): void => {
    setDraft((prev) => ({
      ...prev,
      archivosIniciales: [...prev.archivosIniciales, { path: "", content: "", readOnly: false }],
    }))
    flush()
  }

  const updateTest = (index: number, parcial: Partial<TestEjercicio>): void => {
    setDraft((prev) => ({
      ...prev,
      tests: prev.tests.map((t, i) => (i === index ? { ...t, ...parcial } : t)),
    }))
  }

  const removeTest = (index: number): void => {
    setDraft((prev) => ({
      ...prev,
      tests: prev.tests.filter((_, i) => i !== index),
    }))
    flush()
  }

  const addTest = (): void => {
    setDraft((prev) => ({
      ...prev,
      tests: [...prev.tests, { nombre: "", codigo: "" }],
    }))
    flush()
  }

  return (
    <div className="bloque-ejercicio">
      <header className="bloque-ejercicio__header">
        <NxtRadioGroup
          label="Modo del ejercicio"
          orientation="horizontal"
          value={draft.modo}
          onNxtRadioChange={(event) => {
            const nuevo = event.detail.value as ModoEjercicio
            setDraft((prev) => ({ ...prev, modo: nuevo }))
            flush()
          }}
        >
          <NxtRadio
            value="guiado"
            label="Modo guiado"
            description="Enunciado + solucion de referencia + pistas"
          />
          <NxtRadio
            value="reto"
            label="Modo reto"
            description="Contexto + objetivo + restricciones (sin solucion visible)"
          />
        </NxtRadioGroup>
      </header>

      <div className="bloque-ejercicio__field">
        <NxtSelect
          label="Lenguaje"
          value={draft.lenguaje}
          onNxtSelectChange={(event) => {
            const nuevo = event.detail.value as LenguajeEjercicio
            setDraft((prev) => ({ ...prev, lenguaje: nuevo }))
          }}
          onNxtSelectClose={() => flush()}
        >
          <NxtSelectOption value="javascript">JavaScript</NxtSelectOption>
          <NxtSelectOption value="typescript">TypeScript</NxtSelectOption>
          <NxtSelectOption value="python">Python</NxtSelectOption>
          <NxtSelectOption value="react">React (TSX)</NxtSelectOption>
        </NxtSelect>
      </div>

      <section className="bloque-ejercicio__section">
        <header className="bloque-ejercicio__section-header">
          <NxtText size="sm" weight="semibold">
            Archivos iniciales
          </NxtText>
          <NxtText size="xs" tone="dim">
            Opcional. Codigo base que el alumno encuentra al abrir el ejercicio.
          </NxtText>
        </header>

        {draft.archivosIniciales.length === 0 ? (
          <div className="bloque-ejercicio__empty">
            <NxtText size="xs" tone="dim">
              Sin archivos iniciales.
            </NxtText>
          </div>
        ) : (
          <ul className="bloque-ejercicio__list">
            {draft.archivosIniciales.map((archivo, index) => (
              <ArchivoInicialItem
                // biome-ignore lint/suspicious/noArrayIndexKey: orden = orden de insercion, sin DnD
                key={index}
                archivo={archivo}
                index={index}
                lenguajeEditor={lenguajeEditor}
                onUpdate={updateArchivo}
                onRemove={removeArchivo}
                onFlush={flush}
              />
            ))}
          </ul>
        )}

        <div className="bloque-ejercicio__add">
          <NxtButton variant="ghost" size="sm" icon="plus" onNxtButtonClick={() => addArchivo()}>
            Agregar archivo
          </NxtButton>
        </div>
      </section>

      <section className="bloque-ejercicio__section">
        <header className="bloque-ejercicio__section-header">
          <NxtText size="sm" weight="semibold">
            Tests
          </NxtText>
          <NxtText size="xs" tone="dim">
            Opcional. Validan automaticamente la solucion del alumno.
          </NxtText>
        </header>

        {draft.tests.length === 0 ? (
          <div className="bloque-ejercicio__empty">
            <NxtText size="xs" tone="dim">
              Sin tests definidos.
            </NxtText>
          </div>
        ) : (
          <ul className="bloque-ejercicio__list">
            {draft.tests.map((test, index) => (
              <TestItem
                // biome-ignore lint/suspicious/noArrayIndexKey: orden = orden de insercion, sin DnD
                key={index}
                test={test}
                index={index}
                lenguajeEditor={lenguajeEditor}
                onUpdate={updateTest}
                onRemove={removeTest}
                onFlush={flush}
              />
            ))}
          </ul>
        )}

        <div className="bloque-ejercicio__add">
          <NxtButton variant="ghost" size="sm" icon="plus" onNxtButtonClick={() => addTest()}>
            Agregar test
          </NxtButton>
        </div>
      </section>

      <StringListEditor
        label="Criterios de evaluacion"
        helper="Que se evalua al revisar la solucion (visibles en ambos modos)."
        items={draft.criteriosEvaluacion}
        placeholder="Ej: pasa todos los tests, codigo legible, sin globals..."
        onChange={(next) => setDraft((prev) => ({ ...prev, criteriosEvaluacion: next }))}
        onFlush={flush}
      />

      {draft.modo === "guiado" ? (
        <div className="bloque-ejercicio__modo-fields">
          <div className="bloque-ejercicio__field">
            <NxtInputField
              variant="filled"
              label="Enunciado"
              placeholder="Describe lo que el alumno debe implementar..."
              multiline={true}
              rows={5}
              value={draft.enunciado ?? ""}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  enunciado: event.target.value === "" ? undefined : event.target.value,
                }))
              }
              onBlur={() => flush()}
            />
          </div>

          <div className="bloque-ejercicio__field">
            <NxtText size="sm" weight="semibold">
              Solucion de referencia
            </NxtText>
            <NxtText size="xs" tone="dim">
              Solo visible para el equipo docente.
            </NxtText>
            <div className="bloque-ejercicio__editor">
              <NxlCodeEditor
                value={draft.solucionReferencia ?? ""}
                language={lenguajeEditor}
                minHeight="200px"
                maxHeight="420px"
                placeholder="Escribe aqui la solucion modelo..."
                onNxlCodeChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    solucionReferencia: event.detail.value === "" ? undefined : event.detail.value,
                  }))
                }
                onNxlCodeBlur={() => flush()}
              />
            </div>
          </div>

          <StringListEditor
            label="Pistas"
            helper="Aparecen progresivamente al alumno cuando lo solicita."
            items={draft.pistas}
            placeholder="Ej: revisa el tipo de retorno..."
            onChange={(next) => setDraft((prev) => ({ ...prev, pistas: next }))}
            onFlush={flush}
          />
        </div>
      ) : (
        <div className="bloque-ejercicio__modo-fields">
          <div className="bloque-ejercicio__field">
            <NxtInputField
              variant="filled"
              label="Contexto"
              placeholder="Situacion o problema a resolver..."
              multiline={true}
              rows={5}
              value={draft.contexto ?? ""}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  contexto: event.target.value === "" ? undefined : event.target.value,
                }))
              }
              onBlur={() => flush()}
            />
          </div>

          <div className="bloque-ejercicio__field">
            <NxtInputField
              variant="filled"
              label="Objetivo"
              placeholder="Que debe lograr el alumno al terminar..."
              multiline={true}
              rows={5}
              value={draft.objetivo ?? ""}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  objetivo: event.target.value === "" ? undefined : event.target.value,
                }))
              }
              onBlur={() => flush()}
            />
          </div>

          <StringListEditor
            label="Restricciones"
            helper="Reglas que el alumno debe respetar (ej: no usar X libreria)."
            items={draft.restricciones}
            placeholder="Ej: no usar fetch, sin librerias externas..."
            onChange={(next) => setDraft((prev) => ({ ...prev, restricciones: next }))}
            onFlush={flush}
          />
        </div>
      )}

      <div className="bloque-ejercicio__status">
        <BloqueSaveStatus state={state} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Sub-componentes locales
// ─────────────────────────────────────────────────────────────────

interface ArchivoInicialItemProps {
  readonly archivo: ArchivoInicial
  readonly index: number
  readonly lenguajeEditor: NxlCodeEditorLanguage
  readonly onUpdate: (index: number, parcial: Partial<ArchivoInicial>) => void
  readonly onRemove: (index: number) => void
  readonly onFlush: () => void
}

function ArchivoInicialItem({
  archivo,
  index,
  lenguajeEditor,
  onUpdate,
  onRemove,
  onFlush,
}: ArchivoInicialItemProps) {
  return (
    <li className="bloque-ejercicio__item">
      <div className="bloque-ejercicio__item-row">
        <div className="bloque-ejercicio__item-path">
          <NxtInputField
            variant="filled"
            label={`Archivo ${index + 1} — path`}
            placeholder="src/index.ts, main.py..."
            value={archivo.path}
            onChange={(event) => onUpdate(index, { path: event.target.value })}
            onBlur={() => onFlush()}
          />
        </div>
        <div className="bloque-ejercicio__item-readonly">
          <NxtSwitch
            label="Solo lectura"
            description="El alumno puede ver pero no modificar."
            checked={archivo.readOnly}
            onNxtSwitchChange={(event) => {
              onUpdate(index, { readOnly: event.detail.checked })
              onFlush()
            }}
          />
        </div>
      </div>

      <div className="bloque-ejercicio__editor">
        <NxlCodeEditor
          value={archivo.content}
          language={lenguajeEditor}
          minHeight="180px"
          maxHeight="360px"
          placeholder="Contenido inicial del archivo..."
          onNxlCodeChange={(event) => onUpdate(index, { content: event.detail.value })}
          onNxlCodeBlur={() => onFlush()}
        />
      </div>

      <div className="bloque-ejercicio__item-actions">
        <NxtButton variant="ghost" size="sm" icon="trash" onNxtButtonClick={() => onRemove(index)}>
          Eliminar archivo
        </NxtButton>
      </div>
    </li>
  )
}

interface TestItemProps {
  readonly test: TestEjercicio
  readonly index: number
  readonly lenguajeEditor: NxlCodeEditorLanguage
  readonly onUpdate: (index: number, parcial: Partial<TestEjercicio>) => void
  readonly onRemove: (index: number) => void
  readonly onFlush: () => void
}

function TestItem({ test, index, lenguajeEditor, onUpdate, onRemove, onFlush }: TestItemProps) {
  return (
    <li className="bloque-ejercicio__item">
      <div className="bloque-ejercicio__field">
        <NxtInputField
          variant="filled"
          label={`Test ${index + 1} — nombre`}
          placeholder="Ej: 'devuelve la suma correcta'"
          value={test.nombre}
          onChange={(event) => onUpdate(index, { nombre: event.target.value })}
          onBlur={() => onFlush()}
        />
      </div>

      <div className="bloque-ejercicio__editor">
        <NxlCodeEditor
          value={test.codigo}
          language={lenguajeEditor}
          minHeight="160px"
          maxHeight="320px"
          placeholder="Codigo del test (ej: expect(sum(1,2)).toBe(3))..."
          onNxlCodeChange={(event) => onUpdate(index, { codigo: event.detail.value })}
          onNxlCodeBlur={() => onFlush()}
        />
      </div>

      <div className="bloque-ejercicio__item-actions">
        <NxtButton variant="ghost" size="sm" icon="trash" onNxtButtonClick={() => onRemove(index)}>
          Eliminar test
        </NxtButton>
      </div>
    </li>
  )
}

interface StringListEditorProps {
  readonly label: string
  readonly helper?: string
  readonly items: readonly string[]
  readonly placeholder: string
  readonly onChange: (next: string[]) => void
  readonly onFlush: () => void
}

// Editor reutilizable para listas de strings simples (pistas, restricciones,
// criteriosEvaluacion). No soporta DnD: el orden es el de insercion.
function StringListEditor({
  label,
  helper,
  items,
  placeholder,
  onChange,
  onFlush,
}: StringListEditorProps) {
  const updateItem = (index: number, value: string): void => {
    onChange(items.map((item, i) => (i === index ? value : item)))
  }

  const removeItem = (index: number): void => {
    onChange(items.filter((_, i) => i !== index))
    onFlush()
  }

  const addItem = (): void => {
    onChange([...items, ""])
    onFlush()
  }

  return (
    <section className="bloque-ejercicio__section">
      <header className="bloque-ejercicio__section-header">
        <NxtText size="sm" weight="semibold">
          {label}
        </NxtText>
        {helper === undefined ? null : (
          <NxtText size="xs" tone="dim">
            {helper}
          </NxtText>
        )}
      </header>

      {items.length === 0 ? (
        <div className="bloque-ejercicio__empty">
          <NxtText size="xs" tone="dim">
            Sin items.
          </NxtText>
        </div>
      ) : (
        <ul className="bloque-ejercicio__string-list">
          {items.map((item, index) => (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: orden = orden de insercion, sin DnD
              key={index}
              className="bloque-ejercicio__string-item"
            >
              <div className="bloque-ejercicio__string-input">
                <NxtInputField
                  variant="filled"
                  label={`${label} ${index + 1}`}
                  placeholder={placeholder}
                  value={item}
                  onChange={(event) => updateItem(index, event.target.value)}
                  onBlur={() => onFlush()}
                />
              </div>
              <NxtButton
                variant="ghost"
                size="sm"
                icon="trash"
                onNxtButtonClick={() => removeItem(index)}
              >
                Eliminar
              </NxtButton>
            </li>
          ))}
        </ul>
      )}

      <div className="bloque-ejercicio__add">
        <NxtButton variant="ghost" size="sm" icon="plus" onNxtButtonClick={() => addItem()}>
          Agregar
        </NxtButton>
      </div>
    </section>
  )
}
