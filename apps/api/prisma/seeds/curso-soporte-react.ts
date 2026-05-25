// Curso "De Soporte a Frontend Dev" — primer curso oficial de la plataforma.
//
// Publico: equipo de soporte que da el salto a desarrollo frontend.
// Stack final: React + TypeScript + Tanstack Query.
// Filosofia: menos es mas, microvictorias, IA como copiloto, mantra "todavia no".
//
// Este archivo es paralelo a `curso.ts` (curso "Frontend para devs backend"):
// no toca skills/modulos del curso anterior. Usa rangos altos de IDs (20+) para
// evitar colisiones con el curso destacado existente.

import {
  DesbloqueoCurso,
  EstadoBloque,
  EstadoCurso,
  EstadoModulo,
  EstadoSkill,
  type Prisma,
  type PrismaClient,
  TipoBloque,
} from "@prisma/client"

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
  skillId,
  ymd,
} from "./_utils"
import type { ModuloPersistido } from "./curso"
import type { BloqueRealDef, ModuloDef } from "./modulos"
import { MODULOS_SOPORTE_REACT } from "./modulos/soporte-react"

// ============================================================================
// Skills del curso (idx 20+ para no chocar con el curso "Frontend para devs
// backend" que usa 1-10).
// ============================================================================

export interface SkillSoporteDef {
  readonly idx: number
  readonly etiqueta: string
  readonly area: "Frontend" | "DevOps Azure" | "Calidad y Testing"
  readonly notaMinima: number
}

export const SKILLS_SOPORTE_REACT: readonly SkillSoporteDef[] = [
  { idx: 20, etiqueta: "Mentalidad y entorno", area: "Frontend", notaMinima: 70 },
  { idx: 21, etiqueta: "Git como red de seguridad", area: "DevOps Azure", notaMinima: 70 },
  { idx: 22, etiqueta: "La web por dentro (HTML/CSS)", area: "Frontend", notaMinima: 70 },
  { idx: 23, etiqueta: "JavaScript moderno aplicado", area: "Frontend", notaMinima: 75 },
  { idx: 24, etiqueta: "TypeScript como diseno", area: "Frontend", notaMinima: 75 },
  { idx: 25, etiqueta: "React: pensar en componentes", area: "Frontend", notaMinima: 75 },
  {
    idx: 26,
    etiqueta: "React real con datos del servidor",
    area: "Frontend",
    notaMinima: 75,
  },
  { idx: 27, etiqueta: "IA como copiloto del dev", area: "Frontend", notaMinima: 70 },
  { idx: 28, etiqueta: "Calidad minima y entrega", area: "Calidad y Testing", notaMinima: 70 },
]

// ============================================================================
// Rangos de cursores para no chocar con el curso anterior
//   - secCursor del curso "Frontend para devs backend" llega ~22 → uso 200+.
//   - blqCursor del curso anterior llega < 1000 + IDs 9000-9015 reservados.
//     Uso 30000+ para el curso de Soporte → React.
// ============================================================================

const SEC_CURSOR_INICIO = 200
const BLQ_CURSOR_INICIO = 30000

// ============================================================================
// Constantes del curso
// ============================================================================

const CURSO_ID_INDICE = 2 // cursoId(2) — el 1 lo ocupa "Frontend para devs backend"
export const CURSO_SOPORTE_REACT_TITULO = "De Soporte a Frontend Dev"

// ID del ProyectoTransversal de este curso. Sufijo 02 para no chocar con el
// del curso "Frontend para devs backend" (sufijo 01 en _config.ts).
const ID_TRANSVERSAL_SOPORTE = "7fb00000-0000-0000-0000-000000000002"

// ============================================================================
// seedSkillsSoporteReact — registra las 9 skills del curso
// ============================================================================

