// Iter 10 · MAESTRO §13.6, A30 · ficha 360° del participante (admin).
// Read-only. Reusa SeguimientoService para estadoSeguimiento de cursos
// activos (D-10.3 canónico).

import { Injectable, NotFoundException } from "@nestjs/common"
import type {
  FichaCta,
  FichaCursoActivo,
  FichaCursoCerrado,
  FichaEntrevistaIA,
  FichaEstadisticaArea,
  FichaExpedienteEntry,
  FichaHistorialEntrega,
  FichaParticipanteResponse,
} from "@nexott-learn/shared-types"
import { PrismaService } from "../../common/prisma/prisma.service"
import { RecalculoService } from "../recalculo/recalculo.service"
import { clasificarEstadoSeguimiento } from "../seguimiento/seguimiento-clasificador"

export const ERROR_PARTICIPANTE_NO_ENCONTRADO = "PARTICIPANTE_NO_ENCONTRADO"

@Injectable()
export class FichaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recalculo: RecalculoService,
  ) {}

  async obtenerFicha(participanteId: string): Promise<FichaParticipanteResponse> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: participanteId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        bloqueado: true,
        mfaActivado: true,
      },
    })
    if (!usuario) {
      throw new NotFoundException(ERROR_PARTICIPANTE_NO_ENCONTRADO)
    }

    const expediente = await this.cargarExpediente(participanteId)
    const { cursosActivos, cursosCerrados } = await this.cargarCursos(participanteId)
    const estadisticaPorArea = await this.cargarEstadisticaPorArea(participanteId)
    const historialEntregas = await this.cargarHistorialEntregas(participanteId)
    const historialEntrevistasIA = await this.cargarHistorialEntrevistas(participanteId)
    const ctas = construirCtas({
      bloqueado: usuario.bloqueado,
      mfaActivado: usuario.mfaActivado,
      tieneCursosActivos: cursosActivos.length > 0,
      tieneExpediente: expediente.length > 0,
    })

    return {
      datosPersonales: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
        estado: usuario.bloqueado ? "bloqueado" : "activo",
        mfaActivo: usuario.mfaActivado,
      },
      expediente,
      cursosActivos,
      cursosCerrados,
      estadisticaPorArea,
      historialEntregas,
      historialEntrevistasIA,
      ctas,
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Expediente
  // ─────────────────────────────────────────────────────────────────

  private async cargarExpediente(participanteId: string): Promise<FichaExpedienteEntry[]> {
    const entries = await this.prisma.expedienteEntry.findMany({
      where: { participanteId },
      orderBy: { fechaCompletitud: "desc" },
      select: {
        cursoId: true,
        tituloCurso: true,
        empresaCliente: true,
        fechaCompletitud: true,
        notaGlobal: true,
        etiqueta: true,
        notasPorArea: {
          select: {
            areaId: true,
            nombreAreaSnapshot: true,
            puntaje: true,
          },
        },
      },
    })
    return entries.map((e) => ({
      cursoId: e.cursoId,
      titulo: e.tituloCurso,
      empresaCliente: e.empresaCliente,
      fechaCierre: e.fechaCompletitud.toISOString(),
      notaGlobal: Number(e.notaGlobal),
      etiqueta: e.etiqueta,
      notasArea: e.notasPorArea.map((na) => ({
        areaId: na.areaId,
        nombre: na.nombreAreaSnapshot,
        nota: Number(na.puntaje),
      })),
    }))
  }

  // ─────────────────────────────────────────────────────────────────
  // Cursos activos / cerrados
  // ─────────────────────────────────────────────────────────────────

  private async cargarCursos(
    participanteId: string,
  ): Promise<{ cursosActivos: FichaCursoActivo[]; cursosCerrados: FichaCursoCerrado[] }> {
    const inscripciones = await this.prisma.inscripcion.findMany({
      where: { participanteId },
      select: {
        id: true,
        estado: true,
        abandonadaAt: true,
        cerradaSinCompletarAt: true,
        cursoId: true,
        curso: {
          select: {
            id: true,
            titulo: true,
            empresaCliente: true,
            umbralExcelencia: true,
            umbralAprobado: true,
            umbralEnDesarrollo: true,
            cursoAreas: { select: { areaId: true, puntajeObjetivo: true } },
            proyectoTransversal: { select: { id: true, umbralAprobacion: true } },
            entrevistaIAConfig: { select: { id: true } },
          },
        },
      },
    })

    const activos: FichaCursoActivo[] = []
    const cerrados: FichaCursoCerrado[] = []
    for (const ins of inscripciones) {
      if (ins.estado === "ACTIVA") {
        activos.push(await this.cargarCursoActivo(ins))
      } else if (ins.estado === "ABANDONADA" || ins.estado === "CERRADO_SIN_COMPLETAR") {
        cerrados.push(mapearCursoCerrado(ins))
      }
    }
    return { cursosActivos: activos, cursosCerrados: cerrados }
  }

  private async cargarCursoActivo(ins: InscripcionParaFicha): Promise<FichaCursoActivo> {
    const agregados = await this.recalculo.snapshotAgregados(ins.id)
    const asignaciones = await this.prisma.asignacion.findMany({
      where: { inscripcionId: ins.id },
      select: { moduloId: true, tipo: true },
    })
    const modulos = await this.prisma.modulo.findMany({
      where: { id: { in: asignaciones.map((a) => a.moduloId) } },
      select: { id: true, areaId: true },
    })
    const areaPorModulo = new Map(modulos.map((m) => [m.id, m.areaId]))
    const transversalUltima = ins.curso.proyectoTransversal
      ? await this.cargarUltimaNotaTransversal(ins.id, ins.curso.proyectoTransversal.id)
      : null
    const entrevistaAprobada = ins.curso.entrevistaIAConfig
      ? await this.estaEntrevistaAprobada(ins.id, ins.curso.entrevistaIAConfig.id)
      : false
    const estadoSeguimiento = clasificarEstadoSeguimiento({
      estadoInscripcion: ins.estado,
      etiqueta: agregados.etiqueta,
      areas: ins.curso.cursoAreas.map((ca) => ({
        areaId: ca.areaId,
        umbralArea: ca.puntajeObjetivo,
      })),
      modulos: asignaciones.map((a) => ({
        areaId: areaPorModulo.get(a.moduloId) ?? "",
        tipoAsignacion: a.tipo,
        notaModulo: agregados.notasModulo.get(a.moduloId) ?? null,
      })),
      notasArea: agregados.notasArea,
      transversal: ins.curso.proyectoTransversal
        ? {
            umbralAprobacion: ins.curso.proyectoTransversal.umbralAprobacion,
            ultimaNota: transversalUltima,
          }
        : null,
      entrevistaIA: ins.curso.entrevistaIAConfig ? { aprobada: entrevistaAprobada } : null,
    })
    const estadosModulo = await this.prisma.estadoModuloInscripcion.findMany({
      where: { inscripcionId: ins.id },
      select: { porcentajeAvance: true, estado: true },
    })
    const pctAvance =
      estadosModulo.length === 0
        ? 0
        : Math.round(
            estadosModulo.reduce((acc, m) => acc + m.porcentajeAvance, 0) / estadosModulo.length,
          )
    return {
      cursoId: ins.curso.id,
      titulo: ins.curso.titulo,
      empresaCliente: ins.curso.empresaCliente,
      estadoSeguimiento,
      modulosAsignados: asignaciones.length,
      pctAvance,
      notaProyectada: agregados.notaCurso,
    }
  }

  private async cargarUltimaNotaTransversal(
    inscripcionId: string,
    transversalId: string,
  ): Promise<number | null> {
    const entrega = await this.prisma.entregaProyecto.findFirst({
      where: { inscripcionId, transversalId, estado: "EVALUADA", notaFinal: { not: null } },
      orderBy: { intento: "desc" },
      select: { notaFinal: true },
    })
    return entrega?.notaFinal === null || entrega?.notaFinal === undefined
      ? null
      : Number(entrega.notaFinal)
  }

  private async estaEntrevistaAprobada(inscripcionId: string, configId: string): Promise<boolean> {
    const sesion = await this.prisma.entrevistaIASesion.findFirst({
      where: {
        inscripcionId,
        configId,
        estado: { in: ["APROBADA", "AJUSTADA_MANUAL"] },
      },
      select: { id: true },
    })
    return sesion !== null
  }

  // ─────────────────────────────────────────────────────────────────
  // Estadística por área (sobre expediente sellado, MAESTRO §4.4)
  // ─────────────────────────────────────────────────────────────────

  private async cargarEstadisticaPorArea(participanteId: string): Promise<FichaEstadisticaArea[]> {
    const areas = await this.prisma.expedienteEntryArea.findMany({
      where: { entry: { participanteId } },
      select: {
        areaId: true,
        nombreAreaSnapshot: true,
        puntaje: true,
        entry: { select: { fechaCompletitud: true } },
      },
    })
    const porArea = new Map<string, { nombre: string; notas: number[]; ultima: Date }>()
    for (const a of areas) {
      const punt = Number(a.puntaje)
      const fecha = a.entry.fechaCompletitud
      const prev = porArea.get(a.areaId)
      if (prev) {
        prev.notas.push(punt)
        if (fecha > prev.ultima) {
          prev.ultima = fecha
        }
      } else {
        porArea.set(a.areaId, {
          nombre: a.nombreAreaSnapshot,
          notas: [punt],
          ultima: fecha,
        })
      }
    }
    return [...porArea.entries()].map(([areaId, data]) => ({
      areaId,
      nombre: data.nombre,
      mejorNota: Math.max(...data.notas),
      peorNota: Math.min(...data.notas),
      cursosTocados: data.notas.length,
      fechaUltima: data.ultima.toISOString(),
    }))
  }

  // ─────────────────────────────────────────────────────────────────
  // Historial entregas (últimas 50)
  // ─────────────────────────────────────────────────────────────────

  private async cargarHistorialEntregas(participanteId: string): Promise<FichaHistorialEntrega[]> {
    const entregasBloque = await this.prisma.entregaBloque.findMany({
      where: { inscripcion: { participanteId } },
      orderBy: { enviadaAt: "desc" },
      take: 50,
      select: {
        id: true,
        inscripcionId: true,
        nota: true,
        estado: true,
        enviadaAt: true,
        evaluadaAt: true,
        inscripcion: { select: { cursoId: true, curso: { select: { titulo: true } } } },
      },
    })
    const entregasProyecto = await this.prisma.entregaProyecto.findMany({
      where: { inscripcion: { participanteId } },
      orderBy: { enviadaAt: "desc" },
      take: 50,
      select: {
        id: true,
        inscripcionId: true,
        notaFinal: true,
        estado: true,
        enviadaAt: true,
        evaluadaAt: true,
        inscripcion: { select: { cursoId: true, curso: { select: { titulo: true } } } },
      },
    })
    const combinadas: FichaHistorialEntrega[] = [
      ...entregasBloque.map(
        (e): FichaHistorialEntrega => ({
          id: e.id,
          tipo: "BLOQUE",
          inscripcionId: e.inscripcionId,
          cursoId: e.inscripcion.cursoId,
          cursoTitulo: e.inscripcion.curso.titulo,
          nota: e.nota === null ? null : Number(e.nota),
          estado: e.estado,
          enviadaAt: e.enviadaAt.toISOString(),
          evaluadaAt: e.evaluadaAt ? e.evaluadaAt.toISOString() : null,
        }),
      ),
      ...entregasProyecto.map(
        (e): FichaHistorialEntrega => ({
          id: e.id,
          tipo: "PROYECTO",
          inscripcionId: e.inscripcionId,
          cursoId: e.inscripcion.cursoId,
          cursoTitulo: e.inscripcion.curso.titulo,
          nota: e.notaFinal === null ? null : Number(e.notaFinal),
          estado: e.estado,
          enviadaAt: e.enviadaAt.toISOString(),
          evaluadaAt: e.evaluadaAt ? e.evaluadaAt.toISOString() : null,
        }),
      ),
    ]
    combinadas.sort((a, b) => (a.enviadaAt < b.enviadaAt ? 1 : -1))
    return combinadas.slice(0, 50)
  }

  // ─────────────────────────────────────────────────────────────────
  // Historial entrevistas IA (todas)
  // ─────────────────────────────────────────────────────────────────

  private async cargarHistorialEntrevistas(participanteId: string): Promise<FichaEntrevistaIA[]> {
    const sesiones = await this.prisma.entrevistaIASesion.findMany({
      where: { inscripcion: { participanteId } },
      orderBy: [{ inscripcionId: "asc" }, { intento: "desc" }],
      select: {
        id: true,
        intento: true,
        estado: true,
        scoreGeneral: true,
        finalizadaAt: true,
        inscripcion: { select: { cursoId: true, curso: { select: { titulo: true } } } },
      },
    })
    return sesiones.map((s) => ({
      id: s.id,
      cursoId: s.inscripcion.cursoId,
      cursoTitulo: s.inscripcion.curso.titulo,
      intento: s.intento,
      estado: s.estado,
      scoreGeneral: s.scoreGeneral === null ? null : Number(s.scoreGeneral),
      finalizadaAt: s.finalizadaAt ? s.finalizadaAt.toISOString() : null,
    }))
  }
}

