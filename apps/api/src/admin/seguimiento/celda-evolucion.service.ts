// Iter 10 · PR 3a · servicio de evolución persona × área para drawer.
// Read-only. Punto 0 = EvaluacionInicial (si existe). Resto = entregas
// de bloque del área ordenadas por enviadaAt asc. Proyección lineal
// sobre los últimos 5 puntos (ver celda-evolucion.lib.ts).

import { Injectable, NotFoundException } from "@nestjs/common"
import type { CeldaEvolucionPunto, CeldaEvolucionResponse } from "@nexott-learn/shared-types"
import { PrismaService } from "../../common/prisma/prisma.service"
import { type PuntoSerie, calcularProyeccion } from "./celda-evolucion.lib"
import {
  ERROR_AREA_NO_ENCONTRADA_SEG,
  ERROR_INSCRIPCION_NO_ENCONTRADA_SEG,
} from "./seguimiento.service"

const HITO_DIAGNOSTICO = "Diagnóstico inicial"
const MS_POR_DIA = 1000 * 60 * 60 * 24

@Injectable()
export class CeldaEvolucionService {
  constructor(private readonly prisma: PrismaService) {}

  async obtener(
    cursoId: string,
    inscripcionId: string,
    areaId: string,
  ): Promise<CeldaEvolucionResponse> {
    const inscripcion = await this.prisma.inscripcion.findFirst({
      where: { id: inscripcionId, cursoId },
      select: { id: true },
    })
    if (!inscripcion) {
      throw new NotFoundException(ERROR_INSCRIPCION_NO_ENCONTRADA_SEG)
    }
    const cursoArea = await this.prisma.cursoArea.findFirst({
      where: { cursoId, areaId },
      select: { puntajeObjetivo: true },
    })
    if (!cursoArea) {
      throw new NotFoundException(ERROR_AREA_NO_ENCONTRADA_SEG)
    }

    const [evalInicial, entregas] = await Promise.all([
      this.prisma.evaluacionInicial.findUnique({
        // biome-ignore lint/style/useNamingConvention: where compuesto Prisma
        where: { inscripcionId_areaId: { inscripcionId, areaId } },
        select: { puntaje: true, capturadaAt: true },
      }),
      this.prisma.entregaBloque.findMany({
        where: {
          inscripcionId,
          nota: { not: null },
          bloque: { seccion: { modulo: { areaId } } },
        },
        select: {
          nota: true,
          enviadaAt: true,
          bloque: { select: { seccion: { select: { titulo: true } } } },
        },
        orderBy: { enviadaAt: "asc" },
      }),
    ])

    const puntos: CeldaEvolucionPunto[] = []
    if (evalInicial) {
      puntos.push({
        fecha: evalInicial.capturadaAt.toISOString(),
        valor: evalInicial.puntaje,
        hito: HITO_DIAGNOSTICO,
      })
    }
    for (const e of entregas) {
      if (e.nota === null) {
        continue
      }
      puntos.push({
        fecha: e.enviadaAt.toISOString(),
        valor: Number(e.nota),
        hito: e.bloque.seccion.titulo ?? null,
      })
    }

    const proyeccion =
      puntos.length < 2
        ? { diasAlObjetivo: null, valorEstimado: null }
        : calcularProyeccion({
            puntos: this.toPuntosSerie(puntos),
            umbralArea: cursoArea.puntajeObjetivo,
            xHoy: this.diasDesdePrimero(puntos[0]?.fecha ?? null, new Date()),
          })

    return { puntos, proyeccion }
  }

  private toPuntosSerie(puntos: readonly CeldaEvolucionPunto[]): PuntoSerie[] {
    const primero = puntos[0]
    if (!primero) {
      return []
    }
    const t0 = new Date(primero.fecha).getTime()
    return puntos.map((p) => ({
      x: (new Date(p.fecha).getTime() - t0) / MS_POR_DIA,
      y: p.valor,
    }))
  }

  private diasDesdePrimero(fechaIsoPrimero: string | null, ahora: Date): number {
    if (!fechaIsoPrimero) {
      return 0
    }
    const t0 = new Date(fechaIsoPrimero).getTime()
    return (ahora.getTime() - t0) / MS_POR_DIA
  }
}
