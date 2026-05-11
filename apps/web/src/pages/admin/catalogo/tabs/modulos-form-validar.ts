export interface ErroresModuloForm {
  readonly titulo?: string
  readonly motivo?: string
  readonly general?: string
}

const MAX_TITULO = 200

export const MAX_TITULO_MODULO = MAX_TITULO
export const MAX_DESCRIPCION_MODULO = 2000

export function validarModulo(
  titulo: string,
  motivo: string,
  exigeMotivo: boolean,
): ErroresModuloForm | null {
  const t = titulo.trim()
  const errorTitulo =
    t.length === 0
      ? "El título es obligatorio."
      : t.length > MAX_TITULO
        ? `Máximo ${MAX_TITULO} caracteres.`
        : undefined
  const errorMotivo =
    exigeMotivo && motivo.trim().length === 0 ? "Cambiar el título requiere motivo." : undefined
  if (!(errorTitulo || errorMotivo)) {
    return null
  }
  return { titulo: errorTitulo, motivo: errorMotivo }
}
