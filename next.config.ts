import type { NextConfig } from "next";

// Host del proyecto Supabase, leído de NEXT_PUBLIC_SUPABASE_URL (.env.local / Vercel).
const SUPABASE_HOST = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://missing-supabase-url.supabase.co",
).hostname;

// Hosting de contenido de Jardín (fotos, videos, PDF).
const CONTENT_HOST = "contenido.jardindelencanto.com";

// TEMPORAL: las imágenes/videos de respaldo del sitio siguen alojados en el
// hosting de Hacienda hasta que Jardín suba su propio material. Quitar este
// host (aquí y en remotePatterns) cuando ya no quede ninguna URL que lo use:
//   grep -rn "contenido.hacienda-encanto.com" src
const LEGACY_CONTENT_HOST = "contenido.hacienda-encanto.com";

// Content-Security-Policy para producción.
// next/font/google self-hostea las fuentes en build time — no necesita fonts.googleapis.com en runtime.
// 'unsafe-inline' y 'unsafe-eval' son necesarios para Next.js App Router en producción.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google.com https://www.gstatic.com https://static.cloudflareinsights.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://${SUPABASE_HOST} https://${CONTENT_HOST} https://${LEGACY_CONTENT_HOST}`,
  "font-src 'self' data:",
  `connect-src 'self' https://${SUPABASE_HOST} wss://${SUPABASE_HOST} https://www.google.com https://www.googleapis.com https://${CONTENT_HOST}`,
  "frame-src https://www.google.com https://maps.google.com",
  `media-src 'self' blob: https://${SUPABASE_HOST} https://${CONTENT_HOST} https://${LEGACY_CONTENT_HOST}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  // Previene clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Previene MIME type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Controla información del referer en requests cross-origin
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desactiva funcionalidades del navegador no utilizadas
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Política de seguridad de contenido
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig: NextConfig = {
  // Los PDF (contratos, cotizaciones) leen el logo desde public/ con fs en
  // Server Actions; se incluye explícitamente en las funciones de Vercel.
  outputFileTracingIncludes: {
    "/**": ["./public/logo-jardin-pdf.png"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.jardindelencanto.com",
      },
      {
        protocol: "https",
        hostname: SUPABASE_HOST,
      },
      {
        protocol: "https",
        hostname: CONTENT_HOST,
      },
      {
        protocol: "https",
        hostname: LEGACY_CONTENT_HOST,
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
