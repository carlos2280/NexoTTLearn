-- D-PERSONAS: indice en `usuarios.rol`. El check del "ultimo admin" y los
-- filtros del listado de personas cuentan/filtran por rol; sin indice la tabla
-- `usuarios` hace scan secuencial. Operacion aditiva (CREATE INDEX), sin
-- bloqueo de datos relevante en el tamano actual de la tabla.
CREATE INDEX "usuarios_rol_idx" ON "usuarios"("rol");
