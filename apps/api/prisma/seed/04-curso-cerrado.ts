/**
 * Curso CERRADO "Backend Java · Banco WW" + ExpedienteEntry sellado de Juan.
 *
 * ESQUEMA.md §238 declara este curso como antecedente de Juan:
 *   ▸ Curso "Backend Java · Banco WW" COMPLETADO 2025-11-10
 *     - Backend:     65 (no llegó al umbral 75)
 *     - Herram:      85 ✓
 *     Nota global: 70
 *
 * Esto demuestra:
 *   - Sellado del expediente al cerrar curso (S06).
 *   - Snapshot inmutable del nombre de área y empresaCliente (I25).
 *   - cumpleUmbral por área comparado con puntajeObjetivo del momento.
 *   - Curso CERRADO sigue existiendo aunque cliente/áreas cambien.
 */
import type { Curso, ExpedienteEntry } from "@prisma/client"
import type { UsuariosSeedResult } from "./00-usuarios.js"
import type { AreasSeedResult } from "./01-areas.js"
import { diasAtras, prisma, uuidEstable } from "./_lib.js"

export type CursoCerradoSeedResult = {
  curso: Curso
  expedienteJuan: ExpedienteEntry
}

export async function seedCursoCerrado(
  areas: AreasSeedResult,
  usuarios: UsuariosSeedResult,
): Promise<CursoCerradoSeedResult> {
  const cursoId = uuidEstable("curso:cerrado_bancoww")
  const slug = "backend-java-banco-ww-2025"

  const curso = await prisma.curso.upsert({
    where: { slug },
    update: { estado: "CERRADO" },
    create: {
      id: cursoId,
      empresaCliente: "Banco WW",
      titulo: "Backend Java · Banco WW",
      slug,
      descripcion: "Curso histórico cerrado, antecedente del expediente de Juan.",
      duracionEstimada: "10 semanas",
      fechaInicio: diasAtras(280),
      deadline: diasAtras(180),
      estado: "CERRADO",
      permiteInscripcionLibre: false,
      pesoAreas: 80,
      pesoProyectoTransversal: 20,
      pesoEntrevistaIA: 0,
      pesoActividades: 70,
      pesoMiniProyecto: 30,
      umbralExcelencia: 90,
      umbralAprobado: 70,
      umbralEnDesarrollo: 50,
      umbralBrechaNoCumple: 10,
      publicadoAt: diasAtras(280),
      cerradoAt: diasAtras(178),
    },
  })

  // CursoArea histórico: Backend (peso 75, objetivo 75) + Herramientas (peso 25, objetivo 80).
  const cursoAreasSpec = [
    {
      areaKey: "backend" as const,
      peso: 75,
      puntajeObjetivo: 75,
      orden: 1,
      nombreSnapshot: "Backend",
    },
    {
      areaKey: "herramientas" as const,
      peso: 25,
      puntajeObjetivo: 80,
      orden: 2,
      nombreSnapshot: "Herramientas",
    },
  ]

  for (const ca of cursoAreasSpec) {
    await prisma.cursoArea.upsert({
      where: { cursoId_areaId: { cursoId: curso.id, areaId: areas[ca.areaKey].id } },
      update: { peso: ca.peso, puntajeObjetivo: ca.puntajeObjetivo, orden: ca.orden },
      create: {
        id: uuidEstable(`cursoArea:cerrado:${ca.areaKey}`),
        cursoId: curso.id,
        areaId: areas[ca.areaKey].id,
        peso: ca.peso,
        puntajeObjetivo: ca.puntajeObjetivo,
        orden: ca.orden,
      },
    })
  }

  // Inscripción de Juan a este curso, en estado COMPLETADA.
  const inscripcionId = uuidEstable("inscripcion:juan:cerrado_bancoww")
  await prisma.inscripcion.upsert({
    where: { id: inscripcionId },
    update: { estado: "COMPLETADA" },
    create: {
      id: inscripcionId,
      participanteId: usuarios.juan.id,
      cursoId: curso.id,
      tipo: "SOLICITUD",
      estado: "COMPLETADA",
      inscritaAt: diasAtras(280),
      completadaAt: diasAtras(178),
    },
  })

  // ExpedienteEntry de Juan (snapshot al cerrar).
  const entryId = uuidEstable("expediente:juan:bancoww")
  const expedienteJuan = await prisma.expedienteEntry.upsert({
    where: { participanteId_cursoId: { participanteId: usuarios.juan.id, cursoId: curso.id } },
    update: {},
    create: {
      id: entryId,
      participanteId: usuarios.juan.id,
      cursoId: curso.id,
      tituloCurso: "Backend Java · Banco WW",
      empresaCliente: "Banco WW",
      fechaCompletitud: diasAtras(178),
      notaGlobal: 70,
      etiqueta: "APROBADO",
      ajustadoManual: false,
      selladoAt: diasAtras(178),
    },
  })

  // Notas por área: snapshots inmutables (I25).
  const areasEntry = [
    { areaKey: "backend" as const, puntaje: 65, objetivo: 75, nombre: "Backend" },
    { areaKey: "herramientas" as const, puntaje: 85, objetivo: 80, nombre: "Herramientas" },
  ]
  for (const a of areasEntry) {
    await prisma.expedienteEntryArea.upsert({
      where: { entryId_areaId: { entryId, areaId: areas[a.areaKey].id } },
      update: {},
      create: {
        id: uuidEstable(`expedienteArea:juan:bancoww:${a.areaKey}`),
        entryId,
        areaId: areas[a.areaKey].id,
        nombreAreaSnapshot: a.nombre,
        puntaje: a.puntaje,
        cumpleUmbral: a.puntaje >= a.objetivo,
      },
    })
  }

  console.info(`  ✓ Curso CERRADO "Banco WW" + expediente de Juan sellado`)
  return { curso, expedienteJuan }
}
