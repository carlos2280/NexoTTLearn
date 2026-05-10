import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { PrismaClient } from "@prisma/client"

/**
 * PrismaService — singleton de acceso a base de datos.
 *
 * Patron: extiende `PrismaClient` y gestiona el ciclo de vida del pool de
 * conexiones via los hooks de Nest. Conectar en `onModuleInit` garantiza que
 * los providers que dependen de Prisma esten listos antes del `app.listen`.
 * Desconectar en `onModuleDestroy` cierra el pool en shutdown.
 *
 * NUNCA instanciar `new PrismaClient()` en otros servicios: rompe el
 * singleton y duplica pools de conexion (convenciones Prisma §03).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  constructor() {
    super({
      log: [
        { emit: "stdout", level: "error" },
        { emit: "stdout", level: "warn" },
      ],
    })
  }

  async onModuleInit(): Promise<void> {
    await this.$connect()
    this.logger.log("Conexion a base de datos establecida")
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
    this.logger.log("Conexion a base de datos cerrada")
  }
}
