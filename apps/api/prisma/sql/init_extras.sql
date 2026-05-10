-- =============================================================================
-- NexoTT Learn — Extras de la migracion inicial
-- -----------------------------------------------------------------------------
-- Fuente: docs/NexoTTLearn/04_datos/modelo_fisico.md
--
-- Contiene todo lo que el schema Prisma NO puede expresar y que el modelo
-- fisico exige a nivel BD: CHECK constraints, indices parciales, UNIQUE
-- parciales, UNIQUE deferrable, trigger generico set_updated_at,
-- prevencion append-only, singleton de configuracion y vistas.
--
-- USO
--   1) Ejecutar `prisma migrate dev --name init --create-only` para generar
--      `prisma/migrations/<timestamp>_init/migration.sql`.
--   2) Concatenar este archivo al final de ese migration.sql:
--        cat prisma/sql/init_extras.sql >> prisma/migrations/<timestamp>_init/migration.sql
--   3) Aplicar con `prisma migrate dev`.
--
-- Idempotencia: usa IF NOT EXISTS / OR REPLACE donde es seguro. Constraints
-- y triggers usan nombres explicitos para poder volver a ejecutarlos tras
-- DROPs explicitos.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Extensiones (Prisma ya las declara via postgresqlExtensions; aqui se
--    refuerzan por si la migracion se aplica sin --schema).
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- -----------------------------------------------------------------------------
-- 2. Trigger generico set_updated_at()
--    Se aplica a toda tabla de negocio con columna updated_at.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
  tablas text[] := ARRAY[
    'areas', 'skills', 'modulos', 'secciones', 'bloques',
    'clientes', 'cursos', 'colaboradores', 'usuarios',
    'configuracion_sistema', 'notas_skill', 'asignaciones_curso',
    'planes_estudio', 'proyectos_transversales', 'entrevistas_ia'
  ];
BEGIN
  FOREACH t IN ARRAY tablas LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_set_updated_at ON %I;', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_set_updated_at BEFORE UPDATE ON %I '
      'FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t, t);
  END LOOP;
END$$;

-- -----------------------------------------------------------------------------
-- 3. Append-only: bloquear UPDATE/DELETE en tablas historicas / log
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevenir_modificaciones_append_only()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'La tabla % es append-only: UPDATE/DELETE no permitido', TG_TABLE_NAME
    USING ERRCODE = 'check_violation';
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
  tablas text[] := ARRAY[
    'historico_renombrados_skill',
    'historico_cambios_area_skill',
    'historico_estados_modulo',
    'historico_estados_asignacion',
    'historico_notas_skill',
    'historico_passwords',
    'log_cambios_curso',
    'ajustes_plan',
    'aceptaciones_aviso_privacidad',
    'consultas_logs',
    'aperturas_seccion'
  ];
BEGIN
  FOREACH t IN ARRAY tablas LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_append_only ON %I;', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_append_only BEFORE UPDATE OR DELETE ON %I '
      'FOR EACH ROW EXECUTE FUNCTION prevenir_modificaciones_append_only();',
      t, t);
  END LOOP;
END$$;

-- -----------------------------------------------------------------------------
-- 4. UNIQUE deferrable: re-crear los UNIQUE de orden para permitir reordenar
--    drag & drop dentro de una transaccion (Prisma no soporta DEFERRABLE).
-- -----------------------------------------------------------------------------
ALTER TABLE secciones
  DROP CONSTRAINT IF EXISTS uq_secciones_modulo_orden;
ALTER TABLE secciones
  ADD CONSTRAINT uq_secciones_modulo_orden
  UNIQUE (modulo_id, orden) DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE bloques
  DROP CONSTRAINT IF EXISTS uq_bloques_seccion_orden;
ALTER TABLE bloques
  ADD CONSTRAINT uq_bloques_seccion_orden
  UNIQUE (seccion_id, orden) DEFERRABLE INITIALLY IMMEDIATE;

-- -----------------------------------------------------------------------------
-- 5. CHECK constraints (rangos, coherencias, sumas de pesos a nivel fila)
-- -----------------------------------------------------------------------------

-- areas
ALTER TABLE areas
  ADD CONSTRAINT chk_areas_nombre_no_vacio
  CHECK (length(trim(nombre)) > 0);

-- skills
ALTER TABLE skills
  ADD CONSTRAINT chk_skills_etiqueta_no_vacia
  CHECK (length(trim(etiqueta_visible)) > 0);

