-- ============================================================
-- Migraciones de esquema (v1 → v2)
-- ============================================================
-- Este fichero se ejecuta cuando user_version = 1.
-- Debe llevar el esquema a la versión 2 sin pérdida de datos.
-- ============================================================

-- Fase 1: No hay migraciones pendientes desde v1.
-- Si en el futuro se añade una v1 intermedia, las migraciones irían aquí.

-- Actualizar versión a 2
PRAGMA user_version = 2;
