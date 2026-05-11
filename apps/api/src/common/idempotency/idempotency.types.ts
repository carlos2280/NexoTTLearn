import { Prisma } from "@prisma/client"

export interface IdempotencyEjecutorResult<T> {
  readonly status: number
  readonly body: T
}

export interface RunOnceInput<T> {
  readonly scope: string
  readonly key: string
  readonly usuarioId: string
  readonly requestPayload: unknown
  readonly ejecutor: (tx: Prisma.TransactionClient) => Promise<IdempotencyEjecutorResult<T>>
}

export interface RunOnceResult<T> {
  readonly status: number
  readonly body: T
  readonly replay: boolean
}