export async function seedSkillsSoporteReact(
  prisma: PrismaClient,
  areaIdByNombre: ReadonlyMap<string, string>,
): Promise<ReadonlyMap<string, string>> {
  log(`Fase 5b: ${SKILLS_SOPORTE_REACT.length} skills del curso 'Soporte → React'...`)
  const out = new Map<string, string>()
  for (const s of SKILLS_SOPORTE_REACT) {
    const areaIdResolved = areaIdByNombre.get(s.area)
    if (!areaIdResolved) {
      throw new Error(`[seed-soporte] area '${s.area}' no existe.`)
    }
    const sId = skillId(s.idx)
    await prisma.skill.upsert({
      where: { id: sId },
      update: { etiquetaVisible: s.etiqueta, areaId: areaIdResolved, estado: EstadoSkill.ACTIVA },
      create: {
        id: sId,
        etiquetaVisible: s.etiqueta,
        areaId: areaIdResolved,
        estado: EstadoSkill.ACTIVA,
      },
    })
    out.set(s.etiqueta, sId)
  }
  return out
}

// ============================================================================
// seedModulosSoporteReact — inserta modulos + secciones + bloques
// (version paralela a seedModulos del curso anterior, con cursors aislados)
// ============================================================================

export async function seedModulosSoporteReact(
  prisma: PrismaClient,
  skillIdByEtiqueta: ReadonlyMap<string, string>,
): Promise<readonly ModuloPersistido[]> {
  log(
    `Fase 6c: ${MODULOS_SOPORTE_REACT.length} modulos del curso 'Soporte → React' + secciones + bloques...`,
  )
  let secCursor = SEC_CURSOR_INICIO
  let blqCursor = BLQ_CURSOR_INICIO
  const persistidos: ModuloPersistido[] = []

  for (const m of MODULOS_SOPORTE_REACT as readonly ModuloDef[]) {
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
      // 1 PARRAFO + 1 QUIZ placeholder (modulos en preparacion).
      const bloquesAUsar: readonly BloqueRealDef[] =
        s.bloques ??
        ([
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: placeholderParrafo(s.temas, `sop-m${m.idx}-s${i + 1}-parrafo`),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: s.skill,
            contenido: placeholderQuiz(s.skill, `sop-m${m.idx}-s${i + 1}-quiz`),
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
// seedCursoSoporteReact — crea el curso #2: "De Soporte a Frontend Dev"
// ============================================================================

export async function seedCursoSoporteReact(
  prisma: PrismaClient,
  clienteIdResolved: string,
  modulos: readonly ModuloPersistido[],
  skillIdByEtiqueta: ReadonlyMap<string, string>,
): Promise<string> {
  log("Fase 6d: curso 'De Soporte a Frontend Dev' + areas/skills exigidas...")
  const cId = cursoId(CURSO_ID_INDICE)
  const fechaInicio = ymd(dateNDaysAgo(5))
  const fechaDeadline = ymd(dateNDaysAhead(60))

  // Este curso SI tiene proyecto transversal (Mini Centro de Tickets, evaluado
  // como entidad separada en la plataforma). NO tiene entrevista IA: los
  // participantes ya estan contratados, no estan en proceso de filtro.
  // Pesos: 60% bloques + 40% transversal + 0% entrevista.
  // tieneEntregaACliente=false: capacitacion interna, cierra con APROBADO/NO
  // APROBADO sin fase posterior de "entrevista cliente".
  await prisma.curso.upsert({
    where: { id: cId },
    update: {
      titulo: CURSO_SOPORTE_REACT_TITULO,
      clienteId: clienteIdResolved,
      estado: EstadoCurso.ACTIVO,
      fechaInicio,
      fechaDeadline,
      desbloqueo: DesbloqueoCurso.ENCADENADO,
      toggleVoluntarios: true,
      toggleCierreAutomatico: false,
      tieneEntregaACliente: false,
      umbralNoCumple: 50,
      pesoBloques: 60,
      pesoTransversal: 40,
      pesoEntrevista: 0,
      umbralesLogro: {
        excelencia: 90,
        solido: 75,
        enDesarrollo: 60,
      } satisfies Prisma.InputJsonValue,
    },
    create: {
      id: cId,
      titulo: CURSO_SOPORTE_REACT_TITULO,
      clienteId: clienteIdResolved,
      estado: EstadoCurso.ACTIVO,
      fechaInicio,
      fechaDeadline,
      desbloqueo: DesbloqueoCurso.ENCADENADO,
      toggleVoluntarios: true,
      toggleCierreAutomatico: false,
      tieneEntregaACliente: false,
      umbralNoCumple: 50,
      pesoBloques: 60,
      pesoTransversal: 40,
      pesoEntrevista: 0,
      umbralesLogro: {
        excelencia: 90,
        solido: 75,
        enDesarrollo: 60,
      } satisfies Prisma.InputJsonValue,
    },
  })

  // Areas exigidas (peso total = 100). Frontend pesa fuerte, DevOps por Git,
  // QA por la disciplina minima del modulo 08.
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
  if (devopsId) {
    await prisma.cursoAreaExigida.create({
      data: { cursoId: cId, areaId: devopsId, peso: 15, puntajeObjetivo: 70 },
    })
  }
  if (qaId) {
    await prisma.cursoAreaExigida.create({
      data: { cursoId: cId, areaId: qaId, peso: 15, puntajeObjetivo: 70 },
    })
  }

  // Skills exigidas (las 9 del curso)
  await prisma.cursoSkillExigida.deleteMany({ where: { cursoId: cId } })
  for (const s of SKILLS_SOPORTE_REACT) {
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
  for (const [indice, m] of modulos.entries()) {
    await prisma.cursoModuloHabilitado.create({
      data: { cursoId: cId, moduloId: m.moduloId, orden: indice },
    })
  }

  // Proyecto transversal — Mini Centro de Tickets.
  // Para este publico (soporte que migra a frontend), las capas se inclinan
  // hacia lo cualitativo (50%) y la defensa (30%). Tests pesa menos (20%)
  // porque recien aprenden testing en M08 — pedir 40% seria severo.
  // Brief que ve el alumno. Se renderiza con `whitespace-pre-line` (sin HTML,
  // saltos de linea respetados). No incluir umbral, pesos ni skills: la UI los
  // muestra por separado.
  const descripcionProyecto = `Hace nueve módulos no sabías escribir un componente. Hoy te toca construir uno completo, con datos reales, calidad mínima y URL pública. Sin tutorial, sin video paso a paso, sin alguien guiándote. Solo tú, lo que aprendiste y este brief.

El Mini Centro de Tickets es una app pequeña pero honesta: hace una sola cosa y la hace bien. Es lo que en la empresa llamaríamos un MVP — lo mínimo que ya sirve. Si lo entregas bien hecho, demuestras de un golpe que sabes pensar en componentes, traer datos del servidor, mantener tipos sanos, escribir un test que valga la pena y entregar algo que vive en internet.


QUÉ TIENES QUE CONSTRUIR

Una app en React + TypeScript con esto:

  1. Una lista de tickets. Cada ticket tiene id, título, prioridad (alta, media, baja) y estado (abierto, cerrado).

  2. Un filtro por estado. El usuario puede ver solo los abiertos, solo los cerrados, o todos.

  3. Crear un ticket nuevo. Un formulario simple: título + prioridad. Al enviar, aparece en la lista.

  4. Marcar un ticket como resuelto. Un botón por ticket que lo pasa de abierto a cerrado.

  5. Estados de carga. Mientras los datos cargan, el usuario ve algo. Si algo falla, ve un mensaje claro. Nunca pantalla en blanco.

  6. Una URL pública. Deploy a Vercel. Que cualquier persona del mundo pueda abrirla.


STACK OBLIGATORIO

  · React + TypeScript (cero JavaScript suelto, todo tipado).
  · Tanstack Query para los datos (loading + error + success bien manejados).
  · Zod para validar los tipos de los tickets que vienen del mock.
  · Un test mínimo de una función pura (validar un email, calcular tiempo abierto, lo que decidas — uno bien hecho basta).
  · Deploy a Vercel desde GitHub.

Los datos vienen de un mock interno (un array en el código + setTimeout para simular latencia, igual que viste en el módulo 06). No necesitas backend real. La gracia es que Tanstack Query no nota la diferencia entre tu mock y una API real, así que aprendes el patrón correcto.


CÓMO SE VE BIEN HECHO

Cuatro señales que la IA y un dev senior van a buscar en tu repo:

  · Los componentes son chicos y hacen una sola cosa. Ninguno tiene 200 líneas. Si crece, refactoras.
  · Los tipos no mienten. Si un campo puede ser undefined, lo manejas con optional chaining o un if. Nada de "any" para salir del paso.
  · Los estados de carga existen de verdad. No solo "loading..." plano: algo que comunique que la app está viva.
  · El README tiene 5 líneas: qué hace, cómo correrlo local, cuál es la URL pública, qué decisiones tomaste, qué dejaste fuera y por qué.


ENTREGA

Cuando esté listo, pegas dos cosas:

  · La URL del repositorio en GitHub (público o con acceso).
  · Tu deploy en Vercel debe estar arriba y funcionando — la evaluación intenta abrirlo.

A los pocos minutos recibes la nota de cada capa y la global. Si pasaste el umbral, el curso queda cerrado y aprobado. Si no, puedes iterar y volver a entregar.


UNA COSA MÁS

Sin tabú: no se trata de impresionar. Se trata de que tú mismo, cuando abras esta URL en un mes, digas "esto lo hice yo, sigue funcionando, lo entiendo línea por línea". Esa es la victoria real del curso.

Nos vemos al otro lado.`

  await prisma.proyectoTransversal.upsert({
    where: { id: ID_TRANSVERSAL_SOPORTE },
    update: {
      descripcion: descripcionProyecto,
      umbralAprobacion: 70,
      pesoCapaTests: 20,
      pesoCapaCualitativa: 50,
      pesoCapaComprension: 30,
      capaTestsActiva: true,
      capaCualitativaActiva: true,
      capaComprensionActiva: true,
    },
    create: {
      id: ID_TRANSVERSAL_SOPORTE,
      cursoId: cId,
      descripcion: descripcionProyecto,
      umbralAprobacion: 70,
      capas: {
        tests: { activa: true, peso: 20 },
        cualitativa: { activa: true, peso: 50 },
        comprension: { activa: true, peso: 30 },
      } satisfies Prisma.InputJsonValue,
      pesoCapaTests: 20,
      pesoCapaCualitativa: 50,
      pesoCapaComprension: 30,
      capaTestsActiva: true,
      capaCualitativaActiva: true,
      capaComprensionActiva: true,
    },
  })

  // Skills medidas por el proyecto integrador (las 4 que el Mini Centro de
  // Tickets ejercita directamente al construirse).
  await prisma.transversalSkill.deleteMany({
    where: { transversalId: ID_TRANSVERSAL_SOPORTE },
  })
  for (const et of [
    "TypeScript como diseno",
    "React: pensar en componentes",
    "React real con datos del servidor",
    "Calidad minima y entrega",
  ]) {
    const sId = skillIdByEtiqueta.get(et)
    if (!sId) {
      continue
    }
    await prisma.transversalSkill.create({
      data: { transversalId: ID_TRANSVERSAL_SOPORTE, skillId: sId },
    })
  }

  // Vincular curso → transversal (entrevistaIaId queda null: no hay entrevista).
  await prisma.curso.update({
    where: { id: cId },
    data: { transversalId: ID_TRANSVERSAL_SOPORTE },
  })

  return cId
}
