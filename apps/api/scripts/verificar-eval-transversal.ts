/**
 * Script de verificación MANUAL del motor de evaluación transversal. NO se ejecuta
 * en la app, ni en CI, ni en ningún cron — solo cuando lo invocas a mano. Comprueba
 * de punta a punta la evaluación cualitativa: descarga un repo público real
 * (RepoFetchService), lo empaqueta y se lo pasa a la IA (AiService: mock o Claude
 * según .env). Útil para re-probar el motor tras cambios.
 *
 * Boot mínimo: solo ConfigModule + AiModule + RepoFetchModule (no Prisma ni
 * crons ni HTTP), así que no toca la base de datos.
 *
 * Uso:
 *   pnpm --dir apps/api exec tsx scripts/verificar-eval-transversal.ts [repoUrl]
 *
 * Con AI_PROVIDER=claude + AI_API_KEY en .env hace una llamada REAL a Claude
 * (tiene coste). Recomendado además AI_MODEL_OVERRIDE=claude-sonnet-5 (el default
 * sonnet-4-6 puede estar desactualizado).
 */
import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { NestFactory } from "@nestjs/core"
import { AiModule } from "../src/common/ai/ai.module"
import { AiService } from "../src/common/ai/ai.service"
import { RepoFetchModule } from "../src/common/repo-fetch/repo-fetch.module"
import { RepoFetchService } from "../src/common/repo-fetch/repo-fetch.service"
import { validateEnv } from "../src/config/env.validation"

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv }),
    AiModule,
    RepoFetchModule,
  ],
})
class VerificacionModule {}

async function main(): Promise<void> {
  const repoUrl = process.argv[2] ?? "https://github.com/sindresorhus/is-odd"
  const app = await NestFactory.createApplicationContext(VerificacionModule, {
    logger: ["error", "warn", "log"],
  })
  try {
    const repoFetch = app.get(RepoFetchService, { strict: false })
    const ai = app.get(AiService, { strict: false })

    console.log(`\n[verificar] provider=${ai.providerName} repo=${repoUrl}\n`)

    const repo = await repoFetch.descargarYEmpaquetar(repoUrl)
    console.log(
      `[verificar] empaquetado: archivos=${repo.archivosIncluidos} bytes=${repo.bytesTotales} truncado=${repo.truncado}`,
    )

    const res = await ai.evaluarRepoCualitativo({
      contenidoRepo: repo.contenido,
      profundidad: "SEMI_SENIOR",
    })
    console.log(`\n[verificar] NOTA=${res.nota}  CONFIANZA=${res.confianza}`)
    console.log(`[verificar] COMENTARIO:\n${res.comentario}\n`)
  } finally {
    await app.close()
  }
}

main().catch((error: unknown) => {
  console.error("[verificar] ERROR:", error)
  process.exit(1)
})
