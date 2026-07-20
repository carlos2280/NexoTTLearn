-- Ajuste manual de la nota del intento transversal por el admin al publicar
-- ("Publicar y cerrar"). Humano en el loop sobre el NUMERO, no solo el texto del
-- informe. Calca el patron ya existente de la entrevista IA (`nota_ajustada_admin`).
--
-- ADITIVO Y NO DESTRUCTIVO: solo AGREGA dos columnas nuevas, ambas NULLABLE y sin
-- default. Las filas existentes quedan con NULL (comportamiento identico al de hoy:
-- si no hay ajuste, se publica la nota calculada). No borra, renombra ni reescribe
-- nada. Operacion de metadata (instantanea, sin lock de reescritura). Seguro para
-- correr en produccion con cursos/usuarios en proceso.
ALTER TABLE "intentos_transversal" ADD COLUMN "nota_ajustada_admin" DECIMAL(5,2);
ALTER TABLE "intentos_transversal" ADD COLUMN "motivo_ajuste_nota" TEXT;
