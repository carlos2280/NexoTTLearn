import { useListarAreas } from "@/features/catalogo/hooks/use-listar-areas"
import { useActualizarAreasCurso } from "@/features/cursos/hooks/use-mutaciones-config-curso"
import { Button } from "@/shared/components/ui/button"
import { SearchField } from "@/shared/components/ui/search-field"
import { slugArea } from "@/shared/lib/slug-area"
import type { AreaResponse, CursoAreaExigida, CursoDetalle } from "@nexott-learn/shared-types"
import { X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { AYUDAS_CONFIG_CURSO } from "./ayudas"
import { CampoNumero } from "./campo-numero"
import { ConfigCard } from "./config-card"
import { SelectorPopover } from "./selector-popover"

interface ConfigAreasExigidasProps {
  readonly curso: CursoDetalle
  readonly bloqueado: boolean
}

type FilaArea = CursoAreaExigida

function diferentes(a: readonly FilaArea[], b: readonly FilaArea[]): boolean {
  if (a.length !== b.length) {
    return true
  }
  return a.some((fa, i) => {
    const fb = b[i]
    return (
      !fb ||
      fa.areaId !== fb.areaId ||
      fa.peso !== fb.peso ||
      fa.puntajeObjetivo !== fb.puntajeObjetivo
    )
  })
}

export function ConfigAreasExigidas({ curso, bloqueado }: ConfigAreasExigidasProps) {
  const mutacion = useActualizarAreasCurso()
  const areasCatalogo = useListarAreas({ page: 1, pageSize: 100 })
  const catalogoAreas = useMemo(() => areasCatalogo.data?.data ?? [], [areasCatalogo.data])

  const [filas, setFilas] = useState<readonly FilaArea[]>(curso.areasExigidas)
  const [busqueda, setBusqueda] = useState("")

  useEffect(() => {
    setFilas(curso.areasExigidas)
  }, [curso.areasExigidas])

  const modificado = diferentes(filas, curso.areasExigidas)
  const sumaPesos = filas.reduce((acc, f) => acc + f.peso, 0)
  const sumaValida = Math.round(sumaPesos * 100) === 10000 && filas.length > 0
  const areasDisponibles = catalogoAreas.filter((a) => !filas.some((f) => f.areaId === a.id))

  const indicesFiltrados = useMemo(() => {
    if (busqueda.trim().length === 0) {
      return filas.map((_, i) => i)
    }
    const q = busqueda.trim().toLowerCase()
    return filas.reduce<number[]>((acc, f, i) => {
      const nombre = catalogoAreas.find((a) => a.id === f.areaId)?.nombre ?? f.areaId
      if (nombre.toLowerCase().includes(q)) {
        acc.push(i)
      }
      return acc
    }, [])
  }, [busqueda, filas, catalogoAreas])

  function agregar(areaId: string) {
    setFilas((prev) => [...prev, { areaId, peso: 0, puntajeObjetivo: 70 }])
  }
  function actualizar(i: number, fila: Partial<FilaArea>) {
    setFilas((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...fila } : f)))
  }
  function eliminar(i: number) {
    setFilas((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function guardar(motivo: string | undefined) {
    await mutacion.mutateAsync({
      cursoId: curso.id,
      input: { areas: filas as CursoAreaExigida[] },
      motivo,
    })
  }

  return (
    <ConfigCard
      id="config-areas"
      titulo="Áreas exigidas"
      descripcion="Áreas evaluadas por el curso. Los pesos deben sumar 100%."
      ayuda={AYUDAS_CONFIG_CURSO.areas}
      acciones={
        <div className="flex items-center gap-2">
          {filas.length > 0 ? (
            <>
              <SearchField
                valor={busqueda}
                onCambio={setBusqueda}
                placeholder="Filtrar áreas…"
                className="w-[220px]"
              />
              <span aria-hidden={true} className="h-6 w-px bg-border" />
            </>
          ) : null}
          <SelectorPopover<AreaResponse>
            disponibles={areasDisponibles}
            obtenerId={(a) => a.id}
            obtenerEtiqueta={(a) => a.nombre}
            renderItem={(a) => <ItemAreaPopover area={a} />}
            onSeleccionar={agregar}
            triggerLabel="Añadir área"
            emptyMessage="No quedan áreas por añadir"
          />
        </div>
      }
      exigeMotivo={curso.estado !== "BORRADOR"}
      modificado={modificado && sumaValida}
      enviando={mutacion.isPending}
      deshabilitado={bloqueado}
      onGuardar={guardar}
      onCancelar={() => setFilas(curso.areasExigidas)}
    >
      {filas.length === 0 ? (
        <p className="text-body-sm text-text-tertiary">
          Aún no hay áreas exigidas. Añade al menos una.
        </p>
      ) : indicesFiltrados.length === 0 ? (
        <p className="text-body-sm text-text-tertiary">
          Ninguna área coincide con &ldquo;{busqueda}&rdquo;.
        </p>
      ) : (
        <div className="-m-1 max-h-[420px] overflow-y-auto p-1">
          <div className="flex flex-col gap-2.5">
            {indicesFiltrados.map((i) => {
              const f = filas[i]
              if (!f) {
                return null
              }
              const area = catalogoAreas.find((a) => a.id === f.areaId)
              return (
                <FilaAreaItem
                  key={f.areaId}
                  area={area}
                  areaId={f.areaId}
                  peso={f.peso}
                  puntajeObjetivo={f.puntajeObjetivo}
                  onCambioPeso={(v) => actualizar(i, { peso: v })}
                  onCambioPuntaje={(v) => actualizar(i, { puntajeObjetivo: v })}
                  onEliminar={() => eliminar(i)}
                />
              )
            })}
          </div>
        </div>
      )}

      <BarraSumaPesos
        filas={filas}
        catalogoAreas={catalogoAreas}
        sumaPesos={sumaPesos}
        sumaValida={sumaValida}
      />
    </ConfigCard>
  )
}

interface FilaAreaItemProps {
  readonly area: AreaResponse | undefined
  readonly areaId: string
  readonly peso: number
  readonly puntajeObjetivo: number
  readonly onCambioPeso: (v: number) => void
  readonly onCambioPuntaje: (v: number) => void
  readonly onEliminar: () => void
}

function FilaAreaItem({
  area,
  areaId,
  peso,
  puntajeObjetivo,
  onCambioPeso,
  onCambioPuntaje,
  onEliminar,
}: FilaAreaItemProps) {
  const slug = slugArea(area?.nombre)
  return (
    <div
      className="group hover:-translate-y-px grid grid-cols-1 items-center gap-3 rounded-xl border border-border bg-surface p-3 shadow-xs transition-[transform,box-shadow] duration-base ease-default hover:shadow-sm sm:grid-cols-[1fr_120px_140px_32px]"
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `var(--shadow-glow-area-${slug})`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = ""
      }}
    >
      <div className="flex items-center gap-3">
        <div
          aria-hidden={true}
          className="h-10 w-2 shrink-0 rounded-pill"
          style={{
            background: `linear-gradient(180deg, var(--color-area-${slug}), rgb(var(--color-area-${slug}-rgb) / 0.6))`,
          }}
        />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-body-sm text-text-primary">{area?.nombre ?? areaId}</span>
          <span className="font-mono text-[10px] text-text-tertiary">area.{slug}</span>
        </div>
      </div>
      <CampoNumero label="Peso (%)" valor={peso} onCambio={onCambioPeso} />
      <CampoNumero
        label="Puntaje objetivo (%)"
        valor={puntajeObjetivo}
        onCambio={onCambioPuntaje}
      />
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={onEliminar}
        aria-label={`Eliminar ${area?.nombre ?? "área"}`}
      >
        <X className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
      </Button>
    </div>
  )
}

