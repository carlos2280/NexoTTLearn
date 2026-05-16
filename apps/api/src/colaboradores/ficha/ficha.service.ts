import { Injectable, NotFoundException } from "@nestjs/common"
import {
  EntradaHistoricoNotaSkill,
  FichaPorAreaItem,
  FichaResponse,
  FichaSkillItem,
  OrigenNotaSkill,
} from "@nexott-learn/shared-types"
import { EstadoSkill, Prisma, RolUsuario } from "@prisma/client"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { Paginated, buildPaginatedResponse, resolvePaginacion } from "../../common/http/paginated"
import { decimalAnumero } from "../../common/prisma/decimal"
import { PrismaService } from "../../common/prisma/prisma.service"
import { SesionUsuario } from "../../common/types/sesion.types"

const SELECT_SKILL_FICHA_FIELDS = {
  id: true,
  etiquetaVisible: true,
  areaId: true,
  area: { select: { id: true, nombre: true } },
} as const satisfies Prisma.SkillSelect

const SELECT_NOTA_SKILL_FIELDS = {
  id: true,
  skillId: true,
  notaActual: true,
  origenActual: true,
} as const satisfies Prisma.NotaSkillSelect

const SELECT_HISTORICO_FIELDS = {
  id: true,
  fecha: true,
  valor: true,
  origen: true,
  referencia: true,
  autorUsuarioId: true,
} as const satisfies Prisma.HistoricoNotaSkillSelect

interface ListarHistoricoQuery {
  readonly page: number
  readonly pageSize: number
}

type NotaSkillRow = Prisma.NotaSkillGetPayload<{ select: typeof SELECT_NOTA_SKILL_FIELDS }>
type SkillFichaRow = Prisma.SkillGetPayload<{ select: typeof SELECT_SKILL_FICHA_FIELDS }>
type HistoricoRow = Prisma.HistoricoNotaSkillGetPayload<{ select: typeof SELECT_HISTORICO_FIELDS }>

