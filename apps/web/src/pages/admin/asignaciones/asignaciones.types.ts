import type { Asignacion } from "@nexott-learn/shared-types"

export type AccionAsignacion =
  | "convertir"
  | "iniciar-progreso"
  | "marcar-listo"
  | "cerrar-caso"
  | "reabrir-caso"
  | "retirar"
  | "resultado-cliente"

export interface DialogoAbierto {
  readonly accion: AccionAsignacion | "asignar-batch"
  readonly asignacion?: Asignacion
}
