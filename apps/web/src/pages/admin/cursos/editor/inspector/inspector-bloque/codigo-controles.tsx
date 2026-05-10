import { useActualizarBloque } from "@/features/admin-cursos/hooks/use-editor-curso"
import { InspectorRow } from "@/shared/ui/patterns/immersive/inspector"
import type {
  ActualizarBloqueAdminInput,
  BloqueDetalleAdmin,
  CodigoEvaluable,
  CodigoInteractivo,
  LenguajeCodigo,
} from "@nexott-learn/shared-types"

interface CodigoControlesProps {
  readonly bloque: BloqueDetalleAdmin
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
}

export function CodigoControles({ bloque, cursoId, moduloId, seccionId }: CodigoControlesProps) {
  const actualizar = useActualizarBloque(cursoId, moduloId, seccionId)
  const update = (patch: ActualizarBloqueAdminInput) =>
    actualizar.mutate({ bloqueId: bloque.id, input: patch })

  return (
    <>
      <InspectorRow label="Lenguaje">
        <select
          value={bloque.codigoLenguaje ?? "JAVASCRIPT"}
          onChange={(e) => update({ codigoLenguaje: e.target.value as LenguajeCodigo })}
          className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary"
        >
          <option value="JAVASCRIPT">JavaScript</option>
          <option value="TYPESCRIPT">TypeScript</option>
          <option value="REACT">React</option>
          <option value="PYTHON">Python</option>
        </select>
      </InspectorRow>
      <InspectorRow label="Interactivo">
        <select
          value={bloque.codigoInteractivo ?? "SOLO_VER"}
          onChange={(e) => update({ codigoInteractivo: e.target.value as CodigoInteractivo })}
          className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary"
        >
          <option value="SOLO_VER">Solo ver</option>
          <option value="EDITABLE">Editable</option>
        </select>
      </InspectorRow>
      <InspectorRow label="Evaluable">
        <select
          value={bloque.codigoEvaluable ?? "NINGUNO"}
          onChange={(e) => update({ codigoEvaluable: e.target.value as CodigoEvaluable })}
          className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary"
        >
          <option value="NINGUNO">Sin evaluación</option>
          <option value="PREGUNTAS">Preguntas</option>
          <option value="TESTS">Tests</option>
        </select>
      </InspectorRow>
    </>
  )
}