function jsonObjectOrNull(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

/**
 * FichaService — endpoints de lectura de la ficha de skills (P5a):
 *   - `obtenerFicha`: vista global del colaborador (D7 §7.4, D-CUR-15).
 *   - `listarHistoricoSkill`: append-only desde `historico_notas_skill`.
 *
 * Reglas:
 *   - Scope `D-CUR-13`: cuando un PARTICIPANTE consulta una ficha que no es la
 *     suya, se devuelve 404 `COLABORADOR_NO_ENCONTRADO` (no 403) para no
 *     filtrar existencia.
 *   - `null != 0` (D40): los valores ausentes se mantienen como `null`.
 *   - Lecturas no se loggean (D-CAT-3). No hay `auditLog.record`.
 */
@Injectable()
export class FichaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resuelve la ficha del colaborador asociado a una sesion (atajo `/me/ficha`).
   * Encapsula el lookup `Usuario -> colaboradorId` para que `MeController`
   * quede delgado y sin dependencia directa de `PrismaService`.
   */
  async obtenerFichaDeUsuario(usuarioId: string, sesion: SesionUsuario): Promise<FichaResponse> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { colaboradorId: true },
    })
    if (!usuario?.colaboradorId) {
      throw new NotFoundException({
        code: apiErrorCodes.colaboradorNoEncontrado,
        message: "Colaborador no encontrado.",
      })
    }
    return this.obtenerFicha(usuario.colaboradorId, sesion)
  }

  async obtenerFicha(colaboradorId: string, sesion: SesionUsuario): Promise<FichaResponse> {
    await this.assertAccesoYExistencia(colaboradorId, sesion)

    const skills = await this.prisma.skill.findMany({
      where: { estado: EstadoSkill.ACTIVA },
      select: SELECT_SKILL_FICHA_FIELDS,
      orderBy: [{ area: { nombre: "asc" } }, { etiquetaVisible: "asc" }],
    })

    const notas = await this.prisma.notaSkill.findMany({
      where: { colaboradorId },
      select: SELECT_NOTA_SKILL_FIELDS,
    })
    const notaPorSkill = new Map<string, NotaSkillRow>()
    for (const nota of notas) {
      notaPorSkill.set(nota.skillId, nota)
    }

    const skillsItems: FichaSkillItem[] = skills.map((s) =>
      this.toFichaSkillItem(s, notaPorSkill.get(s.id)),
    )
    const porArea: FichaPorAreaItem[] = this.calcularPorArea(skillsItems, skills)

    return { colaboradorId, skills: skillsItems, porArea }
  }

  async listarHistoricoSkill(
    colaboradorId: string,
    skillId: string,
    query: ListarHistoricoQuery,
    sesion: SesionUsuario,
  ): Promise<Paginated<EntradaHistoricoNotaSkill>> {
    await this.assertAccesoYExistencia(colaboradorId, sesion)

    const skill = await this.prisma.skill.findUnique({
      where: { id: skillId },
      select: { id: true },
    })
    if (!skill) {
      throw new NotFoundException({
        code: apiErrorCodes.skillNoEncontrada,
        message: `Skill ${skillId} no encontrada.`,
      })
    }

    const notaSkill = await this.prisma.notaSkill.findUnique({
      // biome-ignore lint/style/useNamingConvention: clave compuesta generada por Prisma para @@unique.
      where: { colaboradorId_skillId: { colaboradorId, skillId } },
      select: { id: true },
    })

    const { page, pageSize, skip, take } = resolvePaginacion(query)

    if (!notaSkill) {
      return buildPaginatedResponse<EntradaHistoricoNotaSkill>([], 0, page, pageSize)
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.historicoNotaSkill.findMany({
        where: { notaSkillId: notaSkill.id },
        select: SELECT_HISTORICO_FIELDS,
        orderBy: { fecha: "desc" },
        skip,
        take,
      }),
      this.prisma.historicoNotaSkill.count({ where: { notaSkillId: notaSkill.id } }),
    ])

    const data: EntradaHistoricoNotaSkill[] = rows.map((r) => this.toEntradaHistorico(r))
    return buildPaginatedResponse(data, total, page, pageSize)
  }

  /**
   * D-CUR-13: PARTICIPANTE solo puede mirar su propia ficha. Si consulta otra,
   * 404 `COLABORADOR_NO_ENCONTRADO` (no 403). ADMIN ve cualquier ficha existente.
   */
  private async assertAccesoYExistencia(
    colaboradorId: string,
    sesion: SesionUsuario,
  ): Promise<void> {
    const colaborador = await this.prisma.colaborador.findUnique({
      where: { id: colaboradorId },
      select: {
        id: true,
        usuario: { select: { id: true } },
      },
    })

    if (sesion.rol === RolUsuario.PARTICIPANTE) {
      const propio = colaborador?.usuario?.id === sesion.usuarioId
      if (!propio) {
        throw new NotFoundException({
          code: apiErrorCodes.colaboradorNoEncontrado,
          message: "Colaborador no encontrado.",
        })
      }
      return
    }

    if (!colaborador) {
      throw new NotFoundException({
        code: apiErrorCodes.colaboradorNoEncontrado,
        message: "Colaborador no encontrado.",
      })
    }
  }

  private toFichaSkillItem(skill: SkillFichaRow, nota: NotaSkillRow | undefined): FichaSkillItem {
    return {
      skillId: skill.id,
      etiquetaVisible: skill.etiquetaVisible,
      areaId: skill.areaId,
      areaNombre: skill.area.nombre,
      notaActual: nota ? decimalAnumero(nota.notaActual) : null,
      origenActual: nota ? jsonObjectOrNull(nota.origenActual) : null,
    }
  }

  private toEntradaHistorico(row: HistoricoRow): EntradaHistoricoNotaSkill {
    return {
      id: row.id,
      fecha: row.fecha.toISOString(),
      valor: decimalAnumero(row.valor),
      origen: row.origen as OrigenNotaSkill,
      referencia: jsonObjectOrNull(row.referencia),
      autorUsuarioId: row.autorUsuarioId,
    }
  }

  private calcularPorArea(
    skillsItems: readonly FichaSkillItem[],
    skills: readonly SkillFichaRow[],
  ): FichaPorAreaItem[] {
    interface Acc {
      readonly areaId: string
      readonly nombre: string
      total: number
      conNota: number
      suma: number
    }
    const map = new Map<string, Acc>()
    for (let i = 0; i < skills.length; i += 1) {
      const skill = skills[i]
      const item = skillsItems[i]
      if (!(skill && item)) {
        continue
      }
      const acc = map.get(skill.areaId) ?? {
        areaId: skill.areaId,
        nombre: skill.area.nombre,
        total: 0,
        conNota: 0,
        suma: 0,
      }
      acc.total += 1
      if (item.notaActual !== null) {
        acc.conNota += 1
        acc.suma += item.notaActual
      }
      map.set(skill.areaId, acc)
    }
    return Array.from(map.values())
      .map((acc) => ({
        areaId: acc.areaId,
        nombre: acc.nombre,
        promedio: acc.conNota === 0 ? null : Number((acc.suma / acc.conNota).toFixed(2)),
        skillsConNota: acc.conNota,
        skillsTotales: acc.total,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }
}
