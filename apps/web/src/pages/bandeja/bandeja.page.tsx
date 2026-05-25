import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { BandaCursosActivos } from "./components/banda-cursos-activos"
import { BandaSiguientePaso } from "./components/banda-siguiente-paso"
import { BandaTuCamino } from "./components/banda-tu-camino"
import { BandejaSkeleton } from "./components/bandeja-skeleton"
import { useBandejaDatos } from "./hooks/use-bandeja-datos"
import { useSaludo } from "./hooks/use-saludo"

/**
 * Bandeja del participante (pantalla 01). Tres bloques en orden:
 *
 *  1. Siguiente paso — hero único, una sola jerarquía.
 *  2. Mis cursos activos — grilla con chip de urgencia integrado.
 *  3. Tu camino — widget cualitativo de la ficha.
 *
 * Las bandas viejas (novedades, pendientes, aprender) están eliminadas:
 *   - Novedades  → campanita del topbar.
 *   - Pendientes → fusionadas con cursos activos (tono del deadline).
 *   - Aprender   → link permanente en el sidebar al catálogo.
 */
export function BandejaPage() {
  const { data: usuario, isLoading: cargandoUsuario } = useUsuarioActual()
  const { saludo } = useSaludo()
  const { cargando, error, siguienteAccion, cursosActivos, fichaResumen } = useBandejaDatos()

  if (cargandoUsuario || cargando) {
    return <BandejaSkeleton />
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger-soft p-5 text-body-sm text-danger-on-soft">
        No pudimos cargar tu bandeja. Reintenta en un momento.
      </div>
    )
  }

  const nombre = usuario?.nombre ?? ""
  const primerCursoActivoId = cursosActivos[0]?.cursoId ?? null
  const cursoIdSiguiente =
    siguienteAccion && "cursoId" in siguienteAccion ? siguienteAccion.cursoId : null
  const cursoSiguiente = cursoIdSiguiente
    ? (cursosActivos.find((c) => c.cursoId === cursoIdSiguiente) ?? null)
    : null
  const contextoArea = cursoSiguiente
    ? {
        areaCodigo: cursoSiguiente.areaCodigo ?? null,
        areaNombre: cursoSiguiente.areaNombre ?? null,
      }
    : null

  return (
    <div className="flex flex-col gap-10">
      <BandaSiguientePaso
        siguienteAccion={siguienteAccion}
        nombreUsuario={nombre}
        saludo={saludo}
        contextoArea={contextoArea}
      />
      <BandaCursosActivos cursos={cursosActivos} />
      <BandaTuCamino resumen={fichaResumen} cursoActivoIdParaEmpezar={primerCursoActivoId} />
    </div>
  )
}
