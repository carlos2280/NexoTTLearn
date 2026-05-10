/**
 * Cursos auxiliares para cubrir casos borde:
 *  - "intro-react-libre"   · ACTIVO con permiteInscripcionLibre=true (catálogo libre).
 *                            Inscripción LIBRE → todas las asignaciones OPCIONAL (I9).
 *  - "preview-data-eng"    · BORRADOR sin candidatos (testing de hard-delete §5.3).
 *  - "duplicado-xyz"       · BORRADOR clonado del curso XYZ (testing §3.7, §6.5).
 */
import type { Curso } from "@prisma/client"
import type { AreasSeedResult } from "./01-areas.js"
import { diasAtras, prisma, uuidEstable } from "./_lib.js"

export type CursosAuxResult = {
  cursoLibre: Curso
  cursoBorrador: Curso
  cursoDuplicadoXyz: Curso
}

export async function seedCursosAuxiliares(
  areas: AreasSeedResult,
  cursoXyzId: string,
): Promise<CursosAuxResult> {
  const cursoLibre = await crearCursoLibre(areas)
  const cursoBorrador = await crearCursoBorrador()
  const cursoDuplicadoXyz = await crearCursoDuplicadoXyz(cursoXyzId)

  console.info("  ✓ Cursos auxiliares: 1 LIBRE activo, 1 BORRADOR, 1 duplicado XYZ")
  return { cursoLibre, cursoBorrador, cursoDuplicadoXyz }
}

async function crearCursoLibre(areas: AreasSeedResult): Promise<Curso> {
  const cursoId = uuidEstable("curso:libre")
  const slug = "intro-react-catalogo-libre"

  const curso = await prisma.curso.upsert({
    where: { slug },
    update: { estado: "ACTIVO", permiteInscripcionLibre: true },
    create: {
      id: cursoId,
      empresaCliente: "NexoTT (catálogo libre)",
      titulo: "Introducción a React (catálogo libre)",
      slug,
      descripcion: "Curso autoguiado para participantes que se inscriben libremente.",
      duracionEstimada: "3 semanas",
      estado: "ACTIVO",
      permiteInscripcionLibre: true,
      pesoAreas: 100,
      pesoProyectoTransversal: 0,
      pesoEntrevistaIA: 0,
      pesoActividades: 100,
      pesoMiniProyecto: 0,
      umbralExcelencia: 90,
      umbralAprobado: 70,
      umbralEnDesarrollo: 50,
      umbralBrechaNoCumple: 10,
      publicadoAt: diasAtras(30),
    },
  })

  // Una sola área (Frontend) con peso 100.
  await prisma.cursoArea.upsert({
    where: { cursoId_areaId: { cursoId: curso.id, areaId: areas.frontend.id } },
    update: { peso: 100, puntajeObjetivo: 60, orden: 1 },
    create: {
      id: uuidEstable("cursoArea:libre:frontend"),
      cursoId: curso.id,
      areaId: areas.frontend.id,
      peso: 100,
      puntajeObjetivo: 60,
      orden: 1,
    },
  })

  // Un módulo simple sin mini-proyecto.
  const moduloId = uuidEstable("modulo:libre:react")
  await prisma.modulo.upsert({
    where: { id: moduloId },
    update: {},
    create: {
      id: moduloId,
      cursoId: curso.id,
      areaId: areas.frontend.id,
      titulo: "React desde cero",
      descripcion: "Un módulo introductorio autoguiado.",
      orden: 1,
      miniProyectoActivo: false,
    },
  })

  const seccionId = uuidEstable("seccion:libre:intro")
  await prisma.seccion.upsert({
    where: { id: seccionId },
    update: { titulo: "Hola React" },
    create: { id: seccionId, moduloId, titulo: "Hola React", orden: 1 },
  })

  const bloqueId = uuidEstable("bloque:libre:intro:0")
  await prisma.bloque.upsert({
    where: { id: bloqueId },
    update: {},
    create: {
      id: bloqueId,
      seccionId,
      tipo: "PARRAFO",
      orden: 1,
      payload: {
        contenidoTiptap: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Bienvenido. React se basa en componentes." }],
            },
          ],
        },
      },
    },
  })

  return curso
}

function crearCursoBorrador(): Promise<Curso> {
  const cursoId = uuidEstable("curso:borrador")
  const slug = "preview-data-engineering"

  return prisma.curso.upsert({
    where: { slug },
    update: { estado: "BORRADOR" },
    create: {
      id: cursoId,
      empresaCliente: "Cliente por confirmar",
      titulo: "Data Engineering — preview",
      slug,
      descripcion: "Curso en BORRADOR sin candidatos, sirve para testar hard-delete.",
      duracionEstimada: "6 semanas",
      estado: "BORRADOR",
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
      // Sin CursoArea ni módulos: estado mínimo de borrador recién creado.
    },
  })
}

function crearCursoDuplicadoXyz(cursoXyzId: string): Promise<Curso> {
  const cursoId = uuidEstable("curso:duplicado_xyz")
  const slug = "fullstack-empresa-xyz-2026q3-copia"

  return prisma.curso.upsert({
    where: { slug },
    update: { estado: "BORRADOR" },
    create: {
      id: cursoId,
      empresaCliente: "Empresa XYZ (duplicado)",
      titulo: "Fullstack Developer · Empresa XYZ (copia)",
      slug,
      descripcion: "Duplicado en BORRADOR del curso XYZ original. Ver `duplicadoDeId`.",
      duracionEstimada: "8 semanas",
      estado: "BORRADOR",
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
      duplicadoDeId: cursoXyzId,
    },
  })
}
