import { Injectable, NotFoundException } from "@nestjs/common"
import type {
  FichaResumenResponse,
  FichaResumenTopArea,
  NivelCualitativoAreaResumen,
} from "@nexott-learn/shared-types"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"

/**
 * Umbrales de nivel cualitativo de area en el widget "Tu camino" de la
 * bandeja. Alineados con la convencion de `inventario-skills` (D-S11-C3):
 *   promedio >= 70 → solido
 *   promedio >= 50 → enDesarrollo
 *   promedio <  50 → inicial
 *
 * Mas simple que la escala de 5 valores de la pantalla "Mi ficha" porque
 * el widget solo necesita 3 categorias.
 */
const UMBRAL_SOLIDO = 70
const UMBRAL_EN_DESARROLLO = 50
const TOP_AREAS_LIMITE = 3

const ORDEN_NIVEL: Record<NivelCualitativoAreaResumen, number> = {
  solido: 0,
  enDesarrollo: 1,
  inicial: 2,
}

/**
 * `MeFichaResumenService` (B-3) — agregado cualitativo de la ficha del
 * colaborador en sesion para el widget "Tu camino" de la bandeja.
 *
 * No expone numeros crudos al cliente: solo etiquetas cualitativas. Si el
 * colaborador nunca demostro nada, devuelve `totalAreasConActividad: 0`,
 * `topAreas: []`, `ultimaSkillDemostrada: null` (no 404 — la pantalla
 * sigue funcionando con el estado vacio).
 */
@Injectable()
export class MeFichaResumenService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerResumen(usuarioId: string): Promise<FichaResumenResponse> {
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

    const [notas, ultima] = await Promise.all([
      this.prisma.notaSkill.findMany({
        where: {
          colaboradorId: usuario.colaboradorId,
          notaActual: { not: null },
        },
        select: {
          notaActual: true,
          skill: {
            select: {
              area: { select: { id: true, codigo: true, nombre: true } },
            },
          },
        },
      }),
      this.prisma.historicoNotaSkill.findFirst({
        where: {
          notaSkill: { colaboradorId: usuario.colaboradorId },
          valor: { not: null },
        },
        orderBy: { fecha: "desc" },
        select: {
          fecha: true,
          notaSkill: { select: { skill: { select: { etiquetaVisible: true } } } },
        },
      }),
    ])

    const porArea = new Map<
      string,
      { codigo: string; nombre: string; suma: number; cantidad: number }
    >()
    for (const nota of notas) {
      if (nota.notaActual === null) {
        continue
      }
      const area = nota.skill.area
      const bucket = porArea.get(area.id) ?? {
        codigo: area.codigo,
        nombre: area.nombre,
        suma: 0,
        cantidad: 0,
      }
      bucket.suma += Number(nota.notaActual)
      bucket.cantidad += 1
      porArea.set(area.id, bucket)
    }

    const areasConPromedio: FichaResumenTopArea[] = []
    for (const [areaId, bucket] of porArea) {
      const promedio = bucket.suma / bucket.cantidad
      areasConPromedio.push({
        areaId,
        areaNombre: bucket.nombre,
        areaCodigo: bucket.codigo,
        nivelCualitativo: this.clasificar(promedio),
      })
    }

    areasConPromedio.sort((a, b) => {
      const dn = ORDEN_NIVEL[a.nivelCualitativo] - ORDEN_NIVEL[b.nivelCualitativo]
      return dn !== 0 ? dn : a.areaNombre.localeCompare(b.areaNombre)
    })

    return {
      totalAreasConActividad: porArea.size,
      topAreas: areasConPromedio.slice(0, TOP_AREAS_LIMITE),
      ultimaSkillDemostrada: ultima
        ? {
            skillNombre: ultima.notaSkill.skill.etiquetaVisible,
            fecha: ultima.fecha.toISOString(),
          }
        : null,
    }
  }

  private clasificar(promedio: number): NivelCualitativoAreaResumen {
    if (promedio >= UMBRAL_SOLIDO) {
      return "solido"
    }
    if (promedio >= UMBRAL_EN_DESARROLLO) {
      return "enDesarrollo"
    }
    return "inicial"
  }
}
