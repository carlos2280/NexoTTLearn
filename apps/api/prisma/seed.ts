import {
  EstadoBloque,
  EstadoEmpleado,
  EstadoModulo,
  EstadoSkill,
  PrismaClient,
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
