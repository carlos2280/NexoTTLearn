import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { useMiFicha } from "@/features/me/hooks/use-mi-ficha"
import { Banner } from "@/shared/components/ui/banner"
import { FichaSkeleton } from "./components/ficha-skeleton"
import { HeroViaje } from "./components/hero-viaje"
import { LlevateTuFicha } from "./components/llevate-tu-ficha"
import { LoQueViene } from "./components/lo-que-viene"
import { TuHistorial } from "./components/tu-historial"
import { TuMapa } from "./components/tu-mapa"

/**
 * /mi-ficha — bitacora del viaje del colaborador dentro de NexoTT. Lectura
 * pura de arriba abajo, sin drawers ni expand intermedios. La narrativa va:
 * quien eres ahora (hero) → donde estas hoy (mapa) → como llegaste (timeline).
 * El detalle por skill vive en el historial cronologico, no en sub-vistas.
 */
export function MiFichaPage() {
  const { data, isLoading, error } = useMiFicha()
  const { data: usuario } = useUsuarioActual()

  return (
    <div className="flex flex-col gap-12">
      {data && usuario ? (
        <HeroViaje nombre={usuario.nombre} porArea={data.porArea} skills={data.skills} />
      ) : null}

      {isLoading ? <FichaSkeleton /> : null}

      {error ? (
        <Banner tone="danger">
          No pudimos cargar tu ficha. Reintenta en un momento o vuelve mas tarde.
        </Banner>
      ) : null}

      {data ? (
        <p className="text-body-sm text-text-secondary">
          <strong className="font-medium text-aurora-violet">
            Esta es tu carta de presentacion.
          </strong>{" "}
          Cualquier admin del cliente puede consultarla al evaluar tu perfil.
        </p>
      ) : null}

      {data ? <TuMapa porArea={data.porArea} /> : null}
      {data ? <LoQueViene /> : null}
      {data ? <TuHistorial /> : null}
      {data ? <LlevateTuFicha /> : null}
    </div>
  )
}
