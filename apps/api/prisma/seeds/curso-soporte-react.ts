// Curso "Frontend desde Cero: Mentalidad, Codigo y Confianza" — primer curso
// oficial de la plataforma NexoTT Learn.
//
// Publico: profesionales sin experiencia previa en frontend (tipicamente
// soporte, QA manual o backend liviano) que dan el salto a React + TS.
// Stack final: React + TypeScript + Tanstack Query.
// Filosofia: menos es mas, microvictorias, IA como copiloto, mantra "todavia no".
//
// Unico curso vivo del seed. IDs en rango 20+ por compatibilidad historica con
// las migraciones existentes (antes convivia con un curso placeholder).

import {
  CaracterItemPlan,
  DesbloqueoCurso,
  EstadoAsignado,
  EstadoBloque,
  EstadoCurso,
  EstadoModulo,
  EstadoSkill,
  type Prisma,
  type PrismaClient,
  RazonItemPlan,
  RolAsignacion,
  TipoBloque,
} from "@prisma/client"

import {
  asigId,
  bloqueId,
  cursoId,
  dateNDaysAgo,
  dateNDaysAhead,
  log,
  moduloId,
  partId,
  placeholderParrafo,
  placeholderQuiz,
  planId,
  seccionId,
  skillId,
  ymd,
} from "./_utils"
import { PARTICIPANTES } from "./catalogo"
import { MODULOS_SOPORTE_REACT } from "./modulos/soporte-react"
import type { BloqueRealDef, ModuloDef, ModuloPersistido } from "./modulos/types"

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

const CURSO_ID_INDICE = 2 // cursoId(2) por compatibilidad con migraciones previas.
export const CURSO_SOPORTE_REACT_TITULO = "Frontend desde Cero: Mentalidad, Codigo y Confianza"

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
// seedModulosSoporteReact — inserta modulos + secciones + bloques.
// Los cursors arrancan en rangos altos (SEC 200+, BLQ 30000+) por
// compatibilidad con IDs reservados en migraciones previas.
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

      // Resetea los bloques de la seccion antes de sembrar: el orden de los
      // bloques cambia cuando se anaden/quitan piezas, y los IDs por cursor
      // se desplazan. Sin esta limpieza, un re-seed que altera el largo de
      // una seccion revienta con `Unique(seccion_id, orden)` al chocar con
      // los bloques previos.
      // IntentoBloque.bloque tiene onDelete: Restrict, asi que un solo
      // intento vivo bloquea el deleteMany. En el seed de QA esto no
      // deberia ocurrir, pero pasa si un dev exploro el inmersivo antes
      // de re-seedear. Cascada manual: borrar intentos primero. Es seguro
      // porque este seeder solo corre en local; en produccion no se ejecuta.
      await prisma.intentoBloque.deleteMany({
        where: { bloque: { seccionId: sId } },
      })
      await prisma.bloque.deleteMany({ where: { seccionId: sId } })

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
// seedCursoSoporteReact — crea el curso "Frontend desde Cero"
// ============================================================================

