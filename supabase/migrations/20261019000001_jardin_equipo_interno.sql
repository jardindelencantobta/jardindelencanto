-- ============================================================================
-- Jardín El Encanto — Equipo interno editable desde /editor/staff ("Equipo")
--
-- Hasta ahora el equipo interno (planners, DJ, animador) era un respaldo fijo
-- en el código (StaffSection.tsx) y no aparecía en el editor. Se registra en la
-- tabla `staff` para poder cambiar fotos, reseñas y personas desde el panel.
--
-- Idempotente: no inserta a quien ya exista (mismo nombre).
-- ============================================================================

insert into public.staff (nombre, cargo, descripcion, foto_url, is_aliado_externo, sort_order, is_active)
select v.nombre, v.cargo, v.descripcion, null, false, v.sort_order, true
from (values
  ('Jonny Delgado',        'Wedding Planner',       'Más de 15 años haciendo realidad los eventos más soñados con dedicación y pasión.',                1),
  ('David Castillo',       'Wedding Planner',       'Coordinación impecable y atención al detalle para que cada celebración supere las expectativas.', 2),
  ('DJ Jeisson Evolution', 'DJ Profesional',        'La música perfecta para que cada instante quede grabado para siempre en la memoria.',            3),
  ('DJ Piper Pimienta',    'Maestro de Ceremonias', 'Energía, carisma y alegría para animar cada celebración al máximo nivel.',                       4)
) as v(nombre, cargo, descripcion, sort_order)
where not exists (
  select 1 from public.staff s where lower(s.nombre) = lower(v.nombre)
);
