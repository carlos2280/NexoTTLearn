import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { BandaAprender } from "./components/banda-aprender"
import { BandaNovedades } from "./components/banda-novedades"
import { BandaPendientes } from "./components/banda-pendientes"
import { BandaSiguientePaso } from "./components/banda-siguiente-paso"
import { BandejaSkeleton } from "./components/bandeja-skeleton"
import { useBandejaDatos } from "./hooks/use-bandeja-datos"
import { useSaludo } from "./hooks/use-saludo"

export function BandejaPage() {
  const { data: usuario, isLoading: cargandoUsuario } = useUsuarioActual()
  const { saludo } = useSaludo()
  const {
    cargando,
    error,
    cursos,
    siguientePaso,
    novedades,
    totalNoLeidas,
    totalCursosVoluntariado,
  } = useBandejaDatos()

  if (cargandoUsuario || cargando) {
    return <BandejaSkeleton />
  }

  if (error) {
    return (
      <div className="rounded-md border border-danger/30 bg-danger-soft p-4 text-body-sm text-danger-on-soft">
        No pudimos cargar tu bandeja. Reintenta en un momento.
      </div>
    )
  }

  const nombre = usuario?.nombre ?? ""

  return (
    <div className="flex flex-col gap-8">
      <BandaSiguientePaso cursoSugerido={siguientePaso} nombreUsuario={nombre} saludo={saludo} />
      <BandaPendientes cursos={cursos} />
      {novedades ? (
        <BandaNovedades notificaciones={novedades.data} totalNoLeidas={totalNoLeidas} />
      ) : null}
      <BandaAprender totalCursosAbiertos={totalCursosVoluntariado} />
    </div>
  )
}
