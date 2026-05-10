import { obtenerUsuarioActual } from "@/features/auth/api/me.api"
import { USUARIO_ACTUAL_KEY } from "@/features/auth/hooks/use-usuario-actual"
import type { LoginResponse, UsuarioSesion } from "@/features/auth/types"
import { RUTAS } from "@/shared/constants/rutas"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { MfaChallenge, PasoLogin } from "../login.types"

const DURACION_BIENVENIDA_MS = 2600

interface UseLoginFlowResult {
  readonly paso: PasoLogin
  readonly usuario: UsuarioSesion | null
  readonly mfaChallenge: MfaChallenge | null
  readonly onLoginExitoso: (resp: LoginResponse) => Promise<void>
  readonly onMfaExitoso: () => Promise<void>
  readonly onCambioPasswordExitoso: () => Promise<void>
  readonly onAvisoAceptado: () => Promise<void>
  readonly reiniciar: () => void
}

export function useLoginFlow(): UseLoginFlowResult {
  const [paso, setPaso] = useState<PasoLogin>("credenciales")
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallenge | null>(null)
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const continuarSegunFlags = useCallback(async (): Promise<void> => {
    const data: UsuarioSesion = await obtenerUsuarioActual()
    queryClient.setQueryData(USUARIO_ACTUAL_KEY, data)
    setUsuario(data)
    if (data.requiereCambioPassword) {
      setPaso("cambiar-password")
      return
    }
    if (data.requiereAceptarAvisoPrivacidad) {
      setPaso("aviso-privacidad")
      return
    }
    setPaso("bienvenida")
    window.setTimeout(() => {
      const destino = data.rol === "ADMIN" ? RUTAS.admin.bandeja : RUTAS.bandeja
      navigate(destino, { replace: true })
    }, DURACION_BIENVENIDA_MS)
  }, [navigate, queryClient])

  const onLoginExitoso = useCallback(
    async (resp: LoginResponse): Promise<void> => {
      if (resp.mfaRequired && resp.mfaChallengeId && resp.mfaChallengeExpiraEn) {
        setMfaChallenge({
          id: resp.mfaChallengeId,
          expiraEn: new Date(resp.mfaChallengeExpiraEn),
        })
        setPaso("mfa")
        return
      }
      await continuarSegunFlags()
    },
    [continuarSegunFlags],
  )

  const reiniciar = useCallback(() => {
    setMfaChallenge(null)
    setUsuario(null)
    setPaso("credenciales")
  }, [])

  return {
    paso,
    usuario,
    mfaChallenge,
    onLoginExitoso,
    onMfaExitoso: continuarSegunFlags,
    onCambioPasswordExitoso: continuarSegunFlags,
    onAvisoAceptado: continuarSegunFlags,
    reiniciar,
  }
}
