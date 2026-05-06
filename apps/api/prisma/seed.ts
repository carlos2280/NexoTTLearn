import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

/**
 * Seed mínimo provisional · PR-01 schema v2.
 *
 * Cubre solo lo imprescindible para arrancar dev tras el reset:
 *   - 1 admin (login + flujo "primer acceso").
 *   - 1 participante.
 *   - 6 áreas del catálogo global (mantienen colores del DS).
 *
 * Datos de prueba ricos (cursos, módulos, inscripciones) llegarán en PR-03,
 * cuando los servicios de aplicación estén reescritos contra el modelo v2.
 */

const prisma = new PrismaClient()

async function main() {
  await seedUsuarios()
  await seedAreas()
  console.info("Seed completo.")
}

async function seedUsuarios() {
  const adminEmail = "admin@nexott.local"
  const adminPassword = "Admin1234!"
  const adminHash = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminHash,
      debeCambiarPassword: true,
      bloqueado: false,
      bloqueadoHasta: null,
      intentosFallidos: 0,
    },
    create: {
      email: adminEmail,
      nombre: "Admin",
      apellido: "NexoTT",
      passwordHash: adminHash,
      rol: "ADMIN",
      debeCambiarPassword: true,
    },
  })

  const participanteEmail = "participante@nexott.local"
  // biome-ignore lint/nursery/noSecrets: password de seed para dev local
  const participantePassword = "Participante1234!"
  const participanteHash = await bcrypt.hash(participantePassword, 12)

  const participante = await prisma.usuario.upsert({
    where: { email: participanteEmail },
    update: {
      passwordHash: participanteHash,
      debeCambiarPassword: true,
      bloqueado: false,
      bloqueadoHasta: null,
      intentosFallidos: 0,
    },
    create: {
      email: participanteEmail,
      nombre: "Carlos",
      apellido: "Fuentes",
      passwordHash: participanteHash,
      rol: "PARTICIPANTE",
      debeCambiarPassword: true,
    },
  })

  console.info(`Admin:        ${admin.email} / ${adminPassword}`)
  console.info(`Participante: ${participante.email} / ${participantePassword}`)
}

async function seedAreas() {
  const areas = [
    {
      nombre: "Frontend",
      color: "indigo",
      orden: 1,
      descripcion: "Interfaces, UX, frameworks web",
    },
    { nombre: "Backend", color: "emerald", orden: 2, descripcion: "APIs, servicios, persistencia" },
    {
      nombre: "Cloud",
      color: "cyan",
      orden: 3,
      descripcion: "Infraestructura, despliegues, escalabilidad",
    },
    { nombre: "DevOps", color: "amber", orden: 4, descripcion: "CI/CD, observabilidad, operación" },
    { nombre: "Datos", color: "violet", orden: 5, descripcion: "Bases de datos, analítica, ETL" },
    { nombre: "Mobile", color: "rose", orden: 6, descripcion: "iOS, Android, multiplataforma" },
  ] as const

  for (const a of areas) {
    await prisma.area.upsert({
      where: { nombre: a.nombre },
      update: { color: a.color, orden: a.orden, descripcion: a.descripcion },
      create: a,
    })
  }
  console.info(`Áreas upserted: ${areas.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
