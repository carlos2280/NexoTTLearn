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

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ["log", "error", "warn", "debug"],
  })

  const port = Number(process.env.API_PORT ?? 4000)
  const sessionSecret = process.env.SESSION_SECRET
  const databaseUrl = process.env.DATABASE_URL
  const isProd = process.env.NODE_ENV === "production"

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
      const permitidos = [
        "http://localhost:5173",
        "http://localhost:3000",
        process.env.WEB_ORIGIN,
      ].filter(Boolean)
      if (!origin || permitidos.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`Origen no permitido: ${origin}`))
      }
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
        sameSite: isProd ? "strict" : "lax",
        maxAge: 1000 * 60 * 60 * 8, // 8 horas
      },
    }),
  )

  app.use(passport.initialize())
  app.use(passport.session())

  app.setGlobalPrefix("api")

  await app.listen(port)
  Logger.log(`API escuchando en http://localhost:${port}/api`, "Bootstrap")
}

bootstrap().catch((err) => {
  Logger.error(err, "Bootstrap")
  process.exit(1)
})
