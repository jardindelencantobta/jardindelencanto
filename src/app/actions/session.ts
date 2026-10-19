"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Latido de sesión. No hace nada por sí misma: al ser una Server Action, la
 * petición pasa por proxy.ts con la ruta de la página actual (/portal, /admin,
 * /editor), que actualiza profiles.last_active_at. PortalShell la llama mientras
 * el usuario está activo en el navegador para que el servidor no cierre la
 * sesión por "inactividad" cuando en realidad la persona está trabajando
 * (eligiendo fotos, llenando un formulario largo, etc.).
 *
 * Devuelve ok=false si la sesión ya no es válida.
 */
export async function keepAlive(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { ok: !!user };
}
