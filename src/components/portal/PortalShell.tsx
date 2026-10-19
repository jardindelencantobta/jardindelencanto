"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PortalSidebar } from "./PortalSidebar";
import { PortalHeader } from "./PortalHeader";
import { TransitionOverlay } from "@/components/ui/TransitionOverlay";
import { InactivityWarning } from "./InactivityWarning";
import { useInactivityTimer } from "@/hooks/useInactivityTimer";
import { logout } from "@/app/actions/auth";
import { keepAlive } from "@/app/actions/session";
import type { PortalProfile } from "@/app/portal/layout";

// 4 minutos de inactividad → mostrar advertencia
// 60 segundos de countdown → logout automático
const INACTIVITY_MS = 4 * 60 * 1000;
const WARNING_MS = 60 * 1000;
// El servidor (proxy.ts) cierra la sesión tras 5 min SIN PETICIONES, aunque el
// usuario mueva el mouse o esté eligiendo archivos. Mientras haya actividad en
// el navegador, se le avisa al servidor como máximo una vez por minuto.
const KEEPALIVE_THROTTLE_MS = 60 * 1000;

export function PortalShell({
  profile,
  children,
  unreadCount = 0,
}: {
  profile: PortalProfile;
  children: React.ReactNode;
  unreadCount?: number;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const triggerLogout = useCallback(async () => {
    setShowWarning(false);
    setLoggingOut(true);
    await new Promise<void>((r) => setTimeout(r, 1000));
    try {
      await logout();
    } finally {
      // Este overlay de logout ya cubrió la transición — evita que el Home
      // vuelva a mostrar su propio loader inicial al llegar.
      sessionStorage.setItem("fromLogout", "true");
      // Fallback: garantiza la redirección aunque el redirect() de la
      // Server Action no se procese (llamada fuera de un form action).
      window.location.href = "/";
    }
  }, []);

  const lastPingRef = useRef(0);
  // La carga de la página ya pasó por el servidor: cuenta como el primer aviso.
  useEffect(() => {
    lastPingRef.current = Date.now();
  }, []);

  const pingServer = useCallback((force = false) => {
    const now = Date.now();
    if (!force && now - lastPingRef.current < KEEPALIVE_THROTTLE_MS) return;
    lastPingRef.current = now;
    keepAlive()
      .then((r) => {
        if (!r.ok) window.location.href = "/login";
      })
      .catch(() => {
        // Sin conexión o despliegue nuevo: se reintenta con la próxima actividad.
        lastPingRef.current = 0;
      });
  }, []);

  useInactivityTimer({
    inactivityMs: INACTIVITY_MS,
    warningMs: WARNING_MS,
    isPaused: showWarning,
    onWarn: () => setShowWarning(true),
    onTimeout: triggerLogout,
    onActivity: pingServer,
  });

  return (
    <div className="min-h-screen flex bg-crema">
      {/* Overlay móvil del sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-negro/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <PortalSidebar
        profile={profile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 md:ml-[248px]">
        <PortalHeader
          profile={profile}
          onMenuClick={() => setSidebarOpen(true)}
          unreadCount={unreadCount}
        />
        <main className="flex-1 p-6 md:p-8 max-w-[1200px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Modal de inactividad */}
      {showWarning && (
        <InactivityWarning
          warningSeconds={WARNING_MS / 1000}
          onContinue={() => {
            setShowWarning(false);
            pingServer(true);
          }}
          onLogout={triggerLogout}
        />
      )}

      {/* Overlay de transición al cerrar sesión por inactividad */}
      <TransitionOverlay visible={loggingOut} />
    </div>
  );
}
