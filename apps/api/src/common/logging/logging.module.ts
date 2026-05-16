import { randomUUID } from "node:crypto"
import type { IncomingMessage } from "node:http"
import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { LoggerModule } from "nestjs-pino"
import { AppEnv } from "../../config/env.validation"

const HEALTH_PATH_REGEX = /^\/(api\/)?health(\/|\?|$)/

/**
 * Devuelve el nivel de log efectivo segun NODE_ENV cuando LOG_LEVEL no esta
 * definido. dev/test verbose por defecto; staging/prod silenciosos.
 */
function nivelPorDefecto(nodeEnv: AppEnv["NODE_ENV"]): string {
  if (nodeEnv === "development" || nodeEnv === "test") {
    return "debug"
  }
  return "info"
}

/**
 * Logging estructurado con nestjs-pino.
 *
 * - dev: salida humana via pino-pretty (colores, hora corta).
 * - test/staging/prod: JSON line-delimited (parseable por Railway, Loki, etc.).
 *
 * Cada request loguea automaticamente una linea con method+url+statusCode+ms.
 * Se ignora `/api/health` y `/health` para no inundar el log con healthchecks
 * del proxy.
 *
 * Cada log incluye `reqId` tomado del header `x-request-id` (puesto por
 * `crearMiddlewareRequestId`); si falta, genera uno propio para no perder la
 * correlacion.
 *
 * `redact`: borra de los logs cualquier path con secretos (Authorization,
 * Cookie, X-XSRF-TOKEN, password*, mfa, refreshToken). Pino redacta antes de
 * serializar — es seguro contra fugas accidentales en req/body.
 */
@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppEnv, true>) => {
        const nodeEnv = config.get("NODE_ENV", { infer: true })
        const level = config.get("LOG_LEVEL", { infer: true }) ?? nivelPorDefecto(nodeEnv)
        const isDev = nodeEnv === "development"

        return {
          pinoHttp: {
            level,
            // Lee el reqId que ya planto el middleware request-id.
            genReqId: (req: IncomingMessage): string => {
              const incoming = req.headers["x-request-id"]
              if (typeof incoming === "string" && incoming.length > 0) {
                return incoming
              }
              return randomUUID()
            },
            customLogLevel: (_req, res, err) => {
              if (err || res.statusCode >= 500) {
                return "error"
              }
              if (res.statusCode >= 400) {
                return "warn"
              }
              return "info"
            },
            autoLogging: {
              ignore: (req) => {
                const url = req.url ?? ""
                return HEALTH_PATH_REGEX.test(url)
              },
            },
            // Reduce ruido: req solo lleva method/url/reqId (sin headers ni body).
            serializers: {
              req: (req: { id: string; method: string; url: string }) => ({
                id: req.id,
                method: req.method,
                url: req.url,
              }),
              res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
            },
            redact: {
              // Paths que pino debe censurar antes de serializar el log. NO son
              // secretos hardcoded — son nombres de campos que CONTIENEN secretos
              // y que deben borrarse de los logs. La regla noSecrets confunde la
              // alta entropia con un valor sensible: aqui es nombre de campo.
              paths: [
                // biome-ignore lint/nursery/noSecrets: nombre de header, no secreto.
                'req.headers["authorization"]',
                'req.headers["cookie"]',
                'req.headers["x-xsrf-token"]',
                'req.headers["set-cookie"]',
                "req.body.password",
                "req.body.passwordActual",
                "req.body.passwordNuevo",
                "req.body.passwordTemporal",
                "req.body.codigoMfa",
                "req.body.codigo",
                "req.body.token",
                "req.body.refreshToken",
                "*.passwordHash",
                "*.refreshTokenHash",
                "*.mfaSecret",
                // biome-ignore lint/nursery/noSecrets: nombre de campo persistido, no valor.
                "*.resendApiKeyCifrada",
              ],
              censor: "[REDACTED]",
              remove: false,
            },
            transport: isDev
              ? {
                  target: "pino-pretty",
                  options: {
                    colorize: true,
                    translateTime: "SYS:HH:MM:ss.l",
                    ignore: "pid,hostname,reqId",
                    singleLine: false,
                  },
                }
              : undefined,
          },
        }
      },
    }),
  ],
  exports: [LoggerModule],
})
export class LoggingModule {}
