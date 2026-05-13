import {
  AccionAjustePlan,
  AccionLogCurso,
  EstadoBloque,
  EstadoEmpleado,
  EstadoModulo,
  EstadoSkill,
  PrismaClient,
  RolAsignacion,
  RolUsuario,
  TipoBloque,
} from "@prisma/client"
import bcrypt from "bcrypt"

const FACTOR_BCRYPT = 12
const DIAS_CADUCIDAD_PASSWORD_INICIAL = 7
const MS_POR_DIA = 24 * 60 * 60 * 1000

const ADMIN_EMAIL = "admin@nexott.local"
const ADMIN_NOMBRE = "Administrador"
const ADMIN_PASSWORD = "Admin1234!"

// Catalogo P2 — IDs fijos para que el seed sea idempotente sobre modelos sin
// unique natural (Modulo, Seccion, Bloque). Areas/Skills/Clientes tienen unique
// en `nombre`/`etiquetaVisible` y se upsertan por ese campo.
const SEED_MODULO_NODE_ID = "11111111-0000-0000-0000-000000000001"
const SEED_MODULO_REACT_ID = "11111111-0000-0000-0000-000000000002"
const SEED_SECCION_NODE_1_ID = "22222222-0000-0000-0000-000000000001"
const SEED_SECCION_NODE_2_ID = "22222222-0000-0000-0000-000000000002"
const SEED_SECCION_REACT_1_ID = "22222222-0000-0000-0000-000000000003"
const SEED_SECCION_REACT_2_ID = "22222222-0000-0000-0000-000000000004"
const SEED_BLOQUE_NODE_1_ID = "33333333-0000-0000-0000-000000000001"
const SEED_BLOQUE_NODE_2_ID = "33333333-0000-0000-0000-000000000002"
const SEED_BLOQUE_REACT_1_ID = "33333333-0000-0000-0000-000000000003"
const SEED_BLOQUE_REACT_2_ID = "33333333-0000-0000-0000-000000000004"

// Slice futuro B foundation — IDs fijos para el helper `seedLogsDemo` no-prod.
const SEED_CURSO_LOGS_DEMO_ID = "66666666-0000-0000-0000-000000000001"
const SEED_COLAB_LOGS_DEMO_EMAIL = "logs-demo@nexott.local"
const SEED_ASIGNACION_LOGS_DEMO_ID = "77777777-0000-0000-0000-000000000001"
const SEED_LOG_CURSO_ID_PREFIX = "44444444-0000-0000-0000-0000000000"
const SEED_HIST_ASIG_ID_PREFIX = "55555555-0000-0000-0000-0000000000"

// P-B-b — IDs fijos para `seedLogsDemo` (no-prod).
const SEED_HIST_RENOMBRADO_ID_PREFIX = "88888888-0000-0000-0000-0000000000"
const SEED_HIST_CAMBIO_AREA_ID_PREFIX = "99999999-0000-0000-0000-0000000000"
const SEED_HIST_MODULO_ID_PREFIX = "aaaaaaaa-0000-0000-0000-0000000000"
const SEED_AJUSTE_PLAN_ID_PREFIX = "bbbbbbbb-0000-0000-0000-0000000000"

const prisma = new PrismaClient()

