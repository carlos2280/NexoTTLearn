import { EstadoEmpleado, PrismaClient, RolUsuario } from "@prisma/client"
import bcrypt from "bcrypt"

const FACTOR_BCRYPT = 12
const DIAS_CADUCIDAD_PASSWORD_INICIAL = 7
const MS_POR_DIA = 24 * 60 * 60 * 1000

const ADMIN_EMAIL = "admin@nexott.local"
const ADMIN_NOMBRE = "Administrador"
const ADMIN_PASSWORD = "Admin1234!"

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
  process.stdout.write(`Seed completado: ${ADMIN_EMAIL} (rol ADMIN, requiere cambio de password)\n`)
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
