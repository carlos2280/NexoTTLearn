import { obtenerUsuarioActual } from "@/features/auth/api/me.api"
import { USUARIO_ACTUAL_KEY } from "@/features/auth/hooks/use-usuario-actual"
import type { LoginResponse, UsuarioSesion } from "@/features/auth/types"
import { RUTAS } from "@/shared/constants/rutas"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { MfaChallenge, PasoLogin } from "../login.types"

// Sincronizado con paso-bienvenida.tsx: la línea aurora dura 1.4s (delay) + 2.6s
// (animación) = 4s. Dejamos 500ms extra para que el usuario "respire" antes de navegar.
const DURACION_BIENVENIDA_MS = 4500
const MFA_CHALLENGE_TTL_MS = 5 * 60 * 1000

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

  const continuarConPerfil = useCallback(
    (data: UsuarioSesion): void => {
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
        const destino = data.rol === "ADMIN" ? RUTAS.admin.inicio : RUTAS.bandeja
        navigate(destino, { replace: true })
      }, DURACION_BIENVENIDA_MS)
    },
    [navigate, queryClient],
  )

  const continuarSegunFlags = useCallback(async (): Promise<void> => {
    const data = await obtenerUsuarioActual()
    continuarConPerfil(data)
  }, [continuarConPerfil])

  const onLoginExitoso = useCallback(
    async (resp: LoginResponse): Promise<void> => {
      if (resp.mfaRequired) {
        setMfaChallenge({
          id: resp.mfaChallengeId,
          expiraEn: new Date(Date.now() + MFA_CHALLENGE_TTL_MS),
        })
        setPaso("mfa")
        return
      }
      continuarConPerfil(resp.perfil)
    },
    [continuarConPerfil],
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
