// Persistencia de modulos + secciones + bloques y del curso destacado.
// `seedModulos` inserta el catalogo pedagogico; `seedCurso` crea el curso
// "Frontend para devs backend" junto con sus areas/skills exigidas,
// transversal y entrevista IA.

import {
  DesbloqueoCurso,
  EstadoBloque,
  EstadoCurso,
  EstadoModulo,
  FilosofiaEntrevista,
  type Prisma,
  type PrismaClient,
  ProfundidadEntrevista,
  TipoBloque,
  TonoEntrevista,
} from "@prisma/client"

import { ID_ENTREVISTA_IA, ID_TRANSVERSAL } from "./_config"
import {
  bloqueId,
  cursoId,
  dateNDaysAgo,
  dateNDaysAhead,
  log,
  moduloId,
  placeholderParrafo,
  placeholderQuiz,
  seccionId,
  ymd,
} from "./_utils"
import { SKILLS_FRONTEND } from "./catalogo"
import { type BloqueRealDef, MODULOS_FRONTEND } from "./modulos"

// ============================================================================
// Tipos publicos
// ============================================================================

export interface ModuloPersistido {
  readonly idx: number
  readonly moduloId: string
  readonly secciones: ReadonlyArray<{
    readonly seccionId: string
    readonly titulo: string
  }>
}

// ============================================================================
// seedModulos — inserta modulos + secciones + bloques
// ============================================================================

export async function seedModulos(
  prisma: PrismaClient,
  skillIdByEtiqueta: ReadonlyMap<string, string>,
): Promise<readonly ModuloPersistido[]> {
  log(`Fase 6a: ${MODULOS_FRONTEND.length} modulos + secciones + bloques placeholder...`)
  let secCursor = 1
  let blqCursor = 1
  const persistidos: ModuloPersistido[] = []

  for (const m of MODULOS_FRONTEND) {
    const mId = moduloId(m.idx)
    await prisma.modulo.upsert({
      where: { id: mId },
      update: {
        titulo: m.titulo,
        descripcion: m.descripcion,
        estado: EstadoModulo.ACTIVO,
        deletedAt: null,
      },
      create: {
        id: mId,
        titulo: m.titulo,
        descripcion: m.descripcion,
        estado: EstadoModulo.ACTIVO,
      },
    })

    const secs: { seccionId: string; titulo: string }[] = []
    for (let i = 0; i < m.secciones.length; i++) {
      const s = m.secciones[i]
      if (!s) {
        continue
      }
      const sId = seccionId(secCursor)
      secCursor += 1
      await prisma.seccion.upsert({
        where: { id: sId },
        update: { titulo: s.titulo, orden: i + 1, moduloId: mId },
        create: { id: sId, titulo: s.titulo, orden: i + 1, moduloId: mId },
      })

      const skillIdResolved = skillIdByEtiqueta.get(s.skill)
      if (skillIdResolved) {
        await prisma.seccionSkill.upsert({
          where: { seccionId_skillId: { seccionId: sId, skillId: skillIdResolved } },
          update: {},
          create: { seccionId: sId, skillId: skillIdResolved },
        })
      }

      // Si la seccion define bloques reales, los crea; si no, fallback a
      // 1 PARRAFO + 1 QUIZ placeholder (iteracion 1).
      const bloquesAUsar: readonly BloqueRealDef[] =
        s.bloques ??
        ([
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: placeholderParrafo(s.temas, `frt-m${m.idx}-s${i + 1}-parrafo`),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: s.skill,
            contenido: placeholderQuiz(s.skill, `frt-m${m.idx}-s${i + 1}-quiz`),
          },
        ] satisfies readonly BloqueRealDef[])

      for (let j = 0; j < bloquesAUsar.length; j++) {
        const b = bloquesAUsar[j]
        if (!b) {
          continue
        }
        const bId = b.idForzado ?? bloqueId(blqCursor)
        if (!b.idForzado) {
          blqCursor += 1
        }
        const skillBloque =
          b.esEvaluable && b.skill ? (skillIdByEtiqueta.get(b.skill) ?? null) : null

        await prisma.bloque.upsert({
          where: { id: bId },
          update: {
            seccionId: sId,
            orden: j + 1,
            tipo: b.tipo,
            esEvaluable: b.esEvaluable,
            skillQueMideId: skillBloque,
            contenido: b.contenido,
            estado: EstadoBloque.ACTIVO,
            version: 1,
          },
          create: {
            id: bId,
            seccionId: sId,
            orden: j + 1,
            tipo: b.tipo,
            esEvaluable: b.esEvaluable,
            skillQueMideId: skillBloque,
            contenido: b.contenido,
            estado: EstadoBloque.ACTIVO,
            version: 1,
          },
        })
      }

      secs.push({ seccionId: sId, titulo: s.titulo })
    }

    persistidos.push({ idx: m.idx, moduloId: mId, secciones: secs })
  }

  return persistidos
}

