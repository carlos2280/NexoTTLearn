import { Prisma } from "@prisma/client"

/**
 * Selects explicitos del dominio transversal — patron paraguas (no exponer
 * passwordHash, refreshToken ni Json crudo sin parsear).
 */
export const SELECT_TRANSVERSAL_FIELDS = {
  id: true,
  cursoId: true,
  descripcion: true,
  umbralAprobacion: true,
  pesoCapaTests: true,
  pesoCapaCualitativa: true,
  pesoCapaComprension: true,
  capaTestsActiva: true,
  capaCualitativaActiva: true,
  capaComprensionActiva: true,
} as const satisfies Prisma.ProyectoTransversalSelect

export const SELECT_INTENTO_TRANSVERSAL_FIELDS = {
  id: true,
  transversalId: true,
  colaboradorId: true,
  fecha: true,
  estado: true,
  anulado: true,
  motivoAnulacion: true,
  repoUrl: true,
  repoOArtefacto: true,
  comentarioColaborador: true,
  notaCapaTests: true,
  notaCapaCualitativa: true,
  notaCapaComprension: true,
  notaGlobal: true,
  aprobado: true,
} as const satisfies Prisma.IntentoTransversalSelect

export type IntentoTransversalSeleccionado = Prisma.IntentoTransversalGetPayload<{
  select: typeof SELECT_INTENTO_TRANSVERSAL_FIELDS
}>

export type TransversalSeleccionado = Prisma.ProyectoTransversalGetPayload<{
  select: typeof SELECT_TRANSVERSAL_FIELDS
}>
