import "reflect-metadata"
import { ConfigService } from "@nestjs/config"
import { NestFactory } from "@nestjs/core"
import type { NestExpressApplication } from "@nestjs/platform-express"
import { Logger } from "nestjs-pino"
import { AppModule } from "./app.module"
import { configurarHttp } from "./bootstrap-http"
import { AppEnv } from "./config/env.validation"

// La importación de cursos envía el `.md` completo en el body (el schema lo
// limita a 2M chars ≈ varios MB en UTF-8). El default de Express (100kb) lo
// rechaza con 413; subimos el límite del body parser con holgura para que el
// gate real sea la validación Zod, no el parser.
const BODY_LIMIT = "8mb"

async function bootstrap(): Promise<void> {
  // bufferLogs: los logs emitidos antes de useLogger() se reproducen tras
  // engancharse pino. Sin esto, el banner de arranque sale por consola "raw".
  // bodyParser:false para registrar los parsers con nuestro límite (abajo).
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  })

  // biome-ignore lint/correctness/useHookAtTopLevel: app.useBodyParser no es un React hook.
  app.useBodyParser("json", { limit: BODY_LIMIT })
  // biome-ignore lint/correctness/useHookAtTopLevel: app.useBodyParser no es un React hook.
  app.useBodyParser("urlencoded", { extended: true, limit: BODY_LIMIT })

  // Sustituye el LoggerService por defecto de Nest por el de nestjs-pino.
  // Los `new Logger(name)` repartidos por los services se enrutan automatic-
  // amente a este logger compartido (mismo contrato `LoggerService`).
  const pinoLogger = app.get(Logger)
  // biome-ignore lint/correctness/useHookAtTopLevel: app.useLogger no es un React hook.
  app.useLogger(pinoLogger)

  configurarHttp(app)

  const config = app.get<ConfigService<AppEnv, true>>(ConfigService)
  const port = config.get("PORT", { infer: true })

  // Habilita SIGTERM/SIGINT -> OnModuleDestroy: cierra pool de Prisma, crons
  // y sesiones limpiamente cuando Railway redepliega.
  app.enableShutdownHooks()

  await app.listen(port)
  pinoLogger.log(`API escuchando en puerto ${port}`, "Bootstrap")
}

bootstrap().catch((error: unknown) => {
  const detalle = error instanceof Error ? (error.stack ?? error.message) : String(error)
  // El logger pino aun no esta levantado aqui; salida directa a stderr
  // (console.error esta permitido por la regla noConsole — allow: warn/error).
  console.error(`Error fatal en bootstrap: ${detalle}`)
  process.exit(1)
})
