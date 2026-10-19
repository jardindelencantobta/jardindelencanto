"use client";

import { useEffect, useRef } from "react";

interface Options {
  inactivityMs: number;  // Tiempo sin actividad para mostrar warning
  warningMs: number;     // Duración del countdown antes de logout
  isPaused: boolean;     // true cuando el modal está visible
  onWarn: () => void;    // Mostrar modal de advertencia
  onTimeout: () => void; // Ejecutar logout
  onActivity?: () => void; // Cada evento de actividad (el llamador decide cuándo avisar al servidor)
}

export function useInactivityTimer({
  inactivityMs,
  warningMs,
  isPaused,
  onWarn,
  onTimeout,
  onActivity,
}: Options) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs para evitar stale closures en event handlers
  const isPausedRef = useRef(isPaused);
  const onWarnRef = useRef(onWarn);
  const onTimeoutRef = useRef(onTimeout);
  const inactivityMsRef = useRef(inactivityMs);
  const onActivityRef = useRef(onActivity);

  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { onWarnRef.current = onWarn; }, [onWarn]);
  useEffect(() => { onTimeoutRef.current = onTimeout; }, [onTimeout]);
  useEffect(() => { inactivityMsRef.current = inactivityMs; }, [inactivityMs]);
  useEffect(() => { onActivityRef.current = onActivity; }, [onActivity]);

  // Reacciona a cambios en isPaused:
  //   isPaused=false → timer de inactividad (inactivityMs)
  //   isPaused=true  → timer de logout (warningMs, countdown del modal)
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (isPaused) {
      timerRef.current = setTimeout(() => onTimeoutRef.current(), warningMs);
    } else {
      timerRef.current = setTimeout(() => onWarnRef.current(), inactivityMs);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPaused, inactivityMs, warningMs]);

  // Escucha actividad del usuario — resetea el timer de inactividad
  useEffect(() => {
    function handleActivity() {
      if (isPausedRef.current) return; // Modal visible: ignorar actividad
      onActivityRef.current?.();
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(
        () => onWarnRef.current(),
        inactivityMsRef.current
      );
    }

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ] as const;

    events.forEach((ev) =>
      window.addEventListener(ev, handleActivity, { passive: true })
    );

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
    };
  }, []); // Solo al montar — los valores actuales se leen vía refs
}
