export {
  contenidoQuizSchema,
  preguntaQuizSchema,
  tipoPreguntaQuizSchema,
} from "./contenido-quiz.schema"
export type {
  ContenidoQuiz,
  PreguntaQuiz,
  PreguntaOpcionUnica,
  PreguntaOpcionMultiple,
  PreguntaVerdaderoFalso,
  PreguntaRespuestaCorta,
  OpcionQuiz,
  TipoPreguntaQuiz,
  SolucionVisible,
  NormalizacionRespuestaCorta,
} from "./contenido-quiz.schema"
export {
  contenidoCodigoPreguntasSchema,
  contenidoCodigoTestsSchema,
  testStdinStdoutSchema,
  lenguajeEjecutableSchema,
} from "./contenido-codigo.schema"
export type {
  ContenidoCodigoPreguntas,
  ContenidoCodigoTests,
  TestStdinStdout,
  LenguajeEjecutable,
} from "./contenido-codigo.schema"
export {
  crearIntentoBloqueSchema,
  respuestaPreguntaSchema,
  respuestasIntentoSchema,
  resultadoTestReportadoSchema,
} from "./crear-intento.schema"
export type {
  CrearIntentoBloqueInput,
  RespuestaPregunta,
  RespuestasIntento,
  ResultadoTestReportado,
} from "./crear-intento.schema"
export {
  intentoBloqueResponseSchema,
  listarIntentosBloqueQuerySchema,
  listarIntentosCursoBloqueQuerySchema,
} from "./intento-response.types"
export type {
  IntentoBloqueResponse,
  ListarIntentosBloqueQuery,
  ListarIntentosCursoBloqueQuery,
} from "./intento-response.types"