// ──────────────────────────────────────────────────────────────────────
// Tipos auxiliares
// ──────────────────────────────────────────────────────────────────────

interface InscripcionParaFicha {
  id: string
  estado: "ACTIVA" | "COMPLETADA" | "ABANDONADA" | "CERRADO_SIN_COMPLETAR"
  abandonadaAt: Date | null
  cerradaSinCompletarAt: Date | null
  cursoId: string
  curso: {
    id: string
    titulo: string
    empresaCliente: string
    umbralExcelencia: number
    umbralAprobado: number
    umbralEnDesarrollo: number
    cursoAreas: Array<{ areaId: string; puntajeObjetivo: number }>
    proyectoTransversal: { id: string; umbralAprobacion: number } | null
    entrevistaIAConfig: { id: string } | null
  }
}

function mapearCursoCerrado(ins: InscripcionParaFicha): FichaCursoCerrado {
  if (ins.estado !== "ABANDONADA" && ins.estado !== "CERRADO_SIN_COMPLETAR") {
    throw new Error("INVALID_ESTADO_PARA_CURSO_CERRADO")
  }
  return {
    cursoId: ins.curso.id,
    titulo: ins.curso.titulo,
    empresaCliente: ins.curso.empresaCliente,
    estado: ins.estado,
    fecha:
      ins.estado === "ABANDONADA"
        ? (ins.abandonadaAt?.toISOString() ?? null)
        : (ins.cerradaSinCompletarAt?.toISOString() ?? null),
  }
}

// ──────────────────────────────────────────────────────────────────────
// CTAs (helper puro)
// ──────────────────────────────────────────────────────────────────────

interface CtasContext {
  bloqueado: boolean
  mfaActivado: boolean
  tieneCursosActivos: boolean
  tieneExpediente: boolean
}

export function construirCtas(ctx: CtasContext): FichaCta[] {
  const ctas: FichaCta[] = []
  if (ctx.tieneCursosActivos) {
    ctas.push("AJUSTAR_NOTA", "REASIGNAR_MODULO", "DESINSCRIBIR")
  }
  if (ctx.tieneExpediente) {
    ctas.push("AJUSTAR_EXPEDIENTE")
  }
  ctas.push("RESET_PASSWORD")
  ctas.push(ctx.bloqueado ? "DESBLOQUEAR" : "BLOQUEAR")
  ctas.push(ctx.mfaActivado ? "RESET_MFA" : "ACTIVAR_MFA")
  return ctas
}
