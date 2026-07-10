import { Banner } from "@/shared/components/ui/banner"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import type { BloqueDetalleResponse } from "@nexott-learn/shared-types"
import { useRef, useState } from "react"
import { SeccionTestsDelReto } from "./codigo-preguntas/seccion-tests-del-reto"
import { CodeEditor } from "./shared/code-editor"
import { EditorBloqueShell } from "./shared/editor-bloque-shell"
import { SelectLenguaje } from "./shared/select-lenguaje"
import { TiptapEditor } from "./shared/tiptap-editor"
import { extensionesMinimas } from "./shared/tiptap-extensiones"
import { useAutoGuardarBloque } from "./shared/use-auto-guardar-bloque"

interface EditorCodigoPreguntasProps {
  readonly bloque: BloqueDetalleResponse
}

interface Borrador {
  readonly lenguaje: string
  readonly enunciado: string
  readonly esqueletoInicial: string
  readonly tiempoLimiteSeg: number
}

function leerInicial(contenido: Record<string, unknown> | null): Borrador {
  return {
    lenguaje: typeof contenido?.lenguaje === "string" ? contenido.lenguaje : "typescript",
    enunciado: typeof contenido?.enunciado === "string" ? contenido.enunciado : "",
    esqueletoInicial:
      typeof contenido?.esqueletoInicial === "string" ? contenido.esqueletoInicial : "",
    tiempoLimiteSeg:
      typeof contenido?.tiempoLimiteSeg === "number" ? contenido.tiempoLimiteSeg : 30,
  }
}

export function EditorCodigoPreguntas({ bloque }: EditorCodigoPreguntasProps) {
  const inicial = leerInicial(bloque.contenido)
  const [datos, setDatos] = useState<Borrador>(inicial)
  const datosRef = useRef<Borrador>(inicial)

  const auto = useAutoGuardarBloque({
    bloqueId: bloque.id,
    construirContenido: () => ({ ...datosRef.current }),
  })

  function actualizar(parcial: Partial<Borrador>) {
    setDatos((prev) => {
      const siguiente = { ...prev, ...parcial }
      datosRef.current = siguiente
      return siguiente
    })
    auto.marcarSucio()
  }

  return (
    <EditorBloqueShell
      bloque={bloque}
      titulo="Reto de código"
      descripcion="Define el problema, el código inicial y sus tests. El participante escribe código y el sandbox del navegador lo auto-corrige con tus pares stdin → salida esperada."
      estadoGuardado={auto.estado}
    >
      <Banner tone="info">
        Todo reto de código se evalúa automáticamente con sus tests (abajo). Si tu evaluación es
        conceptual (arquitectura, diseño, decisiones) modélala como <strong>Quiz</strong>; este tipo
        es solo para retos con tests stdin/stdout.
      </Banner>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Lenguaje">
          {(attrs) => (
            <SelectLenguaje
              id={attrs.id}
              value={datos.lenguaje}
              onChange={(v) => actualizar({ lenguaje: v })}
            />
          )}
        </Field>
        <Field label="Tiempo límite por test" hint="Entre 1 y 120 segundos.">
          {(attrs) => (
            <div className="flex items-center gap-2">
              <Input
                {...attrs}
                type="number"
                min={1}
                max={120}
                value={datos.tiempoLimiteSeg}
                onChange={(e) =>
                  actualizar({
                    tiempoLimiteSeg: Math.max(1, Math.min(120, Number(e.target.value) || 30)),
                  })
                }
              />
              <span className="tabular font-mono text-body-sm text-text-tertiary">segundos</span>
            </div>
          )}
        </Field>
      </div>

      <Field
        label="Enunciado"
        hint="Acepta formato: negrita, cursiva, listas, código inline y enlaces."
      >
        {(_attrs) => (
          <TiptapEditor
            key={bloque.id}
            htmlInicial={datos.enunciado}
            extensiones={extensionesMinimas("Implementa un método que reciba… y retorne…")}
            variante="minima"
            altoMin="160px"
            onCambio={(html) => actualizar({ enunciado: html })}
          />
        )}
      </Field>

      <Field
        label="Esqueleto inicial"
        hint="Lo que el participante ve al abrir. Usa Tab para indentar."
      >
        {(attrs) => (
          <CodeEditor
            id={attrs.id}
            value={datos.esqueletoInicial}
            onValueChange={(v) => actualizar({ esqueletoInicial: v })}
            lenguaje={datos.lenguaje}
            rows={8}
            placeholder="// Firma del método aquí…"
          />
        )}
      </Field>

      <SeccionTestsDelReto key={bloque.id} reto={bloque} />
    </EditorBloqueShell>
  )
}
