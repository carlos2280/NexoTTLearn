import { ConflictException, Injectable, NotFoundException } from "@nestjs/common"
import { PatchSkillResponse, patchSkillResponseSchema } from "@nexott-learn/shared-types"
import { EstadoSkill, OrigenNotaSkill, Prisma } from "@prisma/client"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { decimalAnumero } from "../../common/prisma/decimal"
import { PrismaService } from "../../common/prisma/prisma.service"

interface EditarSkillInput {
  readonly colaboradorId: string
  readonly skillId: string
  readonly valor: number | null
  readonly motivo: string
  readonly usuarioId: string
}

interface EditarSkillResult {
  readonly response: PatchSkillResponse
  readonly valorAnterior: number | null
}

/**
 * FichaEdicionService — Slice 5 P5c (`PATCH .../ficha/skills/:skillId`).
 *
 * Edicion manual celda a celda de la ficha del colaborador (§7.5). El
 * `origen` se asigna server-side a `MANUAL` (OWASP A01); el cliente no puede
 * falsificarlo a traves del body. Toda la mutacion vive en un `$transaction`:
 *   1. Releer la `notaSkill` previa para capturar `valorAnterior` (audit log).
 *   2. `upsert` con `nota_actual` + `origen_actual = { origen: 'MANUAL',
 *      motivo }`.
 *   3. `create` append-only en `historico_notas_skill` con `origen=MANUAL`,
 *      `referencia={ motivo }`, `autorUsuarioId`.
 *   4. Marcar planes desactualizados (D80, solo marcar — el recalculo es del
 *      Slice 7).
 *
 * El audit log lo escribe el controller FUERA del `$transaction` (D-AUDIT-2).
 */
@Injectable()
export class FichaEdicionService {
  constructor(private readonly prisma: PrismaService) {}

  async editarSkill(input: EditarSkillInput): Promise<EditarSkillResult> {
    const colaborador = await this.prisma.colaborador.findUnique({
      where: { id: input.colaboradorId },
      select: { id: true },
    })
    if (!colaborador) {
      throw new NotFoundException({
        code: apiErrorCodes.colaboradorNoEncontrado,
        message: "Colaborador no encontrado.",
      })
    }

    const skill = await this.prisma.skill.findUnique({
      where: { id: input.skillId },
      select: { id: true, estado: true },
    })
    if (!skill) {
      throw new NotFoundException({
        code: apiErrorCodes.skillNoEncontrada,
        message: `Skill ${input.skillId} no encontrada.`,
      })
    }
    if (skill.estado !== EstadoSkill.ACTIVA) {
      throw new ConflictException({
        code: apiErrorCodes.skillNoActiva,
        message: "No se pueden editar notas sobre skills archivadas.",
      })
    }

    const origenActual: Prisma.InputJsonValue = {
      origen: OrigenNotaSkill.MANUAL,
      motivo: input.motivo,
    }

    const resultado = await this.prisma.$transaction(async (tx) => {
      const notaPrev = await tx.notaSkill.findUnique({
        where: {
          // biome-ignore lint/style/useNamingConvention: clave compuesta generada por Prisma para @@unique.
          colaboradorId_skillId: { colaboradorId: input.colaboradorId, skillId: input.skillId },
        },
        select: { notaActual: true },
      })
      const valorAnteriorNum = notaPrev ? decimalAnumero(notaPrev.notaActual) : null

      const nota = await tx.notaSkill.upsert({
        where: {
          // biome-ignore lint/style/useNamingConvention: clave compuesta generada por Prisma para @@unique.
          colaboradorId_skillId: { colaboradorId: input.colaboradorId, skillId: input.skillId },
        },
        create: {
          colaboradorId: input.colaboradorId,
          skillId: input.skillId,
          notaActual: input.valor,
          origenActual,
        },
        update: {
          notaActual: input.valor,
          origenActual,
        },
        select: { id: true, notaActual: true, updatedAt: true },
      })

      await tx.historicoNotaSkill.create({
        data: {
          notaSkillId: nota.id,
          valor: input.valor,
          origen: OrigenNotaSkill.MANUAL,
          referencia: { motivo: input.motivo } satisfies Prisma.InputJsonValue,
          autorUsuarioId: input.usuarioId,
        },
      })

      // D80 marcar planes desactualizados del colaborador (recalculo S7).
      const planes = await tx.planEstudio.findMany({
        where: {
          asignacion: { colaboradorId: input.colaboradorId },
          estaDesactualizado: false,
        },
        select: { id: true },
      })
      if (planes.length > 0) {
        const planIds = planes.map((p) => p.id)
        await tx.planEstudio.updateMany({
          where: { id: { in: planIds } },
          data: { estaDesactualizado: true },
        })
      }

      return {
        notaActualNum: decimalAnumero(nota.notaActual),
        actualizadoEn: nota.updatedAt,
        valorAnterior: valorAnteriorNum,
      }
    })

    const response = patchSkillResponseSchema.parse({
      colaboradorId: input.colaboradorId,
      skillId: input.skillId,
      notaActual: resultado.notaActualNum,
      origenActual: "MANUAL",
      actualizadoEn: resultado.actualizadoEn.toISOString(),
    })
    return { response, valorAnterior: resultado.valorAnterior }
  }
}
