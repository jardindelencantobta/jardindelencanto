"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  CreditCard,
  MessageSquare,
  User,
  BookOpen,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  X,
  UserPlus,
  Image,
  Images,
  Video,
  Star,
  Package,
  Shield,
  Music2,
  Map,
  ScrollText,
  Inbox,
  Newspaper,
  Megaphone,
  Calculator,
  SlidersHorizontal,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { TransitionOverlay } from "@/components/ui/TransitionOverlay";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import type { PortalProfile } from "@/app/portal/layout";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  wedding_planner: "Wedding Planner",
  asesor_comercial: "Asesor Comercial",
  asesor_logistica: "Asesor Logística",
  staff: "Staff",
  client: "Cliente",
  editor: "Editor de Contenido",
  gerente: "Gerente",
};

type NavItem = { href: string; label: string; icon: React.ElementType };

function getNavItems(role: string): NavItem[] {
  if (role === "client") {
    return [
      { href: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/portal/evento", label: "Mi Evento", icon: CalendarDays },
      { href: "/portal/actividades", label: "Mi agenda", icon: BookOpen },
      { href: "/portal/orden-servicio", label: "Mi Orden", icon: ClipboardList },
      { href: "/portal/playlist", label: "Mi Música", icon: Music2 },
      { href: "/portal/invitados", label: "Invitados", icon: Map },
      { href: "/portal/documentos", label: "Documentos", icon: FileText },
      { href: "/portal/pagos", label: "Pagos", icon: CreditCard },
      { href: "/portal/mensajes", label: "Mensajes", icon: WhatsAppIcon },
      { href: "/portal/perfil", label: "Mi Perfil", icon: User },
    ];
  }
  if (role === "admin") {
    return [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/usuarios", label: "Usuarios", icon: Shield },
      { href: "/admin/clientes", label: "Clientes", icon: Users },
      { href: "/admin/leads", label: "Leads", icon: Inbox },
      { href: "/admin/contrato", label: "Contrato", icon: ScrollText },
      { href: "/admin/cotizaciones-config", label: "Config. Cotizaciones", icon: SlidersHorizontal },
      { href: "/editor/galeria", label: "Galería", icon: Image },
      { href: "/editor/videos", label: "Videos", icon: Video },
      { href: "/editor/imagenes-sitio", label: "Imágenes del sitio", icon: Images },
      { href: "/editor/testimonios", label: "Testimonios", icon: Star },
      { href: "/editor/paquetes", label: "Paquetes", icon: Package },
      { href: "/editor/staff", label: "Equipo", icon: Users },
      { href: "/editor/blog", label: "Blog", icon: Newspaper },
      { href: "/editor/promociones", label: "Promociones", icon: Megaphone },
      { href: "/editor/contenido", label: "Textos del sitio", icon: FileText },
    ];
  }

  if (role === "editor") {
    return [
      { href: "/editor/galeria", label: "Galería", icon: Image },
      { href: "/editor/videos", label: "Videos", icon: Video },
      { href: "/editor/imagenes-sitio", label: "Imágenes del sitio", icon: Images },
      { href: "/editor/testimonios", label: "Testimonios", icon: Star },
      { href: "/editor/paquetes", label: "Paquetes", icon: Package },
      { href: "/editor/staff", label: "Equipo", icon: Users },
      { href: "/editor/blog", label: "Blog", icon: Newspaper },
      { href: "/editor/promociones", label: "Promociones", icon: Megaphone },
      { href: "/editor/contenido", label: "Textos del sitio", icon: FileText },
    ];
  }

  if (role === "wedding_planner") {
    return [
      { href: "/portal/planner", label: "Órdenes de Servicio", icon: ClipboardList },
      { href: "/portal/planner/clientes", label: "Clientes", icon: Users },
      { href: "/portal/planner/nuevo-cliente", label: "Nuevo cliente", icon: UserPlus },
      { href: "/portal/planner/salon-mapas", label: "Mapas del salón", icon: Map },
      { href: "/portal/planner/cotizaciones", label: "Cotizaciones", icon: Calculator },
    ];
  }
  if (role === "staff") {
    return [
      { href: "/portal/staff", label: "Mis Eventos", icon: Music2 },
    ];
  }
  if (role === "asesor_comercial") {
    return [
      { href: "/portal/asesor-comercial", label: "Eventos y Contactos", icon: CalendarDays },
      { href: "/portal/planner/clientes", label: "Clientes", icon: Users },
      { href: "/portal/asesor-comercial/cotizaciones", label: "Cotizaciones", icon: Calculator },
    ];
  }
  if (role === "asesor_logistica") {
    return [
      { href: "/portal/asesor-logistica", label: "Eventos", icon: CalendarDays },
    ];
  }
  if (role === "gerente") {
    return [
      { href: "/portal/gerente", label: "Eventos", icon: CalendarDays },
      { href: "/admin/leads", label: "Leads", icon: Inbox },
    ];
  }
  const base: NavItem[] = [
    { href: "/portal/dashboard", label: "Panel", icon: LayoutDashboard },
    { href: "/portal/calendario", label: "Calendario", icon: CalendarDays },
    { href: "/portal/reservas", label: "Reservas", icon: BookOpen },
    { href: "/portal/ordenes", label: "Órdenes de Servicio", icon: ClipboardList },
    { href: "/portal/mensajes", label: "Mensajes", icon: MessageSquare },
    { href: "/portal/clientes", label: "Clientes", icon: Users },
  ];
  if (role === "admin") {
    base.push({ href: "/portal/configuracion", label: "Configuración", icon: Settings });
  }
  return base;
}

export function PortalSidebar({
  profile,
  isOpen,
  onClose,
}: {
  profile: PortalProfile;
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const navItems = getNavItems(profile.role);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await new Promise<void>((r) => setTimeout(r, 1000));
    try {
      await logout();
    } finally {
      // Este overlay de logout ya cubrió la transición — evita que el Home
      // vuelva a mostrar su propio loader inicial al llegar.
      sessionStorage.setItem("fromLogout", "true");
      window.location.href = "/";
    }
  };

  const isActive = (href: string) => pathname === href;

  const initials = (profile.full_name ?? profile.email)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <>
    <aside
      className={[
        "fixed left-0 top-0 h-full w-[248px] z-30 flex flex-col",
        "bg-[#0F0F0F] transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0",
      ].join(" ")}
    >
      {/* Botón cerrar — solo móvil */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:hidden text-blanco/40 hover:text-blanco transition-colors"
        aria-label="Cerrar menú"
      >
        <X size={20} />
      </button>

      {/* Logo */}
      <div className="px-6 pt-7 pb-5 border-b border-blanco/[0.06]">
        <Link href="/" className="block" onClick={onClose}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-jardin.png"
            alt="Jardín El Encanto"
            style={{ height: "36px", width: "auto", filter: "brightness(0) invert(1)" }}
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={[
                "flex items-center gap-3 px-5 py-[10px] mx-2 rounded-lg text-[0.82rem] font-medium transition-all duration-150",
                active
                  ? "bg-dorado/10 text-dorado"
                  : "text-blanco/50 hover:text-blanco hover:bg-blanco/[0.04]",
              ].join(" ")}
            >
              <item.icon
                size={16}
                className={active ? "text-dorado" : "text-blanco/40"}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Usuario + logout */}
      <div className="border-t border-blanco/[0.06] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-dorado/20 flex items-center justify-center shrink-0">
            <span className="text-dorado text-[0.7rem] font-semibold tracking-wide">
              {initials}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-blanco text-[0.78rem] font-medium truncate leading-tight">
              {profile.full_name ?? "Usuario"}
            </p>
            <p className="text-blanco/40 text-[0.68rem] truncate">
              {ROLE_LABEL[profile.role] ?? profile.role}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[0.78rem] text-blanco/40 hover:text-blanco/70 hover:bg-blanco/[0.04] transition-all duration-150 disabled:opacity-50"
        >
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </aside>

    <TransitionOverlay visible={loggingOut} />
    </>
  );
}
