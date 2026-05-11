import { useListarAreas } from "@/features/catalogo/hooks/use-listar-areas"
import { useActualizarAreasCurso } from "@/features/cursos/hooks/use-mutaciones-config-curso"
import { Button } from "@/shared/components/ui/button"
import { Select } from "@/shared/components/ui/select"
import type { CursoAreaExigida, CursoDetalle } from "@nexott-learn/shared-types"
import { Layers, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { CampoNumero } from "./campo-numero"
import { ConfigCard } from "./config-card"

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
  useEffect(() => {
    setFilas(curso.areasExigidas)
  }, [curso.areasExigidas])

  const modificado = diferentes(filas, curso.areasExigidas)
  const sumaPesos = filas.reduce((acc, f) => acc + f.peso, 0)
  const sumaValida = Math.round(sumaPesos * 100) === 10000 && filas.length > 0
  const areasDisponibles = catalogoAreas.filter((a) => !filas.some((f) => f.areaId === a.id))

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
      titulo="Áreas exigidas"
      descripcion="Áreas evaluadas por el curso. Los pesos deben sumar 100%."
      icono={Layers}
      exigeMotivo={curso.estado !== "BORRADOR"}
      modificado={modificado && sumaValida}
      enviando={mutacion.isPending}
      deshabilitado={bloqueado}
      onGuardar={guardar}
    >
      <div className="flex flex-col gap-3">
        {filas.length === 0 ? (
          <p className="text-body-sm text-text-tertiary">
            Aún no hay áreas exigidas. Añade al menos una.
          </p>
        ) : null}
        {filas.map((f, i) => (
          <div
            key={f.areaId}
            className="grid grid-cols-1 items-end gap-2 rounded-md border border-border p-3 sm:grid-cols-[1fr,140px,140px,40px]"
          >
            <div className="flex flex-col">
              <span className="text-caption text-text-tertiary uppercase">Área</span>
              <span className="text-body-sm text-text-primary">
                {catalogoAreas.find((a) => a.id === f.areaId)?.nombre ?? f.areaId}
              </span>
            </div>
            <CampoNumero
              label="Peso (%)"
              valor={f.peso}
              onCambio={(v) => actualizar(i, { peso: v })}
            />
            <CampoNumero
              label="Puntaje objetivo (%)"
              valor={f.puntajeObjetivo}
              onCambio={(v) => actualizar(i, { puntajeObjetivo: v })}
            />
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => eliminar(i)}
              aria-label="Eliminar área"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Select
          compact={true}
          value=""
          onChange={(e) => {
            if (e.target.value) {
              agregar(e.target.value)
              e.target.value = ""
            }
          }}
          disabled={areasDisponibles.length === 0}
          className="min-w-[260px]"
          aria-label="Añadir área exigida"
        >
          <option value="">+ Añadir área…</option>
          {areasDisponibles.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </Select>
        <span
          className={
            sumaValida ? "text-caption text-text-tertiary" : "text-caption text-danger-on-soft"
          }
        >
          Suma: {sumaPesos.toFixed(2)}% {sumaValida ? "✓" : "(debe ser 100)"}
        </span>
      </div>
    </ConfigCard>
  )
}
