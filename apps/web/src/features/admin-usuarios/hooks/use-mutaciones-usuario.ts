import type {
  ActivarMfaUsuarioInput,
  ActualizarUsuarioInput,
  BloquearUsuarioInput,
  CrearUsuarioInput,
  DesbloquearUsuarioInput,
  ResetMfaUsuarioInput,
  ResetPasswordResponse,
  ResetPasswordUsuarioInput,
  UsuarioAdmin,
  UsuarioConCredenciales,
} from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { actualizarUsuario } from "../api/actualizar-usuario.api"
import { bloquearUsuario, desbloquearUsuario } from "../api/bloquear-usuario.api"
import { crearUsuario } from "../api/crear-usuario.api"
import { activarMfaUsuario, resetMfaUsuario } from "../api/mfa-usuario.api"
import { resetPasswordUsuario } from "../api/reset-password-usuario.api"
import { ADMIN_USUARIOS_KEY } from "./use-usuarios"

interface ActualizarVars {
  readonly id: string
  readonly input: ActualizarUsuarioInput
}

interface AccionConMotivoVars<TInput> {
  readonly id: string
  readonly input: TInput
}

function useInvalidarUsuarios() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ADMIN_USUARIOS_KEY })
}

export function useCrearUsuario() {
  const invalidar = useInvalidarUsuarios()
  return useMutation<UsuarioConCredenciales, Error, CrearUsuarioInput>({
    mutationFn: crearUsuario,
    onSuccess: invalidar,
  })
}

export function useActualizarUsuario() {
  const invalidar = useInvalidarUsuarios()
  return useMutation<UsuarioAdmin, Error, ActualizarVars>({
    mutationFn: ({ id, input }) => actualizarUsuario(id, input),
    onSuccess: invalidar,
  })
}

export function useBloquearUsuario() {
  const invalidar = useInvalidarUsuarios()
  return useMutation<UsuarioAdmin, Error, AccionConMotivoVars<BloquearUsuarioInput>>({
    mutationFn: ({ id, input }) => bloquearUsuario(id, input),
    onSuccess: invalidar,
  })
}

export function useDesbloquearUsuario() {
  const invalidar = useInvalidarUsuarios()
  return useMutation<UsuarioAdmin, Error, AccionConMotivoVars<DesbloquearUsuarioInput>>({
    mutationFn: ({ id, input }) => desbloquearUsuario(id, input),
    onSuccess: invalidar,
  })
}

export function useResetPasswordUsuario() {
  const invalidar = useInvalidarUsuarios()
  return useMutation<ResetPasswordResponse, Error, AccionConMotivoVars<ResetPasswordUsuarioInput>>({
    mutationFn: ({ id, input }) => resetPasswordUsuario(id, input),
    onSuccess: invalidar,
  })
}

export function useActivarMfaUsuario() {
  const invalidar = useInvalidarUsuarios()
  return useMutation<UsuarioAdmin, Error, AccionConMotivoVars<ActivarMfaUsuarioInput>>({
    mutationFn: ({ id, input }) => activarMfaUsuario(id, input),
    onSuccess: invalidar,
  })
}

export function useResetMfaUsuario() {
  const invalidar = useInvalidarUsuarios()
  return useMutation<UsuarioAdmin, Error, AccionConMotivoVars<ResetMfaUsuarioInput>>({
    mutationFn: ({ id, input }) => resetMfaUsuario(id, input),
    onSuccess: invalidar,
  })
}
