export interface ErroresClienteForm {
  readonly nombre?: string
  readonly motivo?: string
  readonly general?: string
}

export const MAX_NOMBRE_CLIENTE = 200

export function validarCliente(
  nombre: string,
  motivo: string,
  exigeMotivo: boolean,
): ErroresClienteForm | null {
  const n = nombre.trim()
  const errorNombre =
    n.length === 0
      ? "El nombre es obligatorio."
      : n.length > MAX_NOMBRE_CLIENTE
        ? `Máximo ${MAX_NOMBRE_CLIENTE} caracteres.`
        : undefined
  const errorMotivo =
    exigeMotivo && motivo.trim().length === 0 ? "Cambiar el nombre requiere motivo." : undefined
  if (!(errorNombre || errorMotivo)) {
    return null
  }
  return { nombre: errorNombre, motivo: errorMotivo }
}
