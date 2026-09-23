import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, CalendarDays, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/home/NavBar";
import { Footer } from "@/components/home/Footer";
import { WhatsAppButton } from "@/components/home/WhatsAppButton";

type Post = {
  id: string;
  titulo: string;
  slug: string;
  resumen: string | null;
  contenido: string | null;
  foto_url: string | null;
  autor: string | null;
  published_at: string | null;
};

type PostCard = Pick<Post, "id" | "titulo" | "slug" | "foto_url" | "published_at">;

const FALLBACK_POSTS: Post[] = [
  {
    id: "fb0",
    titulo: "De la propuesta a la boda: la guía que toda novia colombiana necesita",
    slug: "de-la-propuesta-a-la-boda-guia-novia-colombiana",
    resumen: "Desde el momento en que dices 'sí' hasta el día que caminas al altar, cada decisión cuenta. Esta guía te lleva paso a paso.",
    contenido: "Dijiste que sí. Y ahora la pregunta es: ¿por dónde empiezo?\n\nOrganizar una boda en Colombia puede sentirse abrumador al principio. Hay tantas decisiones que tomar, tantas personas que opinan y tantos detalles que considerar, que muchas parejas empiezan el proceso con más estrés que emoción. Pero no tiene que ser así.\n\nEsta guía está pensada para que vayas paso a paso, con calma, sin perderte ningún detalle importante.\n\n💍 Paso 1 — Disfruta el momento antes de planear\n\nAntes de abrir Pinterest o llamar proveedores, tómense al menos dos semanas para celebrar el compromiso. Cuéntenle a su familia, salgan a cenar, vivan el momento. La planeación puede esperar. La emoción del primer 'sí' no regresa.\n\n📅 Paso 2 — Define la fecha y el presupuesto\n\nEstos dos factores deciden casi todo lo demás. En Colombia, los meses más populares para bodas son diciembre, marzo y julio — y los lugares se reservan con 8 a 12 meses de anticipación. Si tienes una fecha soñada, actúa rápido.\n\nEl presupuesto debe ser real y acordado entre los dos. Define quién aporta qué antes de firmar cualquier contrato. Las sorpresas financieras son el mayor generador de estrés en la planeación.\n\n🏡 Paso 3 — Elige el lugar primero, todo lo demás viene después\n\nEl lugar define la capacidad, el ambiente, el estilo y muchos de los proveedores que necesitas. No tiene sentido elegir flores o vestido antes de saber si tu boda será íntima o de 200 personas, en salón o al aire libre, en la ciudad o en una hacienda campestre.\n\nTe recomendamos visitar al menos tres opciones, preguntando qué incluye cada paquete. En Jardín El Encanto, por ejemplo, incluimos catering, coordinación, sonido, luces, pista de baile y más — todo en un solo lugar. Así reduces proveedores, reduces estrés y tienes todo bajo control desde el primer día.\n\n👗 Paso 4 — El vestido necesita más tiempo del que crees\n\nUn vestido de novia tarda entre 4 y 6 meses en fabricarse o conseguirse, más los tiempos de ajuste. Si tienes una fecha en mente, empieza a buscar opciones al menos 8 meses antes. No lo dejes para el final.\n\n🌸 Paso 5 — Arma tu equipo de proveedores\n\nFotógrafo, videógrafo, DJ, florista, pastelería. Cada uno tiene su propio calendario de disponibilidad y los mejores se reservan con mucha anticipación. Pide referencias, revisa trabajos anteriores y firma contratos con todo por escrito.\n\nEn Jardín El Encanto trabajamos con proveedores de confianza que conocen nuestros espacios — eso hace que la coordinación el día del evento sea mucho más fluida. Menos llamadas, menos imprevistos, más tranquilidad para ti.\n\n💌 Paso 6 — Las invitaciones marcan el tono\n\nLas invitaciones son la primera impresión que tus invitados tienen de tu boda. Deben salir con al menos 6 semanas de anticipación — 8 si tienes invitados de otras ciudades. Define primero tu lista de invitados y luego el diseño.\n\n✅ Paso 7 — El día anterior, suelta el control\n\nLlega al día de tu boda habiendo descansado. Confía en tu equipo. Si algo pequeño sale diferente a lo planeado, nadie más lo va a notar. Lo que tus invitados van a recordar es cómo te viste, cómo bailaste y cómo disfrutaste.\n\nEse día es tuyo. En Jardín El Encanto nos encargamos del resto.\n\nEn nuestra hacienda sabemos que detrás de cada boda hay meses de decisiones, conversaciones y sueños. Por eso acompañamos a cada pareja desde el primer contacto hasta el último baile — para que el único trabajo de ese día sea disfrutarlo.\n\n¿Lista para empezar? Cuéntanos tu fecha y tu visión, y juntos hacemos que sea exactamente lo que soñaste.",
    foto_url: "https://contenido.hacienda-encanto.com/galeria/blog/I20A1333.jpg",
    autor: "Jardín El Encanto",
    published_at: "2026-09-21T00:00:00Z",
  },
  {
    id: "fb1",
    titulo: "Por qué elegir una hacienda para tu evento empresarial",
    slug: "por-que-elegir-una-hacienda-para-tu-evento-empresarial",
    resumen: "Un evento empresarial en una hacienda no es solo un cambio de escenario — es una decisión estratégica que transforma resultados.",
    contenido: "Las reuniones en salas de juntas tienen su lugar. Pero cuando una empresa necesita de verdad conectar a su equipo, cerrar un ciclo, celebrar un logro o abrir una nueva etapa, el entorno lo cambia todo. Cada vez más empresas en Colombia están eligiendo haciendas para sus eventos corporativos. Y no es moda — es estrategia.\n\n🌿 1. El entorno natural desbloquea la creatividad\n\nHay algo que ocurre cuando las personas salen de su ambiente habitual y se rodean de naturaleza. Las conversaciones fluyen diferente. Las ideas llegan con menos resistencia. Los equipos se relajan y, paradójicamente, son más productivos. Un salón de hotel tiene sus ventajas, pero no puede competir con jardines abiertos, aire fresco y la sensación de espacio que ofrece una hacienda campestre.\n\n🤝 2. El team building sucede de forma natural\n\nNo necesitas forzar dinámicas artificiales cuando el espacio mismo invita a la interacción. Una hacienda con zonas verdes, áreas comunes y espacios para compartir crea las condiciones perfectas para que el equipo se conecte de verdad — no porque lo diga el cronograma, sino porque el ambiente lo propicia.\n\n🎯 3. Todo en un mismo lugar\n\nReunión estratégica en la mañana, almuerzo de integración al mediodía, actividad de equipo en la tarde. En una hacienda completa no tienes que trasladar a nadie, coordinar múltiples proveedores ni perder tiempo en logística innecesaria. El espacio lo contiene todo — y eso se traduce en menos estrés y más enfoque en lo que realmente importa.\n\n📸 4. La imagen que proyectas importa\n\nLlevar a tu equipo o a tus clientes a una hacienda dice algo sobre tu empresa. Dice que valoras la experiencia, que cuidas los detalles, que entiendes que los grandes momentos merecen grandes escenarios. Es una inversión en percepción — y en el mundo empresarial, la percepción construye confianza.\n\n🍽️ 5. La gastronomía y el servicio marcan la diferencia\n\nUn evento empresarial memorable no termina con la última presentación — termina con la última conversación alrededor de una buena mesa. Una hacienda con servicio de catering propio, atención personalizada y espacios para el disfrute convierte una jornada laboral en una experiencia que el equipo recordará.\n\n¿Cuándo tiene sentido elegir una hacienda?\n\nRetiros estratégicos y planeación anual\nCelebraciones de fin de año y reconocimientos\nLanzamientos de productos o nuevas etapas\nTeam building y jornadas de integración\nReuniones con clientes que quieres impresionar\n\nEn Jardín El Encanto hemos acompañado a empresas de todos los tamaños a vivir ese tipo de momentos. Sabemos que cada empresa es diferente — y por eso cada evento también lo es.\n\n¿Tienes un evento en mente? Cuéntanos qué necesitas y te mostramos cómo hacerlo realidad.",
    foto_url: "https://contenido.hacienda-encanto.com/galeria/blog/Blog1.png",
    autor: "Jardín El Encanto",
    published_at: "2026-09-02T00:00:00Z",
  },
  {
    id: "fb2",
    titulo: "Mis XV 2026: Las tendencias que están arrasando",
    slug: "mis-xv-2026-tendencias-que-estan-arrasando",
    resumen: "Descubre las 5 tendencias que están definiendo las quinceañeras este año y encuentra la que habla de ti.",
    contenido: `Los quince años en 2026 rompieron las reglas. Ya no hay un molde, una paleta obligatoria ni una temática estándar. Este año cada quinceañera es libre de contar su historia, de mostrar quién es y hacia dónde va. La pregunta ya no es ¿cómo se hace una quinceañera? sino ¿cómo quiero que me recuerden ese día?

Aquí te presentamos las 5 tendencias que están dominando las celebraciones este año. Léelas con calma, imagínate en cada una y deja que algo te hable.

✨ Neon Glow — La fiesta que se siente desde afuera

Luces de neón con tu nombre, globos fluorescentes que brillan bajo luz UV y una energía que contagia a cada invitado desde que cruza la puerta. Esta tendencia llegó en 2025 y en 2026 está más fuerte que nunca.

La paleta es atrevida: fucsia eléctrico, verde neón, azul UV y violeta sobre fondo negro. El dress code ideal es blanco puro — para que cada invitado brille bajo la luz negra igual que tú.

Perfecta para: la quinceañera que quiere que su fiesta se vea en cada historia de Instagram.

🌿 Jardín Encantado — Naturaleza, flores y magia

Arcos de vegetación, flores frescas en cada rincón, centros de mesa con plantas tropicales y una atmósfera que parece sacada de un cuento europeo. Esta tendencia apuesta por lo natural, lo orgánico y lo auténtico.

Los colores son suaves pero poderosos: verde esmeralda, blanco, rosa pálido y detalles en dorado. El resultado es una celebración que se siente íntima y espectacular al mismo tiempo.

Perfecta para: la quinceañera romántica que sueña con rodearse de belleza natural. Y si el lugar ya tiene jardines y naturaleza... mejor todavía.

⭐ Celestial — El universo como escenario

Estrellas proyectadas en el techo, luna llena como elemento central, telas que caen como constelaciones y una paleta de azul profundo, plata y negro que transforma cualquier salón en un universo propio.

Esta temática tiene algo especial: genera fotografías espectaculares. Cada rincón se convierte en un set de fotos que nadie querrá dejar de compartir.

Perfecta para: la quinceañera soñadora, la que mira las estrellas y siente que todo es posible.

🎬 Glamour Hollywood — La noche más cinematográfica

Alfombra roja desde la entrada, luces doradas, flores en champagne y borgoña, y ese toque que hace sentir a la quinceañera exactamente como lo que es: la protagonista. Esta tendencia no busca ser sutil — busca impactar.

Los detalles marcan la diferencia: letreros luminosos con tu nombre, espejos de cuerpo entero en la entrada, fotografías en blanco y negro mezcladas con elementos dorados.

Perfecta para: la quinceañera que siempre supo que merecía el centro del escenario.

🕰️ Vintage Chic — La elegancia que no pasa de moda

Sillas Tiffany, vajilla retro, flores en tonos neutros y una atmósfera que mezcla la nostalgia con el refinamiento moderno. Esta tendencia apuesta por lo atemporal — dentro de 20 años las fotos seguirán viéndose igual de hermosas.

La paleta es suave: champagne, beige, blush, blanco roto y detalles en cobre o dorado envejecido. Nada grita, todo susurra elegancia.

Perfecta para: la quinceañera que prefiere la sofisticación clásica sobre las modas del momento.

¿Ya sabes cuál eres tú?

No tienes que elegir una sola — lo más hermoso de 2026 es que se pueden mezclar elementos de varias tendencias para crear algo completamente tuyo. Una fiesta Neon con detalles de Jardín Encantado. Un Vintage con toques Celestiales. No hay reglas.

En Jardín El Encanto hemos celebrado quinceañeras de todos los estilos, y sabemos que el secreto no está en seguir una tendencia al pie de la letra — está en hacer que cada detalle cuente tu historia.

¿Lista para empezar a soñar? Cuéntanos tu visión y juntos hacemos que ese día sea exactamente como siempre lo imaginaste.`,
    foto_url: "https://contenido.hacienda-encanto.com/galeria/quince/9.png",
    autor: "Jardín El Encanto",
    published_at: "2026-08-18T00:00:00Z",
  },
  {
    id: "fb3",
    titulo: "Cómo elegir el lugar perfecto para tu boda",
    slug: "como-elegir-el-lugar-perfecto-para-tu-boda",
    resumen: "El lugar lo cambia todo. Descubre los 5 factores clave para encontrar el espacio que haga tu boda exactamente como la soñaste.",
    contenido: "Elegir el lugar de tu boda es probablemente la decisión más importante de toda la planeación. Todo lo demás — la decoración, la música, el menú — depende de ese espacio. Y sin embargo, muchas parejas lo eligen deprisa, sin hacerse las preguntas correctas. Hoy te compartimos los 5 factores que realmente importan.\n\n🌿 1. La experiencia que quieres vivir\n\nAntes de buscar lugares, define qué tipo de ambiente soñaste para ese día. ¿Una boda íntima rodeada de naturaleza? ¿Una celebración elegante en un salón? ¿Una ceremonia al aire libre con jardines y árboles? El ambiente lo determina el lugar — no la decoración. Un salón frío nunca se sentirá como una hacienda campestre, por mucho que decores. Empieza por ahí.\n\n👥 2. La capacidad real del espacio\n\nUn lugar que se ve enorme en fotos puede sentirse apretado con 120 personas bailando. Pregunta siempre la capacidad cómoda del espacio — no la máxima — y calcula con holgura. El espacio también debe fluir: zona de ceremonia, zona de cóctel, salón de recepción, pista de baile, zona de fotografía. Si todo está en un mismo cuarto sin distinción, la experiencia de tus invitados lo notará.\n\n☁️ 3. El clima y el plan B\n\nEn Colombia el clima puede sorprenderte en cualquier momento. Si planeas una ceremonia al aire libre, asegúrate de que el lugar tenga una alternativa cubierta de igual categoría — no una carpa improvisada, sino un espacio que esté a la altura de tu celebración. La temporada seca entre diciembre y marzo es la más buscada, pero también la más costosa. Evalúa bien las fechas según tu presupuesto y el clima de la región.\n\n🛠️ 4. Los servicios incluidos\n\nAlgunos lugares solo te prestan el espacio. Otros incluyen mobiliario, sonido, coordinación, catering y más. La diferencia en precio puede parecer grande al principio, pero cuando sumas todo lo que tendrías que contratar por separado, un lugar todo incluido suele ser la opción más inteligente — y la menos estresante. Pregunta exactamente qué incluye el paquete antes de emocionarte con el precio base.\n\n📸 5. Cómo se ve en fotos\n\nTus fotos de boda te van a acompañar toda la vida. El lugar importa más de lo que crees cuando las ves años después. Piensa en la luz natural, los fondos, los jardines, la arquitectura. Un lugar fotogénico no necesita ser extravagante — necesita tener carácter, luz y espacios con personalidad.\n\n¿Y si el lugar ya tiene todo eso?\n\nEntonces la mitad del trabajo está hecho. En Jardín El Encanto lo sabemos bien: cuando el espacio es el correcto, todo lo demás fluye. Jardines, salones con luz natural, capilla, equipo propio y años de experiencia haciendo que cada boda sea diferente — porque cada pareja lo es.\n\n¿Lista para conocernos? Cuéntanos cómo imaginas tu día y te mostramos por qué El Encanto puede ser exactamente lo que estabas buscando.",
    foto_url: "https://contenido.hacienda-encanto.com/galeria/boda/1.jpeg",
    autor: "Jardín El Encanto",
    published_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "fb4",
    titulo: "Eventos empresariales en la naturaleza: una experiencia diferente",
    slug: "eventos-empresariales-en-la-naturaleza",
    resumen: "Por qué llevar tus reuniones y eventos corporativos a un entorno natural puede transformar los resultados de tu equipo.",
    contenido: "Cada vez más empresas descubren los beneficios de realizar sus eventos corporativos fuera de las oficinas y espacios urbanos tradicionales. La naturaleza ofrece un entorno que estimula la creatividad, reduce el estrés y fomenta la cohesión de equipo.\n\nLos estudios demuestran que el contacto con espacios verdes reduce los niveles de cortisol y mejora la concentración. Un equipo más tranquilo y enfocado produce mejores ideas y toma mejores decisiones. Esto hace que las retreats empresariales y conferencias en entornos naturales sean una inversión con retorno tangible.\n\nEn Jardín El Encanto contamos con espacios versátiles que se adaptan a diferentes formatos: desde conferencias para 50 personas hasta teambuilding para equipos de trabajo, pasando por cenas de gala corporativas o lanzamientos de productos.\n\nNuestro equipo de coordinación puede ayudarte a diseñar una experiencia a medida que combine las actividades de negocio con momentos de esparcimiento y conexión con la naturaleza. El resultado: un equipo más motivado y relaciones laborales más sólidas.",
    foto_url: "https://contenido.hacienda-encanto.com/galeria/boda/3.jpeg",
    autor: "Equipo El Encanto",
    published_at: "2026-06-15T00:00:00Z",
  },
];

