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
  const { cargando, error, data } = useBandejaDatos()

  if (cargandoUsuario || cargando) {
    return <BandejaSkeleton />
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger-soft p-5 text-body-sm text-danger-on-soft">
        No pudimos cargar tu bandeja. Reintenta en un momento.
      </div>
    )
  }

  const nombre = usuario?.nombre ?? ""
  // El `siguienteAccion` ya cubre el caso EXPLORAR_VOLUNTARIADO de forma cumbre;
  // la BandaAprender se mantiene solo como acceso permanente al catálogo, y no
  // se duplica con la cumbre para evitar dos CTAs apuntando al mismo destino.
  const mostrarAprender = data.siguienteAccion?.tipo !== "EXPLORAR_VOLUNTARIADO"

  return (
    <div className="flex flex-col gap-10">
      <BandaSiguientePaso
        siguienteAccion={data.siguienteAccion}
        nombreUsuario={nombre}
        saludo={saludo}
      />
      <BandaPendientes pendientes={data.pendientes} />
      <BandaNovedades
        notificaciones={data.novedades}
        totalNoLeidas={data.contadores.notificacionesNoLeidas}
      />
      {mostrarAprender ? (
        <BandaAprender totalCursosAbiertos={data.contadores.cursosVoluntariadoAbiertos} />
      ) : null}
    </div>
  )
}
