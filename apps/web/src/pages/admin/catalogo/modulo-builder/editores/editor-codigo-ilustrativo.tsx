import { Field } from "@/shared/components/ui/field"
import {
  type BloqueDetalleResponse,
  contenidoCodigoIlustrativoSchema,
} from "@nexott-learn/shared-types"
import { useRef, useState } from "react"
import { CodeEditor } from "./shared/code-editor"
import { EditorBloqueShell } from "./shared/editor-bloque-shell"
import { SelectLenguaje } from "./shared/select-lenguaje"
import { TiptapEditor } from "./shared/tiptap-editor"
import { extensionesMinimas } from "./shared/tiptap-extensiones"
import { useAutoGuardarBloque } from "./shared/use-auto-guardar-bloque"

interface EditorCodigoIlustrativoProps {
  readonly bloque: BloqueDetalleResponse
}

interface Borrador {
  readonly lenguaje: string
  readonly codigo: string
  readonly descripcion: string
}

function leerInicial(contenido: Record<string, unknown> | null): Borrador {
  const result = contenidoCodigoIlustrativoSchema.safeParse(contenido)
  if (result.success) {
    return result.data
  }
  return { lenguaje: "typescript", codigo: "", descripcion: "" }
}

export function EditorCodigoIlustrativo({ bloque }: EditorCodigoIlustrativoProps) {
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
      titulo="Snippet ilustrativo"
      descripcion="Trozo de código sólo para ilustrar un concepto. No se evalúa: el participante lo lee y avanza."
      estadoGuardado={auto.estado}
    >
      <Field label="Lenguaje" hint="Determina el resaltado al renderizar.">
        {(attrs) => (
          <SelectLenguaje
            id={attrs.id}
            value={datos.lenguaje}
            onChange={(v) => actualizar({ lenguaje: v })}
          />
        )}
      </Field>

      <Field label="Código">
        {(attrs) => (
          <CodeEditor
            id={attrs.id}
            value={datos.codigo}
            onValueChange={(v) => actualizar({ codigo: v })}
            lenguaje={datos.lenguaje}
            rows={12}
            placeholder="// Tu código de ejemplo aquí…"
          />
        )}
      </Field>

      <Field
        label="Descripción"
        hint="Opcional. Acepta negrita, cursiva, listas, código inline y enlaces."
      >
        {(_attrs) => (
          <TiptapEditor
            key={bloque.id}
            htmlInicial={datos.descripcion}
            extensiones={extensionesMinimas(
              "Ej. Pipeline típico de Streams con filter + map + collect.",
            )}
            variante="minima"
            altoMin="100px"
            onCambio={(html) => actualizar({ descripcion: html })}
          />
        )}
      </Field>
    </EditorBloqueShell>
  )
}
