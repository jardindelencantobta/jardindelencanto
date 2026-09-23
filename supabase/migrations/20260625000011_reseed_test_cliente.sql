-- ============================================================================
-- OMITIDA en Jardín El Encanto (heredada de Hacienda El Encanto).
--
-- La versión original sembraba usuarios de prueba con contraseñas conocidas
-- (y datos de prueba asociados). No debe ejecutarse en esta base de datos.
-- El archivo se conserva para mantener el historial de migraciones.
--
-- Los usuarios de Jardín se crean desde el panel de Supabase (primer admin)
-- y luego desde /admin/usuarios.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;
