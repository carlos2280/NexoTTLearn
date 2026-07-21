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
 * (tiene coste). El default de la capa semi-senior ya es claude-sonnet-5; usa
 * AI_MODEL_OVERRIDE solo si quieres forzar otro modelo puntualmente.
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

/**
 * Ejes a puntuar para el smoke test. En la app vienen de las skills declaradas
 * por el transversal (`TransversalSkill` → `Skill.etiquetaVisible`); aquí van
 * fijos para poder correr el script contra cualquier repo público.
 */
const DIMENSIONES_DEMO = ["Calidad de código", "Estructura del proyecto", "Buenas prácticas"]

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
      dimensiones: DIMENSIONES_DEMO,
    })
    console.log(`\n[verificar] NOTA=${res.nota}  CONFIANZA=${res.confianza}`)
    console.log(`[verificar] RESUMEN:\n${res.resumen}\n`)
    console.log(`[verificar] QUÉ REVISÓ: ${res.queReviso}`)
    console.log(`[verificar] QUÉ NO REVISÓ: ${res.queNoReviso}`)
    console.log("[verificar] POR DIMENSIÓN:")
    for (const dim of res.porDimension) {
      console.log(`  · ${dim.dimension}: nota=${dim.nota} — ${dim.comentario}`)
    }
    if (res.fortalezas.length > 0) {
      console.log("[verificar] FORTALEZAS:")
      for (const fortaleza of res.fortalezas) {
        console.log(`  + ${fortaleza}`)
      }
    }
    if (res.aReforzar.length > 0) {
      console.log("[verificar] A REFORZAR:")
      for (const item of res.aReforzar) {
        console.log(`  ! ${item.que} → ${item.sugerencia}`)
      }
    }
    if (res.cumplimientoCriterios && res.cumplimientoCriterios.length > 0) {
      console.log("[verificar] CUMPLIMIENTO DE CRITERIOS:")
      for (const crit of res.cumplimientoCriterios) {
        console.log(`  [${crit.cumple ?? "sin-verificar"}] ${crit.criterio} — ${crit.evidencia}`)
      }
    }
    console.log("")
  } finally {
    await app.close()
  }
}

main().catch((error: unknown) => {
  console.error("[verificar] ERROR:", error)
  process.exit(1)
})
