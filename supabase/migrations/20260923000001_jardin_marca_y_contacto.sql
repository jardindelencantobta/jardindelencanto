-- ============================================================================
-- Jardín El Encanto — Datos de marca y contacto en la base de datos
--
-- Las migraciones heredadas de Hacienda El Encanto siembran su WhatsApp, su
-- correo y su nombre comercial en site_content, blog_posts y testimonials.
-- Esta migración (la última) los corrige para Jardín.
--
-- Se MANTIENEN intencionalmente (mismo dueño):
--   · La razón social "Hacienda El Encanto Bogotá S.A.S" y los datos legales
--     del contratista (claves hacienda_nombre, _representante, _nit, etc.).
--   · El texto de las cláusulas del contrato (contrato_%), salvo teléfono y
--     correo. Revisar su redacción desde /admin/contrato.
-- ============================================================================

-- 1. Teléfono y correo — en TODO site_content (incluye cláusula 20 y datos
--    del contratista hacienda_whatsapp / hacienda_email).
update public.site_content
set content = replace(replace(replace(content,
      '3150061597',                    '3128661699'),
      '315 006 1597',                  '312 866 1699'),
      'contacto@hacienda-encanto.com', 'contacto@jardindelencanto.com'),
    updated_at = now()
where content ~ '3150061597|315 006 1597|contacto@hacienda-encanto\.com';

insert into public.site_content (key, content) values
  ('hacienda_whatsapp', '3128661699'),
  ('hacienda_email',    'contacto@jardindelencanto.com')
on conflict (key) do update set content = excluded.content, updated_at = now();

-- 2. Nombre comercial en textos del sitio (no en contrato ni datos legales).
update public.site_content
set title   = regexp_replace(title,   'Hacienda [Ee]l Encanto(?! Bogotá)', 'Jardín El Encanto', 'g'),
    content = regexp_replace(content, 'Hacienda [Ee]l Encanto(?! Bogotá)', 'Jardín El Encanto', 'g'),
    updated_at = now()
where key not like 'contrato\_%'
  and key not like 'hacienda\_%'
  and (title ~ 'Hacienda [Ee]l Encanto' or content ~ 'Hacienda [Ee]l Encanto');

-- 3. Blog sembrado.
update public.blog_posts
set titulo    = regexp_replace(titulo,    'Hacienda [Ee]l Encanto', 'Jardín El Encanto', 'g'),
    resumen   = regexp_replace(resumen,   'Hacienda [Ee]l Encanto', 'Jardín El Encanto', 'g'),
    contenido = regexp_replace(contenido, 'Hacienda [Ee]l Encanto', 'Jardín El Encanto', 'g'),
    autor     = regexp_replace(autor,     'Hacienda [Ee]l Encanto', 'Jardín El Encanto', 'g'),
    updated_at = now();

-- 4. Testimonios sembrados: son de clientes de Hacienda, no de Jardín.
--    Se despublican (no se borran); publicar testimonios reales desde
--    /editor/testimonios.
update public.testimonials
set is_published = false, updated_at = now();
