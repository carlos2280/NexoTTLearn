import "reflect-metadata"
import { Logger } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import type { NestExpressApplication } from "@nestjs/platform-express"
import ConnectPgSimple from "connect-pg-simple"
import cookieParser from "cookie-parser"
import session from "express-session"
import helmet from "helmet"
import passport from "passport"
import { AppModule } from "./app.module"
import { ApiExceptionFilter } from "./common/errors/api-exception.filter"

const ORIGENES_DEV = ["http://localhost:5173", "http://localhost:3000"]

function obtenerOrigenesPermitidos(): string[] {
  const extra = [process.env.WEB_ORIGIN, process.env.WEB_ORIGIN_EXTRA]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .flatMap((value) => value.split(",").map((parte) => parte.trim()))
    .filter((value) => value.length > 0)
  return [...ORIGENES_DEV, ...extra]
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ["log", "error", "warn", "debug"],
  })

  // Railway / heroku-style proxies: necesario para que `secure: true` cookies funcionen
  app.set("trust proxy", 1)

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000)
  const sessionSecret = process.env.SESSION_SECRET
  const databaseUrl = process.env.DATABASE_URL
  const isProd = process.env.NODE_ENV === "production"
  const origenesPermitidos = obtenerOrigenesPermitidos()

  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET debe tener al menos 32 caracteres")
  }
  if (!databaseUrl) {
    throw new Error("DATABASE_URL no configurada")
  }

  app.use(helmet())
  app.use(cookieParser())

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || origenesPermitidos.includes(origin)) {
        callback(null, true)
        return
      }
      callback(new Error(`Origen no permitido: ${origin}`))
    },
    credentials: true,
  })

  const PgStore = ConnectPgSimple(session)
  app.use(
    session({
      store: new PgStore({
        conString: databaseUrl,
        createTableIfMissing: true,
        tableName: "sesiones",
      }),
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      name: "nexott.sid",
      cookie: {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 1000 * 60 * 60 * 8,
      },
    }),
  )

  app.use(passport.initialize())
  app.use(passport.session())

  app.setGlobalPrefix("api")
  // biome-ignore lint/correctness/useHookAtTopLevel: NestJS app.useGlobalFilters no es un hook React, es API de Nest
  app.useGlobalFilters(new ApiExceptionFilter())

  await app.listen(port, "0.0.0.0")
  Logger.log(`API escuchando en puerto ${port} (env=${process.env.NODE_ENV})`, "Bootstrap")
  Logger.log(
    `Origenes CORS permitidos: ${origenesPermitidos.join(", ") || "(ninguno)"}`,
    "Bootstrap",
  )
}

bootstrap().catch((err) => {
  Logger.error(err, "Bootstrap")
  process.exit(1)
})
