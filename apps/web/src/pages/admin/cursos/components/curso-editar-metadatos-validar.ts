import type { ActualizarCursoInput, CursoDetalle } from "@nexott-learn/shared-types"

export interface FormMetadatos {
  readonly titulo: string
  readonly clienteId: string
  readonly fechaInicio: string
  readonly fechaDeadline: string
}

export function metadatosDesdeDetalle(curso: CursoDetalle): FormMetadatos {
  return {
    titulo: curso.titulo,
    clienteId: curso.clienteId,
    fechaInicio: curso.fechaInicio.slice(0, 10),
    fechaDeadline: curso.fechaDeadline.slice(0, 10),
  }
}

export function calcularCambiosMetadatos(
  curso: CursoDetalle,
  form: FormMetadatos,
): ActualizarCursoInput | null {
  const cambios: Record<string, unknown> = {}
  if (form.titulo.trim() !== curso.titulo) {
    cambios.titulo = form.titulo.trim()
  }
  if (form.clienteId !== curso.clienteId) {
    cambios.clienteId = form.clienteId
  }
  if (form.fechaInicio !== curso.fechaInicio.slice(0, 10)) {
    cambios.fechaInicio = form.fechaInicio
  }
  if (form.fechaDeadline !== curso.fechaDeadline.slice(0, 10)) {
    cambios.fechaDeadline = form.fechaDeadline
  }
  return Object.keys(cambios).length === 0 ? null : (cambios as ActualizarCursoInput)
}
