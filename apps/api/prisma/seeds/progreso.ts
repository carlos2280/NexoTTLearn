// Progreso de los participantes: asignaciones + plan de estudio + avance
// (aperturas + intentos de bloque), historia de transversal y entrevista
// IA, y la fase final de NotaSkill que replica el ponderado D33.

import {
  CaracterItemPlan,
  EstadoIntentoTransversal,
  IntentoEntrevistaIaEstado,
  OrigenNotaSkill,
  OrigenVoluntario,
  type Prisma,
  type PrismaClient,
  RazonItemPlan,
  ResultadoEntrevistaCliente,
  RolAsignacion,
} from "@prisma/client"

import { ID_ENTREVISTA_IA, ID_TRANSVERSAL } from "./_config"
import { asigId, dateNDaysAgo, log, partId, planId, ymd } from "./_utils"
import {
  PARTICIPANTES,
  type ParticipanteDef,
  estadoAsignadoDe,
  estadoVoluntarioDe,
  necesitaCierre,
  porcentajeObjetivo,
  resultadoEntrevistaDe,
  rolDe,
} from "./catalogo"
import type { ModuloPersistido } from "./curso"

// ============================================================================
// seedAsignacionesFrontend
// ============================================================================

export async function seedAsignacionesFrontend(
  prisma: PrismaClient,
  cursoIdResolved: string,
  modulos: readonly ModuloPersistido[],
): Promise<void> {
  log(`Fase 7: ${PARTICIPANTES.length} asignaciones + avance coherente...`)

  // Plan: todas las secciones de TODOS los modulos del curso, en orden.
  const seccionesPlan: { seccionId: string; moduloId: string }[] = []
  for (const m of modulos) {
    for (const s of m.secciones) {
      seccionesPlan.push({ seccionId: s.seccionId, moduloId: m.moduloId })
    }
  }
  const totalSec = seccionesPlan.length

  for (const a of PARTICIPANTES) {
    const colaborador = { id: partId(a.idx) }

    const aId = asigId(a.idx)
    const rol = rolDe(a.estado)
    const estadoAs = estadoAsignadoDe(a.estado)
    const estadoVol = estadoVoluntarioDe(a.estado)
    const resultado = resultadoEntrevistaDe(a.estado)
    const cierre = necesitaCierre(a.estado)
    const inicio = a.estado === "ASIGNADO" ? null : dateNDaysAgo(10)
    const fechaCierre = cierre ? dateNDaysAgo(1) : null

    await prisma.asignacionCurso.upsert({
      where: { id: aId },
      update: {
        rol,
        estadoAsignado: estadoAs,
        estadoVoluntario: estadoVol,
        origenVoluntario: rol === RolAsignacion.VOLUNTARIO ? OrigenVoluntario.INICIATIVA : null,
        resultadoEntrevistaCliente:
          rol === RolAsignacion.ASIGNADO
            ? (resultado ?? ResultadoEntrevistaCliente.PENDIENTE)
            : null,
      },
      create: {
        id: aId,
        colaboradorId: colaborador.id,
        cursoId: cursoIdResolved,
        rol,
        estadoAsignado: estadoAs,
        estadoVoluntario: estadoVol,
        origenVoluntario: rol === RolAsignacion.VOLUNTARIO ? OrigenVoluntario.INICIATIVA : null,
        fechaInicio: inicio,
        fechaCierre,
        resultadoEntrevistaCliente:
          rol === RolAsignacion.ASIGNADO
            ? (resultado ?? ResultadoEntrevistaCliente.PENDIENTE)
            : null,
        fechaEntrevistaCliente:
          resultado && resultado !== ResultadoEntrevistaCliente.PENDIENTE
            ? ymd(dateNDaysAgo(2))
            : null,
      },
    })

    // Plan de estudio (1 por asignacion, items = todas las secciones del curso)
    const pId = planId(a.idx)
    await prisma.planEstudio.upsert({
      where: { id: pId },
      update: {
        fichaSnapshot: { sembrado: "seed-frontend" } satisfies Prisma.InputJsonValue,
        estaDesactualizado: false,
      },
      create: {
        id: pId,
        asignacionId: aId,
        fichaSnapshot: { sembrado: "seed-frontend" } satisfies Prisma.InputJsonValue,
        estaDesactualizado: false,
      },
    })
    await prisma.itemPlan.deleteMany({ where: { planId: pId } })
    for (const sec of seccionesPlan) {
      await prisma.itemPlan.create({
        data: {
          planId: pId,
          moduloId: sec.moduloId,
          seccionId: sec.seccionId,
          caracter: CaracterItemPlan.OBLIGATORIA,
          razon: RazonItemPlan.SKILL_FALTANTE,
        },
      })
    }

    // Avance coherente: AperturaSeccion + IntentoBloque del QUIZ (evaluable)
    // segun el porcentaje objetivo. Como cada seccion tiene >=1 bloque
    // evaluable, para que una seccion cuente como "completada" TODOS los
    // bloques evaluables deben tener mejor-intento aprobado (la formula de
    // avance lo exige; la formula de NotaSkill solo cuenta los que tienen
    // skillQueMideId, pero el avance requiere todos los evaluables).
    // porcentajeOverride permite "100% de contenido aunque el estado sea
    // EN_PROGRESO" (caso Lucia/Diego con transversal pendiente o fallido).
    const objetivo = a.porcentajeOverride ?? porcentajeObjetivo(a.estado)
    const seccionesAbrir = objetivo === 0 ? 0 : Math.max(1, Math.round((objetivo / 100) * totalSec))

    for (let i = 0; i < seccionesAbrir; i++) {
      const sec = seccionesPlan[i]
      if (!sec) {
        continue
      }
      // Abrir la seccion
      await prisma.aperturaSeccion.upsert({
        where: { asignacionId_seccionId: { asignacionId: aId, seccionId: sec.seccionId } },
        update: {},
        create: { asignacionId: aId, seccionId: sec.seccionId, primeraAperturaAt: dateNDaysAgo(5) },
      })

      // FIX CRITICO #1: aprobar TODOS los bloques evaluables de la seccion,
      // no solo el primero. La formula de avance considera la seccion
      // completada solo cuando cada bloque evaluable tiene mejor-intento
      // aprobado; si dejamos uno fuera, la seccion no avanza aunque el
      // QUIZ "principal" este aprobado.
      const evaluablesRaw = await prisma.bloque.findMany({
        where: { seccionId: sec.seccionId, esEvaluable: true },
        select: { id: true, version: true, skillQueMideId: true },
      })
      // IntentoBloque.skillId es NOT NULL — solo sembramos intento para
      // bloques que declaran su skill. Si un bloque evaluable no tiene
      // skill, no se podra computar avance sobre el (caso patologico que
      // este seed no contempla).
      const evaluables = evaluablesRaw.filter(
        (b): b is typeof b & { skillQueMideId: string } => b.skillQueMideId !== null,
      )
      if (evaluables.length === 0) {
        continue
      }

      // Borrar intentos previos de este colab+seccion (todos los evaluables)
      // para mantener idempotencia si el seed se re-corre.
      await prisma.intentoBloque.deleteMany({
        where: {
          colaboradorId: colaborador.id,
          bloqueId: { in: evaluables.map((b) => b.id) },
        },
      })

      for (const evaluable of evaluables) {
        await prisma.intentoBloque.create({
          data: {
            colaboradorId: colaborador.id,
            bloqueId: evaluable.id,
            skillId: evaluable.skillQueMideId,
            cursoId: cursoIdResolved,
            nota: 85,
            esMejorIntento: true,
            versionBloque: evaluable.version,
            respuestas: { wip: true } satisfies Prisma.InputJsonValue,
          },
        })
      }
    }

    // Historia opcional: transversal + entrevista IA segun ParticipanteDef.
    await seedHistoriaParticipante(prisma, a, colaborador.id)
  }
}

