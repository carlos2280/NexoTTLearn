import { useListarModulos } from "@/features/catalogo/hooks/use-listar-modulos"
import { useActualizarModulosHabilitadosCurso } from "@/features/cursos/hooks/use-mutaciones-config-curso"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { Library } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { ConfigCard } from "./config-card"

interface ConfigModulosHabilitadosProps {
  readonly curso: CursoDetalle
  readonly bloqueado: boolean
}

function mismosIds(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) {
    return false
  }
  const setA = new Set(a)
  return b.every((id) => setA.has(id))
}

export function ConfigModulosHabilitados({ curso, bloqueado }: ConfigModulosHabilitadosProps) {
  const mutacion = useActualizarModulosHabilitadosCurso()
  const modulosCatalogo = useListarModulos({ page: 1, pageSize: 200, estado: "ACTIVO" })
  const catalogo = useMemo(() => modulosCatalogo.data?.data ?? [], [modulosCatalogo.data])

  const idsIniciales = useMemo(
    () => curso.modulosHabilitados.map((m) => m.moduloId),
    [curso.modulosHabilitados],
  )
  const [seleccion, setSeleccion] = useState<readonly string[]>(idsIniciales)

  useEffect(() => {
    setSeleccion(idsIniciales)
  }, [idsIniciales])

  const modificado = !mismosIds(seleccion, idsIniciales)

  function toggle(id: string) {
    setSeleccion((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  async function guardar(motivo: string | undefined) {
    await mutacion.mutateAsync({
      cursoId: curso.id,
      input: { moduloIds: [...seleccion] },
      motivo,
    })
  }

  return (
    <ConfigCard
      titulo="Módulos habilitados"
      descripcion="Catálogo activo de módulos que este curso utiliza. Los archivados no se permiten."
      icono={Library}
      exigeMotivo={curso.estado !== "BORRADOR"}
      modificado={modificado}
      enviando={mutacion.isPending}
      deshabilitado={bloqueado}
      onGuardar={guardar}
    >
      <p className="text-caption text-text-tertiary">
        Seleccionados: {seleccion.length} / {catalogo.length}
      </p>
      <div className="grid max-h-[320px] grid-cols-1 gap-1 overflow-y-auto rounded-md border border-border p-2 sm:grid-cols-2">
        {catalogo.length === 0 ? (
          <p className="text-body-sm text-text-tertiary">No hay módulos activos en el catálogo.</p>
        ) : null}
        {catalogo.map((m) => {
          const marcado = seleccion.includes(m.id)
          return (
            <label
              key={m.id}
              className="flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 text-body-sm hover:bg-subtle"
            >
              <input
                type="checkbox"
                checked={marcado}
                onChange={() => toggle(m.id)}
                className="mt-1 h-4 w-4 rounded border-border-strong"
              />
              <span className="flex flex-col">
                <span className="text-text-primary">{m.titulo}</span>
                {m.descripcion ? (
                  <span className="text-caption text-text-tertiary">{m.descripcion}</span>
                ) : null}
              </span>
            </label>
          )
        })}
      </div>
    </ConfigCard>
  )
}
