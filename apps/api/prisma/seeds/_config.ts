// Configuracion comun para el seed-frontend.
// Constantes de prefijos de id + passwords + parametros temporales.

// ============================================================================
// Constantes
// ============================================================================

export const MS_POR_DIA = 24 * 60 * 60 * 1000
export const FACTOR_BCRYPT = 12
export const DIAS_CADUCIDAD = 7

export const ADMIN_PASSWORD = process.env.QA_ADMIN_PASSWORD ?? "Cambiar2026!"
export const USER_PASSWORD = process.env.QA_USER_PASSWORD ?? "Qa1234!"

// Prefijos UUID propios (prefijo 7f) — no chocan con seed-qa (7e) ni amsa.
export const P_ADMIN = "7f000000-0000-0000-0000-0000000000"
export const P_PART = "7f100000-0000-0000-0000-0000000000"
export const P_CLIENTE = "7f200000-0000-0000-0000-0000000000"
export const P_CURSO = "7f300000-0000-0000-0000-0000000000"
export const P_MODULO = "7f400000-0000-0000-0000-0000000000"
export const P_SECCION = "7f500000-0000-0000-0000-000000000"
export const P_BLOQUE = "7f600000-0000-0000-0000-00000000"
export const P_ASIG = "7f700000-0000-0000-0000-0000000000"
export const P_PLAN = "7f800000-0000-0000-0000-0000000000"
export const P_SKILL = "7f900000-0000-0000-0000-000000000"
export const ID_TRANSVERSAL = "7fb00000-0000-0000-0000-000000000001"
export const ID_ENTREVISTA_IA = "7fc00000-0000-0000-0000-000000000001"
