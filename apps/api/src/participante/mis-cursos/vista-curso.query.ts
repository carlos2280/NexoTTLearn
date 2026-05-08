// Carga la inscripcion del participante a un curso identificado por slug,
// junto con todo lo necesario para renderizar la vista del curso:
//   - inscripcion + curso + areas + modulos no archivados
//   - asignaciones del participante (subset de modulos del curso)
//   - estados por modulo (avance, completadoAt, iniciadoAt)
//   - mini-proyectos por modulo + sus entregas
//   - proyecto transversal + sus entregas
//   - entrevista IA config + sus sesiones
//   - cantidad de secciones y bloques por modulo (para metadata UI)
//   - expediente (nota global) si COMPLETADA
//
// Devuelve null si la inscripcion no existe o esta CERRADO_SIN_COMPLETAR
// (por §6.4 README, ese estado vive en /expediente, no aqui).

import type { PrismaService } from "../../common/prisma/prisma.service"

export interface VistaCursoData {
  readonly inscripcionId: string
  readonly tipoInscripcion: "SOLICITUD" | "LIBRE"
  readonly estadoInscripcion: "ACTIVA" | "COMPLETADA" | "ABANDONADA"
  readonly inscritaAt: Date
  readonly completadaAt: Date | null
  readonly abandonadaAt: Date | null
  readonly notaGlobal: number | null

  readonly curso: {
    readonly id: string
    readonly slug: string
    readonly titulo: string
    readonly descripcion: string | null
    readonly empresaCliente: string
    readonly fechaInicio: Date | null
    readonly deadline: Date | null
  }

  readonly areas: ReadonlyArray<{
    readonly id: string
    readonly nombre: string
    readonly color: string
    readonly peso: number
    readonly puntajeObjetivo: number
    readonly orden: number
  }>

  readonly modulos: ReadonlyArray<{
    readonly id: string
    readonly titulo: string
    readonly orden: number
    readonly areaId: string
    readonly cantidadSecciones: number
    readonly cantidadBloques: number
    readonly miniProyecto: {
      readonly id: string
      readonly titulo: string
      readonly umbralAprobacion: number
    } | null
  }>

  readonly asignaciones: ReadonlyArray<{
    readonly moduloId: string
    readonly tipo: "OBLIGATORIO" | "RECOMENDADO" | "OPCIONAL"
  }>

  readonly estadosModulo: ReadonlyArray<{
    readonly moduloId: string
    readonly estado: "NO_INICIADO" | "EN_PROGRESO" | "COMPLETADO"
    readonly porcentajeAvance: number
    readonly completadoAt: Date | null
  }>

  readonly entregasMini: ReadonlyArray<{
    readonly miniProyectoId: string
    readonly intento: number
    readonly notaFinal: number | null
    readonly estado: "ENVIADA" | "EN_REVISION" | "EVALUADA"
    readonly enviadaAt: Date
  }>

  readonly transversal: {
    readonly id: string
    readonly titulo: string
    readonly enunciado: string
    readonly umbralAprobacion: number
  } | null

  readonly entregasTransversal: ReadonlyArray<{
    readonly transversalId: string
    readonly intento: number
    readonly notaFinal: number | null
    readonly estado: "ENVIADA" | "EN_REVISION" | "EVALUADA"
    readonly enviadaAt: Date
  }>

  readonly entrevistaConfig: {
    readonly id: string
    readonly umbralAprobacion: number
    readonly maxIntentos: number
  } | null

  readonly sesionesEntrevista: ReadonlyArray<{
    readonly intento: number
    readonly estado: "PENDIENTE" | "EN_CURSO" | "APROBADA" | "NO_APROBADA" | "AJUSTADA_MANUAL"
    readonly scoreGeneral: number | null
    readonly finalizadaAt: Date | null
  }>

  /** Sumas de notas evaluadas por modulo (para horas dedicadas / contenidos vistos). */
  readonly bloquesInteractuados: number
  /** Horas estimadas: 0 en MVP (no hay sesiones tracking). El campo queda por contrato. */
  readonly horasDedicadas: number
}

