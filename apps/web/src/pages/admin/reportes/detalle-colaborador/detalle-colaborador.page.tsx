import { useListarCursos } from "@/features/cursos/hooks/use-listar-cursos"
import { useAvanceCurso } from "@/features/reportes/hooks/use-avance-curso"
import { useDetalleColaborador } from "@/features/reportes/hooks/use-detalle-colaborador"
import { Banner } from "@/shared/components/ui/banner"
import { Card } from "@/shared/components/ui/card"
import type {
  AvanceCursoQuery,
  CursoResumen,
  DetalleColaboradorQuery,
  FilaAvanceCurso,
} from "@nexott-learn/shared-types"
import { useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { DetalleHeader } from "./components/detalle-header"
import { DetalleIdentidad } from "./components/detalle-identidad"
import { DetallePlan } from "./components/detalle-plan"
import { DetalleSkills } from "./components/detalle-skills"
import { DetalleToolbar } from "./components/detalle-toolbar"
import { DetalleUltimosIntentos } from "./components/detalle-ultimos-intentos"

function toCursoOpcion(c: CursoResumen): { readonly id: string; readonly titulo: string } {
  return { id: c.id, titulo: c.titulo }
}

function toColaboradorOpcion(f: FilaAvanceCurso): {
  readonly id: string
  readonly nombre: string
  readonly email: string
} {
  return { id: f.colaborador.id, nombre: f.colaborador.nombre, email: f.colaborador.email }
}

export function DetalleColaboradorPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const cursosQuery = useListarCursos({
    page: 1,
    pageSize: 50,
    sort: "createdAt",
    incluirArchivados: false,
  })
  const cursos = useMemo(
    () => (cursosQuery.data?.data ?? []).map(toCursoOpcion),
    [cursosQuery.data],
  )

  const cursoIdParam = searchParams.get("cursoId")
  const cursoId = cursoIdParam ?? cursos[0]?.id ?? ""

  const avanceQuery: AvanceCursoQuery | null = useMemo(() => {
    if (!cursoId) {
      return null
    }
    return { cursoId, vista: "ACTUAL", page: 1, pageSize: 100, format: "json" }
  }, [cursoId])
  const avance = useAvanceCurso(avanceQuery)

  const colaboradores = useMemo(() => {
    if (!avance.data) {
      return []
    }
    return (avance.data.data as readonly FilaAvanceCurso[]).map(toColaboradorOpcion)
  }, [avance.data])

  const colaboradorIdParam = searchParams.get("colaboradorId")
  const colaboradorId = colaboradorIdParam ?? colaboradores[0]?.id ?? ""

  // Auto-fix de URL: garantiza estado consistente cuando entras sin params
  // o cuando cambia el curso y el colaborador previo no pertenece al nuevo.
  useEffect(() => {
    const primer = cursos[0]
    if (!cursoIdParam && primer) {
      const next = new URLSearchParams(searchParams)
      next.set("cursoId", primer.id)
      setSearchParams(next, { replace: true })
    }
  }, [cursoIdParam, cursos, searchParams, setSearchParams])

  useEffect(() => {
    const primer = colaboradores[0]
    const sigueExistiendo = colaboradorIdParam
      ? colaboradores.some((c) => c.id === colaboradorIdParam)
      : false
    if (primer && !sigueExistiendo) {
      const next = new URLSearchParams(searchParams)
      next.set("colaboradorId", primer.id)
      setSearchParams(next, { replace: true })
    }
  }, [colaboradorIdParam, colaboradores, searchParams, setSearchParams])

  const detalleQuery: DetalleColaboradorQuery | null = useMemo(() => {
    if (!(cursoId && colaboradorId)) {
      return null
    }
    return { cursoId, colaboradorId, vista: "ACTUAL", format: "json" }
  }, [cursoId, colaboradorId])

  const { data, isLoading, error } = useDetalleColaborador(detalleQuery)

  const actualizarParam = (clave: string, valor: string) => {
    const next = new URLSearchParams(searchParams)
    next.set(clave, valor)
    if (clave === "cursoId") {
      next.delete("colaboradorId")
    }
    setSearchParams(next, { replace: true })
  }

  const sinCursos = !cursosQuery.isLoading && cursos.length === 0
  const colaboradorSeleccionado = colaboradores.find((c) => c.id === colaboradorId)

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-10">
      <DetalleHeader frescura={data?.meta.frescura} />

      <DetalleToolbar
        cursos={cursos}
        colaboradores={colaboradores}
        cursoId={cursoId}
        colaboradorId={colaboradorId}
        cargandoColaboradores={avance.isLoading}
        onCambiarCurso={(id) => actualizarParam("cursoId", id)}
        onCambiarColaborador={(id) => actualizarParam("colaboradorId", id)}
      />

      {sinCursos && (
        <Banner tone="info" title="Aún no hay cursos">
          Crea un curso desde el módulo de cursos para empezar a ver detalles de colaboradores.
        </Banner>
      )}

      {error && (
        <Banner tone="danger" title="No pudimos cargar el detalle">
          {error.message}
        </Banner>
      )}

      {!(sinCursos || error) &&
        (isLoading || avance.isLoading || cursosQuery.isLoading ? (
          <Skeleton />
        ) : data && colaboradorSeleccionado ? (
          <>
            <DetalleIdentidad
              nombre={colaboradorSeleccionado.nombre}
              email={colaboradorSeleccionado.email}
              asignacion={data.asignacion}
            />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <DetalleSkills fichaRelevante={data.fichaRelevante} />
              <DetallePlan plan={data.plan} />
            </div>
            <DetalleUltimosIntentos ultimos={data.ultimosIntentos} hayMas={data.hayMas} />
          </>
        ) : null)}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Card tono="plano" className="h-[180px] animate-pulse" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card tono="plano" className="h-[320px] animate-pulse" />
        <Card tono="plano" className="h-[320px] animate-pulse" />
      </div>
      <Card tono="plano" className="h-[260px] animate-pulse" />
    </div>
  )
}
