"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { updatePassword } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { SubmitButton } from "@/components/ui/SubmitButton";

const inputClass =
  "w-full border border-crema-medio bg-blanco px-4 py-3 text-negro text-sm placeholder:text-gris-claro focus:outline-none focus:border-dorado rounded-lg transition-colors duration-150 pr-10";

function BrandedShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-crema flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px] animate-[page-fade-in_0.45s_ease_both]">
        <div className="mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-principal-fondo-claro.svg"
            alt="Jardín El Encanto"
            style={{ width: "100%", height: "auto" }}
          />
          <div className="mt-6 h-px bg-dorado/60" />
        </div>
        {children}
      </div>
    </main>
  );
}

type PageState = "loading" | "ready" | "expired";

export default function UpdatePasswordPage() {
  const [state, formAction] = useActionState(updatePassword, null);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pageState, setPageState] = useState<PageState>("loading");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token_hash = params.get("token_hash");
    const type = params.get("type");

    if (!token_hash || type !== "recovery") {
      // Sin token — acceso directo o sesión ya establecida.
      setPageState("ready");
      return;
    }

    const supabase = createClient();
    supabase.auth.verifyOtp({ token_hash, type: "recovery" }).then(({ error }) => {
      if (error) {
        setPageState("expired");
      } else {
        window.history.replaceState({}, "", "/update-password");
        setPageState("ready");
      }
    });
  }, []);

  if (pageState === "loading") {
    return (
      <BrandedShell>
        <div className="bg-blanco border border-crema-medio shadow-sm rounded-2xl px-8 py-10 text-center">
          <p className="text-sm text-gris">Verificando enlace…</p>
        </div>
      </BrandedShell>
    );
  }

  if (pageState === "expired") {
    return (
      <BrandedShell>
        <div className="bg-blanco border border-crema-medio shadow-sm rounded-2xl px-8 py-10 text-center space-y-5">
          <div className="w-12 h-12 rounded-full bg-rojo/8 flex items-center justify-center mx-auto">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rojo">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h2 className="font-serif text-xl text-negro tracking-[-0.02em] mb-2">
              Enlace expirado
            </h2>
            <p className="text-sm text-gris leading-relaxed">
              El enlace expiró o ya fue utilizado. Los enlaces de recuperación son válidos por 1 hora.
            </p>
          </div>
          <Link
            href="/reset-password"
            className="inline-block w-full bg-rojo text-blanco py-3 font-serif tracking-wider text-sm rounded-lg hover:bg-rojo/90 transition-colors text-center"
          >
            Solicitar nuevo enlace
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-dorado hover:text-dorado/70 transition-colors"
          >
            <span aria-hidden>←</span> Regresar al inicio de sesión
          </Link>
        </div>
      </BrandedShell>
    );
  }

  return (
    <BrandedShell>
      <div className="bg-blanco border border-crema-medio shadow-sm rounded-2xl px-8 py-10">
        <h2 className="font-serif text-2xl text-negro tracking-[-0.02em] mb-1">
          Nueva contraseña
        </h2>
        <p className="text-sm text-gris mb-8">
          Elige una contraseña segura para proteger tu cuenta.
        </p>

        <form action={formAction} className="space-y-5">
          <div>
            <label
              htmlFor="password"
              className="block text-xs text-gris uppercase tracking-wider mb-2"
            >
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPwd ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPwd((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gris/50 hover:text-gris transition-colors"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs text-gris uppercase tracking-wider mb-2"
            >
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                required
                placeholder="Repite la contraseña"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gris/50 hover:text-gris transition-colors"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {state?.error && (
            <p className="text-rojo text-sm" role="alert">
              {state.error}
            </p>
          )}

          <SubmitButton
            label="Actualizar contraseña"
            pendingLabel="Actualizando…"
            className="w-full bg-rojo text-blanco py-3 font-serif tracking-wider text-sm hover:bg-rojo-pro mt-2"
          />
        </form>

        <div className="text-center mt-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-dorado hover:text-dorado/70 transition-colors"
          >
            <span aria-hidden>←</span> Regresar al inicio de sesión
          </Link>
        </div>
      </div>
    </BrandedShell>
  );
}
