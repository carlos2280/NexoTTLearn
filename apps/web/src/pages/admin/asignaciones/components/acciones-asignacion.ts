import type { AccionMenu } from "@/shared/components/ui/menu-acciones"
import type { Asignacion } from "@nexott-learn/shared-types"
import {
  ArrowUpCircle,
  Briefcase,
  CheckCircle2,
  PlayCircle,
  RotateCcw,
  UserMinus,
  UserPlus,
} from "lucide-react"
import type { AccionAsignacion } from "../asignaciones.types"

type Disparador = (accion: AccionAsignacion, asignacion: Asignacion) => void

function accionesAsignado(asignacion: Asignacion, disparar: Disparador): AccionMenu[] {
  const estado = asignacion.estadoAsignado
  if (estado === "ASIGNADO") {
    return [
      ac("iniciar-progreso", "Iniciar progreso", PlayCircle, asignacion, disparar),
      ac("retirar", "Retirar", UserMinus, asignacion, disparar, true),
    ]
  }
  if (estado === "EN_PROGRESO") {
    return [
      ac("marcar-listo", "Marcar listo", CheckCircle2, asignacion, disparar),
      ac("retirar", "Retirar", UserMinus, asignacion, disparar, true),
    ]
  }
  if (estado === "LISTO") {
    return [
      ac("cerrar-caso", "Cerrar caso…", Briefcase, asignacion, disparar),
      ac("retirar", "Retirar", UserMinus, asignacion, disparar, true),
    ]
  }
  if (estado === "APTO" || estado === "NO_APTO") {
    return [
      ac("resultado-cliente", "Registrar resultado cliente…", Briefcase, asignacion, disparar),
      ac("reabrir-caso", "Reabrir caso…", RotateCcw, asignacion, disparar),
    ]
  }
  return []
}

function accionesVoluntario(asignacion: Asignacion, disparar: Disparador): AccionMenu[] {
  const estado = asignacion.estadoVoluntario
  const convertir = ac("convertir", "Convertir a asignado…", UserPlus, asignacion, disparar)
  if (estado === "INSCRITO") {
    return [
      convertir,
      ac("iniciar-progreso", "Iniciar progreso", PlayCircle, asignacion, disparar),
      ac("retirar", "Retirar", UserMinus, asignacion, disparar, true),
    ]
  }
  if (estado === "EN_PROGRESO") {
    return [
      convertir,
      ac("marcar-listo", "Marcar listo", CheckCircle2, asignacion, disparar),
      ac("retirar", "Retirar", UserMinus, asignacion, disparar, true),
    ]
  }
  if (estado === "LISTO") {
    return [
      convertir,
      ac("cerrar-caso", "Cerrar como completado…", Briefcase, asignacion, disparar),
      ac("retirar", "Retirar", UserMinus, asignacion, disparar, true),
    ]
  }
  if (estado === "COMPLETADO") {
    return [ac("reabrir-caso", "Reabrir caso…", ArrowUpCircle, asignacion, disparar)]
  }
  return []
}

function ac(
  id: AccionAsignacion,
  etiqueta: string,
  icono: AccionMenu["icono"],
  asignacion: Asignacion,
  disparar: Disparador,
  destructiva = false,
): AccionMenu {
  return { id, etiqueta, icono, destructiva, onClick: () => disparar(id, asignacion) }
}

export function obtenerAccionesAsignacion(
  asignacion: Asignacion,
  disparar: Disparador,
): readonly (readonly AccionMenu[])[] {
  const acciones =
    asignacion.rol === "ASIGNADO"
      ? accionesAsignado(asignacion, disparar)
      : accionesVoluntario(asignacion, disparar)
  return acciones.length > 0 ? [acciones] : []
}
