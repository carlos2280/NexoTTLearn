import "reflect-metadata"
import { Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { configurarHttp } from "./bootstrap-http"
import { AppEnv } from "./config/env.validation"

async function bootstrap(): Promise<void> {
  const logger = new Logger("Bootstrap")
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log"],
  })

  configurarHttp(app)

  const config = app.get<ConfigService<AppEnv, true>>(ConfigService)
  const port = config.get("PORT", { infer: true })

  await app.listen(port)
  logger.log(`API escuchando en puerto ${port}`)
}

bootstrap().catch((error: unknown) => {
  const detalle = error instanceof Error ? (error.stack ?? error.message) : String(error)
  console.error(`Error fatal en bootstrap: ${detalle}`)
  process.exit(1)
})