export async function seedCursoSoporteReact(
  prisma: PrismaClient,
  clienteIdResolved: string,
  modulos: readonly ModuloPersistido[],
  skillIdByEtiqueta: ReadonlyMap<string, string>,
): Promise<string> {
  log("Fase 6d: curso 'Frontend desde Cero' + areas/skills exigidas...")
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
  // Brief que ve el alumno. Se renderiza con Tiptap (HTML sanitizado) en
  // vista-brief-transversal.tsx. No incluir umbral, pesos ni skills: la UI
  // los muestra por separado.
  const descripcionProyecto = `<p>Hace nueve módulos no sabías escribir un componente. Hoy te toca construir uno completo, con datos reales, calidad mínima y URL pública. Sin tutorial, sin video paso a paso, sin alguien guiándote. Solo tú, lo que aprendiste y este brief.</p>
<p>El <strong>Mini Centro de Tickets</strong> es una app pequeña pero honesta: hace una sola cosa y la hace bien. Es lo que en la empresa llamaríamos un <strong>MVP</strong> — lo mínimo que ya sirve. Si lo entregas bien hecho, demuestras de un golpe que sabes pensar en componentes, traer datos del servidor, mantener tipos sanos, escribir un test que valga la pena y entregar algo que vive en internet.</p>
<h3>Qué tienes que construir</h3>
<p>Una app en <strong>React + TypeScript</strong> con esto:</p>
<ol>
  <li><strong>Una lista de tickets.</strong> Cada ticket tiene <code>id</code>, <code>título</code>, <code>prioridad</code> (alta, media, baja) y <code>estado</code> (abierto, cerrado).</li>
  <li><strong>Un filtro por estado.</strong> El usuario puede ver solo los abiertos, solo los cerrados, o todos.</li>
  <li><strong>Crear un ticket nuevo.</strong> Un formulario simple: título + prioridad. Al enviar, aparece en la lista.</li>
  <li><strong>Marcar un ticket como resuelto.</strong> Un botón por ticket que lo pasa de <em>abierto</em> a <em>cerrado</em>.</li>
  <li><strong>Estados de carga.</strong> Mientras los datos cargan, el usuario ve algo. Si algo falla, ve un mensaje claro. <em>Nunca pantalla en blanco.</em></li>
  <li><strong>Una URL pública.</strong> Deploy a Vercel. Que cualquier persona del mundo pueda abrirla.</li>
</ol>
<h3>Stack obligatorio</h3>
<ul>
  <li><strong>React + TypeScript</strong> (cero JavaScript suelto, todo tipado).</li>
  <li><strong>Tanstack Query</strong> para los datos (loading + error + success bien manejados).</li>
  <li><strong>Zod</strong> para validar los tipos de los tickets que vienen del mock.</li>
  <li><strong>Un test mínimo</strong> de una función pura (validar un email, calcular tiempo abierto, lo que decidas — uno bien hecho basta).</li>
  <li><strong>Deploy a Vercel</strong> desde GitHub.</li>
</ul>
<p>Los datos vienen de un mock interno (un array en el código + <code>setTimeout</code> para simular latencia, igual que viste en el módulo 06). No necesitas backend real. La gracia es que <strong>Tanstack Query no nota la diferencia</strong> entre tu mock y una API real, así que aprendes el patrón correcto.</p>
<h3>Cómo se ve bien hecho</h3>
<p>Cuatro señales que la IA y un dev senior van a buscar en tu repo:</p>
<ul>
  <li><strong>Los componentes son chicos y hacen una sola cosa.</strong> Ninguno tiene 200 líneas. Si crece, refactoras.</li>
  <li><strong>Los tipos no mienten.</strong> Si un campo puede ser <code>undefined</code>, lo manejas con <em>optional chaining</em> o un <code>if</code>. Nada de <code>any</code> para salir del paso.</li>
  <li><strong>Los estados de carga existen de verdad.</strong> No solo "loading..." plano: algo que comunique que la app está viva.</li>
  <li><strong>El README tiene 5 líneas:</strong> qué hace, cómo correrlo local, cuál es la URL pública, qué decisiones tomaste, qué dejaste fuera y por qué.</li>
</ul>
<h3>Entrega</h3>
<p>Cuando esté listo, pegas dos cosas:</p>
<ul>
  <li>La <strong>URL del repositorio</strong> en GitHub (público o con acceso).</li>
  <li>Tu <strong>deploy en Vercel</strong> debe estar arriba y funcionando — la evaluación intenta abrirlo.</li>
</ul>
<p>A los pocos minutos recibes la nota de cada capa y la global. Si pasaste el umbral, el curso queda cerrado y aprobado. Si no, puedes iterar y volver a entregar.</p>
<h3>Una cosa más</h3>
<p>Sin tabú: <em>no se trata de impresionar.</em> Se trata de que tú mismo, cuando abras esta URL en un mes, digas <em>"esto lo hice yo, sigue funcionando, lo entiendo línea por línea".</em> Esa es la victoria real del curso.</p>
<p><strong>Nos vemos al otro lado.</strong></p>`

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

// ============================================================================
// seedInscripcionSoporte — inscribe al(los) participante(s) de prueba al curso
// y deja un PlanEstudio listo (1 item por seccion del curso, todas obligatorias).
//
// El plan tiene que existir desde el seed: el endpoint que abre el curso
// (`GET /asignaciones/:id/plan`) responde 404 PLAN_NO_ENCONTRADO si no
// existe, y el participante quedaria bloqueado en la pantalla de "Mi curso".
// ============================================================================

export async function seedInscripcionSoporte(
  prisma: PrismaClient,
  cursoIdResolved: string,
  modulos: readonly ModuloPersistido[],
): Promise<void> {
  log(`Fase 7: ${PARTICIPANTES.length} inscripcion(es) al curso 'Frontend desde Cero'...`)

  const itemsPorPlan: ReadonlyArray<{ readonly moduloId: string; readonly seccionId: string }> =
    modulos.flatMap((m) =>
      m.secciones.map((s) => ({ moduloId: m.moduloId, seccionId: s.seccionId })),
    )

  for (const p of PARTICIPANTES) {
    const aId = asigId(p.idx)
    const colaboradorIdResolved = partId(p.idx)

    await prisma.asignacionCurso.upsert({
      where: { id: aId },
      update: {
        rol: RolAsignacion.ASIGNADO,
        estadoAsignado: EstadoAsignado.ASIGNADO,
        estadoVoluntario: null,
        origenVoluntario: null,
      },
      create: {
        id: aId,
        colaboradorId: colaboradorIdResolved,
        cursoId: cursoIdResolved,
        rol: RolAsignacion.ASIGNADO,
        estadoAsignado: EstadoAsignado.ASIGNADO,
        fechaInicio: dateNDaysAgo(2),
      },
    })

    const pId = planId(p.idx)
    await prisma.planEstudio.upsert({
      where: { id: pId },
      update: {
        fichaSnapshot: { sembrado: "seed-soporte" } satisfies Prisma.InputJsonValue,
        estaDesactualizado: false,
      },
      create: {
        id: pId,
        asignacionId: aId,
        fichaSnapshot: { sembrado: "seed-soporte" } satisfies Prisma.InputJsonValue,
        estaDesactualizado: false,
      },
    })

    // Rehacer items en cada seed: garantiza coherencia tras cambios de modulo
    // (alta/baja de secciones). El plan vive con `onDelete: Cascade`, pero
    // basta con borrar items: el plan sigue.
    await prisma.itemPlan.deleteMany({ where: { planId: pId } })
    for (const item of itemsPorPlan) {
      await prisma.itemPlan.create({
        data: {
          planId: pId,
          moduloId: item.moduloId,
          seccionId: item.seccionId,
          caracter: CaracterItemPlan.OBLIGATORIA,
          razon: RazonItemPlan.SKILL_FALTANTE,
        },
      })
    }
  }
}
