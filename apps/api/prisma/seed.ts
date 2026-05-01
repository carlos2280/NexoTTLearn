import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  const adminEmail = "admin@nexott.local"
  const adminPassword = "Admin1234!"
  const passwordHash = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {},
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
    update: {},
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
