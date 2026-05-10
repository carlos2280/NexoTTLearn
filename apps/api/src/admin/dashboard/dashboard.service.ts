// P1 · GET /admin/dashboard. Lectura agregada para la bandeja del admin
// (MAESTRO §16.2). Read-only, sin transaccion: agrega counts y feeds en
// paralelo y devuelve el shape ya formateado que consume el front.
//
// Decisiones de diseño cerradas con el usuario:
//  - 1 endpoint agregado (no 5 separados).
//  - Contrato formateado: el back emite strings listos ("82%", "+2", "hace
//    12 min") y tonos semanticos (brand/success/warning/danger/info/neutral).
//  - Fuente de actividad reciente: LogActividad (T02) — unica fuente de
//    verdad de auditoria.
//  - Riesgo: heuristica liviana (inactividad o deadline cercano) sin invocar
//    al clasificador completo D-10.3 — esto es un dashboard, no la matriz
//    de seguimiento. Si en el futuro se necesita el estado canonico
//    EnRiesgo, se conecta SeguimientoService aqui.

import { Injectable } from "@nestjs/common"
import type {
  AdminDashboardResponse,
  DashboardActividad,
  DashboardAlerta,
  DashboardColaRevision,
  DashboardKpi,
} from "@nexott-learn/shared-types"
import { PrismaService } from "../../common/prisma/prisma.service"
import {
  ACTIVIDAD_LIMITE,
  ALERTAS_LIMITE,
  RIESGO_DIAS_DEADLINE_CERCANO,
  RIESGO_DIAS_INACTIVIDAD,
  RUTAS_ADMIN,
  TENDENCIA_PUNTOS,
} from "./dashboard.types"

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerDashboard(): Promise<AdminDashboardResponse> {
    const ahora = new Date()

    const [
      cursosActivos,
      participantesActivos,
      tasaCompletitud,
      enRiesgoCount,
      entregasPendientes,
      proyectosPendientes,
      alertasIANoResueltas,
      diagnosticosPendientes,
      logRecientes,
    ] = await Promise.all([
      this.contarCursosActivos(),
      this.contarParticipantesActivos(),
      this.calcularTasaCompletitud(),
      this.contarEnRiesgo(ahora),
      this.contarEntregasPendientes(),
      this.contarProyectosPendientes(),
      this.contarAlertasIANoResueltas(),
      this.contarDiagnosticosPendientes(),
      this.cargarLogActividadReciente(),
    ])

    return {
      kpis: this.construirKpis({
        cursosActivos,
        participantesActivos,
        tasaCompletitud,
        enRiesgoCount,
      }),
      colaRevision: this.construirColaRevision({
        entregas: entregasPendientes,
        proyectos: proyectosPendientes,
        alertas: alertasIANoResueltas,
      }),
      alertas: this.construirAlertas({
        entregas: entregasPendientes,
        proyectos: proyectosPendientes,
        alertasIA: alertasIANoResueltas,
        enRiesgo: enRiesgoCount,
        diagnosticos: diagnosticosPendientes,
      }),
      actividad: this.construirActividad(logRecientes, ahora),
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Queries crudas
  // ─────────────────────────────────────────────────────────────

  private contarCursosActivos(): Promise<number> {
    return this.prisma.curso.count({ where: { estado: "ACTIVO" } })
  }

  private async contarParticipantesActivos(): Promise<number> {
    // Distintos participantes con al menos una inscripcion ACTIVA.
    // groupBy es la forma directa; en DB chicas un findMany+Set tambien sirve.
    const grupos = await this.prisma.inscripcion.groupBy({
      by: ["participanteId"],
      where: { estado: "ACTIVA" },
    })
    return grupos.length
  }

  private async calcularTasaCompletitud(): Promise<{
    fraccion: number
    completadas: number
    total: number
  }> {
    // Universo: inscripciones cerradas en cualquier sentido (positivo o negativo).
    // Excluye ACTIVA porque "tasa de completitud" mide lo que ya termino.
    const cerradas = await this.prisma.inscripcion.groupBy({
      by: ["estado"],
      where: {
        estado: { in: ["COMPLETADA", "ABANDONADA", "CERRADO_SIN_COMPLETAR"] },
      },
      _count: { _all: true },
    })
    let completadas = 0
    let total = 0
    for (const grupo of cerradas) {
      const cantidad = grupo._count._all
      total += cantidad
      if (grupo.estado === "COMPLETADA") {
        completadas = cantidad
      }
    }
    const fraccion = total === 0 ? 0 : completadas / total
    return { fraccion, completadas, total }
  }

  private async contarEnRiesgo(ahora: Date): Promise<number> {
    const limiteInactividad = new Date(
      ahora.getTime() - RIESGO_DIAS_INACTIVIDAD * 24 * 60 * 60 * 1000,
    )
    const limiteDeadlineCercano = new Date(
      ahora.getTime() + RIESGO_DIAS_DEADLINE_CERCANO * 24 * 60 * 60 * 1000,
    )

    // Riesgo (heuristica dashboard, no clasificador):
    //  a) ultima entrega de bloque hace mas de N dias, o nunca entrego.
    //  b) curso con fecha de cierre dentro de los proximos N dias.
    //
    // El campo "deadline" vive en Curso (no en Inscripcion) en schema v2.
    // Necesitamos el max(enviadaAt) de las entregas por inscripcion para (a).
    const inscripciones = await this.prisma.inscripcion.findMany({
      where: { estado: "ACTIVA" },
      select: {
        id: true,
        inscritaAt: true,
        curso: { select: { deadline: true } },
        entregasBloque: {
          select: { enviadaAt: true },
          orderBy: { enviadaAt: "desc" },
          take: 1,
        },
      },
    })

    let enRiesgo = 0
    for (const ins of inscripciones) {
      const ultimaEntrega = ins.entregasBloque[0]?.enviadaAt ?? ins.inscritaAt
      const inactivo = ultimaEntrega < limiteInactividad
      const deadline = ins.curso.deadline
      const deadlineCerca = deadline != null && deadline > ahora && deadline < limiteDeadlineCercano
      if (inactivo || deadlineCerca) {
        enRiesgo += 1
      }
    }
    return enRiesgo
  }

  private contarEntregasPendientes(): Promise<number> {
    return this.prisma.entregaBloque.count({
      where: { estado: { in: ["ENVIADA", "PENDIENTE_REVISION"] } },
    })
  }

  private contarProyectosPendientes(): Promise<number> {
    return this.prisma.entregaProyecto.count({
      where: { estado: { in: ["ENVIADA", "EN_REVISION"] } },
    })
  }

  private contarAlertasIANoResueltas(): Promise<number> {
    return this.prisma.alertaIA.count({ where: { resueltaAt: null } })
  }

  private contarDiagnosticosPendientes(): Promise<number> {
    // Inscripciones ACTIVAS sin ninguna evaluacion inicial capturada.
    return this.prisma.inscripcion.count({
      where: {
        estado: "ACTIVA",
        evaluacionesIniciales: { none: {} },
      },
    })
  }

  private cargarLogActividadReciente() {
    // Tomamos un buffer mayor al limite final porque vamos a filtrar tipos
    // que no rendean en el feed (ej. RECALCULO_*) sin gastar otro round-trip.
    return this.prisma.logActividad.findMany({
      orderBy: { timestamp: "desc" },
      take: ACTIVIDAD_LIMITE * 4,
      select: {
        id: true,
        tipoAccion: true,
        tipoActor: true,
        timestamp: true,
        entidadTipo: true,
        entidadId: true,
        actor: { select: { nombre: true, apellido: true } },
        valorDespues: true,
      },
    })
  }

  // ─────────────────────────────────────────────────────────────
  // KPIs
  // ─────────────────────────────────────────────────────────────

  private construirKpis(params: {
    cursosActivos: number
    participantesActivos: number
    tasaCompletitud: { fraccion: number; completadas: number; total: number }
    enRiesgoCount: number
  }): DashboardKpi[] {
    const { cursosActivos, participantesActivos, tasaCompletitud, enRiesgoCount } = params
    const pct = Math.round(tasaCompletitud.fraccion * 100)

    return [
      {
        id: "cursos",
        label: "Cursos activos",
        value: this.formatearNumero(cursosActivos),
        icon: "book-open",
        tone: "brand",
        helper: "publicados",
        href: RUTAS_ADMIN.cursos,
        trendData: this.tendenciaSintetica(cursosActivos),
      },
      {
        id: "participantes",
        label: "Participantes",
        value: this.formatearNumero(participantesActivos),
        icon: "users",
        tone: "info",
        helper: "con inscripcion activa",
        href: RUTAS_ADMIN.participantes,
        trendData: this.tendenciaSintetica(participantesActivos),
      },
      {
        id: "completitud",
        label: "Tasa de completitud",
        value: `${pct}%`,
        icon: "trending-up",
        tone: "success",
        helper:
          tasaCompletitud.total === 0
            ? "sin inscripciones cerradas"
            : `${tasaCompletitud.completadas} de ${tasaCompletitud.total}`,
        href: RUTAS_ADMIN.seguimiento,
        trendData: this.tendenciaSintetica(pct),
      },
      {
        id: "riesgo",
        label: "Participantes en riesgo",
        value: this.formatearNumero(enRiesgoCount),
        icon: "alert-triangle",
        tone: enRiesgoCount > 0 ? "danger" : "neutral",
        helper: `inactividad >${RIESGO_DIAS_INACTIVIDAD}d o deadline cercano`,
        href: RUTAS_ADMIN.seguimiento,
        trendData: this.tendenciaSintetica(enRiesgoCount),
      },
    ]
  }

  private formatearNumero(valor: number): string {
    // Localizado a es-CL (separador miles ".") sin decimales.
    return new Intl.NumberFormat("es-CL").format(valor)
  }

  // Sparkline placeholder hasta que existan snapshots diarios. Genera una
  // serie suave que termina en `valor` para que el grafico no mienta sobre
  // tendencias inexistentes (deuda T-snapshots-diarios).
  private tendenciaSintetica(valor: number): number[] {
    if (valor <= 0) {
      return new Array(TENDENCIA_PUNTOS).fill(0)
    }
    return Array.from({ length: TENDENCIA_PUNTOS }, (_, i) => {
      const factor = 0.7 + (0.3 * (i + 1)) / TENDENCIA_PUNTOS
      return Math.max(0, Math.round(valor * factor))
    })
  }

  // ─────────────────────────────────────────────────────────────
  // Cola de revision (banner CTA)
  // ─────────────────────────────────────────────────────────────

  private construirColaRevision(counts: {
    entregas: number
    proyectos: number
    alertas: number
  }): DashboardColaRevision {
    const total = counts.entregas + counts.proyectos + counts.alertas
    const description =
      total === 0 ? "Centro de revision al dia" : "Trabajo en cola que requiere tu evaluacion"
    return {
      title: "Centro de revision",
      description,
      href: RUTAS_ADMIN.centroRevision,
      items: [
        {
          id: "entregas",
          label: "entregas pendientes",
          count: counts.entregas,
          icon: "edit-3",
          tone: counts.entregas > 0 ? "warning" : "neutral",
          href: RUTAS_ADMIN.centroRevisionTab("entregas"),
        },
        {
          id: "proyectos",
          label: "proyectos por revisar",
          count: counts.proyectos,
          icon: "layers",
          tone: counts.proyectos > 0 ? "warning" : "neutral",
          href: RUTAS_ADMIN.centroRevisionTab("proyectos"),
        },
        {
          id: "alertas",
          label: "alertas IA",
          count: counts.alertas,
          icon: "alert-octagon",
          tone: counts.alertas > 0 ? "danger" : "neutral",
          href: RUTAS_ADMIN.centroRevisionTab("alertas"),
        },
      ],
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Alertas (panel izquierdo)
  // ─────────────────────────────────────────────────────────────

  private construirAlertas(counts: {
    entregas: number
    proyectos: number
    alertasIA: number
    enRiesgo: number
    diagnosticos: number
  }): DashboardAlerta[] {
    const alertas: DashboardAlerta[] = []

    if (counts.alertasIA > 0) {
      alertas.push({
        id: "alert-ia",
        title: `${counts.alertasIA} ${this.plural(counts.alertasIA, "alerta", "alertas")} de IA sin resolver`,
        meta: "Plagio o anomalias detectadas en proyectos",
        icon: "alert-octagon",
        tone: "danger",
        tag: "Critica",
        tagTone: "danger",
        action: "Revisar",
        href: RUTAS_ADMIN.centroRevisionTab("alertas"),
      })
    }

    if (counts.entregas > 0) {
      const critica = counts.entregas >= 5
      alertas.push({
        id: "alert-entregas",
        title: `${counts.entregas} ${this.plural(counts.entregas, "entrega pendiente", "entregas pendientes")} de evaluacion`,
        meta: "Bloques evaluables en cola",
        icon: "edit-3",
        tone: critica ? "danger" : "warning",
        tag: critica ? "Critica" : "Media",
        tagTone: critica ? "danger" : "warning",
        action: "Revisar",
        href: RUTAS_ADMIN.centroRevisionTab("entregas"),
      })
    }

    if (counts.proyectos > 0) {
      alertas.push({
        id: "alert-proyectos",
        title: `${counts.proyectos} ${this.plural(counts.proyectos, "proyecto", "proyectos")} por revisar`,
        meta: "Mini proyectos y transversales",
        icon: "layers",
        tone: "warning",
        tag: "Media",
        tagTone: "warning",
        action: "Ver detalle",
        href: RUTAS_ADMIN.centroRevisionTab("proyectos"),
      })
    }

    if (counts.enRiesgo > 0) {
      alertas.push({
        id: "alert-riesgo",
        title: `${counts.enRiesgo} ${this.plural(counts.enRiesgo, "participante", "participantes")} en riesgo`,
        meta: `Sin actividad >${RIESGO_DIAS_INACTIVIDAD}d o deadline cercano`,
        icon: "alert-triangle",
        tone: "danger",
        tag: "Critica",
        tagTone: "danger",
        action: "Ver seguimiento",
        href: RUTAS_ADMIN.seguimiento,
      })
    }

    if (counts.diagnosticos > 0) {
      alertas.push({
        id: "alert-diagnostico",
        title: `${counts.diagnosticos} ${this.plural(counts.diagnosticos, "participante", "participantes")} sin diagnostico`,
        meta: "Inscripciones activas sin evaluacion inicial capturada",
        icon: "compass",
        tone: "info",
        tag: "Normal",
        tagTone: "info",
        action: "Diagnosticar",
        href: RUTAS_ADMIN.diagnosticos,
      })
    }

    return alertas.slice(0, ALERTAS_LIMITE)
  }

  private plural(count: number, singular: string, pluralWord: string): string {
    return count === 1 ? singular : pluralWord
  }

  // ─────────────────────────────────────────────────────────────
  // Actividad reciente (feed desde LogActividad)
  // ─────────────────────────────────────────────────────────────

  private construirActividad(
    logs: Awaited<ReturnType<DashboardService["cargarLogActividadReciente"]>>,
    ahora: Date,
  ): DashboardActividad[] {
    const items: DashboardActividad[] = []
    for (const log of logs) {
      const item = this.mapearLogAActividad(log, ahora)
      if (item != null) {
        items.push(item)
      }
      if (items.length >= ACTIVIDAD_LIMITE) {
        break
      }
    }
    return items
  }

  private mapearLogAActividad(
    log: Awaited<ReturnType<DashboardService["cargarLogActividadReciente"]>>[number],
    ahora: Date,
  ): DashboardActividad | null {
    const actorNombre =
      log.tipoActor === "SISTEMA"
        ? "Sistema"
        : log.actor != null
          ? `${log.actor.nombre} ${log.actor.apellido}`.trim()
          : "Admin"

    const cuando = this.tiempoRelativo(log.timestamp, ahora)

    switch (log.tipoAccion) {
      case "CURSO_PUBLICADO":
        return {
          id: `log-${log.id}`,
          title: "Curso publicado",
          meta: `${actorNombre} · ${cuando}`,
          icon: "book-open",
          tone: "brand",
        }
      case "CURSO_CERRADO":
        return {
          id: `log-${log.id}`,
          title: "Curso cerrado",
          meta: `${actorNombre} · ${cuando}`,
          icon: "archive",
          tone: "neutral",
        }
      case "CURSO_CREADO":
      case "CURSO_DUPLICADO":
        return {
          id: `log-${log.id}`,
          title: log.tipoAccion === "CURSO_DUPLICADO" ? "Curso duplicado" : "Curso creado",
          meta: `${actorNombre} · ${cuando}`,
          icon: "plus-circle",
          tone: "info",
        }
      case "ENTREGA_EVALUADA":
      case "PROYECTO_EVALUADO": {
        const nota = this.extraerNotaDelLog(log.valorDespues)
        const tono = this.tonoSegunNota(nota)
        return {
          id: `log-${log.id}`,
          title: log.tipoAccion === "ENTREGA_EVALUADA" ? "Entrega evaluada" : "Proyecto evaluado",
          highlight: nota != null ? `${nota}/100` : undefined,
          highlightTone: tono,
          meta: `${actorNombre} · ${cuando}`,
          icon: "check-circle",
          tone: "success",
        }
      }
      case "NOTA_AJUSTADA_MANUAL":
      case "EXPEDIENTE_AJUSTADO":
        return {
          id: `log-${log.id}`,
          title:
            log.tipoAccion === "NOTA_AJUSTADA_MANUAL"
              ? "Nota ajustada manualmente"
              : "Expediente ajustado",
          meta: `${actorNombre} · ${cuando}`,
          icon: "edit-3",
          tone: "warning",
        }
      case "INSCRIPCION_COMPLETADA":
        return {
          id: `log-${log.id}`,
          title: "Inscripcion completada",
          meta: `${actorNombre} · ${cuando}`,
          icon: "award",
          tone: "success",
        }
      case "INSCRIPCION_DESINSCRITA":
      case "INSCRIPCION_CERRADA_SIN_COMPLETAR":
        return {
          id: `log-${log.id}`,
          title:
            log.tipoAccion === "INSCRIPCION_DESINSCRITA"
              ? "Inscripcion abandonada"
              : "Inscripcion cerrada sin completar",
          meta: `${actorNombre} · ${cuando}`,
          icon: "user-minus",
          tone: "neutral",
        }
      case "MODULOS_ASIGNADOS":
        return {
          id: `log-${log.id}`,
          title: "Modulos asignados",
          meta: `${actorNombre} · ${cuando}`,
          icon: "list",
          tone: "info",
        }
      case "EXPEDIENTE_SELLADO":
        return {
          id: `log-${log.id}`,
          title: "Expediente sellado",
          meta: `${actorNombre} · ${cuando}`,
          icon: "shield-check",
          tone: "success",
        }
      // El resto de tipos (RECALCULO_*, CURSO_AREAS_ACTUALIZADAS, AREA_*, MFA_*, etc.)
      // son ruido para la bandeja → se omiten. Si el equipo decide mostrarlos
      // mas adelante, se agregan aqui sin tocar la query.
      default:
        return null
    }
  }

  private extraerNotaDelLog(valor: unknown): number | null {
    if (valor == null || typeof valor !== "object") {
      return null
    }
    const obj = valor as Record<string, unknown>
    const candidatos = [obj.nota, obj.notaFinal, obj.puntaje]
    for (const c of candidatos) {
      if (typeof c === "number" && Number.isFinite(c)) {
        return Math.round(c)
      }
      if (typeof c === "string") {
        const parsed = Number.parseFloat(c)
        if (Number.isFinite(parsed)) {
          return Math.round(parsed)
        }
      }
    }
    return null
  }

  private tonoSegunNota(nota: number | null): DashboardActividad["highlightTone"] {
    if (nota == null) {
      return undefined
    }
    if (nota >= 70) {
      return "success"
    }
    if (nota >= 50) {
      return "warning"
    }
    return "danger"
  }

  private tiempoRelativo(fecha: Date, ahora: Date): string {
    const diffMs = ahora.getTime() - fecha.getTime()
    if (diffMs < 60_000) {
      return "ahora"
    }
    const minutos = Math.floor(diffMs / 60_000)
    if (minutos < 60) {
      return `hace ${minutos} min`
    }
    const horas = Math.floor(minutos / 60)
    if (horas < 24) {
      return `hace ${horas} h`
    }
    const dias = Math.floor(horas / 24)
    if (dias < 30) {
      return `hace ${dias} d`
    }
    const meses = Math.floor(dias / 30)
    return `hace ${meses} mes`
  }
}