// ============================================================================
// Historia opcional por participante: intentos de transversal y de
// entrevista IA
// ============================================================================

export async function seedHistoriaParticipante(
  prisma: PrismaClient,
  p: ParticipanteDef,
  colaboradorId: string,
): Promise<void> {
  // --- TRANSVERSAL: limpiar intentos previos y volver a sembrar idempotente ---
  if (p.transversal && p.transversal.length > 0) {
    await prisma.intentoTransversal.deleteMany({
      where: { colaboradorId, transversalId: ID_TRANSVERSAL },
    })

    for (const intento of p.transversal) {
      const fechaCreacion = dateNDaysAgo(intento.fechaDiasAtras)

      if (intento.tipo === "en_evaluacion") {
        await prisma.intentoTransversal.create({
          data: {
            transversalId: ID_TRANSVERSAL,
            colaboradorId,
            fecha: fechaCreacion,
            estado: EstadoIntentoTransversal.EN_EVALUACION,
            repoUrl: intento.repoUrl,
            comentarioColaborador: intento.comentario,
            anulado: false,
          },
        })
      } else if (intento.tipo === "evaluado_aprobado") {
        await prisma.intentoTransversal.create({
          data: {
            transversalId: ID_TRANSVERSAL,
            colaboradorId,
            fecha: fechaCreacion,
            fechaFinalizacion: fechaCreacion,
            // FINALIZADO (no EVALUADO): es el estado que `transversalAprobado()`
            // y `obtenerIntentoTransversalVigente()` reconocen como cerrado.
            estado: EstadoIntentoTransversal.FINALIZADO,
            repoUrl: intento.repoUrl,
            nota: intento.notaGlobal,
            notaGlobal: intento.notaGlobal,
            notaCapaTests: intento.notaTests,
            notaCapaCualitativa: intento.notaCualitativa,
            notaCapaComprension: intento.notaComprension,
            aprobado: true,
            anulado: false,
          },
        })
      } else if (intento.tipo === "evaluado_no_aprobado") {
        await prisma.intentoTransversal.create({
          data: {
            transversalId: ID_TRANSVERSAL,
            colaboradorId,
            fecha: fechaCreacion,
            fechaFinalizacion: fechaCreacion,
            estado: EstadoIntentoTransversal.FINALIZADO,
            repoUrl: intento.repoUrl,
            comentarioColaborador: intento.comentario,
            nota: intento.notaGlobal,
            notaGlobal: intento.notaGlobal,
            notaCapaTests: intento.notaTests,
            notaCapaCualitativa: intento.notaCualitativa,
            notaCapaComprension: intento.notaComprension,
            aprobado: false,
            anulado: false,
          },
        })
      } else if (intento.tipo === "anulado") {
        await prisma.intentoTransversal.create({
          data: {
            transversalId: ID_TRANSVERSAL,
            colaboradorId,
            fecha: fechaCreacion,
            fechaFinalizacion: fechaCreacion,
            estado: EstadoIntentoTransversal.ANULADO,
            repoUrl: intento.repoUrl,
            anulado: true,
            motivoAnulacion: intento.motivo,
          },
        })
      }
    }
  }

  // --- ENTREVISTA IA: limpiar y sembrar el intento finalizado ---
  if (p.entrevistaIA) {
    const previo = await prisma.intentoEntrevistaIA.findMany({
      where: { colaboradorId, entrevistaIaId: ID_ENTREVISTA_IA },
      select: { id: true },
    })
    if (previo.length > 0) {
      await prisma.intentoEntrevistaIANotaArea.deleteMany({
        where: { intentoId: { in: previo.map((p) => p.id) } },
      })
      await prisma.intentoEntrevistaIA.deleteMany({
        where: { id: { in: previo.map((p) => p.id) } },
      })
    }

    const fechaCreacion = dateNDaysAgo(p.entrevistaIA.fechaDiasAtras)
    const intentoIA = await prisma.intentoEntrevistaIA.create({
      data: {
        entrevistaIaId: ID_ENTREVISTA_IA,
        colaboradorId,
        fecha: fechaCreacion,
        fechaFinalizacion: fechaCreacion,
        estado: IntentoEntrevistaIaEstado.FINALIZADO,
        notaGlobal: p.entrevistaIA.notaGlobal,
        aprobado: p.entrevistaIA.aprobado,
        transcripcionOLog: {
          resumen: p.entrevistaIA.resumenTranscripcion,
          mensajes: [], // sembrado vacio — la conversacion real se hara con la IA real
        } satisfies Prisma.InputJsonValue,
        rubricaSnapshot: {
          pesos: { Frontend: 70, "Calidad y Testing": 20, "DevOps Azure": 10 },
          umbralAprobacion: 70,
        } satisfies Prisma.InputJsonValue,
        reporteEvaluador: {
          fortalezas: p.entrevistaIA.reporte.fortalezas,
          mejoras: p.entrevistaIA.reporte.mejoras,
          justificacion: p.entrevistaIA.reporte.justificacion,
          generadoEn: fechaCreacion.toISOString(),
        } satisfies Prisma.InputJsonObject,
        anulado: false,
      },
    })

    // Notas por area (FK al area por nombre)
    const areas = await prisma.area.findMany({ select: { id: true, nombre: true } })
    const areaIdByNombre = new Map(areas.map((a) => [a.nombre, a.id] as const))
    for (const notaArea of p.entrevistaIA.notasPorArea) {
      const areaId = areaIdByNombre.get(notaArea.areaNombre)
      if (!areaId) {
        continue
      }
      await prisma.intentoEntrevistaIANotaArea.create({
        data: {
          intentoId: intentoIA.id,
          areaId,
          nota: notaArea.nota,
        },
      })
    }
  }
}

