/**
 * Token DI para `IEmailProvider` (D-S10-B2).
 *
 * Resuelto en `NotificacionesModule.providers` mediante `useClass` segun
 * `NODE_ENV`: `MockEmailProvider` en tests, `ResendEmailProvider` en cualquier
 * otro entorno. Patron heredado D-S8-B2 (`AI_PROVIDER_TOKEN`).
 *
 * Vive en archivo separado de la interface para evitar el ciclo
 * implementacion -> interface -> token cuando los providers concretos
 * importan tanto el contrato como el token para registrarse.
 */
export const EMAIL_PROVIDER = Symbol("EMAIL_PROVIDER")
