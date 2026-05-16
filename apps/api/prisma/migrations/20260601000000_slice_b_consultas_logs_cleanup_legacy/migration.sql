-- Slice futuro B P-B-b — Cleanup destructivo §5.129
--
-- Retira las columnas legacy `tipo_log` y `filtros` de `consultas_logs`.
-- Desde la migracion P11c (`20260521000000_slice_11_p11c_consultas_logs_extension_y_reporte_cache`)
-- el INSERT ya escribe las 5 columnas de negocio (`autor_usuario_id`,
-- `endpoint`, `query_params`, `latencia_ms`, `fecha`) y duplicaba el endpoint
-- en `tipo_log` y `query_params` en `filtros` solo para no violar el NOT NULL
-- pre-existente. P-B-b retira esa deuda en un solo paso atomico: la
-- migracion se aplica junto al cambio en `ConsultasLogService.registrar()`
-- que deja de poblar las columnas legacy.

ALTER TABLE "consultas_logs"
  DROP COLUMN "tipo_log",
  DROP COLUMN "filtros";
