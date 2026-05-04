import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  const adminEmail = "admin@nexott.local"
  const adminPassword = "Admin1234!"
  const passwordHash = await bcrypt.hash(adminPassword, 12)

  // En seed reseteamos siempre a estado inicial (idempotente para dev local).
  // Esto permite re-ejecutar `pnpm db:seed` y volver al flujo de "primer acceso".
  const admin = await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      debeCambiarPassword: true,
      activo: true,
      intentosFallidos: 0,
      bloqueadoHasta: null,
    },
    create: {
      email: adminEmail,
      nombre: "Admin",
      apellido: "NexoTT",
      passwordHash,
      rol: "ADMIN",
      debeCambiarPassword: true,
      activo: true,
    },
  })

  const participanteEmail = "participante@nexott.local"
  // biome-ignore lint/nursery/noSecrets: password de seed para dev local, no es secreto real
  const participantePassword = "Participante1234!"
  const participanteHash = await bcrypt.hash(participantePassword, 12)

  const participante = await prisma.usuario.upsert({
    where: { email: participanteEmail },
    update: {
      passwordHash: participanteHash,
      debeCambiarPassword: true,
      activo: true,
      intentosFallidos: 0,
      bloqueadoHasta: null,
    },
    create: {
      email: participanteEmail,
      nombre: "Carlos",
      apellido: "Fuentes",
      passwordHash: participanteHash,
      rol: "PARTICIPANTE",
      debeCambiarPassword: true,
      activo: true,
    },
  })

  // ────────────────────────────────────────────────────────────────
  // Areas de competencia (catalogo inicial). Idempotente via upsert por
  // nombre (es @unique en el schema). Mantener color sincronizado con
  // areaColorSchema en packages/shared-types/src/admin-modulos.ts.
  // ────────────────────────────────────────────────────────────────
  const areas = [
    {
      nombre: "Frontend",
      color: "indigo",
      orden: 1,
      descripcion: "Interfaces, UX, frameworks web",
    },
    {
      nombre: "Backend",
      color: "emerald",
      orden: 2,
      descripcion: "APIs, servicios, persistencia",
    },
    {
      nombre: "Cloud",
      color: "cyan",
      orden: 3,
      descripcion: "Infraestructura, despliegues, escalabilidad",
    },
    {
      nombre: "DevOps",
      color: "amber",
      orden: 4,
      descripcion: "CI/CD, observabilidad, operacion",
    },
    {
      nombre: "Datos",
      color: "violet",
      orden: 5,
      descripcion: "Bases de datos, analitica, ETL",
    },
    {
      nombre: "Mobile",
      color: "rose",
      orden: 6,
      descripcion: "iOS, Android, multiplataforma",
    },
  ] as const

  for (const a of areas) {
    await prisma.areaCompetencia.upsert({
      where: { nombre: a.nombre },
      update: { color: a.color, orden: a.orden, descripcion: a.descripcion },
      create: a,
    })
  }
  console.info(`Seed: ${areas.length} areas de competencia upserted.`)

  console.info("Seed completo.")
  console.info(`Admin: ${admin.email} / ${adminPassword}`)
  console.info(`Participante: ${participante.email} / ${participantePassword}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