function ItemAreaPopover({ area }: { readonly area: AreaResponse }) {
  const slug = slugArea(area.nombre)
  return (
    <>
      <div
        aria-hidden={true}
        className="h-5 w-2 shrink-0 rounded-pill"
        style={{
          background: `linear-gradient(180deg, var(--color-area-${slug}), rgb(var(--color-area-${slug}-rgb) / 0.6))`,
        }}
      />
      <span className="flex-1 truncate text-text-primary">{area.nombre}</span>
      <span className="font-mono text-[10px] text-text-tertiary">{slug}</span>
    </>
  )
}

interface BarraSumaPesosProps {
  readonly filas: readonly FilaArea[]
  readonly catalogoAreas: readonly AreaResponse[]
  readonly sumaPesos: number
  readonly sumaValida: boolean
}

function BarraSumaPesos({ filas, catalogoAreas, sumaPesos, sumaValida }: BarraSumaPesosProps) {
  if (filas.length === 0) {
    return null
  }
  const total = sumaPesos > 0 ? sumaPesos : 100
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative h-1 w-full overflow-hidden rounded-pill bg-subtle">
        <div className="absolute inset-y-0 left-0 flex w-full">
          {filas.map((f) => {
            const area = catalogoAreas.find((a) => a.id === f.areaId)
            const slug = slugArea(area?.nombre)
            const widthPct = (f.peso / total) * 100
            return (
              <span
                key={f.areaId}
                style={{
                  width: `${widthPct}%`,
                  background: `var(--color-area-${slug})`,
                }}
              />
            )
          })}
        </div>
      </div>
      <p
        className={
          sumaValida ? "text-caption text-text-tertiary" : "text-caption text-danger-on-soft"
        }
      >
        Suma: <span className="tabular font-medium">{sumaPesos.toFixed(0)}%</span>{" "}
        {sumaValida ? "✓" : "· debe ser 100"}
      </p>
    </div>
  )
}