// ============================================================================
// seedCurso — crea el curso "Frontend para devs backend"
// ============================================================================

export async function seedCurso(
  prisma: PrismaClient,
  clienteIdResolved: string,
  modulos: readonly ModuloPersistido[],
  skillIdByEtiqueta: ReadonlyMap<string, string>,
): Promise<string> {
  log("Fase 6b: curso destacado + areas/skills exigidas + transversal + entrevista IA...")
  const cId = cursoId(1)
  const fechaInicio = ymd(dateNDaysAgo(15))
  const fechaDeadline = ymd(dateNDaysAhead(45))

  await prisma.curso.upsert({
    where: { id: cId },
    update: {
      titulo: "Frontend para devs backend",
      clienteId: clienteIdResolved,
      estado: EstadoCurso.ACTIVO,
      fechaInicio,
      fechaDeadline,
      desbloqueo: DesbloqueoCurso.ENCADENADO,
      // FIX #2: pesos + umbrales tambien en el update para que un re-seed
      // sobre una BD ya inicializada no quede con los defaults previos.
      toggleVoluntarios: true,
      toggleCierreAutomatico: false,
      umbralNoCumple: 50,
      pesoBloques: 40,
      pesoTransversal: 30,
      pesoEntrevista: 30,
      umbralesLogro: {
        excelencia: 90,
        solido: 75,
        enDesarrollo: 60,
      } satisfies Prisma.InputJsonValue,
    },
    create: {
      id: cId,
      titulo: "Frontend para devs backend",
      clienteId: clienteIdResolved,
      estado: EstadoCurso.ACTIVO,
      fechaInicio,
      fechaDeadline,
      desbloqueo: DesbloqueoCurso.ENCADENADO,
      toggleVoluntarios: true,
      toggleCierreAutomatico: false,
      umbralNoCumple: 50,
      pesoBloques: 40,
      pesoTransversal: 30,
      pesoEntrevista: 30,
      umbralesLogro: {
        excelencia: 90,
        solido: 75,
        enDesarrollo: 60,
      } satisfies Prisma.InputJsonValue,
    },
  })

  // Areas exigidas (peso total = 100)
  await prisma.cursoAreaExigida.deleteMany({ where: { cursoId: cId } })
  const areas = await prisma.area.findMany({ select: { id: true, nombre: true } })
  const areaIdByNombre = new Map(areas.map((a) => [a.nombre, a.id] as const))
  const frontId = areaIdByNombre.get("Frontend")
  const qaId = areaIdByNombre.get("Calidad y Testing")
  const devopsId = areaIdByNombre.get("DevOps Azure")
  if (frontId) {
    await prisma.cursoAreaExigida.create({
      data: { cursoId: cId, areaId: frontId, peso: 70, puntajeObjetivo: 75 },
    })
  }
  if (qaId) {
    await prisma.cursoAreaExigida.create({
      data: { cursoId: cId, areaId: qaId, peso: 20, puntajeObjetivo: 70 },
    })
  }
  if (devopsId) {
    await prisma.cursoAreaExigida.create({
      data: { cursoId: cId, areaId: devopsId, peso: 10, puntajeObjetivo: 70 },
    })
  }

  // Skills exigidas (las 9 + 1 — todas las del curso)
  await prisma.cursoSkillExigida.deleteMany({ where: { cursoId: cId } })
  for (const s of SKILLS_FRONTEND) {
    const sId = skillIdByEtiqueta.get(s.etiqueta)
    if (!sId) {
      continue
    }
    await prisma.cursoSkillExigida.create({
      data: { cursoId: cId, skillId: sId, notaMinima: s.notaMinima },
    })
  }

  // Modulos habilitados (orden = el del seed)
  await prisma.cursoModuloHabilitado.deleteMany({ where: { cursoId: cId } })
  for (const m of modulos) {
    await prisma.cursoModuloHabilitado.create({
      data: { cursoId: cId, moduloId: m.moduloId },
    })
  }

  // Proyecto transversal
  await prisma.proyectoTransversal.upsert({
    where: { id: ID_TRANSVERSAL },
    update: {
      descripcion:
        "Mini panel admin tipado: tabla con busqueda debounced + fetch real + mutation con optimistic update + 1 test de integracion + 1 E2E con Playwright. Integra los 10 modulos del curso.",
      umbralAprobacion: 70,
    },
    create: {
      id: ID_TRANSVERSAL,
      cursoId: cId,
      descripcion:
        "Mini panel admin tipado: tabla con busqueda debounced + fetch real + mutation con optimistic update + 1 test de integracion + 1 E2E con Playwright. Integra los 10 modulos del curso.",
      umbralAprobacion: 70,
      capas: {
        tests: { activa: true, peso: 40 },
        cualitativa: { activa: true, peso: 30 },
        comprension: { activa: true, peso: 30 },
      } satisfies Prisma.InputJsonValue,
      pesoCapaTests: 40,
      pesoCapaCualitativa: 30,
      pesoCapaComprension: 30,
      capaTestsActiva: true,
      capaCualitativaActiva: true,
      capaComprensionActiva: true,
    },
  })

  // Transversal mide skills clave (las que aplican al proyecto integrador)
  await prisma.transversalSkill.deleteMany({ where: { transversalId: ID_TRANSVERSAL } })
  for (const et of [
    "TypeScript estricto",
    "React fundamentos y mental model",
    "Server state con Tanstack Query",
    "Testing frontend (unit + integracion + E2E)",
  ]) {
    const sId = skillIdByEtiqueta.get(et)
    if (!sId) {
      continue
    }
    await prisma.transversalSkill.create({
      data: { transversalId: ID_TRANSVERSAL, skillId: sId },
    })
  }

  // Entrevista IA — rubrica con las 3 areas del curso
  await prisma.entrevistaIA.upsert({
    where: { id: ID_ENTREVISTA_IA },
    update: {
      umbralAprobacion: 70,
      filosofia: FilosofiaEntrevista.FILTRO,
      profundidad: ProfundidadEntrevista.SEMI_SENIOR,
      duracionMinutos: 30,
      tono: TonoEntrevista.CONVERSACIONAL,
    },
    create: {
      id: ID_ENTREVISTA_IA,
      cursoId: cId,
      umbralAprobacion: 70,
      filosofia: FilosofiaEntrevista.FILTRO,
      profundidad: ProfundidadEntrevista.SEMI_SENIOR,
      duracionMinutos: 30,
      tono: TonoEntrevista.CONVERSACIONAL,
    },
  })
  await prisma.rubricaEntrevistaIA.deleteMany({ where: { entrevistaIaId: ID_ENTREVISTA_IA } })
  if (frontId) {
    await prisma.rubricaEntrevistaIA.create({
      data: { entrevistaIaId: ID_ENTREVISTA_IA, areaId: frontId, peso: 70 },
    })
  }
  if (qaId) {
    await prisma.rubricaEntrevistaIA.create({
      data: { entrevistaIaId: ID_ENTREVISTA_IA, areaId: qaId, peso: 20 },
    })
  }
  if (devopsId) {
    await prisma.rubricaEntrevistaIA.create({
      data: { entrevistaIaId: ID_ENTREVISTA_IA, areaId: devopsId, peso: 10 },
    })
  }

  // Vincular curso → transversal + entrevista
  await prisma.curso.update({
    where: { id: cId },
    data: { transversalId: ID_TRANSVERSAL, entrevistaIaId: ID_ENTREVISTA_IA },
  })

  return cId
}
