import { useListarModulos } from "@/features/catalogo/hooks/use-listar-modulos"
import { useActualizarModulosHabilitadosCurso } from "@/features/cursos/hooks/use-mutaciones-config-curso"
import { Button } from "@/shared/components/ui/button"
import { SearchField } from "@/shared/components/ui/search-field"
import type { CursoDetalle, ModuloResponse } from "@nexott-learn/shared-types"
import { X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { AYUDAS_CONFIG_CURSO } from "./ayudas"
import { ConfigCard } from "./config-card"
import { SelectorPopover } from "./selector-popover"

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

function inicial(titulo: string): string {
  const trim = titulo.trim()
  if (trim.length === 0) {
    return "?"
  }
  return trim.charAt(0).toUpperCase()
}

export function ConfigModulosHabilitados({ curso, bloqueado }: ConfigModulosHabilitadosProps) {
  const mutacion = useActualizarModulosHabilitadosCurso()
  const modulosCatalogo = useListarModulos({ page: 1, pageSize: 100, estado: "ACTIVO" })
  const catalogo = useMemo(() => modulosCatalogo.data?.data ?? [], [modulosCatalogo.data])

  const idsIniciales = useMemo(
    () => curso.modulosHabilitados.map((m) => m.moduloId),
    [curso.modulosHabilitados],
  )
  const [seleccion, setSeleccion] = useState<readonly string[]>(idsIniciales)
  const [busqueda, setBusqueda] = useState("")

  useEffect(() => {
    setSeleccion(idsIniciales)
  }, [idsIniciales])

  const modificado = !mismosIds(seleccion, idsIniciales)

  const seleccionados = useMemo(
    () =>
      seleccion
        .map((id) => catalogo.find((m) => m.id === id))
        .filter((m): m is ModuloResponse => m !== undefined),
    [seleccion, catalogo],
  )

  const disponibles = useMemo(
    () => catalogo.filter((m) => !seleccion.includes(m.id)),
    [catalogo, seleccion],
  )

  const seleccionadosFiltrados = useMemo(() => {
    if (busqueda.trim().length === 0) {
      return seleccionados
    }
    const q = busqueda.trim().toLowerCase()
    return seleccionados.filter(
      (m) => m.titulo.toLowerCase().includes(q) || (m.descripcion ?? "").toLowerCase().includes(q),
    )
  }, [seleccionados, busqueda])

  function agregar(id: string) {
    setSeleccion((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }
  function quitar(id: string) {
    setSeleccion((prev) => prev.filter((p) => p !== id))
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
      id="config-modulos"
      titulo="Módulos habilitados"
      descripcion="Catálogo de módulos que este curso utiliza. Los archivados no se permiten."
      ayuda={AYUDAS_CONFIG_CURSO.modulos}
      acciones={
        <div className="flex items-center gap-2">
          {seleccionados.length > 0 ? (
            <>
              <SearchField
                valor={busqueda}
                onCambio={setBusqueda}
                placeholder="Filtrar módulos…"
                className="w-[220px]"
              />
              <span aria-hidden={true} className="h-6 w-px bg-border" />
            </>
          ) : null}
          <SelectorPopover<ModuloResponse>
            disponibles={disponibles}
            obtenerId={(m) => m.id}
            obtenerEtiqueta={(m) => m.titulo}
            renderItem={(m) => <ItemModuloPopover modulo={m} />}
            onSeleccionar={agregar}
            triggerLabel="Añadir módulos"
            buscable={true}
            placeholderBusqueda="Buscar módulo por nombre…"
            emptyMessage="No quedan módulos por añadir"
          />
        </div>
      }
      exigeMotivo={curso.estado !== "BORRADOR"}
      modificado={modificado}
      enviando={mutacion.isPending}
      deshabilitado={bloqueado}
      onGuardar={guardar}
      onCancelar={() => setSeleccion(idsIniciales)}
    >
      {seleccionados.length === 0 ? (
        <p className="text-body-sm text-text-tertiary">
          Aún no hay módulos habilitados. Añade módulos del catálogo.
        </p>
      ) : seleccionadosFiltrados.length === 0 ? (
        <p className="text-body-sm text-text-tertiary">
          Ningún módulo coincide con &ldquo;{busqueda}&rdquo;.
        </p>
      ) : (
        <div className="-m-1 max-h-[420px] overflow-y-auto p-1">
          <div className="flex flex-col gap-2">
            {seleccionadosFiltrados.map((m) => (
              <FilaModulo key={m.id} modulo={m} onEliminar={() => quitar(m.id)} />
            ))}
          </div>
        </div>
      )}
    </ConfigCard>
  )
}

interface FilaModuloProps {
  readonly modulo: ModuloResponse
  readonly onEliminar: () => void
}

function FilaModulo({ modulo, onEliminar }: FilaModuloProps) {
  return (
    <div className="group hover:-translate-y-px flex items-start gap-3 rounded-xl border border-border bg-surface p-3 shadow-xs transition-[transform,box-shadow] duration-base ease-default hover:shadow-sm">
      <div
        aria-hidden={true}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--color-aurora-violet-rgb)/0.08)] font-mono text-aurora-violet text-body-sm"
      >
        {inicial(modulo.titulo)}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-0.5">
        <span className="truncate font-medium text-body-sm text-text-primary">{modulo.titulo}</span>
        {modulo.descripcion ? (
          <span className="line-clamp-2 text-caption text-text-tertiary">{modulo.descripcion}</span>
        ) : null}
      </div>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={onEliminar}
        aria-label={`Quitar ${modulo.titulo}`}
      >
        <X className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
      </Button>
    </div>
  )
}

function ItemModuloPopover({ modulo }: { readonly modulo: ModuloResponse }) {
  return (
    <>
      <div
        aria-hidden={true}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[rgb(var(--color-aurora-violet-rgb)/0.08)] font-mono text-[10px] text-aurora-violet"
      >
        {inicial(modulo.titulo)}
      </div>
      <span className="flex-1 truncate text-text-primary">{modulo.titulo}</span>
    </>
  )
}
