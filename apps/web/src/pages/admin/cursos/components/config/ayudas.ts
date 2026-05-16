import type { AyudaContenido } from "@/shared/components/ui/ayuda-popover"

/**
 * Ayudas contextuales para las secciones de configuración del curso.
 *
 * Texto editorial pensado para un admin nuevo: explica qué es cada parámetro,
 * qué pasa al cambiarlo y un ejemplo típico. Lenguaje claro, sin jerga.
 */
export const AYUDAS_CONFIG_CURSO = {
  pesos: {
    queEs:
      "La nota final de cada skill viene de tres fuentes: clases (bloques), proyecto transversal y entrevista IA. Aquí decides cuánto pesa cada una.",
    siCambias:
      "Subir el peso del proyecto favorece a quien lo ejecuta bien aunque flojee en clases. Bajar el de bloques le quita importancia a los ejercicios. Los tres siempre suman 100%.",
    ejemplo:
      "Cliente con proyecto crítico → 50 / 40 / 10. Cliente que valora consistencia en clase → 70 / 20 / 10 (defecto).",
  },
  umbrales: {
    queEs:
      "Los umbrales convierten las notas (0–100) en etiquetas legibles: Excelencia, Sólido, En desarrollo, Inicial. Aparecen en los reportes para colaboradores y cliente.",
    siCambias:
      "Si bajas el corte de Sólido a 65, más colaboradores aparecerán como sólidos en los reportes. Subirlos hace los criterios más estrictos. Los defaults del sistema son 90 / 70 / 50.",
    ejemplo:
      "Cliente con criterios menos estrictos para un proyecto inicial → Excelencia 85, Sólido 65, En desarrollo 45.",
  },
  areas: {
    queEs:
      "Las áreas son los temas grandes que el cliente exige (Backend, Frontend, Cloud, Data, etc.). Cada área tiene un peso (% del total) y una nota mínima para considerar el curso aprobado.",
    siCambias:
      "Añadir un área obliga a que los módulos del curso cubran esa skill. Cambiar pesos redistribuye qué temas pesan más en la nota global. Los pesos de áreas deben sumar 100%.",
    ejemplo: "Contrato de backend cloud → Backend 60% (mínimo 70), Cloud 40% (mínimo 65).",
  },
  skills: {
    queEs:
      "Las skills son lo específico dentro de un área (python.fastapi, azure.databricks). Aquí marcas qué skills concretas el cliente exige y con qué nota mínima.",
    siCambias:
      "Exigir una skill específica obliga a que algún módulo activo la enseñe. Si exiges una skill y no hay módulo que la cubra, sale un aviso (no bloquea, pero alerta).",
    ejemplo: "Cliente que pide FastAPI específicamente → exiges python.fastapi con nota mínima 70.",
  },
  modulos: {
    queEs:
      "Selecciona qué módulos del catálogo global verán los colaboradores. Solo los habilitados aparecen en su plan personal.",
    siCambias:
      "Quitar un módulo lo retira del curso. Si ese módulo era el único que enseñaba una skill exigida, queda sin cobertura (sale aviso). Añadirlo amplía lo que pueden estudiar.",
    ejemplo:
      "Cliente no quiere Git avanzado → desactivas ese módulo. Necesitas reforzar testing → añades el módulo de pytest.",
  },
  transversal: {
    queEs:
      "El proyecto transversal es un proyecto real que se evalúa en tres capas: tests automáticos, análisis cualitativo con IA, y comprensión (entrevista breve sobre qué hizo).",
    siCambias:
      "Si lo desactivas, su peso (20% por defecto) se redistribuye entre las otras fuentes. Las capas internas (tests/cualitativa/comprensión) también pueden activarse o desactivarse de forma independiente.",
    ejemplo:
      "Proyecto integrador estándar → ON con 40/30/30. Curso solo teórico → OFF, el peso se redistribuye automáticamente.",
  },
  entrevista: {
    queEs:
      "La entrevista IA es una conversación final donde la IA evalúa al colaborador sobre lo que estudió. Sirve de filtro extra antes de presentar al cliente.",
    siCambias:
      "Si la activas, el colaborador debe pasarla con el umbral indicado. Puedes definir la rúbrica (qué temas pesan más en la evaluación). Si la desactivas, su peso se redistribuye.",
    ejemplo:
      "Cliente muy exigente → entrevista ON, umbral 75, rúbrica con 60% backend y 40% cloud.",
  },
} as const satisfies Record<string, AyudaContenido>
