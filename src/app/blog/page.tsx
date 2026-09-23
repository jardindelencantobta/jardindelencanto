import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/home/NavBar";
import { Footer } from "@/components/home/Footer";
import { WhatsAppButton } from "@/components/home/WhatsAppButton";

export const metadata: Metadata = {
  title: "Blog — Jardín El Encanto",
  description: "Consejos, tendencias e inspiración para bodas, quinceañeros y eventos especiales.",
};

type Post = {
  id: string;
  titulo: string;
  slug: string;
  resumen: string | null;
  foto_url: string | null;
  autor: string | null;
  published_at: string | null;
};

const FALLBACK_POSTS: Post[] = [
  {
    id: "fb0",
    titulo: "De la propuesta a la boda: la guía que toda novia colombiana necesita",
    slug: "de-la-propuesta-a-la-boda-guia-novia-colombiana",
    resumen: "Desde el momento en que dices 'sí' hasta el día que caminas al altar, cada decisión cuenta. Esta guía te lleva paso a paso.",
    foto_url: "https://contenido.hacienda-encanto.com/galeria/blog/I20A1333.jpg",
    autor: "Jardín El Encanto",
    published_at: "2026-09-21T00:00:00Z",
  },
  {
    id: "fb1",
    titulo: "Por qué elegir una hacienda para tu evento empresarial",
    slug: "por-que-elegir-una-hacienda-para-tu-evento-empresarial",
    resumen: "Un evento empresarial en una hacienda no es solo un cambio de escenario — es una decisión estratégica que transforma resultados.",
    foto_url: "https://contenido.hacienda-encanto.com/galeria/blog/Blog1.png",
    autor: "Jardín El Encanto",
    published_at: "2026-09-02T00:00:00Z",
  },
  {
    id: "fb2",
    titulo: "Mis XV 2026: Las tendencias que están arrasando",
    slug: "mis-xv-2026-tendencias-que-estan-arrasando",
    resumen: "Descubre las 5 tendencias que están definiendo las quinceañeras este año y encuentra la que habla de ti.",
    foto_url: "https://contenido.hacienda-encanto.com/galeria/quince/9.png",
    autor: "Jardín El Encanto",
    published_at: "2026-08-18T00:00:00Z",
  },
  {
    id: "fb3",
    titulo: "Cómo elegir el lugar perfecto para tu boda",
    slug: "como-elegir-el-lugar-perfecto-para-tu-boda",
    resumen: "El lugar lo cambia todo. Descubre los 5 factores clave para encontrar el espacio que haga tu boda exactamente como la soñaste.",
    foto_url: "https://contenido.hacienda-encanto.com/galeria/boda/1.jpeg",
    autor: "Jardín El Encanto",
    published_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "fb4",
    titulo: "Eventos empresariales en la naturaleza: una experiencia diferente",
    slug: "eventos-empresariales-en-la-naturaleza",
    resumen: "Por qué llevar tus reuniones y eventos corporativos a un entorno natural puede transformar los resultados de tu equipo.",
    foto_url: "https://contenido.hacienda-encanto.com/galeria/boda/3.jpeg",
    autor: "Equipo El Encanto",
    published_at: "2026-06-15T00:00:00Z",
  },
];

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
}

export default async function BlogPage() {
  let posts: Post[] = [];

  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = supabase;
    const { data } = await db
      .from("blog_posts")
      .select("id,titulo,slug,resumen,foto_url,autor,published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false });
    posts = data ?? [];
  } catch {
    // Supabase no disponible — se usa fallback
  }

  const effectivePosts = posts.length > 0 ? posts : FALLBACK_POSTS;

  return (
    <>
      <NavBar />
      <main className="pt-[72px]">
        {/* Hero de sección */}
        <div className="bg-negro text-blanco py-20 text-center">
          <p className="text-[11px] tracking-[4px] uppercase text-dorado font-medium mb-3">
            Blog · El Encanto
          </p>
          <h1 className="font-serif text-[2.8rem] md:text-[3.5rem] font-light tracking-[-0.03em] leading-[1.1]">
            Reflexiones &amp;{" "}
            <em className="text-dorado not-italic">Consejos</em>
          </h1>
          <div className="w-[50px] h-px bg-dorado mx-auto mt-6" />
          <p className="text-blanco/55 mt-4 text-[0.95rem] font-light max-w-[480px] mx-auto px-6">
            Inspiración, tendencias y consejos para hacer de tu evento un momento inolvidable.
          </p>
        </div>

        {/* Grid de artículos */}
        <div className="bg-crema py-16 px-6">
          <div className="max-w-[1100px] mx-auto">
            {effectivePosts.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen size={48} className="text-dorado/30 mx-auto mb-4" />
                <p className="text-gris text-[0.9rem]">No hay artículos publicados todavía.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {effectivePosts.map((post) => (
                  <article
                    key={post.id}
                    className="bg-blanco rounded-2xl overflow-hidden border border-negro/[0.06] flex flex-col group hover:shadow-md transition-shadow duration-300"
                  >
                    {/* Imagen */}
                    <div className="aspect-[4/3] overflow-hidden bg-dorado/5">
                      {post.foto_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.foto_url}
                          alt={post.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen size={36} className="text-dorado/20" />
                        </div>
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="p-5 flex flex-col flex-1">
                      {post.published_at && (
                        <p className="text-[0.7rem] text-negro/35 uppercase tracking-wide mb-2">
                          {formatDate(post.published_at)}
                        </p>
                      )}
                      <h2 className="font-serif text-[1.05rem] text-negro font-normal leading-snug mb-2 line-clamp-2">
                        {post.titulo}
                      </h2>
                      {post.resumen && (
                        <p className="text-[0.82rem] text-negro/55 leading-relaxed line-clamp-3 mb-4">
                          {post.resumen}
                        </p>
                      )}
                      <div className="mt-auto">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-dorado hover:text-dorado/70 transition-colors"
                        >
                          Leer más <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
