"use client";

import { useActionState, startTransition, useEffect, useRef, useState } from "react";
import { submitContactForm } from "@/app/actions/contact";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { PrivacyCheckbox } from "@/components/contact/PrivacyCheckbox";
import { WhatsAppSuccessButton } from "@/components/contact/WhatsAppSuccessButton";
import { useContactRateLimit } from "@/lib/contact-rate-limit";
import { hoyBogota } from "@/lib/fecha-hoy";
import {
  MAX_EMAIL, MAX_INVITADOS, MAX_MENSAJE, MAX_NOMBRE,
  NOMBRE_PATTERN, WHATSAPP_PATTERN, filtrarWhatsapp,
} from "@/lib/contacto-validacion";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

const inputClass =
  "w-full border border-crema-medio bg-blanco px-4 py-3 text-negro text-sm placeholder:text-gris-claro focus:outline-none focus:border-dorado transition-colors duration-150";

const labelClass = "block text-xs text-gris uppercase tracking-wider mb-2";

export function ContactForm() {
  const [state, formAction] = useActionState(submitContactForm, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [aceptaPolitica, setAceptaPolitica] = useState(false);
  const { blockMessage, isBlocked, checkBeforeSend, recordSend } = useContactRateLimit();

  useEffect(() => {
    if (!SITE_KEY) return;
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (state?.success) recordSend();
  }, [state?.success]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!checkBeforeSend()) return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    if (SITE_KEY && window.grecaptcha) {
      const token = await new Promise<string>((resolve) => {
        window.grecaptcha.ready(async () => {
          const t = await window.grecaptcha.execute(SITE_KEY, { action: "contact" });
          resolve(t);
        });
      });
      formData.set("recaptchaToken", token);
    }

    startTransition(() => formAction(formData));
  }

  if (state?.success) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-verde/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-verde" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-serif text-xl text-negro mb-2">¡Mensaje recibido!</p>
        <p className="text-sm text-gris">
          Nos pondremos en contacto contigo muy pronto.
        </p>
        <WhatsAppSuccessButton />
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {/* recaptchaToken se inyecta en handleSubmit */}
      <input type="hidden" name="recaptchaToken" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            Nombre completo *
          </label>
          <input
            id="contact-name"
            name="name" pattern={NOMBRE_PATTERN} maxLength={MAX_NOMBRE} autoComplete="name" title="Solo letras y espacios"
            type="text"
            required
            placeholder="Tu nombre"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="contact-whatsapp" className={labelClass}>
            WhatsApp *
          </label>
          <input
            id="contact-whatsapp"
            name="whatsapp" inputMode="tel" pattern={WHATSAPP_PATTERN} maxLength={16} autoComplete="tel" title="Solo números. Ejemplo: 312 866 1699" onInput={(e) => { e.currentTarget.value = filtrarWhatsapp(e.currentTarget.value); }}
            type="tel"
            required
            placeholder="+57 3XX XXX XXXX"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-email" className={labelClass}>
          Correo electrónico{" "}
          <span className="normal-case text-gris-claro font-normal">(opcional)</span>
        </label>
        <input
          id="contact-email"
          name="email" maxLength={MAX_EMAIL} autoComplete="email"
          type="email"
          placeholder="tu@correo.com"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="contact-subject" className={labelClass}>
            Tipo de evento *
          </label>
          <select
            id="contact-subject"
            name="subject"
            required
            className={inputClass}
          >
            <option value="">Selecciona…</option>
            <option>Boda</option>
            <option>Quince Años</option>
            <option>Evento Empresarial</option>
            <option>Revelación de Género</option>
            <option>Otro</option>
          </select>
        </div>
        <div>
          <label htmlFor="contact-event-date" className={labelClass}>
            Fecha estimada *
          </label>
          <input
            id="contact-event-date"
            name="event_date"
            type="date"
            min={hoyBogota()}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-guest-count" className={labelClass}>
          Número de invitados *
        </label>
        <input
          id="contact-guest-count"
          name="guest_count" max={MAX_INVITADOS} step={1} inputMode="numeric"
          type="number"
          required
          placeholder="Ej: 150"
          min="1"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="contact-message" className={labelClass}>
          Cuéntanos sobre tu evento *
        </label>
        <textarea
          id="contact-message"
          name="message" maxLength={MAX_MENSAJE}
          required
          rows={5}
          placeholder="¿Qué tienes en mente? Cuéntanos tu evento ideal…"
          className={`${inputClass} resize-none`}
        />
      </div>

      {blockMessage && (
        <p className="text-dorado text-sm text-center" role="alert">
          {blockMessage}
        </p>
      )}

      {state?.error && !blockMessage && (
        <p className="text-rojo text-sm" role="alert">
          {state.error}
        </p>
      )}

      <PrivacyCheckbox checked={aceptaPolitica} onChange={setAceptaPolitica} />

      <SubmitButton
        label="Cuéntanos tu evento"
        pendingLabel="Enviando…"
        disabled={isBlocked || !aceptaPolitica}
        className="w-full bg-rojo text-blanco py-3 font-serif tracking-wider text-sm hover:bg-rojo-pro disabled:opacity-50 disabled:cursor-not-allowed"
      />

      <p className="text-[0.65rem] text-gris-claro text-center leading-relaxed">
        Protegido por reCAPTCHA —{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gris">
          Política de privacidad
        </a>{" "}
        y{" "}
        <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-gris">
          Términos de servicio
        </a>{" "}
        de Google.
      </p>
    </form>
  );
}
