"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageTransitionLink } from "@/components/ui/PageTransitionLink";
import { usePageTransition } from "@/components/ui/PageTransitionProvider";

const links = [
  { href: "/bodas", label: "Nuestra Boda" },
  { href: "/quince-anos", label: "Mis XV" },
  { href: "/eventos-empresariales", label: "Eventos Empresariales" },
  { href: "/revelacion-de-genero", label: "Revelación de Género" },
];

export function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const startTransition = usePageTransition();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const miEventoHref = isLoggedIn ? "/portal" : "/login";

  const close = () => setIsOpen(false);

  const handleMiEvento = (e: React.MouseEvent) => {
    e.preventDefault();
    close();
    startTransition();
    router.push(miEventoHref);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-crema/95 backdrop-blur-md border-b border-black/[0.04]">
        {/* Barra principal */}
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 flex items-center justify-between h-[72px]">
          <PageTransitionLink href="/" onClick={close}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-jardin.png"
              alt="Jardín El Encanto"
              style={{ height: "42px", width: "auto" }}
            />
          </PageTransitionLink>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <PageTransitionLink href="/" className="text-rojo font-medium text-sm">
              Inicio
            </PageTransitionLink>
            {links.map((l) => (
              <PageTransitionLink
                key={l.href}
                href={l.href}
                className="text-gris text-sm hover:text-rojo transition-colors duration-300 tracking-[0.3px]"
              >
                {l.label}
              </PageTransitionLink>
            ))}
            <Link
              href={miEventoHref}
              onClick={handleMiEvento}
              className="text-dorado text-sm font-medium hover:text-dorado/75 transition-colors duration-300 tracking-[0.3px]"
            >
              Mi evento
            </Link>
            <Link
              href="#contacto"
              className="bg-rojo text-blanco text-[12px] tracking-[1px] uppercase px-5 py-2 rounded-md hover:bg-rojo-pro transition-colors duration-300"
            >
              Contáctanos
            </Link>
          </div>

          {/* Hamburger mobile */}
          <button
            type="button"
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((v) => !v)}
            className="md:hidden flex flex-col justify-center gap-[5px] w-11 h-11 -mr-2 focus:outline-none"
          >
            <span
              className={`block h-[2px] w-6 mx-auto bg-negro transition-transform duration-300 origin-center ${
                isOpen ? "rotate-45 translate-y-[7px]" : ""
              }`}
            />
            <span
              className={`block h-[2px] w-6 mx-auto bg-negro transition-opacity duration-300 ${
                isOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-[2px] w-6 mx-auto bg-negro transition-transform duration-300 origin-center ${
                isOpen ? "-rotate-45 -translate-y-[7px]" : ""
              }`}
            />
          </button>
        </div>

        {/* Panel mobile — animación height */}
        <div
          className={`md:hidden overflow-hidden transition-[max-height] duration-300 ease-in-out bg-crema border-t border-black/[0.04] ${
            isOpen ? "max-h-[400px]" : "max-h-0"
          }`}
        >
          <div className="px-6 py-2 flex flex-col">
            <PageTransitionLink
              href="/"
              onClick={close}
              className="text-rojo font-medium text-[0.95rem] py-3 border-b border-black/[0.05]"
            >
              Inicio
            </PageTransitionLink>
            {links.map((l) => (
              <PageTransitionLink
                key={l.href}
                href={l.href}
                onClick={close}
                className="text-negro text-[0.95rem] py-3 border-b border-black/[0.05] hover:text-rojo transition-colors duration-300"
              >
                {l.label}
              </PageTransitionLink>
            ))}
            <Link
              href={miEventoHref}
              onClick={handleMiEvento}
              className="text-dorado text-[0.95rem] py-3 border-b border-black/[0.05] font-medium"
            >
              Mi evento
            </Link>
            <Link
              href="#contacto"
              onClick={close}
              className="my-4 bg-rojo text-blanco text-[12px] tracking-[1px] uppercase px-5 py-3 rounded-md hover:bg-rojo-pro transition-colors duration-300 text-center"
            >
              Contáctanos
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
