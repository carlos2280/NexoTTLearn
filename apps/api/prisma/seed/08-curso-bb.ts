/**
 * Curso ACTIVO "Data Analyst · Empresa BB" — seed ligero para testing del hub de diagnóstico.
 *
 * Objetivo: que el hub /admin/diagnostico muestre ≥2 tarjetas y el auto-redirect no oculte el hub.
 *
 * Características intencionadas:
 *  - 3 áreas (Backend, BD, Cloud) con pesos simples.
 *  - Sin bloques de contenido (no hace falta para probar diagnóstico).
 *  - 2 inscripciones ACTIVAS, sin evaluación inicial → estadoDiagnostico = "pendiente".
 *  - Deadline en 21 días (deadline menos urgente que XYZ).
 */
import type { AreasSeedResult } from "./01-areas.js"
import { diasAtras, prisma, suma2dec, uuidEstable } from "./_lib.js"

const CURSO_SLUG = "data-analyst-empresa-bb-2026q3"

export async function seedCursoBb(areas: AreasSeedResult): Promise<{ cursoId: string }> {
  const cursoId = uuidEstable("curso:bb")

  const sumaPesos = suma2dec([40, 35, 25])
  if (sumaPesos !== 100) {
    throw new Error(`I7 violado en CursoArea BB: suma=${sumaPesos}`)
  }

  await prisma.curso.upsert({
    where: { slug: CURSO_SLUG },
    update: { estado: "ACTIVO", publicadoAt: diasAtras(10) },
    create: {
      id: cursoId,
      empresaCliente: "Empresa BB",
      titulo: "Data Analyst · Empresa BB",
      slug: CURSO_SLUG,
      descripcion: "Programa de análisis de datos para perfiles seleccionados de Empresa BB.",
      duracionEstimada: "6 semanas",
      fechaInicio: diasAtras(10),
      deadline: diasAtras(-21),
      estado: "ACTIVO",
      permiteInscripcionLibre: false,
      pesoAreas: 70,
      pesoProyectoTransversal: 20,
      pesoEntrevistaIA: 10,
      pesoActividades: 70,
      pesoMiniProyecto: 30,
      umbralExcelencia: 90,
      umbralAprobado: 70,
      umbralEnDesarrollo: 50,
      umbralBrechaNoCumple: 10,
      publicadoAt: diasAtras(10),
    },
  })

  const areasSpec = [
    { areaKey: "backend" as const, peso: 40, puntajeObjetivo: 70, orden: 1 },
    { areaKey: "bd" as const, peso: 35, puntajeObjetivo: 70, orden: 2 },
    { areaKey: "cloud" as const, peso: 25, puntajeObjetivo: 60, orden: 3 },
  ]

  for (const ca of areasSpec) {
    await prisma.cursoArea.upsert({
      where: { cursoId_areaId: { cursoId, areaId: areas[ca.areaKey].id } },
      update: { peso: ca.peso, puntajeObjetivo: ca.puntajeObjetivo, orden: ca.orden },
      create: {
        id: uuidEstable(`cursoArea:bb:${ca.areaKey}`),
        cursoId,
        areaId: areas[ca.areaKey].id,
        peso: ca.peso,
        puntajeObjetivo: ca.puntajeObjetivo,
        orden: ca.orden,
      },
    })
  }

  // Módulo mínimo por área (necesario para que las asignaciones tengan destino)
  const modulosSpec = [
    { key: "bb_be", areaKey: "backend" as const, titulo: "Python & PySpark", orden: 1 },
    { key: "bb_bd", areaKey: "bd" as const, titulo: "SQL & NoSQL", orden: 2 },
    { key: "bb_cl", areaKey: "cloud" as const, titulo: "Azure Data Factory", orden: 3 },
  ]

  for (const m of modulosSpec) {
    await prisma.modulo.upsert({
      where: { id: uuidEstable(`modulo:${m.key}`) },
      update: { titulo: m.titulo, orden: m.orden },
      create: {
        id: uuidEstable(`modulo:${m.key}`),
        cursoId,
        areaId: areas[m.areaKey].id,
        titulo: m.titulo,
        descripcion: "",
        orden: m.orden,
        miniProyectoActivo: false,
      },
    })
  }

  // 2 inscripciones ACTIVAS sin evaluación inicial → hub las muestra como pendientes
  const candidatos = [
    { key: "bb:luis", nombre: "Luis", apellido: "Vega", email: "luis.vega@bb.local" },
    { key: "bb:sofia", nombre: "Sofía", apellido: "Torres", email: "sofia.torres@bb.local" },
  ]

  for (const c of candidatos) {
    const usuarioId = uuidEstable(`usuario:${c.key}`)
    await prisma.usuario.upsert({
      where: { email: c.email },
      update: {},
      create: {
        id: usuarioId,
        email: c.email,
        nombre: c.nombre,
        apellido: c.apellido,
        rol: "PARTICIPANTE",
        passwordHash: "$2b$12$placeholderHashForBbCandidatos000000000000000",
        debeCambiarPassword: true,
      },
    })

    await prisma.inscripcion.upsert({
      where: { id: uuidEstable(`inscripcion:${c.key}`) },
      update: { estado: "ACTIVA" },
      create: {
        id: uuidEstable(`inscripcion:${c.key}`),
        participanteId: usuarioId,
        cursoId,
        tipo: "SOLICITUD",
        estado: "ACTIVA",
        inscritaAt: diasAtras(5),
      },
    })
  }

  console.info(
    "  ✓ Curso BB ACTIVO: 3 áreas, 3 módulos, 2 candidatos sin eval inicial (hub pendiente)",
  )
  return { cursoId }
}
