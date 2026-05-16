/**
 * Factor de coste de bcrypt para hashing de passwords (single source of truth).
 *
 * 12 = ~300 ms en hardware moderno: caro para diccionario, asumible para login.
 * Cambiar este valor implica que los hashes nuevos usaran el factor nuevo;
 * los hashes existentes siguen siendo validos (bcrypt embebe el coste en el
 * propio hash) y se re-hashearan en el siguiente cambio de password.
 *
 * Reglas:
 *  - No bajar nunca de 12 (OWASP A02 — proyecto sigue convenciones internas).
 *  - Subirlo a 13/14 cuando el hardware del runtime lo permita sin degradar
 *    p95 de login.
 */
export const FACTOR_BCRYPT = 12
