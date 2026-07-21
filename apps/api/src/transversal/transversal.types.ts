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
  intentosMax: true,
  pesoCapaTests: true,
  pesoCapaCualitativa: true,
  pesoCapaComprension: true,
  capaTestsActiva: true,
  capaCualitativaActiva: true,
  capaComprensionActiva: true,
  criteriosEvaluacion: true,
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
  // Ajuste manual del admin al publicar (B-nota). El mapper ADMIN lo expone;
  // el participante lo ignora (solo ve la `notaGlobal` efectiva).
  notaAjustadaAdmin: true,
  motivoAjusteNota: true,
  aprobado: true,
  // Informe estructurado de la capa cualitativa (JSONB). El mapper ADMIN extrae
  // `evaluacionesCapas.cualitativa` como `revisionIa`; el participante lo ignora.
  evaluacionesCapas: true,
  // Curación del informe (Fase 4b ③). ADMIN ve crudo + final + metadata de
  // evidencia + sello de validación; el participante solo `reporteFinal` (como
  // `informe`) y solo en FINALIZADO. `evidenciaRepo` incluye el `contenido`
  // pesado en BD, pero el mapper admin envía solo su resumen (sin contenido).
  reporteIa: true,
  reporteFinal: true,
  evidenciaRepo: true,
  validadoPor: true,
  fechaValidacion: true,
  // Joins para el shape ADMIN del response (D-S8 / pantalla admin del intento).
  // El mapper `toIntentoParticipante` los ignora — visibilidad campo-a-campo.
  colaborador: {
    select: { id: true, nombre: true, email: true },
  },
  transversal: {
    select: {
      id: true,
      descripcion: true,
      umbralAprobacion: true,
      // Pesos + flags de capas activas: el mapper ADMIN los usa para calcular la
      // `notaCalculada` (preview de la IA que ve el admin antes de publicar).
      pesoCapaTests: true,
      pesoCapaCualitativa: true,
      pesoCapaComprension: true,
      capaTestsActiva: true,
      capaCualitativaActiva: true,
      capaComprensionActiva: true,
      curso: {
        select: { id: true, titulo: true },
      },
    },
  },
} as const satisfies Prisma.IntentoTransversalSelect

export type IntentoTransversalSeleccionado = Prisma.IntentoTransversalGetPayload<{
  select: typeof SELECT_INTENTO_TRANSVERSAL_FIELDS
}>

/**
 * SELECT del LISTADO: idéntico al de detalle pero SIN `evidenciaRepo`, cuyo JSONB
 * carga el `contenido` completo del repo (hasta ~300 KB/fila). El listado no
 * muestra la evidencia (eso vive en el detalle / su endpoint E14), así que no vale
 * pagar ese peso por cada fila paginada.
 */
const { evidenciaRepo: _evidenciaRepoOmitidaEnLista, ...SELECT_LISTA } =
  SELECT_INTENTO_TRANSVERSAL_FIELDS
export const SELECT_INTENTO_TRANSVERSAL_LISTA_FIELDS =
  SELECT_LISTA satisfies Prisma.IntentoTransversalSelect

export type IntentoTransversalSeleccionadoLista = Prisma.IntentoTransversalGetPayload<{
  select: typeof SELECT_INTENTO_TRANSVERSAL_LISTA_FIELDS
}>

export type TransversalSeleccionado = Prisma.ProyectoTransversalGetPayload<{
  select: typeof SELECT_TRANSVERSAL_FIELDS
}>