// ============================================================================
// NotaSkill: poblar tabla replicando D33 (pesos del curso) sobre los datos
// que ya se sembraron en fases anteriores. Imprescindible para que la ficha
// del participante muestre "capacidades demostradas" coherentes con bloques +
// transversal + entrevista IA.
// ============================================================================

/**
 * Replica `calcularNotaActualSkill` del NotaSkillService: pondera fuentes
 * disponibles redistribuyendo pesos cuando alguna es null (D33 + D35).
 */
export function calcularNotaActualSkillSeed(
  notas: {
    readonly bloques: number | null
    readonly transversal: number | null
    readonly entrevista: number | null
  },
  pesos: { readonly bloques: number; readonly transversal: number; readonly entrevista: number },
): number | null {
  const fuentes = (
    [
      { peso: pesos.bloques, nota: notas.bloques },
      { peso: pesos.transversal, nota: notas.transversal },
      { peso: pesos.entrevista, nota: notas.entrevista },
    ] as const
  ).flatMap((f) => (f.nota === null || f.peso <= 0 ? [] : [{ peso: f.peso, nota: f.nota }]))
  if (fuentes.length === 0) {
    return null
  }
  const pesoTotal = fuentes.reduce((s, f) => s + f.peso, 0)
  if (pesoTotal <= 0) {
    return null
  }
  const ponderada = fuentes.reduce((acc, f) => acc + (f.peso / pesoTotal) * f.nota, 0)
  return Math.round(ponderada * 100) / 100
}

