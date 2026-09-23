export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-crema flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px] animate-[page-fade-in_0.45s_ease_both]">
        {/* Logo */}
        <div className="mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-principal-fondo-claro.svg"
            alt="Jardín El Encanto"
            style={{ width: "100%", height: "auto" }}
          />
          {/* Separador dorado */}
          <div className="mt-6 h-px bg-dorado/60" />
        </div>

        {children}
      </div>
    </main>
  );
}