export async function cargarDataVistaCurso(
  prisma: PrismaService,
  participanteId: string,
  slug: string,
): Promise<VistaCursoData | null> {
  const inscripcion = await prisma.inscripcion.findFirst({
    where: {
      participanteId,
      curso: { slug },
      estado: { in: ["ACTIVA", "COMPLETADA", "ABANDONADA"] },
    },
    select: {
      id: true,
      tipo: true,
      estado: true,
      inscritaAt: true,
      completadaAt: true,
      abandonadaAt: true,
      curso: {
        select: {
          id: true,
          slug: true,
          titulo: true,
          descripcion: true,
          empresaCliente: true,
          fechaInicio: true,
          deadline: true,
          cursoAreas: {
            select: {
              areaId: true,
              peso: true,
              puntajeObjetivo: true,
              orden: true,
              area: { select: { id: true, nombre: true, color: true } },
            },
          },
          modulos: {
            where: { archivadoAt: null },
            select: {
              id: true,
              titulo: true,
              orden: true,
              areaId: true,
              secciones: {
                where: { archivadoAt: null },
                select: {
                  id: true,
                  bloques: { where: { archivadoAt: null }, select: { id: true } },
                },
              },
              miniProyecto: {
                select: { id: true, titulo: true },
              },
            },
            orderBy: { orden: "asc" },
          },
          proyectoTransversal: {
            select: { id: true, titulo: true, enunciado: true, umbralAprobacion: true },
          },
          entrevistaIAConfig: {
            select: { id: true, umbralAprobacion: true, maxIntentos: true },
          },
        },
      },
      asignaciones: { select: { moduloId: true, tipo: true } },
      estadosModulo: {
        select: {
          moduloId: true,
          estado: true,
          porcentajeAvance: true,
          completadoAt: true,
        },
      },
      entregasProyecto: {
        select: {
          miniProyectoId: true,
          transversalId: true,
          intento: true,
          notaFinal: true,
          estado: true,
          enviadaAt: true,
        },
        orderBy: { enviadaAt: "asc" },
      },
      sesionesEntrevistaIA: {
        select: { intento: true, estado: true, scoreGeneral: true, finalizadaAt: true },
        orderBy: { intento: "asc" },
      },
    },
  })

  if (!inscripcion) {
    return null
  }

  // Umbral del mini = override del modulo (hereda de objetivo del area si null).
  // No se carga aqui el override por simplicidad: el front no lo usa para
  // mostrar el bloqueo (basta con saber si nota >= umbral del proyecto).
  // umbralMiniOverride se ignora deliberadamente; usar umbralAprobacion=70 como fallback.
  const umbralMiniFallback = 70

  const modulos = inscripcion.curso.modulos.map((m) => ({
    id: m.id,
    titulo: m.titulo,
    orden: m.orden,
    areaId: m.areaId,
    cantidadSecciones: m.secciones.length,
    cantidadBloques: m.secciones.reduce((acc, s) => acc + s.bloques.length, 0),
    miniProyecto: m.miniProyecto
      ? {
          id: m.miniProyecto.id,
          titulo: m.miniProyecto.titulo,
          umbralAprobacion: umbralMiniFallback,
        }
      : null,
  }))

  const areas = inscripcion.curso.cursoAreas
    .map((ca) => ({
      id: ca.area.id,
      nombre: ca.area.nombre,
      color: ca.area.color,
      peso: Number(ca.peso),
      puntajeObjetivo: ca.puntajeObjetivo,
      orden: ca.orden,
    }))
    .sort((a, b) => a.orden - b.orden)

  const entregasMini = inscripcion.entregasProyecto
    .filter((e) => e.miniProyectoId != null)
    .map((e) => ({
      miniProyectoId: e.miniProyectoId as string,
      intento: e.intento,
      notaFinal: e.notaFinal == null ? null : Number(e.notaFinal),
      estado: e.estado,
      enviadaAt: e.enviadaAt,
    }))

  const entregasTransversal = inscripcion.entregasProyecto
    .filter((e) => e.transversalId != null)
    .map((e) => ({
      transversalId: e.transversalId as string,
      intento: e.intento,
      notaFinal: e.notaFinal == null ? null : Number(e.notaFinal),
      estado: e.estado,
      enviadaAt: e.enviadaAt,
    }))

  const sesionesEntrevista = inscripcion.sesionesEntrevistaIA.map((s) => ({
    intento: s.intento,
    estado: s.estado,
    scoreGeneral: s.scoreGeneral == null ? null : Number(s.scoreGeneral),
    finalizadaAt: s.finalizadaAt,
  }))

  let notaGlobal: number | null = null
  if (inscripcion.estado === "COMPLETADA") {
    const expediente = await prisma.expedienteEntry.findUnique({
      where: {
        // biome-ignore lint/style/useNamingConvention: where compuesto Prisma
        participanteId_cursoId: { participanteId, cursoId: inscripcion.curso.id },
      },
      select: { notaGlobal: true },
    })
    notaGlobal = expediente == null ? null : Number(expediente.notaGlobal)
  }

  // Bloques interactuados unicos del participante en este curso.
  const bloqueIdsDelCurso = inscripcion.curso.modulos.flatMap((m) =>
    m.secciones.flatMap((s) => s.bloques.map((b) => b.id)),
  )
  let bloquesInteractuados = 0
  if (bloqueIdsDelCurso.length > 0) {
    const distinctBloques = await prisma.entregaBloque.findMany({
      where: { inscripcionId: inscripcion.id, bloqueId: { in: bloqueIdsDelCurso } },
      distinct: ["bloqueId"],
      select: { bloqueId: true },
    })
    bloquesInteractuados = distinctBloques.length
  }

  return {
    inscripcionId: inscripcion.id,
    tipoInscripcion: inscripcion.tipo,
    estadoInscripcion: inscripcion.estado as "ACTIVA" | "COMPLETADA" | "ABANDONADA",
    inscritaAt: inscripcion.inscritaAt,
    completadaAt: inscripcion.completadaAt,
    abandonadaAt: inscripcion.abandonadaAt,
    notaGlobal,
    curso: {
      id: inscripcion.curso.id,
      slug: inscripcion.curso.slug,
      titulo: inscripcion.curso.titulo,
      descripcion: inscripcion.curso.descripcion,
      empresaCliente: inscripcion.curso.empresaCliente,
      fechaInicio: inscripcion.curso.fechaInicio,
      deadline: inscripcion.curso.deadline,
    },
    areas,
    modulos,
    asignaciones: inscripcion.asignaciones,
    estadosModulo: inscripcion.estadosModulo,
    entregasMini,
    transversal: inscripcion.curso.proyectoTransversal,
    entregasTransversal,
    entrevistaConfig: inscripcion.curso.entrevistaIAConfig,
    sesionesEntrevista,
    bloquesInteractuados,
    horasDedicadas: 0, // MVP: sin tracking de sesiones de estudio.
  }
}