/**
 * Politica "ultimo aprobado" para transversal/entrevista: filtra FINALIZADO
 * no anulado, si el ultimo es aprobado lo devuelve, si no busca hacia atras
 * el ultimo aprobado. Si no hay, null.
 */
export function obtenerVigenteSeed<
  T extends { estado: string; anulado: boolean; aprobado: boolean | null },
>(intentos: readonly T[]): T | null {
  const noAnulados = intentos.filter((i) => !i.anulado && i.estado === "FINALIZADO")
  if (noAnulados.length === 0) {
    return null
  }
  const ultimo = noAnulados[noAnulados.length - 1]
  if (ultimo === undefined) {
    return null
  }
  if (ultimo.aprobado === true) {
    return ultimo
  }
  for (let i = noAnulados.length - 2; i >= 0; i -= 1) {
    const c = noAnulados[i]
    if (c !== undefined && c.aprobado === true) {
      return c
    }
  }
  return null
}

export async function seedNotasSkill(
  prisma: PrismaClient,
  cursoIdResolved: string,
  skillIdByEtiqueta: ReadonlyMap<string, string>,
): Promise<void> {
  log("Fase 8: poblar NotaSkill + HistoricoNotaSkill (D33) para los participantes...")

  const curso = await prisma.curso.findUniqueOrThrow({
    where: { id: cursoIdResolved },
    select: {
      pesoBloques: true,
      pesoTransversal: true,
      pesoEntrevista: true,
      transversalId: true,
      entrevistaIaId: true,
    },
  })
  const pesos = {
    bloques: Number(curso.pesoBloques.toString()),
    transversal: Number(curso.pesoTransversal.toString()),
    entrevista: Number(curso.pesoEntrevista.toString()),
  }

  // Mapeo skill -> area (para la nota por area de la entrevista IA)
  const skills = await prisma.skill.findMany({
    where: { id: { in: Array.from(skillIdByEtiqueta.values()) } },
    select: { id: true, areaId: true },
  })
  const areaIdBySkill = new Map(skills.map((s) => [s.id, s.areaId] as const))

  // Skills etiquetadas al transversal (en este curso, todas estan etiquetadas)
  const skillsTransversal = curso.transversalId
    ? new Set(
        (
          await prisma.transversalSkill.findMany({
            where: { transversalId: curso.transversalId },
            select: { skillId: true },
          })
        ).map((s) => s.skillId),
      )
    : new Set<string>()

  let totalCalculadas = 0
  let totalNulas = 0

  for (const p of PARTICIPANTES) {
    const colaboradorId = partId(p.idx)

    // Limpia NotaSkill previas del colaborador (cascade limpia HistoricoNotaSkill)
    await prisma.notaSkill.deleteMany({ where: { colaboradorId } })

    for (const [etiqueta, skillIdSk] of skillIdByEtiqueta) {
      // 1) BLOQUES: promedio de intentos aprobados (esMejorIntento, no invalidado)
      //    sobre bloques cuya skillQueMideId = esta skill.
      const mejoresBloques = await prisma.intentoBloque.findMany({
        where: {
          colaboradorId,
          esMejorIntento: true,
          estaInvalidado: false,
          bloque: { skillQueMideId: skillIdSk },
        },
        select: { nota: true },
      })
      const notaBloques =
        mejoresBloques.length === 0
          ? null
          : mejoresBloques.reduce((s, m) => s + Number(m.nota.toString()), 0) /
            mejoresBloques.length

      // 2) TRANSVERSAL: notaGlobal del intento vigente si la skill esta etiquetada.
      let notaTransversal: number | null = null
      if (curso.transversalId && skillsTransversal.has(skillIdSk)) {
        const intentos = await prisma.intentoTransversal.findMany({
          where: { transversalId: curso.transversalId, colaboradorId, anulado: false },
          select: {
            estado: true,
            anulado: true,
            aprobado: true,
            notaGlobal: true,
            fecha: true,
            fechaFinalizacion: true,
          },
          orderBy: [{ fechaFinalizacion: { sort: "asc", nulls: "last" } }, { fecha: "asc" }],
        })
        const vigente = obtenerVigenteSeed(intentos)
        if (vigente?.notaGlobal !== null && vigente?.notaGlobal !== undefined) {
          notaTransversal = Number(vigente.notaGlobal.toString())
        }
      }

      // 3) ENTREVISTA IA: notaAjustadaAdmin si existe, sino notaArea del area de la skill.
      let notaEntrevista: number | null = null
      if (curso.entrevistaIaId) {
        const areaId = areaIdBySkill.get(skillIdSk)
        const intentos = await prisma.intentoEntrevistaIA.findMany({
          where: { entrevistaIaId: curso.entrevistaIaId, colaboradorId, anulado: false },
          select: {
            estado: true,
            anulado: true,
            aprobado: true,
            notaGlobal: true,
            notaAjustadaAdmin: true,
            fecha: true,
            fechaFinalizacion: true,
            notasPorArea: areaId ? { where: { areaId }, select: { nota: true } } : false,
          },
          orderBy: [{ fechaFinalizacion: { sort: "asc", nulls: "last" } }, { fecha: "asc" }],
        })
        const vigente = obtenerVigenteSeed(intentos)
        if (vigente) {
          if (vigente.notaAjustadaAdmin !== null) {
            notaEntrevista = Number(vigente.notaAjustadaAdmin.toString())
          } else if (vigente.notasPorArea && vigente.notasPorArea.length > 0) {
            const fila = vigente.notasPorArea[0]
            if (fila) {
              notaEntrevista = Number(fila.nota.toString())
            }
          }
        }
      }

      const notaActual = calcularNotaActualSkillSeed(
        { bloques: notaBloques, transversal: notaTransversal, entrevista: notaEntrevista },
        pesos,
      )

      if (notaActual === null) {
        totalNulas += 1
        continue // no insertar fila para skills sin ningun aporte
      }

      // Origen del calculo: si hubo entrevista, ENTREVISTA_IA; si solo transversal, TRANSVERSAL;
      // si solo bloques, BLOQUE. Refleja el "ultimo trigger" tipico del flujo real.
      const origen: OrigenNotaSkill =
        notaEntrevista !== null
          ? OrigenNotaSkill.ENTREVISTA_IA
          : notaTransversal !== null
            ? OrigenNotaSkill.TRANSVERSAL
            : OrigenNotaSkill.BLOQUE

      const referencia = {
        skillEtiqueta: etiqueta,
        fuentes: { bloques: notaBloques, transversal: notaTransversal, entrevista: notaEntrevista },
        pesos,
        sembrado: "seed-frontend",
      } satisfies Prisma.InputJsonObject

      const notaSkillRow = await prisma.notaSkill.create({
        data: {
          colaboradorId,
          skillId: skillIdSk,
          notaActual, // Prisma acepta number para Decimal
          origenActual: { tipo: origen, ...referencia } as unknown as Prisma.InputJsonValue,
        },
        select: { id: true },
      })

      await prisma.historicoNotaSkill.create({
        data: {
          notaSkillId: notaSkillRow.id,
          valor: notaActual,
          origen,
          referencia: referencia as unknown as Prisma.InputJsonValue,
        },
      })

      totalCalculadas += 1
    }
  }

  log(`  NotaSkill calculadas: ${totalCalculadas} (nulas omitidas: ${totalNulas})`)
}
