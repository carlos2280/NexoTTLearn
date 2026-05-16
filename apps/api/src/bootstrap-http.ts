import { INestApplication, RequestMethod } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import connectPgSimple from "connect-pg-simple"
import cookieParser from "cookie-parser"
import { NextFunction, Request, Response } from "express"
import session from "express-session"
import helmet from "helmet"
import { crearMiddlewareCsrfFallback } from "./common/http/csrf-helper"
import { crearMiddlewareRequestId } from "./common/http/request-id-middleware"
import { AppEnv } from "./config/env.validation"

const NOMBRE_COOKIE_SESION = "nexott.sid"

/**
 * Permissions-Policy restrictiva: deshabilita features potentes del navegador
 * que esta API publica nunca debe necesitar. Reduce superficie ante XSS.
 */
const PERMISSIONS_POLICY =
  "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"

function aplicarPermissionsPolicy(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("Permissions-Policy", PERMISSIONS_POLICY)
  next()
}

/**
 * Aplica al `INestApplication` los middlewares HTTP (helmet, session, CSRF,
 * CORS, prefix global, RequestId). Centraliza la configuracion para que
 * `main.ts` (produccion) y los tests e2e (supertest) la apliquen identica.
 */
export function configurarHttp(app: INestApplication): void {
  const config = app.get<ConfigService<AppEnv, true>>(ConfigService)
  const sessionSecret = config.get("SESSION_SECRET", { infer: true })
  const sessionMaxAge = config.get("SESSION_MAX_AGE_MS", { infer: true })
  const cookieSecure = config.get("COOKIE_SECURE", { infer: true })
  const databaseUrl = config.get("DATABASE_URL", { infer: true })
  const allowedOrigins = config.get("ALLOWED_ORIGINS", { infer: true })

  // Detras del LB de Railway hay 1 hop de proxy. Sin esto:
  //  - req.ip es la IP del proxy (throttler agrupa todo el trafico)
  //  - req.protocol no detecta HTTPS (rompe cookies secure)
  //  - extractContextoHttp audita la IP del proxy en lugar del cliente.
  const expressInstance = app.getHttpAdapter().getInstance()
  if (typeof expressInstance.set === "function") {
    expressInstance.set("trust proxy", 1)
  }

  app.use(crearMiddlewareRequestId())

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      strictTransportSecurity: {
        maxAge: 31_536_000,
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "same-origin" },
    }),
  )

  app.use(aplicarPermissionsPolicy)

  app.use(cookieParser())

  const PgSessionStore = connectPgSimple(session)
  app.use(
    session({
      name: NOMBRE_COOKIE_SESION,
      store: new PgSessionStore({
        conString: databaseUrl,
        tableName: "sesiones",
        createTableIfMissing: false,
      }),
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: "lax",
        maxAge: sessionMaxAge,
      },
    }),
  )

  app.use(crearMiddlewareCsrfFallback({ cookieSecure }))

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(new Error(`CORS: origen ${origin} no permitido`))
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-XSRF-TOKEN",
      "X-Motivo",
      "Idempotency-Key",
      "X-Request-Id",
    ],
    exposedHeaders: ["X-Request-Id", "Retry-After", "Deprecation", "Sunset"],
  })

  app.setGlobalPrefix("api/v1", {
    exclude: [{ path: "api/health", method: RequestMethod.GET }],
  })

  if (typeof expressInstance.disable === "function") {
    expressInstance.disable("x-powered-by")
  }
}
