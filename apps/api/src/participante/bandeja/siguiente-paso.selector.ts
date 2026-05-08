// §4.2.1 · Selector de "siguiente paso".
//
// Implementa las prioridades 1-5 (caso modulo). Las prioridades 6-7 (hito)
// y 8 (curso completado) se atienden cuando esten los modelos de proyecto/
// entrevista en el flujo participante (Fase 3). Si nada matchea (prio 9),
// retorna null y la pagina renderiza segun `estado` del payload.

import type { BandejaSiguientePaso } from "@nexott-learn/shared-types"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { cargarModulosCandidatos } from "./siguiente-paso.query"
import { type ModuloAsignado, fechaMs, prioridadTipoAsignacion } from "./siguiente-paso.types"

export async function seleccionarSiguientePaso(
  prisma: PrismaService,
  participanteId: string,
): Promise<BandejaSiguientePaso | null> {
  const modulos = await cargarModulosCandidatos(prisma, participanteId)
  if (modulos.length === 0) {
    return null
  }
  const elegido = elegirModulo(modulos)
  if (!elegido) {
    return null
  }
  return mapearAModulo(elegido)
}

// §4.2.1 prio 1-5. La primera que aplica, gana.
function elegirModulo(modulos: ModuloAsignado[]): ModuloAsignado | null {
  const enProgresoConDeadline = modulos
    .filter((m) => m.estadoModulo === "EN_PROGRESO" && m.cursoDeadline != null)
    .sort((a, b) => fechaMs(a.cursoDeadline) - fechaMs(b.cursoDeadline))
  if (enProgresoConDeadline[0]) {
    return enProgresoConDeadline[0]
  }

  const enProgreso = modulos
    .filter((m) => m.estadoModulo === "EN_PROGRESO")
    .sort((a, b) => b.porcentajeAvance - a.porcentajeAvance)
  if (enProgreso[0]) {
    return enProgreso[0]
  }

  const noIniciados = modulos.filter((m) => m.estadoModulo === "NO_INICIADO")
  noIniciados.sort(comparadorNoIniciados)
  return noIniciados[0] ?? null
}

function comparadorNoIniciados(a: ModuloAsignado, b: ModuloAsignado): number {
  const t = prioridadTipoAsignacion(a.tipoAsignacion) - prioridadTipoAsignacion(b.tipoAsignacion)
  if (t !== 0) {
    return t
  }
  const dA = fechaMs(a.cursoDeadline)
  const dB = fechaMs(b.cursoDeadline)
  if (dA !== dB) {
    return dA - dB
  }
  return a.ordenModulo - b.ordenModulo
}

function mapearAModulo(m: ModuloAsignado): BandejaSiguientePaso {
  const estado = m.estadoModulo === "EN_PROGRESO" ? "EN_PROGRESO" : "NO_INICIADO"
  const cta = estado === "EN_PROGRESO" ? "Continuar" : "Comenzar"
  return {
    variante: "MODULO",
    estado,
    titulo: m.tituloModulo,
    contexto: `${m.tituloCurso} · ${m.empresaCliente}`,
    porcentajeAvance: m.porcentajeAvance,
    cta,
    href: `/cursos/${m.cursoId}/modulo/${m.moduloId}`,
  }
}
