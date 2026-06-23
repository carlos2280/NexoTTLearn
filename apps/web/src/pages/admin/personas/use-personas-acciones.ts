import type { RegenerarPasswordResponse } from "@/features/personas/api/auth-admin.api"
import type {
  AltaColaboradorResponse,
  CambiarRolResponse,
} from "@/features/personas/api/colaboradores.api"
import { useDesbloquear, useRegenerarPassword } from "@/features/personas/hooks/use-acciones-auth"
import { useCambiarRol, useCrearPersona } from "@/features/personas/hooks/use-mutaciones-personas"
import type { ColaboradorAdminResumen } from "@nexott-learn/shared-types"
import { rolOpuesto } from "./rol-opuesto"

export { rolOpuesto }

export interface PersonasMutaciones {
  readonly crear: ReturnType<typeof useCrearPersona>
  readonly regenerar: ReturnType<typeof useRegenerarPassword>
  readonly desbloquear: ReturnType<typeof useDesbloquear>
  readonly cambiarRol: ReturnType<typeof useCambiarRol>
}

export function usePersonasMutaciones(): PersonasMutaciones {
  return {
    crear: useCrearPersona(),
    regenerar: useRegenerarPassword(),
    desbloquear: useDesbloquear(),
    cambiarRol: useCambiarRol(),
  }
}

export interface CrearPersonaInput {
  readonly nombre: string
  readonly email: string
  readonly rol: "ADMIN" | "PARTICIPANTE"
  readonly habilitarMfa: boolean
}

export function crear(
  mut: PersonasMutaciones,
  input: CrearPersonaInput,
): Promise<AltaColaboradorResponse> {
  return mut.crear.mutateAsync(input)
}

export function regenerar(
  mut: PersonasMutaciones,
  persona: ColaboradorAdminResumen,
  motivo: string,
): Promise<RegenerarPasswordResponse | null> {
  if (!persona.usuario) {
    return Promise.resolve(null)
  }
  return mut.regenerar.mutateAsync({
    input: { usuarioId: persona.usuario.id },
    motivo,
  })
}

export function desbloquear(
  mut: PersonasMutaciones,
  persona: ColaboradorAdminResumen,
  motivo: string,
): Promise<void> {
  if (!persona.usuario) {
    return Promise.resolve()
  }
  return mut.desbloquear.mutateAsync({
    input: { usuarioId: persona.usuario.id },
    motivo,
  })
}

export function cambiarRol(
  mut: PersonasMutaciones,
  persona: ColaboradorAdminResumen,
  motivo: string,
): Promise<CambiarRolResponse | null> {
  if (!persona.usuario) {
    return Promise.resolve(null)
  }
  return mut.cambiarRol.mutateAsync({
    colaboradorId: persona.id,
    rol: rolOpuesto(persona.usuario.rol),
    motivo,
  })
}