-- bloques
ALTER TABLE bloques
  ADD CONSTRAINT chk_bloques_evaluable_skill
  CHECK (
    (es_evaluable = true  AND skill_que_mide_id IS NOT NULL) OR
    (es_evaluable = false AND skill_que_mide_id IS NULL)
  );
ALTER TABLE bloques
  ADD CONSTRAINT chk_bloques_version_positiva
  CHECK (version >= 1);

-- cursos
ALTER TABLE cursos
  ADD CONSTRAINT chk_cursos_fechas
  CHECK (fecha_inicio < fecha_deadline);
ALTER TABLE cursos
  ADD CONSTRAINT chk_cursos_pesos_skill
  CHECK (peso_bloques + peso_transversal + peso_entrevista = 100);
ALTER TABLE cursos
  ADD CONSTRAINT chk_cursos_umbral
  CHECK (umbral_no_cumple >= 0 AND umbral_no_cumple <= 100);
ALTER TABLE cursos
  ADD CONSTRAINT chk_cursos_desbloqueo_fecha
  CHECK (
    (desbloqueo  = 'DESDE_FECHA' AND fecha_desbloqueo IS NOT NULL) OR
    (desbloqueo <> 'DESDE_FECHA' AND fecha_desbloqueo IS NULL)
  );

-- cursos_areas_exigidas
ALTER TABLE cursos_areas_exigidas
  ADD CONSTRAINT chk_cae_peso
  CHECK (peso > 0 AND peso <= 100);
ALTER TABLE cursos_areas_exigidas
  ADD CONSTRAINT chk_cae_objetivo
  CHECK (puntaje_objetivo >= 0 AND puntaje_objetivo <= 100);

-- cursos_skills_exigidas
ALTER TABLE cursos_skills_exigidas
  ADD CONSTRAINT chk_cse_nota_minima
  CHECK (nota_minima >= 0 AND nota_minima <= 100);

-- colaboradores
ALTER TABLE colaboradores
  ADD CONSTRAINT chk_colab_email
  CHECK (length(email) <= 254 AND position('@' in email) > 1);
ALTER TABLE colaboradores
  ADD CONSTRAINT chk_colab_off_boarding
  CHECK (
    (estado_empleado = 'EX_EMPLEADO' AND fecha_off_boarding IS NOT NULL) OR
    (estado_empleado = 'ACTIVO'      AND fecha_off_boarding IS NULL)
  );

-- usuarios
ALTER TABLE usuarios
  ADD CONSTRAINT chk_usuarios_intentos_no_negativos
  CHECK (intentos_fallidos >= 0);
ALTER TABLE usuarios
  ADD CONSTRAINT chk_usuarios_mfa_secret
  CHECK (
    (mfa_habilitado = true  AND mfa_secret IS NOT NULL) OR
    (mfa_habilitado = false)
  );

-- configuracion_sistema (singleton)
ALTER TABLE configuracion_sistema
  ADD CONSTRAINT chk_config_singleton
  CHECK (id = 1);

-- notas_skill (null permitido = sin evidencia, pero rango si hay valor)
ALTER TABLE notas_skill
  ADD CONSTRAINT chk_notas_skill_rango
  CHECK (nota_actual IS NULL OR (nota_actual >= 0 AND nota_actual <= 100));

-- historico_notas_skill
ALTER TABLE historico_notas_skill
  ADD CONSTRAINT chk_hns_rango
  CHECK (valor IS NULL OR (valor >= 0 AND valor <= 100));

-- asignaciones_curso (coherencia rol ↔ estado)
ALTER TABLE asignaciones_curso
  ADD CONSTRAINT chk_asig_rol_estado
  CHECK (
    (rol = 'ASIGNADO'   AND estado_asignado   IS NOT NULL AND estado_voluntario IS NULL     AND origen_voluntario IS NULL) OR
    (rol = 'VOLUNTARIO' AND estado_voluntario IS NOT NULL AND estado_asignado   IS NULL     AND origen_voluntario IS NOT NULL)
  );
ALTER TABLE asignaciones_curso
  ADD CONSTRAINT chk_asig_resultado_solo_asignado
  CHECK (rol = 'ASIGNADO' OR resultado_entrevista_cliente IS NULL);

-- intentos_bloque
ALTER TABLE intentos_bloque
  ADD CONSTRAINT chk_intentos_bloque_nota
  CHECK (nota >= 0 AND nota <= 100);
ALTER TABLE intentos_bloque
  ADD CONSTRAINT chk_intentos_bloque_version
  CHECK (version_bloque >= 1);

