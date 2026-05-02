/**
 * Activa el flag `mfaEnabled=true` al participante de seed para pruebas.
 *
 * Uso:
 *   pnpm db:setup-mfa-test
 *
 * Tras ejecutar esto, el siguiente login del participante disparara el flujo
 * de setup MFA (escanear QR + confirmar codigo). El backend genera el secret;
 * este script NO conoce ni guarda secretos.
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main(): Promise<void> {
  const email = "participante@nexott.local"

  const usuario = await prisma.usuario.update({
    where: { email },
    data: {
      mfaEnabled: true,
      mfaSecret: null,
      mfaConfirmadoEn: null,
    },
  })

  console.info("")
  console.info("✓ MFA habilitado para:", usuario.email)
  console.info("")
  console.info("  En el proximo login se mostrara el QR para escanear.")
  console.info("")
  console.info("  Credenciales:")
  console.info("    Email:    participante@nexott.local")
  console.info("    Password: Participante1234!")
  console.info("")
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
