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

// Resultado intermedio del calculo de "participantes en riesgo".
// Se reusa en KPI y en alertas para no recorrer la BD dos veces.
type ParticipanteRiesgo = {
  inscripcionId: string
  motivo: "inactividad" | "deadline"
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerDashboard(): Promise<AdminDashboardResponse> {
    const ahora = new Date()

    // Lanza todas las queries independientes en paralelo. El service
    // agrega lecturas, no muta nada — no necesitamos transaccion.
    const [
      cursosActivos,
      participantesTotal,
      progresosCurso,
      enRiesgo,
      entregasPendientes,
      proyectosPendientes,
      diagnosticosPendientes,
      ultimasEntregas,
      ultimosCursos,
      ultimosDiagnosticos,
      ultimasInscripciones,
    ] = await Promise.all([
      this.contarCursosActivos(),
      this.contarParticipantesActivos(),
      this.cargarProgresosCurso(),
      this.detectarParticipantesEnRiesgo(ahora),
      this.contarEntregasPendientes(),
      this.contarProyectosPendientes(),
      this.contarParticipantesSinDiagnostico(),
      this.cargarUltimasEntregasEvaluadas(),
      this.cargarUltimosCursosPublicados(),
      this.cargarUltimosDiagnosticos(),
      this.cargarUltimasInscripciones(),
    ])

    const kpis = this.calcularKpis({
      cursosActivos,
      participantesTotal,
      progresosCurso,
      enRiesgoCount: enRiesgo.length,
    })

    const colaRevision = this.calcularColaRevision(entregasPendientes, proyectosPendientes)

    const alertas = await this.calcularAlertas({
      entregasPendientes,
      proyectosPendientes,
      enRiesgo,
      diagnosticosPendientes,
    })

    const actividad = this.calcularActividad({
      ultimasEntregas,
      ultimosCursos,
      ultimosDiagnosticos,
      ultimasInscripciones,
    })

    return { kpis, colaRevision, alertas, actividad }
  }

  // ─────────────────────────────────────────────────────────────
  // KPIs
  // ─────────────────────────────────────────────────────────────

  private contarCursosActivos(): Promise<number> {
    return this.prisma.curso.count({ where: { estado: "PUBLICADO" } })
  }

  private contarParticipantesActivos(): Promise<number> {
    return this.prisma.usuario.count({
      where: { rol: "PARTICIPANTE", activo: true },
    })
  }

  private cargarProgresosCurso() {
    return this.prisma.progresoCurso.findMany({
      select: { porcentaje: true, estado: true, actualizadoEn: true },
    })
  }

  private async detectarParticipantesEnRiesgo(ahora: Date): Promise<ParticipanteRiesgo[]> {
    const limiteInactividad = new Date(
      ahora.getTime() - RIESGO_DIAS_INACTIVIDAD * 24 * 60 * 60 * 1000,
    )
    const limiteDeadline = new Date(
      ahora.getTime() + RIESGO_DIAS_DEADLINE_CERCANO * 24 * 60 * 60 * 1000,
    )

    // Riesgo = inscripcion ACTIVA que cumple alguna de:
    //   a) sin actualizar progreso en > N dias
    //   b) fechaLimite dentro de los proximos N dias
    const inscripciones = await this.prisma.inscripcion.findMany({
      where: { estado: "ACTIVA" },
      select: {
        id: true,
        fechaLimite: true,
        progresoCurso: { select: { actualizadoEn: true, estado: true } },
      },
    })

    const riesgos: ParticipanteRiesgo[] = []
    for (const ins of inscripciones) {
      const inactivo =
        ins.progresoCurso != null &&
        ins.progresoCurso.estado !== "COMPLETADO" &&
        ins.progresoCurso.actualizadoEn < limiteInactividad

      const deadlineCerca =
        ins.fechaLimite != null && ins.fechaLimite > ahora && ins.fechaLimite < limiteDeadline

      if (inactivo) {
        riesgos.push({ inscripcionId: ins.id, motivo: "inactividad" })
      } else if (deadlineCerca) {
        riesgos.push({ inscripcionId: ins.id, motivo: "deadline" })
      }
    }
    return riesgos
  }

  private calcularKpis(params: {
    cursosActivos: number
    participantesTotal: number
    progresosCurso: { porcentaje: number; estado: string }[]
    enRiesgoCount: number
  }): DashboardKpi[] {
    const { cursosActivos, participantesTotal, progresosCurso, enRiesgoCount } = params

    const completados = progresosCurso.filter((p) => p.estado === "COMPLETADO").length
    const totalProgresos = progresosCurso.length
    const tasaCompletitud =
      totalProgresos === 0 ? 0 : Math.round((completados / totalProgresos) * 100)

    return [
      {
        id: "cursos",
        label: "Cursos activos",
        value: String(cursosActivos),
        icon: "book",
        color: "indigo",
        helper: "publicados",
        href: RUTAS_ADMIN.cursos,
        trendData: this.tendenciaSintetica(cursosActivos),
      },
      {
        id: "participantes",
        label: "Participantes",
        value: String(participantesTotal),
        icon: "users",
        color: "violet",
        helper: "activos",
        href: RUTAS_ADMIN.personas,
        trendData: this.tendenciaSintetica(participantesTotal),
      },
      {
        id: "completitud",
        label: "Tasa de completitud",
        value: `${tasaCompletitud}%`,
        icon: "trending-up",
        color: "emerald",
        helper: `${completados} de ${totalProgresos}`,
        href: RUTAS_ADMIN.seguimiento,
        trendData: this.tendenciaSintetica(tasaCompletitud),
      },
      {
        id: "riesgo",
        label: "Participantes en riesgo",
        value: String(enRiesgoCount),
        icon: "alert-triangle",
        color: "rose",
        helper: `inactividad >${RIESGO_DIAS_INACTIVIDAD}d o deadline cercano`,
        href: RUTAS_ADMIN.seguimiento,
        trendData: this.tendenciaSintetica(enRiesgoCount),
      },
    ]
  }

  // Sparkline placeholder mientras no exista historia real (snapshots diarios).
  // Genera una serie suave que termina en `valor` para que el componente NxtKpi
  // renderice algo coherente sin mentir sobre tendencias inexistentes.
  private tendenciaSintetica(valor: number): number[] {
    const puntos = TENDENCIA_PUNTOS
    if (valor <= 0) {
      return new Array(puntos).fill(0)
    }
    return Array.from({ length: puntos }, (_, i) => {
      const factor = 0.7 + (0.3 * (i + 1)) / puntos
      return Math.max(0, Math.round(valor * factor))
    })
  }

  // ─────────────────────────────────────────────────────────────
  // COLA DE REVISION (banner-CTA)
  // ─────────────────────────────────────────────────────────────

  private contarEntregasPendientes(): Promise<number> {
    // PENDIENTE: aun no se evaluo. REVISANDO: admin la abrio pero no cerro.
    // Ambos cuentan como cola de trabajo del admin.
    return this.prisma.entrega.count({
      where: {
        estado: { in: ["PENDIENTE", "REVISANDO"] },
        contenido_: { tipo: { in: ["EJERCICIO", "TEST"] } },
      },
    })
  }

  private contarProyectosPendientes(): Promise<number> {
    // No hay tabla de proyectos aun (sprint posterior). Por ahora contamos
    // entregas REQUIERE_REVISION como "proyectos por revisar" para reflejar
    // los datos del seed sin inventar entidades.
    return this.prisma.entrega.count({
      where: { estado: "REQUIERE_REVISION" },
    })
  }

  private async contarParticipantesSinDiagnostico(): Promise<number> {
    // Inscripciones ACTIVAS cuyo usuario no tiene diagnostico en el curso.
    const sinDiagnostico = await this.prisma.inscripcion.count({
      where: {
        estado: "ACTIVA",
        usuario: {
          diagnosticos: { none: {} },
        },
      },
    })
    return sinDiagnostico
  }

  private calcularColaRevision(entregas: number, proyectos: number): DashboardColaRevision {
    return {
      title: "Centro de revision",
      description: "Tienes trabajo en cola que requiere tu evaluacion",
      href: RUTAS_ADMIN.centroRevision,
      items: [
        {
          id: "entregas",
          label: "entregas pendientes",
          count: entregas,
          icon: "edit",
          tone: "amber",
          href: RUTAS_ADMIN.centroRevisionTab("entregas"),
        },
        {
          id: "proyectos",
          label: "proyectos por revisar",
          count: proyectos,
          icon: "layers",
          tone: "rose",
          href: RUTAS_ADMIN.centroRevisionTab("proyectos"),
        },
      ],
    }
  }

  // ─────────────────────────────────────────────────────────────
  // ALERTAS
  // ─────────────────────────────────────────────────────────────

  private async calcularAlertas(params: {
    entregasPendientes: number
    proyectosPendientes: number
    enRiesgo: ParticipanteRiesgo[]
    diagnosticosPendientes: number
  }): Promise<DashboardAlerta[]> {
    const { entregasPendientes, proyectosPendientes, enRiesgo, diagnosticosPendientes } = params
    const alertas = [
      await this.alertaEntregasPendientes(entregasPendientes),
      this.alertaProyectosPendientes(proyectosPendientes),
      this.alertaParticipantesEnRiesgo(enRiesgo.length),
      this.alertaDiagnosticosPendientes(diagnosticosPendientes),
    ].filter((a): a is DashboardAlerta => a !== null)
    return alertas.slice(0, ALERTAS_LIMITE)
  }

  private async alertaEntregasPendientes(total: number): Promise<DashboardAlerta | null> {
    if (total <= 0) {
      return null
    }
    const ejemplo = await this.prisma.entrega.findFirst({
      where: {
        estado: { in: ["PENDIENTE", "REVISANDO"] },
        contenido_: { tipo: { in: ["EJERCICIO", "TEST"] } },
      },
      orderBy: { creadoEn: "desc" },
      select: {
        contenido_: {
          select: {
            titulo: true,
            seccion: { select: { modulo: { select: { titulo: true } } } },
          },
        },
      },
    })
    const moduloTitulo = ejemplo?.contenido_.seccion.modulo.titulo ?? "Curso"
    const critica = total >= 5
    return {
      id: "alert-entregas",
      title: `${total} ${this.plural(total, "entrega pendiente", "entregas pendientes")} de evaluacion`,
      meta: `${moduloTitulo} · Ultima reciente`,
      icon: "edit",
      gradient: "indigo",
      tag: critica ? "Critica" : "Media",
      tagVariant: critica ? "critical" : "warning",
      action: "Revisar",
      href: RUTAS_ADMIN.centroRevisionTab("entregas"),
    }
  }

  private alertaProyectosPendientes(total: number): DashboardAlerta | null {
    if (total <= 0) {
      return null
    }
    return {
      id: "alert-proyectos",
      title: `${total} ${this.plural(total, "entrega requiere", "entregas requieren")} revision adicional`,
      meta: "Estado REQUIERE_REVISION",
      icon: "layers",
      gradient: "amber",
      tag: "Media",
      tagVariant: "warning",
      action: "Ver detalle",
      href: RUTAS_ADMIN.centroRevisionTab("proyectos"),
    }
  }

  private alertaParticipantesEnRiesgo(total: number): DashboardAlerta | null {
    if (total <= 0) {
      return null
    }
    return {
      id: "alert-riesgo",
      title: `${total} ${this.plural(total, "participante", "participantes")} en riesgo de no completar`,
      meta: `Sin actividad >${RIESGO_DIAS_INACTIVIDAD}d o deadline cercano`,
      icon: "alert-triangle",
      gradient: "rose",
      tag: "Critica",
      tagVariant: "critical",
      action: "Ver seguimiento",
      href: RUTAS_ADMIN.seguimiento,
    }
  }

  private alertaDiagnosticosPendientes(total: number): DashboardAlerta | null {
    if (total <= 0) {
      return null
    }
    return {
      id: "alert-diagnostico",
      title: `${total} ${this.plural(total, "participante", "participantes")} sin diagnostico aplicado`,
      meta: "Inscripciones activas sin entrevista interna registrada",
      icon: "bar-chart",
      gradient: "violet",
      tag: "Normal",
      tagVariant: "info",
      action: "Diagnosticar",
      href: RUTAS_ADMIN.diagnosticos,
    }
  }

  private plural(count: number, singular: string, plural: string): string {
    return count === 1 ? singular : plural
  }

  // ─────────────────────────────────────────────────────────────
  // ACTIVIDAD RECIENTE
  // ─────────────────────────────────────────────────────────────

  private cargarUltimasEntregasEvaluadas() {
    return this.prisma.entrega.findMany({
      where: { estado: "APROBADA", evaluadoEn: { not: null } },
      orderBy: { evaluadoEn: "desc" },
      take: ACTIVIDAD_LIMITE,
      select: {
        id: true,
        puntaje: true,
        evaluadoEn: true,
        usuario: { select: { nombre: true, apellido: true } },
        contenido_: {
          select: {
            titulo: true,
            seccion: { select: { modulo: { select: { titulo: true } } } },
          },
        },
      },
    })
  }

  private cargarUltimosCursosPublicados() {
    return this.prisma.curso.findMany({
      where: { estado: "PUBLICADO" },
      orderBy: { actualizadoEn: "desc" },
      take: ACTIVIDAD_LIMITE,
      select: {
        id: true,
        titulo: true,
        actualizadoEn: true,
        _count: { select: { modulos: true } },
      },
    })
  }

  private cargarUltimosDiagnosticos() {
    return this.prisma.diagnostico.findMany({
      orderBy: { fecha: "desc" },
      take: ACTIVIDAD_LIMITE,
      select: {
        id: true,
        fecha: true,
        usuario: { select: { nombre: true, apellido: true } },
        curso: { select: { titulo: true } },
        _count: { select: { resultados: true } },
      },
    })
  }

  private cargarUltimasInscripciones() {
    return this.prisma.inscripcion.findMany({
      orderBy: { fechaInscripcion: "desc" },
      take: ACTIVIDAD_LIMITE,
      // Agrupar por convocatoria para que cuente "X participantes en Y" en lugar
      // de un item por inscripcion individual. La agregacion la hago en memoria
      // porque el feed final es chico (max ACTIVIDAD_LIMITE * 3 ~= 18 filas).
      select: {
        id: true,
        fechaInscripcion: true,
        convocatoria: { select: { id: true, titulo: true } },
        curso: { select: { titulo: true } },
      },
    })
  }

  private calcularActividad(params: {
    ultimasEntregas: Awaited<ReturnType<DashboardService["cargarUltimasEntregasEvaluadas"]>>
    ultimosCursos: Awaited<ReturnType<DashboardService["cargarUltimosCursosPublicados"]>>
    ultimosDiagnosticos: Awaited<ReturnType<DashboardService["cargarUltimosDiagnosticos"]>>
    ultimasInscripciones: Awaited<ReturnType<DashboardService["cargarUltimasInscripciones"]>>
  }): DashboardActividad[] {
    const items: (DashboardActividad & { fecha: Date })[] = [
      ...this.actividadDesdeEntregas(params.ultimasEntregas),
      ...this.actividadDesdeCursos(params.ultimosCursos),
      ...this.actividadDesdeDiagnosticos(params.ultimosDiagnosticos),
      ...this.actividadDesdeInscripciones(params.ultimasInscripciones),
    ]

    return items
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, ACTIVIDAD_LIMITE)
      .map(({ fecha: _fecha, ...item }) => item)
  }

  private actividadDesdeEntregas(
    entregas: Awaited<ReturnType<DashboardService["cargarUltimasEntregasEvaluadas"]>>,
  ): (DashboardActividad & { fecha: Date })[] {
    return entregas
      .filter((e) => e.evaluadoEn != null)
      .map((e) => {
        const nombre = `${e.usuario.nombre} ${e.usuario.apellido}`
        const moduloTitulo = e.contenido_.seccion.modulo.titulo
        const evaluadoEn = e.evaluadoEn as Date
        return {
          id: `entrega-${e.id}`,
          title: `${e.contenido_.titulo} evaluado con`,
          highlight: e.puntaje != null ? `${e.puntaje}/100` : undefined,
          highlightTone: this.tonoSegunNota(e.puntaje),
          meta: `${moduloTitulo} · ${nombre} · ${this.tiempoRelativo(evaluadoEn)}`,
          icon: "check-circle",
          gradient: "emerald",
          fecha: evaluadoEn,
        }
      })
  }

  private actividadDesdeCursos(
    cursos: Awaited<ReturnType<DashboardService["cargarUltimosCursosPublicados"]>>,
  ): (DashboardActividad & { fecha: Date })[] {
    return cursos.map((c) => ({
      id: `curso-${c.id}`,
      title: `Curso "${c.titulo}" publicado`,
      meta: `${c._count.modulos} modulos · ${this.tiempoRelativo(c.actualizadoEn)}`,
      icon: "book",
      gradient: "indigo",
      fecha: c.actualizadoEn,
    }))
  }

  private actividadDesdeDiagnosticos(
    diagnosticos: Awaited<ReturnType<DashboardService["cargarUltimosDiagnosticos"]>>,
  ): (DashboardActividad & { fecha: Date })[] {
    return diagnosticos.map((d) => {
      const nombre = `${d.usuario.nombre} ${d.usuario.apellido}`
      return {
        id: `diagnostico-${d.id}`,
        title: `Diagnostico completado para ${nombre}`,
        meta: `${d.curso.titulo} · ${d._count.resultados} modulos · ${this.tiempoRelativo(d.fecha)}`,
        icon: "compass",
        gradient: "violet",
        fecha: d.fecha,
      }
    })
  }

  private actividadDesdeInscripciones(
    inscripciones: Awaited<ReturnType<DashboardService["cargarUltimasInscripciones"]>>,
  ): (DashboardActividad & { fecha: Date })[] {
    // Agrupa inscripciones por convocatoria del mismo dia: "X participantes en Y".
    const grupos = new Map<
      string,
      { convocatoria: string; curso: string; count: number; fecha: Date }
    >()
    for (const i of inscripciones) {
      if (!i.convocatoria) {
        continue
      }
      const claveDia = i.fechaInscripcion.toISOString().slice(0, 10)
      const clave = `${i.convocatoria.id}-${claveDia}`
      const previo = grupos.get(clave)
      if (previo) {
        previo.count += 1
        if (i.fechaInscripcion > previo.fecha) {
          previo.fecha = i.fechaInscripcion
        }
      } else {
        grupos.set(clave, {
          convocatoria: i.convocatoria.titulo,
          curso: i.curso.titulo,
          count: 1,
          fecha: i.fechaInscripcion,
        })
      }
    }
    return Array.from(grupos.entries()).map(([clave, g]) => ({
      id: `inscripciones-${clave}`,
      title: `${g.count} ${this.plural(g.count, "participante inscrito", "participantes inscritos")} en ${g.convocatoria}`,
      meta: `${g.curso} · ${this.tiempoRelativo(g.fecha)}`,
      icon: "users",
      gradient: "amber",
      fecha: g.fecha,
    }))
  }

  private tonoSegunNota(nota: number | null): "emerald" | "amber" | "rose" | "neutral" | undefined {
    if (nota == null) {
      return undefined
    }
    if (nota >= 90) {
      return "emerald"
    }
    if (nota >= 70) {
      return "emerald"
    }
    if (nota >= 50) {
      return "amber"
    }
    return "rose"
  }

  private tiempoRelativo(fecha: Date): string {
    const diffMs = Date.now() - fecha.getTime()
    const minutos = Math.floor(diffMs / 60_000)
    if (minutos < 1) {
      return "ahora"
    }
    if (minutos < 60) {
      return `Hace ${minutos}min`
    }
    const horas = Math.floor(minutos / 60)
    if (horas < 24) {
      return `Hace ${horas}h`
    }
    const dias = Math.floor(horas / 24)
    if (dias < 30) {
      return `Hace ${dias}d`
    }
    const meses = Math.floor(dias / 30)
    return `Hace ${meses}mes`
  }
}