-- proyectos_transversales
ALTER TABLE proyectos_transversales
  ADD CONSTRAINT chk_pt_pesos
  CHECK (peso_capa_tests + peso_capa_cualitativa + peso_capa_comprension = 100);
ALTER TABLE proyectos_transversales
  ADD CONSTRAINT chk_pt_umbral
  CHECK (umbral_aprobacion >= 0 AND umbral_aprobacion <= 100);

-- intentos_transversal
ALTER TABLE intentos_transversal
  ADD CONSTRAINT chk_it_nota
  CHECK (nota >= 0 AND nota <= 100);

-- entrevistas_ia
ALTER TABLE entrevistas_ia
  ADD CONSTRAINT chk_eia_umbral
  CHECK (umbral_aprobacion >= 0 AND umbral_aprobacion <= 100);
ALTER TABLE entrevistas_ia
  ADD CONSTRAINT chk_eia_duracion
  CHECK (duracion_minutos IN (15, 30, 45));

-- rubrica_entrevista_ia
ALTER TABLE rubrica_entrevista_ia
  ADD CONSTRAINT chk_rub_peso
  CHECK (peso > 0 AND peso <= 100);

-- intentos_entrevista_ia
ALTER TABLE intentos_entrevista_ia
  ADD CONSTRAINT chk_ieia_nota
  CHECK (nota_global >= 0 AND nota_global <= 100);
ALTER TABLE intentos_entrevista_ia
  ADD CONSTRAINT chk_ieia_ajustada
  CHECK (nota_ajustada_admin IS NULL OR (nota_ajustada_admin >= 0 AND nota_ajustada_admin <= 100));
ALTER TABLE intentos_entrevista_ia
  ADD CONSTRAINT chk_ieia_motivo
  CHECK (
    (nota_ajustada_admin IS NULL AND anulado = false) OR
    motivo_ajuste_o_anulacion IS NOT NULL
  );

-- intentos_entrevista_ia_notas_area
ALTER TABLE intentos_entrevista_ia_notas_area
  ADD CONSTRAINT chk_ieina_rango
  CHECK (nota >= 0 AND nota <= 100);

-- -----------------------------------------------------------------------------
-- 6. UNIQUE parcial estructural: un unico mejor intento vigente por
--    (colaborador, bloque). Sustituye al trigger D13.
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_intentos_bloque_mejor
  ON intentos_bloque (colaborador_id, bloque_id)
  WHERE es_mejor_intento = true AND esta_invalidado = false;

-- -----------------------------------------------------------------------------
-- 7. Indices parciales (Prisma no soporta WHERE en @@index)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_skills_estado
  ON skills (estado)
  WHERE estado = 'ACTIVA';

CREATE INDEX IF NOT EXISTS idx_modulos_estado
  ON modulos (estado)
  WHERE estado = 'ACTIVO';

CREATE INDEX IF NOT EXISTS idx_bloques_skill_evaluable
  ON bloques (skill_que_mide_id)
  WHERE es_evaluable = true AND estado = 'ACTIVO';

CREATE INDEX IF NOT EXISTS idx_asignaciones_estado_asignado
  ON asignaciones_curso (curso_id, estado_asignado)
  WHERE rol = 'ASIGNADO';

CREATE INDEX IF NOT EXISTS idx_intentos_bloque_skill_vigente
  ON intentos_bloque (skill_id)
  WHERE es_mejor_intento = true AND esta_invalidado = false;

CREATE INDEX IF NOT EXISTS idx_notif_usuario_no_leidas
  ON notificaciones (usuario_id)
  WHERE leida = false AND archivada = false;

CREATE INDEX IF NOT EXISTS idx_notif_archivar
  ON notificaciones (fecha_creacion)
  WHERE archivada = false;

-- -----------------------------------------------------------------------------
-- 8. Vistas (no materializadas) — lectura derivada documentada en §5
-- -----------------------------------------------------------------------------

