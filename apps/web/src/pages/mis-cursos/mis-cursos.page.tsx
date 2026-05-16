import { useMisCursos } from "@/features/me/hooks/use-mis-cursos"
import { PageHeader, PageHeaderStat } from "@/shared/components/ui/page-header"
import { FiltrosMisCursosForm } from "./components/filtros-mis-cursos"
import { ResultadoMisCursos } from "./components/resultado-mis-cursos"
import { useFiltrosMisCursos } from "./hooks/use-filtros-mis-cursos"
import { TAMANO_PAGINA } from "./mis-cursos.types"

export function MisCursosPage() {
  const { filtros, setEstado, setRol, setPage } = useFiltrosMisCursos()
  const query = useMisCursos({
    estado: filtros.estado,
    rol: filtros.rol,
    page: filtros.page,
    pageSize: TAMANO_PAGINA,
  })

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Mi formación"
        titulo="Mis cursos"
        descripcion="Cursos asignados y voluntariados. El estado y el avance se actualizan en tiempo real."
        stat={
          query.data ? (
            <PageHeaderStat valor={query.data.meta.total} etiqueta="cursos en total" />
          ) : undefined
        }
      />

      <FiltrosMisCursosForm filtros={filtros} onEstadoChange={setEstado} onRolChange={setRol} />

      <ResultadoMisCursos
        isLoading={query.isLoading}
        error={query.error}
        data={query.data}
        filtros={filtros}
        onCambiarPage={setPage}
      />
    </div>
  )
}
