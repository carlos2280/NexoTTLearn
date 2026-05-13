import { crearColaboradorSchema } from "@nexott-learn/shared-types"

export interface ErroresPersonaForm {
  nombre?: string
  email?: string
  general?: string
}

interface ValoresPersonaForm {
  readonly nombre: string
  readonly email: string
  readonly rol: "ADMIN" | "PARTICIPANTE"
  readonly habilitarMfa: boolean
}

export function validarPersonaForm(valores: ValoresPersonaForm): ErroresPersonaForm | null {
  const parsed = crearColaboradorSchema.safeParse({
    nombre: valores.nombre.trim(),
    email: valores.email.trim().toLowerCase(),
    rol: valores.rol,
    habilitarMfa: valores.habilitarMfa,
  })
  if (parsed.success) {
    return null
  }
  const errores: ErroresPersonaForm = {}
  for (const issue of parsed.error.issues) {
    const campo = issue.path[0]
    if (campo === "nombre") {
      errores.nombre = issue.message
    } else if (campo === "email") {
      errores.email = "Email inválido"
    }
  }
  if (Object.keys(errores).length === 0) {
    errores.general = "Datos inválidos. Revisa los campos."
  }
  return errores
}
