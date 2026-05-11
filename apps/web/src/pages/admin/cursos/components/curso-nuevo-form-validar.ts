export interface ErroresCursoNuevo {
  readonly titulo?: string
  readonly clienteId?: string
  readonly fechaInicio?: string
  readonly fechaDeadline?: string
  readonly general?: string
}

export interface CursoNuevoForm {
  readonly titulo: string
  readonly clienteId: string
  readonly fechaInicio: string
  readonly fechaDeadline: string
}

export const MAX_TITULO_CURSO = 200

const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/u

export function validarCursoNuevo(form: CursoNuevoForm): ErroresCursoNuevo | null {
  const errores: Record<keyof ErroresCursoNuevo, string | undefined> = {
    titulo: undefined,
    clienteId: undefined,
    fechaInicio: undefined,
    fechaDeadline: undefined,
    general: undefined,
  }
  const titulo = form.titulo.trim()
  if (titulo.length === 0) {
    errores.titulo = "El título es obligatorio."
  } else if (titulo.length > MAX_TITULO_CURSO) {
    errores.titulo = `Máximo ${MAX_TITULO_CURSO} caracteres.`
  }
  if (!form.clienteId) {
    errores.clienteId = "Selecciona un cliente."
  }
  if (!REGEX_FECHA.test(form.fechaInicio)) {
    errores.fechaInicio = "Fecha de inicio obligatoria."
  }
  if (!REGEX_FECHA.test(form.fechaDeadline)) {
    errores.fechaDeadline = "Fecha de deadline obligatoria."
  }
  if (!(errores.fechaInicio || errores.fechaDeadline) && form.fechaInicio >= form.fechaDeadline) {
    errores.fechaDeadline = "La deadline debe ser posterior al inicio."
  }
  const haError = Object.values(errores).some((v) => v !== undefined)
  return haError ? errores : null
}
