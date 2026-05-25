import { createHash } from "node:crypto"
import { ConflictException, Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { apiErrorCodes } from "../errors/api-error.codes"
import { PrismaService } from "../prisma/prisma.service"
import { RunOnceInput, RunOnceResult } from "./idempotency.types"

const TTL_HORAS = 24
const MS_POR_HORA = 60 * 60 * 1000

/**
 * IdempotencyService — patron reusable de idempotencia transversal (D-EVI-3).
 *
 * Contrato:
 *   1. Si `(scope, key, usuarioId)` no existe -> ejecuta `ejecutor(tx)` dentro
 *      del MISMO `$transaction`, persiste la fila idempotency y devuelve el
 *      resultado. Si el `ejecutor` lanza, Prisma hace rollback y la key NO
 *      queda persistida (reintento limpio y seguro).
 *   2. Si existe y el `requestHash` coincide -> devuelve la respuesta cacheada
 *      con `replay=true`.
 *   3. Si existe y el `requestHash` difiere -> 409
 *      `CONFLICT_IDEMPOTENCY_KEY_REUSADA_CON_BODY_DISTINTO`.
 *
 * El hash se calcula sobre `JSON.stringify(requestPayload)` con orden estable
 * de claves de objeto, de modo que dos clientes que envien el mismo body con
 * distinto orden de campos vean replay y no conflicto.
 */
@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  async runOnce<T>(input: RunOnceInput<T>): Promise<RunOnceResult<T>> {
    const requestHash = this.hashPayload(input.requestPayload)

    return await this.prisma.$transaction(async (tx) => {
      const existente = await tx.idempotencyKey.findUnique({
        where: {
          // biome-ignore lint/style/useNamingConvention: clave compuesta generada por Prisma para @@id.
          scope_key_usuarioId: {
            scope: input.scope,
            key: input.key,
            usuarioId: input.usuarioId,
          },
        },
        select: { requestHash: true, responseStatus: true, responseBody: true },
      })

      if (existente) {
        if (existente.requestHash !== requestHash) {
          throw new ConflictException({
            code: apiErrorCodes.conflictIdempotencyKeyReusadaConBodyDistinto,
            message: "La misma Idempotency-Key ya se uso con un request distinto. Use otra clave.",
          })
        }
        return {
          status: existente.responseStatus,
          body: existente.responseBody as T,
          replay: true,
        }
      }

      const resultado = await input.ejecutor(tx)
      const expiraEn = new Date(Date.now() + TTL_HORAS * MS_POR_HORA)
      await tx.idempotencyKey.create({
        data: {
          scope: input.scope,
          key: input.key,
          usuarioId: input.usuarioId,
          requestHash,
          responseStatus: resultado.status,
          responseBody: resultado.body as unknown as Prisma.InputJsonValue,
          expiraEn,
        },
      })
      return { status: resultado.status, body: resultado.body, replay: false }
    })
  }

  private hashPayload(payload: unknown): string {
    return createHash("sha256").update(this.serializarEstable(payload)).digest("hex")
  }

  private serializarEstable(value: unknown): string {
    if (value === null || typeof value !== "object") {
      return JSON.stringify(value)
    }
    if (Array.isArray(value)) {
      return `[${value.map((v) => this.serializarEstable(v)).join(",")}]`
    }
    const entradas = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    )
    const partes = entradas.map(([k, v]) => `${JSON.stringify(k)}:${this.serializarEstable(v)}`)
    return `{${partes.join(",")}}`
  }
}