async function getPost(slug: string): Promise<Post | null> {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = supabase;
    const { data } = await db
      .from("blog_posts")
      .select("id,titulo,slug,resumen,contenido,foto_url,autor,published_at")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (data) return data as Post;
  } catch {
    // Supabase no disponible
  }
  return FALLBACK_POSTS.find((p) => p.slug === slug) ?? null;
}

async function getOtherPosts(excludeSlug: string): Promise<PostCard[]> {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = supabase;
    const { data } = await db
      .from("blog_posts")
      .select("id,titulo,slug,foto_url,published_at")
      .eq("is_published", true)
      .neq("slug", excludeSlug)
      .order("published_at", { ascending: false })
      .limit(10);
    if (data && (data as PostCard[]).length > 0) return data as PostCard[];
  } catch {
    // Supabase no disponible
  }
  return FALLBACK_POSTS
    .filter((p) => p.slug !== excludeSlug)
    .map(({ id, titulo, slug, foto_url, published_at }) => ({ id, titulo, slug, foto_url, published_at }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Artículo no encontrado — Jardín El Encanto" };
  return {
    title: `${post.titulo} — Blog El Encanto`,
    description: post.resumen ?? undefined,
    openGraph: post.foto_url ? { images: [{ url: post.foto_url }] } : undefined,
  };
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
}

function formatDateShort(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, otherPosts] = await Promise.all([
    getPost(slug),
    getOtherPosts(slug),
  ]);
  if (!post) notFound();

  const paragraphs = post.contenido
    ? post.contenido.split(/\n\n+/).filter(Boolean)
    : [];

  return (
    <>
      <NavBar />
      <main className="pt-[72px]">
        {/* Imagen hero del artículo */}
        {post.foto_url ? (
          <div className="w-full h-[50vh] overflow-hidden bg-negro">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.foto_url}
              alt={post.titulo}
              className="w-full h-full object-cover opacity-80"
            />
          </div>
        ) : (
          <div className="w-full h-[25vh] bg-negro flex items-center justify-center">
            <BookOpen size={56} className="text-dorado/30" />
          </div>
        )}

        {/* Contenido + Sidebar */}
        <div className="bg-crema py-14 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">

              {/* ── Artículo principal ── */}
              <div className="flex-1 min-w-0 max-w-[720px]">
                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-[0.75rem] text-negro/40 mb-5">
                  {post.published_at && (
                    <span className="flex items-center gap-1">
                      <CalendarDays size={13} />
                      {formatDate(post.published_at)}
                    </span>
                  )}
                  {post.autor && (
                    <span className="flex items-center gap-1">
                      <User size={13} />
                      {post.autor}
                    </span>
                  )}
                </div>

                {/* Título */}
                <h1 className="font-serif text-[2.2rem] md:text-[2.8rem] font-light text-negro tracking-[-0.03em] leading-[1.15] mb-6">
                  {post.titulo}
                </h1>

                {post.resumen && (
                  <>
                    <div className="w-[40px] h-px bg-dorado mb-6" />
                    <p className="text-[1rem] text-negro/65 font-light leading-[1.7] mb-6 italic">
                      {post.resumen}
                    </p>
                  </>
                )}

                {/* Contenido */}
                {paragraphs.length > 0 && (
                  <div className="mt-8 space-y-5">
                    {paragraphs.map((para, i) => (
                      <p
                        key={i}
                        className="text-[0.95rem] text-negro/75 leading-[1.8] font-light"
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                )}

                {/* CTA */}
                <div className="mt-14 pt-10 border-t border-dorado/20 text-center">
                  <p className="text-[0.88rem] text-negro/55 mb-4">
                    ¿Listo para vivir tu propio evento en El Encanto?
                  </p>
                  <Link
                    href="/#contacto"
                    className="inline-block px-8 py-3 bg-rojo text-blanco text-[0.8rem] font-medium tracking-[1.5px] uppercase rounded-lg border-2 border-rojo hover:bg-rojo/90 transition-all duration-300"
                  >
                    Cuéntanos tu evento
                  </Link>
                </div>
              </div>

              {/* ── Sidebar: más artículos ── */}
              {otherPosts.length > 0 && (
                <aside className="w-full lg:w-[270px] shrink-0 lg:sticky lg:top-[100px]">
                  <h3 className="text-[0.65rem] tracking-[3px] uppercase text-dorado font-medium mb-5">
                    Más artículos
                  </h3>
                  <div className="space-y-4">
                    {otherPosts.map((p) => (
                      <Link
                        key={p.id}
                        href={`/blog/${p.slug}`}
                        className="flex gap-3 group"
                      >
                        {/* Miniatura */}
                        <div className="w-16 h-14 rounded-lg overflow-hidden bg-dorado/10 shrink-0">
                          {p.foto_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.foto_url}
                              alt={p.titulo}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen size={14} className="text-dorado/30" />
                            </div>
                          )}
                        </div>
                        {/* Texto */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[0.82rem] text-negro font-medium leading-snug line-clamp-2 group-hover:text-dorado transition-colors">
                            {p.titulo}
                          </p>
                          {p.published_at && (
                            <p className="text-[0.68rem] text-negro/35 mt-1">
                              {formatDateShort(p.published_at)}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-6 pt-5 border-t border-dorado/15">
                    <Link
                      href="/blog"
                      className="text-[0.75rem] text-dorado hover:text-dorado/70 transition-colors"
                    >
                      Ver todos los artículos →
                    </Link>
                  </div>
                </aside>
              )}

            </div>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
