import { Field } from "@/shared/components/ui/field"
import { Textarea } from "@/shared/components/ui/textarea"
import {
  type BloqueDetalleResponse,
  contenidoCodigoIlustrativoSchema,
} from "@nexott-learn/shared-types"
import { useRef, useState } from "react"
import { tipoBloqueMeta } from "../bloque-tipo-meta"
import { CodigoTextarea } from "./shared/codigo-textarea"
import { IndicadorGuardado } from "./shared/indicador-guardado"
import { SelectLenguaje } from "./shared/select-lenguaje"
import { useAutoGuardarBloque } from "./shared/use-auto-guardar-bloque"

interface EditorCodigoIlustrativoProps {
  readonly bloque: BloqueDetalleResponse
}

interface Borrador {
  readonly lenguaje: string
  readonly codigo: string
  readonly descripcion: string
}

/**
 * Hidrata el borrador desde `bloque.contenido`. Si el JSON no cumple el
 * contrato oficial (`contenidoCodigoIlustrativoSchema`) cae al estado
 * canonico (lenguaje typescript + codigo y descripcion vacios).
 */
function leerInicial(contenido: Record<string, unknown> | null): Borrador {
  const result = contenidoCodigoIlustrativoSchema.safeParse(contenido)
  if (result.success) {
    return result.data
  }
  return { lenguaje: "typescript", codigo: "", descripcion: "" }
}

export function EditorCodigoIlustrativo({ bloque }: EditorCodigoIlustrativoProps) {
  const meta = tipoBloqueMeta(bloque.tipo)
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
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="nx-eyebrow text-text-tertiary">Bloque · {meta.etiqueta}</span>
          <h2 className="text-h2 text-text-primary">Snippet ilustrativo</h2>
          <p className="max-w-xl text-body-sm text-text-secondary">
            Trozo de código sólo para ilustrar un concepto. No se evalúa: el participante lo lee y
            avanza.
          </p>
        </div>
        <IndicadorGuardado estado={auto.estado} />
      </header>

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
          <CodigoTextarea
            id={attrs.id}
            value={datos.codigo}
            onValueChange={(v) => actualizar({ codigo: v })}
            rows={12}
            placeholder="// Tu código de ejemplo aquí…"
          />
        )}
      </Field>

      <Field label="Descripción" hint="Opcional. Aparece debajo del snippet.">
        {(attrs) => (
          <Textarea
            {...attrs}
            rows={3}
            value={datos.descripcion}
            onChange={(e) => actualizar({ descripcion: e.target.value })}
            placeholder="Ej. Pipeline típico de Streams con filter + map + collect."
          />
        )}
      </Field>
    </div>
  )
}
