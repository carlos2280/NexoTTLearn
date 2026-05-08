// GET /participante/bandeja · landing post-login del PARTICIPANTE.
// Doc canonico: DOCUMENTOS/doc/v2/3-pantallas/participante/bandeja/bandeja.md

import { Injectable } from "@nestjs/common"
import type { ParticipanteBandejaResponse } from "@nexott-learn/shared-types"
import { PrismaService } from "../../common/prisma/prisma.service"
import { calcularSaludo, extraerPrimerNombre } from "./bandeja-saludo"
import { calcularSubtitulo } from "./bandeja-subtitulo"
import { calcularNovedades } from "./novedades.selector"
import { calcularPendientes } from "./pendientes.selector"
import { seleccionarSiguientePaso } from "./siguiente-paso.selector"

interface ContadoresInscripcion {
  readonly activas: number
  readonly completadas: number
  readonly recienAsignadas: number
}

@Injectable()
export class BandejaService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerBandeja(participanteId: string): Promise<ParticipanteBandejaResponse> {
    const ahora = new Date()

    const [participante, contadores, siguientePaso, pendientes, novedades] = await Promise.all([
      this.cargarParticipante(participanteId),
      this.contarInscripciones(participanteId),
      seleccionarSiguientePaso(this.prisma, participanteId),
      calcularPendientes(this.prisma, participanteId, ahora),
      calcularNovedades(this.prisma, participanteId, ahora),
    ])

    const primerNombre = extraerPrimerNombre(participante.nombre)
    const saludo = calcularSaludo(ahora)
    const subt = calcularSubtitulo({
      cursosActivos: contadores.activas,
      cursosRecienAsignados: contadores.recienAsignadas,
      pendientesTotal: pendientes.length,
    })

    return {
      estado: subt.estado,
      hero: { saludo, primerNombre, subtitulo: subt.texto },
      siguientePaso,
      stream: {
        pendientes,
        novedades: novedades.items,
        novedadesNoLeidas: novedades.noLeidas,
      },
      expediente: {
        cursosCompletados: contadores.completadas,
        cursosEnCurso: contadores.activas,
        resumen: this.formatearResumenExpediente(contadores),
      },
    }
  }

  private async cargarParticipante(id: string): Promise<{ nombre: string }> {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({
      where: { id },
      select: { nombre: true },
    })
    return usuario
  }

  private async contarInscripciones(participanteId: string): Promise<ContadoresInscripcion> {
    const grupos = await this.prisma.inscripcion.groupBy({
      by: ["estado"],
      where: { participanteId },
      _count: { _all: true },
    })
    let activas = 0
    let completadas = 0
    for (const g of grupos) {
      if (g.estado === "ACTIVA") {
        activas = g._count._all
      } else if (g.estado === "COMPLETADA") {
        completadas = g._count._all
      }
    }

    const recienAsignadas = await this.prisma.inscripcion.count({
      where: { participanteId, estado: "ACTIVA", estadosModulo: { none: {} } },
    })

    return { activas, completadas, recienAsignadas }
  }

  private formatearResumenExpediente(c: ContadoresInscripcion): string {
    if (c.completadas === 0 && c.activas === 0) {
      return "Aun no tienes cursos en tu expediente"
    }
    const completadasTxt =
      c.completadas === 1 ? "1 curso completado" : `${c.completadas} cursos completados`
    const activasTxt = c.activas === 1 ? "1 en curso" : `${c.activas} en curso`
    return `${completadasTxt} · ${activasTxt}`
  }
}
