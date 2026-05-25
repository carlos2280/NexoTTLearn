import { useObtenerCurso } from "@/features/cursos/hooks/use-obtener-curso"
import { RUTAS } from "@/shared/constants/rutas"
import { Link, useParams } from "react-router-dom"
import { AsignacionesVista } from "./components/asignaciones-vista"

export function AsignacionesPage() {
  const { cursoId } = useParams<{ cursoId: string }>()
  const cursoQuery = useObtenerCurso(cursoId)
  const tieneEntregaACliente = cursoQuery.data?.tieneEntregaACliente ?? true

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          to={RUTAS.admin.cursoDetalle(cursoId ?? "")}
          className="text-caption text-text-tertiary hover:text-text-primary"
        >
          ← Volver al curso
        </Link>
        <span className="nx-eyebrow text-text-tertiary">Asignaciones</span>
        <h1 className="text-h1 text-text-primary">
          {cursoQuery.data?.titulo ?? "Asignaciones del curso"}
        </h1>
        <p className="max-w-2xl text-body text-text-secondary">
          {tieneEntregaACliente
            ? "Gestiona el flujo de cada caso: convertir voluntarios, marcar listo, cerrar caso, reabrir o retirar."
            : "Gestiona el flujo de cada caso: convertir voluntarios, marcar listo, cerrar curso, reabrir o retirar."}
        </p>
      </header>

      <AsignacionesVista cursoId={cursoId ?? ""} tieneEntregaACliente={tieneEntregaACliente} />
    </div>
  )
}
