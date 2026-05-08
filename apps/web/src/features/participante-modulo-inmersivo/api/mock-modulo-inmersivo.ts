import type { ModuloInmersivoResponse } from "@nexott-learn/shared-types"
import { CUERPO_CIERRE, CUERPO_DETALLE, CUERPO_INTRO } from "./mock-modulo-cuerpos"

// Mock realista del modulo inmersivo. Se usa hasta que el back exponga
// `GET /participante/cursos/:slug/modulos/:moduloId/inmersivo`. El switch al
// real es de 1 linea en `obtener-modulo-inmersivo.api.ts`.

export const mockModuloInmersivo: ModuloInmersivoResponse = {
  curso: {
    id: "curso-git-fundamentals",
    slug: "git-fundamentals",
    titulo: "Git Fundamentals",
    gradiente: "indigo",
    icono: "git",
    nivel: "INTERMEDIO",
    hrefVolver: "/cursos/git-fundamentals",
  },
  modulo: {
    id: "modulo-branching",
    slug: "branching-strategies",
    titulo: "Branching Strategies",
    posicionLabel: "Modulo 2 de 4",
    deadlineIso: null,
  },
  secciones: [
    {
      id: "sec-1",
      titulo: "Fundamentos de Branching",
      orden: 1,
      estado: "COMPLETADA",
      bloques: [
        {
          id: "b-1-1",
          tipo: "PARRAFO",
          titulo: "Que es un branch y por que importa",
          orden: 1,
          duracionEstimadaMin: 6,
          estado: "COMPLETADO",
          payload: {
            tipo: "LECTURA",
            contenido: { cuerpo: CUERPO_INTRO },
            metadata: { duracionEstimada: 6, nivel: "basico" },
          },
        },
        {
          id: "b-1-2",
          tipo: "VIDEO",
          titulo: "Branches en accion · demo guiado",
          orden: 2,
          duracionEstimadaMin: 8,
          estado: "COMPLETADO",
          payload: null,
        },
      ],
    },
    {
      id: "sec-2",
      titulo: "Estrategias de Branching",
      orden: 2,
      estado: "EN_PROGRESO",
      bloques: [
        {
          id: "b-2-1",
          tipo: "PARRAFO",
          titulo: "Feature branches y sus variantes",
          orden: 1,
          duracionEstimadaMin: 9,
          estado: "COMPLETADO",
          payload: {
            tipo: "LECTURA",
            contenido: { cuerpo: CUERPO_DETALLE },
            metadata: { duracionEstimada: 9, nivel: "intermedio" },
          },
        },
        {
          id: "b-2-2",
          tipo: "PARRAFO",
          titulo: "Cuando elegir cada estrategia",
          orden: 2,
          duracionEstimadaMin: 7,
          estado: "EN_PROGRESO",
          payload: {
            tipo: "LECTURA",
            contenido: { cuerpo: CUERPO_CIERRE },
            metadata: { duracionEstimada: 7, nivel: "intermedio" },
          },
        },
        {
          id: "b-2-3",
          tipo: "CODIGO",
          codigoEvaluable: "NINGUNO",
          titulo: "Merge vs rebase: comparativa",
          orden: 3,
          duracionEstimadaMin: 8,
          estado: "SIN_INTENTAR",
          payload: null,
        },
        {
          id: "b-2-4",
          tipo: "QUIZ",
          titulo: "Quiz: estrategias de branching",
          orden: 4,
          duracionEstimadaMin: 5,
          estado: "SIN_INTENTAR",
          payload: null,
        },
      ],
    },
  ],
  progreso: {
    bloquesInteractuados: 3,
    bloquesTotales: 6,
    porcentaje: 50,
  },
  navegacion: {
    bloqueInicialId: "b-2-2",
    siguienteBloqueId: "b-2-3",
    anteriorBloqueId: "b-2-1",
  },
}
