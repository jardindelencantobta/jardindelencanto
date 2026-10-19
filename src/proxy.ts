import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SESSION_TIMEOUT_MINUTES = 5;

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Cliente SSR con las cookies del usuario (refresca el JWT automáticamente)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresca la sesión — no remover esta llamada.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected =
    pathname.startsWith("/portal") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/editor");
  const isAuthPage = pathname === "/login" || pathname === "/registro";

  // Un redirect a /login sobre un POST de Server Action llega al cliente como HTML y
  // Next lo reporta como "An unexpected response was received from the server".
  // Por eso a las Server Actions NO se les redirige: se dejan pasar sin sesión y la
  // propia acción responde con su error de autenticación (todas verifican al usuario;
  // la protección por ruta nunca las cubrió, porque una acción se puede invocar
  // desde cualquier URL).
  const isServerAction = request.headers.has("next-action");

  if (isProtected && !user) {
    if (isServerAction) {
      console.warn("[proxy] Server Action sin sesión:", pathname);
      return supabaseResponse;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Política de inactividad: verifica y actualiza last_active_at en un solo RPC.
  // Retorna false si el usuario lleva más de SESSION_TIMEOUT_MINUTES sin actividad.
  if (isProtected && user) {
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const { data: sessionValid } = await supabaseAdmin.rpc(
      "check_and_update_last_active",
      { p_user_id: user.id, p_timeout_minutes: SESSION_TIMEOUT_MINUTES }
    );

    if (sessionValid === false) {
      // signOut() limpia las cookies también en `request`, así que la acción
      // que sigue ya corre sin sesión y devuelve su error de autenticación.
      await supabase.auth.signOut();
      if (isServerAction) {
        console.warn(`[proxy] Server Action con sesión inactiva >${SESSION_TIMEOUT_MINUTES} min:`, pathname);
        return supabaseResponse;
      }
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // Evita que usuarios autenticados vean las páginas de auth
  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
