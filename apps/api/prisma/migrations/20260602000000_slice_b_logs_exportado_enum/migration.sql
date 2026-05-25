-- Slice futuro B P-B-c — Audit value para exportaciones de visores especificos.
-- Patron heredado S12 (FICHA_EXPORTADA + PLAN_RECALCULADO_MASIVO + AUDITORIA_EXPORTADA
-- migrados con ALTER TYPE ADD VALUE aditivo). `LOGS_EXPORTADO` es polimorfico
-- con metadata `{dominio, formato, totalFilas, filtrosAplicados}` para los 6
-- nuevos endpoints `GET /admin/logs/<dominio>/exportar`.
ALTER TYPE "accion_auditoria_enum" ADD VALUE IF NOT EXISTS 'LOGS_EXPORTADO';