-- 8.1 v_avance_plan: una seccion del plan se considera completada si
--   (a) tiene bloques evaluables ACTIVOS y todos tienen mejor intento
--       vigente con nota >= 70 (umbral por defecto; el real vive en
--       cursos_skills_exigidas / umbrales_logro y se calcula en app),
--   o (b) no tiene bloques evaluables y existe apertura registrada.
-- Las secciones OPCIONAL no entran al denominador.
-- Nota: el umbral por bloque es decision de aplicacion; aqui exponemos la
-- estructura cruda y el calculo final lo hace el servicio.
CREATE OR REPLACE VIEW v_avance_plan AS
WITH bloques_evaluables_seccion AS (
  SELECT
    b.seccion_id,
    count(*) FILTER (WHERE b.es_evaluable = true AND b.estado = 'ACTIVO') AS total_evaluables
  FROM bloques b
  GROUP BY b.seccion_id
),
mejores_por_asignacion AS (
  SELECT
    a.id           AS asignacion_id,
    ib.bloque_id,
    ib.nota
  FROM asignaciones_curso a
  JOIN intentos_bloque ib
    ON ib.colaborador_id = a.colaborador_id
   AND ib.curso_id       = a.curso_id
  WHERE ib.es_mejor_intento = true
    AND ib.esta_invalidado  = false
)
SELECT
  ip.plan_id,
  ip.seccion_id,
  ip.caracter,
  COALESCE(bes.total_evaluables, 0) AS total_evaluables,
  CASE
    WHEN COALESCE(bes.total_evaluables, 0) = 0 THEN
      (SELECT COUNT(*) FROM aperturas_seccion ap
        JOIN planes_estudio pe ON pe.id = ip.plan_id
       WHERE ap.asignacion_id = pe.asignacion_id
         AND ap.seccion_id    = ip.seccion_id) > 0
    ELSE
      NOT EXISTS (
        SELECT 1
        FROM bloques b
        WHERE b.seccion_id    = ip.seccion_id
          AND b.estado        = 'ACTIVO'
          AND b.es_evaluable  = true
          AND NOT EXISTS (
            SELECT 1 FROM mejores_por_asignacion m
            JOIN planes_estudio pe ON pe.id = ip.plan_id
            WHERE m.asignacion_id = pe.asignacion_id
              AND m.bloque_id     = b.id
          )
      )
  END AS completada
FROM items_plan ip
LEFT JOIN bloques_evaluables_seccion bes ON bes.seccion_id = ip.seccion_id;

-- 8.2 v_cobertura_skills_curso: alerta D82 — skills exigidas no cubiertas
-- por ningun modulo habilitado.
CREATE OR REPLACE VIEW v_cobertura_skills_curso AS
SELECT
  cse.curso_id,
  cse.skill_id,
  EXISTS (
    SELECT 1
    FROM cursos_modulos_habilitados cmh
    JOIN secciones s        ON s.modulo_id  = cmh.modulo_id
    JOIN secciones_skills ss ON ss.seccion_id = s.id
    WHERE cmh.curso_id = cse.curso_id
      AND ss.skill_id  = cse.skill_id
  ) AS cubierta
FROM cursos_skills_exigidas cse;

-- 8.3 mv_nota_skill_bloques: promedio simple del mejor intento vigente
-- por (colaborador, skill, curso) sobre bloques ACTIVOS evaluables.
-- Refresco bajo demanda (CONCURRENTLY si crece).
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_nota_skill_bloques AS
SELECT
  ib.colaborador_id,
  ib.skill_id,
  ib.curso_id,
  avg(ib.nota)::numeric(5,2) AS nota_promedio,
  count(*)                   AS bloques_considerados,
  max(ib.fecha)              AS ultima_actualizacion
FROM intentos_bloque ib
JOIN bloques b ON b.id = ib.bloque_id
WHERE ib.es_mejor_intento = true
  AND ib.esta_invalidado  = false
  AND b.estado            = 'ACTIVO'
  AND b.es_evaluable      = true
GROUP BY ib.colaborador_id, ib.skill_id, ib.curso_id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mv_nota_skill_bloques
  ON mv_nota_skill_bloques (colaborador_id, skill_id, curso_id);

-- -----------------------------------------------------------------------------
-- 9. Comentarios documentales en tablas sensibles
-- -----------------------------------------------------------------------------
COMMENT ON COLUMN usuarios.mfa_secret IS
  'Ciphertext AES-256-GCM (iv || ciphertext || tag). Cifrado en app con SECRETS_ENCRYPTION_KEY.';
COMMENT ON COLUMN configuracion_sistema.resend_api_key_cifrada IS
  'Ciphertext AES-256-GCM. Cifrado en app con SECRETS_ENCRYPTION_KEY.';
COMMENT ON COLUMN notas_skill.nota_actual IS
  'null = sin evidencia. Regla transversal D40: null != 0. SIN default.';
COMMENT ON TABLE aperturas_seccion IS
  'Append-only. Registra solo la primera apertura por (asignacion, seccion). D94.';