async function verificarConexion(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`
}

async function upsertAdmin(): Promise<void> {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, FACTOR_BCRYPT)
  const passwordInicialCaduca = new Date(Date.now() + DIAS_CADUCIDAD_PASSWORD_INICIAL * MS_POR_DIA)

  const colaborador = await prisma.colaborador.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      nombre: ADMIN_NOMBRE,
      estadoEmpleado: EstadoEmpleado.ACTIVO,
    },
    create: {
      email: ADMIN_EMAIL,
      nombre: ADMIN_NOMBRE,
      estadoEmpleado: EstadoEmpleado.ACTIVO,
    },
    select: { id: true },
  })

  await prisma.usuario.upsert({
    where: { colaboradorId: colaborador.id },
    update: {
      rol: RolUsuario.ADMIN,
    },
    create: {
      colaboradorId: colaborador.id,
      rol: RolUsuario.ADMIN,
      passwordHash,
      passwordInicialCaduca,
      requiereCambioPassword: true,
      mfaHabilitado: false,
      intentosFallidos: 0,
      bloqueado: false,
    },
    select: { id: true },
  })
}

/**
 * Seed minimo idempotente del catalogo formativo (D-CAT-10, slice P2).
 *
 * Mantiene un set base de datos reales para que los tests e2e del catalogo
 * tengan algo que listar sin tener que crearlo en cada test. Toda la operacion
 * se basa en `upsert` con clave natural (`nombre`, `etiquetaVisible`) o con
 * IDs fijos para los modelos sin unique natural (Modulo, Seccion, Bloque).
 *
 * Contenido: 2 areas, 3 skills, 2 modulos, 4 secciones, 4 bloques, 2 clientes.
 */
async function upsertCatalogoMinimo(): Promise<void> {
  const areaBackend = await prisma.area.upsert({
    where: { nombre: "Backend" },
    update: { descripcion: "Desarrollo del lado servidor." },
    create: { nombre: "Backend", descripcion: "Desarrollo del lado servidor." },
    select: { id: true },
  })
  const areaFrontend = await prisma.area.upsert({
    where: { nombre: "Frontend" },
    update: { descripcion: "Desarrollo del lado cliente." },
    create: { nombre: "Frontend", descripcion: "Desarrollo del lado cliente." },
    select: { id: true },
  })

  await prisma.skill.upsert({
    where: { etiquetaVisible: "Node.js" },
    update: { areaId: areaBackend.id, estado: EstadoSkill.ACTIVA },
    create: { etiquetaVisible: "Node.js", areaId: areaBackend.id, estado: EstadoSkill.ACTIVA },
  })
  await prisma.skill.upsert({
    where: { etiquetaVisible: "PostgreSQL" },
    update: { areaId: areaBackend.id, estado: EstadoSkill.ACTIVA },
    create: { etiquetaVisible: "PostgreSQL", areaId: areaBackend.id, estado: EstadoSkill.ACTIVA },
  })
  await prisma.skill.upsert({
    where: { etiquetaVisible: "React" },
    update: { areaId: areaFrontend.id, estado: EstadoSkill.ACTIVA },
    create: { etiquetaVisible: "React", areaId: areaFrontend.id, estado: EstadoSkill.ACTIVA },
  })

  await prisma.modulo.upsert({
    where: { id: SEED_MODULO_NODE_ID },
    update: { titulo: "Fundamentos Node", estado: EstadoModulo.ACTIVO, deletedAt: null },
    create: {
      id: SEED_MODULO_NODE_ID,
      titulo: "Fundamentos Node",
      descripcion: "Introduccion a Node.js.",
      estado: EstadoModulo.ACTIVO,
    },
  })
  await prisma.modulo.upsert({
    where: { id: SEED_MODULO_REACT_ID },
    update: { titulo: "Fundamentos React", estado: EstadoModulo.ACTIVO, deletedAt: null },
    create: {
      id: SEED_MODULO_REACT_ID,
      titulo: "Fundamentos React",
      descripcion: "Introduccion a React.",
      estado: EstadoModulo.ACTIVO,
    },
  })

  const secciones: ReadonlyArray<{
    id: string
    moduloId: string
    titulo: string
    orden: number
  }> = [
    { id: SEED_SECCION_NODE_1_ID, moduloId: SEED_MODULO_NODE_ID, titulo: "Que es Node", orden: 1 },
    {
      id: SEED_SECCION_NODE_2_ID,
      moduloId: SEED_MODULO_NODE_ID,
      titulo: "Event loop",
      orden: 2,
    },
    { id: SEED_SECCION_REACT_1_ID, moduloId: SEED_MODULO_REACT_ID, titulo: "JSX", orden: 1 },
    {
      id: SEED_SECCION_REACT_2_ID,
      moduloId: SEED_MODULO_REACT_ID,
      titulo: "Hooks",
      orden: 2,
    },
  ]
  for (const s of secciones) {
    await prisma.seccion.upsert({
      where: { id: s.id },
      update: { titulo: s.titulo, orden: s.orden, moduloId: s.moduloId },
      create: { id: s.id, titulo: s.titulo, orden: s.orden, moduloId: s.moduloId },
    })
  }

  const bloques: ReadonlyArray<{ id: string; seccionId: string }> = [
    { id: SEED_BLOQUE_NODE_1_ID, seccionId: SEED_SECCION_NODE_1_ID },
    { id: SEED_BLOQUE_NODE_2_ID, seccionId: SEED_SECCION_NODE_2_ID },
    { id: SEED_BLOQUE_REACT_1_ID, seccionId: SEED_SECCION_REACT_1_ID },
    { id: SEED_BLOQUE_REACT_2_ID, seccionId: SEED_SECCION_REACT_2_ID },
  ]
  for (const b of bloques) {
    await prisma.bloque.upsert({
      where: { id: b.id },
      update: {
        seccionId: b.seccionId,
        orden: 1,
        tipo: TipoBloque.PARRAFO,
        esEvaluable: false,
        skillQueMideId: null,
        contenido: { texto: "placeholder" },
        estado: EstadoBloque.ACTIVO,
        version: 1,
      },
      create: {
        id: b.id,
        seccionId: b.seccionId,
        orden: 1,
        tipo: TipoBloque.PARRAFO,
        esEvaluable: false,
        contenido: { texto: "placeholder" },
        estado: EstadoBloque.ACTIVO,
        version: 1,
      },
    })
  }

  await prisma.cliente.upsert({
    where: { nombre: "ACME Corp" },
    update: { activo: true, deletedAt: null },
    create: { nombre: "ACME Corp", activo: true },
  })
  await prisma.cliente.upsert({
    where: { nombre: "Internal Training" },
    update: { activo: true, deletedAt: null },
    create: { nombre: "Internal Training", activo: true },
  })
}

/**
 * Slice futuro B foundation — helper no-prod que siembra datos demo en los dos
 * visores de logs (`/admin/logs/cursos` y `/admin/logs/asignaciones`).
 *
 * Solo se ejecuta cuando `NODE_ENV !== "production"`. Idempotente: cada fila
 * se identifica por un UUID fijo con `upsert`, asi que correr el seed N veces
 * deja el estado equivalente a una sola corrida.
 *
 * Crea (si no existen):
 *   - Cliente "Demo Logs" (acepta el `unique nombre`).
 *   - Curso con UUID fijo (`SEED_CURSO_LOGS_DEMO_ID`).
 *   - Colaborador `logs-demo@nexott.local` (sin Usuario, solo para ocupar la
 *     FK de asignacion).
 *   - Asignacion (`SEED_ASIGNACION_LOGS_DEMO_ID`) sobre el curso anterior.
 *   - 10 filas `log_cambios_curso` (autor = admin).
 *   - 10 filas `historico_estados_asignacion` (autor = admin).
 */
async function seedLogsDemo(): Promise<void> {
  const admin = await prisma.usuario.findFirst({
    where: { colaborador: { email: ADMIN_EMAIL } },
    select: { id: true },
  })
  if (!admin) {
    return
  }

  const cliente = await prisma.cliente.upsert({
    where: { nombre: "Demo Logs" },
    update: { activo: true, deletedAt: null },
    create: { nombre: "Demo Logs", activo: true },
    select: { id: true },
  })

  await prisma.curso.upsert({
    where: { id: SEED_CURSO_LOGS_DEMO_ID },
    update: { titulo: "Curso demo logs", clienteId: cliente.id },
    create: {
      id: SEED_CURSO_LOGS_DEMO_ID,
      titulo: "Curso demo logs",
      clienteId: cliente.id,
      fechaInicio: new Date("2026-04-01"),
      fechaDeadline: new Date("2026-12-31"),
    },
  })

  const colabDemo = await prisma.colaborador.upsert({
    where: { email: SEED_COLAB_LOGS_DEMO_EMAIL },
    update: { nombre: "Demo Logs", estadoEmpleado: EstadoEmpleado.ACTIVO },
    create: {
      email: SEED_COLAB_LOGS_DEMO_EMAIL,
      nombre: "Demo Logs",
      estadoEmpleado: EstadoEmpleado.ACTIVO,
    },
    select: { id: true },
  })

  await prisma.asignacionCurso.upsert({
    where: { id: SEED_ASIGNACION_LOGS_DEMO_ID },
    update: {},
    create: {
      id: SEED_ASIGNACION_LOGS_DEMO_ID,
      colaboradorId: colabDemo.id,
      cursoId: SEED_CURSO_LOGS_DEMO_ID,
      rol: RolAsignacion.ASIGNADO,
      estadoAsignado: "ASIGNADO",
    },
  })

  const accionesDemo: ReadonlyArray<{
    readonly sufijo: string
    readonly accion: AccionLogCurso
    readonly motivo: string
  }> = [
    { sufijo: "01", accion: AccionLogCurso.PUBLICACION, motivo: "Publicacion inicial" },
    { sufijo: "02", accion: AccionLogCurso.CAMBIO_AREAS, motivo: "Reajuste de areas" },
    { sufijo: "03", accion: AccionLogCurso.CAMBIO_PESOS, motivo: "Pesos 60/30/10" },
    { sufijo: "04", accion: AccionLogCurso.CAMBIO_OBJETIVOS, motivo: "Nuevos objetivos" },
    { sufijo: "05", accion: AccionLogCurso.TOGGLE_TRANSVERSAL, motivo: "Activar transversal" },
    { sufijo: "06", accion: AccionLogCurso.TOGGLE_ENTREVISTA, motivo: "Activar entrevista" },
    { sufijo: "07", accion: AccionLogCurso.CAMBIO_MODULOS, motivo: "Anadir modulo Node" },
    { sufijo: "08", accion: AccionLogCurso.CIERRE, motivo: "Cierre manual" },
    { sufijo: "09", accion: AccionLogCurso.DESHACER_CIERRE, motivo: "Reapertura por error" },
    { sufijo: "0A", accion: AccionLogCurso.ARCHIVADO, motivo: "Archivado" },
  ]

  for (const a of accionesDemo) {
    const id = `${SEED_LOG_CURSO_ID_PREFIX}${a.sufijo}`
    await prisma.logCambioCurso.upsert({
      where: { id },
      update: {},
      create: {
        id,
        cursoId: SEED_CURSO_LOGS_DEMO_ID,
        autorUsuarioId: admin.id,
        accion: a.accion,
        motivo: a.motivo,
      },
    })
  }

  const transicionesDemo: ReadonlyArray<{
    readonly sufijo: string
    readonly estadoAnterior: string
    readonly estadoNuevo: string
    readonly motivo: string | null
  }> = [
    { sufijo: "01", estadoAnterior: "ASIGNADO", estadoNuevo: "EN_PROGRESO", motivo: null },
    { sufijo: "02", estadoAnterior: "EN_PROGRESO", estadoNuevo: "LISTO", motivo: null },
    { sufijo: "03", estadoAnterior: "LISTO", estadoNuevo: "APTO", motivo: "Aprobado" },
    { sufijo: "04", estadoAnterior: "APTO", estadoNuevo: "EN_PROGRESO", motivo: "Reapertura" },
    { sufijo: "05", estadoAnterior: "EN_PROGRESO", estadoNuevo: "LISTO", motivo: null },
    { sufijo: "06", estadoAnterior: "LISTO", estadoNuevo: "NO_APTO", motivo: "Bajo umbral" },
    { sufijo: "07", estadoAnterior: "NO_APTO", estadoNuevo: "EN_PROGRESO", motivo: "Plan B" },
    { sufijo: "08", estadoAnterior: "EN_PROGRESO", estadoNuevo: "LISTO", motivo: null },
    { sufijo: "09", estadoAnterior: "LISTO", estadoNuevo: "APTO", motivo: null },
    { sufijo: "0A", estadoAnterior: "APTO", estadoNuevo: "RETIRADO", motivo: "Baja voluntaria" },
  ]

  for (const t of transicionesDemo) {
    const id = `${SEED_HIST_ASIG_ID_PREFIX}${t.sufijo}`
    await prisma.historicoEstadoAsignacion.upsert({
      where: { id },
      update: {},
      create: {
        id,
        asignacionId: SEED_ASIGNACION_LOGS_DEMO_ID,
        autorUsuarioId: admin.id,
        estadoAnterior: t.estadoAnterior,
        estadoNuevo: t.estadoNuevo,
        motivo: t.motivo,
      },
    })
  }

  // P-B-b — filas demo para los 4 visores nuevos. Idempotentes por id fijo.
  const skillDemo = await prisma.skill.findFirst({
    where: { etiquetaVisible: "Node.js" },
    select: { id: true, areaId: true },
  })
  const areaAlt = await prisma.area.findFirst({
    where: { nombre: "Frontend" },
    select: { id: true },
  })
  if (skillDemo && areaAlt) {
    const renombrados: ReadonlyArray<{
      readonly sufijo: string
      readonly anterior: string
      readonly nueva: string
      readonly motivo: string | null
    }> = [
      { sufijo: "01", anterior: "Node 16", nueva: "Node 18", motivo: null },
      { sufijo: "02", anterior: "Node 18", nueva: "Node 20", motivo: "Actualizacion mayor" },
      { sufijo: "03", anterior: "Node 20", nueva: "Node.js", motivo: "Normalizacion" },
      { sufijo: "04", anterior: "Node.js v0", nueva: "Node.js", motivo: null },
      { sufijo: "05", anterior: "Node.js prev", nueva: "Node.js", motivo: null },
    ]
    for (const r of renombrados) {
      const id = `${SEED_HIST_RENOMBRADO_ID_PREFIX}${r.sufijo}`
      await prisma.historicoRenombradoSkill.upsert({
        where: { id },
        update: {},
        create: {
          id,
          skillId: skillDemo.id,
          autorUsuarioId: admin.id,
          etiquetaAnterior: r.anterior,
          etiquetaNueva: r.nueva,
          motivo: r.motivo,
        },
      })
    }

    const cambiosArea: ReadonlyArray<{ readonly sufijo: string; readonly motivo: string }> = [
      { sufijo: "01", motivo: "Reclasificacion catalogo" },
      { sufijo: "02", motivo: "Devolver al area original" },
      { sufijo: "03", motivo: "Reclasificacion definitiva" },
      { sufijo: "04", motivo: "Correccion clasificacion" },
      { sufijo: "05", motivo: "Ajuste final" },
    ]
    for (const c of cambiosArea) {
      const id = `${SEED_HIST_CAMBIO_AREA_ID_PREFIX}${c.sufijo}`
      // Alterna anterior/nueva en cada par para que el historial sea coherente.
      const par = Number.parseInt(c.sufijo, 10) % 2 === 0
      await prisma.historicoCambiosAreaSkill.upsert({
        where: { id },
        update: {},
        create: {
          id,
          skillId: skillDemo.id,
          autorUsuarioId: admin.id,
          areaAnteriorId: par ? areaAlt.id : skillDemo.areaId,
          areaNuevaId: par ? skillDemo.areaId : areaAlt.id,
          motivo: c.motivo,
        },
      })
    }
  }

  const moduloDemo = await prisma.modulo.findFirst({
    where: { titulo: "Fundamentos Node" },
    select: { id: true },
  })
  if (moduloDemo) {
    const cambiosEstado: ReadonlyArray<{
      readonly sufijo: string
      readonly anterior: EstadoModulo
      readonly nueva: EstadoModulo
      readonly motivo: string
    }> = [
      {
        sufijo: "01",
        anterior: EstadoModulo.ACTIVO,
        nueva: EstadoModulo.ARCHIVADO,
        motivo: "Archivado temporal",
      },
      {
        sufijo: "02",
        anterior: EstadoModulo.ARCHIVADO,
        nueva: EstadoModulo.ACTIVO,
        motivo: "Reactivacion",
      },
      {
        sufijo: "03",
        anterior: EstadoModulo.ACTIVO,
        nueva: EstadoModulo.ARCHIVADO,
        motivo: "Obsolescencia",
      },
      {
        sufijo: "04",
        anterior: EstadoModulo.ARCHIVADO,
        nueva: EstadoModulo.ACTIVO,
        motivo: "Vuelta a curriculum",
      },
      {
        sufijo: "05",
        anterior: EstadoModulo.ACTIVO,
        nueva: EstadoModulo.ARCHIVADO,
        motivo: "Cierre definitivo",
      },
    ]
    for (const c of cambiosEstado) {
      const id = `${SEED_HIST_MODULO_ID_PREFIX}${c.sufijo}`
      await prisma.historicoEstadoModulo.upsert({
        where: { id },
        update: {},
        create: {
          id,
          moduloId: moduloDemo.id,
          autorUsuarioId: admin.id,
          estadoAnterior: c.anterior,
          estadoNuevo: c.nueva,
          motivo: c.motivo,
        },
      })
    }
  }

  // PlanEstudio sobre la asignacion demo (relacion 1:1 por asignacion_id unique).
  const planDemo = await prisma.planEstudio.upsert({
    where: { asignacionId: SEED_ASIGNACION_LOGS_DEMO_ID },
    update: {},
    create: { asignacionId: SEED_ASIGNACION_LOGS_DEMO_ID },
    select: { id: true },
  })
  const ajustesDemo: ReadonlyArray<{
    readonly sufijo: string
    readonly accion: AccionAjustePlan
    readonly motivo: string
  }> = [
    { sufijo: "01", accion: AccionAjustePlan.AGREGAR, motivo: "Anadir seccion Node" },
    { sufijo: "02", accion: AccionAjustePlan.QUITAR, motivo: "Retirar seccion duplicada" },
    { sufijo: "03", accion: AccionAjustePlan.EXIMIR, motivo: "Exencion por experiencia" },
    { sufijo: "04", accion: AccionAjustePlan.CAMBIAR_CARACTER, motivo: "Pasar a opcional" },
    { sufijo: "05", accion: AccionAjustePlan.AGREGAR, motivo: "Refuerzo de fundamentos" },
  ]
  for (const a of ajustesDemo) {
    const id = `${SEED_AJUSTE_PLAN_ID_PREFIX}${a.sufijo}`
    await prisma.ajustePlan.upsert({
      where: { id },
      update: {},
      create: {
        id,
        planId: planDemo.id,
        autorUsuarioId: admin.id,
        accion: a.accion,
        motivo: a.motivo,
      },
    })
  }
}

async function main(): Promise<number> {
  const args = process.argv.slice(2)

  if (args.includes("--reset")) {
    process.stderr.write("El reset destructivo se hace con `make db-reset` antes de seed\n")
    return 1
  }

  try {
    await verificarConexion()
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error)
    process.stderr.write(`No se pudo conectar a la base de datos: ${mensaje}\n`)
    return 1
  }

  await upsertAdmin()
  await upsertCatalogoMinimo()
  if (process.env.NODE_ENV !== "production") {
    await seedLogsDemo()
  }
  process.stdout.write(
    `Seed completado: ${ADMIN_EMAIL} (rol ADMIN, requiere cambio de password) + catalogo minimo P2\n`,
  )
  return 0
}

main()
  .then((code) => {
    process.exitCode = code
  })
  .catch((error) => {
    const mensaje = error instanceof Error ? error.message : String(error)
    process.stderr.write(`${mensaje}\n`)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
