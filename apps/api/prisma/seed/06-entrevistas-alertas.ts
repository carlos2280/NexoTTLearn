import type { UsuariosSeedResult } from "./00-usuarios.js"
/**
 * Sesiones de Entrevista IA y Alertas IA para el curso XYZ.
 *
 * Cubre los 5 estados de EstadoEntrevistaIA y 3 niveles de Confianza:
 *   - PENDIENTE              · Pedro (sesión creada, sin iniciar)
 *   - EN_CURSO               · Juan (iniciada hace 2h)
 *   - APROBADA               · María (intento 1, score 78, confianza ALTA)
 *   - NO_APROBADA + reintento APROBADA · Pedro intento 1 NO + intento 2 ajustado manualmente
 *
 * Plus AlertaIA: 1 sin resolver (severidad alta) + 1 resuelta por admin.
 */
import type { CursoXyzSeedResult } from "./02-curso-xyz.js"
import { diasAtras, horasAtras, prisma, uuidEstable } from "./_lib.js"

export async function seedEntrevistasYAlertas(
  usuarios: UsuariosSeedResult,
  cursoXyz: CursoXyzSeedResult,
): Promise<void> {
  await crearSesionesEntrevista(cursoXyz)
  await crearAlertas(usuarios)
  console.info("  ✓ Entrevistas IA: 4 sesiones (PENDIENTE/EN_CURSO/APROBADA/AJUSTADA) + 2 alertas")
}

async function crearSesionesEntrevista(cursoXyz: CursoXyzSeedResult): Promise<void> {
  // Pedro · PENDIENTE
  await upsertSesion({
    key: "pedro:1",
    inscripcionId: uuidEstable("inscripcion:pedro:xyz"),
    configId: cursoXyz.entrevistaConfigId,
    intento: 1,
    estado: "PENDIENTE",
    iniciadaAt: null,
    finalizadaAt: null,
    score: null,
  })

  // Juan · EN_CURSO
  await upsertSesion({
    key: "juan:1",
    inscripcionId: uuidEstable("inscripcion:juan:xyz"),
    configId: cursoXyz.entrevistaConfigId,
    intento: 1,
    estado: "EN_CURSO",
    iniciadaAt: horasAtras(2),
    finalizadaAt: null,
    score: null,
  })

  // María · APROBADA con score 78, confianza ALTA
  await upsertSesion({
    key: "maria:1",
    inscripcionId: uuidEstable("inscripcion:maria:xyz"),
    configId: cursoXyz.entrevistaConfigId,
    intento: 1,
    estado: "APROBADA",
    iniciadaAt: diasAtras(3),
    finalizadaAt: diasAtras(3),
    score: 78,
    confianza: "ALTA",
    fortalezas: "Buena articulación de soluciones técnicas.",
    areasMejora: "Profundizar en patrones de despliegue cloud.",
    desglose: { fe: 80, be: 75, bd: 78, cl: 75, he: 85 },
  })

  // Pedro · NO_APROBADA → ajustada manualmente APROBADA (intento 2 con override admin)
  await upsertSesion({
    key: "pedro:hist:1",
    inscripcionId: uuidEstable("inscripcion:pedro:xyz"),
    configId: cursoXyz.entrevistaConfigId,
    intento: 2,
    estado: "AJUSTADA_MANUAL",
    iniciadaAt: diasAtras(8),
    finalizadaAt: diasAtras(8),
    score: 72,
    confianza: "MEDIA",
    fortalezas: "Sólida en arquitectura.",
    areasMejora: "Tiempo de respuesta lento en preguntas técnicas.",
    desglose: { fe: 70, be: 75, bd: 70, cl: 72, he: 73 },
    ajustadaManual: true,
  })
}

async function upsertSesion(opts: {
  key: string
  inscripcionId: string
  configId: string
  intento: number
  estado: "PENDIENTE" | "EN_CURSO" | "APROBADA" | "NO_APROBADA" | "AJUSTADA_MANUAL"
  iniciadaAt: Date | null
  finalizadaAt: Date | null
  score: number | null
  confianza?: "ALTA" | "MEDIA" | "BAJA"
  fortalezas?: string
  areasMejora?: string
  desglose?: Record<string, number>
  ajustadaManual?: boolean
}): Promise<void> {
  const id = uuidEstable(`entrevistaSesion:${opts.key}`)
  await prisma.entrevistaIASesion.upsert({
    where: { id },
    update: {},
    create: {
      id,
      inscripcionId: opts.inscripcionId,
      configId: opts.configId,
      intento: opts.intento,
      estado: opts.estado,
      iniciadaAt: opts.iniciadaAt,
      finalizadaAt: opts.finalizadaAt,
      scoreGeneral: opts.score,
      confianza: opts.confianza ?? null,
      fortalezas: opts.fortalezas ?? null,
      areasMejora: opts.areasMejora ?? null,
      desglosePorArea: opts.desglose ?? undefined,
      ajustadaManual: opts.ajustadaManual ?? false,
    },
  })
}

async function crearAlertas(usuarios: UsuariosSeedResult): Promise<void> {
  const entregaPedroTrans1 = uuidEstable("entregaProyecto:pedro:trans:1")
  const entregaMariaMini = uuidEstable("entregaProyecto:maria:mini_fe:1")

  // Alerta sin resolver — alta similitud con repositorio público.
  await prisma.alertaIA.upsert({
    where: { id: uuidEstable("alertaIA:pedro:trans:1") },
    update: {},
    create: {
      id: uuidEstable("alertaIA:pedro:trans:1"),
      entregaProyectoId: entregaPedroTrans1,
      tipo: "similitud",
      severidad: "alta",
      descripcion: "Similitud >70% con repo público github.com/foo/bar. Revisar antes de evaluar.",
      detectadaAt: diasAtras(5),
    },
  })

  // Alerta resuelta por admin (descartada).
  await prisma.alertaIA.upsert({
    where: { id: uuidEstable("alertaIA:maria:mini_fe:1") },
    update: {},
    create: {
      id: uuidEstable("alertaIA:maria:mini_fe:1"),
      entregaProyectoId: entregaMariaMini,
      tipo: "anomalia",
      severidad: "media",
      descripcion: "Estilo del código difiere del histórico de la participante.",
      detectadaAt: diasAtras(5),
      resueltaAt: diasAtras(4),
      resueltaPorId: usuarios.admin.id,
    },
  })
}
