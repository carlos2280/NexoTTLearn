import { useMisCursos } from "@/features/me/hooks/use-mis-cursos"
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
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-h2 text-text-primary">Mis cursos</h1>
        <p className="text-body text-text-secondary">
          Cursos asignados y voluntariados. Filtra por estado o rol para acotar la vista.
        </p>
      </header>
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
