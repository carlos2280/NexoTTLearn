import { useCoberturaAreas } from "@/features/reportes/hooks/use-cobertura-areas"
import { Card } from "@/shared/components/ui/card"
import { Select, SelectItem } from "@/shared/components/ui/select"
import { Skeleton } from "@/shared/components/ui/skeleton"
import type { CoberturaAreaItem } from "@nexott-learn/shared-types"
import { useMemo, useState } from "react"
import { KpisGlobales } from "./kpis-globales"
import { TarjetaArea } from "./tarjeta-area"
import { TopYListos } from "./top-y-listos"

type Orden = "peor" | "mejor" | "headcount" | "nombre"

interface OpcionOrden {
  readonly key: Orden
  readonly etiqueta: string
}

const OPCIONES_ORDEN: readonly OpcionOrden[] = [
  { key: "peor", etiqueta: "Peor brecha primero" },
  { key: "mejor", etiqueta: "Mejor cobertura primero" },
  { key: "headcount", etiqueta: "Más colaboradores primero" },
  { key: "nombre", etiqueta: "Alfabético" },
]

export function SeccionCoberturaAreas() {
  const query = useCoberturaAreas()
  const [orden, setOrden] = useState<Orden>("peor")
  const [incluirVacias, setIncluirVacias] = useState(false)

  const areasOrdenadas = useMemo(() => {
    if (!query.data) {
      return []
    }
    const filtradas = incluirVacias
      ? query.data.areas
      : query.data.areas.filter((a) => a.promedio !== null)
    return [...filtradas].sort((a, b) => comparar(a, b, orden))
  }, [query.data, orden, incluirVacias])

  const peorBrechaId = query.data?.kpis.areaPeorBrecha?.areaId ?? null
  const mejorCoberturaId = useMemo(() => {
    if (!query.data) {
      return null
    }
    const conPromedio = query.data.areas.filter((a) => a.promedio !== null)
    if (conPromedio.length === 0) {
      return null
    }
    return [...conPromedio].sort((a, b) => (b.promedio ?? 0) - (a.promedio ?? 0))[0]?.areaId ?? null
  }, [query.data])

  const totalAreas = query.data?.areas.length ?? 0
  const visibles = areasOrdenadas.length

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="nx-eyebrow text-aurora-violet">Cobertura · Talento NTT por área</span>
        <h2 className="text-h1 text-text-primary">
          ¿Dónde es fuerte y dónde duele<span className="text-aurora-violet">?</span>
        </h2>
        <p className="max-w-[640px] text-body-sm text-text-secondary">
          Lectura ejecutiva del talento agregado por capacidad. Sin curso, sin lista de personas: el
          estado real de NTT.
        </p>
      </header>

      <KpisGlobales kpis={query.data?.kpis} isLoading={query.isLoading} />

      <Card tono="plano" densidad="generosa" className="flex flex-col gap-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="nx-eyebrow text-text-tertiary">Capacidades</span>
            <p className="text-body-sm text-text-secondary">
              {visibles} de {totalAreas} áreas visibles
              {!incluirVacias && totalAreas > visibles ? " (sin datos ocultas)" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIncluirVacias((v) => !v)}
              className="cursor-pointer text-caption text-text-secondary hover:text-aurora-violet hover:underline"
            >
              {incluirVacias ? "Ocultar sin datos" : "Mostrar todas"}
            </button>
            <div className="w-[220px]">
              <Select
                value={orden}
                onValueChange={(v) => setOrden(v as Orden)}
                compact={true}
                aria-label="Ordenar áreas"
              >
                {OPCIONES_ORDEN.map((op) => (
                  <SelectItem key={op.key} value={op.key}>
                    {op.etiqueta}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>
        </header>

        {query.isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[180px] rounded-2xl" />
            ))}
          </div>
        ) : areasOrdenadas.length === 0 ? (
          <p className="rounded-2xl border border-border bg-subtle p-6 text-center text-body-sm text-text-secondary">
            Aún no hay áreas con datos. A medida que los colaboradores demuestren skills, este mapa
            cobrará vida.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {areasOrdenadas.map((area) => (
              <TarjetaArea
                key={area.areaId}
                area={area}
                esPeorBrecha={area.areaId === peorBrechaId}
                esMejorCobertura={area.areaId === mejorCoberturaId}
              />
            ))}
          </div>
        )}
      </Card>

      {query.data ? (
        <TopYListos
          top={query.data.top}
          necesitanApoyo={query.data.necesitanApoyo}
          listosParaPresentar={query.data.listosParaPresentar}
        />
      ) : null}
    </section>
  )
}

function comparar(a: CoberturaAreaItem, b: CoberturaAreaItem, orden: Orden): number {
  switch (orden) {
    case "peor": {
      // Sin datos al final; luego peor brecha (más negativa primero); empate por nombre
      if (a.brecha === null && b.brecha === null) {
        return a.nombre.localeCompare(b.nombre)
      }
      if (a.brecha === null) {
        return 1
      }
      if (b.brecha === null) {
        return -1
      }
      return a.brecha - b.brecha
    }
    case "mejor": {
      if (a.brecha === null) {
        return 1
      }
      if (b.brecha === null) {
        return -1
      }
      return b.brecha - a.brecha
    }
    case "headcount":
      return b.totalColaboradores - a.totalColaboradores
    default:
      return a.nombre.localeCompare(b.nombre)
  }
}
